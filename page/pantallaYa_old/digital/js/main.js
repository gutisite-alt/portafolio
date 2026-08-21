// --- 0. Prevención de alertas duplicadas (Override con lexx.js) ---
if (typeof window.alert === "function") {
  const originalAlert = window.alert;
  window.alert = function (m, i, t) {
    const existingAlerts = _(".alert_Text_Info");
    let isDuplicate = false;

    if (existingAlerts) {
      existingAlerts.each(function (idx, el) {
        if (_(el).text() === m) {
          const parent = _(el).parents(".alert_Mensaje_Mensaje");
          // Solo consideramos duplicado si la alerta está viva y visible
          if (
            parent &&
            parent.attr("del") !== "1" &&
            parent.css("display") !== "none"
          ) {
            parent.css("animation", "none");
            parent.Obj[0].offsetHeight; /* Forzar reflow nativo */
            parent.css(
              "animation",
              "toastSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
            );
            isDuplicate = true;
          }
        }
      });
    }

    if (isDuplicate) return; // Salir para no crear otra alerta

    // Si no es duplicado, ejecutar la alerta de lexx.js original
    originalAlert(m, i, t);
  };
}

function toggleSidebar() {
  const sidebar = _(".sidebar");
  const overlay = _(".sidebar-overlay");
  if (sidebar.hasClass("active")) {
    sidebar.removeClass("active");
  } else {
    sidebar.addClass("active");
  }
  if (overlay.hasClass("active")) {
    overlay.removeClass("active");
  } else {
    overlay.addClass("active");
  }
}

// Auto-ocultar sidebar en móviles al seleccionar una opción
_(".sidebar").on("click", (e) => {
  if (
    e.target.closest(".tree-leaf") ||
    e.target.closest(".tree-parent.no-children")
  ) {
    const sidebar = _(".sidebar");
    if (sidebar.hasClass("active")) {
      toggleSidebar();
    }
  }
});

// --- 1. Lógica del Reloj y Fecha (Movida a widgets.js) ---

// --- 2. Lógica del Slider Automático y Manejador de Imágenes ---
const SliderManager = (() => {
  const container = _("#mainSlider");
  let current = 0;
  let autoplayTimer;
  const slideInterval = 5000;

  function getSlides() {
    return container && container.length > 0 ? container.find(".slide") : null;
  }

  function getTotal() {
    const slides = getSlides();
    return slides && slides.length ? slides.length : 0;
  }

  function setEmptyState(isEmpty) {
    if (!container || container.length === 0) return;
    let empty = container.find(".slider-empty");
    if (isEmpty && (!empty || empty.length === 0)) {
      const emptyHtml = `
        <div class="slider-empty ambient-screensaver">
          <div class="ambient-gradient"></div>
          <div class="ambient-content">
            <div class="ambient-icon-wrapper">
              <svg style="overflow: visible;" width="65" height="40" viewBox="0 -5 48 34" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <!-- Trazo base translúcido -->
                <path d="M24,12 C14,-2 4,6 4,12 C4,18 14,26 24,12 C34,-2 44,6 44,12 C44,18 34,26 24,12 Z" stroke="rgba(255,255,255,0.15)" />
                <!-- Haz de luz animado -->
                <path class="infinity-light" pathLength="100" d="M24,12 C14,-2 4,6 4,12 C4,18 14,26 24,12 C34,-2 44,6 44,12 C44,18 34,26 24,12 Z" stroke="#ffffff" />
              </svg>
            </div>
            <h3 class="ambient-title">Pantalla en espera</h3>
            <p class="ambient-subtitle">Sube tu contenido para visualizarlo aquí</p>
          </div>
        </div>`;
      container[0].insertAdjacentHTML("beforeend", emptyHtml);
    } else if (!isEmpty && empty && empty.length > 0) {
      empty.remove();
    }
  }

  function goTo(index) {
    const slides = getSlides();
    const total = getTotal();
    if (total === 0 || !slides) return;

    slides.removeClass("active");
    current = ((index % total) + total) % total;
    const activeSlide = _(slides[current]);
    activeSlide.addClass("active");

    // Detenemos el autoplay normal
    clearInterval(autoplayTimer);

    // Revisamos si el slide actual tiene un video
    const slideNode =
      activeSlide[0] || (activeSlide.Obj ? activeSlide.Obj[0] : null);
    const vid = slideNode ? slideNode.querySelector("video") : null;

    if (vid) {
      vid.currentTime = 0;
      vid.play().catch((e) => console.log("Error reproduciendo video:", e));
      vid.onended = function () {
        nextSlide();
      };
    } else {
      startAutoplay();
    }
  }

  function nextSlide() {
    goTo(current + 1);
  }

  function removeSlide(src) {
    const slides = getSlides();
    if (!slides || slides.length === 0) return;

    let removedIndex = -1;
    slides.each(function (i, slide) {
      const media = _(slide).find("img, video");
      if (media && media.length > 0) {
        const mediaSrc = media.attr("src") || media[0].src;
        if (mediaSrc === src || mediaSrc.endsWith(src)) {
          removedIndex = i;
        }
      }
    });

    if (removedIndex === -1) return;

    const slide = _(slides[removedIndex]);
    slide.css("transition", "opacity 0.25s ease");
    slide.css("opacity", "0");

    // Si estamos borrando el slide activo y es video, quitamos el onended
    const videoEl = slide.find("video");
    if (videoEl && videoEl.length > 0) {
      videoEl[0].onended = null;
    }

    setTimeout(() => {
      slide.remove();
      const newTotal = getTotal();
      setEmptyState(newTotal === 0);
      if (newTotal === 0) {
        clearInterval(autoplayTimer);
        return;
      }

      if (current >= removedIndex && current > 0) current--;
      goTo(current);
    }, 250);
  }

  function addSlide(src, name, date, type = "image") {
    if (!container || container.length === 0) return;

    // Remover la extensión del nombre del archivo para mostrar un título más limpio
    const displayName = name.substring(0, name.lastIndexOf(".")) || name;

    const mediaHtml =
      type === "video"
        ? `<video src="${src}" class="slide-video" muted playsinline></video>`
        : `<img src="${src}" alt="${displayName}" />`;

    const slideHtml = `
        <div class="slide">
            ${mediaHtml}
            <div class="slide-info">
                <h2 class="slide-title">${displayName}</h2>
                <p class="slide-desc">Agregado el ${date}</p>
            </div>
        </div>`;

    container[0].insertAdjacentHTML("beforeend", slideHtml);
    setEmptyState(false);

    // Forzar reflow para animación
    requestAnimationFrame(() => {
      goTo(getTotal() - 1);
    });
  }

  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, slideInterval);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  function clearSlides() {
    const slides = getSlides();
    if (slides && slides.length > 0) {
      slides.remove();
    }
    current = 0;
    setEmptyState(true);
  }

  // Init
  setEmptyState(getTotal() === 0);
  startAutoplay();

  // Exponer la API
  return { goTo, addSlide, removeSlide, clearSlides, syncDots: () => {} };
})();

// Tree menu toggle
function toggleNode(btn) {
  btn.closest(".tree-node").classList.toggle("open");
}

// Tree leaf active state
_(".tree-leaf").each(function (idx, leaf) {
  _(leaf).on(
    "click",
    function (e) {
      if (e.cancelable) {
        e.preventDefault();
      }
      _(".tree-leaf").removeClass("active");
      _(this).addClass("active");
    },
    { passive: false },
  );
});

// --- 3. Lógica del Badge de Campañas (Base de Datos MySQL) ---
function updateCampaignBadge() {
  fetch('../api/campanas.php')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const badge = _("#campaign-badge");
        if (badge && badge.length > 0) {
          badge.text(data.campanas.length);
          badge.show();
        }
      }
    })
    .catch(e => console.error("Error actualizando badge:", e));
}

// Global para que otras vistas lo actualicen
window.updateCampaignBadge = updateCampaignBadge;

function checkPendingLandingCampaign() {
  if (localStorage.getItem("LandingCampaignPending") === "true") {
    localStorage.removeItem("LandingCampaignPending");
    if (typeof ImagenesModal !== "undefined") {
      setTimeout(() => {
        ImagenesModal.open();
      }, 600);
    }
  }
}

function syncLocalDataToDatabase() {
  let localCamps = [];
  try {
    localCamps = JSON.parse(localStorage.getItem("AppCampaigns") || "[]");
  } catch (e) {
    localCamps = [];
  }

  const tempCamps = localCamps.filter(c => String(c.id).startsWith('temp_'));
  
  if (tempCamps.length === 0) {
    localStorage.removeItem("AppCampaigns");
    updateCampaignBadge();
    checkPendingLandingCampaign();
    return;
  }

  let syncChain = Promise.resolve();

  tempCamps.forEach(c => {
    syncChain = syncChain.then(() => {
      return fetch('../api/campanas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: c.nombre,
          edificio: c.edificio,
          plan: c.plan,
          direccion: c.direccion || '',
          torre: c.torre || '',
          bloque: c.bloque || '',
          observaciones: c.observaciones || '',
          pago_metodo: c.pago_metodo || 'tc'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && c.archivos && c.archivos.length > 0) {
          const newCampId = data.campana_id;
          let fileSyncChain = Promise.resolve();
          c.archivos.forEach(f => {
            fileSyncChain = fileSyncChain.then(() => {
              return fetch('../api/upload.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campana_id: newCampId,
                  file_base64: f.url,
                  file_name: f.name,
                  file_size: f.size,
                  file_type: f.type
                })
              });
            });
          });
          return fileSyncChain;
        }
      });
    });
  });

  syncChain.then(() => {
    localStorage.removeItem("AppCampaigns");
    updateCampaignBadge();
    checkPendingLandingCampaign();
  })
  .catch(err => {
    console.error("Error durante la sincronización de datos locales:", err);
    updateCampaignBadge();
    checkPendingLandingCampaign();
  });
}

// --- 4. Verificación de Sesión y Sincronización ---
_(document).ready(function () {
  // Verificar estado de la sesión
  fetch('../api/auth.php?action=status')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.loggedIn) {
        window.currentUser = data.user;
        
        // Sincronizar datos de localStorage si existen
        syncLocalDataToDatabase();
      } else {
        window.location.href = '../index.html';
      }
    })
    .catch(err => {
      console.error("Error de verificación de sesión:", err);
      window.location.href = '../index.html';
    });
});

window.logout = function() {
  fetch('../api/auth.php?action=logout')
    .then(() => {
      window.location.href = '../index.html';
    });
};

// --- 5. Favicon Dinámico (Dark/Light mode) ---
function initDynamicFavicon() {
  const favicon = _('link[rel="shortcut icon"]');
  if (!favicon || favicon.length === 0) return;

  const originalSrc = favicon.attr("href");
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = originalSrc;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function updateFavicon(e) {
      const isDark = e.matches;
      if (isDark) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = 255 - data[i]; // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
          }
        }
        ctx.putImageData(imageData, 0, 0);
        favicon.attr("href", canvas.toDataURL("image/png"));
      } else {
        favicon.attr("href", originalSrc);
      }
    }

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    updateFavicon(darkModeQuery);
    darkModeQuery.addEventListener("change", updateFavicon);
  };
}

_(document).ready(initDynamicFavicon);
