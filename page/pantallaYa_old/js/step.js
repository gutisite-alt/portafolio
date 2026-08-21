function stepTab(e) {
  let steps = _(e).attr("data-step");
  let stepBack = _(e).attr("data-step-back");
  let tabs = _(".publication_step");

  _(".step_content").addClass("object_none");
  _(".publication_step").removeClass("active");

  if (steps == 2) {
    tabs[0].addClass("current");
    tabs[1].addClass("active");
  }

  if (steps == 3) {
    tabs[1].addClass("current");
    tabs[2].addClass("active");
  }

  if (steps == 4) {
    tabs[2].addClass("current");
    tabs[3].addClass("active");
  }

  if (stepBack == 1) {
    tabs[0].removeClass("current").addClass("active");
    tabs[1].removeClass("active");
  }

  if (stepBack == 2) {
    tabs[1].removeClass("current");
    tabs[2].removeClass("active");
  }

  _("#step_" + steps).removeClass("object_none");
}
_(".btn_step_tab").on("click", function () {
  stepTab(this);
});
