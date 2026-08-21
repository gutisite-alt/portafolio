function openModal(modalId) {
  let modal = _(modalId).attr("data-modal");
  _("#" + modal).addClass("active");
}

function closeModal(modalCloseId) {
  let modal = _("#" + _(modalCloseId).attr("close-modal"));

  modal.addClass("closing");

  _(".publication_step").removeClass("current active");
  _(".publication_step")[0].addClass("active");
  _(".step_content").addClass("object_none");
  _("#step_1").removeClass("object_none");

  setTimeout(function () {
    modal.removeClass("active");
    modal.removeClass("closing");
  }, 300);
}

_(".btn_open_modal").on("click", function () {
  openModal(this);
});
_(".btn_close_modal").on("click", function () {
  closeModal(this);
});
