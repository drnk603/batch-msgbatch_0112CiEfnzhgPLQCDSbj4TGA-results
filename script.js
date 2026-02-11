(function() {
  'use strict';

  if (window.__appInitialized) return;
  window.__appInitialized = true;

  const state = {
    menuOpen: false,
    forms: new Map()
  };

  const config = {
    headerSelector: '.navbar',
    toggleSelector: '.navbar-toggler',
    collapseSelector: '.navbar-collapse',
    navLinkSelector: '.nav-link',
    scrollOffset: 80,
    debounceDelay: 150,
    formSubmitDelay: 800
  };

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+\d\s\(\)\-]{7,20}$/,
    name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    text: /^[\s\S]{10,}$/
  };

  function debounce(fn, delay) {
    let timer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(context, args), delay);
    };
  }

  function throttle(fn, delay) {
    let last = 0;
    return function() {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  function getHeaderHeight() {
    const header = document.querySelector(config.headerSelector);
    return header ? header.offsetHeight : config.scrollOffset;
  }

  function burgerMenu() {
    const toggle = document.querySelector(config.toggleSelector);
    const collapse = document.querySelector(config.collapseSelector);
    const body = document.body;

    if (!toggle || !collapse) return;

    function closeMenu() {
      collapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
      state.menuOpen = false;
    }

    function openMenu() {
      collapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      body.style.overflow = 'hidden';
      state.menuOpen = true;
    }

    function toggleMenu() {
      if (state.menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    const links = collapse.querySelectorAll(config.navLinkSelector);
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (state.menuOpen) closeMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (state.menuOpen && !collapse.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (state.menuOpen && e.key === 'Escape') {
        closeMenu();
      }
    });

    window.addEventListener('resize', throttle(() => {
      if (window.innerWidth >= 768 && state.menuOpen) {
        closeMenu();
      }
    }, config.debounceDelay));
  }

  function smoothScroll() {
    document.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      if (href.startsWith('#')) {
        e.preventDefault();
        const id = href.substring(1);
        const element = document.getElementById(id);
        if (element) {
          const offset = getHeaderHeight();
          const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  }

  function scrollSpy() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navLinks = Array.from(document.querySelectorAll(config.navLinkSelector));

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}` || href === `/#${id}`) {
              navLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
              });
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            }
          });
        }
      });
    }, {
      rootMargin: `-${getHeaderHeight()}px 0px -50% 0px`,
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  function activeMenu() {
    const path = window.location.pathname;
    const links = document.querySelectorAll(config.navLinkSelector);

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkPath = href.split('#')[0];
      
      if (linkPath === path || 
          (path === '/' && linkPath === '/index.html') ||
          (path === '/index.html' && linkPath === '/')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function showNotification(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:320px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `${message}<button type="button" class="btn-close" aria-label="Close"></button>`;
    
    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 5000);
  }

  function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const id = field.id;
    let isValid = true;
    let message = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      message = 'Это поле обязательно для заполнения';
    } else if (value) {
      if (type === 'email' || id.toLowerCase().includes('email')) {
        if (!patterns.email.test(value)) {
          isValid = false;
          message = 'Введите корректный email адрес';
        }
      } else if (type === 'tel' || id.toLowerCase().includes('phone')) {
        if (!patterns.phone.test(value)) {
          isValid = false;
          message = 'Введите корректный номер телефона';
        }
      } else if (id.toLowerCase().includes('name') || id.toLowerCase().includes('first') || id.toLowerCase().includes('last')) {
        if (!patterns.name.test(value)) {
          isValid = false;
          message = 'Имя может содержать только буквы, пробелы, дефис и апостроф';
        }
      } else if (field.tagName === 'TEXTAREA' || id.toLowerCase().includes('message')) {
        if (value.length < 10) {
          isValid = false;
          message = 'Сообщение должно содержать минимум 10 символов';
        }
      }
    }

    if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      isValid = false;
      message = 'Необходимо согласие';
    }

    return { isValid, message };
  }

  function showFieldError(field, message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  function handleFormSubmit(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isFormValid = true;

    fields.forEach(field => {
      if (field.type === 'submit' || field.type === 'button') return;

      const { isValid, message } = validateField(field);
      
      if (!isValid) {
        showFieldError(field, message);
        isFormValid = false;
      } else {
        clearFieldError(field);
      }
    });

    if (!isFormValid) {
      showNotification('Пожалуйста, исправьте ошибки в форме', 'danger');
      return false;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Отправляется...';
      
      state.forms.set(form, { submitBtn, originalText });
    }

    setTimeout(() => {
      const formData = state.forms.get(form);
      if (formData) {
        formData.submitBtn.disabled = false;
        formData.submitBtn.textContent = formData.originalText;
      }
      
      showNotification('Форма успешно отправлена!', 'success');
      form.reset();
      
      fields.forEach(field => {
        field.classList.remove('is-valid', 'is-invalid');
      });

      setTimeout(() => {
        window.location.href = 'thank_you.html';
      }, 1000);
    }, config.formSubmitDelay);

    return false;
  }

  function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFormSubmit(form);
      });

      const fields = form.querySelectorAll('input, textarea, select');
      fields.forEach(field => {
        if (field.type === 'submit' || field.type === 'button') return;

        field.addEventListener('blur', () => {
          const { isValid, message } = validateField(field);
          if (!isValid) {
            showFieldError(field, message);
          } else {
            clearFieldError(field);
          }
        });

        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            const { isValid } = validateField(field);
            if (isValid) {
              clearFieldError(field);
            }
          }
        });
      });
    });
  }

  function scrollToTop() {
    const scrollBtn = document.querySelector('[data-scroll-top]');
    if (!scrollBtn) return;

    function toggleVisibility() {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('show');
      } else {
        scrollBtn.classList.remove('show');
      }
    }

    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', throttle(toggleVisibility, 200));
    toggleVisibility();
  }

  function countUp() {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          const target = entry.target;
          const endValue = parseInt(target.getAttribute('data-count'));
          const duration = 2000;
          const step = Math.ceil(endValue / (duration / 16));
          let current = 0;

          target.classList.add('counted');

          const timer = setInterval(() => {
            current += step;
            if (current >= endValue) {
              current = endValue;
              clearInterval(timer);
            }
            target.textContent = current.toLocaleString();
          }, 16);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function lazyImages() {
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      if (!img.closest('.navbar')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  function init() {
    burgerMenu();
    smoothScroll();
    scrollSpy();
    activeMenu();
    initForms();
    scrollToTop();
    countUp();
    lazyImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();