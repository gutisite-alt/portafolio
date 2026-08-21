(() => {
            "use strict";

            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            const finePointer = window.matchMedia("(pointer: fine)").matches;

            /* =======================================================
               CURSOR
               ======================================================= */

            const cursor = document.querySelector(".cursor");
            const cursorDot = document.querySelector(".cursor__dot");
            const cursorText = document.querySelector(".cursor__text");
            const cursorRing = document.querySelector(".cursor-ring");

            if (
                cursor &&
                cursorDot &&
                cursorText &&
                cursorRing &&
                finePointer &&
                !prefersReducedMotion
            ) {
                document.body.classList.add("cursor-enabled");

                const pointer = {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                };

                const follower = {
                    x: pointer.x,
                    y: pointer.y
                };

                const FOLLOW_SPEED = 0.18;
                let visible = false;

                function showCursor() {
                    if (visible) return;
                    visible = true;
                    cursor.classList.add("is-visible");
                    cursorRing.classList.add("is-visible");
                }

                function resetCursor() {
                    cursorText.textContent = "";
                    cursor.classList.remove("has-text", "is-link");
                }

                function hideCursor() {
                    visible = false;
                    cursor.classList.remove("is-visible");
                    cursorRing.classList.remove("is-visible");
                    resetCursor();
                }

                window.addEventListener(
                    "pointermove",
                    (event) => {
                        pointer.x = event.clientX;
                        pointer.y = event.clientY;
                        showCursor();
                    },
                    { passive: true }
                );

                document.addEventListener("mouseleave", hideCursor);
                window.addEventListener("blur", hideCursor);

                function animateCursor() {
                    follower.x += (pointer.x - follower.x) * FOLLOW_SPEED;
                    follower.y += (pointer.y - follower.y) * FOLLOW_SPEED;

                    const dx = pointer.x - follower.x;
                    const dy = pointer.y - follower.y;
                    const distance = Math.hypot(dx, dy);
                    const stretch = Math.min(distance * 0.012, 0.36);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    cursor.style.transform =
                        `translate3d(${follower.x}px, ${follower.y}px, 0)`;

                    cursorRing.style.transform =
                        `translate3d(${follower.x}px, ${follower.y}px, 0) ` +
                        `translate(-50%, -50%)`;

                    const hasText = cursor.classList.contains("has-text");
                    const appliedStretch = hasText ? 0 : stretch;
                    const appliedAngle = hasText ? 0 : angle;

                    cursorDot.style.transform =
                        `translate(-50%, -50%) rotate(${appliedAngle}deg) ` +
                        `scale(${1 + appliedStretch}, ${1 - appliedStretch * 0.45})`;

                    requestAnimationFrame(animateCursor);
                }

                animateCursor();

                document.querySelectorAll("[data-cursor-text]").forEach((element) => {
                    element.addEventListener("mouseenter", () => {
                        const label = element.dataset.cursorText?.trim();
                        if (!label) return;

                        cursorText.textContent = label;
                        cursor.classList.add("has-text");
                    });

                    element.addEventListener("mouseleave", () => {
                        cursorText.textContent = "";
                        cursor.classList.remove("has-text");
                    });
                });

                document
                    .querySelectorAll("a:not([data-cursor-text]), button:not([data-cursor-text])")
                    .forEach((element) => {
                        element.addEventListener("mouseenter", () => {
                            cursor.classList.add("is-link");
                        });

                        element.addEventListener("mouseleave", () => {
                            cursor.classList.remove("is-link");
                        });
                    });
            }

            /* =======================================================
               LUPA
               ======================================================= */

            document.querySelectorAll("[data-magnifier]").forEach((zone) => {
                const source = zone.querySelector(".text-magnifier__source");
                const lens = zone.querySelector(".text-magnifier__lens");

                if (!source || !lens || !finePointer) return;

                const copy = source.cloneNode(true);
                copy.className = "text-magnifier__copy";
                copy.setAttribute("aria-hidden", "true");
                lens.appendChild(copy);

                const scale = Number.parseFloat(zone.dataset.scale) || 2;
                let lensRadius = lens.offsetWidth / 2;

                function syncCopy() {
                    const sourceRect = source.getBoundingClientRect();
                    copy.style.width = `${sourceRect.width}px`;
                    lensRadius = lens.offsetWidth / 2;
                }

                function moveLens(event) {
                    const zoneRect = zone.getBoundingClientRect();
                    const sourceRect = source.getBoundingClientRect();

                    const localX = event.clientX - zoneRect.left;
                    const localY = event.clientY - zoneRect.top;
                    const textX = event.clientX - sourceRect.left;
                    const textY = event.clientY - sourceRect.top;

                    lens.style.left = `${localX}px`;
                    lens.style.top = `${localY}px`;

                    copy.style.transform =
                        `translate3d(${lensRadius - textX * scale}px, ` +
                        `${lensRadius - textY * scale}px, 0) scale(${scale})`;
                }

                zone.addEventListener("pointerenter", (event) => {
                    syncCopy();
                    zone.classList.add("is-active");
                    document.body.classList.add("is-magnifying");
                    moveLens(event);
                });

                zone.addEventListener("pointermove", moveLens);

                zone.addEventListener("pointerleave", () => {
                    zone.classList.remove("is-active");
                    document.body.classList.remove("is-magnifying");
                });

                window.addEventListener("resize", syncCopy, { passive: true });
                syncCopy();
            });

            /* =======================================================
               BOTÓN MAGNÉTICO
               ======================================================= */

            document.querySelectorAll(".magnetic").forEach((element) => {
                element.addEventListener("pointermove", (event) => {
                    const rect = element.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    element.style.setProperty(
                        "--mx",
                        `${(event.clientX - centerX) * 0.18}px`
                    );

                    element.style.setProperty(
                        "--my",
                        `${(event.clientY - centerY) * 0.18}px`
                    );
                });

                element.addEventListener("pointerleave", () => {
                    element.style.setProperty("--mx", "0px");
                    element.style.setProperty("--my", "0px");
                });
            });

            /* =======================================================
               REVEALS
               ======================================================= */

            const revealItems = document.querySelectorAll("[data-reveal]");

            if (prefersReducedMotion) {
                revealItems.forEach((item) => item.classList.add("is-in-view"));
            } else if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver(
                    (entries, currentObserver) => {
                        entries.forEach((entry) => {
                            if (!entry.isIntersecting) return;
                            entry.target.classList.add("is-in-view");
                            currentObserver.unobserve(entry.target);
                        });
                    },
                    {
                        threshold: 0.14,
                        rootMargin: "0px 0px -8% 0px"
                    }
                );

                revealItems.forEach((item) => observer.observe(item));
            } else {
                revealItems.forEach((item) => item.classList.add("is-in-view"));
            }

            /* =======================================================
               MOTOR DE SCROLL
               ======================================================= */

            const nav = document.querySelector(".nav");
            const progressBar = document.querySelector(".scroll-progress__bar");

            const hero = document.querySelector(".hero");
            const heroSticky = document.querySelector(".hero__sticky");
            const intro = document.querySelector(".intro");

            const projects = document.querySelector(".projects");
            const projectsTrack = document.querySelector(".projects__track");
            const projectCards = [...document.querySelectorAll(".project-card")];
            const sceneCounter = document.querySelector("[data-scene-counter]");

            const manifesto = document.querySelector(".manifesto");
            const finale = document.querySelector(".finale");

            let horizontalDistance = 0;
            let ticking = false;

            function clamp(value, min = 0, max = 1) {
                return Math.min(Math.max(value, min), max);
            }

            function sectionProgress(section) {
                if (!section) return 0;

                const rect = section.getBoundingClientRect();
                const travel = rect.height - window.innerHeight;

                if (travel <= 0) {
                    return clamp(-rect.top / Math.max(rect.height, 1));
                }

                return clamp(-rect.top / travel);
            }

            function viewportProgress(section) {
                if (!section) return 0;

                const rect = section.getBoundingClientRect();
                const total = window.innerHeight + rect.height;

                return clamp((window.innerHeight - rect.top) / total);
            }

            function measureHorizontal() {
                if (!projectsTrack) return;

                horizontalDistance = Math.max(
                    projectsTrack.scrollWidth - window.innerWidth,
                    0
                );
            }

            function updateCards() {
                projectCards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    const center = rect.left + rect.width / 2;
                    const normalized =
                        (center - window.innerWidth / 2) / window.innerWidth;

                    const absolute = Math.min(Math.abs(normalized), 1.4);
                    const rotate = clamp(normalized * -10, -12, 12);
                    const scale = 1 - absolute * 0.07;
                    const opacity = 1 - absolute * 0.52;

                    card.style.setProperty("--rotate", `${rotate}deg`);
                    card.style.setProperty("--scale", scale.toFixed(3));
                    card.style.setProperty("--opacity", opacity.toFixed(3));

                    const visual = card.querySelector(".project-card__visual");

                    if (visual) {
                        visual.style.setProperty("--bg-x", `${normalized * -34}px`);
                        visual.style.setProperty("--bg-y", `${normalized * 12}px`);
                    }
                });
            }

            function updateScroll() {
                const scrollTop =
                    window.scrollY || document.documentElement.scrollTop;

                const scrollable =
                    document.documentElement.scrollHeight - window.innerHeight;

                nav?.classList.toggle("is-scrolled", scrollTop > 24);

                if (progressBar) {
                    const progress = scrollable > 0 ? scrollTop / scrollable : 0;
                    progressBar.style.transform = `scaleX(${clamp(progress)})`;
                }

                if (hero && heroSticky) {
                    heroSticky.style.setProperty(
                        "--hero-progress",
                        sectionProgress(hero).toFixed(4)
                    );
                }

                if (intro) {
                    intro.style.setProperty(
                        "--intro-progress",
                        viewportProgress(intro).toFixed(4)
                    );
                }

                if (projects && projectsTrack) {
                    const progress = sectionProgress(projects);
                    const translateX = -horizontalDistance * progress;

                    projectsTrack.style.transform =
                        `translate3d(${translateX}px, 0, 0)`;

                    const activeScene = Math.min(
                        projectCards.length,
                        Math.floor(progress * projectCards.length) + 1
                    );

                    if (sceneCounter) {
                        sceneCounter.textContent =
                            String(activeScene).padStart(2, "0");
                    }

                    updateCards();
                }

                if (manifesto) {
                    manifesto.style.setProperty(
                        "--manifest-progress",
                        viewportProgress(manifesto).toFixed(4)
                    );
                }

                if (finale) {
                    finale.style.setProperty(
                        "--final-progress",
                        viewportProgress(finale).toFixed(4)
                    );
                }

                ticking = false;
            }

            function requestUpdate() {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(updateScroll);
            }

            /*
             * Activa una entrada elegante del hero cuando el documento ya está listo.
             */
            requestAnimationFrame(() => {
                document.body.classList.add("is-ready");
            });

            measureHorizontal();
            updateScroll();

            window.addEventListener("scroll", requestUpdate, {
                passive: true
            });

            window.addEventListener(
                "resize",
                () => {
                    measureHorizontal();
                    requestUpdate();
                },
                { passive: true }
            );


            /* =======================================================
               SELECTOR Y MEMORIA DEL TEMA
               ======================================================= */

            const themeToggle = document.querySelector(".theme-toggle");
            const themeToggleIcon = document.querySelector(
                ".theme-toggle__icon"
            );
            const themeToggleText = document.querySelector(
                ".theme-toggle__text"
            );

            function applyTheme(theme, persist = true) {
                const isDark = theme === "dark";

                document.body.classList.add("theme-changing");
                document.body.classList.toggle("theme-dark", isDark);
                document.body.dataset.theme = theme;

                if (themeToggle) {
                    themeToggle.setAttribute(
                        "aria-pressed",
                        String(isDark)
                    );
                    themeToggle.setAttribute(
                        "aria-label",
                        isDark
                            ? "Cambiar a tema claro"
                            : "Cambiar a tema oscuro"
                    );
                }

                if (themeToggleIcon) {
                    themeToggleIcon.textContent = isDark ? "☾" : "☼";
                }

                if (themeToggleText) {
                    themeToggleText.textContent = isDark
                        ? "Oscuro"
                        : "Claro";
                }

                if (persist) {
                    try {
                        localStorage.setItem(
                            "harold-portfolio-theme",
                            theme
                        );
                    } catch {
                        // La interfaz funciona aunque el navegador bloquee storage.
                    }
                }

                window.setTimeout(() => {
                    document.body.classList.remove("theme-changing");
                }, 460);
            }

            const initialTheme =
                document.body.dataset.theme === "light"
                    ? "light"
                    : "dark";

            applyTheme(initialTheme, false);

            themeToggle?.addEventListener("click", () => {
                const nextTheme = document.body.classList.contains(
                    "theme-dark"
                )
                    ? "light"
                    : "dark";

                applyTheme(nextTheme);
            });


            /* =======================================================
               NAVEGACIÓN ANCLA CON ANIMACIÓN
               ======================================================= */

            const anchorLinks = document.querySelectorAll(
                'a[href^="#"]:not([href="#"])'
            );

            let activeAnchorAnimation = null;

            function easeInOutCubic(progress) {
                return progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            }

            function getHeaderOffset() {
                const header = document.querySelector(".nav");
                return header ? header.getBoundingClientRect().height + 18 : 0;
            }

            function animateToAnchor(target, hash) {
                if (!target) return;

                if (activeAnchorAnimation) {
                    cancelAnimationFrame(activeAnchorAnimation);
                    activeAnchorAnimation = null;
                }

                const startY = window.scrollY;
                const targetY = Math.max(
                    0,
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    getHeaderOffset()
                );

                const distance = targetY - startY;

                if (
                    prefersReducedMotion ||
                    Math.abs(distance) < 2
                ) {
                    window.scrollTo(0, targetY);

                    if (hash) {
                        history.pushState(null, "", hash);
                    }

                    target.focus?.({ preventScroll: true });
                    return;
                }

                const duration = Math.min(
                    1200,
                    Math.max(620, Math.abs(distance) * 0.62)
                );

                const startTime = performance.now();

                document.documentElement.classList.add("is-anchor-scrolling");
                document.body.classList.add("is-anchor-scrolling");

                function step(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easedProgress = easeInOutCubic(progress);

                    window.scrollTo(0, startY + distance * easedProgress);

                    if (progress < 1) {
                        activeAnchorAnimation = requestAnimationFrame(step);
                        return;
                    }

                    activeAnchorAnimation = null;
                    document.documentElement.classList.remove("is-anchor-scrolling");
                    document.body.classList.remove("is-anchor-scrolling");

                    if (hash) {
                        history.pushState(null, "", hash);
                    }

                    target.focus?.({ preventScroll: true });
                }

                activeAnchorAnimation = requestAnimationFrame(step);
            }

            anchorLinks.forEach((link) => {
                link.addEventListener("click", (event) => {
                    const hash = link.getAttribute("href");

                    if (!hash || hash === "#") return;

                    let target;

                    try {
                        target = document.querySelector(hash);
                    } catch {
                        return;
                    }

                    if (!target) return;

                    event.preventDefault();
                    animateToAnchor(target, hash);
                });
            });

            /*
             * Permite cancelar la animación manualmente si el usuario usa
             * rueda, teclado o pantalla táctil durante el recorrido.
             */
            const cancelAnchorAnimation = () => {
                if (!activeAnchorAnimation) return;

                cancelAnimationFrame(activeAnchorAnimation);
                activeAnchorAnimation = null;

                document.documentElement.classList.remove("is-anchor-scrolling");
                document.body.classList.remove("is-anchor-scrolling");
            };

            window.addEventListener("wheel", cancelAnchorAnimation, {
                passive: true
            });

            window.addEventListener("touchstart", cancelAnchorAnimation, {
                passive: true
            });

            window.addEventListener("keydown", (event) => {
                const cancelKeys = [
                    "ArrowUp",
                    "ArrowDown",
                    "PageUp",
                    "PageDown",
                    "Home",
                    "End",
                    " "
                ];

                if (cancelKeys.includes(event.key)) {
                    cancelAnchorAnimation();
                }
            });

            /*
             * Si la página se abre con un hash, posiciona la sección
             * correctamente debajo del header una vez cargado el layout.
             */
            if (window.location.hash) {
                requestAnimationFrame(() => {
                    const initialTarget = document.querySelector(
                        window.location.hash
                    );

                    if (initialTarget) {
                        animateToAnchor(initialTarget, null);
                    }
                });
            }

        })();

