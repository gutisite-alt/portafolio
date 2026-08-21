/**
 * Modal: Biblioteca de Medios (Versión MySQL + PHP)
 * Abre con: BibliotecaModal.open()
 */
const BibliotecaModal = (() => {
  function open() {
    Modal.open({
      title: "Biblioteca de Medios",
      size: "xl",
      content: `
        <div style="padding: 40px; text-align: center;">
            <i class="lexx lexx_sync lexx-spin" style="font-size: 32px; color: var(--accent);"></i>
            <p style="margin-top: 15px; color: #64748b;">Cargando biblioteca de medios...</p>
        </div>
      `,
      actions: [{ label: "Cerrar", onClick: Modal.close }],
    });

    if (typeof _ !== "undefined") {
      _(".tree-leaf").removeClass("active");
      _(".tree-leaf").each(function (idx, el) {
        if (_(el).text().includes("Biblioteca")) {
          _(el).addClass("active");
        }
      });
    }

    // Cargar campañas y archivos reales
    fetch('../api/campanas.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const campaigns = data.campanas || [];
          Modal.setContent(getHtml(campaigns));
          initTabs();
        } else {
          Modal.setContent(`
            <div class="biblioteca-empty-state">
                <h3 class="biblioteca-empty-title">Error</h3>
                <p class="biblioteca-empty-desc">${data.message || 'No se pudo cargar la biblioteca.'}</p>
            </div>
          `);
        }
      })
      .catch(err => {
        console.error(err);
        Modal.setContent(`
          <div class="biblioteca-empty-state">
              <h3 class="biblioteca-empty-title">Error de Conexión</h3>
              <p class="biblioteca-empty-desc">No fue posible conectar con el servidor.</p>
          </div>
        `);
      });
  }

  function getHtml(campaigns) {
    let images = [];
    let videos = [];

    // Extraer todos los archivos de todas las campañas
    campaigns.forEach((c) => {
      if (c.archivos) {
        c.archivos.forEach((f) => {
          if (f.type === "video") {
            videos.push(f);
          } else {
            images.push(f);
          }
        });
      }
    });

    const renderGrid = (items, emptyMsg) => {
      if (items.length === 0) {
        return `
          <div class="biblioteca-empty-state">
            <i class="lexx lexx_folder_open biblioteca-empty-icon"></i>
            <h3 class="biblioteca-empty-title">Vacío</h3>
            <p class="biblioteca-empty-desc">${emptyMsg}</p>
          </div>
        `;
      }

      let html = `<div class="biblioteca-masonry">`;
      items.forEach((item) => {
        // Prepend ../ a la ruta de uploads
        const fileUrl = '../' + item.url;

        const mediaHtml =
          item.type === "video"
            ? `<video src="${fileUrl}" class="biblioteca-media" muted></video>`
            : `<img src="${fileUrl}" class="biblioteca-media">`;

        const sizeMb = item.size
          ? (item.size / 1024 / 1024).toFixed(2) + " MB"
          : "Desconocido";

        html += `
          <div class="biblioteca-item">
            <div class="biblioteca-media-wrap">
              ${mediaHtml}
              ${item.type === "video" ? `<i class="lexx lexx_play biblioteca-play-icon"></i>` : ""}
            </div>
            <div class="biblioteca-info-wrap">
                <div class="biblioteca-item-title" title="${item.name}">${item.name}</div>
                <div class="biblioteca-item-size">${sizeMb}</div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      return html;
    };

    return `
      <div class="config-modal-wrapper">
          
          <!-- Header: Tabs & Search -->
          <div class="biblioteca-header-row">
              <div class="config-tabs-nav compact">
                  <div class="config-tab-indicator"></div>
                  <button class="config-tab-btn compact active" data-tab="imagenes">
                      <i class="lexx lexx_image"></i> Imágenes <span class="tab-badge">${images.length}</span>
                  </button>
                  <button class="config-tab-btn compact" data-tab="videos">
                      <i class="lexx lexx_video"></i> Videos <span class="tab-badge">${videos.length}</span>
                  </button>
              </div>
              
              <div class="biblioteca-search">
                  <i class="lexx lexx_search"></i>
                  <input type="text" id="biblioteca-search-input" placeholder="Buscar por nombre..." autocomplete="off">
              </div>
          </div>

          <div class="config-tabs-content">
              <!-- Tab: Imágenes -->
              <div class="config-tab-pane active" id="tab-imagenes">
                  ${renderGrid(images, "Aún no has subido ninguna imagen a tus campañas.")}
              </div>

              <!-- Tab: Videos -->
              <div class="config-tab-pane" id="tab-videos">
                  ${renderGrid(videos, "Aún no has subido ningún video a tus campañas.")}
              </div>
          </div>
      </div>
    `;
  }

  function initTabs() {
    const wrapper = _(".config-modal-wrapper");
    if (!wrapper || !wrapper.Obj || wrapper.Obj.length === 0) return;

    const indicator = wrapper.find(".config-tab-indicator");
    const btns = wrapper.find(".config-tab-btn");
    const panes = wrapper.find(".config-tab-pane");

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
        const tabId = _(btn).attr("data-tab");
        _("#tab-" + tabId).addClass("active");

        moveIndicator(btn);
      });
    });

    const activeBtn = wrapper.find(".config-tab-btn.active");
    if (activeBtn && activeBtn.Obj && activeBtn.Obj[0]) {
      const updateInd = () => {
        const currentActive = wrapper.find(".config-tab-btn.active");
        if (currentActive && currentActive.Obj && currentActive.Obj[0]) {
          moveIndicator(currentActive.Obj[0]);
        }
      };

      setTimeout(updateInd, 50);
      setTimeout(updateInd, 300);
      window.addEventListener("resize", updateInd);
    }

    const searchInput = wrapper.find("#biblioteca-search-input");
    if (searchInput && searchInput.Obj && searchInput.Obj[0]) {
      searchInput.on("input", function (e) {
        const query = e.target.value.toLowerCase().trim();
        const items = wrapper.find(".biblioteca-item");

        if (items && items.length > 0) {
          items.each(function (idx, item) {
            const titleEl = item.querySelector(".biblioteca-item-title");
            if (titleEl) {
              const title = titleEl.textContent.toLowerCase();
              if (title.includes(query)) {
                item.style.display = "flex";
              } else {
                item.style.display = "none";
              }
            }
          });
        }
      });
    }

    const videoWraps = wrapper.find(".biblioteca-media-wrap");
    if (videoWraps && videoWraps.length > 0) {
      videoWraps.each(function (idx, wrap) {
        const video = wrap.querySelector("video");
        const playIcon = wrap.querySelector(".biblioteca-play-icon");

        if (video && playIcon) {
          wrap.style.cursor = "pointer";

          wrap.addEventListener("click", function (e) {
            if (e.target === video && video.controls) return;

            if (video.paused) {
              video.controls = true;
              video.play();
              playIcon.style.display = "none";
            } else {
              video.pause();
            }
          });

          video.addEventListener("pause", function () {
            playIcon.style.display = "flex";
            video.controls = false;
          });
        }
      });
    }
  }

  return { open };
})();
