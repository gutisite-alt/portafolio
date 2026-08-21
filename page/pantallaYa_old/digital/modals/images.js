/**
 * Modal: Subir Contenido (Versión MySQL + PHP)
 */
const ImagenesModal = (() => {
  let currentUploads = [];

  function open() {
    Modal.open({
      title: "Subir Contenido",
      size: "md",
      content: `
        <div style="padding: 40px; text-align: center;">
            <i class="lexx lexx_sync lexx-spin" style="font-size: 32px; color: var(--accent);"></i>
            <p style="margin-top: 15px; color: #64748b;">Cargando tus campañas desde el servidor...</p>
        </div>
      `,
      actions: [{ label: "Cerrar", onClick: Modal.close }],
    });

    // Actualizar el estado activo en el menú lateral
    if (typeof _ !== "undefined") {
      _(".tree-leaf").removeClass("active");
      _(".tree-leaf").each(function (idx, el) {
        if (_(el).text().includes("Subir contenido")) {
          _(el).addClass("active");
        }
      });
    }

    // Cargar campañas desde la API
    fetch('../api/campanas.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const campaigns = data.campanas || [];
          Modal.setContent(getHtml(campaigns));
          bindEvents(campaigns);
        } else {
          Modal.setContent(`
            <div class="img-camp-empty">
                <i class="lexx lexx_warning img-camp-empty-icon" style="color: #ef4444;"></i>
                <h3 class="img-camp-empty-title">Error al cargar</h3>
                <p class="img-camp-empty-desc">${data.message || 'No se pudieron obtener las campañas.'}</p>
            </div>
          `);
        }
      })
      .catch(err => {
        console.error(err);
        Modal.setContent(`
          <div class="img-camp-empty">
              <i class="lexx lexx_warning img-camp-empty-icon" style="color: #ef4444;"></i>
              <h3 class="img-camp-empty-title">Error de Conexión</h3>
              <p class="img-camp-empty-desc">No fue posible conectar con el servidor.</p>
          </div>
        `);
      });
  }

  function getHtml(campaigns) {
    if (campaigns.length === 0) {
      return `
        <div class="img-camp-empty">
            <i class="lexx lexx_folder_open img-camp-empty-icon"></i>
            <h3 class="img-camp-empty-title">No hay campañas</h3>
            <p class="img-camp-empty-desc">Debes crear una campaña primero antes de subir contenido.</p>
        </div>
      `;
    }

    let html = `
      <div class="wz-wrap">
          <div class="img-camp-header">
              <h3 class="img-camp-header-title">Selecciona una campaña</h3>
              <p class="img-camp-header-desc">Elige a qué campaña deseas asociar el nuevo contenido.</p>
          </div>
          <div class="img-camp-list">
    `;

    campaigns.forEach((c) => {
      const hasFiles = c.archivos && c.archivos.length > 0;
      const playBtnHtml = hasFiles
        ? `
          <div class="img-camp-dropdown-item btn-play-camp" data-id="${c.id}">
              <i class="lexx lexx_play"></i> Ejecutar
          </div>
        `
        : "";

      html += `
        <div class="img-camp-card" data-id="${c.id}">
            <div class="img-camp-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <polygon points="10 11 15 13.5 10 16 10 11" fill="currentColor" stroke="none" opacity="0.8"></polygon>
                </svg>
            </div>
            <div class="img-camp-info">
                <div class="img-camp-name">${c.nombre}</div>
                <div class="img-camp-building"><i class="f_17 lexx lexx_location"></i> ${c.edificio || "Sin edificio"}</div>
                <div class="img-camp-meta">
                    <span class="badge-plan">${c.plan}</span>
                    <span class="meta-date f_11">Creada en base de datos</span>
                </div>
            </div>
            <div class="img-camp-actions">
                <div class="img-camp-dropdown-wrap">
                    <button class="img-camp-dropdown-trigger" title="Opciones">
                        <i class="lexx lexx_more_vertical"></i>
                    </button>
                    <div class="img-camp-dropdown-menu">
                        ${playBtnHtml}
                        ${hasFiles ? '<div class="img-camp-dropdown-divider"></div>' : ""}
                        <div class="img-camp-dropdown-item btn-delete-camp" data-id="${c.id}">
                            <i class="lexx lexx_delete"></i> Eliminar
                        </div>
                    </div>
                </div>
            </div>
        </div>
      `;
    });

    html += `
          </div>
      </div>
    `;
    return html;
  }

  function bindEvents(campaigns) {
    const cards = _(".img-camp-card");
    if (cards) {
      cards.each(function (idx, card) {
        _(card).on("click", function (e) {
          if (e.target.closest(".img-camp-dropdown-wrap")) return;
          const id = _(this).attr("data-id");
          const name = _(this).find(".img-camp-name").text();
          openUpload(id, name, campaigns);
        });
      });
    }

    const dropdownTriggers = _(".img-camp-dropdown-trigger");
    if (dropdownTriggers) {
      dropdownTriggers.each(function (idx, trigger) {
        _(trigger).on("click", function (e) {
          e.stopPropagation();
          const wrapElement = this.closest(".img-camp-dropdown-wrap");
          const cardElement = this.closest(".img-camp-card");
          const wrap = _(wrapElement);
          const isActive = wrap.hasClass("active");

          _(".img-camp-dropdown-wrap").removeClass("active");
          _(".img-camp-dropdown-menu").removeClass("active");

          const allCards = document.querySelectorAll(".img-camp-card");
          for (let i = 0; i < allCards.length; i++) {
            allCards[i].classList.remove("active-dropdown");
          }

          if (!isActive) {
            wrap.addClass("active");
            const menu = wrap[0].querySelector(".img-camp-dropdown-menu");
            if (menu) {
              menu.classList.remove("dropup");
              menu.classList.add("active");

              setTimeout(() => {
                const rect = menu.getBoundingClientRect();
                const modalBody = wrapElement.closest(".modal-body") || document.body;
                const bodyRect = modalBody.getBoundingClientRect();
                if (rect.bottom > bodyRect.bottom - 10) {
                  menu.classList.add("dropup");
                }
              }, 0);
            }
            if (cardElement) cardElement.classList.add("active-dropdown");
          }
        });
      });
    }

    _(document).on("click", function (e) {
      if (!e.target.closest(".img-camp-dropdown-wrap")) {
        const ddWrap = _(".img-camp-dropdown-wrap");
        if (ddWrap) ddWrap.removeClass("active");

        const ddMenu = _(".img-camp-dropdown-menu");
        if (ddMenu) ddMenu.removeClass("active");

        const allCards = document.querySelectorAll(".img-camp-card");
        for (let i = 0; i < allCards.length; i++) {
          allCards[i].classList.remove("active-dropdown");
        }
      }
    });

    const playBtns = _(".btn-play-camp");
    if (playBtns) {
      playBtns.each(function (idx, btn) {
        _(btn).on("click", function (e) {
          e.stopPropagation();
          const id = _(this).attr("data-id");
          const camp = campaigns.find((c) => String(c.id) === String(id));

          if (camp && camp.archivos && camp.archivos.length > 0) {
            if (typeof SliderManager !== "undefined") {
              if (typeof SliderManager.clearSlides === "function") {
                SliderManager.clearSlides();
              }
              SliderManager.activeCampaignId = id;

              const today = new Date().toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              });

              camp.archivos.forEach((u) => {
                // En el dashboard las imágenes están en ../uploads/...
                SliderManager.addSlide('../' + u.url, u.name, today, u.type);
              });
            }

            Modal.close();
            setTimeout(() => {
              alert(`Campaña "${camp.nombre}" cargada en el simulador.`, "Ok");
            }, 100);
          }
        });
      });
    }

    const delBtns = _(".btn-delete-camp");
    if (delBtns) {
      delBtns.each(function (idx, btn) {
        _(btn).on("click", function (e) {
          e.stopPropagation();
          const id = _(this).attr("data-id");
          if (confirm("¿Estás seguro de eliminar esta campaña y todo su contenido? Esta acción no se puede deshacer.")) {
            deleteCampaign(id);
          }
        });
      });
    }
  }

  function deleteCampaign(id) {
    fetch(`../api/campanas.php?action=delete&id=${id}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (window.updateCampaignBadge) window.updateCampaignBadge();
        Modal.close();
        setTimeout(open, 300);
      } else {
        alert(data.message || "Error al eliminar la campaña.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de conexión al eliminar la campaña.", "Error");
    });
  }

  function openUpload(id, name, campaigns) {
    const camp = campaigns.find((c) => String(c.id) === String(id));
    currentUploads = camp && camp.archivos ? [...camp.archivos] : [];

    Modal.open({
      title: "Subir Contenido",
      size: "md",
      content: getUploadHtml(name),
      actions: [
        { label: "Cerrar", onClick: () => {
            // Actualizar la lista en el menú recargando el modal principal
            Modal.close();
            setTimeout(open, 100);
          }
        }
      ],
    });
    setTimeout(() => bindUploadEvents(id), 50);
  }

  function getUploadHtml(campaignName) {
    let listHtml = "";

    currentUploads.forEach((u) => {
      const onLoadStr = `
          var p = this.parentElement.parentElement;
          if(p) p.classList.remove('skeleton-loading');
          this.classList.add('loaded');
      `.replace(/\n/g, " ");

      // Prepend ../ a las rutas de uploads para verlas correctamente en digital/
      const fileUrl = '../' + u.url;

      const mediaHtml =
        u.type === "video"
          ? `<video src="${fileUrl}" class="wz-file-media" muted onloadeddata="${onLoadStr}"></video>`
          : `<img src="${fileUrl}" class="wz-file-media" onload="${onLoadStr}" onerror="this.src='../img/icono.png'; ${onLoadStr}" />`;

      const sizeStr = u.size
        ? `${(u.size / 1024 / 1024).toFixed(2)} MB`
        : "Guardado";

      listHtml += `
          <div class="wz-file-item" id="file-item-${u.id}">
              <div class="wz-file-preview">
                  ${mediaHtml}
              </div>
              <div class="wz-file-info">
                  <span class="wz-file-name">${u.name}</span>
                  <span class="wz-file-size">${sizeStr}</span>
              </div>
              <div class="wz-file-actions">
                  <div class="wz-file-edit" title="Renombrar"><i class="lexx lexx_edit"></i></div>
                  <div class="wz-file-del" title="Eliminar"><i class="lexx lexx_delete"></i></div>
              </div>
          </div>
      `;
    });

    return `
      <div class="wz-wrap">
          <div class="img-camp-header upload-header-wrap">
              <div>
                  <h3 class="img-camp-header-title">Archivos de: ${campaignName}</h3>
                  <p class="img-camp-header-desc">Sube imágenes o videos para visualizar en la tablet.</p>
              </div>
              <button type="button" class="upload-back-btn" id="btn-back-campaigns">
                  <i class="lexx lexx_sync"></i> Cambiar
              </button>
          </div>

          <div class="upload-zone-premium" id="btn-select-files">
              <div class="upload-icon-premium">
                  <i class="lexx lexx_cloud_upload"></i>
              </div>
              <div class="upload-title-premium">Subir archivos</div>
              <div class="upload-desc-premium">Haz clic para seleccionar imágenes o videos aquí</div>
              <button type="button" class="upload-btn-premium">Seleccionar desde la PC</button>
              <div class="upload-hint-premium">Soporta JPG, PNG, MP4 (Max. 50MB)</div>
              <input type="file" id="file-input" multiple accept="image/*,video/*" style="display: none;">
          </div>

          <div class="wz-file-list" id="file-list" style="margin-top: 24px;">
              ${listHtml}
          </div>
      </div>
    `;
  }

  function bindUploadEvents(campaignId) {
    const btnBack = _("#btn-back-campaigns");
    if (btnBack) {
      btnBack.on("click", function () {
        open();
      });
    }

    const btnSelect = _("#btn-select-files");
    if (btnSelect) {
      btnSelect.on("click", function () {
        const fileInput = _("#file-input");
        if (fileInput && fileInput.length > 0) {
          fileInput[0].click();
        }
      });
    }

    // Enlazar los botones de eliminar ya cargados
    const existingDelBtns = _(".wz-file-del");
    if (existingDelBtns && existingDelBtns.length > 0) {
      existingDelBtns.each(function (idx, btn) {
        _(btn).on("click", function () {
          const item = _(this)[0].closest(".wz-file-item");
          if (item) {
            const fileId = item.id.replace("file-item-", "");
            deleteFile(fileId, item);
          }
        });
      });
    }

    // Enlazar los botones de editar nombre ya cargados
    const existingEditBtns = _(".wz-file-edit");
    if (existingEditBtns && existingEditBtns.length > 0) {
      existingEditBtns.each(function (idx, btn) {
        bindEditBtn(_(btn));
      });
    }

    const fileInputObj = _("#file-input");
    if (fileInputObj) {
      fileInputObj.on("change", function (e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
          const isVideo = file.type.startsWith("video/");

          const validateAndUpload = (width, height) => {
            const maxWidth = 1920;
            const maxHeight = 1080;
            const isValid = width <= maxWidth && height <= maxHeight;

            if (!isValid) {
              alert(`Resolución excedida en "${file.name}" (${width}x${height}). Máx: 1920x1080.`, "Error");
              return;
            }

            // Crear item visual temporal (Skeleton loading)
            const tempId = "temp_file_" + Date.now() + "_" + Math.floor(Math.random() * 100);
            const tempHtml = `
              <div class="wz-file-item skeleton-loading" id="${tempId}">
                  <div class="wz-file-preview">
                      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#f1f5f9;">
                          <i class="lexx lexx_sync lexx-spin" style="color:var(--accent);"></i>
                      </div>
                  </div>
                  <div class="wz-file-info">
                      <span class="wz-file-name">${file.name}</span>
                      <span class="wz-file-size">Subiendo...</span>
                  </div>
              </div>
            `;
            const list = _("#file-list");
            if (list && list.length > 0) {
              list[0].insertAdjacentHTML("beforeend", tempHtml);
            }

            // Realizar subida real con FormData a api/upload.php
            const formData = new FormData();
            formData.append('campana_id', campaignId);
            formData.append('file', file);

            fetch('../api/upload.php', {
              method: 'POST',
              body: formData
            })
            .then(res => res.text())
            .then(text => {
              const cleaned = text.trim().replace(/^\uFEFF/, '');
              try {
                return JSON.parse(cleaned);
              } catch(e) {
                throw new Error(text);
              }
            })
            .then(data => {
              // Remover skeleton temporal
              const tempItem = document.getElementById(tempId);
              if (tempItem) tempItem.remove();

              if (data.success) {
                const dbFile = data.file; // Contiene { id, name, url, size, type }
                currentUploads.push(dbFile);

                // Agregar el slide visual definitivo al listado del modal
                const fileUrl = '../' + dbFile.url;
                const onLoadStr = `
                    var p = this.parentElement.parentElement;
                    if(p) p.classList.remove('skeleton-loading');
                    this.classList.add('loaded');
                `.replace(/\n/g, " ");

                const mediaHtml = dbFile.type === "video"
                  ? `<video src="${fileUrl}" class="wz-file-media" muted onloadeddata="${onLoadStr}"></video>`
                  : `<img src="${fileUrl}" class="wz-file-media" onload="${onLoadStr}" />`;

                const fileHtml = `
                  <div class="wz-file-item" id="file-item-${dbFile.id}">
                      <div class="wz-file-preview">
                          ${mediaHtml}
                      </div>
                      <div class="wz-file-info">
                          <span class="wz-file-name">${dbFile.name}</span>
                          <span class="wz-file-size">${(dbFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div class="wz-file-actions">
                          <div class="wz-file-edit" title="Renombrar"><i class="lexx lexx_edit"></i></div>
                          <div class="wz-file-del" title="Eliminar"><i class="lexx lexx_delete"></i></div>
                      </div>
                  </div>
                `;

                if (list && list.length > 0) {
                  list[0].insertAdjacentHTML("beforeend", fileHtml);
                  
                  // Enlazar eventos del nuevo item
                  const newItem = _("#file-item-" + dbFile.id);
                  if (newItem && newItem.length > 0) {
                    newItem.find(".wz-file-del").on("click", function() {
                      deleteFile(dbFile.id, newItem[0]);
                    });
                    bindEditBtn(newItem.find(".wz-file-edit"));
                  }
                }

                // Actualizar simulador en tiempo real
                if (typeof SliderManager !== "undefined") {
                  if (SliderManager.activeCampaignId == campaignId) {
                    const today = new Date().toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    });
                    SliderManager.addSlide(fileUrl, dbFile.name, today, dbFile.type);
                  }
                }

              } else {
                alert(data.message || "Error al subir el archivo al servidor.", "Error");
              }
            })
            .catch(err => {
              console.error(err);
              const tempItem = document.getElementById(tempId);
              if (tempItem) tempItem.remove();
              
              const msg = err.message && err.message.length > 0 && !err.message.includes("Failed to fetch")
                ? "Error del Servidor: " + err.message
                : "Error de red al subir el archivo.";
              alert(msg, "Error");
            });
          };

          // Obtener dimensiones antes de subir
          if (isVideo) {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = function () {
              window.URL.revokeObjectURL(video.src);
              validateAndUpload(video.videoWidth, video.videoHeight);
            };
            video.src = URL.createObjectURL(file);
          } else {
            const img = new Image();
            img.onload = function () {
              validateAndUpload(img.width, img.height);
            };
            img.src = URL.createObjectURL(file);
          }
        });
      });
    }
  }

  function deleteFile(fileId, element) {
    if (!confirm("¿Estás seguro de eliminar este recurso?")) return;

    fetch(`../api/upload.php?action=delete&file_id=${fileId}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const fileData = currentUploads.find((u) => String(u.id) === String(fileId));
        currentUploads = currentUploads.filter((u) => String(u.id) !== String(fileId));

        if (element) element.remove();

        // Remover del simulador en tiempo real
        if (fileData && typeof SliderManager !== "undefined" && typeof SliderManager.removeSlide === "function") {
          SliderManager.removeSlide('../' + fileData.url);
        }
      } else {
        alert(data.message || "Error al eliminar el archivo.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de red al eliminar el archivo.", "Error");
    });
  }

  function bindEditBtn(btn) {
    btn.on("click", function () {
      const item = btn[0].closest(".wz-file-item");
      if (!item) return;

      const fileId = item.id.replace("file-item-", "");
      const nameSpan = _(item).find(".wz-file-name");
      const currentName = nameSpan.text();

      const lastDotIndex = currentName.lastIndexOf(".");
      const namePart = lastDotIndex !== -1 ? currentName.substring(0, lastDotIndex) : currentName;
      const extensionPart = lastDotIndex !== -1 ? currentName.substring(lastDotIndex) : "";

      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.style.zIndex = "2000";

      const box = document.createElement("div");
      box.className = "modal-box";
      box.dataset.size = "sm";
      box.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">Renombrar archivo</h3>
            <button class="modal-close">✕</button>
        </div>
        <div class="modal-body rename-modal-body">
            <label class="rename-input-label">Nuevo nombre</label>
            <div class="rename-input-group" style="display:flex; align-items:center; gap:8px;">
                <input type="text" class="wz-input" style="flex: 1; margin: 0; min-width: 0;" value="${namePart}" maxlength="80" />
                <span class="rename-extension-tag" style="font-weight:600; color:#64748b;">${extensionPart}</span>
            </div>
        </div>
        <div class="modal-footer rename-modal-footer">
            <button class="modal-btn modal-btn--secondary btn-cancelar">Cancelar</button>
            <button class="modal-btn modal-btn--primary btn-guardar">Guardar</button>
        </div>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      void overlay.offsetWidth;
      overlay.classList.add("active");

      const input = box.querySelector(".wz-input");
      const btnCancel = box.querySelector(".btn-cancelar");
      const btnGuardar = box.querySelector(".btn-guardar");
      const btnClose = box.querySelector(".modal-close");

      input.focus();
      input.select();

      function close() {
        overlay.classList.remove("active");
        setTimeout(() => {
          if (overlay.parentNode) document.body.removeChild(overlay);
        }, 250);
      }

      function confirmRename() {
        const newNamePart = input.value.trim() || namePart;
        const finalName = newNamePart + extensionPart;

        fetch('../api/upload.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rename', file_id: fileId, new_name: finalName })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const entry = currentUploads.find((u) => String(u.id) === String(fileId));
            if (entry) entry.name = finalName;
            nameSpan.text(finalName);
            close();
          } else {
            alert(data.message || "Error al renombrar el archivo en el servidor.", "Error");
          }
        })
        .catch(err => {
          console.error(err);
          alert("Error de red al renombrar el archivo.", "Error");
        });
      }

      btnCancel.addEventListener("click", close);
      btnClose.addEventListener("click", close);
      btnGuardar.addEventListener("click", confirmRename);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirmRename();
        if (e.key === "Escape") close();
      });
    });
  }

  return { open };
})();
