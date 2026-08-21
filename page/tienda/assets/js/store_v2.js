/**
 * ANAYA OUTLET - Client Storefront Engine
 * Gestor de estado del carrito, filtros, catálogo dinámico y checkout.
 */

// ==================== STATE MANAGEMENT ====================
// Helper para formatear números como Euros (1.234,56)
function formatEuro(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0,00';
  let fixed = num.toFixed(2);
  let parts = fixed.split('.');
  let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return integerPart + ',' + parts[1];
}

let StoreState = {
  // Datos del servidor
  products: [],
  categories: [],
  brands: [],
  settings: {
    company_name: 'Anaya Outlet S.L.',
    CIF: 'B-87654321',
    currency: '€',
    tax_rate: 21
  },
  
  // Estado local
  cart: [],
  filters: {
    search: '',
    category: 'all',
    selectedBrands: [],
    priceMin: null,
    priceMax: null,
    sort: 'default'
  },
  theme: 'light',

  // Live-sync polling
  _polling: {
    intervalId: null,
    INTERVAL_ACTIVE: 30000,   // 30s cuando la pestaña está visible
    INTERVAL_HIDDEN: 120000,  // 2 min cuando la pestaña está en segundo plano
    lastProductHash: '',
    isRunning: false
  }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  loadCartFromSession();
  setupEventListeners();
  renderSkeletons();      // Mostrar esqueletos animados mientras descarga datos
  await fetchStoreData();
  startLiveSync();        // Arrancar auto-actualización
});

// ==================== SKELETON LOADERS ====================
function renderSkeletons() {
  const productsGrid = document.getElementById('products-grid');
  const categoriesList = document.getElementById('categories-list');
  const brandsList = document.getElementById('brands-list');

  // 1. Esqueletos de Productos (6 tarjetas)
  if (productsGrid) {
    let cardSkeletons = '';
    for (let i = 0; i < 6; i++) {
      cardSkeletons += `
        <div class="skeleton-card">
          <div class="skeleton-image skeleton"></div>
          <div class="skeleton-info">
            <div class="skeleton-text skeleton-title skeleton"></div>
            <div class="skeleton-text skeleton-subtitle skeleton"></div>
            <div class="skeleton-footer">
              <div class="skeleton-text skeleton-price skeleton"></div>
              <div class="skeleton-button skeleton"></div>
            </div>
          </div>
        </div>
      `;
    }
    productsGrid.innerHTML = cardSkeletons;
  }

  // 2. Esqueletos de Categorías (Píldoras)
  if (categoriesList) {
    const defaultPill = categoriesList.firstElementChild;
    categoriesList.innerHTML = '';
    if (defaultPill) categoriesList.appendChild(defaultPill);
    for (let i = 0; i < 4; i++) {
      const pill = document.createElement('div');
      pill.className = 'skeleton-pill skeleton';
      categoriesList.appendChild(pill);
    }
  }

  // 3. Esqueletos de Marcas
  if (brandsList) {
    brandsList.innerHTML = `
      <div class="skeleton-line skeleton" style="margin-bottom: 8px;"></div>
      <div class="skeleton-line skeleton" style="margin-bottom: 8px;"></div>
      <div class="skeleton-line skeleton" style="margin-bottom: 8px;"></div>
    `;
  }
}

// ==================== THEME SYSTEM ====================
function initTheme() {
  const savedTheme = localStorage.getItem('anaya_store_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  StoreState.theme = theme;
  localStorage.setItem('anaya_store_theme', theme);
  
  const htmlEl = document.documentElement;
  if (theme === 'dark') {
    htmlEl.classList.add('dark');
  } else {
    htmlEl.classList.remove('dark');
  }
}

function toggleTheme() {
  const nextTheme = StoreState.theme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
}

// ==================== API FETCHING ====================
async function fetchStoreData() {
  try {
    const response = await fetch('api/get_store_data.php');
    if (!response.ok) throw new Error('No se pudo establecer conexión con el servidor.');
    
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error al descargar datos.');
    
    // Almacenar en estado
    StoreState.products = data.products || [];
    StoreState.categories = data.categories || [];
    StoreState.brands = data.brands || [];
    if (data.settings) {
      StoreState.settings = { ...StoreState.settings, ...data.settings };
    }

    // Guardar hash inicial para comparación futura
    StoreState._polling.lastProductHash = buildProductHash(StoreState.products);
    
    // Configurar metadatos del IVA
    document.getElementById('cart-tax-rate').innerText = StoreState.settings.tax_rate;

    // Actualizar nombre de empresa si procede
    const footerCompany = document.querySelector('.brand-name span');
    if (footerCompany && StoreState.settings.company_name) {
      document.querySelector('.brand-name').innerHTML = `${StoreState.settings.company_name.split(' ')[0]} <span>Online</span>`;
    }

    // Renderizar componentes
    renderFilters();
    renderCatalog();
    recalculateCartTotals();
    
  } catch (error) {
    console.error('Error loading store data:', error);
    showToast(error.message || 'Error de conexión. Intente recargar.', 'error');
  }
}

// ==================== LIVE-SYNC ENGINE ====================

/**
 * Genera un hash string ligero a partir de los productos
 * (IDs + stock + precio) para detectar cambios sin comparar objeto completo.
 */
function buildProductHash(products) {
  return products
    .map(p => `${p.id}:${p.stock}:${p.sell_price}`)
    .sort()
    .join('|');
}

/**
 * Petición silenciosa en segundo plano â€” no muestra toasts de error,
 * solo aplica cambios si el servidor responde con datos nuevos.
 */
async function pollStoreData() {
  try {
    const response = await fetch('api/get_store_data.php?t=' + Date.now(), {
      cache: 'no-store'
    });
    if (!response.ok) return; // silencioso

    const data = await response.json();
    if (!data.success) return;

    const incoming = data.products || [];
    const newHash  = buildProductHash(incoming);

    // Nada cambió â†’ salir sin tocar el DOM
    if (newHash === StoreState._polling.lastProductHash) return;

    // â€”â€”â€” Detectar diferencias â€”â€”â€”
    const oldIds  = new Set(StoreState.products.map(p => String(p.id)));
    const newIds  = new Set(incoming.map(p => String(p.id)));

    const addedCount   = [...newIds].filter(id => !oldIds.has(id)).length;
    const removedCount = [...oldIds].filter(id => !newIds.has(id)).length;
    const stockChanged = incoming.some(p => {
      const old = StoreState.products.find(o => String(o.id) === String(p.id));
      return old && String(old.stock) !== String(p.stock);
    });

    // â€”â€”â€” Aplicar nuevos datos al estado â€”â€”â€”
    StoreState.products   = incoming;
    StoreState.categories = data.categories || StoreState.categories;
    StoreState.brands     = data.brands     || StoreState.brands;
    StoreState._polling.lastProductHash = newHash;

    // â€”â€”â€” Re-renderizar sin perder los filtros activos â€”â€”â€”
    renderFilters();
    renderCatalog();

    // â€”â€”â€” Notificar al usuario según el tipo de cambio â€”â€”â€”
    if (addedCount > 0) {
      showLiveSyncBanner(
        addedCount === 1
          ? '¡1 nuevo producto disponible!'
          : `¡${addedCount} nuevos productos disponibles!`
      );
    } else if (removedCount > 0) {
      // Solo log silencioso; no queremos alertar de productos quitados
      console.info(`[LiveSync] ${removedCount} producto(s) eliminado(s) del catálogo.`);
    } else if (stockChanged) {
      // Cambio de stock silencioso â€” el catálogo ya refleja el nuevo stock
      console.info('[LiveSync] Stock actualizado.');
    }

  } catch (e) {
    // Fallo silencioso â€” no interrumpir al usuario
    console.warn('[LiveSync] Fallo en polling:', e.message);
  }
}

/**
 * Muestra un banner flotante no intrusivo en la parte superior
 * avisando de nuevos productos. Se cierra automáticamente.
 */
function showLiveSyncBanner(message) {
  // Eliminar banner anterior si existe
  const existing = document.getElementById('live-sync-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'live-sync-banner';
  banner.className = 'live-sync-banner';
  banner.innerHTML = `
    <span class="live-sync-dot"></span>
    <span class="live-sync-msg">${message}</span>
    <button class="live-sync-close" onclick="this.parentElement.remove()" aria-label="Cerrar">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;
  document.body.appendChild(banner);

  // Auto-dismiss después de 6s
  setTimeout(() => {
    banner.classList.add('live-sync-banner--hiding');
    setTimeout(() => banner.remove(), 500);
  }, 6000);
}

/**
 * Arranca el motor de polling y lo adapta a la visibilidad de la pestaña.
 * Usa Page Visibility API para pausar/reducir frecuencia en segundo plano.
 */
function startLiveSync() {
  if (StoreState._polling.isRunning) return;
  StoreState._polling.isRunning = true;

  function scheduleNext() {
    const delay = document.hidden
      ? StoreState._polling.INTERVAL_HIDDEN
      : StoreState._polling.INTERVAL_ACTIVE;

    StoreState._polling.intervalId = setTimeout(async () => {
      await pollStoreData();
      scheduleNext(); // Re-programar para el siguiente ciclo
    }, delay);
  }

  // Ajustar intervalo cuando el usuario cambia de pestaña
  document.addEventListener('visibilitychange', () => {
    clearTimeout(StoreState._polling.intervalId);
    if (!document.hidden) {
      // Pestaña volvió a ser visible â†’ sincronizar inmediatamente
      pollStoreData().then(scheduleNext);
    } else {
      scheduleNext();
    }
  });

  scheduleNext();
  console.info('[LiveSync] Auto-actualización iniciada (', StoreState._polling.INTERVAL_ACTIVE / 1000, 's).');
}

// ==================== RENDER FILTERS ====================
function renderFilters() {
  // 1. Renderizar Categorías
  const categoriesList = document.getElementById('categories-list');
  // Limpiar exceptuando la primera opción (Todos)
  const defaultPill = categoriesList.firstElementChild;
  categoriesList.innerHTML = '';
  categoriesList.appendChild(defaultPill);
  
  // Actualizar contador del pastilla "Todos"
  document.getElementById('total-products-badge').innerText = StoreState.products.length;

  StoreState.categories.forEach(cat => {
    // Contar cuántos productos pertenecen a esta categoría
    const count = StoreState.products.filter(p => p.category === cat.name).length;
    
    const pill = document.createElement('button');
    pill.className = `filter-pill ${StoreState.filters.category === cat.name ? 'active' : ''}`;
    pill.setAttribute('data-category', cat.name);
    pill.innerHTML = `${cat.name} <span class="filter-count">${count}</span>`;
    
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
      pill.classList.add('active');
      StoreState.filters.category = cat.name;
      renderCatalog();
    });
    
    categoriesList.appendChild(pill);
  });

  // 2. Renderizar Marcas (Checkboxes)
  const brandsList = document.getElementById('brands-list');
  brandsList.innerHTML = '';
  
  if (StoreState.brands.length === 0) {
    brandsList.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-secondary);">No hay marcas registradas</p>';
  }

  StoreState.brands.forEach(brand => {
    // Contar productos de esta marca
    const count = StoreState.products.filter(p => p.brand === brand.name).length;
    if (count === 0) return; // Omitir marcas sin productos para no frustrar al cliente

    const label = document.createElement('label');
    label.className = 'checkbox-label';
    
    const isChecked = StoreState.filters.selectedBrands.includes(brand.name);
    
    label.innerHTML = `
      <input type="checkbox" value="${brand.name}" ${isChecked ? 'checked' : ''}>
      <span class="checkbox-custom"></span>
      ${brand.name}
      <span class="filter-count" style="margin-left: auto;">${count}</span>
    `;
    
    // Controlar cambio en el checkbox
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      if (input.checked) {
        StoreState.filters.selectedBrands.push(brand.name);
      } else {
        StoreState.filters.selectedBrands = StoreState.filters.selectedBrands.filter(b => b !== brand.name);
      }
      renderCatalog();
    });

    brandsList.appendChild(label);
  });
}

// ==================== RENDER CATALOG ====================
function renderCatalog() {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = '';

  // 1. Aplicar filtros en memoria
  let filtered = StoreState.products.filter(product => {
    // Filtro de búsqueda (SKU o Nombre)
    const matchesSearch = product.name.toLowerCase().includes(StoreState.filters.search.toLowerCase()) || 
                          product.sku.toLowerCase().includes(StoreState.filters.search.toLowerCase());
    
    // Filtro de categoría
    const matchesCategory = StoreState.filters.category === 'all' || product.category === StoreState.filters.category;
    
    // Filtro de marca
    const matchesBrand = StoreState.filters.selectedBrands.length === 0 || StoreState.filters.selectedBrands.includes(product.brand);
    
    // Rango de precio
    const price = parseFloat(product.sell_price);
    const matchesMinPrice = StoreState.filters.priceMin === null || price >= StoreState.filters.priceMin;
    const matchesMaxPrice = StoreState.filters.priceMax === null || price <= StoreState.filters.priceMax;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice;
  });

  // 2. Aplicar ordenamiento
  if (StoreState.filters.sort === 'price-asc') {
    filtered.sort((a, b) => parseFloat(a.sell_price) - parseFloat(b.sell_price));
  } else if (StoreState.filters.sort === 'price-desc') {
    filtered.sort((a, b) => parseFloat(b.sell_price) - parseFloat(a.sell_price));
  } else if (StoreState.filters.sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (StoreState.filters.sort === 'name-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  }

  // 3. Actualizar contadores
  const countEl = document.getElementById('displayed-products-count');
  const labelEl = document.getElementById('displayed-products-label');
  if (countEl) countEl.innerText = filtered.length;
  if (labelEl) labelEl.innerText = filtered.length === 1 ? 'producto' : 'productos';

  // 4. Renderizar tarjetas de producto
  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-products">
        <div class="no-products-visual">
          <div class="no-products-orb"></div>
          <div class="no-products-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
        </div>
        <div class="no-products-body">
          <span class="no-products-badge">Sin resultados</span>
          <h3 class="no-products-title">No se encontraron productos</h3>
          <p class="no-products-desc">Intente ajustar los términos de búsqueda, cambiar de categoría o ampliar el rango de precios para encontrar lo que busca.</p>
          <div class="no-products-tips">
            <div class="no-products-tip">
              <span class="tip-icon">💡</span>
              <span>Prueba con palabras más generales</span>
            </div>
            <div class="no-products-tip">
              <span class="tip-icon">📂</span>
              <span>Explora otras categorías</span>
            </div>
            <div class="no-products-tip">
              <span class="tip-icon">💰</span>
              <span>Ajusta el rango de precios</span>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Determinar badge de stock y estatus
    let badgeHtml = '';
    const stock = parseInt(product.stock);
    const price = formatEuro(product.sell_price);
    
    if (stock === 0) {
      badgeHtml = `<span class="badge badge-danger card-badge">Agotado</span>`;
    } else if (product.status === 'Bajo Stock' || stock <= 3) {
      badgeHtml = `<span class="badge badge-warning card-badge">¡Ãšltimas ${stock} uds!</span>`;
    }

    // Ruta de imagen de producto
    // Si la imagen es vacía o nula, usamos un gradiente CSS premium con SVG centrado
    const fallbackImageSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-package"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
    
    // Determinar URL de imagen. Si es relativa local en ERP, le damos el path correcto de la raíz
    let imgUrl = product.image_url ? product.image_url : '';
    if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      // Las imágenes se suben en la raíz del ERP, así que apuntan a '../' desde la carpeta tienda
      imgUrl = '../' + imgUrl;
    } else if (!imgUrl) {
      imgUrl = fallbackImageSVG;
    }

    const currencySymbol = StoreState.settings.currency;

    card.innerHTML = `
      <div class="card-image-wrapper">
        ${badgeHtml}
        <div class="card-image-skeleton skeleton"></div>
        <img src="${imgUrl}" alt="${product.name}" class="card-image loading" onload="this.classList.remove('loading'); const sk = this.parentNode.querySelector('.card-image-skeleton'); if (sk) sk.remove();" onerror="this.classList.remove('loading'); const sk = this.parentNode.querySelector('.card-image-skeleton'); if (sk) sk.remove(); this.src='${fallbackImageSVG}';">
      </div>
      <div class="card-info">
        <div class="card-meta">
          <span>Ref: ${product.sku}</span>
          <span>${product.brand}</span>
        </div>
        <h3 class="card-title" title="${product.name}">${product.name}</h3>
        <p class="card-desc" title="${product.description || 'Sin descripción disponible.'}">${product.description || 'Sin descripción adicional.'}</p>
        <div class="card-footer">
          <span class="card-price">${price} ${currencySymbol}</span>
          <button class="add-btn" data-id="${product.id}" ${stock === 0 ? 'disabled' : ''} aria-label="Añadir al carrito">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>
    `;

    // Event listener para abrir detalles del producto al hacer clic en la tarjeta
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-btn')) return;
      openProductModal(product, card);
    });

    // Event listener para añadir al carrito
    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product.id, card);
    });

    productsGrid.appendChild(card);
  });
}

// ==================== PRODUCT DETAILS MODAL ====================
function openProductModal(product, cardElement = null) {
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  const stock = parseInt(product.stock);
  const price = formatEuro(product.sell_price);
  const currencySymbol = StoreState.settings.currency;
  const fallbackSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;

  let imgUrl = product.image_url ? product.image_url : '';
  if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
    imgUrl = '../' + imgUrl;
  } else if (!imgUrl) {
    imgUrl = fallbackSVG;
  }

  // Llenar datos en el modal
  const imgEl = document.getElementById('modal-product-img');
  const imgSkeleton = document.getElementById('modal-product-img-skeleton');
  if (imgSkeleton) imgSkeleton.classList.remove('hidden');
  if (imgEl) {
    imgEl.classList.add('loading');
    imgEl.src = imgUrl;
    imgEl.onerror = () => { 
      if (imgSkeleton) imgSkeleton.classList.add('hidden');
      imgEl.classList.remove('loading');
      imgEl.src = fallbackSVG; 
    };
  }

  document.getElementById('modal-product-brand').textContent = product.brand || 'Marca General';
  document.getElementById('modal-product-title').textContent = product.name;
  document.getElementById('modal-product-sku').textContent = `Ref SKU: ${product.sku}`;
  document.getElementById('modal-product-price').textContent = `${price} ${currencySymbol}`;
  document.getElementById('modal-product-desc').textContent = product.description || 'Este producto cuenta con la garantía de calidad oficial de Anaya Outlet y acabados de primera categoría.';
  document.getElementById('modal-product-category').textContent = product.category || 'General';
  document.getElementById('modal-product-stock-count').textContent = `${stock} unidades disponibles`;

  const stockBadge = document.getElementById('modal-product-stock');
  if (stock === 0) {
    stockBadge.className = 'badge badge-danger';
    stockBadge.textContent = 'Agotado';
  } else if (stock <= 3) {
    stockBadge.className = 'badge badge-warning';
    stockBadge.textContent = `¡Ãšltimas ${stock} uds!`;
  } else {
    stockBadge.className = 'badge badge-brand';
    stockBadge.textContent = 'En Stock';
  }

  // Configurar selector de cantidad y botón añadir al carrito dentro del modal
  let currentQty = 1;
  const qtyVal = document.getElementById('modal-qty-val');
  const qtyMinus = document.getElementById('modal-qty-minus');
  const qtyPlus = document.getElementById('modal-qty-plus');

  if (qtyVal) qtyVal.textContent = '1';

  const updateQtyUI = () => {
    if (qtyVal) qtyVal.textContent = currentQty;
  };

  if (qtyMinus) {
    const newMinus = qtyMinus.cloneNode(true);
    qtyMinus.parentNode.replaceChild(newMinus, qtyMinus);
    newMinus.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        updateQtyUI();
      } else {
        showToast('La cantidad mínima a seleccionar es 1 unidad.', 'info');
      }
    });
  }

  if (qtyPlus) {
    const newPlus = qtyPlus.cloneNode(true);
    qtyPlus.parentNode.replaceChild(newPlus, qtyPlus);
    newPlus.addEventListener('click', () => {
      if (currentQty < stock) {
        currentQty++;
        updateQtyUI();
      } else {
        showToast(`Alcanzaste el límite de stock disponible (${stock} uds).`, 'warning');
      }
    });
  }

  const oldBtn = document.getElementById('modal-add-cart-btn');
  const newBtn = oldBtn.cloneNode(true);
  newBtn.disabled = stock === 0;
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  newBtn.addEventListener('click', () => {
    addToCart(product.id, cardElement, currentQty);
    closeProductModal();
  });

  modal.classList.add('active');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
}

// ==================== CART ACTIONS ====================
function addToCart(productId, cardElement = null, quantityToAdd = 1) {
  // Buscar producto real en el estado
  const product = StoreState.products.find(p => p.id == productId);
  if (!product) return;

  const stockLimit = parseInt(product.stock);
  if (stockLimit <= 0) {
    showToast('Este producto se encuentra agotado.', 'error');
    return;
  }

  // Buscar si ya está en el carrito
  const cartItem = StoreState.cart.find(item => item.productId == productId);
  if (cartItem) {
    if (cartItem.qty + quantityToAdd > stockLimit) {
      showToast(`No se pueden añadir más unidades. Stock disponible: ${stockLimit}`, 'warning');
      return;
    }
    cartItem.qty += quantityToAdd;
  } else {
    if (quantityToAdd > stockLimit) {
      showToast(`No se pueden añadir más unidades. Stock disponible: ${stockLimit}`, 'warning');
      return;
    }
    StoreState.cart.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.sell_price),
      image_url: product.image_url,
      qty: quantityToAdd,
      stock: stockLimit
    });
  }

  saveCartToSession();
  recalculateCartTotals();
  showToast(`"${product.name}" (${quantityToAdd} ud${quantityToAdd > 1 ? 's' : ''}) añadido al carrito.`, 'success');
  
  // Efecto de vuelo de imagen de producto encajando en el botón del carrito
  if (cardElement) {
    animateFlyToCart(cardElement);
  } else {
    // Fallback si no hay cardElement
    const cartBtn = document.getElementById('cart-trigger');
    if (cartBtn) {
      cartBtn.classList.remove('cart-snap-pop');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('cart-snap-pop');
      setTimeout(() => cartBtn.classList.remove('cart-snap-pop'), 600);
    }
  }
}

/**
 * Animación visual donde la imagen del producto vuela desde la tarjeta
 * y encaja elásticamente en el botón del carrito en el header.
 */
function animateFlyToCart(cardElement) {
  const cartBtn = document.getElementById('cart-trigger');
  if (!cartBtn) return;

  const imgEl = cardElement.querySelector('.card-image');
  if (!imgEl) return;

  const imgRect = imgEl.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  // Crear el clon volador de la imagen del producto
  const flyer = document.createElement('img');
  flyer.src = imgEl.src;
  flyer.className = 'flying-product-img';
  flyer.style.left = `${imgRect.left}px`;
  flyer.style.top = `${imgRect.top}px`;
  flyer.style.width = `${imgRect.width}px`;
  flyer.style.height = `${imgRect.height}px`;

  document.body.appendChild(flyer);

  // Forzar reflow inicial
  void flyer.offsetWidth;

  // Calcular la distancia relativa hasta el botón del carrito
  const targetX = (cartRect.left + cartRect.width / 2) - (imgRect.left + imgRect.width / 2);
  const targetY = (cartRect.top + cartRect.height / 2) - (imgRect.top + imgRect.height / 2);

  // Animar hacia el carrito
  flyer.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(0.12) rotate(20deg)`;
  flyer.style.opacity = '0.3';
  flyer.style.borderRadius = '50%';

  // Al llegar al botón del carrito (750ms)
  setTimeout(() => {
    flyer.remove();

    // Reacción elástica de absorción en el botón del carrito
    cartBtn.classList.remove('cart-snap-pop');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('cart-snap-pop');

    setTimeout(() => cartBtn.classList.remove('cart-snap-pop'), 600);
  }, 750);
}

function updateCartQty(productId, newQty) {
  const item = StoreState.cart.find(i => i.productId == productId);
  if (!item) return;

  if (newQty <= 0) {
    removeCartItem(productId);
    return;
  }

  if (newQty > item.stock) {
    showToast(`Stock insuficiente. Límite: ${item.stock} uds.`, 'warning');
    return;
  }

  item.qty = newQty;
  saveCartToSession();
  recalculateCartTotals();
}

function removeCartItem(productId) {
  StoreState.cart = StoreState.cart.filter(i => i.productId != productId);
  saveCartToSession();
  recalculateCartTotals();
  showToast('Artículo eliminado del carrito.', 'info');
}

function recalculateCartTotals() {
  const badge = document.getElementById('cart-badge');
  const totalItems = StoreState.cart.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = totalItems;

  const totalCurrency = StoreState.settings.currency;

  // Si el carrito está vacío
  if (StoreState.cart.length === 0) {
    renderEmptyCart();
    document.getElementById('checkout-trigger').disabled = true;
    return;
  }

  document.getElementById('checkout-trigger').disabled = false;

  // Calcular importes
  // El precio del carrito se considera el precio final de cara al público (IVA incluido)
  const total = StoreState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxRate = parseFloat(StoreState.settings.tax_rate);
  const subtotal = total / (1 + (taxRate / 100));
  const taxAmount = total - subtotal;

  // Actualizar DOM
  document.getElementById('cart-subtotal').innerText = `${formatEuro(subtotal)} ${totalCurrency}`;
  document.getElementById('cart-tax-amount').innerText = `${formatEuro(taxAmount)} ${totalCurrency}`;
  document.getElementById('cart-total').innerText = `${formatEuro(total)} ${totalCurrency}`;
  
  // Sincronizar en la cabecera (Capsule total) y en el formulario de pago
  document.getElementById('cart-preview-total').innerText = `${formatEuro(total)} ${totalCurrency}`;
  document.getElementById('checkout-total-val').innerText = `${formatEuro(total)} ${totalCurrency}`;

  renderCartItems();
}

function renderCartItems() {
  const cartItemsContainer = document.getElementById('cart-items');
  cartItemsContainer.innerHTML = '';

  const fallbackImageSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;

  StoreState.cart.forEach(item => {
    let imgUrl = item.image_url ? item.image_url : '';
    if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      imgUrl = '../' + imgUrl;
    } else if (!imgUrl) {
      imgUrl = fallbackImageSVG;
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';

    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = item.name;
    img.className = 'cart-item-img';
    img.onerror = function () { this.src = fallbackImageSVG; };

    const details = document.createElement('div');
    details.className = 'cart-item-details';

    const infoBlock = document.createElement('div');
    const title = document.createElement('h4');
    title.className = 'cart-item-title';
    title.textContent = item.name;

    const sku = document.createElement('span');
    sku.className = 'cart-item-sku';
    sku.textContent = `Ref: ${item.sku}`;

    infoBlock.appendChild(title);
    infoBlock.appendChild(sku);

    const footer = document.createElement('div');
    footer.className = 'cart-item-footer';

    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = `${formatEuro((item.price * item.qty))} ${StoreState.settings.currency}`;

    const qtyControls = document.createElement('div');
    qtyControls.className = 'qty-controls';

    const decBtn = document.createElement('button');
    decBtn.className = 'qty-btn dec-qty-btn';
    decBtn.type = 'button';
    decBtn.setAttribute('aria-label', 'Disminuir');
    decBtn.textContent = '-';

    const qtyVal = document.createElement('span');
    qtyVal.className = 'qty-val';
    qtyVal.textContent = item.qty;

    const incBtn = document.createElement('button');
    incBtn.className = 'qty-btn inc-qty-btn';
    incBtn.type = 'button';
    incBtn.setAttribute('aria-label', 'Aumentar');
    incBtn.textContent = '+';

    qtyControls.appendChild(decBtn);
    qtyControls.appendChild(qtyVal);
    qtyControls.appendChild(incBtn);

    footer.appendChild(price);
    footer.appendChild(qtyControls);

    details.appendChild(infoBlock);
    details.appendChild(footer);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-item-btn';
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', 'Eliminar artículo');
    deleteButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
    `;

    itemEl.appendChild(img);
    itemEl.appendChild(details);
    itemEl.appendChild(deleteButton);

    decBtn.addEventListener('click', () => {
      updateCartQty(item.productId, item.qty - 1);
    });

    incBtn.addEventListener('click', () => {
      updateCartQty(item.productId, item.qty + 1);
    });

    deleteButton.addEventListener('click', () => {
      removeCartItem(item.productId);
    });

    cartItemsContainer.appendChild(itemEl);
  });
}

function renderEmptyCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  cartItemsContainer.innerHTML = `
    <div class="cart-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
      <p>Tu carrito está vacío</p>
      <span style="font-size: 0.8rem; color: var(--text-secondary);">Agrega artículos de nuestro catálogo para iniciar tu pedido.</span>
    </div>
  `;
  
  const currency = StoreState.settings.currency;
  document.getElementById('cart-subtotal').innerText = `0,00 ${currency}`;
  document.getElementById('cart-tax-amount').innerText = `0,00 ${currency}`;
  document.getElementById('cart-total').innerText = `0,00 ${currency}`;
  
  // Sincronizar en la cabecera (Capsule total a cero)
  document.getElementById('cart-preview-total').innerText = `0,00 ${currency}`;
}

// ==================== LOCAL STORAGE PERSISTENCE ====================
function saveCartToSession() {
  sessionStorage.setItem('anaya_store_cart', JSON.stringify(StoreState.cart));
}

function loadCartFromSession() {
  const saved = sessionStorage.getItem('anaya_store_cart');
  if (saved) {
    try {
      StoreState.cart = JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing cart from session storage:', e);
      StoreState.cart = [];
    }
  }
}

// ==================== SORT DROPDOWN HELPER ====================
function setSortDropdownValue(value, label) {
  // Update trigger label
  const triggerLabel = document.getElementById('sort-trigger-label');
  if (triggerLabel) triggerLabel.textContent = label;

  // Update active state on options
  document.querySelectorAll('.sort-option').forEach(opt => {
    const isActive = opt.getAttribute('data-value') === value;
    opt.classList.toggle('active', isActive);
    opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

// ==================== EVENT LISTENERS SETUP ====================
function setupEventListeners() {
  // 1. Selector de Tema
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // 2. Filtros de búsqueda (Desktop & Mobile)
  const handleSearch = (e) => {
    StoreState.filters.search = e.target.value;
    // Sincronizar inputs
    document.getElementById('desktop-search').value = e.target.value;
    document.getElementById('mobile-search').value = e.target.value;
    renderCatalog();
  };

  document.getElementById('desktop-search').addEventListener('input', handleSearch);
  document.getElementById('mobile-search').addEventListener('input', handleSearch);

  // 3. Filtros de Precios
  const priceMinInput = document.getElementById('price-min');
  const priceMaxInput = document.getElementById('price-min'); // Wait! Typo in index.html ID check: one is price-min, other price-max. Corrected max ID lookup:
  const priceMaxInputCorrect = document.getElementById('price-max');

  const handlePriceFilter = () => {
    const minVal = priceMinInput.value === '' ? null : parseFloat(priceMinInput.value);
    const maxVal = priceMaxInputCorrect.value === '' ? null : parseFloat(priceMaxInputCorrect.value);
    StoreState.filters.priceMin = minVal;
    StoreState.filters.priceMax = maxVal;
    renderCatalog();
  };

  priceMinInput.addEventListener('input', handlePriceFilter);
  priceMaxInputCorrect.addEventListener('input', handlePriceFilter);

  // 4. Limpiar Filtros
  document.getElementById('clear-filters-btn').addEventListener('click', () => {
    StoreState.filters.search = '';
    StoreState.filters.category = 'all';
    StoreState.filters.selectedBrands = [];
    StoreState.filters.priceMin = null;
    StoreState.filters.priceMax = null;
    StoreState.filters.sort = 'default';
    
    // Resetear elementos UI
    document.getElementById('desktop-search').value = '';
    document.getElementById('mobile-search').value = '';
    priceMinInput.value = '';
    priceMaxInputCorrect.value = '';
    // Reset custom dropdown
    setSortDropdownValue('default', 'Recomendados');
    
    // Reset pastillas y checks
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-pill[data-category="all"]').classList.add('active');

    // Volver a renderizar
    renderFilters();
    renderCatalog();
    showToast('Filtros restaurados.', 'info');
  });

  // 5. Custom Sort Dropdown
  const sortDropdown = document.getElementById('sort-dropdown');
  const sortTrigger = document.getElementById('sort-dropdown-trigger');
  const sortMenu = document.getElementById('sort-dropdown-menu');

  // Toggle open/close
  sortTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    sortDropdown.classList.toggle('open');
    sortTrigger.setAttribute('aria-expanded', sortDropdown.classList.contains('open'));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!sortDropdown.contains(e.target)) {
      sortDropdown.classList.remove('open');
      sortTrigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle option selection
  sortMenu.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', () => {
      const value = option.getAttribute('data-value');
      const label = option.querySelector('.sort-option-text').textContent;
      setSortDropdownValue(value, label);
      StoreState.filters.sort = value;
      sortDropdown.classList.remove('open');
      sortTrigger.setAttribute('aria-expanded', 'false');
      renderCatalog();
    });
  });

  // 6. Controles de apertura del carrito (Sidebar)
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  
  const openCart = () => {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
  };

  const closeCart = () => {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.getElementById('cart-trigger').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // 7. Vistas de checkout inline
  const openCheckout = () => {
    closeCart(); // Cerrar drawer del carrito

    // Ocultar secciones de la tienda
    const hero = document.querySelector('.hero');
    const features = document.querySelector('.features-bar');
    const mobSearch = document.querySelector('.mobile-search');
    const storeContainer = document.querySelector('.store-container');
    
    if (hero) hero.classList.add('hidden');
    if (features) features.classList.add('hidden');
    if (mobSearch) mobSearch.classList.add('hidden');
    if (storeContainer) storeContainer.classList.add('hidden');
    
    // Mostrar vista de checkout
    const checkoutView = document.getElementById('checkout-view');
    if (checkoutView) {
      checkoutView.classList.remove('hidden');
    }
    
    updateCheckoutSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCheckout = () => {
    // Mostrar secciones de la tienda
    const hero = document.querySelector('.hero');
    const features = document.querySelector('.features-bar');
    const mobSearch = document.querySelector('.mobile-search');
    const storeContainer = document.querySelector('.store-container');
    
    if (hero) hero.classList.remove('hidden');
    if (features) features.classList.remove('hidden');
    if (mobSearch) mobSearch.classList.remove('hidden');
    if (storeContainer) storeContainer.classList.remove('hidden');
    
    // Ocultar vista de checkout
    const checkoutView = document.getElementById('checkout-view');
    if (checkoutView) {
      checkoutView.classList.add('hidden');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.closeCheckout = closeCheckout;

  document.getElementById('checkout-trigger').addEventListener('click', openCheckout);
  document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  document.getElementById('checkout-cancel').addEventListener('click', closeCheckout);

  // Lógica del dropdown moderno de selección de tienda física
  const customSelect = document.getElementById('custom-store-select-container');
  const customSelectTrigger = document.getElementById('custom-store-select-trigger');
  const customSelectOptions = document.getElementById('custom-store-select-options');
  const preferredStoreInput = document.getElementById('preferred-store-input');
  
  if (customSelect && customSelectTrigger) {
    // Abrir/cerrar dropdown
    customSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      customSelect.classList.toggle('open');
    });

    // Cerrar al hacer clic afuera
    document.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) {
        customSelect.classList.remove('open');
      }
    });

    // Manejar selección de opción
    customSelectOptions.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => {
        const val = option.getAttribute('data-value');
        const addr = option.getAttribute('data-address');
        const nameText = option.querySelector('.option-store-name').innerText;
        
        // Actualizar valores seleccionados
        preferredStoreInput.value = val;
        
        // Actualizar trigger UI
        customSelectTrigger.querySelector('.selected-store-name').innerText = nameText;
        customSelectTrigger.querySelector('.selected-store-address').innerText = addr;
        
        // Actualizar clase seleccionada en la lista
        customSelectOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Cerrar dropdown
        customSelect.classList.remove('open');
      });
    });
  }

  // Lógica del dropdown moderno de selección de método de entrega
  const deliverySelect = document.getElementById('custom-delivery-select-container');
  const deliverySelectTrigger = document.getElementById('custom-delivery-select-trigger');
  const deliverySelectOptions = document.getElementById('custom-delivery-select-options');
  const deliveryMethodInput = document.getElementById('delivery-method-input');
  const storeLabel = document.getElementById('store-select-label');
  const shippingNotice = document.getElementById('shipping-notice');

  if (deliverySelect && deliverySelectTrigger) {
    // Abrir/cerrar dropdown
    deliverySelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      deliverySelect.classList.toggle('open');
    });

    // Cerrar al hacer clic afuera
    document.addEventListener('click', (e) => {
      if (!deliverySelect.contains(e.target)) {
        deliverySelect.classList.remove('open');
      }
    });

    // Manejar selección de opción
    deliverySelectOptions.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => {
        const val = option.getAttribute('data-value');
        const sub = option.getAttribute('data-sub');
        const nameText = option.querySelector('.option-store-name').innerText;
        
        // Actualizar valores seleccionados
        if (deliveryMethodInput) deliveryMethodInput.value = val;
        
        // Actualizar trigger UI
        document.getElementById('selected-delivery-name-text').innerText = nameText;
        document.getElementById('selected-delivery-sub-text').innerText = sub;
        
        // Actualizar clase seleccionada en la lista
        deliverySelectOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Mostrar/ocultar aviso y actualizar etiquetas según el valor
        if (val === 'shipping') {
          if (storeLabel) storeLabel.innerText = 'Seleccione la Tienda de Referencia (Gestión) *';
          if (shippingNotice) {
            shippingNotice.style.display = 'block';
            shippingNotice.classList.remove('hidden');
          }
        } else {
          if (storeLabel) storeLabel.innerText = 'Seleccione la Tienda de Recogida o Consulta *';
          if (shippingNotice) {
            shippingNotice.style.display = 'none';
            shippingNotice.classList.add('hidden');
          }
        }
        
        // Cerrar dropdown
        deliverySelect.classList.remove('open');
      });
    });
  }

  // 8. Envío de Formulario Checkout
  const checkoutForm = document.getElementById('checkout-form');
  checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // 9. Cerrar Modal Éxito y volver al inicio de la tienda
  document.getElementById('success-close-btn').addEventListener('click', () => {
    document.getElementById('success-modal').classList.remove('active');
    
    // Resetear selector de método de entrega a por defecto
    const defDeliveryOption = document.querySelector('#custom-delivery-select-options .custom-select-option[data-value="pickup"]');
    if (defDeliveryOption) {
      defDeliveryOption.click();
    }
    
    // Resetear filtros para volver a ver el inicio de la tienda limpio
    StoreState.filters = {
      search: '',
      category: 'all',
      selectedBrands: [],
      priceMin: null,
      priceMax: null,
      sort: 'default'
    };
    
    document.getElementById('desktop-search').value = '';
    const mobileSearch = document.getElementById('mobile-search');
    if (mobileSearch) mobileSearch.value = '';
    
    const priceMinInput = document.getElementById('price-min');
    if (priceMinInput) priceMinInput.value = '';
    const priceMaxInputCorrect = document.getElementById('price-max');
    if (priceMaxInputCorrect) priceMaxInputCorrect.value = '';
    
    setSortDropdownValue('default', 'Recomendados');
    
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    const defaultPill = document.querySelector('.filter-pill[data-category="all"]');
    if (defaultPill) defaultPill.classList.add('active');
    
    renderFilters();
    renderCatalog();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 10. Cerrar Modal Detalles de Producto
  const productModal = document.getElementById('product-modal');
  if (productModal) {
    document.getElementById('product-modal-close').addEventListener('click', closeProductModal);
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeProductModal();
    });
  }
}

// ==================== CHECKOUT SUBMISSION ====================
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('checkout-submit-btn');
  const originalText = submitBtn.innerHTML;
  
  // Desactivar botón y colocar spinner
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite; margin-right: 8px;">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
      <path d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
    Procesando...
  `;
  
  // Inyección de estilos de animación spinner en línea por conveniencia
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { display: inline-block; }`;
    document.head.appendChild(style);
  }

  // Obtener datos del cliente del formulario
  const deliveryMethod = document.getElementById('delivery-method-input').value;
  let commentsValue = document.getElementById('cust-comments').value.trim();
  if (deliveryMethod === 'shipping') {
    commentsValue = `[ENVÍO A DOMICILIO - PAGO EN DESTINO]\n` + commentsValue;
  }

  const buyerData = {
    document: document.getElementById('doc-dni').value.trim(),
    name: document.getElementById('full-name').value.trim(),
    email: document.getElementById('cust-email').value.trim(),
    phone: document.getElementById('cust-phone').value.trim(),
    address: document.getElementById('cust-address').value.trim(),
    city: document.getElementById('cust-city').value.trim(),
    preferredStore: document.getElementById('preferred-store-input').value,
    comments: commentsValue,
    products: StoreState.cart.map(item => ({
      productId: item.productId,
      qty: item.qty
    }))
  };

  try {
    const response = await fetch('api/checkout.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buyerData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al procesar la solicitud.');
    }

    if (data.success) {
      // 1. Limpiar carrito
      StoreState.cart = [];
      saveCartToSession();
      recalculateCartTotals();
      
      // 2. Cerrar Checkout Form View de forma segura con fallback manual
      if (typeof window.closeCheckout === 'function') {
        window.closeCheckout();
      } else {
        const checkoutView = document.getElementById('checkout-view');
        if (checkoutView) checkoutView.classList.add('hidden');
        const hero = document.querySelector('.hero');
        if (hero) hero.classList.remove('hidden');
        const features = document.querySelector('.features-bar');
        if (features) features.classList.remove('hidden');
        const mobSearch = document.querySelector('.mobile-search');
        if (mobSearch) mobSearch.classList.remove('hidden');
        const storeContainer = document.querySelector('.store-container');
        if (storeContainer) storeContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const formEl = document.getElementById('checkout-form');
      if (formEl) formEl.reset();

      // 3. Rellenar Modal de Éxito
      const successStoreEl = document.getElementById('success-payment-method');
      if (successStoreEl) {
        successStoreEl.innerText = buyerData.preferredStore;
      }

      // 4. Abrir Modal de Éxito
      document.getElementById('success-modal').classList.add('active');
      showToast('Pedido realizado correctamente.', 'success');

      // 5. Refrescar el catálogo (por si cambió el stock o estatus de productos)
      await fetchStoreData();
      
    } else {
      throw new Error(data.message || 'La compra no pudo completarse.');
    }

  } catch (error) {
    console.error('Checkout error:', error);
    showToast(error.message || 'Ocurrió un error inesperado al procesar la compra.', 'error');
  } finally {
    // Restaurar botón de confirmación
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// ==================== TOAST SYSTEM ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let iconSVG = '';
  let title = 'Información';
  
  if (type === 'success') {
    title = 'Éxito';
    iconSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    title = 'Error';
    iconSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  } else if (type === 'warning') {
    title = 'Atención';
    iconSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    type = 'info'; // fallback
    iconSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon-wrapper toast-icon-${type}">
      ${iconSVG}
    </div>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <p class="toast-message">${message}</p>
    </div>
    <button class="toast-close" aria-label="Cerrar">&times;</button>
    <div class="toast-progress-bar"></div>
  `;

  // Configurar cierre manual al hacer clic en el botón X
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.9)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => { toast.remove(); }, 200);
  });

  container.appendChild(toast);

  // Auto destruir después de 4 segundos
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.9)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }
  }, 4000);
}

// Manejador de error para las imágenes del resumen de compra (evita inyección/rotura de comillas HTML)
window.handleCheckoutImageError = function (img) {
  img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;
};

// Sincronizar y renderizar resumen de compra en la vista inline
function updateCheckoutSummary() {
  const container = document.getElementById('checkout-summary-items');
  if (!container) return;

  container.innerHTML = '';
  
  if (StoreState.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 0.9rem;">
        No hay artículos en su pedido.
      </div>
    `;
    return;
  }

  const fallbackImageSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;
  const currency = StoreState.settings.currency;

  StoreState.cart.forEach(item => {
    let imgUrl = item.image_url ? item.image_url : '';
    if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      imgUrl = '../' + imgUrl;
    } else if (!imgUrl) {
      imgUrl = fallbackImageSVG;
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'summary-item';
    itemEl.innerHTML = `
      <div class="summary-item-left">
        <img src="${imgUrl}" alt="${item.name}" onerror="handleCheckoutImageError(this)" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);">
        <div class="summary-item-info">
          <h4 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-align: left;">${item.name}</h4>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Cant: ${item.qty} x ${formatEuro(item.price)} ${currency}</span>
        </div>
      </div>
      <div class="summary-item-price" style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">
        ${formatEuro((item.price * item.qty))} ${currency}
      </div>
    `;
    container.appendChild(itemEl);
  });

  const total = StoreState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxRate = parseFloat(StoreState.settings.tax_rate);
  const subtotal = total / (1 + (taxRate / 100));
  const taxAmount = total - subtotal;

  document.getElementById('checkout-subtotal-page').innerText = `${formatEuro(subtotal)} ${currency}`;
  document.getElementById('checkout-tax-amount-page').innerText = `${formatEuro(taxAmount)} ${currency}`;
  document.getElementById('checkout-total-page').innerText = `${formatEuro(total)} ${currency}`;
  document.getElementById('checkout-total-val').innerText = `${formatEuro(total)} ${currency}`;
}

