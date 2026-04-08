const bootData = [
  'LOADING ASSETS...',
  'COMPILING PIXELS...',
  'NEON SYSTEMS ONLINE...',
  'ESTABLISHING CONNECTION...',
  'WELCOME TO THE GRID...'
];

function bootSequence() {
  const bootScreen = document.getElementById('bootScreen');
  const bootBar = document.getElementById('bootBar');
  const bootText = document.getElementById('bootText');
  let progress = 0;
  let lineIndex = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 30;
    if (progress > 100) progress = 100;
    bootBar.style.width = progress + '%';

    if (progress > (lineIndex + 1) * 20 && lineIndex < bootData.length) {
      bootText.textContent = bootData[lineIndex];
      lineIndex++;
    }

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        bootScreen.classList.add('fade-out');
        setTimeout(() => bootScreen.remove(), 1000);
      }, 500);
    }
  }, 300);
}

window.addEventListener('load', bootSequence);


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








// function showNotification(title, message, type = 'info') {
//   const colors = {
//     info: 'var(--cyan)',
//     success: 'var(--green)',
//     warning: 'var(--yellow)',
//     error: 'var(--pink)'
//   };

//   const notification = document.createElement('div');
//   notification.className = 'pixel-text';
//   notification.style.cssText = `
//     position: fixed;
//     bottom: 20px;
//     right: 20px;
//     background: var(--bg-darker);
//     border: 4px solid ${colors[type]};
//     padding: 20px;
//     z-index: 100000;
//     box-shadow: 0 0 30px ${colors[type]};
//     max-width: 300px;
//     animation: slideIn 0.3s steps(5);
//   `;
//   notification.innerHTML = `
//     <h4 style="color: ${colors[type]}; margin-bottom: 10px; font-size: 10px;">${title}</h4>
//     <p style="color: var(--text-secondary); font-size: 8px; line-height: 2;">${message}</p>
//     <button onclick="this.parentElement.remove()" style="margin-top: 10px; background: none; border: 2px solid ${colors[type]}; color: ${colors[type]}; padding: 8px 16px; font-family: inherit; cursor: pointer; font-size: 8px;">ЗАКРЫТЬ</button>
//   `;

//   document.body.appendChild(notification);

//   setTimeout(() => {
//     notification.style.animation = 'slideOut 0.3s steps(5) forwards';
//     setTimeout(() => notification.remove(), 300);
//   }, 5000);
// }

// // Добавить CSS анимации
// const style = document.createElement('style');
// style.textContent = `
//   @keyframes slideIn {
//     from { transform: translateX(100%); opacity: 0; }
//     to { transform: translateX(0); opacity: 1; }
//   }
//   @keyframes slideOut {
//     from { transform: translateX(0); opacity: 1; }
//     to { transform: translateX(100%); opacity: 0; }
//   }
// `;
// document.head.appendChild(style);

// // Пример использования
// setTimeout(() => {
//   showNotification('НОВЫЙ ОТЗЫВ!', 'Клиент доволен сайтом! Конверсия +40%', 'success');
// }, 10000);


