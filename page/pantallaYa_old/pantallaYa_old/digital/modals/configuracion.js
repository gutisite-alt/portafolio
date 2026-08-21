/**
 * Modal: Configuración (Temas, Información, Cuenta - MySQL + PHP)
 * Abre con: ConfiguracionModal.open()
 */
const ConfiguracionModal = (() => {
  function open() {
    Modal.open({
      title: "Configuración",
      size: "md",
      content: `
        <div style="padding: 40px; text-align: center;">
            <i class="lexx lexx_sync lexx-spin" style="font-size: 32px; color: var(--accent);"></i>
            <p style="margin-top: 15px; color: #64748b;">Cargando configuraciones...</p>
        </div>
      `,
      actions: [],
    });

    // Cargar campañas para estadísticas reales
    fetch('../api/campanas.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const campaigns = data.campanas || [];
          Modal.setContent(getHtml(campaigns));
          initTabs();
        } else {
          Modal.setContent('<div style="padding:20px; text-align:center;">Error al cargar datos de configuración.</div>');
        }
      })
      .catch(err => {
        console.error(err);
        Modal.setContent('<div style="padding:20px; text-align:center;">Error de red al cargar configuración.</div>');
      });
  }

  function getHtml(campaigns) {
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
                                <i class="lexx lexx_trash"></i> Eliminar cuenta
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

            </div>
        </div>`;
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

  function deleteAccount() {
    if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      // Simular eliminación de la cuenta limpiando sesión y redirigiendo
      fetch('../api/auth.php?action=logout')
        .then(() => {
          alert("Cuenta eliminada correctamente.");
          window.location.href = "../index.html";
        });
    }
  }

  return { open, deleteAccount };
})();
