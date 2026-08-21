/**
 * Modal: Compartir y Opciones (Versión MySQL + PHP)
 */
const CompartirModal = (() => {
  function open() {
    Modal.open({
      title: "Compartir y Opciones",
      size: "md",
      content: `
      <div class="wz-wrap skeleton-loading">
          <style>
            @keyframes skeletonShimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .sk-item {
              background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
              background-size: 400% 100%;
              animation: skeletonShimmer 1.4s ease infinite;
              border-radius: 6px;
            }
            .sk-title {
              height: 24px;
              width: 180px;
              margin-bottom: 8px;
            }
            .sk-subtitle {
              height: 14px;
              width: 90%;
              margin-bottom: 24px;
            }
            .sk-label {
              height: 14px;
              width: 120px;
              margin-bottom: 8px;
            }
            .sk-dropdown {
              height: 46px;
              width: 100%;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .sk-input-group {
              display: flex;
              gap: 8px;
              margin-bottom: 12px;
            }
            .sk-input {
              height: 46px;
              flex-grow: 1;
              border-radius: 8px;
            }
            .sk-btn-icon {
              height: 46px;
              width: 46px;
              border-radius: 8px;
            }
            .sk-hint {
              height: 12px;
              width: 80%;
              margin-bottom: 24px;
            }
            .sk-actions {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 12px;
              margin-top: 12px;
            }
            .sk-btn {
              height: 44px;
              border-radius: 10px;
            }
          </style>

          <div class="img-camp-header">
              <div class="sk-item sk-title"></div>
              <div class="sk-item sk-subtitle"></div>
          </div>

          <div class="share-section" style="margin-top: 10px;">
              <div class="sk-item sk-label"></div>
              <div class="sk-item sk-dropdown"></div>
          </div>

          <div class="share-url-box" style="margin-top: 10px;">
              <div class="sk-item sk-label"></div>
              <div class="sk-input-group">
                  <div class="sk-item sk-input"></div>
                  <div class="sk-item sk-btn-icon"></div>
              </div>
              <div class="sk-item sk-hint"></div>
          </div>

          <div class="sk-actions">
              <div class="sk-item sk-btn"></div>
              <div class="sk-item sk-btn"></div>
              <div class="sk-item sk-btn"></div>
          </div>
      </div>
      `,
      actions: [{ label: "Cerrar", onClick: Modal.close }],
    });

    // Cargar campañas desde la base de datos
    fetch('../api/campanas.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const campaigns = data.campanas || [];
          Modal.setContent(getHtml(campaigns));
          bindEvents(campaigns);
        } else {
          Modal.setContent('<div style="padding:20px; text-align:center;">Error al cargar campañas.</div>');
        }
      })
      .catch(err => {
        console.error(err);
        Modal.setContent('<div style="padding:20px; text-align:center;">Error de red al cargar opciones.</div>');
      });
  }

  function getHtml(campaigns) {
    if (campaigns.length === 0) {
      return `
        <div class="img-camp-empty share-empty-pad">
            <i class="lexx lexx_share img-camp-empty-icon"></i>
            <h3 class="img-camp-empty-title">No hay campañas disponibles</h3>
            <p class="img-camp-empty-desc">Crea una campaña y súbele contenido para poder compartirla.</p>
        </div>
      `;
    }

    let activeId =
      typeof SliderManager !== "undefined"
        ? SliderManager.activeCampaignId
        : null;

    let optionsHtml = "";
    let activeName = "Seleccione una campaña...";
    let initialUrl = "No hay URL disponible. Seleccione una campaña.";

    // Generar URL absoluta dinámica basada en la ubicación actual
    const getTabletAbsoluteUrl = (id) => {
      const origin = window.location.origin;
      const path = window.location.pathname.replace('digital/index.html', 'tablet/index.html');
      return `${origin}${path}?camp=${id}`;
    };

    if (activeId) {
      const activeCamp = campaigns.find(
        (c) => String(c.id) === String(activeId),
      );
      if (activeCamp) {
        activeName = `${activeCamp.nombre} (${activeCamp.edificio || "Sin edificio"})`;
        initialUrl = getTabletAbsoluteUrl(activeId);
      }
    }

    campaigns.forEach((c) => {
      const isSelected = String(c.id) === String(activeId);
      const displayName = `${c.nombre} (${c.edificio || "Sin edificio"})`;
      const selectedClass = isSelected ? "selected" : "";

      optionsHtml += `
        <div class="share-dropdown-item ${selectedClass}" data-value="${c.id}" data-name="${displayName}">
            ${displayName}
        </div>
      `;
    });

    return `
      <div class="wz-wrap">
          <div class="img-camp-header">
              <h3 class="img-camp-header-title">Difusión de Campaña</h3>
              <p class="img-camp-header-desc">Obtén el enlace para las tablets o presenta el simulador a pantalla completa.</p>
          </div>

          <div class="share-section">
              <label class="wz-label">Selecciona la Campaña</label>
              <div class="share-dropdown-wrap" id="share-campaign-dropdown">
                  <div class="share-dropdown-trigger">
                      <i class="lexx lexx_folder_outline share-icon-left"></i>
                      <div class="share-select-box">
                          <span class="share-selected-text">${activeName}</span>
                      </div>
                      <i class="lexx lexx_chevron_down share-icon-right"></i>
                  </div>
                  <div class="share-dropdown-menu">
                      ${optionsHtml}
                  </div>
                  <input type="hidden" id="share-campaign-value" value="${activeId || ""}">
              </div>
          </div>

          <div class="share-url-box">
              <label class="wz-label share-url-label">URL de Reproducción</label>
              <div class="share-url-input-wrap">
                  <input type="text" class="wz-input share-url-input" id="share-url" readonly value="${initialUrl}">
                  <button class="modal-btn btn-copy-url" id="btn-copy-url" title="Copiar URL">
                      <i class="lexx lexx_clipboard"></i>
                  </button>
              </div>
              <p class="share-url-hint">Configura esta URL en los navegadores Kiosk de las tablets en los edificios.</p>
          </div>

          <div class="share-actions">
              <button class="share-btn-premium btn-presentar-premium" id="btn-share-presentar">
                  <i class="lexx lexx_play"></i>
                  <span>Iniciar Presentación</span>
              </button>
              <button class="share-btn-premium btn-download-premium" id="btn-share-download">
                  <i class="lexx lexx_download"></i>
                  <span>Descargar ZIP</span>
              </button>
          </div>
      </div>
    `;
  }

  function bindEvents(campaigns) {
    const dropdownWrap = _("#share-campaign-dropdown");
    const trigger = _(".share-dropdown-trigger");
    const menu = _(".share-dropdown-menu");
    const hiddenInput = _("#share-campaign-value");
    const selectedText = _(".share-selected-text");
    const urlInput = _("#share-url");

    if (trigger && menu) {
      trigger.on("click", function (e) {
        e.stopPropagation();
        if (menu.hasClass("active")) {
          dropdownWrap.removeClass("active");
          menu.removeClass("active");
        } else {
          dropdownWrap.addClass("active");
          menu.addClass("active");
        }
      });

      _(document).on("click", function (e) {
        if (
          menu.hasClass("active") &&
          !e.target.closest("#share-campaign-dropdown")
        ) {
          dropdownWrap.removeClass("active");
          menu.removeClass("active");
        }
      });

      const items = _(".share-dropdown-item");
      if (items && items.length > 0) {
        items.each(function (idx, itemObj) {
          const item = _(itemObj);
          item.on("click", function () {
            const val = item.attr("data-value");
            const name = item.attr("data-name");

            const camp = campaigns.find((c) => String(c.id) === String(val));
            const hasFiles = camp && camp.archivos && camp.archivos.length > 0;

            if (!hasFiles) {
              alert("Aviso: Esta campaña no tiene elementos adjuntos aún.", "Alert");
              
              items.removeClass("selected");
              selectedText.text("Seleccione una campaña...");
              hiddenInput.val("");
              if (urlInput && urlInput.length > 0) {
                urlInput[0].value = "No hay URL disponible. Seleccione una campaña.";
              }

              dropdownWrap.removeClass("active");
              menu.removeClass("active");

              if (typeof SliderManager !== "undefined") {
                if (typeof SliderManager.clearSlides === "function") {
                  SliderManager.clearSlides();
                }
                SliderManager.activeCampaignId = null;
              }
              return;
            }

            items.removeClass("selected");
            item.addClass("selected");
            selectedText.text(name);

            hiddenInput.val(val);
            if (urlInput && urlInput.length > 0) {
              const origin = window.location.origin;
              const path = window.location.pathname.replace('digital/index.html', 'tablet/index.html');
              urlInput[0].value = `${origin}${path}?camp=${val}`;
            }

            dropdownWrap.removeClass("active");
            menu.removeClass("active");

            if (typeof SliderManager !== "undefined") {
              if (typeof SliderManager.clearSlides === "function") {
                SliderManager.clearSlides();
              }
              SliderManager.activeCampaignId = val;

              const today = new Date().toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              });

              camp.archivos.forEach((u) => {
                SliderManager.addSlide('../' + u.url, u.name, today, u.type);
              });
            }
          });
        });
      }
    }

    const btnCopy = _("#btn-copy-url");
    if (btnCopy) {
      btnCopy.on("click", function () {
        if (!hiddenInput || !hiddenInput.val()) {
          alert("Por favor seleccione una campaña primero.", "Error");
          return;
        }
        if (urlInput && urlInput.length > 0) {
          urlInput[0].select();
          document.execCommand("copy");
          const icon = _("#btn-copy-url i");
          icon.removeClass("lexx_clipboard").addClass("lexx_check_ok");
          btnCopy.addClass("success-color");

          alert("URL copiada al portapapeles exitosamente.", "Ok");

          setTimeout(() => {
            icon.removeClass("lexx_check_ok").addClass("lexx_clipboard");
            btnCopy.removeClass("success-color");
          }, 2000);
        }
      });
    }

    const btnPresentar = _("#btn-share-presentar");
    if (btnPresentar) {
      btnPresentar.on("click", function () {
        if (!hiddenInput || !hiddenInput.val()) {
          alert("Por favor seleccione una campaña primero.", "Error");
          return;
        }
        const tabletScreen = document.querySelector(".tablet-screen");
        if (tabletScreen) {
          tabletScreen.requestFullscreen().catch((e) => {
            alert("Tu navegador no soporta pantalla completa.", "Alert");
          });
        }
      });
    }

    const btnDownload = _("#btn-share-download");
    if (btnDownload) {
      btnDownload.on("click", function () {
        const campId = hiddenInput ? hiddenInput.val() : null;
        if (!campId) {
          alert("Por favor seleccione una campaña primero.", "Error");
          return;
        }

        const camp = campaigns.find((c) => String(c.id) === String(campId));
        if (!camp || !camp.archivos || camp.archivos.length === 0) {
          alert("Esta campaña no tiene archivos para descargar.", "Error");
          return;
        }

        btnDownload.html('<i class="lexx lexx_sync lexx-spin"></i><span>Empaquetando...</span>');
        btnDownload.addClass("btn-loading-opacity");

        // Iniciar la descarga del archivo ZIP generado por el backend PHP
        window.location.href = `../api/download_zip.php?camp=${campId}`;

        setTimeout(() => {
          btnDownload.html('<i class="lexx lexx_download"></i><span>Descargar ZIP</span>');
          btnDownload.removeClass("btn-loading-opacity");
        }, 2000);
      });
    }
  }

  return { open };
})();
