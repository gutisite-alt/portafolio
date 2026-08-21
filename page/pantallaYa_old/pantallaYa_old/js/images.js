let previewFilesList = [];

function previewImages(files = null) {
  if (files && files.length) {
    agregarArchivosPreview(files);
  }

  sincronizarInputFiles();
  renderPreviewImages();
}

function agregarArchivosPreview(files) {
  Object.keys(files).forEach((key) => {
    if (isNaN(key)) return;

    let file = files[key];

    if (!file.type.match("image.*")) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen "' + file.name + '" supera el máximo de 5MB');
      return;
    }

    // Evitar duplicados por nombre + tamaño + lastModified
    let existe = previewFilesList.some((item) => {
      return (
        item.name === file.name &&
        item.size === file.size &&
        item.lastModified === file.lastModified
      );
    });

    if (!existe) {
      previewFilesList.push(file);
    }
  });
}

function sincronizarInputFiles() {
  let dataTransfer = new DataTransfer();

  previewFilesList.forEach((file) => {
    dataTransfer.items.add(file);
  });

  _("#file-input").Obj[0].files = dataTransfer.files;
}

function renderPreviewImages() {
  let contenedor = _("#preview-images");
  contenedor.html("");

  if (!previewFilesList.length) return;

  previewFilesList.forEach((file, index) => {
    let reader = new FileReader();

    reader.onload = function (e) {
      let item = _.crearElemento("div", ["preview-item"], "");
      let img = _.crearElemento("img", ["preview-img"], "");
      let btn = _.crearElemento("button", ["preview-remove"], "&times;");
      let nombre = _.crearElemento("div", ["preview-name"], file.name);

      img.src = e.target.result;
      btn.type = "button";

      _(btn).on("click", function () {
        removePreviewImage(index);
      });

      item.appendChild(img);
      item.appendChild(btn);
      item.appendChild(nombre);

      contenedor.append(_(item));
    };

    reader.readAsDataURL(file);
  });
}

function removePreviewImage(index) {
  previewFilesList.splice(index, 1);
  sincronizarInputFiles();
  renderPreviewImages();
}

_("#file-input").on("change", function () {
  previewImages(this.files);
});
