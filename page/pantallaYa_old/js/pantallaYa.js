_(() => {
  _.setEditable();
  _.autocompleteMail(".eMail");
  _.CalendarioConfig.botonHoy = false;
  _.CalendarioConfig.botonCerrar = false;
  _.CalendarioConfig.tema = "Light";
  _(".calendar_control").calendar();

  const carrusel = _(".carrusel");
  const images = _(".carrusel img");
  const dotsBox = _(".dots");

  if (!carrusel || !images || !dotsBox) return;

  const carruselEl = carrusel.nodeType ? carrusel : carrusel[0];
  const dotsEl = dotsBox.nodeType ? dotsBox : dotsBox[0];

  const total = images.length || 0;
  if (!total) return;

  const INTERVAL_TIME = 10000;
  let autoPlayTimer = null;
  let currentIndex = 0;
  let isInteracting = false;

  // imágenes
  for (let i = 0; i < total; i++) {
    images[i].style.display = "none";
  }

  images[0].style.display = "block";

  // dots
  dotsEl.innerHTML = "";

  for (let i = 0; i < total; i++) {
    const dot = _.crearElemento("span", ["dot"], "");
    if (i === 0) dot.classList.add("active");

    _.addEventListener(dot, "click", () => {
      goToSlide(i);
      resetAutoplay();
    });

    dotsEl.appendChild(dot);
  }

  const dots = dotsEl.querySelectorAll(".dot");

  function updateDots() {
    dots.forEach((d) => d.classList.remove("active"));
    if (dots[currentIndex]) dots[currentIndex].classList.add("active");
  }

  // cambio de slide
  function goToSlide(index) {
    if (index >= total) index = 0;
    if (index < 0) index = total - 1;

    images[currentIndex].style.display = "none";
    images[index].style.display = "block";

    currentIndex = index;
    updateDots();
  }

  // autoplay
  function startAutoplay() {
    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
      if (!isInteracting) {
        goToSlide(currentIndex + 1);
      }
    }, INTERVAL_TIME);
  }

  function resetAutoplay() {
    startAutoplay();
  }

  // Iniciar
  startAutoplay();
});

function imagenVista(img) {
  const src = _(img).attr("src");
  if (!src) return;
  const modalImg = _("#modalImage").find("img");
  if (modalImg) {
    modalImg.attr("src", src);
    _("#modalImage").removeClass("hidden");
  }
}

_(".btn_image").on("click", function () {
  imagenVista(this);
});

function verQr(q) {
  const qrData = _(q).attr("data-qr");
  if (!qrData) return;

  if (qrData === "true") {
    _("#shareQr").removeClass("hidden");
    setTimeout(() => {
      _("#modalShare small").removeClass("hidden");
      _("#shareQr .loader").addClass("hidden");
      _("#shareQr img").removeClass("hide");
    }, 1200);
    event.stopPropagation();
  } else {
    alert("No se puede crear el QR en estos momentos", "Info");
  }
}

_(".btn_QR").on("click", function () {
  verQr(this);
});

function cerrarOverlay(e) {
  const reset = _(e).attr("data-reset");
  _(e).parent().addClass("hidden");

  if (!reset) return;

  if (reset === "true") {
    _("#shareDetail").removeClass("hidden");
    _("#shareQr").addClass("hidden");
    _("#modalShare small").addClass("hidden");
    _("#shareQr .loader").removeClass("hidden");
    _("#shareQr img").addClass("hide");
  } else {
    alert("Función de cerrar sin resetear QR no implementada", "Info");
  }
}

_(".trigger_overlay").on("click", function () {
  cerrarOverlay(this);
});

_(".btn_share_link").on("click", function () {
  const url = "home.php";
  window.open(url, "_blank");
});
