/**
 * Modal: Crear Campaña (Wizard 4 steps)
 */
const CrearModal = (() => {
  let currentStep = 1;
  const totalSteps = 4;

  function open() {
    currentStep = 1;
    Modal.open({
      title: "Crear Campaña",
      size: "md",
      content: getHtml(),
      actions: [],
    });

    setTimeout(initWizard, 50);
  }

  function getHtml() {
    return `
        <div class="wz-wrap">
            <!-- Pasos -->
            <div class="wz-steps">
                <div class="wz-step active" data-step="1">
                    <div class="wz-step-bubble">1</div>
                    <div class="wz-step-name">Personal</div>
                    <div class="wz-step-line"></div>
                </div>
                <div class="wz-step" data-step="2">
                    <div class="wz-step-bubble">2</div>
                    <div class="wz-step-name">Ubicación</div>
                    <div class="wz-step-line"></div>
                </div>
                <div class="wz-step" data-step="3">
                    <div class="wz-step-bubble">3</div>
                    <div class="wz-step-name">Pago</div>
                    <div class="wz-step-line"></div>
                </div>
                <div class="wz-step" data-step="4">
                    <div class="wz-step-bubble">4</div>
                    <div class="wz-step-name">Resumen</div>
                </div>
            </div>

            <!-- Plan Seleccionado Banner -->
            <div id="wz-plan-banner" class="wz-plan-banner">
                <div class="wz-plan-banner-left">
                    <div class="wz-plan-banner-icon">
                        <i class="lexx lexx_check_ok"></i>
                    </div>
                    <div class="wz-plan-banner-text">
                        <span class="wz-plan-banner-title">Plan seleccionado</span>
                        <span id="wz-plan-desc" class="wz-plan-banner-desc">Emprendedor</span>
                    </div>
                </div>
                <div class="wz-plan-banner-right">
                    <div id="wz-btn-cambiar-plan" class="wz-btn-cambiar">
                        Cambiar plan <i class="lexx lexx_chevron_down"></i>
                    </div>
                    
                    <!-- Dropdown -->
                    <div id="wz-plan-dropdown" class="wz-plan-dropdown" style="display: none;">
                        <label class="wz-plan-item active">
                            <input type="radio" name="plan" value="Emprendedor" checked style="display: none;">
                            <div class="wz-plan-item-col">
                                <span class="wz-plan-item-title">Emprendedor</span>
                                <span class="wz-plan-item-price">$49.000 COP</span>
                            </div>
                            <i class="lexx lexx_check_ok wz-plan-item-check"></i>
                        </label>
                        <label class="wz-plan-item">
                            <input type="radio" name="plan" value="Plan Negocio" style="display: none;">
                            <div class="wz-plan-item-col">
                                <span class="wz-plan-item-title">Plan Negocio</span>
                                <span class="wz-plan-item-price">$99.000 COP</span>
                            </div>
                            <i class="lexx lexx_check_ok wz-plan-item-check" style="display: none;"></i>
                        </label>
                        <label class="wz-plan-item">
                            <input type="radio" name="plan" value="Plan Premium" style="display: none;">
                            <div class="wz-plan-item-col">
                                <span class="wz-plan-item-title">Plan Premium</span>
                                <span class="wz-plan-item-price">$199.000 COP</span>
                            </div>
                            <i class="lexx lexx_check_ok wz-plan-item-check" style="display: none;"></i>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Contenidos -->
            <div class="wz-content-container" style="min-height: 250px;">
                <!-- Paso 1: Personal -->
                <div class="wz-content" id="wz-step-1">
                    <div class="wz-form">
                        <div class="wz-row wz-row--full">
                            <label class="wz-label">Nombre completo <span class="wz-req">*</span></label>
                            <input type="text" class="wz-input" placeholder="Ej. Mario García">
                        </div>
                        <div class="wz-row">
                            <label class="wz-label">Correo electrónico <span class="wz-req">*</span></label>
                            <input type="email" class="wz-input" placeholder="correo@ejemplo.com">
                        </div>
                        <div class="wz-row">
                            <label class="wz-label">Teléfono <span class="wz-req">*</span></label>
                            <div class="wz-phone-group">
                                <div class="wz-phone-prefix">
                                    <span class="wz-code">+57</span>
                                </div>
                                <input type="text" class="wz-input wz-phone-input" placeholder="311 515 93 39">
                            </div>
                        </div>
                        <div class="wz-row">
                            <label class="wz-label">Tipo de documento</label>
                            <select class="wz-input">
                                <option>CC</option>
                                <option>NIT</option>
                                <option>CE</option>
                            </select>
                        </div>
                        <div class="wz-row">
                            <label class="wz-label">Número de documento <span class="wz-req">*</span></label>
                            <input type="text" id="wz-doc-numero" class="wz-input" placeholder="123456789">
                        </div>
                    </div>
                </div>

                <!-- Paso 2: Ubicación -->
                <div class="wz-content" id="wz-step-2" style="display: none;">
                    <div class="wz-form">
                        <div class="wz-row wz-row--full">
                            <label class="wz-label">Nombre del edificio <span class="wz-req">*</span></label>
                            <input type="text" class="wz-input" placeholder="Ej. Torres del Parque">
                        </div>
                        <div class="wz-row wz-row--full">
                            <label class="wz-label">Dirección <span class="wz-req">*</span></label>
                            <input type="text" class="wz-input" placeholder="Ej. Calle 26 # 13-45">
                        </div>
                        <div class="wz-row">
                            <label class="wz-label">Torre</label>
                            <input type="text" class="wz-input" placeholder="Ej. Torre 1">
                        </div>
                        <div class="wz-row">
                            <label class="wz-label">Bloque</label>
                            <input type="text" class="wz-input" placeholder="Ej. Bloque A">
                        </div>
                        <div class="wz-row wz-row--full">
                            <label class="wz-label">Observaciones</label>
                            <textarea class="wz-input wz-textarea" placeholder="Notas adicionales sobre la ubicación..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Paso 3: Pago -->
                <div class="wz-content" id="wz-step-3" style="display: none;">
                    <div class="wz-pago">
                        <div class="wz-section-label">Selecciona tu método de pago</div>
                        
                        <div class="wz-pago-opts">
                            <label class="wz-pago-opt active" data-method="tc">
                                <input type="radio" name="pago" value="tc" checked style="display: none;">
                                <i class="lexx lexx_card wz-pago-icon-tc"></i>
                                <div class="wz-pago-opt-text">
                                    <span class="wz-pago-label wz-pago-opt-title">Tarjeta de Crédito</span>
                                    <span class="wz-pago-opt-desc">Visa, Mastercard, Amex</span>
                                </div>
                            </label>
                            <label class="wz-pago-opt" data-method="pse">
                                <input type="radio" name="pago" value="pse" style="display: none;">
                                <div class="wz-pago-opt-text">
                                    <span class="wz-pago-label wz-pago-opt-title">Transferencia PSE</span>
                                    <span class="wz-pago-opt-desc">Débito bancario seguro</span>
                                </div>
                            </label>
                        </div>

                        <!-- Formularios de Pago -->
                        <div class="wz-pago-details">
                            
                            <!-- Formulario Tarjeta -->
                            <div id="form-pago-tc" class="wz-form">
                                <div class="wz-row wz-row--full">
                                    <label class="wz-label">Número de la tarjeta <span class="wz-req">*</span></label>
                                    <div class="wz-input-wrapper">
                                        <input type="text" class="wz-input wz-input-card" placeholder="0000 0000 0000 0000" maxlength="19">
                                        <i class="lexx lexx_card wz-icon-card"></i>
                                    </div>
                                </div>
                                <div class="wz-row">
                                    <label class="wz-label">Fecha de exp. <span class="wz-req">*</span></label>
                                    <input type="text" class="wz-input wz-input-mono" placeholder="MM/AA" maxlength="5">
                                </div>
                                <div class="wz-row">
                                    <label class="wz-label">CVC <span class="wz-req">*</span></label>
                                    <input type="text" class="wz-input wz-input-mono" placeholder="123" maxlength="4">
                                </div>
                                <div class="wz-row wz-row--full">
                                    <label class="wz-label">Nombre en la tarjeta <span class="wz-req">*</span></label>
                                    <input type="text" class="wz-input" placeholder="Ej. Mario García">
                                </div>
                            </div>
                            
                            <!-- Formulario PSE -->
                            <div id="form-pago-pse" class="wz-form" style="display: none;">
                                <div class="wz-row wz-row--full">
                                    <label class="wz-label">Banco <span class="wz-req">*</span></label>
                                    <select class="wz-input">
                                        <option value="">Selecciona tu banco</option>
                                        <option value="bancolombia">Bancolombia</option>
                                        <option value="davivienda">Davivienda</option>
                                        <option value="bogota">Banco de Bogotá</option>
                                        <option value="nequi">Nequi</option>
                                        <option value="daviplata">Daviplata</option>
                                    </select>
                                </div>
                                <div class="wz-row">
                                    <label class="wz-label">Tipo de persona <span class="wz-req">*</span></label>
                                    <select class="wz-input">
                                        <option>Natural</option>
                                        <option>Jurídica</option>
                                    </select>
                                </div>
                                <div class="wz-row">
                                    <label class="wz-label">Documento <span class="wz-req">*</span></label>
                                    <input type="text" id="wz-pse-documento" class="wz-input" placeholder="123456789">
                                </div>
                                <div class="wz-row wz-row--full wz-secure-box-wrap">
                                    <div class="wz-secure-box">
                                        <i class="lexx lexx_shield_check wz-secure-icon"></i>
                                        <div class="wz-secure-text">
                                            <strong class="wz-secure-title">Pago 100% Seguro</strong>
                                            Serás redirigido al portal oficial de PSE para completar tu transacción de manera encriptada.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Paso 4: Resumen -->
                <div class="wz-content" id="wz-step-4" style="display: none;">
                    <div class="wz-resumen-box">
                        <div class="wz-resumen-icon-wrap">
                            <i class="lexx lexx_check_ok wz-resumen-icon"></i>
                        </div>
                        <h3 class="wz-resumen-title">¡Campaña creada con éxito!</h3>
                        <p class="wz-resumen-desc">El pago ha sido procesado. Aquí tienes el resumen de tu orden.</p>
                        
                        <div class="wz-resumen-card">
                            <div class="wz-resumen-row">
                                <span class="wz-resumen-label">Plan contratado</span>
                                <span class="wz-resumen-val" id="wz-resumen-plan-nombre">Emprendedor</span>
                            </div>
                            <div class="wz-resumen-row">
                                <span class="wz-resumen-label">Pagado con</span>
                                <span class="wz-resumen-val" id="wz-resumen-pago-metodo">Tarjeta de Crédito</span>
                            </div>
                            <div class="wz-resumen-row">
                                <span class="wz-resumen-label">Total pagado</span>
                                <span class="wz-resumen-val-total" id="wz-resumen-plan-precio">$49.000 COP</span>
                            </div>
                        </div>

                        <div class="wz-resumen-actions">
                            <button type="button" class="wz-btn-download-link">
                                <i class="lexx lexx_download"></i> Descargar comprobante
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botones Footer -->
            <div class="wz-footer">
                <button class="modal-btn modal-btn--secondary" id="wz-btn-prev" style="display: none;">Anterior</button>
                <button class="modal-btn modal-btn--primary" id="wz-btn-next">Siguiente</button>
            </div>
        </div>`;
  }

  function initWizard() {
    // Lógica del Dropdown de Planes
    _("#wz-btn-cambiar-plan").on("click", function (e) {
      e.stopPropagation();
      const dropdown = _("#wz-plan-dropdown");
      if (dropdown.css("display") === "none") {
        dropdown.show();
      } else {
        dropdown.hide();
      }
    });

    // Ocultar dropdown al hacer click fuera
    _("body").on("click", function () {
      const dropdown = _("#wz-plan-dropdown");
      if (dropdown) dropdown.hide();
    });

    _(".wz-plan-item").each(function (idx, item) {
      _(item).on("click", function (e) {
        // Evitamos procesar el click proveniente directamente del radio input para no duplicar
        if (e.target.tagName === "INPUT") return;

        // Restablecer todas las clases activas
        _(".wz-plan-item").removeClass("active");

        // Ocultar todos los checks usando lexx.js
        _(".wz-plan-item-check").each(function (i, icon) {
          _(icon).css("display", "none");
        });

        // Activar la clase en el elemento actual
        _(this).addClass("active");

        // Mostrar el check del elemento actual
        _(this).find(".wz-plan-item-check").css("display", "block");

        // Marcar el radio input y actualizar el banner
        const radio = _(this).find('input[type="radio"]');
        if (radio && radio.length > 0) {
          radio[0].checked = true;
          _("#wz-plan-desc").text(radio[0].value);
        }

        // Ocultar al cambiar
        setTimeout(() => {
          _("#wz-plan-dropdown").hide();
        }, 100);
      });
    });

    // Evento opciones de pago
    _(".wz-pago-opt").each(function (idx, opt) {
      _(opt).on("click", function () {
        _(".wz-pago-opt").removeClass("active");
        _(this).addClass("active");

        const method = _(this).attr("data-method");
        _("#form-pago-tc").hide();
        _("#form-pago-pse").hide();
        _("#form-pago-" + method).show();

        // Si selecciona PSE, pre-llenar documento si está vacío
        if (method === "pse") {
          syncDocumentoToPse();
        }
      });
    });

    _("#wz-btn-next").on("click", function () {
      if (currentStep < totalSteps) {
        goToStep(currentStep + 1);
      } else {
        const nameInput = document.querySelectorAll('#wz-step-1 .wz-input');
        const campNombre = nameInput && nameInput.length > 0 && nameInput[0].value
            ? nameInput[0].value
            : "Campaña sin nombre";

        const planInput = document.querySelector('input[name="plan"]:checked');
        const planNombre = planInput ? planInput.value : "Emprendedor";

        const edificioInputs = document.querySelectorAll('#wz-step-2 .wz-input');
        const campEdificio = edificioInputs && edificioInputs.length > 0 && edificioInputs[0].value
            ? edificioInputs[0].value
            : "Edificio no especificado";

        const direccionVal = edificioInputs && edificioInputs.length > 1 ? edificioInputs[1].value : '';
        const torreVal = edificioInputs && edificioInputs.length > 2 ? edificioInputs[2].value : '';
        const bloqueVal = edificioInputs && edificioInputs.length > 3 ? edificioInputs[3].value : '';
        const observacionesVal = document.querySelector('#wz-step-2 .wz-textarea')?.value || '';
        const pagoMetodoVal = document.querySelector('.wz-pago-opt.active')?.getAttribute('data-method') || 'tc';

        const isDashboard = window.location.pathname.includes("digital");

        if (isDashboard) {
          // Guardar directamente en la base de datos MySQL
          fetch('../api/campanas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: campNombre,
              edificio: campEdificio,
              plan: planNombre,
              direccion: direccionVal,
              torre: torreVal,
              bloque: bloqueVal,
              observaciones: observacionesVal,
              pago_metodo: pagoMetodoVal
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              if (window.updateCampaignBadge) window.updateCampaignBadge();
              Modal.close();
              setTimeout(() => {
                if (typeof ImagenesModal !== "undefined") {
                  ImagenesModal.open();
                }
              }, 300);
            } else {
              alert(data.message || "Error al crear campaña en la base de datos.", "Error");
            }
          })
          .catch(err => {
            console.error(err);
            alert("Error al conectar con la base de datos para guardar la campaña.", "Error");
          });
        } else {
          // Landing page: Guardar temporalmente en localStorage para sincronizar al loguearse
          let appCampaigns = [];
          try {
            appCampaigns = JSON.parse(localStorage.getItem("AppCampaigns") || "[]");
          } catch (e) {
            appCampaigns = [];
          }

          appCampaigns.push({
            id: "temp_" + Date.now(),
            nombre: campNombre,
            edificio: campEdificio,
            plan: planNombre,
            direccion: direccionVal,
            torre: torreVal,
            bloque: bloqueVal,
            observaciones: observacionesVal,
            pago_metodo: pagoMetodoVal,
            fecha: new Date().toLocaleDateString()
          });

          localStorage.setItem("AppCampaigns", JSON.stringify(appCampaigns));
          localStorage.setItem("LandingCampaignPending", "true");

          if (window.updateCampaignBadge) window.updateCampaignBadge();

          if (typeof AuthModal !== "undefined") {
            AuthModal.open("login");
          } else {
            Modal.close();
          }
        }
      }
    });

    _("#wz-btn-prev").on("click", function () {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  function syncDocumentoToPse() {
    const docOrigen = document.getElementById("wz-doc-numero");
    const docDestino = document.getElementById("wz-pse-documento");
    if (docOrigen && docDestino && docOrigen.value && !docDestino.value) {
      docDestino.value = docOrigen.value;
    }
  }

  function goToStep(step) {
    currentStep = step;

    // Ocultar todos los contenidos
    _(".wz-content").hide();
    // Mostrar el contenido actual
    _("#wz-step-" + currentStep).show();

    // Actualizar UI de los pasos (burbujas y líneas)
    _(".wz-step").each(function (idx, el) {
      const elStep = parseInt(_(el).attr("data-step"));
      _(el).removeClass("active").removeClass("done");

      if (elStep < currentStep) {
        _(el).addClass("done");
      } else if (elStep === currentStep) {
        _(el).addClass("active");
      }
    });

    // Ocultar banner de plan en el último paso (Resumen) y actualizar datos
    const planBanner = _("#wz-plan-banner");
    if (planBanner && planBanner.length > 0) {
      if (currentStep === 4) {
        planBanner.css("display", "none");

        // Extraer datos para el resumen
        const planInput = _('input[name="plan"]:checked');
        const planNombre =
          planInput && planInput.length > 0
            ? planInput[0].value
            : "Emprendedor";

        // Buscar precio asociado a ese plan
        let planPrecio = "$49.000 COP";
        const priceEl = _(".wz-plan-item.active .wz-plan-item-price");
        if (priceEl && priceEl.length > 0) {
          planPrecio = _(priceEl[0]).text();
        }

        const pagoOpt = _(".wz-pago-opt.active .wz-pago-opt-title");
        const pagoMetodo =
          pagoOpt && pagoOpt.length > 0 ? _(pagoOpt[0]).text() : "No definido";

        // Actualizar la tarjeta de resumen
        _("#wz-resumen-plan-nombre").text(planNombre);
        _("#wz-resumen-plan-precio").text(planPrecio);
        _("#wz-resumen-pago-metodo").text(pagoMetodo);
      } else {
        planBanner.css("display", "flex");
      }
    }

    // Actualizar botones
    if (currentStep === 1) {
      _("#wz-btn-prev").hide();
      _("#wz-btn-next").text("Siguiente");
    } else if (currentStep === 3) {
      _("#wz-btn-prev").show();
      _("#wz-btn-next").text("Pagar y Crear");
      syncDocumentoToPse();
    } else if (currentStep === 4) {
      _("#wz-btn-prev").hide();
      _("#wz-btn-next").text("Finalizar");
    } else {
      _("#wz-btn-prev").show();
      _("#wz-btn-next").text("Siguiente");
    }
  }

  return { open };
})();
