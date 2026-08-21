/**
 * Modal: Autenticación (Login / Registro)
 * Abre con: AuthModal.open('login') o AuthModal.open('register')
 */
const AuthModal = (() => {
  // Dirección entre vistas: login=0, register=1, forgot=2
  const viewOrder = { login: 0, register: 1, forgot: 2 };
  let currentView = null;

  function open(view = "login") {
    currentView = view;
    renderView(view, "fade-in");
  }

  function renderView(view, entryClass = "fade-in") {
    let contentHtml = "";
    let modalSize = "lg";

    if (view === "login") {
      contentHtml = getLoginHtml(entryClass);
    } else if (view === "forgot") {
      contentHtml = getForgotHtml(entryClass);
      modalSize = "md";
    } else {
      contentHtml = getRegisterHtml(entryClass);
    }

    Modal.open({
      title: "",
      size: modalSize,
      content: contentHtml,
      actions: [],
    });
  }

  function switchView(view) {
    const current = document.querySelector(
      ".auth-split-layout, .auth-single-layout",
    );
    const fromOrder = viewOrder[currentView] ?? 0;
    const toOrder = viewOrder[view] ?? 0;
    const goingForward = toOrder > fromOrder;

    const exitClass = goingForward ? "auth-exit-left" : "auth-exit-right";
    const entryClass = goingForward ? "auth-enter-right" : "auth-enter-left";

    if (current) {
      current.classList.add(exitClass);
      setTimeout(() => {
        currentView = view;
        renderView(view, entryClass);
      }, 230);
    } else {
      currentView = view;
      renderView(view, entryClass);
    }
  }

  const premiumSvg = `
    <svg viewBox="0 0 400 360" width="100%" height="240" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: auto; margin-top: auto; max-width: 320px;">
      <defs>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Perspective vertical lines -->
      <line x1="60" y1="20" x2="60" y2="340" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <line x1="340" y1="20" x2="340" y2="340" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      
      <!-- Back glow -->
      <circle class="anim-glow" cx="200" cy="170" r="80" fill="url(#glowGrad)" filter="url(#glow)" />
      
      <!-- Isometric Sleek Digital Display -->
      <g>
        <!-- Shadow -->
        <rect x="142" y="72" width="116" height="196" rx="14" fill="rgba(0,0,0,0.5)" filter="url(#glow)" />
        
        <!-- Outer Frame -->
        <rect x="138" y="60" width="124" height="200" rx="16" fill="#1e293b" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
        <rect x="143" y="65" width="114" height="190" rx="11" fill="#0f172a" />
        
        <!-- Screen Active Area -->
        <rect x="146" y="68" width="108" height="184" rx="8" fill="url(#screenGrad)" />
        
        <!-- UI Elements inside screen -->
        <!-- Waves / Ad progress -->
        <path class="anim-wave" d="M 154,210 C 170,195 180,225 205,185 C 220,165 235,200 246,170" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)" />
        <circle cx="205" cy="185" r="3.5" fill="#ffffff" />
        <circle cx="246" cy="170" r="3.5" fill="#ffffff" />
        
        <!-- Play / Broadcast symbol -->
        <g class="anim-play">
          <circle cx="200" cy="120" r="20" fill="rgba(255,255,255,0.18)" />
          <polygon points="196,111 196,129 211,120" fill="#ffffff" />
        </g>
        
        <!-- Minimal text indicators -->
        <rect x="165" y="85" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
        <rect x="185" y="92" width="30" height="2.5" rx="1.2" fill="rgba(255,255,255,0.2)" />
        
        <!-- Status Bar -->
        <rect x="156" y="238" width="8" height="8" rx="1.5" fill="#10b981" />
        <rect x="168" y="240" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
        <circle cx="236" cy="242" r="2.5" fill="rgba(255,255,255,0.4)" />
      </g>
      
      <!-- Float reach bubble left -->
      <g class="anim-bubble-1" transform="translate(85, 100)" filter="url(#glow)">
        <circle cx="0" cy="0" r="15" fill="#3b82f6" />
        <path d="M -5,-3 L 5,-3 M -5,1 L 5,1 M -5,5 L 1,5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
      </g>
      
      <!-- Float reach bubble right -->
      <g class="anim-bubble-2" transform="translate(315, 200)" filter="url(#glow)">
        <circle cx="0" cy="0" r="14" fill="#10b981" />
        <path d="M -4,0 L -1,3 L 4,-2" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>
  `;

  function getLoginHtml(entryClass = "fade-in") {
    return `
        <div class="auth-split-layout ${entryClass}">
            <div class="auth-form-side">
                <div class="auth-form-header">
                    <h2 class="auth-main-title">Iniciar sesión</h2>
                    <p class="auth-subtitle">Ingresa a tu cuenta para gestionar tus campañas publicitarias.</p>
                </div>
                
                <div class="auth-form">
                    <!-- Caja de error elegante -->
                    <div id="auth-error-box" class="auth-error-box" style="display: none;"></div>

                    <div class="wz-form-group">
                        <label class="wz-label">Correo electrónico</label>
                        <input type="email" class="wz-input">
                    </div>
                    <div class="wz-form-group" style="margin-bottom: 24px;">
                        <label class="wz-label flex justify_between">Contraseña <a href="#" class="auth-link-small" onclick="AuthModal.switchView('forgot'); return false;">¿Olvidaste tu contraseña?</a></label>
                        <input type="password" class="wz-input">
                    </div>
                    
                    <button class="auth-submit-btn" onclick="AuthModal.login()">Ingresar a mi cuenta</button>
                </div>
                
                <p class="auth-footer-text">
                    ¿No tienes una cuenta? <a href="#" class="auth-link" onclick="AuthModal.switchView('register'); return false;">Regístrate aquí</a>
                </p>
            </div>
            
            <div class="auth-brand-side">
                ${premiumSvg}
                <div class="brand-content">
                    <h3>Control total sobre tus pantallas.</h3>
                    <p>Gestiona, programa y despliega contenido en tiempo real con PantallaYA.</p>
                </div>
            </div>
        </div>`;
  }

  function getRegisterHtml(entryClass = "fade-in") {
    return `
        <div class="auth-split-layout ${entryClass}">
            <div class="auth-form-side">
                <div class="auth-form-header">
                    <h2 class="auth-main-title">Crea tu cuenta</h2>
                    <p class="auth-subtitle">Únete hoy y lanza tu primera campaña publicitaria en minutos.</p>
                </div>
                
                <div class="auth-form">
                    <!-- Caja de error elegante -->
                    <div id="auth-error-box" class="auth-error-box" style="display: none;"></div>

                    <div class="wz-form-group">
                        <label class="wz-label">Nombre completo</label>
                        <input type="text" class="wz-input">
                    </div>
                    <div class="wz-form-group">
                        <label class="wz-label">Correo electrónico</label>
                        <input type="email" class="wz-input">
                    </div>
                    <div class="wz-form-group" style="margin-bottom: 24px;">
                        <label class="wz-label">Contraseña</label>
                        <input type="password" class="wz-input">
                    </div>
                    
                    <button class="auth-submit-btn" onclick="AuthModal.register()">Crear cuenta</button>
                </div>
                
                <p class="auth-footer-text">
                    ¿Ya tienes una cuenta? <a href="#" class="auth-link" onclick="AuthModal.switchView('login'); return false;">Inicia sesión</a>
                </p>
            </div>
            
            <div class="auth-brand-side register-bg">
                ${premiumSvg}
                <div class="brand-content">
                    <h3>Lleva tu publicidad al siguiente nivel.</h3>
                    <p>Conecta con tu audiencia de manera dinámica. Sube tus recursos, organiza tus listas y transmite en segundos.</p>
                </div>
            </div>
        </div>`;
  }

  function getForgotHtml(entryClass = "fade-in") {
    return `
        <div class="auth-single-layout ${entryClass}">
            <div class="auth-form-side" style="border-radius: 20px;">
                <div class="auth-form-header">
                    <div style="display:inline-flex; align-items:center; justify-content:center; width: 56px; height: 56px; border-radius: 50%; background: #eff6ff; color: var(--accent); margin-bottom: 24px;">
                        <i class="lexx lexx_lock" style="font-size: 28px;"></i>
                    </div>
                    <h2 class="auth-main-title">Recuperar contraseña</h2>
                    <p class="auth-subtitle">Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecerla.</p>
                </div>
                
                <div class="auth-form">
                    <!-- Caja de error elegante -->
                    <div id="auth-error-box" class="auth-error-box" style="display: none;"></div>

                    <div class="wz-form-group">
                        <label class="wz-label">Correo electrónico</label>
                        <input type="email" class="wz-input" placeholder="tu@correo.com">
                    </div>
                    
                    <button class="auth-submit-btn" style="margin-top: 8px;" onclick="AuthModal.switchView('login')">Enviar enlace de recuperación</button>
                </div>
                
                <p class="auth-footer-text">
                    ¿Lo recordaste? <a href="#" class="auth-link" onclick="AuthModal.switchView('login'); return false;">Vuelve a iniciar sesión</a>
                </p>
            </div>
        </div>`;
  }

  function showFormError(message) {
    const errorBox = document.getElementById("auth-error-box");
    if (errorBox) {
      errorBox.innerHTML = `<i class="lexx lexx_alert_t"></i> <span>${message}</span>`;
      errorBox.style.display = "flex";
      errorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function login() {
    const emailInput = document.querySelector('.auth-form-side input[type="email"]');
    const passwordInput = document.querySelector('.auth-form-side input[type="password"]');
    const submitBtn = document.querySelector('.auth-form-side .auth-submit-btn');
    
    if (!emailInput || !passwordInput) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      showFormError("Por favor completa todos los campos.");
      return;
    }

    // Activar estado cargando del botón
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="auth-btn-spinner"></span> Ingresando...`;
      submitBtn.style.opacity = "0.7";
      submitBtn.style.cursor = "not-allowed";
    }
    
    const isDashboard = window.location.pathname.includes('/digital');
    const apiUrl = (isDashboard ? '../api/' : 'api/') + 'auth.php?action=login';
    
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="auth-btn-spinner"></span>`;
        }
        if (!isDashboard) {
          window.location.href = "digital/index.html";
        } else {
          Modal.close();
          window.location.reload();
        }
      } else {
        // Restablecer botón
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Ingresar a mi cuenta";
          submitBtn.style.opacity = "";
          submitBtn.style.cursor = "";
        }
        showFormError(data.message || "Error al iniciar sesión.");
      }
    })
    .catch(err => {
      console.error(err);
      // Restablecer botón
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Ingresar a mi cuenta";
        submitBtn.style.opacity = "";
        submitBtn.style.cursor = "";
      }
      showFormError("Ocurrió un error al procesar el inicio de sesión.");
    });
  }

  function register() {
    const nameInput = document.querySelector('.auth-form-side input[type="text"]');
    const emailInput = document.querySelector('.auth-form-side input[type="email"]');
    const passwordInput = document.querySelector('.auth-form-side input[type="password"]');
    const submitBtn = document.querySelector('.auth-form-side .auth-submit-btn');
    
    if (!nameInput || !emailInput || !passwordInput) return;
    const nombre = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!nombre || !email || !password) {
      showFormError("Por favor completa todos los campos.");
      return;
    }

    // Activar estado cargando del botón
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="auth-btn-spinner"></span> Registrando...`;
      submitBtn.style.opacity = "0.7";
      submitBtn.style.cursor = "not-allowed";
    }
    
    const isDashboard = window.location.pathname.includes('/digital');
    const apiUrl = (isDashboard ? '../api/' : 'api/') + 'auth.php?action=register';
    
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="auth-btn-spinner"></span>`;
        }
        if (!isDashboard) {
          window.location.href = "digital/index.html";
        } else {
          Modal.close();
          window.location.reload();
        }
      } else {
        // Restablecer botón
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Crear cuenta";
          submitBtn.style.opacity = "";
          submitBtn.style.cursor = "";
        }
        showFormError(data.message || "Error al registrar el usuario.");
      }
    })
    .catch(err => {
      console.error(err);
      // Restablecer botón
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Crear cuenta";
        submitBtn.style.opacity = "";
        submitBtn.style.cursor = "";
      }
      showFormError("Ocurrió un error al procesar el registro.");
    });
  }

  // Exponer métodos
  return {
    open,
    switchView,
    login,
    register
  };
})();
