/**
 * Modal: Configuración (Temas, Cuenta, Planes - MySQL + PHP)
 * Abre con: ConfiguracionModal.open()
 */
const ConfiguracionModal = (() => {
  let localPlans = [];

  function open() {
    const isAdmin = window.currentUser && window.currentUser.rol === 'admin';
    
    Modal.open({
      title: "Configuración",
      size: isAdmin ? "lg" : "md",
      content: `
        <div style="padding: 40px; text-align: center;">
            <i class="lexx lexx_sync lexx-spin" style="font-size: 32px; color: var(--accent);"></i>
            <p style="margin-top: 15px; color: #64748b;">Cargando configuraciones...</p>
        </div>
      `,
      actions: [],
    });

    const campaignsPromise = fetch('../api/campanas.php').then(res => res.json());
    const planesPromise = fetch('../api/planes.php').then(res => res.json());

    Promise.all([campaignsPromise, planesPromise])
      .then(([campData, planData]) => {
        if (campData.success && planData.success) {
          const campaigns = campData.campanas || [];
          const plans = planData.planes || [];
          Modal.setContent(getHtml(campaigns, plans));
          initTabs();
          if (isAdmin) {
            renderPlansTable(plans);
          }
        } else {
          Modal.setContent('<div style="padding:20px; text-align:center;">Error al cargar datos de configuración.</div>');
        }
      })
      .catch(err => {
        console.error(err);
        Modal.setContent('<div style="padding:20px; text-align:center;">Error de red al cargar configuración.</div>');
      });
  }

  function getHtml(campaigns, plans) {
    let totalFiles = 0;
    let lastFileName = "Ninguno";
    let lastFileDate = "Sin actividad";
    let todayUploads = 0;

    campaigns.forEach((c) => {
      if (c.archivos && c.archivos.length > 0) {
        totalFiles += c.archivos.length;
        const last = c.archivos[c.archivos.length - 1];
        lastFileName = last.name;
        lastFileDate = "Reciente";
        todayUploads += c.archivos.length;
      }
    });

    const userPlan = window.currentUser && window.currentUser.rol === 'admin' ? 'Premium' : 'Básico';
    const planLimits = {
      Básico: 5,
      Negocio: 15,
      Premium: 50,
    };
    const currentLimit = planLimits[userPlan] || 5;
    const percentage = Math.min(
      Math.round((totalFiles / currentLimit) * 100),
      100,
    );

    let barColorClass = "success";
    if (totalFiles >= currentLimit) {
      barColorClass = "danger";
    } else if (totalFiles === currentLimit - 1) {
      barColorClass = "warning";
    }

    const userName = window.currentUser ? window.currentUser.nombre : 'Usuario PantallaYA';
    const userEmail = window.currentUser ? window.currentUser.email : 'usuario@ejemplo.com';
    const isAdmin = window.currentUser && window.currentUser.rol === 'admin';

    return `
        <div class="config-modal-wrapper">
            
            <!-- Tabs Navigation -->
            <div class="config-tabs-nav">
                <div class="config-tab-indicator"></div>
                <button class="config-tab-btn active" data-tab="cuenta">
                    Cuenta
                </button>
                <button class="config-tab-btn" data-tab="estadisticas">
                    Estadísticas
                </button>
                ${isAdmin ? `
                <button class="config-tab-btn" data-tab="planes">
                    Planes de Pago
                </button>
                ` : ''}
            </div>

            <div class="config-tabs-content">
                <!-- Tab: Cuenta -->
                <div class="config-tab-pane active" id="tab-cuenta">
                    <h3 class="config-section-title">Información de Cuenta</h3>
                    <p class="config-section-desc">Gestiona tus datos personales y preferencias de seguridad.</p>
                    <div class="account-info-box">
                        <div class="info-row">
                            <span class="info-label">Nombre</span>
                            <span class="info-value">${userName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Correo</span>
                            <span class="info-value">${userEmail}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Plan Actual</span>
                            <span class="info-value plan-badge">${userPlan}</span>
                        </div>
                    </div>

                    <div class="config-danger-zone">
                        <div class="danger-actions">
                            <button class="config-btn-danger outline" onclick="window.logout()">
                                <i class="lexx lexx_sign_out"></i> Cerrar sesión
                            </button>
                            <button class="config-btn-danger" onclick="ConfiguracionModal.deleteAccount()">
                                <i class="lexx lexx_delete"></i> Eliminar cuenta
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tab: Estadísticas -->
                <div class="config-tab-pane" id="tab-estadisticas">
                    <h3 class="config-section-title">Resumen de Uso</h3>
                    <p class="config-section-desc">Actividad reciente de tu cuenta y almacenamiento.</p>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="lexx lexx_folder_open"></i></div>
                            <div class="stat-details">
                                <span class="stat-title">Última imagen</span>
                                <span class="stat-val text-ellipsis">${lastFileName}</span>
                                <span class="stat-sub">${lastFileDate}</span>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-icon clock"><i class="lexx lexx_clock"></i></div>
                            <div class="stat-details">
                                <span class="stat-title">Actividad Reciente</span>
                                <span class="stat-val">Has subido ${todayUploads} archivos</span>
                            </div>
                        </div>

                        <div class="stat-card storage">
                            <div class="stat-details full-width">
                                <div class="storage-header">
                                    <span class="stat-title">Imágenes subidas (${userPlan})</span>
                                    <span class="stat-val highlight ${barColorClass}">${totalFiles} / ${currentLimit}</span>
                                </div>
                                <div class="storage-bar">
                                    <div class="storage-fill ${barColorClass}" data-percent="${percentage}" style="width: 0%;"></div>
                                </div>
                                ${percentage >= 85 ? `<p class="storage-warning"><i class="lexx lexx_info_outline"></i> Estás cerca del límite de tu plan.</p>` : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Planes (Admin Only) -->
                ${isAdmin ? `
                <div class="config-tab-pane" id="tab-planes">
                    <h3 class="config-section-title">Configuración de Planes</h3>
                    <p class="config-section-desc">Gestiona los precios, límites y características de los planes mostrados en la landing.</p>
                    
                    <div style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
                        <button class="crm-btn-primary" onclick="ConfiguracionModal.openPlanForm()" style="display:flex; align-items:center; gap:6px;">
                            <i class="lexx lexx_plus"></i> Nuevo Plan
                        </button>
                    </div>
                    
                    <div class="crm-table-container">
                        <table class="crm-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Plan</th>
                                    <th>Precio</th>
                                    <th>Pantallas</th>
                                    <th>Destacado</th>
                                    <th class="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="config-planes-table-body">
                                <!-- Planes dinámicos -->
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

            </div>
        </div>`;
  }

  function renderPlansTable(plans) {
    localPlans = plans;
    const body = document.getElementById("config-planes-table-body");
    if (!body) return;
    
    if (plans.length === 0) {
      body.innerHTML = '<tr><td colspan="5" class="empty-row" style="text-align:center; padding:20px;">No hay planes configurados.</td></tr>';
      return;
    }
    
    body.innerHTML = plans.map(p => {
      const priceFormatted = '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(p.precio) + ' COP/' + p.periodo;
      const popularBadge = p.popular === 1 ? '<span class="crm-badge badge-success">Sí</span>' : '<span class="crm-badge badge-danger" style="background:#f1f5f9; color:#64748b;">No</span>';
      
      return `
        <tr class="crm-row">
          <td><strong style="color:var(--text-dark);">${p.nombre}</strong></td>
          <td>${priceFormatted}</td>
          <td>${p.limite_pantallas} pantallas</td>
          <td>${popularBadge}</td>
          <td class="text-right">
            <div class="crm-actions">
              <button class="crm-btn-icon" title="Editar Plan" onclick="ConfiguracionModal.openPlanForm(${p.id})">
                <i class="lexx lexx_edit"></i>
              </button>
              <button class="crm-btn-icon text-danger" title="Eliminar Plan" onclick="ConfiguracionModal.deletePlan(${p.id}, '${p.nombre}')" style="margin-left: 6px;">
                <i class="lexx lexx_delete"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function initTabs() {
    const indicator = _(".config-tab-indicator");
    const btns = _(".config-tab-btn");
    const panes = _(".config-tab-pane");

    function moveIndicator(btnObj) {
      if (!indicator || !indicator.Obj || !indicator.Obj[0]) return;
      indicator.css("width", btnObj.offsetWidth + "px");
      indicator.css("left", btnObj.offsetLeft + "px");
    }

    btns.each(function (idx, btn) {
      _(btn).on("click", () => {
        btns.removeClass("active");
        panes.removeClass("active");

        _(btn).addClass("active");
        const tab = _(btn).attr("data-tab");
        _("#tab-" + tab).addClass("active");

        moveIndicator(btn);

        if (tab === "estadisticas") {
          setTimeout(animateStorageBar, 150);
        }
      });
    });

    const activeBtn = _(".config-tab-btn.active");
    if (activeBtn && activeBtn.Obj && activeBtn.Obj[0]) {
      const btnObj = activeBtn.Obj[0];
      setTimeout(() => moveIndicator(btnObj), 10);

      if (_(btnObj).attr("data-tab") === "estadisticas") {
        setTimeout(animateStorageBar, 300);
      }
    }
  }

  function animateStorageBar() {
    setTimeout(() => {
      const modal = document.querySelector(".config-modal-wrapper");
      const fill = modal ? modal.querySelector(".storage-fill") : null;

      if (fill) {
        const p = fill.getAttribute("data-percent") || "0";
        fill.style.setProperty("width", p + "%", "important");
      }
    }, 500);
  }

  function openPlanForm(planId = null) {
    let planData = null;
    if (planId) {
      planData = localPlans.find(p => p.id === planId);
    }
    
    const titleText = planData ? "Editar Plan" : "Nuevo Plan";
    const featuresStr = planData && Array.isArray(planData.caracteristicas) 
      ? planData.caracteristicas.join("\n") 
      : "";
      
    const html = `
      <div id="plan-modal-overlay" class="modal-overlay modal-overlay-top">
        <div class="modal-box" data-size="md">
          <div class="modal-header">
            <h2 class="modal-title">${titleText}</h2>
            <button class="modal-close" id="btn-cerrar-plan-top"><i class="lexx lexx_times"></i></button>
          </div>
          <div class="modal-body">
            <div class="wz-wrap wz-wrap-flat">
              <div class="wz-content-container wz-content-auto">
                <div class="wz-content active">
                  <div class="wz-form">
                    <input type="hidden" id="p-plan-id" value="${planData ? planData.id : ""}">
                    <div class="wz-row wz-row--full">
                      <label class="wz-label">Nombre del Plan <span class="wz-req">*</span></label>
                      <input type="text" id="p-nombre" class="wz-input" placeholder="Ej. Plan Negocio" value="${planData ? planData.nombre : ""}">
                    </div>
                    <div class="wz-row">
                      <label class="wz-label">Precio ($ COP) <span class="wz-req">*</span></label>
                      <input type="number" id="p-precio" class="wz-input" placeholder="Ej. 99000" value="${planData ? planData.precio : ""}">
                    </div>
                    <div class="wz-row">
                      <label class="wz-label">Período de Facturación</label>
                      <select id="p-periodo" class="wz-input">
                        <option value="mes" ${planData && planData.periodo === 'mes' ? 'selected' : ''}>Mensual</option>
                        <option value="año" ${planData && planData.periodo === 'año' ? 'selected' : ''}>Anual</option>
                        <option value="único" ${planData && planData.periodo === 'único' ? 'selected' : ''}>Pago Único</option>
                      </select>
                    </div>
                    <div class="wz-row">
                      <label class="wz-label">Límite de Pantallas <span class="wz-req">*</span></label>
                      <input type="number" id="p-limite" class="wz-input" placeholder="Ej. 3" min="1" value="${planData ? planData.limite_pantallas : "5"}">
                    </div>
                    <div class="wz-row">
                      <label class="wz-label">¿Plan Recomendado / Destacado?</label>
                      <select id="p-popular" class="wz-input">
                        <option value="0" ${planData && planData.popular === 0 ? 'selected' : ''}>No</option>
                        <option value="1" ${planData && planData.popular === 1 ? 'selected' : ''}>Sí (Más Popular)</option>
                      </select>
                    </div>
                    <div class="wz-row wz-row--full">
                      <label class="wz-label">Características (una por línea) <span class="wz-req">*</span></label>
                      <textarea id="p-features" class="wz-input wz-textarea" placeholder="Hasta 3 anuncios rotativos&#10;Presencia en 3 edificios cercanos" style="min-height: 100px;">${featuresStr}</textarea>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="wz-footer wz-footer-clean">
                <button id="btn-cancelar-plan-form" class="modal-btn modal-btn--secondary">Cancelar</button>
                <div class="flex-spacer"></div>
                <button id="btn-guardar-plan-form" class="modal-btn modal-btn--primary">
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
      _("#plan-modal-overlay").addClass("active");

      const closePlanForm = () => {
        _("#plan-modal-overlay").removeClass("active");
        setTimeout(() => _("#plan-modal-overlay").remove(), 300);
      };

      _("#btn-cerrar-plan-top").on("click", closePlanForm);
      _("#btn-cancelar-plan-form").on("click", closePlanForm);

      _("#plan-modal-overlay").on("click", (e) => {
        if (e.target.id === "plan-modal-overlay") {
          closePlanForm();
        }
      });

      _("#btn-guardar-plan-form").on("click", () => {
        guardarPlan(closePlanForm);
      });
    }, 10);
  }

  function guardarPlan(callback) {
    const idVal = document.getElementById("p-plan-id") ? document.getElementById("p-plan-id").value : "";
    const nombre = document.getElementById("p-nombre") ? document.getElementById("p-nombre").value.trim() : "";
    const precio = document.getElementById("p-precio") ? parseFloat(document.getElementById("p-precio").value) : NaN;
    const periodo = document.getElementById("p-periodo") ? document.getElementById("p-periodo").value : "mes";
    const limite = document.getElementById("p-limite") ? parseInt(document.getElementById("p-limite").value || "5", 10) : 5;
    const popular = document.getElementById("p-popular") ? parseInt(document.getElementById("p-popular").value || "0", 10) : 0;
    const featuresText = document.getElementById("p-features") ? document.getElementById("p-features").value.trim() : "";

    if (!nombre || isNaN(precio) || !featuresText) {
      alert("Por favor completa el nombre, precio y las características.", "Error");
      return;
    }

    const featuresArray = featuresText.split("\n").map(f => f.trim()).filter(f => f.length > 0);

    const payload = {
      id: idVal || null,
      nombre,
      precio,
      periodo,
      limite_pantallas: limite,
      popular,
      caracteristicas: featuresArray
    };

    const isEdit = !!idVal;
    fetch('../api/planes.php', {
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
        alert(data.message || "Plan guardado con éxito.", "Ok");
        if (callback) callback();
        open();
      } else {
        alert(data.message || "Error al guardar el plan.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de conexión al guardar el plan.", "Error");
    });
  }

  function deletePlan(id, name) {
    if (!confirm(`¿Estás seguro de eliminar el plan "${name}"? Esta acción no se puede deshacer.`)) return;

    fetch(`../api/planes.php?action=delete&id=${id}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Plan eliminado correctamente.", "Ok");
        open();
      } else {
        alert(data.message || "Error al eliminar el plan.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de red al eliminar el plan.", "Error");
    });
  }

  function deleteAccount() {
    if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      fetch('../api/auth.php?action=logout')
        .then(() => {
          alert("Cuenta eliminada correctamente.");
          window.location.href = "../index.html";
        });
    }
  }

  return { open, deleteAccount, openPlanForm, deletePlan };
})();
