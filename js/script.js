document.addEventListener("DOMContentLoaded", () => {
  /* --- Cache de Elementos DOM --- */
  const nav = document.getElementById("nav");
  const hamburger = document.querySelector(".nav-hamburger");
  const navLinks = document.querySelector(".nav-links");
  const langBtns = document.querySelectorAll(".lang-btn");
  const projects = document.querySelectorAll(".project");

  /* --- 1. Navegación: Scroll State --- */
  if (nav) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          nav.classList.toggle("scrolled", window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* --- 2. Navegación: Menú Hamburguesa --- */
  if (hamburger && navLinks) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !navLinks.classList.contains("open");
      navLinks.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);
      hamburger.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");

      const spans = hamburger.querySelectorAll("span");
      if (spans.length >= 2) {
        spans[0].style.transform = isOpen ? "rotate(45deg) translate(4.5px, 4.5px)" : "";
        spans[1].style.transform = isOpen ? "rotate(-45deg) translate(4.5px, -4.5px)" : "";
      }
    };

    hamburger.addEventListener("click", () => toggleMenu());

    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => toggleMenu(false));
    });
  }

  /* --- 3. Scroll Revelación (Intersection Observer) --- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* --- 4. Animación de Entrada del Hero --- */
  (function initHeroAnim() {
    const lines = document.querySelectorAll(".hero-name-line");
    const extras = document.querySelectorAll(".hero-tagline, .hero-disciplines, .hero-cta");

    const animateIn = () => {
      lines.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, 100 + i * 130);
      });
      extras.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, 500 + i * 90);
      });
    };

    requestAnimationFrame(animateIn);
  })();

  /* --- 5. Desplegables de Casos de Estudio (Acordeón) --- */
  function collapseCase(project) {
    const cs = project.querySelector(".js-case");
    const toggle = project.querySelector(".js-toggle");
    if (!cs) return;

    cs.style.height = cs.scrollHeight + "px";
    void cs.offsetHeight; // Forzar reflow para animación fluida

    requestAnimationFrame(() => {
      cs.style.height = "0";
    });

    project.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    cs.setAttribute("aria-hidden", "true");
  }

  function expandCase(project) {
    const cs = project.querySelector(".js-case");
    const toggle = project.querySelector(".js-toggle");
    if (!cs) return;

    project.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    cs.setAttribute("aria-hidden", "false");

    cs.style.height = cs.scrollHeight + "px";

    const onEnd = (e) => {
      if (e.propertyName === "height" && project.classList.contains("is-open")) {
        cs.style.height = "auto";
        cs.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => revealObserver.observe(el));
        cs.removeEventListener("transitionend", onEnd);
      }
    };

    cs.addEventListener("transitionend", onEnd);
  }

  document.querySelectorAll(".js-toggle").forEach((toggle) => {
    const handleToggle = () => {
      const project = toggle.closest(".project");
      if (!project) return;

      if (project.classList.contains("is-open")) {
        collapseCase(project);
      } else {
        expandCase(project);
      }
    };

    toggle.addEventListener("click", handleToggle);
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    });
  });

  /* --- 6. Scroll Suave para Botón Inferior de Cierre --- */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollTo(targetY, duration = 450, callback) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime = null;

    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
        if (callback) callback();
      }
    }

    requestAnimationFrame(step);
  }

  document.querySelectorAll(".js-close-case").forEach((button) => {
    button.addEventListener("click", () => {
      const project = button.closest(".project");
      if (!project) return;

      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 68;
      const targetTop = project.getBoundingClientRect().top + window.scrollY - navH + 40;

      smoothScrollTo(targetTop, 450, () => {
        collapseCase(project);
        const toggle = project.querySelector(".js-toggle");
        if (toggle) toggle.focus({ preventScroll: true });
      });
    });
  });

  /* --- 7. Sistema de Traducción e Internacionalización (i18n) --- */
  const originalStrings = new Map();

  // Guardar copia de respaldo del contenido HTML en español por defecto
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    originalStrings.set(el, el.innerHTML);
  });

  const originalAttrStrings = new Map();
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const attrData = el.getAttribute("data-i18n-attr");
    const [attr] = attrData.split(":");
    originalAttrStrings.set(el, { attr, value: el.getAttribute(attr) });
  });

  function getTranslation(lang, path) {
    if (lang === "es") return null;
    return path.split(".").reduce((obj, key) => obj && obj[key], translations[lang]);
  }

  function setLanguage(lang) {
    // Aplicar o restaurar contenidos con data-i18n
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (lang === "es") {
        if (originalStrings.has(el)) el.innerHTML = originalStrings.get(el);
      } else {
        const translation = getTranslation(lang, key);
        if (translation) el.innerHTML = translation;
      }
    });

    // Aplicar o restaurar atributos con data-i18n-attr
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const attrData = el.getAttribute("data-i18n-attr");
      const [attr, key] = attrData.split(":");

      if (lang === "es") {
        if (originalAttrStrings.has(el)) {
          const { attr: storedAttr, value } = originalAttrStrings.get(el);
          el.setAttribute(storedAttr, value);
        }
      } else {
        const translation = getTranslation(lang, key);
        if (translation) el.setAttribute(attr, translation);
      }
    });

    document.documentElement.lang = lang;

    // Actualizar estados visuales y accesibilidad (A11y) de los botones de idioma
    langBtns.forEach((btn) => {
      const isSelected = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    localStorage.setItem("preferred_lang", lang);
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      setLanguage(lang);
    });
  });

  // Cargar preferencia guardada
  const savedLang = localStorage.getItem("preferred_lang") || "es";
  if (savedLang !== "es") {
    setLanguage(savedLang);
  };

  /* --- 8. Rastreos e Interacciones de Google Analytics (GA4) --- */
  const trackedSections = document.querySelectorAll("section[id]");
  let currentSectionId = null;

  const gaObserverOptions = {
    root: null,
    threshold: 0.30
  };

  const gaObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;

        if (sectionId !== currentSectionId) {
          currentSectionId = sectionId;

          // Construir un nombre de sección descriptivo para GA4
          const sectionTitle = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

          if (typeof gtag === "function") {
            gtag("event", "page_view", {
              page_title: `Gabriel Nuila — ${sectionTitle}`,
              page_location: `${window.location.origin}${window.location.pathname}#${sectionId}`,
              page_path: `${window.location.pathname}#${sectionId}`
            });
          }
        }
      }
    });
  };

  const gaObserver = new IntersectionObserver(gaObserverCallback, gaObserverOptions);
  trackedSections.forEach((section) => gaObserver.observe(section));
});

document.addEventListener('DOMContentLoaded', () => {
  // Solo se activa en dispositivos sin puntero/ratón preciso (celulares y tablets)
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (isTouchDevice) {
    const elementsToObserve = document.querySelectorAll('.project-cover, .gallery-card');

    const observerOptions = {
      root: null,
      // Franja reducida al 30% central de la pantalla (35% arriba y abajo ignorados)
      rootMargin: '-35% 0px -35% 0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 1. Limpia la clase .is-active de todas las tarjetas para evitar duplicados
          elementsToObserve.forEach(el => el.classList.remove('is-active'));

          // 2. Activa únicamente la tarjeta que está entrando al centro
          entry.target.classList.add('is-active');
        } else {
          entry.target.classList.remove('is-active');
        }
      });
    }, observerOptions);

    elementsToObserve.forEach(el => observer.observe(el));
  }
});