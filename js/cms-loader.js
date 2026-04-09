/**
 * CMS LOADER для PIXEL.FORGE
 * Автоматически загружает контент из Decap CMS (.md файлы)
 * и вставляет его на страницы
 */

const CMSLoader = {
  /**
   * Парсер YAML фронтматтера
   * Извлекает метаданные из .md файла
   */
  parseFrontmatter(content) {
    const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(fmRegex);
    
    if (!match) {
      console.warn('CMS: фронтматтер не найден');
      return { meta: {}, body: content };
    }

    const yaml = match[1];
    const body = match[2];
    const meta = {};

    // Парсим YAML построчно
    yaml.split('\n').forEach(line => {
      // Пропускаем пустые строки
      if (!line.trim()) return;
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      // Убираем кавычки
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Булевы значения
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Числа
      if (!isNaN(value) && value !== '' && value !== null) {
        value = Number(value);
      }
      
      // Списки (простой случай через запятую в квадратных скобках)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1)
          .split(',')
          .map(v => v.trim().replace(/['"]/g, ''))
          .filter(v => v);
      }
      
      // Списки через дефис (многострочные)
      if (value === '') {
        // Проверяем следующую строку на наличие списка
        const nextLineMatch = yaml.match(new RegExp(`${key}:\\s*\\n((?:\\s+-\\s+.+\\n?)+)`));
        if (nextLineMatch) {
          value = nextLineMatch[1]
            .split('\n')
            .map(l => l.replace(/^\s+-\s+/, '').trim())
            .filter(l => l);
        }
      }
      
      if (key) {
        meta[key] = value;
      }
    });

    return { meta, body };
  },

  /**
   * Генерация карточки услуги
   */
  generateServiceCard(data) {
    // Обрабатываем features (может быть строкой или массивом)
    let featuresArray = [];
    if (Array.isArray(data.features)) {
      featuresArray = data.features;
    } else if (typeof data.features === 'string') {
      featuresArray = data.features.split('\n').map(f => f.trim()).filter(f => f);
    }
    
    const featuresHtml = featuresArray.map(f => 
      `<li class="pixel-text small">▸ ${f}</li>`
    ).join('');

    const popularClass = data.popular ? 'popular' : '';
    const btnClass = data.popular ? 'btn-pink' : 'btn-outline-cyan';
    const number = String(data.number || '').padStart(2, '0');

    return `
      <div class="service-card fade-up ${popularClass}">
        <div class="service-header">
          <span class="pixel-text ${data.color_class || 'pixel-cyan'}">${number}</span>
          <h2 class="pixel-text">${data.title || 'Без названия'}</h2>
        </div>
        <div class="service-body">
          <p class="pixel-text small">${data.description || ''}</p>
          <ul class="service-features">
            ${featuresHtml}
          </ul>
          <div class="service-price">
            <span class="pixel-text small">ОТ</span>
            <span class="pixel-text ${data.price_color || 'pixel-yellow'}">
              ${data.price ? Number(data.price).toLocaleString('ru-RU') : '0'}₽
            </span>
          </div>
          <a href="${data.calc_link || '#'}" class="btn btn-pixel ${btnClass} full-width">
            <span class="pixel-text small">ВЫБРАТЬ</span>
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Генерация карточки портфолио
   */
  generatePortfolioCard(data, slug) {
    // Обрабатываем теги
    let tags = [];
    if (Array.isArray(data.tags)) {
      tags = data.tags;
    } else if (typeof data.tags === 'string') {
      tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    const tagsHtml = tags.map(tag => {
      const tagLower = tag.toLowerCase();
      let tagClass = '';
      if (tagLower.includes('магазин') || tagLower.includes('shop')) {
        tagClass = 'pixel-green';
      } else if (tagLower.includes('корпоратив') || tagLower.includes('corp')) {
        tagClass = 'pixel-cyan';
      } else if (tagLower.includes('лендинг') || tagLower.includes('landing')) {
        tagClass = 'pixel-pink';
      }
      return `<span class="tag ${tagClass}">${tag}</span>`;
    }).join('');

    // Определяем категорию для класса
    const category = data.category || 'landing';
    
    // Градиент по умолчанию
    const gradient = data.image_gradient || 'linear-gradient(45deg, #00ccff, #001133)';

    return `
      <article class="project-card ${category}" data-category="${category}">
        <div class="project-img" style="background: ${gradient};"></div>
        <div class="project-info">
          <div class="project-tags">${tagsHtml}</div>
          <h3 class="pixel-text">${data.title || 'Без названия'}</h3>
          <p class="pixel-text small">${data.excerpt || ''}</p>
          <a href="${data.link || '#'}" class="link-pixel pixel-text">ОТКРЫТЬ ДОСЬЕ →</a>
        </div>
      </article>
    `;
  },

  /**
   * Загрузка списка файлов с GitHub API (если доступно)
   * Или используем fallback со списком известных файлов
   */
  async fetchFileList(folder) {
    // Пробуем получить список через GitHub API
    try {
      // Извлекаем репо из текущего домена (если возможно)
      // Или используем статический список
      const knownFiles = {
        'portfolio': ['crypto-dash-1', 'neon-plants', 'cyber-security', 'pixel-war', 'star44'],
        'services': ['landing', 'shop', 'corp', 'support']
      };
      
      return knownFiles[folder] || [];
    } catch (e) {
      console.warn('CMS: не удалось получить список файлов, используем fallback');
      return [];
    }
  },

  /**
   * Загрузка и отображение услуг
   */
  async loadServices(containerSelector = '.services-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log('CMS: контейнер услуг не найден:', containerSelector);
      return;
    }

    try {
      // Получаем список файлов
      const files = await this.fetchFileList('services');
      console.log('CMS: загружаем услуги:', files);
      
      let html = '';
      let loadedCount = 0;
      
      // Загружаем каждый файл
      for (const slug of files) {
        try {
          const resp = await fetch(`/content/services/${slug}.md`);
          if (resp.ok) {
            const text = await resp.text();
            const { meta } = this.parseFrontmatter(text);
            html += this.generateServiceCard(meta);
            loadedCount++;
            console.log(`CMS: загружена услуга ${slug}.md`);
          } else {
            console.log(`CMS: файл ${slug}.md не найден (статус ${resp.status})`);
          }
        } catch (e) {
          console.warn(`CMS: ошибка при загрузке ${slug}.md:`, e.message);
        }
      }
      
      if (html) {
        container.innerHTML = html;
        console.log(`CMS: загружено ${loadedCount} услуг`);
      } else {
        console.log('CMS: услуги не загружены, используется статический HTML');
      }
    } catch (e) {
      console.error('CMS: критическая ошибка при загрузке услуг:', e);
    }
  },

  /**
   * Загрузка и отображение портфолио
   */
  async loadPortfolio(containerSelector = '.portfolio-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log('CMS: контейнер портфолио не найден:', containerSelector);
      return;
    }

    try {
      // Получаем список файлов
      const files = await this.fetchFileList('portfolio');
      console.log('CMS: загружаем портфолио:', files);
      
      let html = '';
      let loadedCount = 0;
      
      // Загружаем каждый файл
      for (const slug of files) {
        try {
          const resp = await fetch(`/content/portfolio/${slug}.md`);
          if (resp.ok) {
            const text = await resp.text();
            const { meta } = this.parseFrontmatter(text);
            html += this.generatePortfolioCard(meta, slug);
            loadedCount++;
            console.log(`CMS: загружен проект ${slug}.md`);
          } else {
            console.log(`CMS: файл ${slug}.md не найден (статус ${resp.status})`);
          }
        } catch (e) {
          console.warn(`CMS: ошибка при загрузке ${slug}.md:`, e.message);
        }
      }
      
      if (html) {
        container.innerHTML = html;
        console.log(`CMS: загружено ${loadedCount} проектов`);
        
        // Перезапускаем фильтрацию портфолио
        if (typeof window.initPortfolioFilters === 'function') {
          window.initPortfolioFilters();
          console.log('CMS: фильтрация перезапущена');
        }
      } else {
        console.log('CMS: портфолио не загружено, используется статический HTML');
      }
    } catch (e) {
      console.error('CMS: критическая ошибка при загрузке портфолио:', e);
    }
  },

  /**
   * Загрузка контента на главную страницу
   */
  async loadHomepage() {
    // Можно загрузить превью последних проектов
    const portfolioContainer = document.querySelector('#portfolio .pixel-grid-3, .portfolio-grid');
    if (portfolioContainer) {
      await this.loadPortfolio('#portfolio .pixel-grid-3');
    }
    
    // Или превью услуг
    const servicesContainer = document.querySelector('.services-grid');
    if (servicesContainer) {
      await this.loadServices();
    }
  },

  /**
   * Инициализация CMS Loader
   */
  init() {
    console.log('CMS Loader: инициализация...');
    
    // Определяем текущую страницу
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    console.log('CMS Loader: текущая страница:', page);
    
    // Загружаем соответствующий контент
    if (page === 'services.html') {
      console.log('CMS Loader: загрузка услуг...');
      this.loadServices();
    }
    
    if (page === 'portfolio.html') {
      console.log('CMS Loader: загрузка портфолио...');
      this.loadPortfolio();
    }
    
    if (page === 'index.html' || page === '/') {
      console.log('CMS Loader: загрузка главной страницы...');
      this.loadHomepage();
    }
    
    console.log('CMS Loader: инициализация завершена');
  }
};

/**
 * Инициализация фильтрации портфолио
 */
window.initPortfolioFilters = function() {
  console.log('CMS: инициализация фильтров...');
  
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card');
  
  if (filterBtns.length === 0 || projects.length === 0) {
    console.log('CMS: фильтры или проекты не найдены');
    return;
  }

  // Сбрасываем все обработчики (клонированием кнопок)
  filterBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Получаем НОВЫЕ кнопки после клонирования
  const newFilterBtns = document.querySelectorAll('.filter-btn');
  
  newFilterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Убираем active со всех кнопок
      newFilterBtns.forEach(b => b.classList.remove('active'));
      // Добавляем active на нажатую
      this.classList.add('active');
      
      const filter = this.dataset.filter;
      console.log('CMS: фильтр активирован:', filter);
      
      // Фильтруем проекты
      projects.forEach(card => {
        const cat = card.dataset.category;
        const shouldShow = (filter === 'all' || filter === cat);
        
        // Сбрасываем все стили
        card.style.display = '';
        card.style.opacity = '';
        card.style.transition = '';
        
        if (shouldShow) {
          // Показываем с анимацией
          card.style.opacity = '0';
          card.style.display = '';
          
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
          }, 50);
        } else {
          // Скрываем без анимации
          card.style.display = 'none';
        }
      });
    });
  });
  
  console.log('CMS: фильтры готовы');
};

/**
 * Запускаем CMS Loader после загрузки DOM
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    CMSLoader.init();
  });
} else {
  // DOM уже загружен
  CMSLoader.init();
}

// === АВТОЗАПУСК С ПРОВЕРКОЙ ===
function safeAutoInit() {
  // Ждём пока полностью загрузится страница
  if (document.readyState === 'complete') {
    // Небольшая задержка чтобы гарантировать рендер
    setTimeout(() => {
      console.log('CMS: автозапуск с задержкой...');
      
      // Проверяем что контейнер точно есть
      const portfolioContainer = document.querySelector('.portfolio-grid');
      if (portfolioContainer) {
        console.log('CMS: контейнер найден, загружаем...');
        CMSLoader.loadPortfolio();
      } else {
        console.log('CMS: контейнер не найден, повтор через 500мс');
        setTimeout(() => {
          if (document.querySelector('.portfolio-grid')) {
            CMSLoader.loadPortfolio();
          }
        }, 500);
      }
    }, 100); // 300мс задержка
  }
}

// Запускаем при разных событиях для надёжности
window.addEventListener('load', safeAutoInit);
document.addEventListener('DOMContentLoaded', safeAutoInit);

// И на всякий случай — если страница уже загружена
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(safeAutoInit, 100);
}

// Экспортируем для использования в консоли
window.CMSLoader = CMSLoader;
