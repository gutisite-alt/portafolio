/**
 * PantallaYA — Global Modal System (Refactored to lexx.js)
 * API:
 *   Modal.open({ title, content, size, actions, onClose })
 *   Modal.close()
 *   Modal.setContent(html)
 *   Modal.setTitle(title)
 */
const Modal = (() => {
  let _onClose = null;

  const overlay = _("#modal-overlay");
  const box = _("#modal-box");
  const titleEl = _("#modal-title");
  const bodyEl = _("#modal-body");
  const footerEl = _("#modal-footer");
  const closeBtn = _("#modal-close");

  // Close triggers
  closeBtn.on("click", close);

  overlay.on("click", (e) => {
    // e.target is the native DOM element, so we compare it against the native DOM element inside the wrapper
    if (e.target === overlay[0]) close();
  });

  _(document).on("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  function open({
    title = "",
    content = "",
    size = "md",
    actions = [],
    onClose = null,
  } = {}) {
    _onClose = onClose;

    // Size
    box.attr("data-size", size);

    // Title
    titleEl.text(title);

    // Body
    bodyEl.html(content);

    // Footer actions
    footerEl.html("");
    if (actions && actions.length > 0) {
      footerEl.css("display", "flex");

      let buttonsHtml = "";
      actions.forEach(({ label, style = "secondary" }, i) => {
        buttonsHtml += `<button class="modal-btn modal-btn--${style}" id="modal-btn-action-${i}">${label}</button>`;
      });
      footerEl.html(buttonsHtml);

      // Bind events to dynamically created buttons
      actions.forEach(({ onClick }, i) => {
        _(`#modal-btn-action-${i}`).on("click", () => {
          if (onClick) onClick();
        });
      });
    } else {
      footerEl.css("display", "none");
    }

    // Show
    overlay.addClass("active");
    _("body").css("overflow", "hidden");
  }

  function close() {
    overlay.removeClass("active");
    _("body").css("overflow", "");
    if (_onClose) {
      _onClose();
      _onClose = null;
    }
  }

  function setContent(html) {
    bodyEl.html(html);
  }

  function setTitle(text) {
    titleEl.text(text);
  }

  return { open, close, setContent, setTitle };
})();
