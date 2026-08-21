/**
 * Basic ERP - Visual Basic 6.0 / Windows 98 Application Manager
 * Core JS for Draggable Window MDI Environment and AJAX Modules.
 */

// Estado global de la aplicación
const AppState = {
    currentUser: null,
    windows: {}, // id -> window element
    activeWindow: null,
    nextZIndex: 100,
    products: [],
    clients: [],
    suppliers: [],
    settings: {}
};

// Inicialización cuando carga el documento
document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    updateClock();
    setInterval(updateClock, 1000);
    setupMenuEvents();
    setupToolboxEvents();
});

// Actualiza el reloj de la barra de estado
function updateClock() {
    const clockPanel = document.getElementById("status-clock");
    if (clockPanel) {
        const now = new Date();
        clockPanel.textContent = now.toLocaleTimeString();
    }
}

// Verifica si hay sesión PHP activa
function checkSession() {
    fetch("api.php?action=check_session")
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                AppState.currentUser = res.data;
                initWorkspace();
            } else {
                showLogin();
            }
        })
        .catch(err => {
            console.error("Error comprobando sesión:", err);
            showLogin();
        });
}

// Inicializa y dibuja el entorno MDI de VB6
function initWorkspace() {
    // Ocultar login si existe
    const loginWin = document.getElementById("login-window");
    if (loginWin) loginWin.remove();

    // Mostrar el contenedor de la aplicación
    document.getElementById("ide-container").style.display = "flex";
    
    // Configurar paneles de estado
    document.getElementById("status-user").textContent = `Usuario: ${AppState.currentUser.name} (${AppState.currentUser.role.toUpperCase()})`;
    document.getElementById("status-server").textContent = "Base de Datos: ONLINE";

    // Cargar datos iniciales en memoria
    loadInitialData();

    // Mostrar el formulario de configuración global en la paleta de propiedades por defecto
    updatePropertyGrid(null);
}

// Carga datos para selects y consultas rápidas
function loadInitialData() {
    fetch("api.php?action=get_settings")
        .then(r => r.json())
        .then(r => { if (r.success) AppState.settings = r.data; });
    fetch("api.php?action=get_products")
        .then(r => r.json())
        .then(r => { if (r.success) AppState.products = r.data; });
    fetch("api.php?action=get_clients")
        .then(r => r.json())
        .then(r => { if (r.success) AppState.clients = r.data; });
    fetch("api.php?action=get_suppliers")
        .then(r => r.json())
        .then(r => { if (r.success) AppState.suppliers = r.data; });
}

// Muestra el diálogo de Login (frmLogin)
function showLogin() {
    // Limpiar workspace e IDE
    document.getElementById("ide-container").style.display = "none";
    
    // Eliminar login anterior si hubiese
    const oldLogin = document.getElementById("login-window");
    if (oldLogin) oldLogin.remove();

    const loginWin = document.createElement("div");
    loginWin.id = "login-window";
    loginWin.className = "win-outset login-form-box";
    loginWin.innerHTML = `
        <div class="login-banner">
            <h1>Microsoft</h1>
            <h2 style="font-size:18px; font-weight:bold;">Visual Basic 6.0</h2>
            <p style="font-size:9px; margin-top:2px;">Basic ERP Enterprise Edition</p>
        </div>
        <div class="win-window-body">
            <div class="win-frame" style="margin-top:6px;">
                <div class="win-frame-title">Acceso de Usuario</div>
                <form id="login-form">
                    <div class="win-form-group">
                        <label class="win-label">Correo Electrónico:</label>
                        <input type="email" id="login-email" class="win-textbox" value="admin@admin.com" required autocomplete="username">
                    </div>
                    <div class="win-form-group" style="margin-top:6px;">
                        <label class="win-label">Contraseña:</label>
                        <input type="password" id="login-pass" class="win-textbox" value="admin" required autocomplete="current-password">
                    </div>
                    <div id="login-error" class="error-text" style="margin-top:6px; display:none;"></div>
                </form>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                <button type="submit" form="login-form" class="win-btn" style="font-weight:bold; min-width:80px;">Aceptar</button>
                <button type="button" onclick="window.close()" class="win-btn" style="min-width:80px;">Salir</button>
            </div>
        </div>
    `;

    document.body.appendChild(loginWin);

    // Evento de submit para login
    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-pass").value;
        const errDiv = document.getElementById("login-error");
        errDiv.style.display = "none";

        fetch("api.php?action=login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                AppState.currentUser = res.data;
                initWorkspace();
            } else {
                errDiv.textContent = res.message || "Error al autenticar.";
                errDiv.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err);
            errDiv.textContent = "Error de conexión con el servidor.";
            errDiv.style.display = "block";
        });
    });
}

// Cerrar sesión
function logout() {
    fetch("api.php?action=logout")
        .then(() => {
            AppState.currentUser = null;
            AppState.windows = {};
            document.getElementById("mdi-workspace").innerHTML = "";
            showLogin();
        });
}

// Configurar los menús desplegables del MDI
function setupMenuEvents() {
    const items = document.querySelectorAll(".win-menubar-item");
    
    // Al hacer clic en un menú de la barra
    items.forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            const isActive = item.classList.contains("active");
            
            // Cerrar otros menús abiertos
            items.forEach(it => it.classList.remove("active"));
            
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });

    // Cerrar menús al hacer clic fuera
    document.addEventListener("click", () => {
        items.forEach(it => it.classList.remove("active"));
    });
}

// Configurar la caja de herramientas (Toolbox) de VB6
function setupToolboxEvents() {
    const btns = document.querySelectorAll(".win-toolbox-btn");
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const formName = btn.getAttribute("data-form");
            if (formName) {
                openForm(formName);
                // Volver a seleccionar el cursor (flecha estándar) tras 1 segundo
                setTimeout(() => {
                    btns.forEach(b => b.classList.remove("active"));
                    document.querySelector('.win-toolbox-btn[data-form="cursor"]').classList.add("active");
                }, 400);
            }
        });
    });
}

// ==========================================
// VENTANAS MDI (WINDOW MANAGER)
// ==========================================

function openForm(formName) {
    // Si ya está abierto, darle foco
    if (AppState.windows[formName]) {
        focusWindow(AppState.windows[formName]);
        return;
    }

    const formMeta = FormsMeta[formName];
    if (!formMeta) return;

    // Crear elemento de ventana
    const win = document.createElement("div");
    win.className = "win-outset win-window";
    win.style.left = `${formMeta.left}px`;
    win.style.top = `${formMeta.top}px`;
    win.style.width = `${formMeta.width}px`;
    win.style.height = `${formMeta.height}px`;
    win.id = `win-${formName}`;

    // Título y controles
    win.innerHTML = `
        <div class="win-titlebar">
            <span class="win-title-text">
                <span class="win-title-icon" style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 16 16&quot; fill=&quot;%23ffffff&quot;><path d=&quot;M1 1h14v14H1V1zm1 3v10h12V4H2z&quot;/></svg>');"></span>
                ${formMeta.caption} (${formName})
            </span>
            <div class="win-title-controls">
                <button class="win-title-btn" onclick="minimizeForm('${formName}')">_</button>
                <button class="win-title-btn" onclick="maximizeForm('${formName}')">🗖</button>
                <button class="win-title-btn close-btn" onclick="closeForm('${formName}')">×</button>
            </div>
        </div>
        <div class="win-window-body" id="body-${formName}">
            <div style="padding: 10px; text-align: center;">Cargando formulario...</div>
        </div>
    `;

    document.getElementById("mdi-workspace").appendChild(win);
    AppState.windows[formName] = win;

    // Hacer arrastrable
    makeDraggable(win);

    // Hacer enfocable
    win.addEventListener("mousedown", () => focusWindow(win));
    
    // Foco inicial
    focusWindow(win);

    // Cargar contenido específico del módulo
    if (FormRenderers[formName]) {
        FormRenderers[formName](win.querySelector(`.win-window-body`));
    }
}

function focusWindow(winEl) {
    if (AppState.activeWindow === winEl) return;
    
    // Quitar clase active del anterior
    if (AppState.activeWindow) {
        AppState.activeWindow.classList.remove("active");
    }
    
    AppState.activeWindow = winEl;
    winEl.classList.add("active");
    
    // Incrementar e indexar z-index
    AppState.nextZIndex++;
    winEl.style.zIndex = AppState.nextZIndex;

    // Actualizar cuadrícula de propiedades del IDE de VB6
    updatePropertyGrid(winEl);
}

function closeForm(formName) {
    const win = AppState.windows[formName];
    if (win) {
        win.remove();
        delete AppState.windows[formName];
        if (AppState.activeWindow === win) {
            AppState.activeWindow = null;
            // Dar foco al siguiente disponible
            const keys = Object.keys(AppState.windows);
            if (keys.length > 0) {
                focusWindow(AppState.windows[keys[keys.length - 1]]);
            } else {
                updatePropertyGrid(null);
            }
        }
    }
}

function minimizeForm(formName) {
    const win = AppState.windows[formName];
    if (win) {
        // En un MDI real se reduce a una barra en la parte inferior del workspace
        win.style.display = "none";
        showToast(`Formulario ${formMeta(formName).caption} minimizado.`);
    }
}

function maximizeForm(formName) {
    const win = AppState.windows[formName];
    if (win) {
        if (win.style.width === "100%") {
            // Restaurar tamaño original
            const meta = FormsMeta[formName];
            win.style.width = `${meta.width}px`;
            win.style.height = `${meta.height}px`;
            win.style.left = `${meta.left}px`;
            win.style.top = `${meta.top}px`;
        } else {
            // Maximizar en área de trabajo
            win.style.width = "100%";
            win.style.height = "100%";
            win.style.left = "0px";
            win.style.top = "0px";
        }
        updatePropertyGrid(win);
    }
}

// Hacer una ventana arrastrable mediante la barra de título
function makeDraggable(winEl) {
    const titlebar = winEl.querySelector(".win-titlebar");
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    titlebar.addEventListener("mousedown", (e) => {
        // No arrastrar si se hace clic en los botones de control
        if (e.target.closest(".win-title-btn")) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(winEl.style.left) || 0;
        initialTop = parseInt(winEl.style.top) || 0;
        
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        
        focusWindow(winEl);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        winEl.style.left = `${initialLeft + dx}px`;
        winEl.style.top = `${initialTop + dy}px`;
        updatePropertyGrid(winEl);
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }
}

// Muestra/actualiza la ventana de Propiedades a la derecha en base a la ventana activa
function updatePropertyGrid(winEl) {
    const grid = document.getElementById("properties-grid");
    if (!grid) return;

    if (!winEl) {
        // Configuración de la aplicación global cuando no hay ventana activa
        grid.innerHTML = `
            <div class="win-property-row"><div class="win-property-name">AppName</div><div class="win-property-value">Basic ERP</div></div>
            <div class="win-property-row"><div class="win-property-name">Version</div><div class="win-property-value">6.0.26</div></div>
            <div class="win-property-row"><div class="win-property-name">Company</div><div class="win-property-value">${AppState.settings.company_name || 'Cargando...'}</div></div>
            <div class="win-property-row"><div class="win-property-name">Database</div><div class="win-property-value">MariaDB 11.4</div></div>
            <div class="win-property-row"><div class="win-property-name">Engine</div><div class="win-property-value">PDO_MySQL</div></div>
            <div class="win-property-row"><div class="win-property-name">Theme</div><div class="win-property-value">Windows 98 classic</div></div>
        `;
        document.getElementById("properties-win-name").textContent = "Global Project (Properties)";
        return;
    }

    const formId = winEl.id.replace("win-", "");
    const meta = FormsMeta[formId];
    
    document.getElementById("properties-win-name").textContent = `${formId} Form (Properties)`;
    
    grid.innerHTML = `
        <div class="win-property-row"><div class="win-property-name">Name</div><div class="win-property-value">${formId}</div></div>
        <div class="win-property-row"><div class="win-property-name">Caption</div><div class="win-property-value">${meta ? meta.caption : "Window"}</div></div>
        <div class="win-property-row"><div class="win-property-name">Left</div><div class="win-property-value">${winEl.style.left}</div></div>
        <div class="win-property-row"><div class="win-property-name">Top</div><div class="win-property-value">${winEl.style.top}</div></div>
        <div class="win-property-row"><div class="win-property-name">Width</div><div class="win-property-value">${winEl.style.width}</div></div>
        <div class="win-property-row"><div class="win-property-name">Height</div><div class="win-property-value">${winEl.style.height}</div></div>
        <div class="win-property-row"><div class="win-property-name">BorderStyle</div><div class="win-property-value">2 - Sizable</div></div>
        <div class="win-property-row"><div class="win-property-name">BackColor</div><div class="win-property-value">&H00D4D0C8&</div></div>
        <div class="win-property-row"><div class="win-property-name">Font</div><div class="win-property-value">Tahoma, 8pt</div></div>
        <div class="win-property-row"><div class="win-property-name">ScaleMode</div><div class="win-property-value">1 - Twip</div></div>
    `;
}

// Diálogo modal clásico de confirmación/aviso
function showDialog(title, text, type = "info") {
    const dialog = document.createElement("div");
    dialog.className = "win-outset win-window win-dialog";
    dialog.style.left = "50%";
    dialog.style.top = "40%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.zIndex = 3000;
    dialog.id = "system-dialog";

    dialog.innerHTML = `
        <div class="win-titlebar active">
            <span class="win-title-text">${title}</span>
            <div class="win-title-controls">
                <button class="win-title-btn close-btn" onclick="document.getElementById('system-dialog').remove()">×</button>
            </div>
        </div>
        <div class="win-window-body">
            <div class="win-dialog-content">
                <div class="win-dialog-icon ${type}"></div>
                <div style="font-size:12px; line-height: 1.4; padding-top: 4px;">${text}</div>
            </div>
            <div class="win-dialog-buttons">
                <button class="win-btn" style="min-width: 80px; font-weight: bold;" onclick="document.getElementById('system-dialog').remove()">Aceptar</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
}

// Diálogo simple para notificaciones (Toast)
function showToast(text) {
    const toast = document.createElement("div");
    toast.className = "win-outset-soft";
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "20px";
    toast.style.padding = "6px 12px";
    toast.style.zIndex = 4000;
    toast.style.background = "#ffffd0";
    toast.style.border = "1px solid var(--win-shadow)";
    toast.textContent = text;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2500);
}

// ==========================================
// CONFIGURACIÓN DE LOS FORMULARIOS (META)
// ==========================================

const FormsMeta = {
    frmInventario:  { caption: "Mantenimiento de Inventario", width: 620, height: 400, left: 40, top: 40 },
    frmFacturacion: { caption: "Emisión de Factura de Venta", width: 680, height: 460, left: 100, top: 20 },
    frmClientes:    { caption: "Directorio de Clientes",     width: 580, height: 380, left: 70, top: 80 },
    frmProveedores: { caption: "Registro de Proveedores",   width: 580, height: 380, left: 120, top: 120 },
    frmAuditoria:   { caption: "Log de Auditoría de Sistema",width: 650, height: 380, left: 150, top: 150 },
    frmConfiguracion:{ caption: "Configuración de Empresa",   width: 450, height: 320, left: 200, top: 60 }
};

// ==========================================
// DIBUJO Y LÓGICA DE CADA FORMULARIO (RENDERERS)
// ==========================================

const FormRenderers = {};

// 1. INVENTARIO (frmInventario)
FormRenderers.frmInventario = function(container) {
    function renderList() {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                    <div style="font-weight:bold; font-size:12px;">Catálogo de Productos</div>
                    <button class="win-btn" id="btn-new-product"><span style="font-weight:bold;">+</span> Nuevo Producto</button>
                </div>
                <div class="win-listview-container" style="flex:1;">
                    <table class="win-listview" id="tbl-products">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Nombre del Producto</th>
                                <th>Categoría</th>
                                <th>Stock</th>
                                <th>Precio Venta</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" style="text-align:center;">Cargando productos...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const tblBody = container.querySelector("#tbl-products tbody");
        
        fetch("api.php?action=get_products")
            .then(r => r.json())
            .then(res => {
                if (!res.success) {
                    tblBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error: ${res.message}</td></tr>`;
                    return;
                }
                
                AppState.products = res.data;
                if (res.data.length === 0) {
                    tblBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay productos registrados.</td></tr>`;
                    return;
                }

                tblBody.innerHTML = res.data.map(p => {
                    let statusColor = "black";
                    if (p.status === "Agotado") statusColor = "red";
                    else if (p.status === "Bajo Stock") statusColor = "orange";

                    return `
                        <tr class="product-row" data-id="${p.id}">
                            <td style="font-family:monospace; font-weight:bold;">${p.sku}</td>
                            <td>${p.name}</td>
                            <td>${p.category || '-'}</td>
                            <td style="text-align:right; font-weight:bold;">${p.stock}</td>
                            <td style="text-align:right;">${parseFloat(p.sell_price).toFixed(2)} €</td>
                            <td style="font-weight:bold; color:${statusColor};">${p.status}</td>
                        </tr>
                    `;
                }).join("");

                // Agregar evento de doble clic para editar
                container.querySelectorAll(".product-row").forEach(row => {
                    row.addEventListener("dblclick", () => {
                        const id = row.getAttribute("data-id");
                        const prod = AppState.products.find(p => p.id == id);
                        if (prod) openProductDialog(prod);
                    });
                });
            });

        container.querySelector("#btn-new-product").addEventListener("click", () => {
            openProductDialog(null);
        });
    }

    function openProductDialog(prod) {
        // Crear sub-ventana de diálogo
        const dialog = document.createElement("div");
        dialog.className = "win-outset win-window";
        dialog.style.left = "80px";
        dialog.style.top = "60px";
        dialog.style.width = "400px";
        dialog.style.zIndex = AppState.nextZIndex + 10;
        dialog.id = "dialog-product-form";
        
        const title = prod ? "Modificar Producto" : "Registrar Nuevo Producto";
        
        dialog.innerHTML = `
            <div class="win-titlebar active">
                <span class="win-title-text">${title}</span>
                <div class="win-title-controls">
                    <button class="win-title-btn close-btn" onclick="document.getElementById('dialog-product-form').remove()">×</button>
                </div>
            </div>
            <div class="win-window-body">
                <form id="frm-product-submit">
                    <input type="hidden" id="prod-id" value="${prod ? prod.id : ''}">
                    <div class="win-form-group-row">
                        <div class="win-form-group">
                            <label class="win-label">SKU (Código):</label>
                            <input type="text" id="prod-sku" class="win-textbox" value="${prod ? prod.sku : ''}" required ${prod ? 'readonly style="background:#e4e0d8;"' : ''}>
                        </div>
                        <div class="win-form-group">
                            <label class="win-label">Categoría:</label>
                            <input type="text" id="prod-category" class="win-textbox" value="${prod ? (prod.category || '') : ''}">
                        </div>
                    </div>
                    <div class="win-form-group">
                        <label class="win-label">Nombre del Producto:</label>
                        <input type="text" id="prod-name" class="win-textbox" value="${prod ? prod.name : ''}" required>
                    </div>
                    <div class="win-form-group-row" style="margin-top:6px;">
                        <div class="win-form-group">
                            <label class="win-label">Precio Compra (€):</label>
                            <input type="number" step="0.01" id="prod-buy-price" class="win-textbox" value="${prod ? prod.buy_price : '0.00'}" required>
                        </div>
                        <div class="win-form-group">
                            <label class="win-label">Precio Venta (€):</label>
                            <input type="number" step="0.01" id="prod-sell-price" class="win-textbox" value="${prod ? prod.sell_price : '0.00'}" required>
                        </div>
                    </div>
                    <div class="win-form-group-row" style="margin-top:6px;">
                        <div class="win-form-group">
                            <label class="win-label">Stock Actual:</label>
                            <input type="number" id="prod-stock" class="win-textbox" value="${prod ? prod.stock : '0'}" required>
                        </div>
                        <div class="win-form-group">
                            <label class="win-label">Stock Mínimo:</label>
                            <input type="number" id="prod-min-stock" class="win-textbox" value="${prod ? prod.min_stock : '5'}" required>
                        </div>
                    </div>
                    <div class="win-form-group" style="margin-top:6px;">
                        <label class="win-label">Descripción:</label>
                        <textarea id="prod-description" class="win-textbox" rows="3">${prod ? (prod.description || '') : ''}</textarea>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button type="submit" class="win-btn" style="font-weight:bold;">Guardar</button>
                        <button type="button" class="win-btn" onclick="document.getElementById('dialog-product-form').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById("mdi-workspace").appendChild(dialog);
        makeDraggable(dialog);

        // Control de envío
        dialog.querySelector("#frm-product-submit").addEventListener("submit", (e) => {
            e.preventDefault();
            const id = dialog.querySelector("#prod-id").value;
            const sku = dialog.querySelector("#prod-sku").value;
            const name = dialog.querySelector("#prod-name").value;
            const category = dialog.querySelector("#prod-category").value;
            const buy_price = dialog.querySelector("#prod-buy-price").value;
            const sell_price = dialog.querySelector("#prod-sell-price").value;
            const stock = dialog.querySelector("#prod-stock").value;
            const min_stock = dialog.querySelector("#prod-min-stock").value;
            const description = dialog.querySelector("#prod-description").value;

            fetch("api.php?action=save_product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, sku, name, category, buy_price, sell_price, stock, min_stock, description })
            })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showToast(res.message);
                    dialog.remove();
                    renderList();
                    loadInitialData(); // refrescar caché local
                } else {
                    showDialog("Error de validación", res.message, "error");
                }
            })
            .catch(err => {
                showDialog("Error de Red", "No se pudo guardar el producto.", "error");
                console.error(err);
            });
        });
    }

    renderList();
};

// 2. FACTURACIÓN (frmFacturacion)
FormRenderers.frmFacturacion = function(container) {
    let currentInvoiceItems = [];

    function renderInvoiceForm() {
        // Cargar clientes
        const clientOptions = AppState.clients.map(c => `<option value="${c.id}">${c.name} [Doc: ${c.document}]</option>`).join("");
        const productOptions = AppState.products.map(p => `<option value="${p.id}" data-price="${p.sell_price}" data-stock="${p.stock}">${p.name} (SKU: ${p.sku} | Stock: ${p.stock})</option>`).join("");

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; gap:8px;">
                <div style="display:flex; gap:8px;">
                    <!-- Cabecera de la factura (Cliente y detalles) -->
                    <div class="win-frame" style="flex:2; margin-bottom:0;">
                        <div class="win-frame-title">Datos del Cliente</div>
                        <div class="win-form-group">
                            <label class="win-label">Seleccionar Cliente:</label>
                            <select id="inv-client-id" class="win-select">
                                <option value="">-- Seleccione Cliente --</option>
                                ${clientOptions}
                            </select>
                        </div>
                        <div class="win-form-group-row" style="margin-top:6px;">
                            <div class="win-form-group">
                                <label class="win-label">Método Pago:</label>
                                <select id="inv-payment-method" class="win-select">
                                    <option value="Tarjeta">Tarjeta de Crédito</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia Bancaria</option>
                                </select>
                            </div>
                            <div class="win-form-group">
                                <label class="win-label">Descuento (€):</label>
                                <input type="number" id="inv-discount" class="win-textbox" value="0.00" step="0.01">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Agregar Productos -->
                    <div class="win-frame" style="flex:2; margin-bottom:0;">
                        <div class="win-frame-title">Agregar Artículos</div>
                        <div class="win-form-group">
                            <label class="win-label">Artículo:</label>
                            <select id="inv-product-select" class="win-select">
                                <option value="">-- Seleccione un Producto --</option>
                                ${productOptions}
                            </select>
                        </div>
                        <div class="win-form-group-row" style="margin-top:6px;">
                            <div class="win-form-group" style="flex:1;">
                                <label class="win-label">Cantidad:</label>
                                <input type="number" id="inv-qty-input" class="win-textbox" value="1" min="1">
                            </div>
                            <div class="win-form-group" style="flex:1;">
                                <label class="win-label">Precio Unitario (€):</label>
                                <input type="number" id="inv-price-input" class="win-textbox" value="0.00" step="0.01">
                            </div>
                            <div style="display:flex; align-items:flex-end;">
                                <button type="button" class="win-btn" id="btn-add-item" style="font-weight:bold; height:21px;">Añadir</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detalle / Tabla de ítems agregados -->
                <div class="win-listview-container" style="flex:1; min-height:100px;">
                    <table class="win-listview" id="tbl-invoice-items">
                        <thead>
                            <tr>
                                <th>Artículo</th>
                                <th style="width:70px; text-align:right;">Cant.</th>
                                <th style="width:100px; text-align:right;">Prec. Unit.</th>
                                <th style="width:100px; text-align:right;">Subtotal</th>
                                <th style="width:40px; text-align:center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="5" style="text-align:center; color:var(--win-text-gray);">Ningún artículo en la factura.</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Totales de Facturación -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--win-gray); padding:4px;">
                    <div style="display:flex; gap:12px; font-weight:bold;">
                        <div>Subtotal: <span id="lbl-subtotal">0.00</span> €</div>
                        <div>IVA (${AppState.settings.tax_rate || 21}%): <span id="lbl-tax">0.00</span> €</div>
                        <div style="color:var(--win-blue); font-size:12px;">Total: <span id="lbl-total">0.00</span> €</div>
                    </div>
                    <button class="win-btn" id="btn-emit-invoice" style="font-weight:bold; min-width:140px; background-color:#dfdfdf; box-shadow: 1px 1px 0px 0px var(--win-black); border-color: var(--win-white) var(--win-shadow) var(--win-shadow) var(--win-white);">🖨 Emitir Factura</button>
                </div>
            </div>
        `;

        // Al cambiar producto, actualizar precio unitario sugerido
        const prodSelect = container.querySelector("#inv-product-select");
        const priceInput = container.querySelector("#inv-price-input");
        const qtyInput = container.querySelector("#inv-qty-input");
        
        prodSelect.addEventListener("change", () => {
            const selectedOpt = prodSelect.options[prodSelect.selectedIndex];
            if (selectedOpt && selectedOpt.value !== "") {
                priceInput.value = parseFloat(selectedOpt.getAttribute("data-price")).toFixed(2);
            } else {
                priceInput.value = "0.00";
            }
        });

        // Botón añadir ítem
        container.querySelector("#btn-add-item").addEventListener("click", () => {
            const pId = prodSelect.value;
            const pName = prodSelect.options[prodSelect.selectedIndex].text.split(" (SKU:")[0];
            const qty = parseInt(qtyInput.value);
            const price = parseFloat(priceInput.value);
            const stockMax = parseInt(prodSelect.options[prodSelect.selectedIndex].getAttribute("data-stock") || 0);

            if (!pId) {
                showDialog("Validación", "Por favor seleccione un artículo.", "error");
                return;
            }
            if (qty <= 0 || isNaN(qty)) {
                showDialog("Validación", "La cantidad debe ser mayor que cero.", "error");
                return;
            }
            if (price < 0 || isNaN(price)) {
                showDialog("Validación", "El precio no puede ser negativo.", "error");
                return;
            }
            if (qty > stockMax) {
                showDialog("Advertencia de Stock", `Stock insuficiente del producto. Disponible: ${stockMax}`, "error");
                return;
            }

            // Validar si ya existe en la lista para sumarle cantidad
            const existing = currentInvoiceItems.find(item => item.product_id === pId);
            if (existing) {
                if (existing.qty + qty > stockMax) {
                    showDialog("Advertencia de Stock", `La suma solicitada supera el stock disponible (${stockMax}).`, "error");
                    return;
                }
                existing.qty += qty;
            } else {
                currentInvoiceItems.push({
                    product_id: pId,
                    name: pName,
                    qty: qty,
                    price: price
                });
            }

            // reset inputs
            prodSelect.value = "";
            qtyInput.value = 1;
            priceInput.value = "0.00";
            
            updateInvoiceTable();
        });

        // Recalcular al cambiar descuento
        container.querySelector("#inv-discount").addEventListener("input", calculateTotals);

        // Botón Emitir Factura
        container.querySelector("#btn-emit-invoice").addEventListener("click", () => {
            const clientId = container.querySelector("#inv-client-id").value;
            const paymentMethod = container.querySelector("#inv-payment-method").value;
            const discount = parseFloat(container.querySelector("#inv-discount").value) || 0;

            if (!clientId) {
                showDialog("Faltan datos", "Debe seleccionar un cliente.", "error");
                return;
            }
            if (currentInvoiceItems.length === 0) {
                showDialog("Factura Vacía", "Debe agregar al menos un artículo para facturar.", "error");
                return;
            }

            // Enviar datos al servidor
            fetch("api.php?action=save_invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: clientId,
                    payment_method: paymentMethod,
                    tax_rate: AppState.settings.tax_rate || 21,
                    discount: discount,
                    items: currentInvoiceItems
                })
            })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showDialog("Factura Emitida", `Se ha emitido con éxito la factura ${res.data.invoice_number} por un importe total.`, "info");
                    currentInvoiceItems = [];
                    renderInvoiceForm(); // Reiniciar formulario
                    loadInitialData(); // refrescar stock en caché local
                } else {
                    showDialog("Error al Facturar", res.message, "error");
                }
            })
            .catch(err => {
                showDialog("Error de Red", "No se pudo comunicar con el servidor para emitir la factura.", "error");
                console.error(err);
            });
        });
    }

    function updateInvoiceTable() {
        const tblBody = container.querySelector("#tbl-invoice-items tbody");
        if (currentInvoiceItems.length === 0) {
            tblBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--win-text-gray);">Ningún artículo en la factura.</td></tr>`;
            calculateTotals();
            return;
        }

        tblBody.innerHTML = currentInvoiceItems.map((item, idx) => {
            const subtotal = item.qty * item.price;
            return `
                <tr>
                    <td><strong>${item.name}</strong></td>
                    <td style="text-align:right;">${item.qty}</td>
                    <td style="text-align:right;">${item.price.toFixed(2)} €</td>
                    <td style="text-align:right; font-weight:bold;">${subtotal.toFixed(2)} €</td>
                    <td style="text-align:center;">
                        <button class="win-btn" style="padding: 1px 4px; font-size:9px;" onclick="window.removeInvoiceItem(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join("");

        calculateTotals();
    }

    // Exponer función de borrado globalmente para los clics en la tabla
    window.removeInvoiceItem = function(index) {
        currentInvoiceItems.splice(index, 1);
        updateInvoiceTable();
    };

    function calculateTotals() {
        const discountInput = container.querySelector("#inv-discount");
        const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
        
        let subtotal = 0;
        currentInvoiceItems.forEach(item => {
            subtotal += item.qty * item.price;
        });

        const taxRate = AppState.settings.tax_rate || 21;
        const subtotalConDescuento = Math.max(0, subtotal - discount);
        const taxAmount = subtotalConDescuento * (taxRate / 100);
        const total = subtotalConDescuento + taxAmount;

        const subLbl = container.querySelector("#lbl-subtotal");
        const taxLbl = container.querySelector("#lbl-tax");
        const totLbl = container.querySelector("#lbl-total");

        if (subLbl) subLbl.textContent = subtotal.toFixed(2);
        if (taxLbl) taxLbl.textContent = taxAmount.toFixed(2);
        if (totLbl) totLbl.textContent = total.toFixed(2);
    }

    renderInvoiceForm();
};

// 3. CLIENTES (frmClientes)
FormRenderers.frmClientes = function(container) {
    function renderList() {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                    <div style="font-weight:bold; font-size:12px;">Mantenimiento de Clientes</div>
                    <button class="win-btn" id="btn-new-client"><span style="font-weight:bold;">+</span> Nuevo Cliente</button>
                </div>
                <div class="win-listview-container" style="flex:1;">
                    <table class="win-listview" id="tbl-clients">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>NIF/DNI</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Ciudad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" style="text-align:center;">Cargando clientes...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const tblBody = container.querySelector("#tbl-clients tbody");
        
        fetch("api.php?action=get_clients")
            .then(r => r.json())
            .then(res => {
                if (!res.success) {
                    tblBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error: ${res.message}</td></tr>`;
                    return;
                }
                
                AppState.clients = res.data;
                if (res.data.length === 0) {
                    tblBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay clientes registrados.</td></tr>`;
                    return;
                }

                tblBody.innerHTML = res.data.map(c => `
                    <tr class="client-row" data-id="${c.id}">
                        <td style="font-family:monospace; font-weight:bold;">${c.custom_id}</td>
                        <td>${c.name}</td>
                        <td>${c.document}</td>
                        <td>${c.phone || '-'}</td>
                        <td>${c.email || '-'}</td>
                        <td>${c.city || '-'}</td>
                    </tr>
                `).join("");

                // Evento doble clic editar
                container.querySelectorAll(".client-row").forEach(row => {
                    row.addEventListener("dblclick", () => {
                        const id = row.getAttribute("data-id");
                        const cli = AppState.clients.find(c => c.id == id);
                        if (cli) openClientDialog(cli);
                    });
                });
            });

        container.querySelector("#btn-new-client").addEventListener("click", () => {
            openClientDialog(null);
        });
    }

    function openClientDialog(cli) {
        const dialog = document.createElement("div");
        dialog.className = "win-outset win-window";
        dialog.style.left = "90px";
        dialog.style.top = "80px";
        dialog.style.width = "380px";
        dialog.style.zIndex = AppState.nextZIndex + 10;
        dialog.id = "dialog-client-form";

        const title = cli ? "Modificar Ficha Cliente" : "Registrar Ficha Cliente";

        dialog.innerHTML = `
            <div class="win-titlebar active">
                <span class="win-title-text">${title}</span>
                <div class="win-title-controls">
                    <button class="win-title-btn close-btn" onclick="document.getElementById('dialog-client-form').remove()">×</button>
                </div>
            </div>
            <div class="win-window-body">
                <form id="frm-client-submit">
                    <input type="hidden" id="cli-id" value="${cli ? cli.id : ''}">
                    <div class="win-form-group">
                        <label class="win-label">Nombre Completo / Razón Social:</label>
                        <input type="text" id="cli-name" class="win-textbox" value="${cli ? cli.name : ''}" required>
                    </div>
                    <div class="win-form-group-row" style="margin-top:6px;">
                        <div class="win-form-group">
                            <label class="win-label">NIF / CIF / DNI:</label>
                            <input type="text" id="cli-document" class="win-textbox" value="${cli ? cli.document : ''}" required>
                        </div>
                        <div class="win-form-group">
                            <label class="win-label">Teléfono:</label>
                            <input type="text" id="cli-phone" class="win-textbox" value="${cli ? (cli.phone || '') : ''}">
                        </div>
                    </div>
                    <div class="win-form-group" style="margin-top:6px;">
                        <label class="win-label">Email:</label>
                        <input type="email" id="cli-email" class="win-textbox" value="${cli ? (cli.email || '') : ''}">
                    </div>
                    <div class="win-form-group-row" style="margin-top:6px;">
                        <div class="win-form-group" style="flex:2;">
                            <label class="win-label">Dirección:</label>
                            <input type="text" id="cli-address" class="win-textbox" value="${cli ? (cli.address || '') : ''}">
                        </div>
                        <div class="win-form-group" style="flex:1;">
                            <label class="win-label">Ciudad:</label>
                            <input type="text" id="cli-city" class="win-textbox" value="${cli ? (cli.city || '') : ''}">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button type="submit" class="win-btn" style="font-weight:bold;">Guardar</button>
                        <button type="button" class="win-btn" onclick="document.getElementById('dialog-client-form').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById("mdi-workspace").appendChild(dialog);
        makeDraggable(dialog);

        dialog.querySelector("#frm-client-submit").addEventListener("submit", (e) => {
            e.preventDefault();
            const id = dialog.querySelector("#cli-id").value;
            const name = dialog.querySelector("#cli-name").value;
            const documentNum = dialog.querySelector("#cli-document").value;
            const phone = dialog.querySelector("#cli-phone").value;
            const email = dialog.querySelector("#cli-email").value;
            const address = dialog.querySelector("#cli-address").value;
            const city = dialog.querySelector("#cli-city").value;

            fetch("api.php?action=save_client", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name, document: documentNum, phone, email, address, city })
            })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showToast(res.message);
                    dialog.remove();
                    renderList();
                    loadInitialData(); // refrescar caché
                } else {
                    showDialog("Error", res.message, "error");
                }
            })
            .catch(err => {
                showDialog("Error", "No se pudo conectar con la base de datos.", "error");
                console.error(err);
            });
        });
    }

    renderList();
};

// 4. PROVEEDORES (frmProveedores)
FormRenderers.frmProveedores = function(container) {
    function renderList() {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                    <div style="font-weight:bold; font-size:12px;">Registro de Proveedores</div>
                    <button class="win-btn" id="btn-new-supplier"><span style="font-weight:bold;">+</span> Nuevo Proveedor</button>
                </div>
                <div class="win-listview-container" style="flex:1;">
                    <table class="win-listview" id="tbl-suppliers">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Proveedor</th>
                                <th>Contacto</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" style="text-align:center;">Cargando proveedores...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const tblBody = container.querySelector("#tbl-suppliers tbody");
        
        fetch("api.php?action=get_suppliers")
            .then(r => r.json())
            .then(res => {
                if (!res.success) {
                    tblBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error: ${res.message}</td></tr>`;
                    return;
                }
                
                AppState.suppliers = res.data;
                if (res.data.length === 0) {
                    tblBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay proveedores registrados.</td></tr>`;
                    return;
                }

                tblBody.innerHTML = res.data.map(s => `
                    <tr class="supplier-row" data-id="${s.id}">
                        <td style="font-family:monospace; font-weight:bold;">${s.custom_id}</td>
                        <td>${s.name}</td>
                        <td>${s.contact || '-'}</td>
                        <td>${s.phone || '-'}</td>
                        <td>${s.email || '-'}</td>
                        <td style="font-weight:bold; color:${s.status === 'Activo' ? 'green' : 'red'};">${s.status}</td>
                    </tr>
                `).join("");

                // Evento doble clic editar
                container.querySelectorAll(".supplier-row").forEach(row => {
                    row.addEventListener("dblclick", () => {
                        const id = row.getAttribute("data-id");
                        const sup = AppState.suppliers.find(s => s.id == id);
                        if (sup) openSupplierDialog(sup);
                    });
                });
            });

        container.querySelector("#btn-new-supplier").addEventListener("click", () => {
            openSupplierDialog(null);
        });
    }

    function openSupplierDialog(sup) {
        const dialog = document.createElement("div");
        dialog.className = "win-outset win-window";
        dialog.style.left = "130px";
        dialog.style.top = "100px";
        dialog.style.width = "380px";
        dialog.style.zIndex = AppState.nextZIndex + 10;
        dialog.id = "dialog-supplier-form";

        const title = sup ? "Modificar Proveedor" : "Registrar Proveedor";

        dialog.innerHTML = `
            <div class="win-titlebar active">
                <span class="win-title-text">${title}</span>
                <div class="win-title-controls">
                    <button class="win-title-btn close-btn" onclick="document.getElementById('dialog-supplier-form').remove()">×</button>
                </div>
            </div>
            <div class="win-window-body">
                <form id="frm-supplier-submit">
                    <input type="hidden" id="sup-id" value="${sup ? sup.id : ''}">
                    <div class="win-form-group">
                        <label class="win-label">Razón Social / Nombre Comercial:</label>
                        <input type="text" id="sup-name" class="win-textbox" value="${sup ? sup.name : ''}" required>
                    </div>
                    <div class="win-form-group-row" style="margin-top:6px;">
                        <div class="win-form-group">
                            <label class="win-label">Persona de Contacto:</label>
                            <input type="text" id="sup-contact" class="win-textbox" value="${sup ? (sup.contact || '') : ''}">
                        </div>
                        <div class="win-form-group">
                            <label class="win-label">Teléfono:</label>
                            <input type="text" id="sup-phone" class="win-textbox" value="${sup ? (sup.phone || '') : ''}">
                        </div>
                    </div>
                    <div class="win-form-group" style="margin-top:6px;">
                        <label class="win-label">Email:</label>
                        <input type="email" id="sup-email" class="win-textbox" value="${sup ? (sup.email || '') : ''}">
                    </div>
                    <div class="win-form-group" style="margin-top:6px;">
                        <label class="win-label">Dirección Comercial:</label>
                        <input type="text" id="sup-address" class="win-textbox" value="${sup ? (sup.address || '') : ''}">
                    </div>
                    <div class="win-form-group" style="margin-top:6px;">
                        <label class="win-label">Estado:</label>
                        <select id="sup-status" class="win-select">
                            <option value="Activo" ${sup && sup.status === 'Activo' ? 'selected' : ''}>Activo</option>
                            <option value="Inactivo" ${sup && sup.status === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button type="submit" class="win-btn" style="font-weight:bold;">Guardar</button>
                        <button type="button" class="win-btn" onclick="document.getElementById('dialog-supplier-form').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById("mdi-workspace").appendChild(dialog);
        makeDraggable(dialog);

        dialog.querySelector("#frm-supplier-submit").addEventListener("submit", (e) => {
            e.preventDefault();
            const id = dialog.querySelector("#sup-id").value;
            const name = dialog.querySelector("#sup-name").value;
            const contact = dialog.querySelector("#sup-contact").value;
            const phone = dialog.querySelector("#sup-phone").value;
            const email = dialog.querySelector("#sup-email").value;
            const address = dialog.querySelector("#sup-address").value;
            const status = dialog.querySelector("#sup-status").value;

            fetch("api.php?action=save_supplier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name, contact, phone, email, address, status })
            })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    showToast(res.message);
                    dialog.remove();
                    renderList();
                    loadInitialData(); // refrescar caché
                } else {
                    showDialog("Error", res.message, "error");
                }
            })
            .catch(err => {
                showDialog("Error", "No se pudo guardar el proveedor.", "error");
                console.error(err);
            });
        });
    }

    renderList();
};

// 5. CONFIGURACIÓN (frmConfiguracion)
FormRenderers.frmConfiguracion = function(container) {
    function loadConfigForm() {
        container.innerHTML = `<div style="padding:10px; text-align:center;">Cargando parámetros...</div>`;

        fetch("api.php?action=get_settings")
            .then(r => r.json())
            .then(res => {
                if (!res.success) {
                    container.innerHTML = `<div style="color:red; padding:10px;">Error al obtener la configuración.</div>`;
                    return;
                }

                AppState.settings = res.data;
                const s = res.data;

                container.innerHTML = `
                    <form id="frm-settings-save" style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
                        <div class="win-frame" style="margin-bottom:0;">
                            <div class="win-frame-title">Parámetros de la Empresa</div>
                            <div class="win-form-group">
                                <label class="win-label">Nombre Comercial / S.L.:</label>
                                <input type="text" id="set-company-name" class="win-textbox" value="${s.company_name}" required>
                            </div>
                            <div class="win-form-group-row" style="margin-top:6px;">
                                <div class="win-form-group">
                                    <label class="win-label">CIF / NIF:</label>
                                    <input type="text" id="set-cif" class="win-textbox" value="${s.cif}" required>
                                </div>
                                <div class="win-form-group">
                                    <label class="win-label">Moneda:</label>
                                    <input type="text" id="set-currency" class="win-textbox" value="${s.currency || '€'}" required>
                                </div>
                            </div>
                            <div class="win-form-group-row" style="margin-top:6px;">
                                <div class="win-form-group">
                                    <label class="win-label">Tasa IVA (%):</label>
                                    <input type="number" id="set-tax-rate" class="win-textbox" value="${s.tax_rate}" required>
                                </div>
                                <div class="win-form-group">
                                    <label class="win-label">Teléfono Contacto:</label>
                                    <input type="text" id="set-phone" class="win-textbox" value="${s.phone || ''}">
                                </div>
                            </div>
                            <div class="win-form-group" style="margin-top:6px;">
                                <label class="win-label">Email de Contacto:</label>
                                <input type="email" id="set-email" class="win-textbox" value="${s.email || ''}">
                            </div>
                            <div class="win-form-group-row" style="margin-top:6px;">
                                <div class="win-form-group" style="flex:2;">
                                    <label class="win-label">Dirección Fiscal:</label>
                                    <input type="text" id="set-address" class="win-textbox" value="${s.address || ''}">
                                </div>
                                <div class="win-form-group" style="flex:1;">
                                    <label class="win-label">Ciudad:</label>
                                    <input type="text" id="set-city" class="win-textbox" value="${s.city || ''}">
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                            <button type="submit" class="win-btn" style="font-weight:bold; min-width:80px;">Guardar</button>
                            <button type="button" class="win-btn" onclick="closeForm('frmConfiguracion')" style="min-width:80px;">Cancelar</button>
                        </div>
                    </form>
                `;

                // Manejo de envío
                container.querySelector("#frm-settings-save").addEventListener("submit", (e) => {
                    e.preventDefault();
                    
                    const company_name = container.querySelector("#set-company-name").value;
                    const cif = container.querySelector("#set-cif").value;
                    const currency = container.querySelector("#set-currency").value;
                    const tax_rate = container.querySelector("#set-tax-rate").value;
                    const phone = container.querySelector("#set-phone").value;
                    const email = container.querySelector("#set-email").value;
                    const address = container.querySelector("#set-address").value;
                    const city = container.querySelector("#set-city").value;

                    fetch("api.php?action=save_settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ company_name, cif, currency, tax_rate, phone, email, address, city })
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            showToast("Configuración guardada con éxito.");
                            loadInitialData(); // refrescar
                            closeForm('frmConfiguracion');
                        } else {
                            showDialog("Error", res.message, "error");
                        }
                    })
                    .catch(err => {
                        showDialog("Error", "No se pudieron actualizar los parámetros.", "error");
                        console.error(err);
                    });
                });

            });
    }

    loadConfigForm();
};

// 6. LOGS DE AUDITORÍA (frmAuditoria)
FormRenderers.frmAuditoria = function(container) {
    function loadLogs() {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                    <div style="font-weight:bold; font-size:12px;">Registro de Actividades del Sistema</div>
                    <button class="win-btn" id="btn-refresh-logs">Actualizar</button>
                </div>
                <div class="win-listview-container" style="flex:1;">
                    <table class="win-listview" id="tbl-audit-logs">
                        <thead>
                            <tr>
                                <th style="width:120px;">Fecha y Hora</th>
                                <th>Usuario</th>
                                <th>Acción</th>
                                <th>Tabla</th>
                                <th>ID Rec.</th>
                                <th>Descripción</th>
                                <th>Dirección IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="7" style="text-align:center;">Cargando registros de auditoría...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const tblBody = container.querySelector("#tbl-audit-logs tbody");
        
        fetch("api.php?action=get_audit_logs")
            .then(r => r.json())
            .then(res => {
                if (!res.success) {
                    tblBody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error: ${res.message}</td></tr>`;
                    return;
                }

                if (res.data.length === 0) {
                    tblBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay registros de auditoría aún.</td></tr>`;
                    return;
                }

                tblBody.innerHTML = res.data.map(l => `
                    <tr>
                        <td style="font-family:monospace; font-size:10px;">${l.created_at}</td>
                        <td style="font-weight:bold;">${l.user_name || 'Sistema'}</td>
                        <td><span style="font-family:monospace; background:#e0e0e0; padding:1px 3px; border-radius:2px;">${l.action}</span></td>
                        <td>${l.table_name}</td>
                        <td style="text-align:right;">${l.record_id || '-'}</td>
                        <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.description}">${l.description}</td>
                        <td style="font-family:monospace; font-size:10px;">${l.ip_address}</td>
                    </tr>
                `).join("");
            });
            
        container.querySelector("#btn-refresh-logs").addEventListener("click", loadLogs);
    }

    loadLogs();
};
