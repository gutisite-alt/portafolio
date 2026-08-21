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

  const googleIcon = `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

  function getLoginHtml(entryClass = "fade-in") {
    return `
        <div class="auth-split-layout ${entryClass}">
            <div class="auth-form-side">
                <div class="auth-form-header">
                    <h2 class="auth-main-title">Iniciar sesión</h2>
                    <p class="auth-subtitle">Ingresa a tu cuenta para gestionar tus campañas publicitarias.</p>
                </div>
                
                <button class="auth-social-btn google-btn">
                    ${googleIcon} Continuar con Google
                </button>
                
                <div class="auth-divider"><span>O ingresa con tu correo</span></div>

                <div class="auth-form">
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
                <div class="brand-content">
                    <i class="lexx lexx_play brand-logo-icon"></i>
                    <h3>Control total sobre tus pantallas.</h3>
                    <p>Gestiona, programa y despliega contenido en tiempo real con PantallaYA.</p>
                </div>
                <div class="brand-glass-overlay"></div>
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
                
                <button class="auth-social-btn google-btn">
                    ${googleIcon} Registrarse con Google
                </button>
                
                <div class="auth-divider"><span>O regístrate con tu correo</span></div>

                <div class="auth-form">
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
                <div class="brand-content">
                    <i class="lexx lexx_rocket brand-logo-icon"></i>
                    <h3>Lleva tu publicidad al siguiente nivel.</h3>
                    <p>Conecta con tu audiencia de manera dinámica. Sube tus recursos, organiza tus listas y transmite en segundos.</p>
                </div>
                <div class="brand-glass-overlay"></div>
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

  function login() {
    const emailInput = document.querySelector('.auth-form-side input[type="email"]');
    const passwordInput = document.querySelector('.auth-form-side input[type="password"]');
    
    if (!emailInput || !passwordInput) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      alert("Por favor completa todos los campos.", "Error");
      return;
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
        if (!isDashboard) {
          window.location.href = "digital/index.html";
        } else {
          Modal.close();
          window.location.reload();
        }
      } else {
        alert(data.message || "Error al iniciar sesión", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Ocurrió un error al procesar el inicio de sesión.", "Error");
    });
  }

  function register() {
    const nameInput = document.querySelector('.auth-form-side input[type="text"]');
    const emailInput = document.querySelector('.auth-form-side input[type="email"]');
    const passwordInput = document.querySelector('.auth-form-side input[type="password"]');
    
    if (!nameInput || !emailInput || !passwordInput) return;
    const nombre = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!nombre || !email || !password) {
      alert("Por favor completa todos los campos.", "Error");
      return;
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
        if (!isDashboard) {
          window.location.href = "digital/index.html";
        } else {
          Modal.close();
          window.location.reload();
        }
      } else {
        alert(data.message || "Error al registrar el usuario", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Ocurrió un error al procesar el registro.", "Error");
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
