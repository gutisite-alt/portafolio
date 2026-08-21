/**
 * ANAYA ERP - Core Application Engine & State Manager
 * Gestión de estado en memoria sincronizada directamente con Base de Datos por sesión.
 */

// ==================== GESTIÓN DE ESTADO ====================
let ERPState = {
  session: { loggedIn: false, id: null, email: "", name: "", phone: "", role: "" },
  pendingWebOrders: [],
  products: [],
  clients: [],
  suppliers: [],
  invoices: [],
  movements: [],
  purchaseOrders: [],
  settings: {
    companyName: "Anaya Outlet S.L.",
    cif: "B-87654321",
    phone: "+34 910 123 456",
    email: "contacto@anayaoutlet.com",
    address: "Calle Mayor 124, Polígono Industrial Oeste",
    city: "Madrid",
    state: "Madrid",
    taxRate: 21,
    currency: "€",
  },
  theme: "light",
};

// Control responsivo de la barra lateral
// Helper para dar formato de Euros (España: 1.234,56 €)
window.formatEuro = function(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0,00 €';
  let fixed = num.toFixed(2);
  let parts = fixed.split('.');
  let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  let decimalPart = parts[1];
  return integerPart + ',' + decimalPart + ' €';
};

window.parseEuro = function(value) {
  if (value === null || value === undefined) return 0;
  let str = value.toString().trim();
  if (str === "") return 0;
  str = str.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  str = str.replace(/[^0-9.-]/g, '');
  return parseFloat(str) || 0;
};

window.getLoadingSpinnerHTML = function(text = "Guardando...") {
  return `<span class="flex items-center justify-center gap-2.5">
    <span class="spinner-round"></span>
    <span>${text}</span>
  </span>`;
};

window.formatEuroOnInput = function(input) {
  let cursor = input.selectionStart;
  let originalValue = input.value;
  let originalLen = originalValue.length;

  // Convertir punto final a coma si no hay otra coma, para teclado numérico físico
  if (originalValue.endsWith('.')) {
    if (originalValue.indexOf(',') === -1) {
      originalValue = originalValue.slice(0, -1) + ',';
    } else {
      originalValue = originalValue.slice(0, -1);
    }
  }

  let parts = originalValue.split(',');
  let integerPart = parts[0].replace(/[^0-9-]/g, '');
  let decimalPart = parts.length > 1 ? parts[1].replace(/[^0-9]/g, '') : '';

  let formattedInteger = '';
  if (integerPart !== '') {
    formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  } else {
    formattedInteger = '0';
  }

  let formattedDecimal = '00';
  if (parts.length > 1) {
    if (decimalPart.length === 1) {
      formattedDecimal = decimalPart + '0';
    } else if (decimalPart.length >= 2) {
      formattedDecimal = decimalPart.substring(0, 2);
    }
  }

  let formatted = formattedInteger + ',' + formattedDecimal;

  // Calcular la nueva posición del cursor
  let newCursor = cursor;
  let wasInDecimal = (originalValue.indexOf(',') !== -1 && cursor > originalValue.indexOf(','));
  let justTypedComma = (originalValue.indexOf(',') !== -1 && cursor === originalValue.indexOf(',') + 1 && parts[1] === '');

  if (justTypedComma) {
    newCursor = formatted.indexOf(',') + 1;
  } else if (wasInDecimal) {
    let oldDecimalPartPart = originalValue.substring(originalValue.indexOf(',') + 1, cursor);
    let oldDecDigits = oldDecimalPartPart.replace(/[^0-9]/g, '').length;
    newCursor = formatted.indexOf(',') + 1 + oldDecDigits;
  } else {
    let oldIntegerPart = originalValue.substring(0, cursor);
    let oldDigits = oldIntegerPart.replace(/[^0-9-]/g, '').length;
    let newDigitsCount = 0;
    let foundIndex = 0;

    for (let i = 0; i < formatted.length; i++) {
      if (formatted[i] === ',') {
        foundIndex = i;
        break;
      }
      if (formatted[i].match(/[0-9-]/)) {
        newDigitsCount++;
      }
      if (newDigitsCount === oldDigits) {
        foundIndex = i + 1;
        while (foundIndex < formatted.length && formatted[foundIndex] === '.') {
          foundIndex++;
        }
        break;
      }
    }
    newCursor = foundIndex;
  }

  input.value = formatted;

  if (newCursor < 0) newCursor = 0;
  if (newCursor > formatted.length) newCursor = formatted.length;
  input.setSelectionRange(newCursor, newCursor);
};

window.onCurrencyInputBlur = function(input) {
  const val = window.parseEuro(input.value);
  let fixed = val.toFixed(2);
  let parts = fixed.split('.');
  let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  let decimalPart = parts[1];
  input.value = integerPart + ',' + decimalPart;
};

window.toggleSidebar = function (open) {
  const sidebar = document.querySelector("aside");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    if (open) {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    } else {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  }
};

// Inicializar el estado de la aplicación sin LocalStorage
function initERPState() {
  // Comenzar con un estado completamente limpio (listas vacías)
  ERPState.products = [];
  ERPState.clients = [];
  ERPState.suppliers = [];
  ERPState.invoices = [];
  ERPState.movements = [];
  ERPState.purchaseOrders = [];
  ERPState.sales = [];
  ERPState.theme = "light";

  // Inicialización del tema por defecto a Claro
  applyTheme(ERPState.theme);

  // Cargar credenciales de recordar usuario desde una cookie segura
  const cookies = document.cookie.split(";");
  const rememberCookie = cookies.find((c) => c.trim().startsWith("remember_email="));
  if (rememberCookie) {
    const email = decodeURIComponent(rememberCookie.trim().split("=")[1]);
    const emailEl = document.getElementById("login-email");
    const remEl = document.getElementById("login-remember");
    if (emailEl && remEl && email) {
      emailEl.value = email;
      remEl.checked = true;
    }
  }
}

// Guardar estado (desactivado para no usar LocalStorage)
function saveERPState() {
  // Desactivado por diseño, ahora se usa base de datos por sesión
}

// ==================== LÓGICA DE AUTENTICACIÓN E INICIO DE SESIÓN ====================
function applyRolePermissions() {
  const role = ERPState.session ? ERPState.session.role : "";
  const isAdmin = role === "admin";
  const isCajero = role === "cajero";

  const navs = {
    dashboard: document.getElementById("nav-dashboard"),
    products: document.getElementById("nav-products"),
    inventory: document.getElementById("nav-inventory"),
    categories: document.getElementById("nav-categories"),
    brands: document.getElementById("nav-brands"),
    sales: document.getElementById("nav-sales"),
    clients: document.getElementById("nav-clients"),
    suppliers: document.getElementById("nav-suppliers"),
    purchases: document.getElementById("nav-purchases"),
    reports: document.getElementById("nav-reports"),
    users: document.getElementById("nav-users"),
    audit: document.getElementById("nav-audit"),
    settings: document.getElementById("nav-settings"),
    billing: document.getElementById("nav-billing"),
    cash: document.getElementById("nav-cash")
  };

  for (const [key, element] of Object.entries(navs)) {
    if (!element) continue;

    // Ocultar permanentemente 'Registrar Venta' y 'Control de Caja' a petición del cliente
    if (key === "billing" || key === "cash") {
      element.style.display = "none";
      continue;
    }

    if (isCajero) {
      element.style.display = "none";
    } else if (isAdmin) {
      element.style.display = "flex";
    } else {
      // Operador
      if (
        key === "users" ||
        key === "audit" ||
        key === "reports" ||
        key === "categories" ||
        key === "brands"
      ) {
        element.style.display = "none";
      } else {
        element.style.display = "flex";
      }
    }
  }

  // Control de visibilidad del buscador de cabecera
  const searchContainer = document.getElementById("header-search-container");
  if (searchContainer) {
    if (isCajero) {
      searchContainer.classList.add("hidden");
    } else {
      searchContainer.classList.remove("hidden");
    }
  }
}

function updateUserProfileUI(user) {
  if (!user) return;

  const getInitials = (name) => {
    if (!name) return "U";
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
  };

  const initials = getInitials(user.name);
  let roleText = "Operador";
  if (user.role === "admin") {
    roleText = "Administrador";
  } else if (user.role === "cajero") {
    roleText = "Cajero POS";
  }

  const sidebarAvatar = document.getElementById("sidebar-user-avatar");
  if (sidebarAvatar) sidebarAvatar.innerText = initials;

  const sidebarName = document.getElementById("user-display-name");
  if (sidebarName) sidebarName.innerText = user.name;

  const sidebarEmail = document.getElementById("sidebar-user-email");
  if (sidebarEmail) sidebarEmail.innerText = user.email;

  const headerAvatar = document.getElementById("header-user-avatar");
  if (headerAvatar) headerAvatar.innerText = initials;

  const headerName = document.getElementById("header-user-name");
  if (headerName) headerName.innerText = user.name.split(" ")[0];

  const dropdownRole = document.getElementById("dropdown-user-role");
  if (dropdownRole) dropdownRole.innerText = roleText;

  const dropdownName = document.getElementById("dropdown-user-name");
  if (dropdownName) dropdownName.innerText = user.name;
}

async function loadSettingsFromDB() {
  try {
    const res = await fetch("api/get_settings.php");
    const data = await res.json();
    if (data.success) {
      ERPState.settings = {
        companyName: data.settings.company_name,
        cif: data.settings.cif,
        phone: data.settings.phone,
        email: data.settings.email,
        address: data.settings.address,
        city: data.settings.city,
        state: data.settings.state,
        taxRate: parseInt(data.settings.tax_rate) || 21,
        currency: data.settings.currency || "€",
        twilioSid: data.settings.twilio_sid,
        twilioAuthToken: data.settings.twilio_auth_token,
        twilioPhone: data.settings.twilio_phone,
      };
      saveERPState();
      return true;
    }
  } catch (err) {
    console.error("Error loading settings from DB:", err);
  }
  return false;
}

async function checkAuthStatus() {
  try {
    const res = await fetch("auth/check_session.php");
    const data = await res.json();
    if (data.success) {
      ERPState.session = {
        loggedIn: true,
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role,
      };

      if (data.user.theme) {
        ERPState.theme = data.user.theme;
        applyTheme(data.user.theme);
      }

      updateUserProfileUI(data.user);
      await loadSettingsFromDB();
      applyRolePermissions();
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("app-layout").classList.remove("hidden");
      startWebOrdersChecker();
      router();
    } else {
      ERPState.session = { loggedIn: false, email: "", role: "" };
      document.getElementById("app-layout").classList.add("hidden");
      document.getElementById("login-screen").classList.remove("hidden");
      window.location.hash = "login";
    }
  } catch (err) {
    console.error("Error checking auth status:", err);
    ERPState.session = { loggedIn: false, email: "", role: "" };
    document.getElementById("app-layout").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    window.location.hash = "login";
  }
}

async function handleLogin(email, password, remember) {
  try {
    const response = await fetch("auth/login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      ERPState.session = {
        loggedIn: true,
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role,
      };

      if (remember) {
        // Guardar email en una cookie de 30 días
        document.cookie = `remember_email=${encodeURIComponent(email)}; max-age=${30 * 24 * 60 * 60}; path=/`;
      } else {
        // Borrar cookie
        document.cookie = "remember_email=; max-age=0; path=/";
      }

      if (data.user.theme) {
        ERPState.theme = data.user.theme;
        applyTheme(data.user.theme);
      }

      updateUserProfileUI(data.user);
      await loadSettingsFromDB();
      applyRolePermissions();
      showToast("Bienvenido a ANAYA ERP. Acceso correcto.", "success");

      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("app-layout").classList.remove("hidden");

      if (data.user.role === "cajero") {
        window.location.hash = "billing";
      } else {
        window.location.hash = "dashboard";
      }
      startWebOrdersChecker();
      renderActiveView();
      return true;
    } else {
      showToast(data.message || "Credenciales incorrectas.", "error");
      return false;
    }
  } catch (error) {
    console.error("Login request error:", error);
    showToast("Error de conexión con el servidor de autenticación.", "error");
    return false;
  }
}

async function logoutSession() {
  try {
    await fetch("auth/logout.php");
  } catch (error) {
    console.error("Logout request error:", error);
  }

  stopWebOrdersChecker();
  ERPState.session.loggedIn = false;
  saveERPState();

  document.getElementById("app-layout").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  window.location.hash = "login";
  showToast("Sesión cerrada correctamente.", "info");
}

window.openCashSessionAction = async function (e) {
  e.preventDefault();
  const initialBase =
    parseFloat(document.getElementById("opening-initial-base").value) || 0;

  try {
    const res = await fetch("api/open_cash_session.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initialBase, openingDate: new Date().toISOString() }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message, "success");
      await renderActiveView(window.location.hash.slice(1) || "dashboard");
    } else {
      showToast(data.message || "Error al abrir la caja.", "error");
    }
  } catch (err) {
    console.error("Error opening cash session:", err);
    showToast("Error de red al intentar abrir la caja.", "error");
  }
};

// ==================== CONFIGURADOR DEL TEMA DEL SISTEMA ====================
function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    updateThemeSelectorUI("dark", "🌙", "Oscuro");
  } else if (theme === "light") {
    root.classList.remove("dark");
    updateThemeSelectorUI("light", "💡", "Claro");
  } else {
    // Verificación del tema del sistema
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (systemPrefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    updateThemeSelectorUI("system", "💻", "Sistema");
  }

  ERPState.theme = theme;
  saveERPState();
}

async function setTheme(theme) {
  applyTheme(theme);
  
  const dropdown = document.getElementById("theme-menu-dropdown");
  if (dropdown) dropdown.classList.add("hidden");

  if (ERPState.session && ERPState.session.loggedIn) {
    try {
      const res = await fetch("api/update_user_theme.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Error al guardar tema en BD:", data.message);
      }
    } catch (err) {
      console.error("Error de red al guardar tema:", err);
    }
  }
}

function updateThemeSelectorUI(value, icon, text) {
  const btnIcon = document.getElementById("theme-active-icon");
  const btnText = document.getElementById("theme-active-text");

  if (btnIcon && btnText) {
    if (value === "light") {
      btnIcon.innerHTML = `<svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>`;
    } else if (value === "dark") {
      btnIcon.innerHTML = `<svg class="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>`;
    } else {
      btnIcon.innerHTML = `<svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>`;
    }
    btnText.innerText = text;
  }

  const loginBtnIcon = document.getElementById("login-theme-btn-icon");
  const loginBtnText = document.getElementById("login-theme-btn-text");
  if (loginBtnIcon && loginBtnText) {
    if (value === "light") {
      loginBtnIcon.innerHTML = `<svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>`;
      loginBtnText.innerText = "Modo Claro";
    } else if (value === "dark") {
      loginBtnIcon.innerHTML = `<svg class="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>`;
      loginBtnText.innerText = "Modo Oscuro";
    } else {
      loginBtnIcon.innerHTML = `<svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>`;
      loginBtnText.innerText = "Sistema";
    }
  }
}

// ==================== ENRUTADOR GLOBAL ====================
async function router() {
  let hash = window.location.hash.slice(1) || "dashboard";
  if (hash.includes("?")) {
    hash = hash.split("?")[0];
  }

  // Verificación de guardia de autenticación
  if (!ERPState.session.loggedIn) {
    document.getElementById("app-layout").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    window.location.hash = "login";
    return;
  }

  // Evitar que usuarios no administradores accedan a las pestañas de reportes, usuarios, auditoría, categorías o marcas
  if (
    (hash === "reports" || hash === "users" || hash === "audit" || hash === "categories" || hash === "brands") &&
    ERPState.session.role !== "admin"
  ) {
    window.location.hash = "dashboard";
    showToast(
      "Acceso denegado. Permisos de administrador requeridos.",
      "error",
    );
    return;
  }

  // Evitar que cajeros accedan a módulos administrativos
  const isCajero = ERPState.session && ERPState.session.role === "cajero";
  if (isCajero && hash !== "billing" && hash !== "cash") {
    window.location.hash = "billing";
    showToast(
      "Acceso restringido. Su rol de cajero solo permite facturación y control de caja.",
      "warning"
    );
    return;
  }

  // Evitar que operadores accedan al POS o Caja
  const isOperator = ERPState.session && ERPState.session.role === "operator";
  if (isOperator && (hash === "billing" || hash === "cash")) {
    window.location.hash = "dashboard";
    showToast(
      "Acceso denegado. Los módulos de registro de ventas y caja están reservados para cajeros y administradores.",
      "error"
    );
    return;
  }

  // Resaltar elemento activo de la barra lateral
  document.querySelectorAll("aside nav a").forEach((link) => {
    link.classList.remove("active-nav-item");
  });

  const activeLink = document.getElementById(`nav-${hash}`);
  if (activeLink) {
    activeLink.classList.add("active-nav-item");
  }

  await renderActiveView(hash);
}

async function loadDashboardData() {
  try {
    const [clientsRes, productsRes, invoicesRes, purchasesRes] =
      await Promise.all([
        fetch("api/get_clients.php"),
        fetch("api/get_products.php"),
        fetch("api/get_invoices.php"),
        fetch("api/get_purchases.php"),
      ]);

    const [clientsData, productsData, invoicesData, purchasesData] =
      await Promise.all([
        clientsRes.json(),
        productsRes.json(),
        invoicesRes.json(),
        purchasesRes.json(),
      ]);

    if (clientsData.success) {
      ERPState.clients = clientsData.clients.map((c) => ({
        id: c.id,
        customId: c.custom_id,
        name: c.name,
        document: c.document,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        salesCount: parseInt(c.sales_count) || 0,
        salesTotal: parseFloat(c.sales_total) || 0,
      }));
    }

    if (productsData.success) {
      ERPState.products = productsData.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        supplierId: p.supplier_id,
        supplierName: p.supplier_name,
        buyPrice: parseFloat(p.buy_price) || 0,
        sellPrice: parseFloat(p.sell_price) || 0,
        stock: parseInt(p.stock) || 0,
        minStock: parseInt(p.min_stock) || 0,
        weight: p.weight,
        dimensions: p.dimensions,
        image: p.image_url,
        description: p.description,
        status: p.status,
      }));
    }

    if (invoicesData.success) {
      ERPState.invoices = invoicesData.invoices;
    }

    if (purchasesData.success) {
      ERPState.purchaseOrders = purchasesData.purchaseOrders;
    }
    updateNotificationsSystem();
  } catch (err) {
    console.error("Error loading dashboard data from DB:", err);
  }
}

// ==================== ENRUTADOR DE VISTAS DINÁMICAS Y RENDERIZADORES ====================
async function renderActiveView(hash) {
  const viewContainer = document.getElementById("main-content");
  if (!viewContainer) return;

  // Destruye cualquier instancia existente de Chart para evitar fugas de memoria
  destroyAllCharts();

  switch (hash) {
    case "dashboard":
      viewContainer.innerHTML = `<div class="flex items-center justify-center py-20 text-slate-400">
        <span class="animate-pulse font-bold text-sm">Cargando métricas del Dashboard...</span>
      </div>`;
      await loadDashboardData();
      viewContainer.innerHTML = getDashboardHTML();
      initDashboardCharts();
      break;
    case "inventory":
      await renderInventoryModule(viewContainer);
      break;
    case "products":
      await renderProductsModule(viewContainer);
      break;
    case "categories":
      await renderCategoriesModule(viewContainer);
      break;
    case "brands":
      await renderBrandsModule(viewContainer);
      break;
    case "billing":
      await renderBillingModule(viewContainer);
      break;
    case "sales":
      await renderSalesModule(viewContainer);
      break;
    case "web-orders":
      await renderWebOrdersModule(viewContainer);
      break;
    case "clients":
      await renderClientsModule(viewContainer);
      break;
    case "suppliers":
      await renderSuppliersModule(viewContainer);
      break;
    case "purchases":
      await renderPurchasesModule(viewContainer);
      break;
    case "reports":
      viewContainer.innerHTML = `<div class="flex items-center justify-center py-20 text-slate-400">
        <span class="animate-pulse font-bold text-sm">Cargando métricas de Reportes...</span>
      </div>`;
      await loadDashboardData();
      renderReportsModule(viewContainer);
      break;
    case "settings":
      {
        const isProfile = window.location.hash.includes("tab=profile") || (ERPState.session && ERPState.session.role !== "admin");
        renderSettingsModule(viewContainer, isProfile ? "profile" : "company");
      }
      break;
    case "users":
      renderUsersModule(viewContainer);
      break;
    case "audit":
      await renderAuditModule(viewContainer);
      break;
    case "cash":
      await renderCashModule(viewContainer);
      break;
    default:
      viewContainer.innerHTML = `<div class="flex items-center justify-center py-20 text-slate-400">
        <span class="animate-pulse font-bold text-sm">Cargando métricas del Dashboard...</span>
      </div>`;
      await loadDashboardData();
      viewContainer.innerHTML = getDashboardHTML();
      initDashboardCharts();
  }
}

// ==================== RENDERIZADOR EJECUTIVO DEL PANEL DE CONTROL ====================
let dashboardCharts = [];
function destroyAllCharts() {
  dashboardCharts.forEach((c) => {
    if (c) c.destroy();
  });
  dashboardCharts = [];
}

function getDashboardHTML() {
  // Agregar métricas de KPIs
  const today = "2026-05-30"; // día actual simulado
  const salesToday = ERPState.invoices
    .filter((i) => i.date === today && i.status === "Cobrada")
    .reduce((sum, i) => sum + i.total, 0);

  const salesMonthTotal = ERPState.invoices
    .filter((i) => i.status === "Cobrada")
    .reduce((sum, i) => sum + i.total, 0);

  const billingMonthTotal = ERPState.invoices
    .filter((i) => i.status === "Cobrada")
    .reduce((sum, i) => sum + i.subtotal, 0); // facturación antes de IVA

  const activeClients = ERPState.clients.length;
  const activeProducts = ERPState.products.length;

  const pendingInvoices = ERPState.invoices.filter(
    (i) => i.status === "Pendiente",
  ).length;
  const paidInvoices = ERPState.invoices.filter((i) => i.status === "Cobrada");
  const averageTicket =
    paidInvoices.length > 0
      ? paidInvoices.reduce((sum, i) => sum + i.total, 0) / paidInvoices.length
      : 0;

  const pendingOrders = ERPState.purchaseOrders.filter(
    (po) => po.status === "Pendiente" || po.status === "Aprobada",
  ).length;

  // Renderizar tarjetas y cuadrículas de KPIs
  return `
    <div class="space-y-8 animate-toast-in">
      <div class="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight dark:text-white">Dashboard Ejecutivo</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Anaya Outlet S.L. — Panel de control integral en tiempo real.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            Sistema en Línea
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl font-medium shadow-sm">
            Fiscalización: IVA 21%
          </span>
        </div>
      </div>

      <!-- KPI GRID -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <!-- Card 1 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Ventas Hoy</span>
            <span class="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">+12.4%</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${salesToday.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Simulado para hoy: 30 de Mayo</span>
        </div>
        <!-- Card 2 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Ventas Mes</span>
            <span class="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">+8.2%</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${salesMonthTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Total acumulado neto</span>
        </div>
        <!-- Card 3 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Facturación Bruta</span>
            <span class="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">Base Imp.</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${billingMonthTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Sin impuestos aplicados</span>
        </div>
        <!-- Card 4 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Clientes Activos</span>
            <span class="text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">Fidelizados</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${activeClients}</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Registrados en CRM</span>
        </div>
        <!-- Card 5 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Catálogo Activo</span>
            <span class="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">Productos</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${activeProducts}</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Referencias habilitadas</span>
        </div>
        <!-- Card 6 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Facturas Pendientes</span>
            <span class="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">Por cobrar</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${pendingInvoices}</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Ventas emitidas sin cobrar</span>
        </div>
        <!-- Card 7 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Ticket Medio</span>
            <span class="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">Cobrado</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${averageTicket.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Valor promedio por venta</span>
        </div>
        <!-- Card 8 -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium hover:shadow-premium-hover transition-all">
          <div class="flex justify-between items-start text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Pedidos Compras</span>
            <span class="text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">Trámite</span>
          </div>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${pendingOrders} POs</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Órdenes de compra activas</span>
        </div>
      </div>

      <!-- CHARTS AREA REMOVED BY DESIGN -->

      <!-- RECENT ACTIVITY FEED -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
        <h4 class="font-bold text-slate-800 dark:text-white mb-6">Actividad y Operaciones Recientes</h4>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <!-- Últimas Ventas / Facturas -->
          <div>
            <span class="text-xs font-extrabold uppercase text-slate-400 tracking-wider block mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Últimas Ventas</span>
            <div class="space-y-4">
              ${getLastInvoicesHTML()}
            </div>
          </div>
          <!-- Facturas Pendientes Recientes -->
          <div>
            <span class="text-xs font-extrabold uppercase text-slate-400 tracking-wider block mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Facturas Pendientes</span>
            <div class="space-y-4">
              ${getPendingInvoicesFeedHTML()}
            </div>
          </div>
          <!-- Últimas Órdenes de Compra -->
          <div>
            <span class="text-xs font-extrabold uppercase text-slate-400 tracking-wider block mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Órdenes de Compra</span>
            <div class="space-y-4">
              ${getLastPurchaseOrdersHTML()}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Inicialización del gráfico del panel de control a través de Chart.js
function initDashboardCharts() {
  // Se eliminaron los gráficos del panel a petición del diseño para simplificar la interfaz
}

// Ayudantes para generar listas HTML en los paneles de actividad
function getLastInvoicesHTML() {
  const lasts = ERPState.invoices.slice(-4).reverse();
  if (lasts.length === 0)
    return `<p class="text-xs text-slate-400">Sin facturas emitidas</p>`;

  return lasts
    .map((i) => {
      const statusColor =
        i.status === "Cobrada"
          ? "text-emerald-500 bg-emerald-500/10"
          : i.status === "Pendiente"
            ? "text-yellow-500 bg-yellow-500/10"
            : i.status === "Devuelta"
              ? "text-red-500 bg-red-500/10"
              : "text-slate-400 bg-slate-100";
      return `
      <div class="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all">
        <div class="overflow-hidden">
          <span class="font-bold text-slate-800 dark:text-slate-200 block truncate">${i.clientName}</span>
          <span class="text-[10px] text-slate-400">${i.invoiceNumber} • ${i.date}</span>
        </div>
        <div class="text-right flex-shrink-0 ml-2">
          <span class="font-black dark:text-white block">${i.total.toLocaleString("es-ES")} €</span>
          <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${statusColor}">${i.status}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

function getPendingInvoicesFeedHTML() {
  const lasts = ERPState.invoices
    .filter((i) => i.status === "Pendiente")
    .slice(-4)
    .reverse();
  if (lasts.length === 0)
    return `<p class="text-xs text-slate-400 py-4 text-center">Sin facturas pendientes de cobro</p>`;

  return lasts
    .map((i) => {
      return `
      <div class="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all">
        <div class="overflow-hidden">
          <span class="font-bold text-slate-800 dark:text-slate-200 block truncate">${i.clientName}</span>
          <span class="text-[10px] text-slate-400">${i.invoiceNumber} • ${i.date}</span>
        </div>
        <div class="text-right flex-shrink-0 ml-2">
          <span class="font-black text-amber-500 block">${i.total.toLocaleString("es-ES")} €</span>
          <span class="text-[9px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">Pendiente</span>
        </div>
      </div>
    `;
    })
    .join("");
}

function getLastPurchaseOrdersHTML() {
  const lasts = ERPState.purchaseOrders.slice(-4).reverse();
  if (lasts.length === 0)
    return `<p class="text-xs text-slate-400 py-4 text-center">Sin órdenes registradas</p>`;

  return lasts
    .map((po) => {
      const statusColor =
        po.status === "Recibida"
          ? "text-emerald-500 bg-emerald-500/10"
          : po.status === "Pendiente"
            ? "text-yellow-500 bg-yellow-500/10"
            : "text-slate-400 bg-slate-100";
      return `
      <div class="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all">
        <div class="overflow-hidden">
          <span class="font-bold text-slate-800 dark:text-slate-200 block truncate">${po.supplierName}</span>
          <span class="text-[10px] text-slate-400">${po.poNumber} • ${po.date}</span>
        </div>
        <div class="text-right flex-shrink-0 ml-2">
          <span class="font-black dark:text-white block">${po.total.toLocaleString("es-ES")} €</span>
          <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${statusColor}">${po.status}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

// ==================== RENDERIZADOR DEL MÓDULO DE INVENTARIO ====================
let inventoryFilters = {
  search: "",
  category: "",
  status: "",
  page: 1,
  limit: 10,
};

function renderInventoryModule(container) {
  // Restablecer paginación al renderizar la vista
  inventoryFilters = {
    search: "",
    category: "",
    status: "",
    page: 1,
    limit: 10,
  };

  const cats = [...new Set(ERPState.products.map((p) => p.category))].filter(
    Boolean,
  );
  const categoriesListHTML =
    `
    <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectInventoryCatOption('', 'Todas las Categorías')">Todas las Categorías</button>
  ` +
    cats
      .map(
        (c) => `
    <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectInventoryCatOption('${c}', '${c}')">${c}</button>
  `,
      )
      .join("");

  container.innerHTML = `
    <div class="space-y-6 animate-toast-in">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start lg:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight dark:text-white">Gestión de Inventario</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Control del stock total, estados de seguridad y movimientos de almacén.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button onclick="openInventoryAdjustmentModal()" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Ajuste Manual
          </button>
          <button onclick="exportInventoryToCSV()" class="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 hover:bg-slate-50">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Exportar CSV
          </button>
          <button onclick="openMovementsLogModal()" class="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 hover:bg-slate-50">
            Historial Movimientos
          </button>
        </div>
      </div>

      <!-- FILTER PANEL -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col md:flex-row gap-4 items-center">
        <!-- Search input -->
        <div class="flex-1 w-full flex items-center gap-2">
          <div class="relative flex-1">
            <input type="text" id="inv-search-input" oninput="triggerInventorySearch()" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all" placeholder="Buscar por SKU, Nombre...">
            <span class="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
          </div>
          <button id="inv-clear-search-btn" onclick="clearInventorySearch()" class="hidden px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all flex items-center gap-1.5 hover:shadow-sm">
            <span>Mostrar Todos</span>
            <span class="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">✕</span>
          </button>
        </div>
        
        <!-- Categorías Custom Dropdown -->
        <div class="relative w-full md:w-56" id="inv-cat-dropdown-container">
          <button type="button" onclick="toggleInventoryCustomDropdown('inv-cat-dropdown-menu', 'inv-cat-chevron')" class="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 focus:outline-none flex items-center justify-between cursor-pointer transition-all">
            <span class="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            </span>
            <span id="inv-cat-dropdown-label" class="truncate">Todas las Categorías</span>
            <span class="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none">
              <svg class="w-3.5 h-3.5 transition-transform duration-200" id="inv-cat-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </span>
          </button>
          
          <div id="inv-cat-dropdown-menu" class="hidden absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-premium dark:shadow-dark-premium p-1.5 z-30 max-h-60 overflow-y-auto transform scale-95 opacity-0 origin-top transition-all duration-150 flex flex-col gap-0.5">
            ${categoriesListHTML}
          </div>
        </div>
        
        <!-- Estados Custom Dropdown -->
        <div class="relative w-full md:w-52" id="inv-status-dropdown-container">
          <button type="button" onclick="toggleInventoryCustomDropdown('inv-status-dropdown-menu', 'inv-status-chevron')" class="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 focus:outline-none flex items-center justify-between cursor-pointer transition-all">
            <span class="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </span>
            <span id="inv-status-dropdown-label" class="truncate">Todos los Estados</span>
            <span class="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none">
              <svg class="w-3.5 h-3.5 transition-transform duration-200" id="inv-status-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </span>
          </button>
          
          <div id="inv-status-dropdown-menu" class="hidden absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-premium dark:shadow-dark-premium p-1.5 z-30 max-h-60 overflow-y-auto transform scale-95 opacity-0 origin-top transition-all duration-150 flex flex-col gap-0.5">
            <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectInventoryStatusOption('', 'Todos los Estados')">Todos los Estados</button>
            <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectInventoryStatusOption('Disponible', 'Disponible')">Disponible</button>
            <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectInventoryStatusOption('Bajo Stock', 'Bajo Stock')">Bajo Stock</button>
            <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectInventoryStatusOption('Agotado', 'Agotado')">Agotado</button>
          </div>
        </div>
      </div>

      <!-- INVENTORY TABLE CONTAINER -->
      <div class="bg-transparent lg:bg-white dark:lg:bg-slate-800 rounded-3xl border-none lg:border border-slate-200/60 dark:border-slate-700 shadow-none lg:shadow-premium dark:lg:shadow-dark-premium overflow-hidden">
        <div class="table-scroll-container overflow-x-hidden lg:overflow-visible">
          <table class="w-full text-left text-sm block lg:table">
            <thead class="hidden lg:table-header-group bg-slate-55 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-700/80">
              <tr>
                <th class="py-4.5 px-6">SKU</th>
                <th class="py-4.5 px-6">Producto</th>
                <th class="py-4.5 px-6">Categoría</th>
                <th class="py-4.5 px-6">Marca</th>
                <th class="py-4.5 px-6 text-center">Stock Físico</th>
                <th class="py-4.5 px-6 text-center">Stock Mínimo</th>
                <th class="py-4.5 px-6 text-center">Estado</th>
                <th class="py-4.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body" class="divide-y divide-slate-100 dark:divide-slate-700/50 block lg:table-row-group">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>

        <!-- PAGINATION BAR -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span id="inventory-showing-text">Mostrando 1-10 de 50 registros</span>
          <div class="flex items-center gap-1">
            <button onclick="invPrevPage()" class="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40" id="btn-inv-prev">Anterior</button>
            <span class="px-3" id="inv-page-num">Pág 1</span>
            <button onclick="invNextPage()" class="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40" id="btn-inv-next">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `;

  updateInventoryTable();
}

function getCategoriesOptionsHTML() {
  const cats = [...new Set(ERPState.products.map((p) => p.category))];
  return cats.map((c) => `<option value="${c}">${c}</option>`).join("");
}

async function updateInventoryTable() {
  const body = document.getElementById("inventory-table-body");
  if (!body) return;

  try {
    const res = await fetch("api/get_products.php");
    const data = await res.json();
    if (data.success) {
      ERPState.products = data.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        supplierId: p.supplier_id,
        supplierName: p.supplier_name,
        buyPrice: parseFloat(p.buy_price) || 0,
        sellPrice: parseFloat(p.sell_price) || 0,
        stock: parseInt(p.stock) || 0,
        minStock: parseInt(p.min_stock) || 0,
        weight: p.weight,
        dimensions: p.dimensions,
        image: p.image_url,
        description: p.description,
        status: p.status,
      }));
      updateNotificationsSystem();
    }
  } catch (err) {
    console.error("Error fetching products list for inventory:", err);
  }

  // Aplicar filtros
  let filtered = [...ERPState.products];

  if (inventoryFilters.search) {
    const s = inventoryFilters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s),
    );
  }

  if (inventoryFilters.category) {
    filtered = filtered.filter((p) => p.category === inventoryFilters.category);
  }

  if (inventoryFilters.status) {
    filtered = filtered.filter((p) => p.status === inventoryFilters.status);
  }

  // Calcular paginación
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / inventoryFilters.limit) || 1;

  if (inventoryFilters.page > totalPages) inventoryFilters.page = totalPages;

  const startIdx = (inventoryFilters.page - 1) * inventoryFilters.limit;
  const endIdx = Math.min(startIdx + inventoryFilters.limit, totalRecords);

  const paginated = filtered.slice(startIdx, endIdx);

  // Verificación de deshabilitado de botones
  const btnPrev = document.getElementById("btn-inv-prev");
  const btnNext = document.getElementById("btn-inv-next");
  if (btnPrev) btnPrev.disabled = inventoryFilters.page === 1;
  if (btnNext) btnNext.disabled = inventoryFilters.page === totalPages;

  const showingText = document.getElementById("inventory-showing-text");
  if (showingText) {
    showingText.innerText =
      totalRecords > 0
        ? `Mostrando ${startIdx + 1}-${endIdx} de ${totalRecords} referencias`
        : `Mostrando 0-0 de 0 referencias`;
  }

  const pageNum = document.getElementById("inv-page-num");
  if (pageNum)
    pageNum.innerText = `Pág ${inventoryFilters.page} de ${totalPages}`;

  if (paginated.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400 dark:text-slate-500">
          <div class="max-w-sm mx-auto flex flex-col items-center">
            <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            <h5 class="font-bold text-sm text-slate-700 dark:text-slate-300">No se encontraron productos</h5>
            <p class="text-xs mt-1">Pruebe ajustando los filtros de búsqueda aplicados.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = paginated
    .map((p) => {
      const statusPill =
        p.status === "Disponible"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20"
          : p.status === "Bajo Stock"
            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold border border-yellow-500/20"
            : "bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20";

      const pImg =
        p.image ||
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop";

      return `
      <tr class="flex flex-col lg:table-row border border-slate-150 dark:border-slate-700/60 lg:border-none p-4 lg:p-0 rounded-2xl mb-4 lg:mb-0 bg-white dark:bg-slate-800 lg:bg-transparent shadow-sm lg:shadow-none gap-1.5 lg:gap-0">
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">SKU</span>
          <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${p.sku}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Producto</span>
          <div class="flex items-center gap-3 justify-end lg:justify-start">
            <div class="max-w-xs truncate cursor-pointer group text-right lg:text-left" onclick="openProductDetailsModal('${p.id}')">
              <span class="font-bold text-slate-800 dark:text-white block truncate group-hover:text-blue-600 transition-colors" title="${p.name}">${p.name}</span>
              <span class="text-[10px] text-slate-400 block">${p.brand}</span>
            </div>
          </div>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Categoría</span>
          <span class="text-slate-500 dark:text-slate-400">${p.category}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Marca</span>
          <span class="font-medium dark:text-slate-300">${p.brand}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Físico</span>
          <span class="font-bold dark:text-slate-200">${p.stock} uds</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Mínimo</span>
          <span class="text-slate-400 dark:text-slate-500 font-bold">${p.minStock} uds</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] inline-block ${statusPill}">${p.status}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Acciones</span>
          <div class="flex items-center justify-end lg:justify-center gap-1.5">
            <button onclick="adjustSingleStock('${p.id}')" class="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all" title="Ajustar Stock">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.openProductDetailsModal = function (productId) {
  const product = ERPState.products.find(p => p.id == productId);
  if (!product) return;
  const supplier = ERPState.suppliers ? ERPState.suppliers.find(s => s.id == product.supplierId) : null;
  const supplierName = supplier ? supplier.name : (product.supplierId || 'Desconocido');

  const container = document.getElementById("modal-container");
  const card = document.getElementById("modal-card");
  if (!container || !card) return;

  // Hacer este modal más grande (4xl) para el diseño avanzado
  card.classList.remove("max-w-lg", "rounded-2xl");
  card.classList.add("max-w-4xl", "rounded-3xl");

  // Elegir color según estado de stock
  const stockColor = product.stock <= product.minStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
  const stockBg = product.stock <= product.minStock ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10';
  const stockBorder = product.stock <= product.minStock ? 'border-red-100 dark:border-red-900/30' : 'border-emerald-100 dark:border-emerald-900/30';

  card.innerHTML = `
    <!-- Header Minimalista -->
    <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
      <h3 class="text-lg font-bold text-slate-800 dark:text-white font-display">Detalles del Producto</h3>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl">✕</button>
    </div>

    <!-- Contenido Principal -->
    <div class="p-6 space-y-6 bg-slate-50 dark:bg-slate-900/30">
      
      <!-- Ficha 1: Identificación e Información Básica -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start shadow-sm">
        <div class="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 flex-shrink-0">
          <img src="${product.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop'}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop'">
        </div>
        <div class="flex-1 w-full text-center sm:text-left">
          <div class="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase rounded">SKU: ${product.sku}</span>
            <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded">${product.brand}</span>
          </div>
          <h2 class="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">${product.name}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <p><span class="font-semibold text-slate-700 dark:text-slate-300">Categoría:</span> ${product.category}</p>
            <p><span class="font-semibold text-slate-700 dark:text-slate-300">Proveedor:</span> ${supplierName}</p>
          </div>
        </div>
      </div>

      <!-- Ficha 2: Métricas Comerciales y Stock -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Compra</p>
          <p class="text-lg font-bold text-slate-900 dark:text-white font-mono">${formatEuro(parseFloat(product.buyPrice))}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Venta</p>
          <p class="text-lg font-bold text-slate-900 dark:text-white font-mono">${formatEuro(parseFloat(product.sellPrice))}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 border ${stockBorder} rounded-xl p-4 shadow-sm">
          <p class="text-[10px] font-bold ${stockColor} opacity-90 uppercase tracking-wider mb-1">Stock Actual</p>
          <p class="text-lg font-bold ${stockColor} font-mono">${product.stock} <span class="text-xs font-normal text-slate-500">uds</span></p>
        </div>
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Mínimo</p>
          <p class="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">${product.minStock} <span class="text-xs font-normal text-slate-500">uds</span></p>
        </div>
      </div>

      <!-- Ficha 3: Especificaciones Adicionales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Logística -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Logística</h4>
          </div>
          <ul class="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
            <li class="px-4 py-3 flex justify-between items-center text-sm">
              <span class="text-slate-500 font-medium">Peso</span>
              <span class="text-slate-900 dark:text-white font-semibold font-mono">${product.weight || '-'}</span>
            </li>
            <li class="px-4 py-3 flex justify-between items-center text-sm">
              <span class="text-slate-500 font-medium">Dimensiones</span>
              <span class="text-slate-900 dark:text-white font-semibold font-mono text-xs">${product.dimensions || '-'}</span>
            </li>
          </ul>
        </div>

        <!-- Descripción -->
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Descripción</h4>
          </div>
          <div class="p-4 text-sm text-slate-600 dark:text-slate-400 flex-1 leading-relaxed">
            ${product.description ? product.description : '<span class="italic text-slate-400">No hay descripción disponible.</span>'}
          </div>
        </div>
      </div>

    </div>

    <!-- Footer Minimalista -->
    <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-white dark:bg-slate-800">
      <button onclick="closeModal()" class="px-5 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm">Cerrar Ficha</button>
    </div>
  `;

  container.classList.remove("hidden");
};

// Disparadores de búsqueda y filtros en línea
function triggerInventorySearch() {
  const val = document.getElementById("inv-search-input").value;
  inventoryFilters.search = val;
  inventoryFilters.page = 1;

  const clearBtn = document.getElementById("inv-clear-search-btn");
  if (clearBtn) {
    if (val.trim() !== "") {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  updateInventoryTable();
}

window.clearInventorySearch = function () {
  const searchInput = document.getElementById("inv-search-input");
  if (searchInput) {
    searchInput.value = "";
  }

  const clearBtn = document.getElementById("inv-clear-search-btn");
  if (clearBtn) {
    clearBtn.classList.add("hidden");
  }

  inventoryFilters.search = "";
  inventoryFilters.page = 1;
  updateInventoryTable();
};

// Controladores de desplegables personalizados para los filtros de inventario
function toggleInventoryCustomDropdown(menuId, chevronId) {
  const menu = document.getElementById(menuId);
  const chevron = document.getElementById(chevronId);
  if (!menu) return;

  const allMenus = ["inv-cat-dropdown-menu", "inv-status-dropdown-menu"];
  allMenus.forEach((id) => {
    if (id !== menuId) {
      const otherMenu = document.getElementById(id);
      if (otherMenu) {
        otherMenu.classList.add("hidden");
        otherMenu.classList.remove("opacity-100", "scale-100");
        otherMenu.classList.add("opacity-0", "scale-95");
      }
      const otherChevronId = id.includes("cat")
        ? "inv-cat-chevron"
        : "inv-status-chevron";
      const otherChevron = document.getElementById(otherChevronId);
      if (otherChevron) otherChevron.classList.remove("rotate-180");
    }
  });

  const isHidden = menu.classList.contains("hidden");
  if (isHidden) {
    menu.classList.remove("hidden");
    void menu.offsetWidth; // Forzar reflujo del navegador
    menu.classList.remove("opacity-0", "scale-95");
    menu.classList.add("opacity-100", "scale-100");
    if (chevron) chevron.classList.add("rotate-180");
  } else {
    menu.classList.remove("opacity-100", "scale-100");
    menu.classList.add("opacity-0", "scale-95");
    setTimeout(() => {
      if (menu.classList.contains("opacity-0")) {
        menu.classList.add("hidden");
      }
    }, 150);
    if (chevron) chevron.classList.remove("rotate-180");
  }
}

function selectInventoryCatOption(value, label) {
  inventoryFilters.category = value;
  inventoryFilters.page = 1;
  const labelSpan = document.getElementById("inv-cat-dropdown-label");
  if (labelSpan) labelSpan.innerText = label;

  const menu = document.getElementById("inv-cat-dropdown-menu");
  if (menu) {
    menu.classList.remove("opacity-100", "scale-100");
    menu.classList.add("opacity-0", "scale-95");
    setTimeout(() => menu.classList.add("hidden"), 150);
  }
  const chevron = document.getElementById("inv-cat-chevron");
  if (chevron) chevron.classList.remove("rotate-180");

  updateInventoryTable();
}

function selectInventoryStatusOption(value, label) {
  inventoryFilters.status = value;
  inventoryFilters.page = 1;
  const labelSpan = document.getElementById("inv-status-dropdown-label");
  if (labelSpan) labelSpan.innerText = label;

  const menu = document.getElementById("inv-status-dropdown-menu");
  if (menu) {
    menu.classList.remove("opacity-100", "scale-100");
    menu.classList.add("opacity-0", "scale-95");
    setTimeout(() => menu.classList.add("hidden"), 150);
  }
  const chevron = document.getElementById("inv-status-chevron");
  if (chevron) chevron.classList.remove("rotate-180");

  updateInventoryTable();
}

// Escuchador de clics global para cerrar desplegables al hacer clic fuera
if (!window.hasGlobalDropdownListener) {
  window.hasGlobalDropdownListener = true;
  document.addEventListener("click", function (e) {
    // Desplegable de categorías
    const catMenu = document.getElementById("inv-cat-dropdown-menu");
    const catContainer = document.getElementById("inv-cat-dropdown-container");
    if (catMenu && catContainer && !catContainer.contains(e.target)) {
      catMenu.classList.remove("opacity-100", "scale-100");
      catMenu.classList.add("opacity-0", "scale-95");
      setTimeout(() => {
        if (catMenu.classList.contains("opacity-0"))
          catMenu.classList.add("hidden");
      }, 150);
      const chevron = document.getElementById("inv-cat-chevron");
      if (chevron) chevron.classList.remove("rotate-180");
    }

    // Desplegable de estados
    const statusMenu = document.getElementById("inv-status-dropdown-menu");
    const statusContainer = document.getElementById(
      "inv-status-dropdown-container",
    );
    if (statusMenu && statusContainer && !statusContainer.contains(e.target)) {
      statusMenu.classList.remove("opacity-100", "scale-100");
      statusMenu.classList.add("opacity-0", "scale-95");
      setTimeout(() => {
        if (statusMenu.classList.contains("opacity-0"))
          statusMenu.classList.add("hidden");
      }, 150);
      const chevron = document.getElementById("inv-status-chevron");
      if (chevron) chevron.classList.remove("rotate-180");
    }

    // Desplegable de proveedor en compras
    const purSupMenu = document.getElementById(
      "purchase-supplier-dropdown-menu",
    );
    const purSupContainer = document.getElementById(
      "purchase-supplier-dropdown-container",
    );
    if (purSupMenu && purSupContainer && !purSupContainer.contains(e.target)) {
      purSupMenu.classList.remove("opacity-100", "scale-100");
      purSupMenu.classList.add("opacity-0", "scale-95");
      setTimeout(() => {
        if (purSupMenu.classList.contains("opacity-0"))
          purSupMenu.classList.add("hidden");
      }, 150);
      const chevron = document.getElementById("purchase-supplier-chevron");
      if (chevron) chevron.classList.remove("rotate-180");
    }
  });
}

function invPrevPage() {
  if (inventoryFilters.page > 1) {
    inventoryFilters.page--;
    updateInventoryTable();
  }
}

function invNextPage() {
  inventoryFilters.page++;
  updateInventoryTable();
}

// Simulación de exportación a CSV
function exportInventoryToCSV() {
  let csv =
    "SKU;Producto;Categoria;Marca;Stock;StockMinimo;PrecioCompra;PrecioVenta;Estado\n";
  ERPState.products.forEach((p) => {
    csv += `${p.sku};${p.name};${p.category};${p.brand};${p.stock};${p.minStock};${p.buyPrice};${p.sellPrice};${p.status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `inventario_anaya_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Listado exportado correctamente en formato CSV.", "success");
}

// Abrir modal de ajuste manual de stock
async function openInventoryAdjustmentModal() {
  // Obtener productos primero para asegurar que los valores de stock estén actualizados
  try {
    const res = await fetch("api/get_products.php");
    const data = await res.json();
    if (data.success) {
      ERPState.products = data.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        supplierId: p.supplier_id,
        supplierName: p.supplier_name,
        buyPrice: parseFloat(p.buy_price) || 0,
        sellPrice: parseFloat(p.sell_price) || 0,
        stock: parseInt(p.stock) || 0,
        minStock: parseInt(p.min_stock) || 0,
        weight: p.weight,
        dimensions: p.dimensions,
        image: p.image_url,
        description: p.description,
        status: p.status,
      }));
    }
  } catch (err) {
    console.error("Error fetching products list for adjustment modal:", err);
  }

  const productsOptions = ERPState.products
    .map(
      (p) =>
        `<option value="${p.id}">${p.sku} — ${p.name} (Stock: ${p.stock})</option>`,
    )
    .join("");

  openModal(`
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold dark:text-white">Ajuste de Stock Manual</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <form id="form-stock-adjust" class="space-y-4" onsubmit="saveStockAdjustment(event)">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccione Producto</label>
          <select id="adj-product" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
            ${productsOptions}
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cantidad de Ajuste</label>
            <input type="number" id="adj-qty" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" placeholder="Ej: 5 o -3">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo Movimiento</label>
            <select id="adj-type" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
              <option value="Ajuste">Ajuste técnico</option>
              <option value="Entrada">Entrada manual</option>
              <option value="Salida">Salida manual</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo / Justificación</label>
          <textarea id="adj-reason" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white h-24" placeholder="Indique el porqué del ajuste..."></textarea>
        </div>
        <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md mt-2">
          Guardar Ajuste de Stock
        </button>
      </form>
    </div>
  `);
}

async function saveStockAdjustment(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const prodId = document.getElementById("adj-product").value;
  const qty = parseInt(document.getElementById("adj-qty").value);
  const type = document.getElementById("adj-type").value;
  const reason = document.getElementById("adj-reason").value;

  const prd = ERPState.products.find((p) => p.id == prodId);
  if (!prd) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    return;
  }

  const payload = {
    productId: parseInt(prodId),
    qty: qty,
    type: type,
    reason: reason,
  };

  try {
    const res = await fetch("api/adjust_stock.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Stock ajustado con éxito.", "success");
      closeModal();
      await updateInventoryTable();
    } else {
      showToast(
        data.message || "Error al guardar el ajuste de stock.",
        "error",
      );
    }
  } catch (err) {
    console.error("Error saving stock adjustment:", err);
    showToast("Error de red al guardar ajuste.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

async function adjustSingleStock(id) {
  await openInventoryAdjustmentModal();
  const select = document.getElementById("adj-product");
  if (select) select.value = id;
}

// Abrir modal de historial de movimientos
let movementsPage = 1;
const movementsLimit = 10;
let filteredMovements = [];

// Abrir modal de historial de movimientos
async function openMovementsLogModal() {
  movementsPage = 1; // Resetear a página 1
  try {
    const res = await fetch("api/get_movements.php");
    const data = await res.json();
    if (data.success) {
      ERPState.movements = data.movements;
    }
  } catch (err) {
    console.error("Error fetching movements list:", err);
  }

  openModal(
    `
    <div class="p-6 max-h-[85vh] flex flex-col">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-xl font-bold dark:text-white">Registro Histórico de Movimientos</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Auditoría completa de todas las entradas, salidas y ajustes técnicos de stock.</p>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
      </div>

      <!-- DATE RANGE FILTERS -->
      <div class="flex flex-wrap gap-4 items-end bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 mb-5 text-xs">
        <div class="flex-1 min-w-[140px]">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Fecha Inicial</label>
          <input type="date" id="mov-filter-start" onchange="renderMovementsRows(true)" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
        </div>
        <div class="flex-1 min-w-[140px]">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Fecha Final</label>
          <input type="date" id="mov-filter-end" onchange="renderMovementsRows(true)" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="clearMovementsDateFilters()" class="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-white font-semibold rounded-xl text-xs transition-all shadow-sm">
            Limpiar Filtros
          </button>
          <button onclick="exportMovementsToCSV()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Descargar
          </button>
        </div>
      </div>

      <div class="overflow-y-auto overflow-x-hidden flex-1 border border-slate-200/60 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-850">
        <table class="w-full text-left text-sm border-collapse table-fixed">
          <thead class="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200/60 dark:border-slate-700 z-10">
            <tr class="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <th class="py-3 px-4 w-28">Fecha</th>
              <th class="py-3 px-4 w-24 text-center">SKU</th>
              <th class="py-3 px-4 w-44">Producto</th>
              <th class="py-3 px-4 w-28 text-center">Tipo</th>
              <th class="py-3 px-4 w-24 text-center">Cantidad</th>
              <th class="py-3 px-4">Motivo / Justificación</th>
            </tr>
          </thead>
          <tbody id="movements-table-body" class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <!-- Dynamically populated -->
          </tbody>
        </table>
      </div>

      <!-- PAGINATION BAR -->
      <div class="px-2 py-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4">
        <span id="movements-showing-text">Mostrando 0-0 de 0 registros</span>
        <div class="flex items-center gap-1">
          <button onclick="movementsPrevPage()" class="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40" id="btn-mov-prev">Anterior</button>
          <span class="px-3" id="mov-page-num">Pág 1 de 1</span>
          <button onclick="movementsNextPage()" class="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40" id="btn-mov-next">Siguiente</button>
        </div>
      </div>
    </div>
  `,
    "max-w-5xl",
  );

  // Cargar datos iniciales
  renderMovementsRows(true);
}

function renderMovementsRows(resetPage = false) {
  const body = document.getElementById("movements-table-body");
  if (!body) return;

  if (resetPage) {
    movementsPage = 1;
  }

  const startVal = document.getElementById("mov-filter-start").value;
  const endVal = document.getElementById("mov-filter-end").value;

  let filtered = [...ERPState.movements];

  // Aplicar filtros de fecha si están definidos
  if (startVal) {
    filtered = filtered.filter((m) => m.date >= startVal);
  }
  if (endVal) {
    filtered = filtered.filter((m) => m.date <= endVal);
  }

  // Guardar en la variable caché global
  filteredMovements = filtered;

  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / movementsLimit) || 1;

  if (movementsPage > totalPages) {
    movementsPage = totalPages;
  }

  const btnPrev = document.getElementById("btn-mov-prev");
  const btnNext = document.getElementById("btn-mov-next");
  if (btnPrev) btnPrev.disabled = movementsPage === 1;
  if (btnNext) btnNext.disabled = movementsPage === totalPages;

  const showingText = document.getElementById("movements-showing-text");
  if (showingText) {
    const startIdx = (movementsPage - 1) * movementsLimit;
    const endIdx = Math.min(startIdx + movementsLimit, totalRecords);
    showingText.innerText =
      totalRecords > 0
        ? `Mostrando ${startIdx + 1}-${endIdx} de ${totalRecords} registros`
        : `Mostrando 0-0 de 0 registros`;
  }

  const pageNum = document.getElementById("mov-page-num");
  if (pageNum) {
    pageNum.innerText = `Pág ${movementsPage} de ${totalPages}`;
  }

  if (filtered.length === 0) {
    body.innerHTML =
      '<tr><td colspan="6" class="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">Sin movimientos registrados en este rango de fechas.</td></tr>';
    return;
  }

  // Paginación y ordenar por más reciente
  const paginated = filtered
    .slice()
    .reverse()
    .slice(
      (movementsPage - 1) * movementsLimit,
      movementsPage * movementsLimit,
    );

  body.innerHTML = paginated
    .map((m) => {
      let typeBadge = "";
      if (m.type === "Entrada") {
        typeBadge = `<span class="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/20">Entrada</span>`;
      } else if (m.type === "Salida") {
        typeBadge = `<span class="inline-block px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase border border-red-500/20">Salida</span>`;
      } else {
        typeBadge = `<span class="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase border border-blue-500/20">Ajuste</span>`;
      }

      const qtyColor =
        m.qty > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : m.qty < 0
            ? "text-red-600 dark:text-red-400"
            : "text-slate-500 dark:text-slate-400";
      const qtySign = m.qty > 0 ? "+" : "";

      return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 text-xs border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 transition-colors">
        <td class="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-28 whitespace-nowrap">${m.date}</td>
        <td class="py-3 px-4 text-center w-24">
          <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">${m.sku}</span>
        </td>
        <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-[150px] truncate" title="${m.productName}">${m.productName}</td>
        <td class="py-3 px-4 text-center w-24">${typeBadge}</td>
        <td class="py-3 px-4 font-extrabold text-center text-sm w-24 ${qtyColor}">${qtySign}${m.qty}</td>
        <td class="py-3 px-4 text-slate-555 dark:text-slate-300 whitespace-normal break-words max-w-sm">${m.reason}</td>
      </tr>
    `;
    })
    .join("");
}

function movementsPrevPage() {
  if (movementsPage > 1) {
    movementsPage--;
    renderMovementsRows(false);
  }
}

function movementsNextPage() {
  const totalRecords = filteredMovements.length;
  const totalPages = Math.ceil(totalRecords / movementsLimit) || 1;
  if (movementsPage < totalPages) {
    movementsPage++;
    renderMovementsRows(false);
  }
}

function clearMovementsDateFilters() {
  const start = document.getElementById("mov-filter-start");
  const end = document.getElementById("mov-filter-end");
  if (start) start.value = "";
  if (end) end.value = "";
  renderMovementsRows(true);
}

function exportMovementsToCSV() {
  let csv = "Fecha;SKU;Producto;Tipo;Cantidad;Motivo\n";
  // Exportar en orden cronológico inverso (el más reciente primero)
  filteredMovements
    .slice()
    .reverse()
    .forEach((m) => {
      csv += `${m.date};${m.sku};"${m.productName.replace(/"/g, '""')}";${m.type};${m.qty};"${m.reason.replace(/"/g, '""')}"\n`;
    });

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `informe_movimientos_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================== PRODUCT FORM & CRUD RENDERER ====================
let activeEditProductId = null;

// ==================== PRODUCT CATEGORY HELPERS ====================
async function loadCategories(selectElementId, selectedValue = "") {
  const select = document.getElementById(selectElementId);
  if (!select) return;

  try {
    const res = await fetch("api/get_categories.php");
    const data = await res.json();
    if (data.success) {
      select.innerHTML = data.categories
        .map(
          (c) =>
            `<option value="${c.name}" ${c.name === selectedValue ? "selected" : ""}>${c.name}</option>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Error loading categories list:", err);
  }
}

async function loadBrands(selectElementId, selectedValue = "") {
  const select = document.getElementById(selectElementId);
  if (!select) return;

  try {
    const res = await fetch("api/get_brands.php");
    const data = await res.json();
    if (data.success) {
      select.innerHTML = data.brands
        .map(
          (b) =>
            `<option value="${b.name}" ${b.name === selectedValue ? "selected" : ""}>${b.name}</option>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Error loading brands list:", err);
  }
}

async function addNewCategoryAction() {
  const catName = prompt("Introduzca el nombre de la nueva categoría:");
  if (!catName) return;
  const trimmed = catName.trim();
  if (trimmed === "") return;

  try {
    const res = await fetch("api/save_category.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Categoría añadida con éxito.", "success");
      // Recargar el selector de categoría de producto y seleccionar automáticamente la categoría recién creada
      await loadCategories("prod-category", trimmed);
    } else {
      showToast(data.message || "Error al guardar categoría.", "error");
    }
  } catch (err) {
    console.error("Error adding category:", err);
    showToast("Error de red al añadir categoría.", "error");
  }
}

function updateProductImagePreview(url) {
  const preview = document.getElementById("prod-image-preview");
  const placeholder = document.getElementById("prod-image-placeholder");
  const loading = document.getElementById("prod-image-loading");

  if (!preview || !placeholder) return;

  const hasImage =
    url && url.trim() !== "" && !url.includes("images.unsplash.com");

  if (hasImage) {
    if (loading) loading.classList.remove("hidden");
    placeholder.classList.add("hidden");
    preview.classList.add("hidden"); // Ocultar mientras descarga

    preview.onload = function () {
      if (loading) loading.classList.add("hidden");
      preview.classList.remove("hidden");
    };

    preview.onerror = function () {
      if (loading) loading.classList.add("hidden");
      preview.classList.add("hidden");
      placeholder.classList.remove("hidden");
    };

    preview.src = url;
  } else {
    preview.src = "";
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
    if (loading) loading.classList.add("hidden");
  }
}

async function uploadProductImageAction(e) {
  const file = e.target.files[0];
  if (!file) return;

  const input = document.getElementById("prod-image");

  if (!file.type.startsWith("image/")) {
    showToast("Por favor seleccione un archivo de imagen válido.", "error");
    return;
  }

  showToast("Subiendo imagen...", "info");

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("api/upload_image.php", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      input.value = data.url;
      updateProductImagePreview(data.url);
      showToast("Imagen cargada con éxito.", "success");
    } else {
      showToast(data.message || "Error al subir la imagen.", "error");
    }
  } catch (err) {
    console.error("Error uploading image:", err);
    showToast("Error de red al subir la imagen.", "error");
  }
}

function switchProductImageTab(tab) {
  const tabUpload = document.getElementById("tab-img-upload");
  const tabUrl = document.getElementById("tab-img-url");
  const panelUpload = document.getElementById("panel-img-upload");
  const panelUrl = document.getElementById("panel-img-url");

  if (!tabUpload || !tabUrl || !panelUpload || !panelUrl) return;

  if (tab === "upload") {
    tabUpload.className =
      "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 pb-1 focus:outline-none transition-all";
    tabUrl.className =
      "hover:text-slate-600 dark:hover:text-slate-200 pb-1 focus:outline-none transition-all";
    panelUpload.classList.remove("hidden");
    panelUrl.classList.add("hidden");
  } else {
    tabUrl.className =
      "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 pb-1 focus:outline-none transition-all";
    tabUpload.className =
      "hover:text-slate-600 dark:hover:text-slate-200 pb-1 focus:outline-none transition-all";
    panelUrl.classList.remove("hidden");
    panelUpload.classList.add("hidden");
  }
}

function updateImagePreviewFromUrl(url) {
  updateProductImagePreview(url);
}

// ==================== CATEGORIES CRM MODULE RENDERER ====================
let activeEditCategoryId = null;

async function renderCategoriesModule(container) {
  const isAdmin = ERPState.session && ERPState.session.role === "admin";
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-toast-in">
      ${isAdmin ? `
      <!-- CATEGORY FORM -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium animate-toast-in h-fit">
        <div class="mb-6">
          <h2 id="category-form-title" class="text-2xl font-extrabold tracking-tight dark:text-white">Añadir Categoría</h2>
          <p id="category-form-desc" class="text-xs text-slate-400 dark:text-slate-400 mt-1">Configure categorías del catálogo de productos.</p>
        </div>

        <form id="form-category" class="space-y-4" onsubmit="saveCategoryFromModule(event)">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Categoría *</label>
            <input type="text" id="cat-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Iluminación">
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
              Guardar Categoría
            </button>
            <button type="button" onclick="cancelCategoryModuleEdit()" id="btn-cat-cancel" class="hidden px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      ` : ''}

      <!-- CATEGORIES LIST -->
      <div class="col-span-1 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Listado de Categorías</h2>
            <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Gestione las categorías del sistema.</p>
          </div>
          <input type="text" id="cat-list-search" oninput="updateCategoriesModuleList()" class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" placeholder="Buscar categoría...">
        </div>

        <div class="overflow-y-auto flex-1 pr-2 space-y-3" id="categories-list-container">
          <!-- Populado por JS -->
        </div>
      </div>
    </div>
  `;

  activeEditCategoryId = null;
  await updateCategoriesModuleList();
}

async function updateCategoriesModuleList() {
  const container = document.getElementById("categories-list-container");
  if (!container) return;

  const isAdmin = ERPState.session && ERPState.session.role === "admin";

  let categories = [];
  try {
    const res = await fetch("api/get_categories.php");
    const data = await res.json();
    if (data.success) {
      categories = data.categories;
    }
  } catch (err) {
    console.error("Error fetching categories list:", err);
  }

  const searchInput = document.getElementById("cat-list-search");
  const search = searchInput ? searchInput.value.toLowerCase() : "";

  let filtered = [...categories];
  if (search) {
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(search));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p>No se encontraron categorías registradas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((c) => {
      return `
      <div class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all">
        <div class="overflow-hidden mr-2">
          <h4 class="font-bold text-slate-800 dark:text-white truncate text-sm" title="${c.name}">${c.name}</h4>
        </div>
        ${isAdmin ? `
        <div class="flex-shrink-0 flex items-center gap-1.5 animate-toast-in">
          <button onclick="editCategoryModuleAction('${c.id}', '${c.name.replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-blue-600 text-xs px-2.5 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-semibold">Editar</button>
          <button onclick="deleteCategoryModuleAction('${c.id}', '${c.name.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-650 text-xs px-2.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold">Eliminar</button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");
}

function editCategoryModuleAction(id, name) {
  activeEditCategoryId = id;
  document.getElementById("category-form-title").innerText = "Editar Categoría";
  document.getElementById("category-form-desc").innerText =
    "Modifique el nombre de la categoría seleccionada.";
  document.getElementById("cat-name").value = name;
  document.getElementById("btn-cat-cancel").classList.remove("hidden");
}

function cancelCategoryModuleEdit() {
  activeEditCategoryId = null;
  const form = document.getElementById("form-category");
  if (form) form.reset();

  document.getElementById("category-form-title").innerText = "Añadir Categoría";
  document.getElementById("category-form-desc").innerText =
    "Configure categorías del catálogo de productos.";
  document.getElementById("btn-cat-cancel").classList.add("hidden");
}

async function saveCategoryFromModule(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const name = document.getElementById("cat-name").value.trim();
  if (!name) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    return;
  }

  const payload = {
    id: activeEditCategoryId ? parseInt(activeEditCategoryId) : 0,
    name: name,
  };

  try {
    const res = await fetch("api/save_category.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Categoría guardada con éxito.", "success");
      cancelCategoryModuleEdit();
      await updateCategoriesModuleList();
    } else {
      showToast(data.message || "Error al guardar categoría.", "error");
    }
  } catch (err) {
    console.error("Error saving category from module:", err);
    showToast("Error de red al guardar categoría.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

async function deleteCategoryModuleAction(id, name) {
  if (
    confirm(
      `¿Está seguro que desea eliminar la categoría "${name}"? Esto no afectará a los productos que ya tienen esta categoría asignada.`,
    )
  ) {
    try {
      const res = await fetch("api/delete_category.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(id) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Categoría "${name}" eliminada.`, "warning");
        await updateCategoriesModuleList();
      } else {
        showToast(data.message || "Error al eliminar categoría.", "error");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      showToast("Error de red al eliminar categoría.", "error");
    }
  }
}

// ==================== BRANDS CRM MODULE RENDERER ====================
let activeEditBrandId = null;

async function renderBrandsModule(container) {
  const isAdmin = ERPState.session && ERPState.session.role === "admin";
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-toast-in">
      ${isAdmin ? `
      <!-- BRAND FORM -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium animate-toast-in h-fit">
        <div class="mb-6">
          <h2 id="brand-form-title" class="text-2xl font-extrabold tracking-tight dark:text-white">Añadir Marca</h2>
          <p id="brand-form-desc" class="text-xs text-slate-400 dark:text-slate-400 mt-1">Configure marcas del catálogo de productos.</p>
        </div>

        <form id="form-brand" class="space-y-4" onsubmit="saveBrandFromModule(event)">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Marca *</label>
            <input type="text" id="brand-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Anaya Comfort">
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
              Guardar Marca
            </button>
            <button type="button" onclick="cancelBrandModuleEdit()" id="btn-brand-cancel" class="hidden px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      ` : ''}

      <!-- BRANDS LIST -->
      <div class="col-span-1 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Listado de Marcas</h2>
            <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Gestione las marcas del sistema.</p>
          </div>
          <input type="text" id="brand-list-search" oninput="updateBrandsModuleList()" class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" placeholder="Buscar marca...">
        </div>

        <div class="overflow-y-auto flex-1 pr-2 space-y-3" id="brands-list-container">
          <!-- Populado por JS -->
        </div>
      </div>
    </div>
  `;

  activeEditBrandId = null;
  await updateBrandsModuleList();
}

async function updateBrandsModuleList() {
  const container = document.getElementById("brands-list-container");
  if (!container) return;

  const isAdmin = ERPState.session && ERPState.session.role === "admin";

  let brands = [];
  try {
    const res = await fetch("api/get_brands.php");
    const data = await res.json();
    if (data.success) {
      brands = data.brands;
    }
  } catch (err) {
    console.error("Error fetching brands list:", err);
  }

  const searchInput = document.getElementById("brand-list-search");
  const search = searchInput ? searchInput.value.toLowerCase() : "";

  let filtered = [...brands];
  if (search) {
    filtered = filtered.filter((b) => b.name.toLowerCase().includes(search));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p>No se encontraron marcas registradas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((b) => {
      return `
      <div class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all">
        <div class="overflow-hidden mr-2">
          <h4 class="font-bold text-slate-800 dark:text-white truncate text-sm" title="${b.name}">${b.name}</h4>
        </div>
        ${isAdmin ? `
        <div class="flex-shrink-0 flex items-center gap-1.5 animate-toast-in">
          <button onclick="editBrandModuleAction('${b.id}', '${b.name.replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-blue-600 text-xs px-2.5 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-semibold">Editar</button>
          <button onclick="deleteBrandModuleAction('${b.id}', '${b.name.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-650 text-xs px-2.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold">Eliminar</button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");
}

function editBrandModuleAction(id, name) {
  activeEditBrandId = id;
  document.getElementById("brand-form-title").innerText = "Editar Marca";
  document.getElementById("brand-form-desc").innerText =
    "Modifique el nombre de la marca seleccionada.";
  document.getElementById("brand-name").value = name;
  document.getElementById("btn-brand-cancel").classList.remove("hidden");
}

function cancelBrandModuleEdit() {
  activeEditBrandId = null;
  const form = document.getElementById("form-brand");
  if (form) form.reset();

  document.getElementById("brand-form-title").innerText = "Añadir Marca";
  document.getElementById("brand-form-desc").innerText =
    "Configure marcas del catálogo de productos.";
  document.getElementById("btn-brand-cancel").classList.add("hidden");
}

async function saveBrandFromModule(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const name = document.getElementById("brand-name").value.trim();
  if (!name) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    return;
  }

  const payload = {
    id: activeEditBrandId ? parseInt(activeEditBrandId) : 0,
    name: name,
  };

  try {
    const res = await fetch("api/save_brand.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Marca guardada con éxito.", "success");
      cancelBrandModuleEdit();
      await updateBrandsModuleList();
    } else {
      showToast(data.message || "Error al guardar marca.", "error");
    }
  } catch (err) {
    console.error("Error saving brand from module:", err);
    showToast("Error de red al guardar marca.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

async function deleteBrandModuleAction(id, name) {
  if (
    confirm(
      `¿Está seguro que desea eliminar la marca "${name}"? Esto no afectará a los productos que ya tienen esta marca asignada.`,
    )
  ) {
    try {
      const res = await fetch("api/delete_brand.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(id) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Marca "${name}" eliminada.`, "warning");
        await updateBrandsModuleList();
      } else {
        showToast(data.message || "Error al eliminar marca.", "error");
      }
    } catch (err) {
      console.error("Error deleting brand:", err);
      showToast("Error de red al eliminar marca.", "error");
    }
  }
}

async function renderProductsModule(container) {
  // Obtener proveedores para poblar el desplegable
  try {
    const res = await fetch("api/get_suppliers.php");
    const data = await res.json();
    if (data.success) {
      ERPState.suppliers = data.suppliers.map((s) => ({
        id: s.id,
        customId: s.custom_id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        address: s.address,
        status: s.status,
      }));
    }
  } catch (err) {
    console.error("Error fetching suppliers for products module:", err);
  }

  const suppliersOptions = ERPState.suppliers
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-toast-in">
      <!-- FORM COLUMN -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium h-fit">
        <div class="mb-6">
          <h2 id="prod-form-title" class="text-2xl font-extrabold tracking-tight dark:text-white">Añadir Referencia</h2>
          <p id="prod-form-desc" class="text-xs text-slate-400 dark:text-slate-400 mt-1">Habilite nuevos artículos y configure los precios fiscales para Anaya Outlet.</p>
        </div>

        <form id="form-product" class="space-y-4" onsubmit="saveProduct(event)">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Producto *</label>
            <input type="text" id="prod-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Colchón Viscoelástico Anaya Active">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SKU Único *</label>
              <input type="text" id="prod-sku" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: COL-AA-051">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Marca *</label>
              <select id="prod-brand" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
                <!-- Creado dinámicamente -->
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría *</label>
            <select id="prod-category" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
              <!-- Creado dinámicamente -->
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proveedor Principal</label>
            <select id="prod-supplier" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white">
              ${suppliersOptions}
            </select>
          </div>

          <!-- PRICING CALCULATOR -->
          <div class="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/60 space-y-4">
            <span class="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Fijación de Márgenes</span>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Precio Compra *</label>
                <div class="relative">
                  <input type="text" id="prod-buy" required oninput="formatEuroOnInput(this); calcProductMargin();" onblur="onCurrencyInputBlur(this); calcProductMargin();" class="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="0,00">
                  <span class="absolute right-3.5 top-3 text-xs text-slate-400">€</span>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Precio Venta *</label>
                <div class="relative">
                  <input type="text" id="prod-sell" required oninput="formatEuroOnInput(this); calcProductMargin();" onblur="onCurrencyInputBlur(this); calcProductMargin();" class="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="0,00">
                  <span class="absolute right-3.5 top-3 text-xs text-slate-400">€</span>
                </div>
              </div>
            </div>
            <!-- Margin Stats display -->
            <div class="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-3 text-slate-500">
              <span>Margen Neto: <b id="prod-margin-val" class="text-emerald-500 font-bold">0.00 €</b></span>
              <span>Markup: <b id="prod-markup-val" class="text-blue-500 font-bold">0.0%</b></span>
            </div>
          </div>

          <input type="hidden" id="prod-stock" value="0">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Mínimo (Alerta de Stock Bajo) *</label>
            <input type="number" id="prod-min-stock" min="0" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: 5" value="0">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Peso (kg)</label>
              <input type="text" id="prod-weight" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: 12kg">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dimensiones</label>
              <input type="text" id="prod-dims" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: 120x60x75 cm">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Imagen del Producto</label>
            <div class="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <!-- Preview thumbnail -->
              <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center relative">
                <img id="prod-image-preview" src="" class="w-full h-full object-cover hidden">
                <div id="prod-image-placeholder" class="text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <!-- Spinner de carga -->
                <div id="prod-image-loading" class="hidden absolute inset-0 bg-slate-55 dark:bg-slate-900 flex items-center justify-center">
                  <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              
              <!-- Tabbed panel -->
              <div class="flex-1 space-y-2">
                <!-- Tab buttons -->
                <div class="flex border-b border-slate-100 dark:border-slate-700 pb-1 text-[11px] font-bold text-slate-400 gap-3">
                  <button type="button" id="tab-img-upload" onclick="switchProductImageTab('upload')" class="text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 pb-1 focus:outline-none transition-all">Subir Archivo</button>
                  <button type="button" id="tab-img-url" onclick="switchProductImageTab('url')" class="hover:text-slate-600 dark:hover:text-slate-200 pb-1 focus:outline-none transition-all">Pegar URL</button>
                </div>
                
                <!-- Tab contents -->
                <!-- Tab 1: Upload -->
                <div id="panel-img-upload" class="block pt-1">
                  <label class="cursor-pointer flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-blue-500/5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all shadow-sm">
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    <span>Seleccionar Imagen</span>
                    <input type="file" id="prod-image-file" accept="image/*" class="hidden" onchange="uploadProductImageAction(event)">
                  </label>
                </div>
                
                <!-- Tab 2: URL -->
                <div id="panel-img-url" class="hidden pt-1">
                  <input type="text" id="prod-image" oninput="updateImagePreviewFromUrl(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="https://ejemplo.com/imagen.jpg">
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</label>
            <textarea id="prod-desc" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white h-20" placeholder="Escriba los detalles o especificaciones..."></textarea>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
              Guardar Referencia
            </button>
            <button type="button" onclick="cancelProductEdit()" id="btn-prod-cancel" class="hidden px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- LIST COLUMN -->
      <div class="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Referencias Catalogadas</h2>
            <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Busque de forma instantánea y gestione el inventario en el catálogo.</p>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" id="prod-list-search" oninput="updateProductsList()" class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:w-64" placeholder="Filtrar por SKU o Nombre...">
            <button type="button" onclick="showImportModal()" class="px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 border border-blue-500/15" title="Importar desde CSV">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>Importar</span>
            </button>
          </div>
        </div>

        <div class="overflow-y-auto flex-1 pr-2 space-y-3" id="products-list-container">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;

  activeEditProductId = null;
  await loadCategories("prod-category");
  await loadBrands("prod-brand");
  await updateProductsList();
}

// ==================== IMPORTACIÓN MASIVA DE PRODUCTOS VIA CSV ====================

window.downloadCSVTemplate = function(e) {
  if (e) e.preventDefault();
  const sep = "sep=;\n";
  const headers = "sku;name;category;brand;buyPrice;sellPrice;stock;minStock;weight;dimensions;description\n";
  const row1 = "COL-AA-051;Colchon Viscoelastico Anaya Active;Dormitorio;Anaya Active;120,00;250,00;10;2;22kg;150x190x25 cm;Colchon ergonomico de alta firmeza.\n";
  const row2 = "SOF-C-200;Sofa Cama Premium Velvet;Sofas y Descanso;Anaya Comfort;250,00;499,00;4;1;45kg;200x95x90 cm;Sofa tapizado en terciopelo gris convertible.\n";
  
  // Agregar BOM UTF-8 para evitar caracteres extraños y forzar separador de punto y coma en Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + sep + headers + row1 + row2], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "plantilla_productos_anaya.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.showImportModal = function() {
  const modalHtml = `
    <!-- Header Minimalista -->
    <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
      <h3 class="text-lg font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        Importar Productos desde CSV
      </h3>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl">✕</button>
    </div>
    
    <!-- Contenido Principal -->
    <div class="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto max-h-[70vh]">
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
          <span class="text-slate-500 dark:text-slate-400 leading-relaxed">Formatos admitidos: <b>.csv</b> (delimitado por comas o punto y coma). El archivo debe tener como mínimo las columnas <b>sku</b> y <b>name</b>.</span>
          <a href="#" onclick="downloadCSVTemplate(event)" class="px-3.5 py-2 border border-blue-500/25 dark:border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs flex-shrink-0 self-start sm:self-center shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Descargar Plantilla
          </a>
        </div>
        
        <!-- Drag and drop zone -->
        <label id="csv-dropzone" class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-blue-500/5 p-8 rounded-2xl cursor-pointer transition-all text-center">
          <svg class="w-10 h-10 text-slate-450 dark:text-slate-500 mb-3 animate-pulse" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span class="text-sm font-bold text-slate-700 dark:text-slate-200 block mb-1">Arrastra tu archivo CSV aquí</span>
          <span class="text-xs text-slate-400 dark:text-slate-500">o haz clic para explorar tu equipo</span>
          <input type="file" id="csv-file-input" accept=".csv" class="hidden" onchange="handleCSVFileSelect(event)">
        </label>
      </div>

      <!-- Preview container -->
      <div id="import-preview-section" class="hidden space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vista Previa de Productos a Importar</span>
          <span id="import-summary-badge" class="px-2.5 py-1 text-xs font-extrabold rounded-full"></span>
        </div>
        <div class="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm max-h-[300px] overflow-y-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850">
              <tr>
                <th class="px-4 py-2.5">SKU</th>
                <th class="px-4 py-2.5">Nombre</th>
                <th class="px-4 py-2.5">Categoría</th>
                <th class="px-4 py-2.5">Marca</th>
                <th class="px-4 py-2.5">P. Compra</th>
                <th class="px-4 py-2.5">P. Venta</th>
                <th class="px-4 py-2.5">Stock</th>
                <th class="px-4 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody id="import-preview-tbody" class="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              <!-- Rendered lines -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/30">
      <button onclick="closeModal()" class="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl text-sm transition-all">Cancelar</button>
      <button id="btn-confirm-import" onclick="submitImportAction()" disabled class="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md">Confirmar Importación</button>
    </div>
  `;
  openModal(modalHtml, "max-w-4xl");
};

window.handleCSVFileSelect = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    parseAndPreviewCSV(text);
  };
  reader.readAsText(file, "UTF-8");
};

function parseCSV(text) {
  let lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return [];
  
  let delimiter = ',';
  if (lines[0].toLowerCase().startsWith('sep=')) {
    delimiter = lines[0].substring(4).trim();
    lines.shift(); // Descartar la línea sep= del parsing
    if (lines.length === 0) return [];
  } else {
    // Detectar delimitador: comas vs punto y coma en la cabecera
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    delimiter = semicolonCount > commaCount ? ';' : ',';
  }

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => {
      if (val.startsWith('"') && val.endsWith('"')) {
        return val.slice(1, -1).replace(/""/g, '"');
      }
      return val;
    });
  };

  return lines.map(parseLine);
}

function parseAndPreviewCSV(text) {
  const parsed = parseCSV(text);
  if (parsed.length < 2) {
    showToast("El archivo CSV está vacío o le faltan datos.", "error");
    return;
  }
  
  const headers = parsed[0].map(h => h.toLowerCase().trim());
  const rows = parsed.slice(1);
  
  // Encontrar índices de columnas soportando español e inglés
  const skuIdx = headers.indexOf("sku");
  const nameIdx = headers.indexOf("name") !== -1 ? headers.indexOf("name") : headers.indexOf("nombre");
  const categoryIdx = headers.indexOf("category") !== -1 ? headers.indexOf("category") : headers.indexOf("categoría");
  const brandIdx = headers.indexOf("brand") !== -1 ? headers.indexOf("brand") : headers.indexOf("marca");
  const buyPriceIdx = headers.indexOf("buyprice") !== -1 ? headers.indexOf("buyprice") : headers.indexOf("precio_compra");
  const sellPriceIdx = headers.indexOf("sellprice") !== -1 ? headers.indexOf("sellprice") : headers.indexOf("precio_venta");
  const stockIdx = headers.indexOf("stock") !== -1 ? headers.indexOf("stock") : headers.indexOf("cantidad");
  const minStockIdx = headers.indexOf("minstock") !== -1 ? headers.indexOf("minstock") : headers.indexOf("stock_minimo");
  const weightIdx = headers.indexOf("weight") !== -1 ? headers.indexOf("weight") : headers.indexOf("peso");
  const dimensionsIdx = headers.indexOf("dimensions") !== -1 ? headers.indexOf("dimensions") : headers.indexOf("dimensiones");
  const descriptionIdx = headers.indexOf("description") !== -1 ? headers.indexOf("description") : headers.indexOf("descripción");
  
  if (skuIdx === -1 || nameIdx === -1) {
    showToast("El archivo CSV debe contener obligatoriamente las columnas 'sku' y 'name' (o 'nombre').", "error");
    return;
  }
  
  const parsedProducts = [];
  let errorCount = 0;
  
  rows.forEach((row, i) => {
    if (row.length === 0 || (row.length === 1 && !row[0])) return;
    
    const sku = row[skuIdx] ? row[skuIdx].trim() : '';
    const name = row[nameIdx] ? row[nameIdx].trim() : '';
    const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : 'General';
    const brand = brandIdx !== -1 && row[brandIdx] ? row[brandIdx].trim() : 'General';
    
    // Normalizar precios permitiendo coma como separador decimal
    let rawBuyPrice = buyPriceIdx !== -1 && row[buyPriceIdx] ? row[buyPriceIdx].replace(',', '.') : '0';
    let rawSellPrice = sellPriceIdx !== -1 && row[sellPriceIdx] ? row[sellPriceIdx].replace(',', '.') : '0';
    
    const buyPrice = parseFloat(rawBuyPrice);
    const sellPrice = parseFloat(rawSellPrice);
    const stock = stockIdx !== -1 && row[stockIdx] ? parseInt(row[stockIdx]) : 0;
    const minStock = minStockIdx !== -1 && row[minStockIdx] ? parseInt(row[minStockIdx]) : 0;
    const weight = weightIdx !== -1 && row[weightIdx] ? row[weightIdx].trim() : '';
    const dimensions = dimensionsIdx !== -1 && row[dimensionsIdx] ? row[dimensionsIdx].trim() : '';
    const description = descriptionIdx !== -1 && row[descriptionIdx] ? row[descriptionIdx].trim() : '';
    
    const isInvalid = !sku || !name || isNaN(buyPrice) || isNaN(sellPrice) || isNaN(stock) || buyPrice < 0 || sellPrice < 0;
    if (isInvalid) errorCount++;
    
    parsedProducts.push({
      sku,
      name,
      category,
      brand,
      buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
      sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
      stock: isNaN(stock) ? 0 : stock,
      minStock: isNaN(minStock) ? 0 : minStock,
      weight,
      dimensions,
      description,
      isInvalid
    });
  });
  
  window.importProductsData = parsedProducts;
  renderImportPreview(parsedProducts, errorCount);
}

function renderImportPreview(products, errorCount) {
  const tbody = document.getElementById("import-preview-tbody");
  const summaryBadge = document.getElementById("import-summary-badge");
  const btnConfirm = document.getElementById("btn-confirm-import");
  const previewSection = document.getElementById("import-preview-section");
  
  if (!tbody || !summaryBadge || !btnConfirm || !previewSection) return;
  
  previewSection.classList.remove("hidden");
  tbody.innerHTML = "";
  
  products.forEach(p => {
    const tr = document.createElement("tr");
    if (p.isInvalid) {
      tr.className = "bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
    }
    
    const alreadyExists = ERPState.products.some(old => old.sku === p.sku);
    const statusText = p.isInvalid 
      ? '<span class="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded">Error</span>' 
      : alreadyExists 
        ? '<span class="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold rounded">Actualizar</span>' 
        : '<span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold rounded">Nuevo</span>';
    
    tr.innerHTML = `
      <td class="px-4 py-2.5 font-mono">${p.sku || '<span class="text-red-500 font-bold">FALTA</span>'}</td>
      <td class="px-4 py-2.5 font-semibold truncate max-w-[150px]">${p.name || '<span class="text-red-500 font-bold">FALTA</span>'}</td>
      <td class="px-4 py-2.5">${p.category}</td>
      <td class="px-4 py-2.5">${p.brand}</td>
      <td class="px-4 py-2.5">${formatEuro(p.buyPrice)}</td>
      <td class="px-4 py-2.5">${formatEuro(p.sellPrice)}</td>
      <td class="px-4 py-2.5 font-bold">${p.stock}</td>
      <td class="px-4 py-2.5">${statusText}</td>
    `;
    tbody.appendChild(tr);
  });
  
  const validCount = products.filter(p => !p.isInvalid).length;
  summaryBadge.innerHTML = `${validCount} listos | ${errorCount} con errores`;
  
  if (errorCount > 0) {
    summaryBadge.className = "px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-extrabold rounded-full";
  } else {
    summaryBadge.className = "px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold rounded-full";
  }
  
  btnConfirm.disabled = validCount === 0;
}

window.submitImportAction = async function() {
  const productsToImport = window.importProductsData ? window.importProductsData.filter(p => !p.isInvalid) : [];
  if (productsToImport.length === 0) return;
  
  const btnConfirm = document.getElementById("btn-confirm-import");
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = `<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle"></span>Procesando...`;
  }
  
  try {
    const res = await fetch("api/import_products.php", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ products: productsToImport })
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(data.message, "success");
      closeModal();
      
      // Recargar listado en pantalla
      if (window.location.hash === "#products") {
        await updateProductsList();
      }
    } else {
      showToast(data.message || "Error al importar productos.", "error");
    }
  } catch (err) {
    console.error("Error submitting product imports:", err);
    showToast("Error de red al importar productos.", "error");
  } finally {
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerText = "Confirmar Importación";
    }
  }
};

async function updateProductsList(highlightId = null) {
  const container = document.getElementById("products-list-container");
  if (!container) return;

  // Mostrar estado de carga con esqueleto mientras se obtiene de la base de datos
  const skeletonCount =
    ERPState.products && ERPState.products.length > 0
      ? ERPState.products.length
      : 3;
  container.innerHTML = `
    <div class="space-y-3 animate-pulse">
      ${Array(skeletonCount)
        .fill(0)
        .map(
          () => `
        <div class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl gap-3">
          <div class="flex items-center gap-3 overflow-hidden flex-1">
            <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 skeleton-shimmer flex-shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 skeleton-shimmer"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 skeleton-shimmer"></div>
              <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 skeleton-shimmer"></div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 pl-3 space-y-2">
            <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto skeleton-shimmer"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 ml-auto skeleton-shimmer"></div>
            <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto skeleton-shimmer"></div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;

  try {
    const res = await fetch("api/get_products.php");
    const data = await res.json();
    if (data.success) {
      ERPState.products = data.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        supplierId: p.supplier_id,
        supplierName: p.supplier_name,
        buyPrice: parseFloat(p.buy_price) || 0,
        sellPrice: parseFloat(p.sell_price) || 0,
        stock: parseInt(p.stock) || 0,
        minStock: parseInt(p.min_stock) || 0,
        weight: p.weight,
        dimensions: p.dimensions,
        image: p.image_url,
        description: p.description,
        status: p.status,
      }));
      updateNotificationsSystem();
    }
  } catch (err) {
    console.error("Error fetching products list:", err);
  }

  const searchInput = document.getElementById("prod-list-search");
  const search = searchInput ? searchInput.value.toLowerCase() : "";

  let filtered = [...ERPState.products];
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search),
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p>No se encontraron productos en el catálogo</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((p) => {
      const fallbackImage =
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop";
      const displayImage = p.image || fallbackImage;

      // Calcular estilos de stock
      const stockBadgeClass =
        p.stock === 0
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : p.stock <= p.minStock
            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

      return `
      <div id="product-card-${p.id}" class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700 flex-shrink-0">
            <img src="${displayImage}" class="w-full h-full object-cover" onerror="this.src='${fallbackImage}'">
          </div>
          <div class="overflow-hidden">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-md">${p.sku}</span>
              <span class="text-slate-400 dark:text-slate-400 text-[10px]">• ${p.brand}</span>
            </div>
            <h4 class="font-bold text-slate-800 dark:text-white truncate text-sm mt-0.5" title="${p.name}">${p.name}</h4>
            <span class="text-[10px] text-slate-400 dark:text-slate-400">${p.category} • Coste: <b>${formatEuro(p.buyPrice)}</b></span>
          </div>
        </div>
        <div class="text-right flex-shrink-0 pl-3">
          <span class="text-base font-extrabold dark:text-white block">${formatEuro(p.sellPrice)}</span>
          <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${stockBadgeClass}">
            Stock: ${p.stock} uds
          </span>
          <div class="flex items-center justify-end gap-1 mt-2">
            <button onclick="editProductAction('${p.id}')" class="text-blue-500 hover:text-blue-600 text-xs px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-semibold">Editar</button>
            <button onclick="deleteProductAction('${p.id}')" class="text-red-500 hover:text-red-650 text-xs px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold">Eliminar</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  if (highlightId) {
    setTimeout(() => {
      const card = document.getElementById(`product-card-${highlightId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
  }
}

// Cálculos dinámicos de margen de precios
function calcProductMargin() {
  const buyInput = document.getElementById("prod-buy");
  const sellInput = document.getElementById("prod-sell");
  const marginDisp = document.getElementById("prod-margin-val");
  const markupDisp = document.getElementById("prod-markup-val");

  if (!buyInput || !sellInput || !marginDisp || !markupDisp) return;

  const buy = window.parseEuro(buyInput.value);
  const sell = window.parseEuro(sellInput.value);

  const margin = sell - buy;
  const markup = buy > 0 ? (margin / buy) * 100 : 0;

  marginDisp.innerText = `${formatEuro(margin)}`;
  marginDisp.className =
    margin >= 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold";
  markupDisp.innerText = `${markup.toFixed(1)}%`;
  markupDisp.className =
    markup >= 0 ? "text-blue-500 font-bold" : "text-red-500 font-bold";
}

async function saveProduct(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const name = document.getElementById("prod-name").value;
  const sku = document.getElementById("prod-sku").value;
  const brand = document.getElementById("prod-brand").value;
  const category = document.getElementById("prod-category").value;
  const supplierId =
    parseInt(document.getElementById("prod-supplier").value) || null;
  const buyPrice = window.parseEuro(document.getElementById("prod-buy").value);
  const sellPrice = window.parseEuro(document.getElementById("prod-sell").value);
  const stock = parseInt(document.getElementById("prod-stock").value) || 0;
  const minStock =
    parseInt(document.getElementById("prod-min-stock").value) || 0;
  const weight = document.getElementById("prod-weight").value;
  const dimensions = document.getElementById("prod-dims").value;
  let image = document.getElementById("prod-image").value;
  const description = document.getElementById("prod-desc").value;

  if (!image) {
    image =
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop";
  }

  const payload = {
    id: activeEditProductId ? parseInt(activeEditProductId) : 0,
    name,
    sku,
    brand,
    category,
    supplierId,
    buyPrice,
    sellPrice,
    stock,
    minStock,
    weight,
    dimensions,
    image,
    description,
  };

  try {
    const res = await fetch("api/save_product.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Producto guardado con éxito.", "success");
      cancelProductEdit();
      await updateProductsList(data.productId);
    } else {
      showToast(data.message || "Error al guardar producto.", "error");
    }
  } catch (err) {
    console.error("Error saving product:", err);
    showToast("Error de red al guardar producto.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

async function editProductAction(id) {
  const prd = ERPState.products.find((p) => p.id == id);
  if (!prd) return;

  // Asegurarse de estar en la pestaña de productos primero
  if (window.location.hash !== "#products") {
    window.location.hash = "products";
    setTimeout(() => populateProductForm(prd), 100);
  } else {
    await populateProductForm(prd);
  }
}

async function populateProductForm(prd) {
  activeEditProductId = prd.id;

  document.getElementById("prod-form-title").innerText = "Editar Referencia";
  document.getElementById("prod-form-desc").innerText =
    "Modifique los campos correspondientes a la referencia seleccionada.";

  document.getElementById("prod-name").value = prd.name;
  document.getElementById("prod-sku").value = prd.sku;

  await loadCategories("prod-category", prd.category);
  await loadBrands("prod-brand", prd.brand);

  document.getElementById("prod-supplier").value = prd.supplierId || "";
  const fmtManual = (val) => {
    let fixed = parseFloat(val || 0).toFixed(2);
    let parts = fixed.split('.');
    let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return integerPart + ',' + parts[1];
  };
  document.getElementById("prod-buy").value = fmtManual(prd.buyPrice);
  document.getElementById("prod-sell").value = fmtManual(prd.sellPrice);
  document.getElementById("prod-stock").value = prd.stock;
  document.getElementById("prod-min-stock").value = prd.minStock;
  document.getElementById("prod-weight").value = prd.weight || "";
  document.getElementById("prod-dims").value = prd.dimensions || "";
  document.getElementById("prod-image").value =
    prd.image && prd.image.includes("images.unsplash.com")
      ? ""
      : prd.image || "";
  document.getElementById("prod-desc").value = prd.description || "";

  updateProductImagePreview(prd.image);

  // Cambiar a la pestaña correcta según el tipo de imagen
  if (prd.image && prd.image.includes("uploads/")) {
    switchProductImageTab("upload");
  } else if (
    prd.image &&
    prd.image.trim() !== "" &&
    !prd.image.includes("images.unsplash.com")
  ) {
    switchProductImageTab("url");
  } else {
    switchProductImageTab("upload");
  }

  document.getElementById("btn-prod-cancel").classList.remove("hidden");

  calcProductMargin();

  // Desplazamiento suave al formulario
  document
    .getElementById("form-product")
    .scrollIntoView({ behavior: "smooth" });
}

function cancelProductEdit() {
  activeEditProductId = null;
  const form = document.getElementById("form-product");
  if (form) form.reset();

  const formTitle = document.getElementById("prod-form-title");
  const formDesc = document.getElementById("prod-form-desc");
  if (formTitle) formTitle.innerText = "Añadir Referencia";
  if (formDesc)
    formDesc.innerText =
      "Habilite nuevos artículos y configure los precios fiscales para Anaya Outlet.";

  updateProductImagePreview("");

  // Restablecer pestaña de imagen por defecto a subir archivo
  switchProductImageTab("upload");

  const btnCancel = document.getElementById("btn-prod-cancel");
  if (btnCancel) btnCancel.classList.add("hidden");

  calcProductMargin();
}

async function deleteProductAction(id) {
  const prd = ERPState.products.find((p) => p.id == id);
  if (!prd) return;

  const name = prd.name;

  if (
    confirm(
      `¿Está seguro que desea eliminar del catálogo el producto "${name}"? Esto no eliminará las facturas emitidas históricamente.`,
    )
  ) {
    try {
      const res = await fetch("api/delete_product.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(id) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Referencia "${name}" eliminada.`, "warning");

        // Actualizar vista activa
        if (window.location.hash === "#inventory") {
          await updateInventoryTable();
        } else {
          await updateProductsList();
        }
      } else {
        showToast(data.message || "Error al eliminar el producto.", "error");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("Error de red al eliminar producto.", "error");
    }
  }
}

// ==================== INVOICING (POS) BILLING MODULE ====================
let activeCart = [];
let billingSelectedClientId = "";
let billingDiscount = 0;

async function renderBillingModule(container) {
  // Verificar si existe una sesión de caja activa antes de permitir la facturación
  try {
    const cashRes = await fetch("api/get_active_cash_session.php");
    const cashData = await cashRes.json();
    
    if (!cashData.success || !cashData.active) {
      container.innerHTML = `
        <div class="flex items-center justify-center py-12 animate-toast-in">
          <div class="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium text-center">
            <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-2 font-display">Control de Caja Cerrado</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Para poder registrar ventas en el establecimiento, primero debe realizar la apertura de la caja registradora ingresando el fondo base inicial.</p>
            
            <form onsubmit="openCashSessionAction(event)" class="space-y-4">
              <div>
                <label class="block text-left text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Fondo Inicial de Caja (€)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">€</span>
                  <input type="number" step="0.01" min="0" value="100.00" id="opening-initial-base" required class="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white">
                </div>
              </div>
              <button type="submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2">
                <span>Abrir Caja Registradora</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      `;
      return;
    }
  } catch (err) {
    console.error("Error checking cash session on POS load:", err);
  }

  activeCart = [];
  billingDiscount = 0;

  // Obtener clientes primero de la base de datos
  try {
    const clientsRes = await fetch("api/get_clients.php");
    const clientsData = await clientsRes.json();
    if (clientsData.success) {
      ERPState.clients = clientsData.clients.map((c) => ({
        id: c.id,
        customId: c.custom_id,
        name: c.name,
        document: c.document,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        salesCount: parseInt(c.sales_count) || 0,
        salesTotal: parseFloat(c.sales_total) || 0,
      }));
    }
  } catch (err) {
    console.error("Error fetching clients for billing module:", err);
  }

  // Obtener productos de la base de datos
  try {
    const productsRes = await fetch("api/get_products.php");
    const productsData = await productsRes.json();
    if (productsData.success) {
      ERPState.products = productsData.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        supplierId: p.supplier_id,
        supplierName: p.supplier_name,
        buyPrice: parseFloat(p.buy_price) || 0,
        sellPrice: parseFloat(p.sell_price) || 0,
        stock: parseInt(p.stock) || 0,
        minStock: parseInt(p.min_stock) || 0,
        weight: p.weight,
        dimensions: p.dimensions,
        image: p.image_url,
        description: p.description,
        status: p.status,
      }));
      updateNotificationsSystem();
    }
  } catch (err) {
    console.error("Error fetching products for billing module:", err);
  }

  // Por defecto al primer cliente o vacío
  billingSelectedClientId = ERPState.clients[0] ? ERPState.clients[0].id : "";

  const defaultClient = ERPState.clients.find((c) => c.id === billingSelectedClientId) || ERPState.clients[0];
  const defaultClientText = defaultClient ? `${defaultClient.name} (${defaultClient.document})` : "";
  const categoryTabs = getCategoryPOSTabsHTML();

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-toast-in">
      <!-- LEFT COLUMN: PRODUCT GRID CATALOG -->
      <div class="col-span-1 lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4">
          <h2 class="text-2xl font-black font-display dark:text-white flex-shrink-0">Terminal POS</h2>
          
          <div class="relative w-full sm:w-64">
            <input type="text" id="pos-search-input" oninput="updatePOSProductGrid()" class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" placeholder="Buscar por SKU o Nombre...">
            <svg class="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <!-- Category Horizontal Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-shadows pb-4 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap flex-nowrap">
          <button onclick="setPOSCategory('')" class="pos-cat-tab px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl font-bold transition-all whitespace-nowrap flex-shrink-0">Todos</button>
          ${categoryTabs}
        </div>

        <!-- POS GRID -->
        <div class="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5 pr-2" id="pos-product-grid">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- RIGHT COLUMN: BILLING CART SHEET -->
      <div class="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col justify-between max-h-[85vh]">
        <div class="mb-5 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-slate-800 dark:text-white">Hoja de Venta</h3>
            <button onclick="clearPOSCart()" class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-all border border-red-100/50 dark:border-red-900/20 shadow-sm">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Vaciar</span>
            </button>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Asociar Cliente CRM</label>
            <div class="relative">
              <input type="text" id="pos-client-search" onfocus="this.select(); showPOSClientDropdown()" onblur="hidePOSClientDropdown()" oninput="filterPOSClients()" class="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" placeholder="Buscar cliente..." value="${defaultClientText}" autocomplete="off">
              <!-- Dropdown list -->
              <div id="pos-client-dropdown" class="hidden absolute top-12 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-premium dark:shadow-dark-premium z-50 max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                <!-- Dynamic list -->
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col flex-1 overflow-hidden">
          <!-- CART PRODUCTS LIST -->
          <div class="flex-1 overflow-y-auto pr-2 space-y-4" id="pos-cart-list">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- BILLING TOTALS SHEET -->
        <div class="border-t border-slate-100 dark:border-slate-700 pt-5 mt-5 space-y-4 bg-white dark:bg-slate-800">
          <div class="flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Descuento Comercial (€)</span>
            <input type="number" id="pos-discount-input" oninput="updatePOSCartTotals()" class="w-20 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-slate-800 dark:text-white focus:outline-none" value="0">
          </div>
          
          <div class="space-y-2 border-t border-slate-100 dark:border-slate-700/60 pt-3 text-xs text-slate-500">
            <div class="flex justify-between">
              <span>Subtotal Neto</span>
              <span id="pos-subtotal-disp">0.00 €</span>
            </div>
            <div class="flex justify-between">
              <span>IVA Aplicado (21%)</span>
              <span id="pos-iva-disp">0.00 €</span>
            </div>
            <div class="flex justify-between font-semibold" id="pos-discount-row">
              <span>Descuento aplicado</span>
              <span id="pos-discount-disp" class="text-red-500">-0.00 €</span>
            </div>
          </div>

          <div class="flex justify-between items-center text-slate-800 dark:text-white border-t border-slate-100 dark:border-slate-700 pt-4">
            <span class="text-sm font-bold">TOTAL FACTURA</span>
            <span class="text-2xl font-black font-display text-blue-600 dark:text-blue-400" id="pos-total-disp">0.00 €</span>
          </div>

          <div class="pt-3">
            <button onclick="openPOSCheckoutModal()" class="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span>Cobrar Venta / Registrar Pago</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  POSActiveCategory = "";
  updatePOSProductGrid();
  updatePOSCartList();
}

window.openPOSCheckoutModal = function () {
  if (activeCart.length === 0) {
    showToast("El carrito de facturación está vacío.", "error");
    return;
  }

  const client = ERPState.clients.find((c) => c.id == billingSelectedClientId);
  if (!client) {
    showToast("Seleccione un cliente válido de la lista CRM.", "error");
    return;
  }

  const container = document.getElementById("modal-container");
  const card = document.getElementById("modal-card");
  if (!container || !card) return;

  // Calcular totales
  let subtotal = 0;
  activeCart.forEach((item) => {
    subtotal += item.price * item.qty;
  });

  const taxRate = ERPState.settings.taxRate || 21;
  const taxableAmount = subtotal - billingDiscount;
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

  card.innerHTML = `
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
      <div>
        <h3 class="text-lg font-bold dark:text-white font-display">Registrar Cobro de Venta</h3>
        <p class="text-xs text-slate-405 mt-0.5">Asociado a: <span class="font-bold text-slate-700 dark:text-slate-200">${client.name}</span></p>
      </div>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold">✕</button>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-6">
      <!-- Total Display -->
      <div class="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 text-center">
        <span class="text-xs text-slate-400 block uppercase tracking-wider font-bold">Total a Cobrar</span>
        <span class="text-3xl font-black text-blue-600 dark:text-blue-400 font-display mt-1 block" id="checkout-total-val-disp">${total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
      </div>

      <!-- Payment Method Options -->
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Método de Pago</label>
        <div class="grid grid-cols-3 gap-3">
          <label class="cursor-pointer">
            <input type="radio" name="checkout-payment-method" value="Efectivo" checked onchange="toggleCheckoutPaymentFields(this.value)" class="sr-only peer">
            <div class="relative flex flex-col items-center justify-center p-4 border rounded-xl select-none text-xs font-bold transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 peer-checked:border-emerald-500 peer-checked:text-emerald-600 dark:peer-checked:text-emerald-400 peer-checked:bg-emerald-500/5 text-slate-600 dark:text-slate-350">
              <svg class="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Efectivo</span>
            </div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="checkout-payment-method" value="Tarjeta" onchange="toggleCheckoutPaymentFields(this.value)" class="sr-only peer">
            <div class="relative flex flex-col items-center justify-center p-4 border rounded-xl select-none text-xs font-bold transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 peer-checked:border-indigo-500 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400 peer-checked:bg-indigo-500/5 text-slate-600 dark:text-slate-350">
              <svg class="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              <span>Tarjeta</span>
            </div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="checkout-payment-method" value="Transferencia" onchange="toggleCheckoutPaymentFields(this.value)" class="sr-only peer">
            <div class="relative flex flex-col items-center justify-center p-4 border rounded-xl select-none text-xs font-bold transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 peer-checked:border-blue-500 peer-checked:text-blue-600 dark:peer-checked:text-blue-400 peer-checked:bg-blue-500/5 text-slate-600 dark:text-slate-350">
              <svg class="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span>Albarán</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Cash Calculation Section -->
      <div id="checkout-cash-section" class="space-y-4 animate-toast-in">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Efectivo Entregado</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">€</span>
              <input type="number" step="0.01" min="0" id="checkout-cash-received" oninput="calculateCheckoutChange(${total})" class="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0,00">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cambio a Devolver</label>
            <div id="checkout-change-container" class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-sm font-black flex items-center justify-between text-slate-400 min-h-[46px]">
              <span id="checkout-change-label">0.00 €</span>
            </div>
          </div>
        </div>

        <!-- Quick Cash Selectors -->
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billetes Rápidos</label>
          <div class="flex flex-wrap gap-2">
            <button onclick="setCheckoutQuickCash(${total}, ${total})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">Exacto</button>
            <button onclick="setCheckoutQuickCash(5, ${total})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">5 €</button>
            <button onclick="setCheckoutQuickCash(10, ${total})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">10 €</button>
            <button onclick="setCheckoutQuickCash(20, ${total})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">20 €</button>
            <button onclick="setCheckoutQuickCash(50, ${total})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">50 €</button>
            <button onclick="setCheckoutQuickCash(100, ${total})" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">100 €</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
      <button onclick="closeModal()" class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
        Cancelar
      </button>
      <button onclick="confirmPOSCheckoutPayment()" id="btn-confirm-checkout" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all shadow-md">
        Registrar Venta
      </button>
    </div>
  `;

  container.classList.remove("hidden");
  
  const cashInput = document.getElementById("checkout-cash-received");
  if (cashInput) {
    cashInput.focus();
  }
};

window.toggleCheckoutPaymentFields = function (method) {
  const cashSection = document.getElementById("checkout-cash-section");
  if (cashSection) {
    if (method === "Efectivo") {
      cashSection.classList.remove("hidden");
    } else {
      cashSection.classList.add("hidden");
    }
  }
};

window.calculateCheckoutChange = function (total) {
  const receivedInput = document.getElementById("checkout-cash-received");
  const changeContainer = document.getElementById("checkout-change-container");
  const changeLabel = document.getElementById("checkout-change-label");

  if (!receivedInput || !changeContainer || !changeLabel) return;

  const received = parseFloat(receivedInput.value) || 0;
  const change = received - total;

  if (received === 0) {
    changeLabel.innerText = "0.00 €";
    changeContainer.className = "w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-sm font-black flex items-center justify-between text-slate-400 min-h-[46px]";
  } else if (change >= 0) {
    changeLabel.innerText = `${change.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
    changeContainer.className = "w-full px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-black flex items-center justify-between min-h-[46px]";
  } else {
    changeLabel.innerText = `Falta ${Math.abs(change).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
    changeContainer.className = "w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-black flex items-center justify-between min-h-[46px]";
  }
};

window.setCheckoutQuickCash = function (amount, total) {
  const receivedInput = document.getElementById("checkout-cash-received");
  if (receivedInput) {
    receivedInput.value = amount.toFixed(2);
    calculateCheckoutChange(total);
  }
};

window.confirmPOSCheckoutPayment = async function () {
  const methodRadio = document.querySelector('input[name="checkout-payment-method"]:checked');
  if (!methodRadio) return;

  const method = methodRadio.value;

  if (method === "Efectivo") {
    const receivedInput = document.getElementById("checkout-cash-received");
    const received = parseFloat(receivedInput ? receivedInput.value : 0) || 0;

    let subtotal = 0;
    activeCart.forEach((item) => {
      subtotal += item.price * item.qty;
    });
    const taxRate = ERPState.settings.taxRate || 21;
    const taxableAmount = subtotal - billingDiscount;
    const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
    const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

    if (received < total) {
      showToast("El efectivo entregado es menor que el total de la venta.", "error");
      return;
    }
  }

  closeModal();
  await processPOSInvoice(method);
};

window.showPOSClientDropdown = function() {
  const dropdown = document.getElementById("pos-client-dropdown");
  if (!dropdown) return;
  dropdown.classList.remove("hidden");
  filterPOSClients();
};

window.hidePOSClientDropdown = function() {
  setTimeout(() => {
    const dropdown = document.getElementById("pos-client-dropdown");
    if (dropdown) dropdown.classList.add("hidden");

    // Restablecer el texto de búsqueda al cliente seleccionado en caso de que se haya cancelado la edición
    const searchInput = document.getElementById("pos-client-search");
    if (searchInput) {
      const selected = ERPState.clients.find(c => c.id == billingSelectedClientId);
      if (selected) {
        searchInput.value = `${selected.name} (${selected.document})`;
      } else {
        searchInput.value = "";
      }
    }
  }, 250);
};

window.filterPOSClients = function() {
  const searchInput = document.getElementById("pos-client-search");
  const dropdown = document.getElementById("pos-client-dropdown");
  if (!searchInput || !dropdown) return;

  const query = searchInput.value.toLowerCase().trim();
  const filtered = ERPState.clients.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.document.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    dropdown.innerHTML = `
      <div class="p-3 text-xs text-slate-400 text-center">
        No se encontraron clientes
      </div>
    `;
    return;
  }

  dropdown.innerHTML = filtered.map(c => `
    <button type="button" onclick="selectPOSClient('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.document}')" class="w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-slate-700 dark:text-slate-350 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors">
      <span class="truncate mr-2">${c.name}</span>
      <span class="font-mono text-[9px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded flex-shrink-0">${c.document}</span>
    </button>
  `).join("");
};

window.selectPOSClient = function(id, name, doc) {
  billingSelectedClientId = id;
  const searchInput = document.getElementById("pos-client-search");
  if (searchInput) {
    searchInput.value = `${name} (${doc})`;
  }
  const dropdown = document.getElementById("pos-client-dropdown");
  if (dropdown) {
    dropdown.classList.add("hidden");
  }
};

let POSActiveCategory = "";
function getCategoryPOSTabsHTML() {
  const cats = [...new Set(ERPState.products.map((p) => p.category))];
  return cats
    .map((c) => {
      const escaped = c.replace(/'/g, "\\'");
      return `
      <button onclick="setPOSCategory('${escaped}')" class="pos-cat-tab px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-all whitespace-nowrap flex-shrink-0">${c}</button>
    `;
    })
    .join("");
}

function setPOSCategory(cat) {
  POSActiveCategory = cat;

  // Alternar estados visuales de las pestañas
  document.querySelectorAll(".pos-cat-tab").forEach((btn) => {
    btn.className =
      "pos-cat-tab px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all whitespace-nowrap flex-shrink-0";
  });

  // Encontrar el botón activo de destino
  const btns = Array.from(document.querySelectorAll(".pos-cat-tab"));
  const match = btns.find((b) => b.innerText === (cat || "Todos"));
  if (match) {
    match.className =
      "pos-cat-tab px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl font-bold transition-all whitespace-nowrap flex-shrink-0";
  }

  updatePOSProductGrid();
}

function updatePOSProductGrid() {
  const grid = document.getElementById("pos-product-grid");
  if (!grid) return;

  const search = document
    .getElementById("pos-search-input")
    .value.toLowerCase();

  let filtered = [...ERPState.products];
  if (POSActiveCategory) {
    filtered = filtered.filter((p) => p.category === POSActiveCategory);
  }
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search),
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-2 sm:col-span-3 text-center py-12 text-slate-400">No se encontraron artículos coincidentes</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((p) => {
      // Calcular estilos de stock para POS
      const stockColorClass =
        p.stock === 0
          ? "text-red-500 font-bold"
          : p.stock <= p.minStock
            ? "text-yellow-500 font-bold"
            : "text-slate-400";
      const stockText = p.stock === 0 ? "Agotado" : `Stock: ${p.stock}`;

      return `
      <div onclick="addToPOSCart('${p.id}')" class="cursor-pointer hover:-translate-y-1 hover:border-blue-400 hover:shadow-premium flex flex-col justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 rounded-2xl transition-all h-44">
        <div>
          <div class="flex justify-between items-start gap-1">
            <span class="font-mono text-[9px] font-black tracking-wider text-slate-400 truncate w-20 block">${p.sku}</span>
            <span class="text-[9px] font-bold ${stockColorClass}">${stockText}</span>
          </div>
          <h4 class="font-bold text-xs text-slate-800 dark:text-white mt-2 line-clamp-2" title="${p.name}">${p.name}</h4>
        </div>
        <div class="flex justify-between items-center border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
          <span class="text-xs text-slate-400">${p.brand}</span>
          <span class="text-sm font-black dark:text-white">${formatEuro(p.sellPrice)}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

function addToPOSCart(id) {
  const prd = ERPState.products.find((p) => p.id == id);
  if (!prd) return;

  const cartItem = activeCart.find((item) => item.productId == id);

  if (cartItem) {
    cartItem.qty++;
  } else {
    activeCart.push({
      productId: prd.id,
      name: prd.name,
      qty: 1,
      price: prd.sellPrice,
      sku: prd.sku,
    });
  }

  updatePOSCartList();
  showToast(`Artículo "${prd.name}" añadido a la hoja de venta.`, "success");
}

function updatePOSCartList() {
  const list = document.getElementById("pos-cart-list");
  if (!list) return;

  if (activeCart.length === 0) {
    list.innerHTML = `
      <div class="text-center py-16 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        <span class="text-xs">Hoja de venta vacía</span>
      </div>
    `;
    updatePOSCartTotals();
    return;
  }

  list.innerHTML = activeCart
    .map((item, idx) => {
      return `
      <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-100/60 dark:border-slate-700/60 rounded-xl">
        <div class="overflow-hidden mr-2 max-w-[60%]">
          <span class="font-bold text-xs text-slate-800 dark:text-white truncate block">${item.name}</span>
          <span class="text-[9px] text-slate-400">${item.sku} • <b>${formatEuro(item.price)}</b></span>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- Quantity Stepper -->
          <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
            <button onclick="adjustCartItemQty(${idx}, -1)" class="px-2 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-400">-</button>
            <span class="px-2 text-xs font-bold dark:text-slate-200">${item.qty}</span>
            <button onclick="adjustCartItemQty(${idx}, 1)" class="px-2 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-400">+</button>
          </div>
          <button onclick="removePOSCartItem(${idx})" class="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded" title="Retirar">✕</button>
        </div>
      </div>
    `;
    })
    .join("");

  updatePOSCartTotals();
}

function adjustCartItemQty(idx, change) {
  const item = activeCart[idx];
  if (!item) return;

  const prd = ERPState.products.find((p) => p.id == item.productId);
  if (!prd) return;

  const newQty = item.qty + change;
  if (newQty <= 0) {
    removePOSCartItem(idx);
    return;
  }

  if (newQty > prd.stock) {
    showToast(
      `No hay stock suficiente disponible. Stock total: ${prd.stock}`,
      "warning",
    );
    return;
  }

  item.qty = newQty;
  updatePOSCartList();
}

function removePOSCartItem(idx) {
  activeCart.splice(idx, 1);
  updatePOSCartList();
  showToast("Artículo retirado de la hoja.", "info");
}

function clearPOSCart() {
  activeCart = [];
  updatePOSCartList();

  // Restablecer cliente al predeterminado (Consumidor Final)
  billingSelectedClientId = ERPState.clients[0] ? ERPState.clients[0].id : "";
  const defaultClient = ERPState.clients.find((c) => c.id === billingSelectedClientId) || ERPState.clients[0];
  const defaultClientText = defaultClient ? `${defaultClient.name} (${defaultClient.document})` : "";
  const searchInput = document.getElementById("pos-client-search");
  if (searchInput) {
    searchInput.value = defaultClientText;
  }
}

function updatePOSCartTotals() {
  const discountInput = document.getElementById("pos-discount-input");
  billingDiscount = parseFloat(discountInput ? discountInput.value : 0) || 0;

  let subtotal = 0;
  activeCart.forEach((item) => {
    subtotal += item.price * item.qty;
  });

  const taxRate = ERPState.settings.taxRate || 21;

  // Calcular descuento (aplicar límite máximo de descuento del subtotal)
  if (billingDiscount > subtotal) billingDiscount = subtotal;
  if (billingDiscount < 0) billingDiscount = 0;

  const taxableAmount = subtotal - billingDiscount;
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

  // Actualizar pantallas del DOM
  const subDisp = document.getElementById("pos-subtotal-disp");
  const ivaDisp = document.getElementById("pos-iva-disp");
  const discRow = document.getElementById("pos-discount-row");
  const discDisp = document.getElementById("pos-discount-disp");
  const totalDisp = document.getElementById("pos-total-disp");

  if (subDisp)
    subDisp.innerText = `${subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
  if (ivaDisp)
    ivaDisp.innerText = `${taxAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;

  if (discRow && discDisp) {
    if (billingDiscount > 0) {
      discRow.classList.remove("hidden");
      discDisp.innerText = `-${billingDiscount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
    } else {
      discRow.classList.add("hidden");
    }
  }

  if (totalDisp)
    totalDisp.innerText = `${total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
}

// Generar nuevas facturas y actualizar las bases de datos
async function processPOSInvoice(method) {
  if (activeCart.length === 0) {
    showToast("El carrito de facturación está vacío.", "error");
    return;
  }

  const client = ERPState.clients.find((c) => c.id == billingSelectedClientId);
  if (!client) {
    showToast("Seleccione un cliente válido de la lista CRM.", "error");
    return;
  }

  const cashBtn = document.querySelector(
    'button[onclick="processPOSInvoice(\'Efectivo\')"]',
  );
  const cardBtn = document.querySelector(
    'button[onclick="processPOSInvoice(\'Tarjeta\')"]',
  );
  const albaranBtn = document.querySelector(
    'button[onclick="processPOSInvoice(\'Transferencia\')"]',
  );
  if (cashBtn) cashBtn.disabled = true;
  if (cardBtn) cardBtn.disabled = true;
  if (albaranBtn) albaranBtn.disabled = true;

  let subtotal = 0;
  activeCart.forEach((item) => {
    subtotal += item.price * item.qty;
  });

  const taxRate = ERPState.settings.taxRate || 21;
  const taxableAmount = subtotal - billingDiscount;
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

  const payload = {
    clientId: parseInt(billingSelectedClientId),
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxRate: parseInt(taxRate),
    taxAmount: taxAmount,
    discount: parseFloat(billingDiscount.toFixed(2)),
    total: total,
    status: method === "Transferencia" ? "Pendiente" : "Cobrada",
    paymentMethod: method,
    products: activeCart.map((item) => ({
      productId: parseInt(item.productId),
      qty: parseInt(item.qty),
      price: parseFloat(item.price),
    })),
  };

  try {
    const res = await fetch("api/create_invoice.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      // Fusionar metadatos del cliente y detalles del producto de vuelta al objeto de la factura para impresión
      const invoiceToPrint = {
        ...data.invoice,
        clientName: client.name,
        clientDocument: client.document,
        clientAddress: client.address,
        clientCity: client.city,
        products: data.invoice.products.map((p) => {
          const cartItem = activeCart.find(
            (item) => item.productId == p.productId,
          );
          return {
            ...p,
            name: cartItem ? cartItem.name : "Producto",
            sku: cartItem ? cartItem.sku : "",
          };
        }),
      };

      if (!Array.isArray(ERPState.invoices)) {
        ERPState.invoices = [];
      }
      ERPState.invoices.push(invoiceToPrint);

      // Mostrar vista de factura simulador PDF premium
      openInvoicePDFModal(invoiceToPrint);

      // Restablecer el carrito
      clearPOSCart();

      // Actualizar la lista de productos y la cuadrícula para reflejar el nuevo stock
      await updateProductsList();
      updatePOSProductGrid();

      showToast(data.message || "Factura emitida con éxito.", "success");
    } else {
      showToast(data.message || "Error al emitir factura.", "error");
    }
  } catch (err) {
    console.error("Error processing invoice:", err);
    showToast("Error de red al procesar la factura.", "error");
  } finally {
    if (cashBtn) cashBtn.disabled = false;
    if (cardBtn) cardBtn.disabled = false;
    if (albaranBtn) albaranBtn.disabled = false;
  }
}

// ==================== SIMULADOR DE FACTURA PDF Y MODAL DE IMPRESIÓN ====================
function openInvoicePDFModal(inv) {
  const taxRate = inv.taxRate || 21;
  const company = ERPState.settings;

  const productRows = inv.products
    .map(
      (p) => `
    <tr class="border-b border-slate-100 text-xs">
      <td class="py-2.5 font-mono text-slate-500">${p.sku}</td>
      <td class="py-2.5 font-bold text-slate-800">${p.name}</td>
      <td class="py-2.5 text-center text-slate-700">${p.qty}</td>
      <td class="py-2.5 text-right text-slate-700">${formatEuro(p.price)}</td>
      <td class="py-2.5 text-right font-bold text-slate-900">${formatEuro((p.price * p.qty))}</td>
    </tr>
  `,
    )
    .join("");

  openModal(
    `
    <div class="flex flex-col h-[85vh] overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 flex-shrink-0">
        <h3 class="font-bold text-slate-800 dark:text-white">Factura Oficial</h3>
        <div class="flex gap-2">
          <button onclick="window.print()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm">
            Imprimir
          </button>
          <button onclick="downloadInvoicePDF(this, '${inv.invoiceNumber}')" class="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-655 font-semibold rounded-lg text-xs transition-all flex items-center gap-1 hover:bg-slate-50">
            Descargar PDF
          </button>
          <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-sm px-2">✕ Cerrar</button>
        </div>
      </div>

      <!-- INVOICE SHEET AREA -->
      <div class="p-8 overflow-y-auto flex-1 bg-white text-slate-800" id="print-area">
        <div class="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <div class="flex items-center gap-2">
              <div class="bg-blue-600 p-1.5 rounded-lg text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <span class="font-black text-lg tracking-wider uppercase text-slate-900">ANAYA OUTLET</span>
            </div>
            <p class="text-xs text-slate-500 mt-2 font-semibold">
              ${company.companyName} • CIF: ${company.cif}<br>
              ${company.address}<br>
              ${company.city}, ${company.state}<br>
              Tlf: ${company.phone} • Correo: ${company.email}
            </p>
          </div>
          <div class="text-right">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded">Factura Simplificada</span>
            <h2 class="text-2xl font-black font-display text-slate-900 mt-3">${inv.invoiceNumber}</h2>
            <span class="text-xs text-slate-500">Fecha de Expedición: <b>${inv.date}</b></span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 my-8 text-xs">
          <div>
            <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Destinatario / Cliente</span>
            <span class="font-extrabold text-slate-900 text-sm block">${inv.clientName}</span>
            <span class="text-slate-500 leading-relaxed block mt-1">
              Documento: ${inv.clientDocument || inv.clientId}<br>
              Dirección: ${inv.clientAddress || "No registrada"}<br>
              Ubicación: ${inv.clientCity || "No registrada"}
            </span>
          </div>
          <div class="text-left sm:text-right">
            <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Información Tributaria</span>
            <span class="text-slate-500 block">Impuestos Incluidos: <b>IVA ${taxRate}%</b></span>
            <span class="text-slate-500 block">Método Pago: <b>${inv.paymentMethod}</b></span>
            <span class="text-slate-500 block">Estado Operación: <b class="text-emerald-600">${inv.status}</b></span>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <div class="overflow-x-auto no-shadows my-6">
          <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr class="border-b-2 border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-2.5">SKU</th>
                <th class="py-2.5">Descripción Producto</th>
                <th class="py-2.5 text-center">Cant</th>
                <th class="py-2.5 text-right">P. Unitario</th>
                <th class="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
        </div>

        <!-- TOTALS BREAKDOWN -->
        <div class="flex justify-end mt-8 border-t border-slate-200 pt-6">
          <div class="w-64 text-xs space-y-2.5">
            <div class="flex justify-between text-slate-500">
              <span>Subtotal Neto</span>
              <span>${formatEuro(inv.subtotal)}</span>
            </div>
            ${
              inv.discount > 0
                ? `
              <div class="flex justify-between text-red-600 font-semibold">
                <span>Descuento aplicado</span>
                <span>-${formatEuro(inv.discount)}</span>
              </div>
            `
                : ""
            }
            <div class="flex justify-between text-slate-500">
              <span>IVA (${taxRate}%)</span>
              <span>${formatEuro(inv.taxAmount)}</span>
            </div>
            <div class="flex justify-between border-t-2 border-slate-200 pt-3 text-slate-900 font-extrabold text-sm">
              <span>TOTAL FACTURA</span>
              <span>${formatEuro(inv.total)}</span>
            </div>
          </div>
        </div>

        <div class="mt-12 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-6">
          Factura generada digitalmente a través del módulo de facturación del MVP de ANAYA ERP.<br>
          Muchas gracias por depositar su confianza comercial en Anaya Outlet.
        </div>
      </div>
    </div>
  `,
    "max-w-2xl",
  );
}

window.downloadInvoicePDF = function (btn, invNum) {
  const element = document.getElementById("print-area");
  if (!element) {
    showToast("Error: No se pudo localizar el área de impresión.", "error");
    return;
  }

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-pulse">Generando...</span>`;

  showToast("Compilando factura PDF...", "info");

  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `${invNum}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      showToast(`Factura ${invNum} exportada a PDF con éxito.`, "success");
      // Registrar auditoría de exportación en segundo plano
      fetch(`api/audit_pdf_export.php?invNum=${encodeURIComponent(invNum)}`);
    })
    .catch((err) => {
      console.error("Error generating PDF:", err);
      showToast("Error al exportar el archivo PDF.", "error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    });
};

// ==================== SALES HISTORY MODULE RENDERER ====================
let salesFilters = {
  search: "",
  date: "",
};

async function renderSalesModule(container) {
  salesFilters = {
    search: "",
    date: "",
  };

  try {
    const res = await fetch("api/get_invoices.php");
    const data = await res.json();
    if (data.success) {
      ERPState.invoices = data.invoices;
    }
  } catch (err) {
    console.error("Error fetching sales history:", err);
  }

  container.innerHTML = `
    <div class="space-y-6 animate-toast-in">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight dark:text-white">Registro de Ventas</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Historial de facturas simplificadas emitidas en el POS de Anaya Outlet.</p>
        </div>
        <button onclick="exportSalesToCSV()" class="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
          Exportar CSV
        </button>
      </div>
 
      <!-- SEARCH PANEL -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col lg:flex-row gap-4 items-end">
        <!-- Buscador -->
        <div class="w-full lg:flex-1" id="sales-search-container">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Buscador</label>
          <div class="relative w-full">
            <input type="text" id="sales-search-input" oninput="triggerSalesFilters()" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 rounded-xl text-xs font-semibold focus:outline-none hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-white transition-all" placeholder="Buscar por número de factura (Ej: F-2026-0001)...">
            <span class="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
          </div>
        </div>

        <!-- Date Filter -->
        <div class="w-full lg:w-48" id="sales-date-container">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Fecha</label>
          <input type="date" id="sales-filter-date" onchange="triggerSalesFilters()" class="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all">
        </div>

        <!-- Clear Filters Button -->
        <button id="sales-clear-filters-btn" onclick="clearSalesFilters()" class="hidden w-full lg:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 hover:shadow-sm">
          <span>Limpiar Filtros</span>
          <span class="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">✕</span>
        </button>
      </div>

      <div class="bg-transparent lg:bg-white dark:lg:bg-slate-800 rounded-3xl border-none lg:border border-slate-200/60 dark:border-slate-700 shadow-none lg:shadow-premium dark:lg:shadow-dark-premium overflow-hidden">
        <div class="table-scroll-container overflow-x-hidden lg:overflow-visible">
          <table class="w-full text-left text-sm block lg:table">
            <thead class="hidden lg:table-header-group bg-slate-55 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-700/80">
              <tr>
                <th class="py-4.5 px-6">Factura</th>
                <th class="py-4.5 px-6">Cliente</th>
                <th class="py-4.5 px-6">Fecha</th>
                <th class="py-4.5 px-6 text-center">Artículos</th>
                <th class="py-4.5 px-6 text-right">Importe Total</th>
                <th class="py-4.5 px-6 text-center">Estado</th>
                <th class="py-4.5 px-6 text-center">Método Pago</th>
                <th class="py-4.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody id="sales-table-body" class="divide-y divide-slate-100 dark:divide-slate-700/50 block lg:table-row-group">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderSalesRows(ERPState.invoices);
}

function renderSalesRows(invoices) {
  const body = document.getElementById("sales-table-body");
  if (!body) return;

  if (invoices.length === 0) {
    body.innerHTML = `
      <tr class="flex flex-col lg:table-row">
        <td colspan="8" class="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">
          Sin facturas registradas en este criterio de búsqueda.
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = invoices
    .slice()
    .reverse()
    .map((i) => {
      const statusClass =
        i.status === "Cobrada"
          ? "text-emerald-500 bg-emerald-500/10"
          : i.status === "Pendiente"
            ? "text-yellow-500 bg-yellow-500/10"
            : i.status === "Devuelta"
              ? "text-red-500 bg-red-500/10"
              : "text-slate-400 bg-slate-100";
      return `
      <tr class="flex flex-col lg:table-row border border-slate-100 dark:border-slate-700/60 lg:border-none p-4 lg:p-0 rounded-2xl mb-4 lg:mb-0 bg-white dark:bg-slate-800 lg:bg-transparent shadow-sm lg:shadow-none gap-1.5 lg:gap-0">
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Factura</span>
          <span class="font-mono font-bold dark:text-slate-300">${i.invoiceNumber}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente</span>
          <span class="font-bold dark:text-white text-right lg:text-left">${i.clientName}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</span>
          <span class="text-slate-500 dark:text-slate-400">${i.date}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Artículos</span>
          <span class="font-semibold dark:text-slate-300">${i.products.reduce((acc, p) => acc + p.qty, 0)} uds</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Importe Total</span>
          <span class="font-black dark:text-white">${formatEuro(i.total)}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">${i.status}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Método Pago</span>
          <span class="text-slate-500 dark:text-slate-400 font-semibold">${i.paymentMethod}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Acciones</span>
          <div class="flex items-center justify-end lg:justify-center gap-1.5 flex-wrap">
            <button onclick="viewInvoiceFromHistory('${i.id}')" class="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all">
              Ver Detalle
            </button>
            ${
              i.status === "Pendiente"
                ? `
              <button onclick="changeInvoiceStatus('${i.id}', 'Cobrada', this)" class="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all">
                Cobrar
              </button>
            `
                : ""
            }
            ${
              i.status === "Cobrada"
                ? `
              <button onclick="returnInvoice('${i.id}', this)" class="px-2.5 py-1 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all">
                Devolver
              </button>
            `
                : ""
            }
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.triggerSalesFilters = function () {
  salesFilters.search = document
    .getElementById("sales-search-input")
    .value.trim()
    .toLowerCase();
  salesFilters.date = document.getElementById("sales-filter-date").value;

  // Alternar botón de limpiar filtros
  const clearBtn = document.getElementById("sales-clear-filters-btn");
  if (clearBtn) {
    if (salesFilters.search !== "" || salesFilters.date !== "") {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  // Filtrar
  let filtered = [...ERPState.invoices];
  if (salesFilters.search) {
    filtered = filtered.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(salesFilters.search) ||
        (i.customerName &&
          i.customerName.toLowerCase().includes(salesFilters.search)),
    );
  }
  if (salesFilters.date) {
    filtered = filtered.filter((i) => i.date === salesFilters.date);
  }

  renderSalesRows(filtered);
};

window.clearSalesFilters = function () {
  salesFilters.search = "";
  salesFilters.date = "";

  const searchInput = document.getElementById("sales-search-input");
  const dateInput = document.getElementById("sales-filter-date");
  const clearBtn = document.getElementById("sales-clear-filters-btn");

  if (searchInput) searchInput.value = "";
  if (dateInput) dateInput.value = "";
  if (clearBtn) clearBtn.classList.add("hidden");

  renderSalesRows(ERPState.invoices);
};

function viewInvoiceFromHistory(id) {
  const inv = ERPState.invoices.find((i) => i.id == id);
  if (inv) openInvoicePDFModal(inv);
}

async function changeInvoiceStatus(id, newStatus, btn) {
  let originalHtml = "";
  if (btn) {
    btn.disabled = true;
    originalHtml = btn.innerHTML;
    btn.innerHTML = "<span>Procesando...</span>";
  }
  try {
    const res = await fetch("api/update_invoice_status.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: parseInt(id), status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || `Factura cobrada con éxito.`, "success");
      await renderSalesModule(document.getElementById("main-content"));
    } else {
      showToast(
        data.message || "Error al actualizar estado de factura.",
        "error",
      );
    }
  } catch (err) {
    console.error("Error updating invoice status:", err);
    showToast("Error de red al actualizar estado de la factura.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

async function returnInvoice(id, btn) {
  const confirmReturn = confirm(
    "¿Está seguro de que desea realizar la devolución de esta factura? Se restablecerá el inventario de todos los productos vinculados y se registrarán los movimientos correspondientes.",
  );
  if (!confirmReturn) return;

  let originalHtml = "";
  if (btn) {
    btn.disabled = true;
    originalHtml = btn.innerHTML;
    btn.innerHTML = "<span>Procesando...</span>";
  }

  try {
    const res = await fetch("api/return_invoice.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: parseInt(id) }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || `Devolución procesada con éxito.`, "success");

      // Actualizar estado en memoria local
      const inv = ERPState.invoices.find((i) => i.id == id);
      if (inv) {
        inv.status = "Devuelta";
      }

      // Actualizar stock de productos local
      await updateProductsList();

      // Re-renderizar módulo
      await renderSalesModule(document.getElementById("main-content"));
    } else {
      showToast(data.message || "Error al procesar devolución.", "error");
    }
  } catch (err) {
    console.error("Error returning invoice:", err);
    showToast("Error de red al realizar la devolución.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

// ==================== CLIENTS CRM MODULE RENDERER ====================
let activeEditClientId = null;

function renderClientsModule(container) {
  const isAdmin = ERPState.session && ERPState.session.role === "admin";
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-toast-in">
      ${isAdmin ? `
      <!-- CLIENT FORM -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium animate-toast-in h-fit">
        <div class="mb-6">
          <h2 id="client-form-title" class="text-2xl font-extrabold tracking-tight dark:text-white">Añadir Cliente</h2>
          <p id="client-form-desc" class="text-xs text-slate-400 dark:text-slate-400 mt-1">Habilite perfiles corporativos o particulares en el CRM.</p>
        </div>

        <form id="form-client" class="space-y-4" onsubmit="saveClient(event)">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo / Empresa *</label>
            <input type="text" id="cli-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Comercial Muebles Madrid S.L.">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CIF / NIF / DNI *</label>
            <input type="text" id="cli-doc" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: B-81234567">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono *</label>
            <input type="text" id="cli-phone" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: 610 999 888">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
            <input type="email" id="cli-email" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: compras@mueblesmadrid.es">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección Fiscal / Envío</label>
            <input type="text" id="cli-address" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Av. de la Constitución 12, Coslada">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciudad / Provincia</label>
            <input type="text" id="cli-city" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Madrid">
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
              Guardar Cliente
            </button>
            <button type="button" onclick="cancelClientEdit()" id="btn-cli-cancel" class="hidden px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      ` : ''}

      <!-- CLIENTS LIST -->
      <div class="col-span-1 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Directorio CRM Clientes</h2>
            <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Busque de forma instantánea y gestione el directorio.</p>
          </div>
          <input type="text" id="cli-list-search" oninput="updateClientsList()" class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" placeholder="Buscar por DNI o Nombre...">
        </div>

        <div class="overflow-y-auto flex-1 pr-2 space-y-3" id="clients-list-container">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;

  activeEditClientId = null;
  updateClientsList();
}

async function updateClientsList() {
  const container = document.getElementById("clients-list-container");
  if (!container) return;

  const isAdmin = ERPState.session && ERPState.session.role === "admin";

  try {
    const res = await fetch("api/get_clients.php");
    const data = await res.json();
    if (data.success) {
      ERPState.clients = data.clients.map((c) => ({
        id: c.id,
        customId: c.custom_id,
        name: c.name,
        document: c.document,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        historyCount: parseInt(c.history_count) || 0,
        totalSpent: parseFloat(c.total_spent) || 0.0,
      }));
    }
  } catch (err) {
    console.error("Error fetching clients list:", err);
  }

  const search = document.getElementById("cli-list-search").value.toLowerCase();

  let filtered = [...ERPState.clients];
  if (search) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.document.toLowerCase().includes(search),
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p>No se encontraron clientes registrados</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((c) => {
      return `
      <div class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all">
        <div class="overflow-hidden mr-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded">${c.document}</span>
            <span class="text-slate-400 dark:text-slate-400 text-[10px]">• Compras: ${c.historyCount}</span>
          </div>
          <h4 class="font-bold text-slate-800 dark:text-white truncate mt-1.5 text-sm" title="${c.name}">${c.name}</h4>
          <span class="text-[10px] text-slate-400 dark:text-slate-400">${c.email} • Tlf: ${c.phone}</span>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="text-xs text-slate-400">Total Comprado</span>
          <span class="text-base font-extrabold dark:text-white block">${c.totalSpent.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
          ${isAdmin ? `
          <div class="flex items-center justify-end gap-1 mt-1 animate-toast-in">
            <button onclick="editClientAction('${c.id}')" class="text-blue-500 hover:text-blue-600 text-xs px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-semibold">Editar</button>
            <button onclick="deleteClientAction('${c.id}')" class="text-red-500 hover:text-red-650 text-xs px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold">Eliminar</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    })
    .join("");
}

async function saveClient(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const name = document.getElementById("cli-name").value;
  const doc = document.getElementById("cli-doc").value;
  const phone = document.getElementById("cli-phone").value;
  const email = document.getElementById("cli-email").value;
  const address = document.getElementById("cli-address").value;
  const city = document.getElementById("cli-city").value;

  const payload = {
    id: activeEditClientId ? parseInt(activeEditClientId) : 0,
    name,
    document: doc,
    phone,
    email,
    address,
    city,
  };

  try {
    const response = await fetch("api/save_client.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.success) {
      showToast(data.message, "success");
      cancelClientEdit();
      await updateClientsList();
    } else {
      showToast(data.message || "Error al guardar el cliente.", "error");
    }
  } catch (err) {
    console.error("Error saving client:", err);
    showToast("Error de conexión al guardar el cliente.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

function editClientAction(id) {
  const cli = ERPState.clients.find((c) => String(c.id) === String(id));
  if (!cli) return;

  activeEditClientId = cli.id;
  document.getElementById("client-form-title").innerText = "Editar Cliente";
  document.getElementById("client-form-desc").innerText =
    "Modifique los campos correspondientes a la ficha CRM del cliente.";

  document.getElementById("cli-name").value = cli.name;
  document.getElementById("cli-doc").value = cli.document;
  document.getElementById("cli-phone").value = cli.phone;
  document.getElementById("cli-email").value = cli.email;
  document.getElementById("cli-address").value = cli.address || "";
  document.getElementById("cli-city").value = cli.city || "";

  document.getElementById("btn-cli-cancel").classList.remove("hidden");
}

function cancelClientEdit() {
  activeEditClientId = null;
  const form = document.getElementById("form-client");
  if (form) form.reset();

  document.getElementById("client-form-title").innerText = "Añadir Cliente";
  document.getElementById("client-form-desc").innerText =
    "Habilite perfiles corporativos o particulares en el CRM.";

  const btnCancel = document.getElementById("btn-cli-cancel");
  if (btnCancel) btnCancel.classList.add("hidden");
}

async function deleteClientAction(id) {
  const cli = ERPState.clients.find((c) => String(c.id) === String(id));
  if (!cli) return;

  const name = cli.name;
  if (confirm(`¿Está seguro que desea eliminar a "${name}"?`)) {
    try {
      const response = await fetch("api/delete_client.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(id) }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, "warning");
        await updateClientsList();
      } else {
        showToast(data.message || "Error al eliminar el cliente.", "error");
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      showToast("Error de conexión al eliminar el cliente.", "error");
    }
  }
}

// ==================== SUPPLIERS MODULE RENDERER ====================
let activeEditSupplierId = null;

function renderSuppliersModule(container) {
  const isAdmin = ERPState.session && ERPState.session.role === "admin";
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-toast-in">
      ${isAdmin ? `
      <!-- SUPPLIER FORM -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium animate-toast-in h-fit">
        <div class="mb-6">
          <h2 id="sup-form-title" class="text-2xl font-extrabold tracking-tight dark:text-white">Añadir Proveedor</h2>
          <p id="sup-form-desc" class="text-xs text-slate-400 dark:text-slate-400 mt-1">Configure las fichas de proveedores de restock del almacén.</p>
        </div>

        <form id="form-supplier" class="space-y-4" onsubmit="saveSupplier(event)">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Empresa / Razón Social *</label>
            <input type="text" id="sup-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Flex Muebles S.A.">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Persona de Contacto *</label>
            <input type="text" id="sup-contact" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Elena Ruiz">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono *</label>
            <input type="text" id="sup-phone" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: 916 987 654">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado *</label>
            <select id="sup-status" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
            <input type="email" id="sup-email" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: comercial@flexmuebles.com">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección Sede / Polígono</label>
            <input type="text" id="sup-address" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Pol. Ind. La Torrecilla, Córdoba">
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
              Guardar Proveedor
            </button>
            <button type="button" onclick="cancelSupplierEdit()" id="btn-sup-cancel" class="hidden px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      ` : ''}

      <!-- SUPPLIERS LIST -->
      <div class="col-span-1 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Proveedores de Almacén</h2>
            <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Busque de forma instantánea y gestione el catálogo de proveedores.</p>
          </div>
          <input type="text" id="sup-list-search" oninput="updateSuppliersList()" class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" placeholder="Buscar por Nombre...">
        </div>

        <div class="overflow-y-auto flex-1 pr-2 space-y-3" id="suppliers-list-container">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;

  activeEditSupplierId = null;
  updateSuppliersList();
}

async function updateSuppliersList() {
  const container = document.getElementById("suppliers-list-container");
  if (!container) return;

  const isAdmin = ERPState.session && ERPState.session.role === "admin";

  try {
    const res = await fetch("api/get_suppliers.php");
    const data = await res.json();
    if (data.success) {
      ERPState.suppliers = data.suppliers.map((s) => ({
        id: s.id,
        customId: s.custom_id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        address: s.address,
        status: s.status,
      }));
    }
  } catch (err) {
    console.error("Error fetching suppliers list:", err);
  }

  const search = document.getElementById("sup-list-search").value.toLowerCase();

  let filtered = [...ERPState.suppliers];
  if (search) {
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(search));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p>No se encontraron proveedores</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((s) => {
      const statusPill =
        s.status === "Activo"
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-slate-100 text-slate-400";
      return `
      <div class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all">
        <div class="overflow-hidden mr-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${statusPill}">${s.status}</span>
            <span class="text-slate-400 dark:text-slate-400 text-[10px]">• Contacto: ${s.contact}</span>
          </div>
          <h4 class="font-bold text-slate-800 dark:text-white truncate mt-1.5 text-sm" title="${s.name}">${s.name}</h4>
          <span class="text-[10px] text-slate-400 dark:text-slate-400">${s.email} • Tlf: ${s.phone}</span>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="text-[10px] text-slate-400 block">Sede fiscal</span>
          <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 block truncate max-w-[150px]" title="${s.address}">${s.address}</span>
          ${isAdmin ? `
          <div class="flex items-center justify-end gap-1 mt-2 animate-toast-in">
            <button onclick="editSupplierAction('${s.id}')" class="text-blue-500 hover:text-blue-600 text-xs px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-semibold">Editar</button>
            <button onclick="deleteSupplierAction('${s.id}')" class="text-red-500 hover:text-red-650 text-xs px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold">Eliminar</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    })
    .join("");
}

async function saveSupplier(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const name = document.getElementById("sup-name").value;
  const contact = document.getElementById("sup-contact").value;
  const phone = document.getElementById("sup-phone").value;
  const status = document.getElementById("sup-status").value;
  const email = document.getElementById("sup-email").value;
  const address = document.getElementById("sup-address").value;

  const payload = {
    id: activeEditSupplierId ? parseInt(activeEditSupplierId) : 0,
    name,
    contact,
    phone,
    status,
    email,
    address,
  };

  try {
    const response = await fetch("api/save_supplier.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.success) {
      showToast(data.message, "success");
      cancelSupplierEdit();
      await updateSuppliersList();
    } else {
      showToast(data.message || "Error al guardar el proveedor.", "error");
    }
  } catch (err) {
    console.error("Error saving supplier:", err);
    showToast("Error de conexión al guardar el proveedor.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

function editSupplierAction(id) {
  const s = ERPState.suppliers.find((x) => String(x.id) === String(id));
  if (!s) return;

  activeEditSupplierId = s.id;
  document.getElementById("sup-form-title").innerText = "Editar Proveedor";
  document.getElementById("sup-form-desc").innerText =
    "Modifique los campos correspondientes a la ficha del proveedor de restock.";

  document.getElementById("sup-name").value = s.name;
  document.getElementById("sup-contact").value = s.contact;
  document.getElementById("sup-phone").value = s.phone;
  document.getElementById("sup-status").value = s.status;
  document.getElementById("sup-email").value = s.email;
  document.getElementById("sup-address").value = s.address || "";

  document.getElementById("btn-sup-cancel").classList.remove("hidden");
}

function cancelSupplierEdit() {
  activeEditSupplierId = null;
  const form = document.getElementById("form-supplier");
  if (form) form.reset();

  document.getElementById("sup-form-title").innerText = "Añadir Proveedor";
  document.getElementById("sup-form-desc").innerText =
    "Configure las fichas de proveedores de restock del almacén.";

  const btnCancel = document.getElementById("btn-sup-cancel");
  if (btnCancel) btnCancel.classList.add("hidden");
}

async function deleteSupplierAction(id) {
  const s = ERPState.suppliers.find((x) => String(x.id) === String(id));
  if (!s) return;

  const name = s.name;
  if (confirm(`¿Está seguro que desea eliminar a "${name}"?`)) {
    try {
      const response = await fetch("api/delete_supplier.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(id) }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, "warning");
        await updateSuppliersList();
      } else {
        showToast(data.message || "Error al eliminar el proveedor.", "error");
      }
    } catch (err) {
      console.error("Error deleting supplier:", err);
      showToast("Error de conexión al eliminar el proveedor.", "error");
    }
  }
}

// ==================== PURCHASING (PO) ORDERS MODULE RENDERER ====================
let purchaseFilters = {
  search: "",
  supplier: "",
  date: "",
};

window.togglePurchaseCustomDropdown = function (menuId, chevronId) {
  const menu = document.getElementById(menuId);
  const chevron = document.getElementById(chevronId);
  if (!menu) return;

  const isHidden = menu.classList.contains("hidden");

  if (isHidden) {
    menu.classList.remove("hidden");
    setTimeout(() => {
      menu.classList.remove("opacity-0", "scale-95");
      menu.classList.add("opacity-100", "scale-100");
      if (chevron) chevron.classList.add("rotate-180");
    }, 10);
  } else {
    menu.classList.remove("opacity-100", "scale-100");
    menu.classList.add("opacity-0", "scale-95");
    if (chevron) chevron.classList.remove("rotate-180");
    setTimeout(() => {
      menu.classList.add("hidden");
    }, 150);
  }
};

window.selectPurchaseSupplierOption = function (supplierName, displayLabel) {
  const menu = document.getElementById("purchase-supplier-dropdown-menu");
  const chevron = document.getElementById("purchase-supplier-chevron");
  const label = document.getElementById("purchase-supplier-dropdown-label");

  if (label) label.textContent = displayLabel;
  purchaseFilters.supplier = supplierName;

  if (menu) {
    menu.classList.remove("opacity-100", "scale-100");
    menu.classList.add("opacity-0", "scale-95");
    if (chevron) chevron.classList.remove("rotate-180");
    setTimeout(() => {
      menu.classList.add("hidden");
    }, 150);
  }

  togglePurchaseClearFiltersBtn();
  updatePurchasesTable();
};

window.triggerPurchaseSearch = function () {
  purchaseFilters.search = document.getElementById(
    "purchase-search-input",
  ).value;
  togglePurchaseClearFiltersBtn();
  updatePurchasesTable();
};

window.triggerPurchaseDateFilter = function () {
  purchaseFilters.date = document.getElementById("purchase-filter-date").value;
  togglePurchaseClearFiltersBtn();
  updatePurchasesTable();
};

window.clearPurchaseFilters = function () {
  purchaseFilters.search = "";
  const searchInput = document.getElementById("purchase-search-input");
  if (searchInput) searchInput.value = "";

  purchaseFilters.supplier = "";
  const label = document.getElementById("purchase-supplier-dropdown-label");
  if (label) label.textContent = "Todos los Proveedores";

  purchaseFilters.date = "";
  const dateInput = document.getElementById("purchase-filter-date");
  if (dateInput) dateInput.value = "";

  togglePurchaseClearFiltersBtn();
  updatePurchasesTable();
};

function togglePurchaseClearFiltersBtn() {
  const clearBtn = document.getElementById("purchase-clear-filters-btn");
  if (!clearBtn) return;

  const hasSearch = purchaseFilters.search !== "";
  const hasSupplier = purchaseFilters.supplier !== "";
  const hasDate = purchaseFilters.date !== "";

  if (hasSearch || hasSupplier || hasDate) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
}

async function updatePurchasesTable() {
  const body = document.getElementById("purchases-table-body");
  if (!body) return;

  let filtered = [...ERPState.purchaseOrders];

  if (purchaseFilters.search) {
    const sVal = purchaseFilters.search.toLowerCase();
    filtered = filtered.filter(
      (po) =>
        po.poNumber.toLowerCase().includes(sVal) ||
        po.supplierName.toLowerCase().includes(sVal),
    );
  }

  if (purchaseFilters.supplier) {
    filtered = filtered.filter(
      (po) => po.supplierName === purchaseFilters.supplier,
    );
  }

  if (purchaseFilters.date) {
    filtered = filtered.filter((po) => po.date === purchaseFilters.date);
  }

  if (filtered.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400">
          Sin órdenes de compra registradas para los filtros aplicados
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = filtered
    .slice()
    .reverse()
    .map((po) => {
      let badgeClass = "bg-slate-100 text-slate-500";
      if (po.status === "Recibida")
        badgeClass =
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold";
      else if (po.status === "Aprobada")
        badgeClass =
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold";
      else if (po.status === "Pendiente")
        badgeClass =
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold";
      else if (po.status === "Cancelada")
        badgeClass = "bg-red-500/10 text-red-600 dark:text-red-400 font-bold";

      return `
      <tr class="flex flex-col lg:table-row border border-slate-100 dark:border-slate-700/60 lg:border-none p-4 lg:p-0 rounded-2xl mb-4 lg:mb-0 bg-white dark:bg-slate-800 lg:bg-transparent shadow-sm lg:shadow-none gap-1.5 lg:gap-0">
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Código OC</span>
          <span class="font-mono font-bold dark:text-slate-300">${po.poNumber}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor</span>
          <span class="font-bold dark:text-white text-right lg:text-left">${po.supplierName}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha Registro</span>
          <span class="text-slate-500 dark:text-slate-400">${po.date}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Items</span>
          <span class="font-semibold dark:text-slate-300">${po.products.length} referencias</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Coste Total</span>
          <span class="font-black dark:text-white">${po.total.toLocaleString("es-ES")} €</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] ${badgeClass}">${po.status}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4.5 px-0 lg:px-6 text-center">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Operaciones</span>
          <div class="flex items-center justify-end lg:justify-center gap-1.5">
            <button onclick="viewPurchaseDetails('${po.id}')" class="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all">
              Ver
            </button>
            ${
              po.status === "Pendiente"
                ? `
              <button onclick="changePOStatus('${po.id}', 'Aprobada')" class="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all">Aprobar</button>
            `
                : ""
            }
            ${
              po.status === "Aprobada"
                ? `
              <button onclick="changePOStatus('${po.id}', 'Recibida')" class="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all">Recibir</button>
            `
                : ""
            }
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

async function renderPurchasesModule(container) {
  purchaseFilters = {
    search: "",
    supplier: "",
    date: "",
  };

  try {
    const res = await fetch("api/get_purchases.php");
    const data = await res.json();
    if (data.success) {
      ERPState.purchaseOrders = data.purchaseOrders;
    }
  } catch (err) {
    console.error("Error fetching purchases list:", err);
  }

  try {
    const sRes = await fetch("api/get_suppliers.php");
    const sData = await sRes.json();
    if (sData.success) {
      ERPState.suppliers = sData.suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        address: s.address,
        status: s.status,
      }));
    }
  } catch (err) {
    console.error("Error fetching suppliers for purchase dropdown:", err);
  }

  const supsListHTML =
    `
    <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectPurchaseSupplierOption('', 'Todos los Proveedores')">Todos los Proveedores</button>
  ` +
    ERPState.suppliers
      .map(
        (s) => `
    <button class="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onclick="selectPurchaseSupplierOption('${s.name}', '${s.name}')">${s.name}</button>
  `,
      )
      .join("");

  container.innerHTML = `
    <div class="space-y-6 animate-toast-in">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight dark:text-white">Órdenes de Compra</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Gestione el reaprovisionamiento de stock para almacén desde proveedores autorizados.</p>
        </div>
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onclick="exportPurchasesToCSV()" class="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
            Exportar CSV
          </button>
          <button onclick="openCreatePurchaseOrderModal()" class="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2">
            Nueva Órden Compra
          </button>
        </div>
      </div>

      <!-- FILTER PANEL -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col lg:flex-row gap-4 items-end">
        <!-- Buscador -->
        <div class="w-full lg:flex-1" id="purchase-search-container">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Buscador</label>
          <div class="relative w-full">
            <input type="text" id="purchase-search-input" oninput="triggerPurchaseSearch()" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all" placeholder="Buscar por código u orden...">
            <span class="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
          </div>
        </div>

        <!-- Supplier Custom Dropdown -->
        <div class="w-full lg:w-64" id="purchase-supplier-dropdown-container">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Proveedor</label>
          <div class="relative w-full">
            <button type="button" onclick="togglePurchaseCustomDropdown('purchase-supplier-dropdown-menu', 'purchase-supplier-chevron')" class="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 focus:outline-none flex items-center justify-between cursor-pointer transition-all relative">
              <span class="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </span>
              <span id="purchase-supplier-dropdown-label" class="truncate">Todos los Proveedores</span>
              <span class="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none">
                <svg class="w-3.5 h-3.5 transition-transform duration-200" id="purchase-supplier-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
              </span>
            </button>
            
            <div id="purchase-supplier-dropdown-menu" class="hidden absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-premium dark:shadow-dark-premium p-1.5 z-30 max-h-60 overflow-y-auto transform scale-95 opacity-0 origin-top transition-all duration-150 flex flex-col gap-0.5">
              ${supsListHTML}
            </div>
          </div>
        </div>

        <!-- Date Filter -->
        <div class="w-full lg:w-48">
          <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Fecha</label>
          <input type="date" id="purchase-filter-date" onchange="triggerPurchaseDateFilter()" class="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-700/85 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all">
        </div>
        
        <!-- Clear Filters Button -->
        <button id="purchase-clear-filters-btn" onclick="clearPurchaseFilters()" class="hidden w-full lg:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 hover:shadow-sm">
          <span>Limpiar Filtros</span>
          <span class="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">✕</span>
        </button>
      </div>

      <div class="bg-transparent lg:bg-white dark:lg:bg-slate-800 rounded-3xl border-none lg:border border-slate-200/60 dark:border-slate-700 shadow-none lg:shadow-premium dark:lg:shadow-dark-premium overflow-hidden">
        <div class="table-scroll-container overflow-x-hidden lg:overflow-visible">
          <table class="w-full text-left text-sm block lg:table">
            <thead class="hidden lg:table-header-group bg-slate-55 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-700/80">
              <tr>
                <th class="py-4.5 px-6">Código OC</th>
                <th class="py-4.5 px-6">Proveedor</th>
                <th class="py-4.5 px-6">Fecha Registro</th>
                <th class="py-4.5 px-6 text-center">Items</th>
                <th class="py-4.5 px-6 text-right">Coste Total</th>
                <th class="py-4.5 px-6 text-center">Estado</th>
                <th class="py-4.5 px-6 text-center">Operaciones</th>
              </tr>
            </thead>
            <tbody id="purchases-table-body" class="divide-y divide-slate-100 dark:divide-slate-700/50 block lg:table-row-group">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  updatePurchasesTable();
}

function viewPurchaseDetails(id) {
  const po = ERPState.purchaseOrders.find((p) => p.id == id);
  if (!po) return;

  const itemRows = po.products
    .map(
      (p) => `
    <tr class="border-b border-slate-100 dark:border-slate-700/60 text-xs">
      <td class="py-3 font-bold dark:text-white">${p.name}</td>
      <td class="py-3 text-center font-bold">${p.qty} uds</td>
      <td class="py-3 text-right">${formatEuro(p.cost)}</td>
      <td class="py-3 text-right font-black">${formatEuro((p.cost * p.qty))}</td>
    </tr>
  `,
    )
    .join("");

  openModal(`
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Ficha Órden Compra</span>
          <h3 class="text-xl font-bold dark:text-white mt-1.5">${po.poNumber}</h3>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600">✕</button>
      </div>

      <div class="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
        <div>
          <span class="text-slate-400 block">Proveedor asignado</span>
          <b class="text-slate-800 dark:text-white mt-0.5 block">${po.supplierName}</b>
        </div>
        <div>
          <span class="text-slate-400 block">Fecha y Estado</span>
          <b class="text-slate-800 dark:text-white mt-0.5 block">${po.date} • <span class="text-blue-500">${po.status}</span></b>
        </div>
      </div>

      <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detalle Referencias</h5>
      <div class="border border-slate-100 dark:border-slate-700 rounded-xl overflow-x-auto no-shadows mb-6">
        <table class="w-full text-left text-xs border-collapse whitespace-nowrap">
          <thead class="bg-slate-55 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <th class="py-2.5 px-4">Articulo</th>
              <th class="py-2.5 px-4 text-center">Cant</th>
              <th class="py-2.5 px-4 text-right">Coste U.</th>
              <th class="py-2.5 px-4 text-right">Importe</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700 px-4">
            ${itemRows}
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center text-slate-800 dark:text-white border-t border-slate-100 dark:border-slate-700 pt-4">
        <span class="text-xs font-bold uppercase text-slate-400">COSTE DE ADQUISICIÓN</span>
        <span class="text-xl font-black font-display text-blue-600 dark:text-blue-400">${po.total.toLocaleString("es-ES")} €</span>
      </div>
    </div>
  `);
}

async function changePOStatus(id, newStatus) {
  try {
    const res = await fetch("api/update_purchase_status.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: parseInt(id), status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || `Órden de compra actualizada.`, "success");
      await updateProductsList();
      await renderPurchasesModule(document.getElementById("main-content"));
    } else {
      showToast(
        data.message || "Error al actualizar órden de compra.",
        "error",
      );
    }
  } catch (err) {
    console.error("Error updating PO status:", err);
    showToast("Error de red al actualizar estado.", "error");
  }
}

// Creador de formulario modal para realizar pedidos
let createPOSelectedProducts = [];
async function openCreatePurchaseOrderModal() {
  createPOSelectedProducts = [];

  // Obtener proveedores y productos primero para asegurar opciones de base de datos frescas
  try {
    const supRes = await fetch("api/get_suppliers.php");
    const supData = await supRes.json();
    if (supData.success) {
      ERPState.suppliers = supData.suppliers.map((s) => ({
        id: s.id,
        customId: s.custom_id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        address: s.address,
        status: s.status,
      }));
    }

    const prdRes = await fetch("api/get_products.php");
    const prdData = await prdRes.json();
    if (prdData.success) {
      ERPState.products = prdData.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        supplierId: p.supplier_id,
        supplierName: p.supplier_name,
        buyPrice: parseFloat(p.buy_price) || 0,
        sellPrice: parseFloat(p.sell_price) || 0,
        stock: parseInt(p.stock) || 0,
        minStock: parseInt(p.min_stock) || 0,
        weight: p.weight,
        dimensions: p.dimensions,
        image: p.image_url,
        description: p.description,
        status: p.status,
      }));
      updateNotificationsSystem();
    }
  } catch (err) {
    console.error("Error fetching suppliers/products for PO modal:", err);
  }

  const suppliersOptions = ERPState.suppliers
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");
  const productsOptions = ERPState.products
    .map(
      (p) =>
        `<option value="${p.id}">${p.name} (Coste: ${formatEuro(p.buyPrice)})</option>`,
    )
    .join("");

  openModal(
    `
    <div class="p-6 max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold dark:text-white">Generar Órden de Compra (PO)</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600">✕</button>
      </div>

      <div class="space-y-4 flex-1 overflow-y-auto px-1.5">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asignar Distribuidor / Proveedor</label>
          <select id="po-supplier-sel" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white">
            ${suppliersOptions}
          </select>
        </div>

        <div class="bg-slate-55 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <label class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Añadir referencia al pedido</label>
          <div class="flex flex-col sm:flex-row gap-2">
            <select id="po-product-sel" class="w-full sm:flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs focus:outline-none">
              ${productsOptions}
            </select>
            <div class="flex gap-2 w-full sm:w-auto">
              <input type="number" id="po-qty-input" class="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs text-center focus:outline-none" value="10" placeholder="Cant">
              <button onclick="addProductToPOOrder()" class="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold">Añadir</button>
            </div>
          </div>
        </div>

        <!-- LIST OF PO ITEMS -->
        <h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mt-4">Líneas de adquisición</h5>
        <div class="border border-slate-100 dark:border-slate-700 rounded-xl overflow-auto max-h-48">
          <table class="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead class="bg-slate-55 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-2.5 px-4">Articulo</th>
                <th class="py-2.5 px-4 text-center">Cant</th>
                <th class="py-2.5 px-4 text-right">Coste Unitario</th>
                <th class="py-2.5 px-4 text-center">Retirar</th>
              </tr>
            </thead>
            <tbody id="po-lines-body" class="divide-y divide-slate-100 dark:divide-slate-700 px-4">
              <tr>
                <td colspan="4" class="py-6 text-center text-slate-400">Ningún producto añadido todavía</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PO TOTALS -->
      <div class="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 flex justify-between items-center text-slate-800 dark:text-white flex-shrink-0">
        <span class="text-xs font-bold uppercase text-slate-400">COSTE DE ORDEN</span>
        <span class="text-lg font-black font-display text-blue-600 dark:text-blue-400" id="po-cost-disp">0.00 €</span>
      </div>

      <button onclick="savePurchaseOrder()" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md mt-4 flex-shrink-0">
        Registrar Órden y Solicitar Aprobación
      </button>
    </div>
  `,
    "max-w-2xl",
  );
}

function addProductToPOOrder() {
  const pId = document.getElementById("po-product-sel").value;
  const qty = parseInt(document.getElementById("po-qty-input").value) || 0;

  if (qty <= 0) {
    showToast("La cantidad pedida debe ser mayor que cero.", "error");
    return;
  }

  const prd = ERPState.products.find((p) => p.id == pId);
  if (!prd) return;

  const existing = createPOSelectedProducts.find((x) => x.productId == pId);
  if (existing) {
    existing.qty += qty;
  } else {
    createPOSelectedProducts.push({
      productId: prd.id,
      name: prd.name,
      qty: qty,
      cost: prd.buyPrice,
    });
  }

  updatePOLinesTable();
}

function removeProductFromPOOrder(pId) {
  createPOSelectedProducts = createPOSelectedProducts.filter(
    (x) => x.productId != pId,
  );
  updatePOLinesTable();
}

function updatePOLinesTable() {
  const body = document.getElementById("po-lines-body");
  if (!body) return;

  if (createPOSelectedProducts.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">Ningún producto añadido todavía</td></tr>`;
    document.getElementById("po-cost-disp").innerText = "0.00 €";
    return;
  }

  let totalCost = 0;
  body.innerHTML = createPOSelectedProducts
    .map((p) => {
      totalCost += p.cost * p.qty;
      return `
      <tr class="text-xs">
        <td class="py-2.5 px-4 font-bold dark:text-white">${p.name}</td>
        <td class="py-2.5 px-4 text-center font-bold">${p.qty} uds</td>
        <td class="py-2.5 px-4 text-right">${formatEuro(p.cost)}</td>
        <td class="py-2.5 px-4 text-center">
          <button onclick="removeProductFromPOOrder('${p.productId}')" class="text-red-500 hover:text-red-700">✕</button>
        </td>
      </tr>
    `;
    })
    .join("");

  document.getElementById("po-cost-disp").innerText =
    `${totalCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
}

async function savePurchaseOrder() {
  if (createPOSelectedProducts.length === 0) {
    showToast(
      "Añada al menos un producto a las líneas de adquisición.",
      "error",
    );
    return;
  }

  const supplierId = document.getElementById("po-supplier-sel").value;
  const supplier = ERPState.suppliers.find((s) => s.id == supplierId);
  if (!supplier) return;

  const saveBtn = document.querySelector(
    '#modal-card button[onclick="savePurchaseOrder()"]',
  );
  let originalHtml = "";
  if (saveBtn) {
    saveBtn.disabled = true;
    originalHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = "<span>Guardando...</span>";
  }

  let totalCost = 0;
  createPOSelectedProducts.forEach((p) => {
    totalCost += p.cost * p.qty;
  });

  const payload = {
    supplierId: parseInt(supplierId),
    total: parseFloat(totalCost.toFixed(2)),
    products: createPOSelectedProducts.map((p) => ({
      productId: parseInt(p.productId),
      qty: parseInt(p.qty),
      cost: parseFloat(p.cost),
    })),
  };

  try {
    const res = await fetch("api/create_purchase.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || "Órden de compra registrada.", "success");
      closeModal();
      await renderPurchasesModule(document.getElementById("main-content"));
    } else {
      showToast(data.message || "Error al guardar órden de compra.", "error");
    }
  } catch (err) {
    console.error("Error saving purchase order:", err);
    showToast("Error de red al guardar órden.", "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
    }
  }
}

// ==================== REPORTS MODULE RENDERER ====================
function renderReportsModule(container) {
  // Agregar ventas, compras y costes totales para calcular el margen neto
  const totalRevenue = ERPState.invoices
    .filter((i) => i.status === "Cobrada")
    .reduce((acc, i) => acc + i.total, 0);

  const totalNetBilling = ERPState.invoices
    .filter((i) => i.status === "Cobrada")
    .reduce((acc, i) => acc + i.subtotal, 0);

  // Coste de adquisición para todos los productos de la factura completados
  let costOfGoodsSold = 0;
  ERPState.invoices
    .filter((i) => i.status === "Cobrada")
    .forEach((inv) => {
      inv.products.forEach((item) => {
        const match = ERPState.products.find((p) => p.id === item.productId);
        const buyPrice = match ? match.buyPrice : item.price * 0.4; // margen de respaldo alternativo (fallback)
        costOfGoodsSold += buyPrice * item.qty;
      });
    });

  const netProfit = totalNetBilling - costOfGoodsSold;
  const profitMarginPercent =
    totalNetBilling > 0 ? (netProfit / totalNetBilling) * 100 : 0;

  container.innerHTML = `
    <div class="space-y-8 animate-toast-in">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight dark:text-white">Reportes Analíticos</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1">Análisis e informes detallados de la rentabilidad, stock y compras de Anaya Outlet.</p>
        </div>
        <button onclick="window.print()" class="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2">
          Exportar Informe PDF
        </button>
      </div>

      <!-- ANALYTICAL STAT CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Ventas Registradas</span>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${totalRevenue.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Total cobrado (IVA incluido)</span>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Facturación Neta</span>
          <h3 class="text-2xl font-black font-display dark:text-white mt-3">${totalNetBilling.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-slate-400 mt-1.5 block">Base imponible sin impuestos</span>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Coste Adquisiciones (COGS)</span>
          <h3 class="text-2xl font-black font-display text-red-500 mt-3">${costOfGoodsSold.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-red-400/80 mt-1.5 block">Coste real de adquisición de mercancía</span>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Margen Comercial Neto</span>
          <h3 class="text-2xl font-black font-display text-emerald-500 mt-3">${netProfit.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</h3>
          <span class="text-[10px] text-emerald-500/85 mt-1.5 block">Rentabilidad promedio de <b>${profitMarginPercent.toFixed(1)}%</b></span>
        </div>
      </div>

      <!-- CHARTS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white">Curva de Facturación Acumulada</h4>
              <p class="text-xs text-slate-400">Análisis fiscal por base imponible neta diaria</p>
            </div>
          </div>
          <div class="h-80 w-full">
            <canvas id="chart-rep-billing-line"></canvas>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white">Margen Comercial por Familias</h4>
              <p class="text-xs text-slate-400">Porcentaje de markup aplicado según categoría de artículo</p>
            </div>
          </div>
          <div class="h-80 w-full flex items-center justify-center">
            <canvas id="chart-rep-margins-radar"></canvas>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
        <h4 class="font-bold text-slate-800 dark:text-white mb-6">Desglose Fiscal de Transacciones</h4>
        <div class="overflow-x-auto no-shadows">
          <table class="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-3 px-4">Código Factura</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4 text-right">Base Imponible</th>
                <th class="py-3 px-4 text-right">Impuesto (21% IVA)</th>
                <th class="py-3 px-4 text-right">Descuentos</th>
                <th class="py-3 px-4 text-right">Importe Cobrado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              ${ERPState.invoices
                .map(
                  (i) => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td class="py-3 px-4 font-mono font-bold">${i.invoiceNumber}</td>
                  <td class="py-3 px-4">${i.date}</td>
                  <td class="py-3 px-4 font-semibold">${i.clientName}</td>
                  <td class="py-3 px-4 text-right">${formatEuro(i.subtotal)}</td>
                  <td class="py-3 px-4 text-right">${formatEuro(i.taxAmount)}</td>
                  <td class="py-3 px-4 text-right text-red-500 font-bold">${i.discount > 0 ? `-${formatEuro(i.discount)}` : "0,00 €"}</td>
                  <td class="py-3 px-4 text-right font-black">${formatEuro(i.total)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  initReportsCharts();
}

function initReportsCharts() {
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#94A3B8" : "#64748B";
  const gridColor = isDark ? "#334155" : "#E2E8F0";

  // 1. Gráfico de línea de facturación
  const ctxLine = document.getElementById("chart-rep-billing-line");
  if (ctxLine) {
    // Acumular importes de facturas a lo largo de los días de mayo
    const daysData = {};
    for (let d = 10; d <= 30; d++) {
      daysData[`2026-05-${d}`] = 0;
    }

    ERPState.invoices
      .filter((i) => i.status === "Cobrada")
      .forEach((i) => {
        if (daysData[i.date] !== undefined) {
          daysData[i.date] += i.subtotal;
        }
      });

    const chartLine = new Chart(ctxLine, {
      type: "line",
      data: {
        labels: Object.keys(daysData).map((k) => k.split("-")[2]),
        datasets: [
          {
            label: "Facturación Neta Diaria (€)",
            data: Object.values(daysData),
            borderColor: "#2563EB",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            tension: 0.35,
            fill: true,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } },
        },
      },
    });
    dashboardCharts.push(chartLine);
  }

  // 2. Gráfico de radar de márgenes
  const ctxRadar = document.getElementById("chart-rep-margins-radar");
  if (ctxRadar) {
    const chartRadar = new Chart(ctxRadar, {
      type: "radar",
      data: {
        labels: [
          "Sofás y Descanso",
          "Muebles de Salón",
          "Electrodomésticos",
          "Dormitorio",
          "Menaje y Hogar",
        ],
        datasets: [
          {
            label: "Margen Comercial Neto Promedio (%)",
            data: [115, 110, 95, 130, 125], // márgenes comerciales
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderColor: "#10B981",
            borderWidth: 2,
            pointBackgroundColor: "#10B981",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          r: {
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            ticks: { display: false },
            pointLabels: {
              color: textColor,
              font: { family: "Plus Jakarta Sans", weight: "bold" },
            },
          },
        },
      },
    });
    dashboardCharts.push(chartRadar);
  }
}

// ==================== CONFIGURATION / SETTINGS MODULE RENDERER ====================
window.switchSettingsTab = function(tab) {
  const container = document.getElementById("main-content");
  renderSettingsModule(container, tab);
};

window.saveProfile = async function(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const payload = {
    name: document.getElementById("prof-name").value,
    email: document.getElementById("prof-email").value,
    phone: document.getElementById("prof-phone").value,
    password: document.getElementById("prof-password").value,
  };

  try {
    const res = await fetch("api/update_profile.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, "success");
      ERPState.session.name = payload.name;
      ERPState.session.email = payload.email;
      ERPState.session.phone = payload.phone;
      
      updateUserProfileUI(ERPState.session);
      switchSettingsTab('profile');
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    showToast("Error de red al actualizar el perfil.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
};

function renderSettingsTabContent(tab) {
  const panel = document.getElementById("settings-form-panel");
  if (!panel) return;

  if (tab === "company") {
    const company = ERPState.settings;
    const isAdmin = ERPState.session && ERPState.session.role === "admin";
    const disabledAttr = isAdmin ? "" : "disabled";

    panel.innerHTML = `
      <h4 class="font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">Identidad de la Empresa y Valores Fiscales</h4>
      <form id="form-settings" class="space-y-5" onsubmit="saveSettings(event)">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Comercial / Razón Social *</label>
          <input type="text" id="set-name" required ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.companyName}">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Identificador Fiscal CIF/NIF *</label>
            <input type="text" id="set-cif" required ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.cif}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tasa de Impuestos IVA (%) *</label>
            <input type="number" id="set-tax" required ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.taxRate}">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono *</label>
            <input type="text" id="set-phone" required ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.phone}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo de Soporte *</label>
            <input type="email" id="set-email" required ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.email}">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección Sede Principal</label>
          <input type="text" id="set-address" ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.address}">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciudad</label>
            <input type="text" id="set-city" ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.city}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Provincia</label>
            <input type="text" id="set-state" ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${company.state}">
          </div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-700 pt-5 mt-5">
          <h4 class="font-bold text-slate-800 dark:text-white mb-4">Pasarela de SMS (Twilio 2FA)</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Twilio Account SID</label>
              <input type="text" id="set-twilio-sid" ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" placeholder="AC..." value="${company.twilioSid || ""}">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Twilio Auth Token</label>
              <input type="password" id="set-twilio-token" ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" placeholder="••••••••" value="${company.twilioAuthToken || ""}">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono Remitente de Twilio</label>
            <input type="text" id="set-twilio-phone" ${disabledAttr} class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" placeholder="Ej: +1234567890" value="${company.twilioPhone || ""}">
          </div>
        </div>

        ${
          isAdmin
            ? `
        <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-750 text-white font-semibold rounded-xl text-sm transition-all shadow-md mt-4">
          Guardar Configuración
        </button>
        `
            : ""
        }
      </form>
    `;
  } else if (tab === "profile") {
    const session = ERPState.session;
    panel.innerHTML = `
      <h4 class="font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">Mi Perfil de Usuario</h4>
      <form id="form-profile" class="space-y-5" onsubmit="saveProfile(event)">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
          <input type="text" id="prof-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${session.name || ""}">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
            <input type="email" id="prof-email" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" value="${session.email || ""}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
            <input type="text" id="prof-phone" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" placeholder="+34..." value="${session.phone || ""}">
          </div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-700 pt-5 mt-5">
          <h4 class="font-bold text-slate-800 dark:text-white mb-2">Cambiar Contraseña</h4>
          <p class="text-xs text-slate-400 dark:text-slate-400 mb-4">Deje el campo vacío si no desea modificar su contraseña actual.</p>
          
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nueva Contraseña</label>
            <input type="password" id="prof-password" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white" placeholder="Mínimo 6 caracteres">
          </div>
        </div>

        <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-750 text-white font-semibold rounded-xl text-sm transition-all shadow-md mt-4">
          Guardar Cambios del Perfil
        </button>
      </form>
    `;
  }
}

function renderSettingsModule(container, activeTab = "profile") {
  const company = ERPState.settings;
  const session = ERPState.session;
  const isAdmin = session && session.role === "admin";

  let selectedTab = activeTab;
  if (!isAdmin) {
    selectedTab = "profile";
  }

  const tabBtnClass = "text-left px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ";
  const activeClass = "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  const inactiveClass = "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60";

  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-8 animate-toast-in">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight dark:text-white">Configuración del ERP</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Configure los parámetros operacionales de la empresa o actualice sus datos de perfil personal.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Vertical Tabs List -->
        <div class="space-y-1.5 flex flex-col">
          ${
            isAdmin
              ? `
          <button id="tab-btn-company" onclick="switchSettingsTab('company')" class="${tabBtnClass} ${selectedTab === 'company' ? activeClass : inactiveClass}">
            Empresa e Impuestos
          </button>
          `
              : ""
          }
          <button id="tab-btn-profile" onclick="switchSettingsTab('profile')" class="${tabBtnClass} ${selectedTab === 'profile' ? activeClass : inactiveClass}">
            Mi Perfil
          </button>

        </div>

        <!-- CONFIGURATION FORM -->
        <div class="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium" id="settings-form-panel">
          <!-- El panel activo se inyectará dinámicamente -->
        </div>
      </div>
    </div>
  `;

  renderSettingsTabContent(selectedTab);
}
async function saveSettings(e) {
  e.preventDefault();

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  const payload = {
    companyName: document.getElementById("set-name").value,
    cif: document.getElementById("set-cif").value,
    taxRate: parseInt(document.getElementById("set-tax").value) || 21,
    phone: document.getElementById("set-phone").value,
    email: document.getElementById("set-email").value,
    address: document.getElementById("set-address").value,
    city: document.getElementById("set-city").value,
    state: document.getElementById("set-state").value,
    twilioSid: document.getElementById("set-twilio-sid").value,
    twilioAuthToken: document.getElementById("set-twilio-token").value,
    twilioPhone: document.getElementById("set-twilio-phone").value,
  };

  try {
    const response = await fetch("api/save_settings.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.success) {
      ERPState.settings = {
        ...ERPState.settings,
        ...payload,
      };
      saveERPState();
      showToast(
        "Parámetros del ERP actualizados con éxito en la Base de Datos.",
        "success",
      );
      renderSettingsModule(document.getElementById("main-content"), "company");
    } else {
      showToast(data.message || "Error al guardar configuración.", "error");
    }
  } catch (err) {
    console.error("Error saving settings:", err);
    showToast("Error de conexión al guardar configuración.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

function clearSettingsForm() {
  const fields = [
    "set-name",
    "set-cif",
    "set-tax",
    "set-phone",
    "set-email",
    "set-address",
    "set-city",
    "set-state",
  ];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  showToast("Campos del formulario vaciados.", "info");
}

let activeEditUserId = null;

// ==================== USER MANAGEMENT MODULE RENDERER ====================
function renderUsersModule(container) {
  activeEditUserId = null; // Resetear al entrar
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-toast-in">
      <!-- FORM COLUMN -->
      <div class="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium h-fit">
        <div class="mb-6">
          <h2 class="text-2xl font-extrabold tracking-tight dark:text-white" id="user-form-title">Añadir Colaborador</h2>
          <p class="text-xs text-slate-400 dark:text-slate-400 mt-1" id="user-form-desc">Cree nuevas cuentas con acceso administrativo u operativo para el personal.</p>
        </div>

        <form id="form-user-admin" class="space-y-4" onsubmit="saveUser(event)">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
            <input type="text" id="user-name" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: Juan Pérez">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
            <input type="email" id="user-email" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Ej: juan.perez@anayaoutlet.com">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" id="user-password-label">Contraseña *</label>
            <div class="relative">
              <input type="password" id="user-password" class="w-full pl-3 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white" placeholder="Mínimo 6 caracteres">
              <button type="button" id="btn-toggle-user-password" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none">
                <!-- Eye Icon (Open) -->
                <svg id="user-eye-icon-open" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Icon (Closed) -->
                <svg id="user-eye-icon-closed" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol del Usuario *</label>
            <select id="user-role" required class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-850 dark:text-white">
              <option value="operator">Operador (Acceso Estándar)</option>
              <option value="admin">Administrador (Acceso Total)</option>
              <option value="cajero">Cajero POS (Solo Ventas y Caja)</option>
            </select>
          </div>

          <div class="pt-2 flex gap-3">
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md" id="btn-user-submit">
              Guardar Usuario
            </button>
            <button type="button" id="btn-user-cancel" onclick="cancelUserEdit()" class="py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all hidden">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- LIST COLUMN -->
      <div class="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium flex flex-col max-h-[85vh]">
        <div class="mb-6">
          <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Personal Autorizado</h2>
          <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Lista de usuarios registrados con acceso a la base de datos de ANAYA ERP.</p>
        </div>

        <div class="overflow-y-auto flex-1 pr-2 space-y-3" id="users-list-container">
          <div class="text-center py-12 text-slate-400">Cargando personal...</div>
        </div>
      </div>
    </div>
  `;

  // Vincular la lógica de alternancia de mostrar/ocultar contraseña
  const btnToggleUserPass = document.getElementById("btn-toggle-user-password");
  const userPassInput = document.getElementById("user-password");
  const userEyeOpen = document.getElementById("user-eye-icon-open");
  const userEyeClosed = document.getElementById("user-eye-icon-closed");

  if (btnToggleUserPass && userPassInput && userEyeOpen && userEyeClosed) {
    btnToggleUserPass.addEventListener("click", () => {
      const type =
        userPassInput.getAttribute("type") === "password" ? "text" : "password";
      userPassInput.setAttribute("type", type);
      if (type === "password") {
        userEyeOpen.classList.remove("hidden");
        userEyeClosed.classList.add("hidden");
      } else {
        userEyeOpen.classList.add("hidden");
        userEyeClosed.classList.remove("hidden");
      }
    });
  }

  // Carga inicial de la lista de usuarios
  updateUsersList();
}

async function updateUsersList() {
  const container = document.getElementById("users-list-container");
  if (!container) return;

  try {
    const res = await fetch("api/get_users.php");
    const data = await res.json();

    if (data.success && Array.isArray(data.users)) {
      if (data.users.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <p>No hay usuarios adicionales registrados.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = data.users
        .map((u) => {
          let roleText = "Operador";
          let roleBadge = "bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold border border-slate-500/20";
          if (u.role === "admin") {
            roleText = "Administrador";
            roleBadge = "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20";
          } else if (u.role === "cajero") {
            roleText = "Cajero POS";
            roleBadge = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20";
          }

          return `
          <div class="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all">
            <div class="overflow-hidden mr-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[9px] inline-block ${roleBadge}">
                  ${roleText}
                </span>
                <span class="text-slate-400 text-[10px]">• Creado: ${u.created_at}</span>
              </div>
              <h4 class="font-bold text-slate-800 dark:text-white truncate mt-1.5 text-sm" title="${u.name}">${u.name}</h4>
              <span class="text-[10px] text-slate-400 dark:text-slate-400">${u.email}</span>
            </div>
            <div class="flex-shrink-0 flex items-center gap-1">
              <button onclick="editUserAction('${u.id}')" class="text-blue-500 hover:text-blue-650 text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all font-bold">
                Editar
              </button>
              <button onclick="deleteUserAction('${u.id}', '${u.name}')" class="text-red-500 hover:text-red-650 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-semibold">
                Eliminar
              </button>
            </div>
          </div>
        `;
        })
        .join("");
    } else {
      container.innerHTML = `<div class="text-center py-12 text-red-500">Error: ${data.message || "No se pudo cargar la lista."}</div>`;
    }
  } catch (err) {
    console.error("Error loading users list:", err);
    container.innerHTML = `<div class="text-center py-12 text-red-500">Error de conexión al cargar la lista.</div>`;
  }
}

async function saveUser(e) {
  e.preventDefault();

  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const password = document.getElementById("user-password").value;
  const role = document.getElementById("user-role").value;

  if (!activeEditUserId && password.length === 0) {
    showToast("La contraseña es requerida para un usuario nuevo.", "error");
    return;
  }

  if (password.length > 0 && password.length < 6) {
    showToast("La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  const submitBtn =
    e && e.target ? e.target.querySelector('button[type="submit"]') : null;
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  try {
    const res = await fetch("api/save_user.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: activeEditUserId ? parseInt(activeEditUserId) : 0,
        name,
        email,
        password,
        role
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Usuario guardado correctamente.", "success");
      
      // Si el administrador se editó a sí mismo, actualizar barra lateral reactivamente
      if (activeEditUserId && ERPState.session && String(activeEditUserId) === String(ERPState.session.id)) {
        ERPState.session.name = name;
        ERPState.session.role = role;
        updateUserProfileUI(ERPState.session);
        applyRolePermissions();
      }

      cancelUserEdit();
      updateUsersList();
    } else {
      showToast(data.message || "Error al guardar el usuario.", "error");
    }
  } catch (err) {
    console.error("Error saving user:", err);
    showToast("Error de red al intentar guardar el usuario.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = activeEditUserId ? "Actualizar Usuario" : "Guardar Usuario";
    }
  }
}

window.editUserAction = async function (id) {
  try {
    const res = await fetch("api/get_users.php");
    const data = await res.json();
    if (!data.success || !Array.isArray(data.users)) {
      showToast("No se pudo obtener la información de los usuarios.", "error");
      return;
    }
    const user = data.users.find(u => String(u.id) === String(id));
    if (!user) {
      showToast("Usuario no encontrado.", "error");
      return;
    }

    activeEditUserId = user.id;
    
    document.getElementById("user-form-title").innerText = "Editar Colaborador";
    document.getElementById("user-form-desc").innerText = "Modifique los campos correspondientes a la ficha del personal.";
    document.getElementById("user-password-label").innerText = "Nueva Contraseña (Opcional)";
    document.getElementById("user-password").placeholder = "Dejar vacío para no cambiar";

    document.getElementById("user-name").value = user.name;
    document.getElementById("user-email").value = user.email;
    document.getElementById("user-password").value = "";
    document.getElementById("user-role").value = user.role;

    document.getElementById("btn-user-submit").innerText = "Actualizar Usuario";
    document.getElementById("btn-user-cancel").classList.remove("hidden");
  } catch (err) {
    console.error("Error editing user:", err);
    showToast("Error de conexión al cargar datos del usuario.", "error");
  }
};

window.cancelUserEdit = function () {
  activeEditUserId = null;
  const form = document.getElementById("form-user-admin");
  if (form) form.reset();

  document.getElementById("user-form-title").innerText = "Añadir Colaborador";
  document.getElementById("user-form-desc").innerText = "Cree nuevas cuentas con acceso administrativo u operativo para el personal.";
  document.getElementById("user-password-label").innerText = "Contraseña *";
  document.getElementById("user-password").placeholder = "Mínimo 6 caracteres";

  document.getElementById("btn-user-submit").innerText = "Guardar Usuario";
  document.getElementById("btn-user-cancel").classList.add("hidden");
};

async function deleteUserAction(id, name) {
  if (
    !confirm(
      `¿Está seguro de que desea eliminar la cuenta del usuario "${name}"? Perderá el acceso de forma inmediata.`,
    )
  ) {
    return;
  }

  try {
    const res = await fetch("api/delete_user.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Usuario eliminado.", "warning");
      updateUsersList();
    } else {
      showToast(data.message || "Error al eliminar el usuario.", "error");
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    showToast("Error de red al intentar eliminar el usuario.", "error");
  }
}

// ==================== GLOBAL TOAST ALERT SYSTEM ====================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");

  // Estilo de marca de toast personalizado según los niveles de alerta
  let icon = "🔔";
  let border = "border-slate-100 dark:border-slate-700";
  let badgeColor = "text-blue-500";

  if (type === "success") {
    icon = "✅";
    border = "border-emerald-500/20";
    badgeColor = "text-emerald-500";
  } else if (type === "warning") {
    icon = "⚠️";
    border = "border-yellow-500/20";
    badgeColor = "text-yellow-500";
  } else if (type === "error") {
    icon = "❌";
    border = "border-red-500/20";
    badgeColor = "text-red-500";
  }

  toast.className = `bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-2xl border ${border} shadow-premium dark:shadow-dark-premium flex gap-3 text-xs items-start animate-toast-in max-w-sm w-full relative overflow-hidden`;

  toast.innerHTML = `
    <span class="text-base">${icon}</span>
    <div class="flex-1 overflow-hidden">
      <span class="font-extrabold uppercase text-[9px] ${badgeColor} tracking-wider block">${type === "success" ? "Éxito" : type === "warning" ? "Alerta" : type === "error" ? "Error" : "Notificación"}</span>
      <p class="text-slate-600 dark:text-slate-300 font-semibold mt-0.5">${message}</p>
    </div>
    <button onclick="this.parentNode.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold leading-none">&times;</button>
    <div class="absolute bottom-0 left-0 h-0.5 w-full ${type === "success" ? "bg-emerald-500" : type === "warning" ? "bg-yellow-500" : type === "error" ? "bg-red-500" : "bg-blue-500"} origin-left animate-toast-progress"></div>
  `;

  container.appendChild(toast);

  // Desvanecer y eliminar automáticamente después de 3.5s
  setTimeout(() => {
    toast.classList.remove("animate-toast-in");
    toast.classList.add("animate-toast-out");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }, 3500);
}

// ==================== GLOBAL INTERACTIVE MODALS SYSTEM ====================
function openModal(contentHtml, maxWidthClass = "max-w-lg") {
  const overlay = document.getElementById("modal-container");
  const card = document.getElementById("modal-card");

  if (!overlay || !card) return;

  // Aplicar clase de anchos responsivos
  card.className = `bg-white dark:bg-slate-800 w-full ${maxWidthClass} rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium overflow-hidden transform animate-modal-content flex flex-col max-h-[90vh]`;

  card.innerHTML = contentHtml;
  overlay.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeModal() {
  const overlay = document.getElementById("modal-container");
  if (overlay) {
    overlay.classList.add("hidden");
  }
  const card = document.getElementById("modal-card");
  if (card) {
    card.className = "bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-premium dark:shadow-dark-premium overflow-hidden transform animate-modal-content flex flex-col max-h-[90vh]";
  }
  document.body.classList.remove("overflow-hidden");
}

// Cerrar modal al hacer clic en el fondo
document
  .getElementById("modal-container")
  .addEventListener("mousedown", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

// ==================== GLOBAL SEARCH INDEXER ENGINE ====================
const globalSearchInput = document.getElementById("global-search");
const globalSearchResults = document.getElementById("global-search-results");

if (globalSearchInput && globalSearchResults) {
  globalSearchInput.addEventListener("input", function () {
    const q = this.value.toLowerCase().trim();

    if (!q) {
      globalSearchResults.classList.add("hidden");
      return;
    }

    // Buscar coincidencia en productos, clientes y órdenes de compra
    const matchPrd = ERPState.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      )
      .slice(0, 3);
    const matchCli = ERPState.clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.document.toLowerCase().includes(q),
      )
      .slice(0, 3);
    const matchPO = ERPState.purchaseOrders
      .filter(
        (po) =>
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q),
      )
      .slice(0, 3);

    let html = "";

    if (matchPrd.length > 0) {
      html += `<div class="px-3 py-1 text-[9px] uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/50 mb-1.5 mt-1 block">Catálogo Productos</div>`;
      html += matchPrd
        .map(
          (p) => `
        <div onclick="navigateToModule('products', '${p.id}')" class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors">
          <div class="overflow-hidden mr-1">
            <span class="font-bold text-slate-800 dark:text-white truncate block">${p.name}</span>
            <span class="text-[9px] text-slate-400 font-mono">${p.sku}</span>
          </div>
          <b class="text-slate-800 dark:text-white text-xs">${formatEuro(p.sellPrice)}</b>
        </div>
      `,
        )
        .join("");
    }

    if (matchCli.length > 0) {
      html += `<div class="px-3 py-1 text-[9px] uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/50 mb-1.5 mt-2 block">Directorio Clientes</div>`;
      html += matchCli
        .map(
          (c) => `
        <div onclick="navigateToModule('clients', '${c.id}')" class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors">
          <div class="overflow-hidden mr-1">
            <span class="font-bold text-slate-800 dark:text-white truncate block">${c.name}</span>
            <span class="text-[9px] text-slate-400">${c.document}</span>
          </div>
          <span class="text-[9px] text-slate-400">Spent: ${c.totalSpent} €</span>
        </div>
      `,
        )
        .join("");
    }

    if (matchPO.length > 0) {
      html += `<div class="px-3 py-1 text-[9px] uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/50 mb-1.5 mt-2 block">Órdenes Compras</div>`;
      html += matchPO
        .map(
          (po) => `
        <div onclick="navigateToModule('purchases', '${po.id}')" class="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors">
          <div class="overflow-hidden mr-1">
            <span class="font-bold text-slate-800 dark:text-white truncate block">${po.poNumber}</span>
            <span class="text-[9px] text-slate-400">${po.supplierName}</span>
          </div>
          <span class="text-[9px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">${po.status}</span>
        </div>
      `,
        )
        .join("");
    }

    if (!html) {
      html = `<div class="text-center py-4 text-xs text-slate-400">Ningún resultado coincidente</div>`;
    }

    globalSearchResults.innerHTML = html;
    globalSearchResults.classList.remove("hidden");
  });
}

function navigateToModule(moduleHash, itemId) {
  globalSearchResults.classList.add("hidden");
  globalSearchInput.value = "";

  window.location.hash = moduleHash;

  if (moduleHash === "products") {
    setTimeout(() => {
      const match = ERPState.products.find((p) => p.id === itemId);
      if (match) populateProductForm(match);
    }, 100);
  } else if (moduleHash === "clients") {
    setTimeout(() => {
      const match = ERPState.clients.find((c) => c.id === itemId);
      if (match) editClientAction(itemId);
    }, 100);
  } else if (moduleHash === "purchases") {
    setTimeout(() => {
      viewPurchaseDetails(itemId);
    }, 100);
  }
}

// Cerrar la búsqueda global al hacer clic fuera
document.addEventListener("click", function (e) {
  if (
    globalSearchInput &&
    !globalSearchInput.contains(e.target) &&
    globalSearchResults &&
    !globalSearchResults.contains(e.target)
  ) {
    globalSearchResults.classList.add("hidden");
  }
});

// ==================== APP INITIALIZATION CONTROLLER ====================
document.addEventListener("DOMContentLoaded", () => {
  initERPState();

  // Escuchador de rutas
  window.addEventListener("hashchange", router);
  // Verificar el estado de la sesión dinámicamente desde el backend PHP
  checkAuthStatus();

  // Lógica del dropdown de tema en la pantalla de inicio de sesión
  const loginThemeBtn = document.getElementById("login-theme-btn");
  const loginThemeMenu = document.getElementById("login-theme-menu");
  const loginThemeArrow = document.getElementById("login-theme-arrow");

  if (loginThemeBtn && loginThemeMenu && loginThemeArrow) {
    // Abrir/Cerrar menú
    loginThemeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = loginThemeMenu.classList.contains("hidden");
      if (isHidden) {
        loginThemeMenu.classList.remove("hidden");
        void loginThemeMenu.offsetWidth; // Forzar reflow
        loginThemeMenu.classList.remove("opacity-0", "scale-95");
        loginThemeMenu.classList.add("opacity-100", "scale-100");
        loginThemeArrow.classList.add("rotate-180");
      } else {
        loginThemeMenu.classList.remove("opacity-100", "scale-100");
        loginThemeMenu.classList.add("opacity-0", "scale-95");
        loginThemeArrow.classList.remove("rotate-180");
        setTimeout(() => {
          loginThemeMenu.classList.add("hidden");
        }, 150);
      }
    });

    // Cambiar tema al hacer clic en las opciones
    loginThemeMenu.querySelectorAll("button[data-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        setTheme(val);
        // Cerrar menú
        loginThemeMenu.classList.remove("opacity-100", "scale-100");
        loginThemeMenu.classList.add("opacity-0", "scale-95");
        loginThemeArrow.classList.remove("rotate-180");
        setTimeout(() => {
          loginThemeMenu.classList.add("hidden");
        }, 150);
      });
    });

    // Cerrar menú al hacer clic fuera del dropdown
    document.addEventListener("click", (e) => {
      if (!loginThemeBtn.contains(e.target) && !loginThemeMenu.contains(e.target)) {
        loginThemeMenu.classList.remove("opacity-100", "scale-100");
        loginThemeMenu.classList.add("opacity-0", "scale-95");
        loginThemeArrow.classList.remove("rotate-180");
        setTimeout(() => {
          loginThemeMenu.classList.add("hidden");
        }, 150);
      }
    });
  }

  // Manejar alternancia de mostrar/ocultar contraseña en inicio de sesión
  const btnTogglePassword = document.getElementById("btn-toggle-password");
  const passwordInput = document.getElementById("login-password");
  const eyeOpen = document.getElementById("eye-icon-open");
  const eyeClosed = document.getElementById("eye-icon-closed");

  if (btnTogglePassword && passwordInput && eyeOpen && eyeClosed) {
    btnTogglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      if (type === "password") {
        eyeOpen.classList.remove("hidden");
        eyeClosed.classList.add("hidden");
      } else {
        eyeOpen.classList.add("hidden");
        eyeClosed.classList.remove("hidden");
      }
    });
  }

  // Manejar el envío del formulario de inicio de sesión
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-password").value;
      const remember = document.getElementById("login-remember").checked;
      handleLogin(email, pass, remember);
    });
  }

  // Lógica de autoenfoque y navegación para las 6 cajas de código OTP
  const otpInputs = document.querySelectorAll(
    "#otp-inputs-container .otp-input",
  );
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value;

      // Permitir únicamente caracteres numéricos
      if (value !== "" && !/^\d$/.test(value)) {
        e.target.value = "";
        return;
      }

      // Mover el foco a la siguiente caja
      if (value !== "" && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      // Al pulsar Retroceso en una casilla vacía, regresar el foco a la casilla anterior
      if (e.key === "Backspace" && e.target.value === "" && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Habilitar pegar un código de 6 dígitos completo (copiar y pegar)
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData)
        .getData("text")
        .trim();

      if (/^\d{6}$/.test(pasteData)) {
        otpInputs.forEach((inp, idx) => {
          inp.value = pasteData[idx];
        });
        otpInputs[otpInputs.length - 1].focus();
      }
    });
  });

  // Manejar botón de cierre de sesión
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutSession);
  }

  // Vinculación de utilidades de interfaz (desplegables de cabecera)
  const notifBtn = document.getElementById("btn-notifications");
  const notifDrop = document.getElementById("notifications-dropdown");
  if (notifBtn && notifDrop) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDrop.classList.toggle("hidden");
      themeDrop.classList.add("hidden");
      userDrop.classList.add("hidden");
    });
  }

  const themeBtn = document.getElementById("btn-theme-selector");
  const themeDrop = document.getElementById("theme-menu-dropdown");
  if (themeBtn && themeDrop) {
    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      themeDrop.classList.toggle("hidden");
      notifDrop.classList.add("hidden");
      userDrop.classList.add("hidden");
    });
  }

  const userBtn = document.getElementById("btn-user-menu");
  const userDrop = document.getElementById("user-menu-dropdown");
  if (userBtn && userDrop) {
    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDrop.classList.toggle("hidden");
      notifDrop.classList.add("hidden");
      themeDrop.classList.add("hidden");
    });
  }

  // Cerrar menús al hacer clic fuera
  document.addEventListener("click", () => {
    if (notifDrop) notifDrop.classList.add("hidden");
    if (themeDrop) themeDrop.classList.add("hidden");
    if (userDrop) userDrop.classList.add("hidden");
  });

  // Sembrar registros de la campana de notificaciones
  const notifList = document.getElementById("notifications-list");
  if (notifList) {
    notifList.innerHTML = `
      <div class="px-4 py-4 text-xs text-center text-slate-400 dark:text-slate-500">
        Sin notificaciones nuevas
      </div>
    `;
  }
});

// ==================== CSV REPORT EXPORTERS ====================
function downloadCSV(csvContent, filename) {
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function exportSalesToCSV() {
  if (!ERPState.invoices || ERPState.invoices.length === 0) {
    showToast("No hay ventas registradas para exportar.", "error");
    return;
  }

  const headers = [
    "Factura",
    "Cliente",
    "Fecha",
    "Articulos",
    "Subtotal (€)",
    "Descuento (€)",
    "IVA (€)",
    "Total (€)",
    "Estado",
    "Metodo Pago",
  ];

  const rows = ERPState.invoices.map((i) => [
    i.invoiceNumber,
    i.clientName,
    i.date,
    i.products.reduce((acc, p) => acc + p.qty, 0),
    i.subtotal.toFixed(2),
    i.discount.toFixed(2),
    i.taxAmount.toFixed(2),
    i.total.toFixed(2),
    i.status,
    i.paymentMethod,
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((e) =>
      e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(";"),
    ),
  ].join("\n");

  downloadCSV(
    csvContent,
    `reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  showToast("Informe de ventas exportado.", "success");
}

function exportPurchasesToCSV() {
  if (!ERPState.purchaseOrders || ERPState.purchaseOrders.length === 0) {
    showToast("No hay compras registradas para exportar.", "error");
    return;
  }

  const headers = [
    "Codigo OC",
    "Proveedor",
    "Fecha Registro",
    "Items",
    "Coste Total (€)",
    "Estado",
  ];

  const rows = ERPState.purchaseOrders.map((po) => [
    po.poNumber,
    po.supplierName,
    po.date,
    po.products.length,
    po.total.toFixed(2),
    po.status,
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((e) =>
      e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(";"),
    ),
  ].join("\n");

  downloadCSV(
    csvContent,
    `reporte_compras_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  showToast("Informe de compras exportado.", "success");
}

// ==================== PASSWORD RECOVERY WORKFLOW (2FA SMS) ====================
let recoveryEmail = "";
let recoveryTempToken = "";

window.showForgotPasswordEmailView = function (e) {
  if (e) e.preventDefault();
  // Ocultar formulario de login estándar
  document.getElementById("login-form").classList.add("hidden");

  // Ocultar cabeceras del login estándar
  const h2Title = document.querySelector("#login-screen h2");
  const pDesc = document.querySelector("#login-screen p");
  if (h2Title) h2Title.classList.add("hidden");
  if (pDesc) pDesc.classList.add("hidden");

  // Mostrar formulario de solicitud de correo
  document.getElementById("recovery-email-card").classList.remove("hidden");
  document.getElementById("recovery-code-card").classList.add("hidden");
  document.getElementById("recovery-password-card").classList.add("hidden");
};

window.showForgotPasswordCodeView = function (maskedPhone) {
  document.getElementById("recovery-email-card").classList.add("hidden");

  // Actualizar teléfono enmascarado
  const phoneLabel = document.getElementById("recovery-masked-phone");
  if (phoneLabel) phoneLabel.innerText = maskedPhone;

  // Mostrar verificación de código
  document.getElementById("recovery-code-card").classList.remove("hidden");

  // Limpiar y enfocar el primer input de las 6 cajas
  const inputs = document.querySelectorAll("#otp-inputs-container .otp-input");
  inputs.forEach((inp) => (inp.value = ""));
  if (inputs[0]) inputs[0].focus();
};

window.showForgotPasswordResetView = function () {
  document.getElementById("recovery-code-card").classList.add("hidden");
  document.getElementById("recovery-password-card").classList.remove("hidden");

  const newPass = document.getElementById("recovery-new-pass");
  if (newPass) {
    newPass.value = "";
    newPass.focus();
  }
  const confirmPass = document.getElementById("recovery-confirm-pass");
  if (confirmPass) confirmPass.value = "";
};

window.hideForgotPasswordView = function () {
  // Ocultar formularios de recuperación
  document.getElementById("recovery-email-card").classList.add("hidden");
  document.getElementById("recovery-code-card").classList.add("hidden");
  document.getElementById("recovery-password-card").classList.add("hidden");
  dismissSmsSimulator();

  // Mostrar formulario de login y cabeceras
  document.getElementById("login-form").classList.remove("hidden");
  const h2Title = document.querySelector("#login-screen h2");
  const pDesc = document.querySelector("#login-screen p");
  if (h2Title) h2Title.classList.remove("hidden");
  if (pDesc) pDesc.classList.remove("hidden");
};

window.requestPasswordResetCode = async function (e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Enviando...");
  }

  const emailInput = document.getElementById("recovery-email").value.trim();
  if (!emailInput) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    return;
  }

  try {
    const res = await fetch("auth/reset_request.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: emailInput }),
    });

    const data = await res.json();
    if (data.success) {
      recoveryEmail = emailInput;
      showToast(data.message || "Código enviado correctamente.", "success");

      // Mostrar el widget del simulador si está en modo simulado
      if (data.mode === "simulated") {
        const smsWidget = document.getElementById("sms-simulator-widget");
        const smsText = document.getElementById("sms-simulator-text");
        if (smsWidget && smsText) {
          smsText.innerHTML = `Su código de recuperación de ANAYA OUTLET es: <b class="text-white font-mono text-lg bg-white/10 px-2 py-0.5 rounded border border-white/10 select-all">${data.simulated_code}</b>. Expira en 10 minutos.`;
          smsWidget.classList.remove("hidden");
          void smsWidget.offsetWidth; // Reflujo de diseño
          smsWidget.style.transform = "translateY(0)";
          smsWidget.style.opacity = "1";
        }
      }

      showForgotPasswordCodeView(data.phone);
    } else {
      showToast(data.message || "Error al solicitar el código.", "error");
    }
  } catch (err) {
    console.error("Error requesting code:", err);
    showToast("Error de conexión al solicitar el código.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
};

window.verifyPasswordResetCode = async function (e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Verificando...");
  }

  // Obtener el código de las 6 cajas individuales
  const inputs = document.querySelectorAll("#otp-inputs-container .otp-input");
  const codeInput = Array.from(inputs)
    .map((inp) => inp.value.trim())
    .join("");

  if (codeInput.length !== 6 || !/^\d{6}$/.test(codeInput)) {
    showToast("El código debe tener 6 dígitos numéricos.", "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    return;
  }

  try {
    const res = await fetch("auth/verify_code.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: recoveryEmail, code: codeInput }),
    });

    const data = await res.json();
    if (data.success) {
      recoveryTempToken = data.token;
      showToast(data.message || "Código verificado con éxito.", "success");
      dismissSmsSimulator();
      showForgotPasswordResetView();
    } else {
      showToast(data.message || "Código incorrecto.", "error");
    }
  } catch (err) {
    console.error("Error verifying code:", err);
    showToast("Error de conexión al verificar el código.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
};

window.resetPasswordAction = async function (e) {
  e.preventDefault();

  const newPass = document.getElementById("recovery-new-pass").value;
  const confirmPass = document.getElementById("recovery-confirm-pass").value;

  if (newPass !== confirmPass) {
    showToast("Las contraseñas no coinciden.", "error");
    return;
  }

  if (newPass.length < 6) {
    showToast("La nueva contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  let originalHtml = "";
  if (submitBtn) {
    submitBtn.disabled = true;
    originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = window.getLoadingSpinnerHTML("Guardando...");
  }

  try {
    const res = await fetch("auth/reset_password.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: recoveryEmail,
        token: recoveryTempToken,
        password: newPass,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showToast(
        data.message || "Contraseña restablecida con éxito.",
        "success",
      );
      hideForgotPasswordView();

      // Limpiar campos
      document.getElementById("recovery-email").value = "";
      document
        .querySelectorAll("#otp-inputs-container .otp-input")
        .forEach((inp) => (inp.value = ""));
      document.getElementById("recovery-new-pass").value = "";
      document.getElementById("recovery-confirm-pass").value = "";
      recoveryEmail = "";
      recoveryTempToken = "";
    } else {
      showToast(data.message || "Error al restablecer la contraseña.", "error");
    }
  } catch (err) {
    console.error("Error resetting password:", err);
    showToast("Error de conexión al restablecer la contraseña.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
};

window.dismissSmsSimulator = function () {
  const smsWidget = document.getElementById("sms-simulator-widget");
  if (smsWidget) {
    smsWidget.style.transform = "translateY(20px)";
    smsWidget.style.opacity = "0";
    setTimeout(() => {
      smsWidget.classList.add("hidden");
    }, 500);
  }
};

// ==================== AUDIT LOGS MODULE ====================
let auditState = {
  logs: [],
  page: 1,
  limit: 15,
  total: 0,
  search: "",
  actionFilter: "",
  availableActions: [],
};

window.renderAuditModule = async function (container) {
  // Inicializar estado local del módulo
  auditState.page = 1;
  auditState.search = "";
  auditState.actionFilter = "";

  container.innerHTML = `
    <div class="space-y-6 animate-toast-in">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight dark:text-white">Auditoría del Sistema</h2>
          <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Monitoree y audite los cambios de configuraciones, catálogo y accesos en tiempo real.</p>
        </div>
        
        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Buscador -->
          <div class="relative w-full sm:w-64">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input type="text" id="audit-search" placeholder="Buscar por descripción, usuario..." class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
          </div>
          
          <!-- Selector de Acciones -->
          <div class="relative w-full sm:w-48">
            <select id="audit-action-filter" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white">
              <option value="">Todas las acciones</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-transparent lg:bg-white dark:lg:bg-slate-800 border-none lg:border border-slate-200/60 dark:border-slate-700 shadow-none lg:shadow-premium dark:lg:shadow-dark-premium overflow-hidden">
        <div class="table-scroll-container overflow-x-hidden lg:overflow-visible">
          <table class="w-full border-collapse text-left text-xs block lg:table">
            <thead class="hidden lg:table-header-group bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-700/60">
              <tr>
                <th class="py-3.5 px-6 w-44">Fecha / Hora</th>
                <th class="py-3.5 px-6 w-40">Usuario</th>
                <th class="py-3.5 px-6 w-40">Acción</th>
                <th class="py-3.5 px-6 w-32">Tabla / ID</th>
                <th class="py-3.5 px-6">Descripción del Cambio</th>
                <th class="py-3.5 px-6 w-32">IP Origen</th>
              </tr>
            </thead>
            <tbody id="audit-table-body" class="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300 block lg:table-row-group">
              <tr>
                <td colspan="6" class="py-12 text-center text-slate-400">
                  <span class="animate-pulse">Cargando registros de auditoría...</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <div class="text-xs text-slate-500">
            Mostrando <span id="audit-pagination-info">0 a 0 de 0</span> registros
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-audit-prev" disabled class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-slate-700 dark:text-white transition-all">Anterior</button>
            <button id="btn-audit-next" disabled class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-slate-700 dark:text-white transition-all">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Vincular eventos
  const searchInput = document.getElementById("audit-search");
  const filterSelect = document.getElementById("audit-action-filter");
  const btnPrev = document.getElementById("btn-audit-prev");
  const btnNext = document.getElementById("btn-audit-next");

  let debounceTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      auditState.search = e.target.value;
      auditState.page = 1;
      loadAuditLogs();
    }, 300);
  });

  filterSelect.addEventListener("change", (e) => {
    auditState.actionFilter = e.target.value;
    auditState.page = 1;
    loadAuditLogs();
  });

  btnPrev.addEventListener("click", () => {
    if (auditState.page > 1) {
      auditState.page--;
      loadAuditLogs();
    }
  });

  btnNext.addEventListener("click", () => {
    const totalPages = Math.ceil(auditState.total / auditState.limit);
    if (auditState.page < totalPages) {
      auditState.page++;
      loadAuditLogs();
    }
  });

  // Cargar la primera página
  await loadAuditLogs();
};

async function loadAuditLogs() {
  const tbody = document.getElementById("audit-table-body");
  if (!tbody) return;

  try {
    const url = `api/get_audit_logs.php?page=${auditState.page}&limit=${auditState.limit}&search=${encodeURIComponent(auditState.search)}&actionFilter=${encodeURIComponent(auditState.actionFilter)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      auditState.logs = data.logs;
      auditState.total = parseInt(data.total);

      // Popular select de acciones si no está poblado ya
      const filterSelect = document.getElementById("audit-action-filter");
      if (filterSelect && filterSelect.options.length <= 1) {
        data.availableActions.forEach((act) => {
          const opt = document.createElement("option");
          opt.value = act;
          opt.textContent = act;
          filterSelect.appendChild(opt);
        });
        filterSelect.value = auditState.actionFilter;
      }

      renderAuditRows();
      updateAuditPagination();
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-red-500 font-semibold">
            ${data.message || "Error al cargar registros."}
          </td>
        </tr>
      `;
    }
  } catch (err) {
    console.error("Error loading audit logs:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-red-500 font-semibold">
          Error de conexión con el servidor de auditoría.
        </td>
      </tr>
    `;
  }
}

function renderAuditRows() {
  const tbody = document.getElementById("audit-table-body");
  if (!tbody) return;

  if (auditState.logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-455 dark:text-slate-400 font-medium">
          No se encontraron registros de auditoría que coincidan con la búsqueda.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = auditState.logs
    .map((log) => {
      const dateStr = new Date(log.created_at).toLocaleString("es-ES", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const badgeHTML = getAuditActionBadge(log.action);
      const ipStr = log.ip_address || "N/A";

      // Obtener iniciales para el avatar del usuario
      const userInitials = (log.user_name || "U")
        .substring(0, 1)
        .toUpperCase();

      return `
      <tr class="flex flex-col lg:table-row border border-slate-150 dark:border-slate-700/60 lg:border-none p-4 lg:p-0 rounded-2xl mb-4 lg:mb-0 bg-white dark:bg-slate-800 lg:bg-transparent shadow-sm lg:shadow-none gap-1.5 lg:gap-0 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha / Hora</span>
          <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">${dateStr}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Usuario</span>
          <div class="flex items-center gap-2 justify-end lg:justify-start">
            <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center font-bold text-[10px]">
              ${userInitials}
            </div>
            <span class="font-semibold text-slate-800 dark:text-slate-200">${log.user_name}</span>
          </div>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Acción</span>
          <span>${badgeHTML}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Tabla / ID</span>
          <div>
            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-mono">${log.table_name}</span>
            <span class="text-slate-400 text-[10px] font-bold">#${log.record_id || "N/A"}</span>
          </div>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right lg:text-left">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Descripción</span>
          <span class="whitespace-normal break-words max-w-lg text-slate-600 dark:text-slate-300 font-medium text-right lg:text-left">${log.description}</span>
        </td>
        <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 text-right lg:text-left">
          <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">IP Origen</span>
          <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">${ipStr}</span>
        </td>
      </tr>
    `;
    })
    .join("");
}

function getAuditActionBadge(action) {
  let bgClass =
    "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40";

  if (action.includes("DELETE")) {
    bgClass =
      "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40";
  } else if (action.includes("CREATE")) {
    bgClass =
      "bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40";
  } else if (action.includes("ADJUST")) {
    bgClass =
      "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40";
  } else if (action.includes("RETURN")) {
    bgClass =
      "bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40";
  } else if (action.includes("UPDATE")) {
    bgClass =
      "bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/40";
  }

  return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${bgClass}">${action}</span>`;
}

function updateAuditPagination() {
  const info = document.getElementById("audit-pagination-info");
  const btnPrev = document.getElementById("btn-audit-prev");
  const btnNext = document.getElementById("btn-audit-next");
  if (!info || !btnPrev || !btnNext) return;

  const totalPages = Math.ceil(auditState.total / auditState.limit) || 1;
  const start =
    auditState.total === 0 ? 0 : (auditState.page - 1) * auditState.limit + 1;
  const end = Math.min(auditState.page * auditState.limit, auditState.total);

  info.textContent = `${start} a ${end} de ${auditState.total}`;

  btnPrev.disabled = auditState.page <= 1;
  btnNext.disabled = auditState.page >= totalPages;
}

// ==================== CRITICAL STOCK NOTIFICATION SYSTEM ====================
window.updateNotificationsSystem = function () {
  const notifBtn = document.getElementById("btn-notifications");
  const badge = document.getElementById("notifications-badge");
  const list = document.getElementById("notifications-list");
  if (!list) return;

  const alerts = [];

  // 1. Agregar solicitudes de pedidos web pendientes
  if (ERPState.pendingWebOrders && ERPState.pendingWebOrders.length > 0) {
    ERPState.pendingWebOrders.forEach((order) => {
      alerts.push({
        id: order.id,
        sku: order.order_number,
        name: order.client_name,
        type: "web_order",
        title: "Nuevo Pedido Web 🛒",
        desc: `Solicitud de ${order.client_name} por ${formatEuro(parseFloat(order.total))} para ${order.preferred_store}.`,
        colorClass: "bg-blue-600",
        bgClass: "hover:bg-blue-50/50 dark:hover:bg-blue-950/10",
      });
    });
  }

  // 2. Agregar alertas de stock
  if (ERPState.products && ERPState.products.length > 0) {
    ERPState.products.forEach((p) => {
      if (p.stock === 0) {
        alerts.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          type: "agotado",
          title: "Producto Agotado ❌",
          desc: `La referencia "${p.name}" (SKU: ${p.sku}) no tiene unidades en stock.`,
          colorClass: "bg-red-500",
          bgClass: "hover:bg-red-50/50 dark:hover:bg-red-950/10",
        });
      } else if (p.stock <= p.minStock) {
        alerts.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          type: "bajo_stock",
          title: "Stock Mínimo Superado ⚠️",
          desc: `"${p.name}" (SKU: ${p.sku}) está en stock crítico: ${p.stock} de ${p.minStock} uds.`,
          colorClass: "bg-amber-500",
          bgClass: "hover:bg-amber-50/50 dark:hover:bg-amber-950/10",
        });
      }
    });
  }

  // Actualizar indicador visual de la campana (badge rojo) y animación de timbrado
  if (badge) {
    const svg = notifBtn ? notifBtn.querySelector("svg") : null;
    if (alerts.length > 0) {
      badge.classList.remove("hidden");
      if (svg) svg.classList.add("animate-bell-ring");
    } else {
      badge.classList.add("hidden");
      if (svg) svg.classList.remove("animate-bell-ring");
    }
  }

  // Actualizar contador del header
  updateNotificationCounter(alerts.length);

  // Renderizar la lista
  if (alerts.length === 0) {
    list.innerHTML = `
      <div class="py-12 px-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
        <svg class="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-bold text-slate-400 dark:text-slate-500">¡Todo en orden! No hay alertas de stock ni pedidos web.</span>
      </div>
    `;
    return;
  }

  list.innerHTML = alerts
    .map((alert) => {
      const clickAction = alert.type === "web_order"
        ? `goToWebOrderAlert(${alert.id})`
        : `goToProductAlert('${alert.sku}')`;
      return `
      <div onclick="${clickAction}" class="p-3.5 border-b border-slate-100 dark:border-slate-700/60 flex gap-3 cursor-pointer transition-colors ${alert.bgClass}">
        <div class="w-2.5 h-2.5 rounded-full ${alert.colorClass} mt-1.5 flex-shrink-0 animate-pulse"></div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-0.5">
            <span class="font-bold text-xs text-slate-800 dark:text-white truncate">${alert.title}</span>
            <span class="text-[9px] font-bold text-slate-400 font-mono">${alert.sku}</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">${alert.desc}</p>
        </div>
      </div>
    `;
    })
    .join("");
};

window.goToWebOrderAlert = function (id) {
  const notifDrop = document.getElementById("notifications-dropdown");
  if (notifDrop) notifDrop.classList.add("hidden");

  window.location.hash = "web-orders";
};

function updateNotificationCounter(count) {
  const headerBadge = document.getElementById("notifications-header-badge");
  if (headerBadge) {
    headerBadge.textContent = `${count} ${count === 1 ? "Alerta" : "Alertas"}`;
    if (count > 0) {
      headerBadge.className =
        "text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full font-bold animate-pulse";
    } else {
      headerBadge.className =
        "text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold";
    }
  }
}

window.goToProductAlert = function (sku) {
  // Ocultar dropdown
  const notifDrop = document.getElementById("notifications-dropdown");
  if (notifDrop) notifDrop.classList.add("hidden");

  // Redirigir a almacenamiento
  window.location.hash = "inventory";

  // Buscar el producto en la tabla de almacenamiento
  setTimeout(() => {
    const searchInput = document.getElementById("inv-search-input");
    if (searchInput) {
      searchInput.value = sku;
      triggerInventorySearch();
    }
  }, 350);
};

// ==================== CAJA POS MODULE STATE & RENDERERS ====================
let cashState = {
  activeSession: null,
  page: 1,
  limit: 10,
  total: 0,
  startDate: "",
  endDate: ""
};

window.renderCashModule = async function (container) {
  // 1. Obtener la sesión activa
  try {
    const res = await fetch("api/get_active_cash_session.php");
    const data = await res.json();
    if (data.success && data.active) {
      cashState.activeSession = data.session;
    } else {
      cashState.activeSession = null;
    }
  } catch (err) {
    console.error("Error loading active cash session:", err);
    cashState.activeSession = null;
  }

  const isCajero = ERPState.session && ERPState.session.role === "cajero";

  // 2. Renderizar contenedor base
  container.innerHTML = `
    <div class="space-y-6 animate-toast-in">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight dark:text-white font-display">Control de Caja</h2>
          <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">Monitoree el fondo inicial, registre ingresos y egresos de efectivo y realice el arqueo de cierre diario.</p>
        </div>
        <div id="cash-session-badge">
          <!-- Dinámico -->
        </div>
      </div>

      <!-- Sección de Estado de Caja (Activa o Cerrada) -->
      <div id="cash-status-section">
        <!-- Dinámico -->
      </div>

      ${isCajero ? '' : `
      <!-- Sección de Historial de Arqueos -->
      <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium overflow-hidden">
        <div class="p-6 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold dark:text-white font-display">Historial de Arqueos y Cierres</h3>
            <p class="text-xs text-slate-400 mt-0.5">Listado de sesiones de caja finalizadas para auditoría fiscal.</p>
          </div>
          
          <!-- Filtros de fecha -->
          <div class="flex flex-wrap items-center gap-2">
            <input type="date" id="cash-filter-start" class="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" value="${cashState.startDate}">
            <span class="text-slate-400 text-xs">al</span>
            <input type="date" id="cash-filter-end" class="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" value="${cashState.endDate}">
            <button onclick="applyCashHistoryFilters()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all">Filtrar</button>
            <button onclick="clearCashHistoryFilters()" class="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs transition-all">✕</button>
          </div>
        </div>

        <div class="bg-transparent lg:bg-white dark:lg:bg-slate-800 rounded-3xl border-none lg:border border-slate-200/60 dark:border-slate-700 shadow-none lg:shadow-premium dark:lg:shadow-dark-premium overflow-hidden">
          <div class="table-scroll-container overflow-x-hidden lg:overflow-visible">
            <table class="w-full text-left border-collapse text-xs block lg:table">
              <thead class="hidden lg:table-header-group bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-700/60">
                <tr class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th class="py-3 px-6">Código</th>
                  <th class="py-3 px-6">Cajero</th>
                  <th class="py-3 px-6">Apertura</th>
                  <th class="py-3 px-6">Cierre</th>
                  <th class="py-3 px-6 text-right">Base Inicial</th>
                  <th class="py-3 px-6 text-right">Ventas Ef.</th>
                  <th class="py-3 px-6 text-right">Flujos Manuales</th>
                  <th class="py-3 px-6 text-right">Efectivo Esp.</th>
                  <th class="py-3 px-6 text-right">Efectivo Real</th>
                  <th class="py-3 px-6 text-right">Desviación</th>
                </tr>
              </thead>
              <tbody id="cash-history-tbody" class="divide-y divide-slate-100 dark:divide-slate-700 block lg:table-row-group">
                <!-- Dinámico -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer con Paginación -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10" id="cash-history-pagination">
          <!-- Dinámico -->
        </div>
      </div>
      `}
    </div>
  `;

  // 3. Cargar las vistas internas
  updateCashSessionBadge();
  updateCashStatusSection();
  if (!isCajero) {
    await loadCashHistory();
  }
};

function updateCashSessionBadge() {
  const badgeContainer = document.getElementById("cash-session-badge");
  if (!badgeContainer) return;

  if (cashState.activeSession) {
    badgeContainer.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/30 animate-pulse">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        Caja Activa: ${cashState.activeSession.customId}
      </span>
    `;
  } else {
    badgeContainer.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/60">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Caja Cerrada
      </span>
    `;
  }
}

function updateCashStatusSection() {
  const section = document.getElementById("cash-status-section");
  if (!section) return;

  if (cashState.activeSession) {
    const s = cashState.activeSession;
    const netFlow = s.cashInflows - s.cashOutflows;
    const flowText = netFlow >= 0 ? `+${netFlow.toFixed(2)}` : `${netFlow.toFixed(2)}`;
    const flowClass = netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

    const isCajero = ERPState.session && ERPState.session.role === "cajero";

    section.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Dashboard de Métricas de la Caja Chica Abierta -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <div>
              <h3 class="text-lg font-bold dark:text-white font-display">Resumen del Cajón Físico</h3>
              <p class="text-xs text-slate-400 mt-0.5">Control de los flujos de dinero acumulados en el turno de ${s.userName}.</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Apertura</span>
              <span class="text-xs text-slate-700 dark:text-slate-300 font-bold font-mono">${new Date(s.openingDate.replace(" ", "T")).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
          </div>

          ${isCajero ? `
          <!-- Card de Caja Abierta para Cajero (Arqueo a Ciegas) -->
          <div class="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-center gap-4 animate-toast-in">
            <div class="p-3 bg-emerald-500/20 rounded-full text-emerald-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div>
              <span class="text-sm font-bold text-emerald-800 dark:text-emerald-400 block">Turno de Facturación Abierto</span>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">El cajón de cobros está activo para ventas en efectivo y tarjeta. Al finalizar el turno, presione "Arqueo y Cierre de Caja" para registrar el dinero físico contado.</p>
            </div>
          </div>
          ` : `
          <!-- Cards de Métricas (Solo Admin) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-toast-in">
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Fondo Inicial</span>
              <span class="text-sm font-extrabold text-slate-800 dark:text-white font-mono">${formatEuro(s.initialBase)}</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Ventas Efectivo</span>
              <span class="text-sm font-extrabold text-green-600 dark:text-green-400 font-mono">+${formatEuro(s.cashSales)}</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Flujo Manual</span>
              <span class="text-sm font-extrabold ${flowClass} font-mono">${flowText} €</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span class="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Ventas Tarjeta</span>
              <span class="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 font-mono">${formatEuro(s.cardSales)}</span>
            </div>
          </div>

          <!-- Efectivo Estimado Esperado (Solo Admin) -->
          <div class="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-toast-in">
            <div>
              <span class="text-xs text-blue-700 dark:text-blue-400 font-bold block uppercase tracking-wider">Efectivo Estimado en Caja</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Importe total en efectivo que debería haber físicamente en el cajón.</p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">${formatEuro(s.expectedCash)}</span>
            </div>
          </div>
          `}

          <!-- Acciones Rápidas -->
          <div class="flex flex-wrap gap-3 pt-2">
            <button onclick="openCashMovementModal()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Registrar Entrada/Salida Chica
            </button>
            <button onclick="openCashCloseModal()" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Arqueo y Cierre de Caja
            </button>
          </div>
        </div>

        <!-- Historial Reciente de Movimientos de la Sesión -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium p-6 flex flex-col">
          <div class="border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <h4 class="text-sm font-bold dark:text-white font-display">Movimientos de la Sesión</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">Ingresos y retiros manuales registrados durante este turno.</p>
          </div>
          <div class="flex-1 overflow-y-auto max-h-[280px] space-y-3 pr-1" id="cash-session-movements-list">
            <!-- Dinámico -->
          </div>
        </div>
      </div>
    `;

    renderActiveSessionMovements();
  } else {
    // Caja cerrada
    section.innerHTML = `
      <div class="flex items-center justify-center py-8 animate-toast-in">
        <div class="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-premium dark:shadow-dark-premium text-center">
          <div class="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-2 font-display">Control de Caja Cerrado</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">No hay ninguna sesión de caja abierta en este momento. Abra la caja ingresando el fondo inicial para poder registrar ventas.</p>
          
          <form onsubmit="openCashSessionAction(event)" class="space-y-4">
            <div>
              <label class="block text-left text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Fondo Inicial de Caja (€)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">€</span>
                <input type="number" step="0.01" min="0" value="100.00" id="opening-initial-base" required class="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white">
              </div>
            </div>
            <button type="submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2">
              <span>Abrir Caja Registradora</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;
  }
}

function renderActiveSessionMovements() {
  const list = document.getElementById("cash-session-movements-list");
  if (!list || !cashState.activeSession) return;

  const movs = cashState.activeSession.movements;
  if (!movs || movs.length === 0) {
    list.innerHTML = `
      <div class="py-12 text-center text-slate-400 text-[11px] font-semibold flex flex-col items-center justify-center gap-1.5 h-full">
        <span>Sin movimientos manuales</span>
        <span class="text-[9px] font-normal text-slate-400 dark:text-slate-500">Registre ingresos o egresos si es necesario.</span>
      </div>
    `;
    return;
  }

  list.innerHTML = movs
    .map((m) => {
      const isEntrada = m.type === "Entrada";
      const badgeClass = isEntrada
        ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200/50"
        : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50";
      const prefix = isEntrada ? "+" : "-";

      return `
      <div class="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-start gap-3">
        <div class="min-w-0">
          <span class="px-2 py-0.5 text-[9px] font-bold rounded-md ${badgeClass}">${m.type}</span>
          <p class="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-normal truncate" title="${m.reason}">${m.reason}</p>
          <span class="text-[9px] text-slate-400 block mt-1 font-semibold">${m.user_name} • ${new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="text-xs font-extrabold text-slate-800 dark:text-white font-mono">${prefix}${formatEuro(parseFloat(m.amount))}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

window.openCashMovementModal = function () {
  const container = document.getElementById("modal-container");
  const card = document.getElementById("modal-card");

  if (!container || !card) return;

  card.innerHTML = `
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
      <div>
        <h3 class="text-lg font-bold dark:text-white font-display">Registrar Flujo de Efectivo</h3>
        <p class="text-xs text-slate-400 mt-0.5">Registre entradas o egresos manuales de caja chica.</p>
      </div>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold">✕</button>
    </div>

    <!-- Body -->
    <form onsubmit="submitCashMovement(event)" class="p-6 space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo de Movimiento</label>
        <div class="grid grid-cols-2 gap-3">
          <label class="cursor-pointer">
            <input type="radio" name="mov-type" value="Entrada" checked class="sr-only peer">
            <div class="relative flex items-center justify-center p-3.5 border rounded-xl select-none text-xs font-bold transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 peer-checked:border-blue-500 peer-checked:text-blue-600 text-slate-600 dark:text-slate-300">
              Entrada (+)
            </div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="mov-type" value="Salida" class="sr-only peer">
            <div class="relative flex items-center justify-center p-3.5 border rounded-xl select-none text-xs font-bold transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 peer-checked:border-blue-500 peer-checked:text-blue-600 text-slate-600 dark:text-slate-300">
              Salida (-)
            </div>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Importe (€)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">€</span>
          <input type="number" step="0.01" min="0.01" placeholder="0,00" id="mov-amount" required class="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white">
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Concepto / Motivo</label>
        <input type="text" id="mov-reason" placeholder="Ej: Compra de folios, cambio de monedas..." required class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-medium">
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
        <button type="button" onclick="closeModal()" class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-xs transition-all text-center">
          Cancelar
        </button>
        <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-all shadow-md">
          Guardar Movimiento
        </button>
      </div>
    </form>
  `;

  container.classList.remove("hidden");
};

window.submitCashMovement = async function (e) {
  e.preventDefault();
  const type = document.querySelector('input[name="mov-type"]:checked').value;
  const amount = parseFloat(document.getElementById("mov-amount").value) || 0;
  const reason = document.getElementById("mov-reason").value.trim();

  try {
    const res = await fetch("api/add_cash_movement.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, amount, reason, createdAt: new Date().toISOString() }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message, "success");
      closeModal();
      await renderActiveView("cash");
    } else {
      showToast(data.message || "Error al guardar el movimiento.", "error");
    }
  } catch (err) {
    console.error("Error submitting cash movement:", err);
    showToast("Error de red al guardar el movimiento.", "error");
  }
};

window.openCashCloseModal = function () {
  const container = document.getElementById("modal-container");
  const card = document.getElementById("modal-card");

  if (!container || !card || !cashState.activeSession) return;

  const expected = cashState.activeSession.expectedCash;
  const isCajero = ERPState.session && ERPState.session.role === "cajero";

  card.innerHTML = `
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
      <div>
        <h3 class="text-lg font-bold dark:text-white font-display">Arqueo y Cierre de Caja</h3>
        <p class="text-xs text-slate-400 mt-0.5">Cuadre de efectivo de la sesión ${cashState.activeSession.customId}.</p>
      </div>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold">✕</button>
    </div>

    <!-- Body -->
    <form onsubmit="submitCashClose(event)" class="p-6 space-y-4">
      ${isCajero ? '' : `
      <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center animate-toast-in">
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Efectivo Estimado (Esperado)</span>
        <span class="text-lg font-extrabold text-slate-800 dark:text-white font-mono" id="close-expected-display">${formatEuro(expected)}</span>
      </div>
      `}

      <div>
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Efectivo Real Contado (€) *</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">€</span>
          <input type="number" step="0.01" min="0" placeholder="0,00" id="close-real-cash" oninput="calculateArqueoDiff()" required class="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white">
        </div>
      </div>

      ${isCajero ? '' : `
      <!-- Diferencia Dinámica -->
      <div class="p-4 rounded-xl border flex justify-between items-center bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 animate-toast-in" id="arqueo-diff-box">
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Diferencia / Desviación</span>
        <span class="text-sm font-extrabold text-slate-600 dark:text-slate-300 font-mono" id="close-diff-display">0.00 €</span>
      </div>
      `}

      <div>
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Observaciones / Notas</label>
        <textarea id="close-notes" rows="3" placeholder="Indique observaciones del cuadre físico..." class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-medium resize-none"></textarea>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
        <button type="button" onclick="closeModal()" class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-xs transition-all text-center">
          Cancelar
        </button>
        <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-all shadow-md">
          Confirmar y Cerrar Caja
        </button>
      </div>
    </form>
  `;

  container.classList.remove("hidden");
};

window.calculateArqueoDiff = function () {
  const expected = cashState.activeSession
    ? cashState.activeSession.expectedCash
    : 0;
  const realInput = document.getElementById("close-real-cash");
  const diffDisplay = document.getElementById("close-diff-display");
  const diffBox = document.getElementById("arqueo-diff-box");

  if (!realInput || !diffDisplay || !diffBox) return;

  const real = parseFloat(realInput.value) || 0;
  const diff = real - expected;

  diffDisplay.textContent = `${diff >= 0 ? "+" : ""}${formatEuro(diff)}`;

  if (Math.abs(diff) < 0.01) {
    diffDisplay.className =
      "text-sm font-extrabold text-green-600 dark:text-green-400 font-mono";
    diffBox.className =
      "p-4 rounded-xl border flex justify-between items-center bg-green-50/30 dark:bg-green-950/10 border-green-200/50 dark:border-green-800/30";
  } else if (diff < 0) {
    diffDisplay.className =
      "text-sm font-extrabold text-red-600 dark:text-red-400 font-mono";
    diffBox.className =
      "p-4 rounded-xl border flex justify-between items-center bg-red-50/30 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/30";
  } else {
    diffDisplay.className =
      "text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono";
    diffBox.className =
      "p-4 rounded-xl border flex justify-between items-center bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/30";
  }
};

window.submitCashClose = async function (e) {
  e.preventDefault();
  const realCash =
    parseFloat(document.getElementById("close-real-cash").value) || 0;
  const notes = document.getElementById("close-notes").value.trim();

  try {
    const res = await fetch("api/close_cash_session.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ realCash, notes, closingDate: new Date().toISOString() }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message, "success");
      closeModal();
      await renderActiveView("cash");
    } else {
      showToast(data.message || "Error al cerrar la caja.", "error");
    }
  } catch (err) {
    console.error("Error closing cash session:", err);
    showToast("Error de red al cerrar la caja.", "error");
  }
};

window.loadCashHistory = async function () {
  const tbody = document.getElementById("cash-history-tbody");
  const pagination = document.getElementById("cash-history-pagination");
  if (!tbody || !pagination) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="10" class="py-12 text-center text-slate-400 text-xs font-semibold animate-pulse">
        Cargando historial de caja...
      </td>
    </tr>
  `;

  try {
    const url = `api/get_cash_sessions.php?page=${cashState.page}&limit=${cashState.limit}&startDate=${cashState.startDate}&endDate=${cashState.endDate}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      cashState.total = data.total;

      if (data.sessions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="py-12 text-center text-slate-400 text-xs font-semibold">
              No se han encontrado cierres de caja en el rango especificado.
            </td>
          </tr>
        `;
        pagination.innerHTML = "";
        return;
      }

      tbody.innerHTML = data.sessions
        .map((s) => {
          const expected = parseFloat(s.expected_cash);
          const real = s.real_cash !== null ? parseFloat(s.real_cash) : expected;
          const diff = s.difference !== null ? parseFloat(s.difference) : 0;

          let diffBadge = "";
          if (s.status === "Abierta") {
            diffBadge = `<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/50">Abierta</span>`;
          } else if (Math.abs(diff) < 0.01) {
            diffBadge = `<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200/50">Cuadrada</span>`;
          } else if (diff < 0) {
            diffBadge = `<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50" title="Faltante de ${formatEuro(Math.abs(diff))}">${formatEuro(diff)}</span>`;
          } else {
            diffBadge = `<span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50" title="Sobrante de ${formatEuro(diff)}">+${formatEuro(diff)}</span>`;
          }

          const closeDateText = s.closing_date
            ? new Date(s.closing_date).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—";

          const manualFlow =
            parseFloat(s.cash_inflows) - parseFloat(s.cash_outflows);

          return `
          <tr class="flex flex-col lg:table-row border border-slate-150 dark:border-slate-700/60 lg:border-none p-4 lg:p-0 rounded-2xl mb-4 lg:mb-0 bg-white dark:bg-slate-800 lg:bg-transparent shadow-sm lg:shadow-none gap-1.5 lg:gap-0">
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Código</span>
              <span class="font-bold text-slate-800 dark:text-white font-mono">${s.custom_id}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Cajero</span>
              <span class="font-semibold text-slate-600 dark:text-slate-300 text-right lg:text-left">${s.user_name}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Apertura</span>
              <span class="text-slate-500 dark:text-slate-400 font-mono">${new Date(s.opening_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Cierre</span>
              <span class="text-slate-500 dark:text-slate-400 font-mono">${closeDateText}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Inicial</span>
              <span class="font-semibold text-slate-600 dark:text-slate-300 font-mono">${formatEuro(parseFloat(s.initial_base))}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Ventas Ef.</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">+${formatEuro(parseFloat(s.cash_sales))}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Flujos Manuales</span>
              <span class="font-semibold ${manualFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} font-mono">${manualFlow >= 0 ? "+" : ""}${formatEuro(manualFlow)}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Efectivo Esp.</span>
              <span class="font-bold text-slate-800 dark:text-white font-mono">${formatEuro(expected)}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-right">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Efectivo Real</span>
              <span class="font-bold text-slate-800 dark:text-white font-mono">${s.status === "Abierta" ? "—" : formatEuro(real)}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-3.5 px-0 lg:px-6 text-right">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Desviación</span>
              <span class="font-mono">${diffBadge}</span>
            </td>
          </tr>
        `;
        })
        .join("");

      renderCashHistoryPagination();
    }
  } catch (err) {
    console.error("Error loading cash history:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="py-12 text-center text-red-500 text-xs font-semibold">
          Error al cargar historial desde el servidor.
        </td>
      </tr>
    `;
  }
};

window.applyCashHistoryFilters = function () {
  const start = document.getElementById("cash-filter-start");
  const end = document.getElementById("cash-filter-end");
  if (start) cashState.startDate = start.value;
  if (end) cashState.endDate = end.value;
  cashState.page = 1;
  loadCashHistory();
};

window.clearCashHistoryFilters = function () {
  cashState.startDate = "";
  cashState.endDate = "";
  const start = document.getElementById("cash-filter-start");
  const end = document.getElementById("cash-filter-end");
  if (start) start.value = "";
  if (end) end.value = "";
  cashState.page = 1;
  loadCashHistory();
};

function renderCashHistoryPagination() {
  const pagination = document.getElementById("cash-history-pagination");
  if (!pagination) return;

  const totalPages = Math.ceil(cashState.total / cashState.limit);
  const startRange = (cashState.page - 1) * cashState.limit + 1;
  const endRange = Math.min(cashState.page * cashState.limit, cashState.total);

  if (totalPages <= 1) {
    pagination.innerHTML = `
      <span class="text-xs text-slate-400 font-semibold">Mostrando ${startRange}-${endRange} de ${cashState.total} arqueos</span>
      <div></div>
    `;
    return;
  }

  pagination.innerHTML = `
    <span class="text-xs text-slate-400 font-semibold">Mostrando ${startRange}-${endRange} de ${cashState.total} arqueos</span>
    <div class="flex items-center gap-1">
      <button onclick="changeCashHistoryPage(${cashState.page - 1})" ${cashState.page === 1 ? "disabled" : ""} class="p-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-500 dark:text-slate-300 transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 px-3">Pág. ${cashState.page} de ${totalPages}</span>
      <button onclick="changeCashHistoryPage(${cashState.page + 1})" ${cashState.page === totalPages ? "disabled" : ""} class="p-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-500 dark:text-slate-300 transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </button>
    </div>
  `;
}

window.changeCashHistoryPage = function (page) {
  cashState.page = page;
  loadCashHistory();
};

// ==================== CHECKER DE SOLICITUDES DE PEDIDOS WEB ====================
let webOrdersInterval = null;
let lastPendingWebOrdersCount = 0;

window.startWebOrdersChecker = function() {
  if (webOrdersInterval) return;
  checkWebOrdersCount();
  webOrdersInterval = setInterval(checkWebOrdersCount, 15000);
};

window.stopWebOrdersChecker = function() {
  if (webOrdersInterval) {
    clearInterval(webOrdersInterval);
    webOrdersInterval = null;
  }
};

async function checkWebOrdersCount() {
  if (!ERPState.session || !ERPState.session.loggedIn) {
    stopWebOrdersChecker();
    return;
  }
  
  try {
    const res = await fetch("api/get_web_orders.php");
    const data = await res.json();
    if (data.success) {
      const pendingOrders = data.orders.filter(o => o.status === 'Pendiente');
      const count = pendingOrders.length;
      
      const badge = document.getElementById("badge-web-orders");
      if (badge) {
        if (count > 0) {
          badge.innerText = count;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }
      
      if (count > lastPendingWebOrdersCount) {
        const newOrders = pendingOrders.slice(0, count - lastPendingWebOrdersCount);
        playNotificationSound();
        newOrders.forEach(order => {
          showFloatingWebOrderAlert(order);
        });
      }
      
      ERPState.pendingWebOrders = pendingOrders;
      updateNotificationsSystem();
      
      lastPendingWebOrdersCount = count;
    }
  } catch (err) {
    console.error("Error al consultar pedidos web en segundo plano:", err);
  }
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playNote = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    playNote(659.25, now, 0.15);
    playNote(880.00, now + 0.12, 0.25);
  } catch (e) {
    console.error("Audio no soportado o bloqueado:", e);
  }
}

function showFloatingWebOrderAlert(order) {
  let container = document.getElementById("floating-alerts-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "floating-alerts-container";
    container.className = "fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none";
    document.body.appendChild(container);
  }
  
  const alertCard = document.createElement("div");
  alertCard.className = "pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 transition-all duration-500 translate-y-10 opacity-0 flex gap-3 cursor-pointer items-start hover:bg-slate-800 dark:hover:bg-slate-900";
  
  alertCard.innerHTML = `
    <div class="bg-primary-600 p-2.5 rounded-xl text-white flex-shrink-0 animate-bounce" style="margin-top: 2px;">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4a2 2 0 00-2 2v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1a2 2 0 00-2-2H2"></path></svg>
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex justify-between items-center mb-1">
        <span class="font-extrabold text-[10px] text-primary-400 uppercase tracking-wider">Nuevo Pedido Web</span>
        <span class="text-[9px] text-slate-400">Ahora</span>
      </div>
      <h4 class="text-xs font-bold text-white truncate">${order.client_name}</h4>
      <p class="text-[11px] text-slate-300 leading-normal mt-0.5">Ha enviado una solicitud desde <b>${order.preferred_store}</b> por un importe de <b>${formatEuro(parseFloat(order.total))}</b>.</p>
    </div>
  `;
  
  alertCard.addEventListener("click", () => {
    window.location.hash = "web-orders";
    alertCard.remove();
  });
  
  container.appendChild(alertCard);
  
  setTimeout(() => {
    alertCard.classList.remove("translate-y-10", "opacity-0");
  }, 50);
  
  setTimeout(() => {
    alertCard.classList.add("translate-y-[-10px]", "opacity-0");
    setTimeout(() => {
      alertCard.remove();
    }, 500);
  }, 8000);
}

// ==================== GESTOR DEL MÓDULO DE PEDIDOS WEB ERP ====================
let webOrdersList = [];

window.renderWebOrdersModule = async function(container) {
  container.innerHTML = `
    <div class="space-y-6 animate-toast-in">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight dark:text-white font-display">Pedidos Web y Consultas</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1 font-sans">Gestione las solicitudes de presupuesto y reservas de las tiendas físicas.</p>
        </div>
      </div>

      <div class="bg-transparent lg:bg-white dark:lg:bg-slate-800 rounded-3xl border-none lg:border border-slate-200/60 dark:border-slate-700 shadow-none lg:shadow-premium dark:lg:shadow-dark-premium overflow-hidden">
        <div class="table-scroll-container overflow-x-auto">
          <table class="w-full text-left text-sm block lg:table">
            <thead class="hidden lg:table-header-group">
              <tr class="bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                <th class="py-4 px-6">Código / N°</th>
                <th class="py-4 px-6">Cliente</th>
                <th class="py-4 px-6">Tienda Recogida</th>
                <th class="py-4 px-6">Fecha Solicitud</th>
                <th class="py-4 px-6 text-right">Total Estimado</th>
                <th class="py-4 px-6 text-center">Estado</th>
                <th class="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody id="web-orders-tbody" class="divide-y divide-slate-100 dark:divide-slate-700/50 block lg:table-row-group">
              <tr>
                <td colspan="7" class="py-12 text-center text-slate-400 font-semibold animate-pulse block lg:table-cell">
                  Cargando pedidos web...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await loadWebOrders();
};

async function loadWebOrders() {
  const tbody = document.getElementById("web-orders-tbody");
  if (!tbody) return;

  try {
    const res = await fetch("api/get_web_orders.php");
    const data = await res.json();

    if (data.success) {
      webOrdersList = data.orders;
      
      if (webOrdersList.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-12 text-center text-slate-400 font-semibold block lg:table-cell">
              No se han encontrado solicitudes de pedidos web.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = webOrdersList.map(order => {
        let statusClass = "";
        if (order.status === "Pendiente") {
          statusClass = "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
        } else if (order.status === "Procesado") {
          statusClass = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30";
        } else {
          statusClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
        }

        const formattedDate = new Date(order.created_at).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short"
        });

        return `
          <tr class="flex flex-col lg:table-row border border-slate-150 dark:border-slate-700/60 lg:border-none p-4 lg:p-0 rounded-2xl mb-4 lg:mb-0 bg-white dark:bg-slate-800 lg:bg-transparent shadow-sm lg:shadow-none gap-1.5 lg:gap-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors">
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none font-mono text-xs">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Código</span>
              <div class="text-right lg:text-left">
                <span class="font-bold text-slate-800 dark:text-white">${order.order_number}</span>
                <span class="text-slate-400 block text-[10px]">${order.custom_id}</span>
              </div>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente</span>
              <div class="text-right lg:text-left">
                <div class="font-semibold text-slate-800 dark:text-slate-200">${order.client_name}</div>
                <div class="text-xs text-slate-500 font-mono">${order.client_phone}</div>
              </div>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Tienda</span>
              <span class="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                <svg class="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${order.preferred_store}
              </span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-slate-500 dark:text-slate-400 font-mono text-xs">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</span>
              <span>${formattedDate}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none lg:text-right font-bold text-slate-800 dark:text-white font-mono">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
              <span>${formatEuro(parseFloat(order.total))}</span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6 border-b border-slate-50 dark:border-slate-700/40 lg:border-none text-center">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusClass}">
                ${order.status}
              </span>
            </td>
            <td class="flex justify-between items-center lg:table-cell py-2.5 lg:py-4 px-0 lg:px-6">
              <span class="inline lg:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400">Acciones</span>
              <div class="flex items-center justify-end lg:justify-center gap-1.5">
                <button onclick="openWebOrderDetail(${order.id})" class="p-1.5 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all" title="Ver Detalles">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
                ${order.status === "Pendiente" ? `
                  <button onclick="processWebOrder(${order.id}, 'Confirmar')" class="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all" title="Confirmar y Facturar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </button>
                  <button onclick="processWebOrder(${order.id}, 'Cancelar')" class="p-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg transition-all" title="Cancelar Solicitud">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Error loading web orders list:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-red-500 font-semibold block lg:table-cell">
          Error al cargar los pedidos web desde el servidor.
        </td>
      </tr>
    `;
  }
}

window.openWebOrderDetail = function(orderId) {
  const order = webOrdersList.find(o => o.id == orderId);
  if (!order) return;

  const container = document.getElementById("modal-container");
  const card = document.getElementById("modal-card");
  if (!container || !card) return;

  card.className = "bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-premium dark:shadow-dark-premium overflow-hidden transform animate-modal-content flex flex-col max-h-[90vh]";

  const itemsHtml = order.items.map(item => {
    return `
      <tr class="border-b border-slate-100 dark:border-slate-700/40 text-xs">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800 dark:text-white">${item.product_name}</div>
          <div class="text-[10px] text-slate-500 font-mono">${item.product_sku}</div>
        </td>
        <td class="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300 font-mono">${item.qty}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300 font-mono">${formatEuro(parseFloat(item.price))}</td>
        <td class="py-3 px-4 text-right font-bold text-slate-800 dark:text-white font-mono">${formatEuro((item.qty * item.price))}</td>
      </tr>
    `;
  }).join("");

  card.innerHTML = `
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
      <h3 class="text-lg font-bold text-slate-800 dark:text-white font-display">Detalles de Solicitud: ${order.order_number}</h3>
      <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl">✕</button>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6 bg-slate-50 dark:bg-slate-900/30 overflow-y-auto max-h-[70vh]">
      
      <!-- Ficha de Datos del Cliente -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Información del Cliente</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400 block mb-0.5">Nombre Completo</span>
            <strong class="text-slate-800 dark:text-white text-sm font-bold">${order.client_name}</strong>
          </div>
          <div>
            <span class="text-slate-400 block mb-0.5">Documento Fiscal (DNI/NIF)</span>
            <strong class="text-slate-800 dark:text-white font-mono">${order.client_document}</strong>
          </div>
          <div>
            <span class="text-slate-400 block mb-0.5">Teléfono</span>
            <strong class="text-slate-800 dark:text-white font-mono">${order.client_phone}</strong>
          </div>
          <div>
            <span class="text-slate-400 block mb-0.5">Correo Electrónico</span>
            <strong class="text-slate-800 dark:text-white font-mono">${order.client_email}</strong>
          </div>
          <div class="sm:col-span-2">
            <span class="text-slate-400 block mb-0.5">Dirección de Entrega</span>
            <strong class="text-slate-800 dark:text-white font-medium">${order.client_address}, ${order.client_city}</strong>
          </div>
          <div>
            <span class="text-slate-400 block mb-0.5">Tienda Seleccionada</span>
            <span class="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              ${order.preferred_store}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block mb-0.5">Fecha y Hora</span>
            <strong class="text-slate-800 dark:text-white font-mono">${new Date(order.created_at).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <!-- Comentarios adicionales -->
      ${order.comments ? `
        <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
          <svg class="w-5 h-5 text-amber-600 flex-shrink-0" style="margin-top: 1px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          <div class="text-xs">
            <strong class="text-amber-800 dark:text-amber-400 block font-bold mb-0.5">Comentarios del Cliente:</strong>
            <p class="text-amber-700 dark:text-amber-300 leading-relaxed font-medium">${order.comments}</p>
          </div>
        </div>
      ` : ''}

      <!-- Listado de Artículos Solicitados -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos en Carrito</h4>
        </div>
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
              <th class="py-3 px-4">Producto</th>
              <th class="py-3 px-4 text-center">Cant.</th>
              <th class="py-3 px-4 text-right">Precio Unit.</th>
              <th class="py-3 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="bg-slate-50/30 dark:bg-slate-900/20 font-bold border-t border-slate-100 dark:border-slate-750">
              <td colspan="3" class="py-3.5 px-4 text-right text-xs text-slate-500">Importe Total Estimado:</td>
              <td class="py-3.5 px-4 text-right text-base text-slate-850 dark:text-white font-mono">${formatEuro(parseFloat(order.total))}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Actions -->
    <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-3xl">
      <button onclick="closeModal()" class="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all">
        Cerrar
      </button>
      ${order.status === "Pendiente" ? `
        <button onclick="processWebOrder(${order.id}, 'Cancelar')" class="px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-all border border-red-200 dark:border-red-900/30">
          Cancelar Solicitud
        </button>
        <button onclick="processWebOrder(${order.id}, 'Confirmar')" class="px-5 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
          Confirmar y Facturar Venta
        </button>
      ` : ''}
    </div>
  `;

  container.classList.remove("hidden");
};

window.processWebOrder = async function(orderId, action) {
  const order = webOrdersList.find(o => o.id == orderId);
  if (!order) return;

  const confirmationMsg = action === 'Confirmar' 
    ? `¿Está seguro de que desea confirmar y facturar el pedido ${order.order_number}?\nEsto creará una factura "Cobrada", descontará stock del inventario y afectará la caja activa.`
    : `¿Está seguro de que desea cancelar y archivar la solicitud ${order.order_number}?`;

  if (!confirm(confirmationMsg)) return;

  try {
    const res = await fetch("api/process_web_order.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ webOrderId: orderId, action })
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message, "success");
      closeModal();
      
      if (action === 'Confirmar') {
        await loadDashboardData();
      }
      
      await loadWebOrders();
      await checkWebOrdersCount();
    } else {
      showToast(data.message || "Error al procesar el pedido web.", "error");
    }
  } catch (err) {
    console.error("Error processing web order:", err);
    showToast("Error de red al procesar el pedido.", "error");
  }
};

