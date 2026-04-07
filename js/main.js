document.addEventListener('DOMContentLoaded', () => {
  // 1. Мобильное меню
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const closeBtn = document.querySelector('.nav__close');
  const navLinks = document.querySelectorAll('.nav__link');

  function toggleMenu() {
    nav.classList.toggle('open');
    burger.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  }

  burger.addEventListener('click', toggleMenu);
  closeBtn.addEventListener('click', toggleMenu);
  navLinks.forEach(link => link.addEventListener('click', () => {
    if (nav.classList.contains('open')) toggleMenu();
  }));

  // 2. Эффект скролла для хедера
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  });

  // 3. Плавная прокрутка
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 4. Анимация появления (Intersection Observer)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // 5. Эффект глитча при наведении на заголовок (опционально)
  const heroTitle = document.querySelector('.hero__content h1');
  if (heroTitle) {
    heroTitle.addEventListener('mouseenter', () => {
      heroTitle.style.animation = 'none';
      heroTitle.offsetHeight; // reflow
      heroTitle.style.animation = '';
    });
  }
});