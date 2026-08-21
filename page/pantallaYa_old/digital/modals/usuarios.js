/**
 * Modal: Gestión de Clientes / Usuarios (Conexión Real con MySQL + PHP)
 */
const UsuariosModal = (() => {
  let clientes = [];

  function open() {
    Modal.open({
      title: "Gestión de Clientes",
      size: "xl",
      content: `
        <div style="padding: 40px; text-align: center;">
            <i class="lexx lexx_sync lexx-spin" style="font-size: 32px; color: var(--accent);"></i>
            <p style="margin-top: 15px; color: #64748b;">Cargando listado de clientes...</p>
        </div>
      `,
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

    cargarClientes();
  }

  function cargarClientes() {
    fetch('../api/usuarios.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          clientes = data.clientes || [];
          Modal.setContent(getHtml());
          initEvents();
        } else {
          Modal.setContent(`<div style="padding: 20px; text-align: center; color: var(--danger);">${data.message || 'Error al cargar clientes.'}</div>`);
        }
      })
      .catch(err => {
        console.error(err);
        Modal.setContent('<div style="padding: 20px; text-align: center; color: var(--danger);">Error de conexión al cargar clientes.</div>');
      });
  }

  function getHtml() {
    // Calcular estadísticas reales en tiempo real
    const activosCount = clientes.filter(c => c.estado === 'activo').length;
    
    let totalPantallas = 0;
    let totalLimite = 0;
    clientes.forEach(c => {
      totalPantallas += parseInt(c.pantallas || 0, 10);
      totalLimite += parseInt(c.limite || 5, 10);
    });

    // Calcular almacenamiento total sumando los bytes y formateándolo
    let totalBytes = 0;
    clientes.forEach(c => {
      // Intentamos estimar el almacenamiento en base al string retornado o calculando
      const storageStr = c.storage || '0 B';
      const value = parseFloat(storageStr);
      if (storageStr.includes('GB')) {
        totalBytes += value * 1073741824;
      } else if (storageStr.includes('MB')) {
        totalBytes += value * 1048576;
      } else if (storageStr.includes('KB')) {
        totalBytes += value * 1024;
      } else {
        totalBytes += value;
      }
    });

    let totalStorageFormatted = '0 B';
    if (totalBytes >= 1073741824) {
      totalStorageFormatted = (totalBytes / 1073741824).toFixed(1) + ' GB';
    } else if (totalBytes >= 1048576) {
      totalStorageFormatted = (totalBytes / 1048576).toFixed(1) + ' MB';
    } else if (totalBytes >= 1024) {
      totalStorageFormatted = (totalBytes / 1024).toFixed(1) + ' KB';
    } else {
      totalStorageFormatted = totalBytes + ' B';
    }

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
              <span class="stat-value">${activosCount}</span>
              <span class="stat-label">Clientes Activos</span>
            </div>
          </div>
          <div class="crm-stat-card">
            <div class="stat-icon icon-green"><i class="lexx lexx_devices"></i></div>
            <div class="stat-info">
              <span class="stat-value">${totalPantallas} / ${totalLimite}</span>
              <span class="stat-label">Pantallas en Uso</span>
            </div>
          </div>
          <div class="crm-stat-card">
            <div class="stat-icon icon-amber"><i class="lexx lexx_folder"></i></div>
            <div class="stat-info">
              <span class="stat-value">${totalStorageFormatted}</span>
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
            <div class="crm-avatar avatar-${c.theme || 'blue'}">
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
            <div class="screens-text"><b>${c.pantallas || 0}</b> de ${c.limite}</div>
            <div class="screens-progress">
              <div class="screens-fill ${parseInt(c.pantallas || 0, 10) >= parseInt(c.limite, 10) ? "fill-danger" : "fill-primary"}" style="width: ${Math.min((parseInt(c.pantallas || 0, 10) / parseInt(c.limite, 10)) * 100, 100)}%;"></div>
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
            <button class="crm-btn-icon ${c.estado === 'activo' ? 'text-danger' : 'text-success'}" title="${c.estado === 'activo' ? 'Suspender' : 'Reactivar'}" onclick="UsuariosModal.toggleStatus(${c.id}, '${c.nombre}')">
              <i class="lexx ${c.estado === 'activo' ? 'lexx_circle_times' : 'lexx_check_circle'}"></i>
            </button>
            <button class="crm-btn-icon text-danger" title="Eliminar Cliente" onclick="UsuariosModal.deleteClient(${c.id}, '${c.nombre}')" style="margin-left: 6px;">
              <i class="lexx lexx_delete"></i>
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

    const existingOverlay = _("#nc-modal-overlay");
    if (existingOverlay && existingOverlay.length > 0) {
      _("#nc-modal-overlay .modal-title").text(titleText);
      _("#nc-client-id").val(clientData ? clientData.id : "");
      _("#nc-nombre").val(clientData ? clientData.nombre : "");
      _("#nc-email").val(clientData ? clientData.email : "");
      _("#nc-limite").val(clientData ? clientData.limite : "5");
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
                      <input type="number" id="nc-limite" class="wz-input" placeholder="Ej. 5" min="1" value="${clientData ? clientData.limite : "5"}">
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
        setTimeout(() => _("#nc-modal-overlay").remove(), 300);
      };

      _("#btn-cerrar-nc-top").on("click", closeNc);
      _("#btn-cancelar-nc").on("click", closeNc);

      _("#nc-modal-overlay").on("click", (e) => {
        if (e.target.id === "nc-modal-overlay") {
          closeNc();
        }
      });

      _("#btn-guardar-nc").on("click", () => {
        guardarCliente(closeNc);
      });
    }, 10);
  }

  function guardarCliente(callback) {
    const idVal = document.getElementById("nc-client-id") ? document.getElementById("nc-client-id").value : "";
    const nombre = document.getElementById("nc-nombre") ? document.getElementById("nc-nombre").value.trim() : "";
    const email = document.getElementById("nc-email") ? document.getElementById("nc-email").value.trim() : "";
    const limite = document.getElementById("nc-limite") ? parseInt(document.getElementById("nc-limite").value || "5", 10) : 5;
    const theme = document.getElementById("nc-theme") ? document.getElementById("nc-theme").value : "blue";

    if (!nombre || !email) {
      alert("Por favor completa el nombre y el correo para continuar.", "Error");
      return;
    }

    const payload = {
      id: idVal || null,
      nombre: nombre,
      email: email,
      limite: limite,
      theme: theme
    };

    const isEdit = !!idVal;
    const url = '../api/usuarios.php';

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isEdit ? 'update' : 'create',
        ...payload
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message || "Cliente guardado con éxito.", "Ok");
        if (callback) callback();
        // Recargar la tabla
        cargarClientes();
      } else {
        alert(data.message || "Error al guardar el cliente.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de conexión al guardar el cliente.", "Error");
    });
  }

  function toggleStatus(id, name) {
    if (!confirm(`¿Estás seguro de cambiar el estado de ${name}?`)) return;

    fetch('../api/usuarios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle_status',
        id: id
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        cargarClientes();
      } else {
        alert(data.message || "Error al actualizar estado.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de red al actualizar estado.", "Error");
    });
  }

  function deleteClient(id, name) {
    if (!confirm(`¿Estás seguro de eliminar permanentemente al cliente "${name}" y todos sus archivos asociados? Esta acción no se puede deshacer.`)) return;

    fetch(`../api/usuarios.php?action=delete&id=${id}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Cliente eliminado con éxito.", "Ok");
        cargarClientes();
      } else {
        alert(data.message || "Error al eliminar cliente.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de red al eliminar cliente.", "Error");
    });
  }

  return { open, editClient: openClientForm, toggleStatus, deleteClient };
})();
