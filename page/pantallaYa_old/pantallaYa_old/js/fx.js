function revealSections() {
  _(".fx").each(function () {
    if (_(this).isVisible()) {
      _(this).addClass("show");
    }
  });
}

function verDemo() {
  _("#demo").removeClass("object_none");
}

_(window).on("scroll", function () {
  revealSections();

  // Botón Scroll to Top
  if (document.getElementById("scrollTopBtn")) {
    if (window.scrollY > 400) {
      _("#scrollTopBtn").addClass("show");
    } else {
      _("#scrollTopBtn").removeClass("show");
    }
  }
});

_(document).ready(function () {
  revealSections();

  // Activar los botones de CTA para que abran el modal de Crear Campaña
  _(".btn_open_modal").each(function () {
    _(this).on("click", function (e) {
      e.preventDefault();
      if (typeof CrearModal !== "undefined") {
        var plan = this.getAttribute("data-plan") || "";
        CrearModal.open(plan);
      }
    });
  });

  // Lógica click Scroll to Top
  if (document.getElementById("scrollTopBtn")) {
    _("#scrollTopBtn").on("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      _("#scrollTopBtn").removeClass("show");
    });
  }
});
