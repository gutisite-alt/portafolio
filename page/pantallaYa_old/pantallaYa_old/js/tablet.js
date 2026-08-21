document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const campId = params.get("camp");
  const slider = document.getElementById("slider");
  const startOverlay = document.getElementById("start-overlay");

  let slideshowInterval = null;
  let currentSlideIndex = 0;
  const SLIDE_DURATION = 5000; // 5 segundos para imágenes

  // Manejar el overlay de inicio
  startOverlay.addEventListener("click", () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log(err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }

    startOverlay.classList.add("hidden");
    setTimeout(() => {
      startOverlay.remove();
      // Iniciar la reproducción una vez que el usuario interactúa (requerido por políticas de autoplay de navegadores)
      startPlay();
    }, 400);
  });

  function showError(title, desc) {
    slider.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <div class="error-title">${title}</div>
            <div class="error-desc">${desc}</div>
        </div>
    `;
  }

  if (!campId) {
    showError(
      "No hay campaña",
      "La URL no especificó qué campaña reproducir (?camp=ID).",
    );
    return;
  }

  // Cargar campaña y archivos desde la API en MySQL
  fetch(`../api/tablet.php?camp=${campId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.campana) {
        const camp = data.campana;
        if (!camp.archivos || camp.archivos.length === 0) {
          showError(
            "Campaña vacía",
            "Esta campaña aún no tiene contenido asociado."
          );
          return;
        }

        renderSlides(camp.archivos);
      } else {
        showError(
          "Campaña no encontrada",
          data.message || "La campaña especificada no existe en la base de datos."
        );
      }
    })
    .catch(err => {
      console.error(err);
      showError(
        "Error de Conexión",
        "No se pudo cargar la campaña desde el servidor."
      );
    });

  function renderSlides(files) {
    slider.innerHTML = ""; // Limpiar loaders

    files.forEach((file, index) => {
      const slide = document.createElement("div");
      slide.className = "slide";
      if (index === 0) slide.classList.add("active");

      // Prepend ../ a las rutas de uploads para cargarlas correctamente desde /tablet
      const fileUrl = '../' + file.url;

      if (file.type === "video") {
        // Quitamos loop para poder avanzar cuando termine, y quitamos autoplay para controlarlo por JS
        slide.innerHTML = `<video src="${fileUrl}" muted playsinline></video>`;
      } else {
        slide.innerHTML = `<img src="${fileUrl}" alt="Contenido de Campaña">`;
      }
      slider.appendChild(slide);
    });
  }

  function startPlay() {
    const slides = document.querySelectorAll(".slide");
    if (slides.length === 0) return;

    goToSlide(0, slides);
  }

  function goToSlide(index, slides) {
    // Limpiar intervalo anterior si existe
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }

    // Remover clase activa de la diapositiva actual y pausar su video
    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      activeSlide.classList.remove("active");
      const activeVideo = activeSlide.querySelector("video");
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.currentTime = 0;
      }
    }

    // Activar nueva diapositiva
    currentSlideIndex = index;
    const newSlide = slides[currentSlideIndex];
    newSlide.classList.add("active");

    const video = newSlide.querySelector("video");
    if (video) {
      // Si el slide activo es un video, lo reproducimos y esperamos a que termine
      video.play().catch(err => console.log("Autoplay bloqueado:", err));
      video.onended = () => {
        // Al terminar el video, pasa de inmediato al siguiente slide
        nextSlide(slides);
      };
    } else {
      // Si es una imagen, esperamos 5 segundos antes de avanzar
      slideshowInterval = setInterval(() => {
        nextSlide(slides);
      }, SLIDE_DURATION);
    }
  }

  function nextSlide(slides) {
    const nextIndex = (currentSlideIndex + 1) % slides.length;
    goToSlide(nextIndex, slides);
  }
});
