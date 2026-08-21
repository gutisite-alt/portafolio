/**
 * Modal: Gestión de Clientes / Usuarios
 */
const UsuariosModal = (() => {
  // Mock data para demostración (ahora usa clases 'theme' en lugar de hex codes)
  let clientes = [
    {
      id: 1,
      nombre: "Burger King Centro",
      email: "gerencia@bkcentro.com",
      estado: "activo",
      pantallas: 4,
      limite: 5,
      storage: "2.1 GB",
      initials: "BK",
      theme: "amber",
    },
    {
      id: 2,
      nombre: "Farmacias Cruz Azul",
      email: "admin@cruzazul.ec",
      estado: "activo",
      pantallas: 12,
      limite: 15,
      storage: "5.4 GB",
      initials: "FC",
      theme: "blue",
    },
    {
      id: 3,
      nombre: "Gimnasio FitLife",
      email: "contacto@fitlife.com",
      estado: "suspendido",
      pantallas: 2,
      limite: 2,
      storage: "800 MB",
      initials: "FL",
      theme: "red",
    },
    {
      id: 4,
      nombre: "Agencia Marketing Pro",
      email: "hola@mktpro.net",
      estado: "activo",
      pantallas: 1,
      limite: 10,
      storage: "4.5 GB",
      initials: "AM",
      theme: "purple",
    },
  ];

  function open() {
    Modal.open({
      title: "Gestión de Clientes",
      size: "xl",
      content: getHtml(),
      actions: [{ label: "Cerrar", onClick: Modal.close }],
    });

    // Actualizar menú lateral
    if (typeof _ !== "undefined") {
      _(".tree-leaf").removeClass("active");
      _(".tree-leaf").each(function (idx, el) {
        if (_(el).text().includes("Usuarios")) {
          _(el).addClass("active");
        }
      });
    }

    setTimeout(initEvents, 50);
  }

  function getHtml() {
    return `
      <div class="crm-wrapper">
        <!-- Header Actions -->
        <div class="crm-header">
          <div class="crm-search">
            <i class="lexx lexx_search"></i>
            <input type="text" id="crm-search-input" placeholder="Buscar cliente por nombre o correo...">
          </div>
          <button class="crm-btn-primary" id="btn-nuevo-cliente">
            <i class="lexx lexx_plus"></i> Nuevo Cliente
          </button>
        </div>

        <!-- Estadísticas Rápidas -->
        <div class="crm-stats">
          <div class="crm-stat-card">
            <div class="stat-icon icon-blue"><i class="lexx lexx_user_outline"></i></div>
            <div class="stat-info">
              <span class="stat-value">4</span>
              <span class="stat-label">Clientes Activos</span>
            </div>
          </div>
          <div class="crm-stat-card">
            <div class="stat-icon icon-green"><i class="lexx lexx_devices"></i></div>
            <div class="stat-info">
              <span class="stat-value">19 / 32</span>
              <span class="stat-label">Pantallas en Uso</span>
            </div>
          </div>
          <div class="crm-stat-card">
            <div class="stat-icon icon-amber"><i class="lexx lexx_folder"></i></div>
            <div class="stat-info">
              <span class="stat-value">12.8 GB</span>
              <span class="stat-label">Almacenamiento Total</span>
            </div>
          </div>
        </div>

        <!-- Tabla de Clientes -->
        <div class="crm-table-container">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Pantallas</th>
                <th>Almacenamiento</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody id="crm-table-body">
              ${renderTableRows(clientes)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderTableRows(data) {
    if (data.length === 0) {
      return `<tr><td colspan="5" class="empty-row">No se encontraron clientes.</td></tr>`;
    }

    return data
      .map(
        (c) => `
      <tr class="crm-row">
        <td>
          <div class="crm-client-cell">
            <div class="crm-avatar avatar-${c.theme}">
              ${c.initials}
            </div>
            <div class="crm-client-info">
              <div class="crm-client-name">${c.nombre}</div>
              <div class="crm-client-email">${c.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="crm-badge ${c.estado === "activo" ? "badge-success" : "badge-danger"}">
            ${c.estado === "activo" ? "Activo" : "Suspendido"}
          </span>
        </td>
        <td>
          <div class="crm-screens-bar">
            <div class="screens-text"><b>${c.pantallas}</b> de ${c.limite}</div>
            <div class="screens-progress">
              <div class="screens-fill ${c.pantallas === c.limite ? "fill-danger" : "fill-primary"}" style="width: ${(c.pantallas / c.limite) * 100}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <div class="crm-storage">${c.storage}</div>
        </td>
        <td class="text-right">
          <div class="crm-actions">
            <button class="crm-btn-icon" title="Editar Límites" onclick="UsuariosModal.editClient(${c.id})">
              <i class="lexx lexx_edit"></i>
            </button>
            <button class="crm-btn-icon ${c.estado === "activo" ? "text-danger" : "text-success"}" title="${c.estado === "activo" ? "Suspender" : "Reactivar"}" onclick="alert('Cambiando estado de ${c.nombre}...')">
              <i class="lexx ${c.estado === "activo" ? "lexx_circle_times" : "lexx_check_circle"}"></i>
            </button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  function initEvents() {
    const searchInput = _("#crm-search-input");
    if (searchInput && searchInput.length > 0) {
      searchInput.on("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtrados = clientes.filter(
          (c) =>
            c.nombre.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query),
        );
        _("#crm-table-body").html(renderTableRows(filtrados));
      });
    }

    const btnNuevo = _("#btn-nuevo-cliente");
    if (btnNuevo && btnNuevo.length > 0) {
      btnNuevo.on("click", () => openClientForm(null));
    }
  }

  function openClientForm(clientId = null) {
    let clientData = null;
    if (clientId) {
      clientData = clientes.find(c => c.id === clientId);
    }

    const titleText = clientData ? "Editar Cliente" : "Nuevo Cliente";

    // Si ya existe en el DOM, lo mostramos
    const existingOverlay = _("#nc-modal-overlay");
    if (existingOverlay && existingOverlay.length > 0) {
      // Actualizamos datos en caso de ser re-abierto
      _("#nc-modal-overlay .modal-title").text(titleText);
      _("#nc-client-id").val(clientData ? clientData.id : "");
      _("#nc-nombre").val(clientData ? clientData.nombre : "");
      _("#nc-email").val(clientData ? clientData.email : "");
      _("#nc-limite").val(clientData ? clientData.limite : "1");
      _("#nc-theme").val(clientData ? clientData.theme : "blue");
      
      existingOverlay.addClass("active");
      return;
    }

    const html = `
      <div id="nc-modal-overlay" class="modal-overlay modal-overlay-top">
        <div class="modal-box" data-size="md">
          <div class="modal-header">
            <h2 class="modal-title">${titleText}</h2>
            <button class="modal-close" id="btn-cerrar-nc-top"><i class="lexx lexx_times"></i></button>
          </div>
          <div class="modal-body">
            <div class="wz-wrap wz-wrap-flat">
              <div class="wz-content-container wz-content-auto">
                <div class="wz-content active">
                  <div class="wz-form">
                    <input type="hidden" id="nc-client-id" value="${clientData ? clientData.id : ""}">
                    <div class="wz-row wz-row--full">
                      <label class="wz-label">Nombre de la Empresa / Cliente <span class="wz-req">*</span></label>
                      <input type="text" id="nc-nombre" class="wz-input" placeholder="Ej. Pizza Hut" value="${clientData ? clientData.nombre : ""}">
                    </div>
                    <div class="wz-row wz-row--full">
                      <label class="wz-label">Correo Electrónico <span class="wz-req">*</span></label>
                      <input type="email" id="nc-email" class="wz-input" placeholder="contacto@empresa.com" value="${clientData ? clientData.email : ""}">
                    </div>
                    <div class="wz-row">
                      <label class="wz-label">Límite de Pantallas <span class="wz-req">*</span></label>
                      <input type="number" id="nc-limite" class="wz-input" placeholder="Ej. 5" min="1" value="${clientData ? clientData.limite : "1"}">
                    </div>
                    <div class="wz-row">
                      <label class="wz-label">Color del Avatar (Tema)</label>
                      <select id="nc-theme" class="wz-input">
                        <option value="blue" ${clientData && clientData.theme === 'blue' ? 'selected' : ''}>Azul Corporativo</option>
                        <option value="amber" ${clientData && clientData.theme === 'amber' ? 'selected' : ''}>Ámbar</option>
                        <option value="red" ${clientData && clientData.theme === 'red' ? 'selected' : ''}>Rojo Alerta</option>
                        <option value="purple" ${clientData && clientData.theme === 'purple' ? 'selected' : ''}>Púrpura Creativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="wz-footer wz-footer-clean">
                <button id="btn-cancelar-nc" class="modal-btn modal-btn--secondary">Cancelar</button>
                <div class="flex-spacer"></div>
                <button id="btn-guardar-nc" class="modal-btn modal-btn--primary">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv.firstElementChild);

    setTimeout(() => {
      _("#nc-modal-overlay").addClass("active");

      const closeNc = () => {
        _("#nc-modal-overlay").removeClass("active");
        setTimeout(() => _("#nc-modal-overlay").remove(), 300); // Remove from DOM after transition
      };

      _("#btn-cerrar-nc-top").on("click", closeNc);
      _("#btn-cancelar-nc").on("click", closeNc);

      _("#nc-modal-overlay").on("click", (e) => {
        if (e.target.id === "nc-modal-overlay") {
          closeNc();
        }
      });

      _("#btn-guardar-nc").on("click", () => {
        if (guardarCliente()) {
          closeNc();
        }
      });
    }, 10);
  }

  function guardarCliente() {
    const idVal = _("#nc-client-id").val();
    const nombre = _("#nc-nombre").val();
    const email = _("#nc-email").val();
    const limite = parseInt(_("#nc-limite").val() || "1", 10);
    const theme = _("#nc-theme").val();

    if (!nombre || !email) {
      alert("Por favor completa el nombre y el correo para continuar.");
      return false;
    }

    const initials = nombre.substring(0, 2).toUpperCase();

    if (idVal) {
      // Editar
      const clientIndex = clientes.findIndex(c => c.id === parseInt(idVal, 10));
      if (clientIndex !== -1) {
        clientes[clientIndex].nombre = nombre;
        clientes[clientIndex].email = email;
        clientes[clientIndex].limite = limite;
        clientes[clientIndex].theme = theme;
        clientes[clientIndex].initials = initials;
      }
    } else {
      // Nuevo
      clientes.unshift({
        id: Date.now(),
        nombre,
        email,
        estado: "activo",
        pantallas: 0,
        limite,
        storage: "0 MB",
        initials,
        theme,
      });
    }

    // Re-renderizamos la tabla principal que está debajo
    open();
    return true;
  }

  return { open, editClient: openClientForm };
})();
