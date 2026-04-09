/**
 * CMS LOADER для PIXEL.FORGE
 * Автоматически находит все .md файлы в папках контента
 */

const CMSLoader = {
  /**
   * Парсер YAML фронтматтера (улучшенный)
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

    yaml.split('\n').forEach(line => {
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
      
      // Булевы
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Числа
      if (!isNaN(value) && value !== '' && value !== null) {
        value = Number(value);
      }
      
      // Списки (через запятую)
      if (value.includes(',') && !value.startsWith('[')) {
        value = value.split(',').map(v => v.trim()).filter(v => v);
      }
      
      if (key) {
        meta[key] = value;
      }
    });

    return { meta, body };
  },

  /**
   * Генерация карточки портфолио
   */
  generatePortfolioCard(data, slug) {
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

    const category = data.category || 'landing';
    const gradient = data.image_gradient || 'linear-gradient(45deg, #00ccff, #001133)';
    const title = data.title || slug.replace(/-/g, ' ').toUpperCase();

    return `
      <article class="project-card ${category}" data-category="${category}">
        <div class="project-img" style="background: ${gradient};"></div>
        <div class="project-info">
          <div class="project-tags">${tagsHtml}</div>
          <h3 class="pixel-text">${title}</h3>
          <p class="pixel-text small">${data.excerpt || ''}</p>
          <a href="${data.link || '#'}" class="link-pixel pixel-text">ОТКРЫТЬ ДОСЬЕ →</a>
        </div>
      </article>
    `;
  },

  /**
   * Генерация карточки услуги
   */
  generateServiceCard(data) {
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
    const title = data.title || 'Без названия';

    return `
      <div class="service-card fade-up ${popularClass}">
        <div class="service-header">
          <span class="pixel-text ${data.color_class || 'pixel-cyan'}">${number}</span>
          <h2 class="pixel-text">${title}</h2>
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
   * АВТОМАТИЧЕСКОЕ обнаружение файлов через GitHub API
   */
  async autoDetectFiles(folder) {
    try {
      // Пытаемся получить список файлов через GitHub API
      // Для публичных репозиториев это работает без токена
      const repoInfo = window.location.hostname.includes('netlify.app') 
        ? null 
        : await fetch('https://api.github.com/repos/USER/REPO').then(r => r.json()).catch(() => null);
      
      // Если не получилось через API, пробуем перебором известных паттернов
      // Это fallback для статических сайтов
      const commonFiles = {
        'portfolio': ['crypto-dash', 'neon-plants', 'cyber-security', 'pixel-war', 'star44'],
        'services': ['landing', 'shop', 'corp', 'support']
      };
      
      // Проверяем какие файлы реально существуют
      const existingFiles = [];
      const filesToCheck = commonFiles[folder] || [];
      
      for (const file of filesToCheck) {
        try {
          const resp = await fetch(`/content/${folder}/${file}.md`, { method: 'HEAD' });
          if (resp.ok) {
            existingFiles.push(file);
            console.log(`CMS: найден файл ${file}.md`);
          }
        } catch (e) {
          // Файл не существует, пропускаем
        }
      }
      
      return existingFiles;
    } catch (e) {
      console.warn('CMS: авто-обнаружение не сработало:', e);
      return [];
    }
  },

  /**
   * Загрузка портфолио с авто-обнаружением
   */
  async loadPortfolio(containerSelector = '.portfolio-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log('CMS: контейнер портфолио не найден');
      return;
    }

    try {
      // Автоматически находим все файлы
      console.log('CMS: поиск файлов портфолио...');
      const files = await this.autoDetectFiles('portfolio');
      console.log('CMS: найдены файлы:', files);
      
      if (files.length === 0) {
        console.log('CMS: файлы портфолио не найдены');
        return;
      }
      
      let html = '';
      let loadedCount = 0;
      
      for (const slug of files) {
        try {
          const resp = await fetch(`/content/portfolio/${slug}.md`);
          if (resp.ok) {
            const text = await resp.text();
            const { meta } = this.parseFrontmatter(text);
            html += this.generatePortfolioCard(meta, slug);
            loadedCount++;
          }
        } catch (e) {
          console.warn(`CMS: ошибка ${slug}.md:`, e.message);
        }
      }
      
      if (html) {
        container.innerHTML = html;
        console.log(`CMS: загружено ${loadedCount} проектов`);
        
        if (typeof window.initPortfolioFilters === 'function') {
          window.initPortfolioFilters();
        }
      }
    } catch (e) {
      console.error('CMS: ошибка портфолио:', e);
    }
  },

  /**
   * Загрузка услуг с авто-обнаружением
   */
  async loadServices(containerSelector = '.services-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log('CMS: контейнер услуг не найден');
      return;
    }

    try {
      console.log('CMS: поиск файлов услуг...');
      const files = await this.autoDetectFiles('services');
      console.log('CMS: найдены файлы:', files);
      
      if (files.length === 0) {
        console.log('CMS: файлы услуг не найдены');
        return;
      }
      
      let html = '';
      let loadedCount = 0;
      
      for (const slug of files) {
        try {
          const resp = await fetch(`/content/services/${slug}.md`);
          if (resp.ok) {
            const text = await resp.text();
            const { meta } = this.parseFrontmatter(text);
            html += this.generateServiceCard(meta);
            loadedCount++;
          }
        } catch (e) {
          console.warn(`CMS: ошибка ${slug}.md:`, e.message);
        }
      }
      
      if (html) {
        container.innerHTML = html;
        console.log(`CMS: загружено ${loadedCount} услуг`);
      }
    } catch (e) {
      console.error('CMS: ошибка услуг:', e);
    }
  },

  /**
   * Инициализация
   */
  init() {
    console.log('CMS Loader: старт...');
    
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    if (page === 'services.html') {
      this.loadServices();
    }
    
    if (page === 'portfolio.html') {
      this.loadPortfolio();
    }
    
    if (page === 'index.html' || page === '/') {
      this.loadPortfolio('#portfolio .pixel-grid-3');
    }
    
    console.log('CMS Loader: готов');
  }
};

/**
 * Фильтрация портфолио
 */
window.initPortfolioFilters = function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card');
  
  filterBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const filter = this.dataset.filter;
      
      projects.forEach(card => {
        const cat = card.dataset.category;
        const shouldShow = (filter === 'all' || filter === cat);
        card.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s';
            card.style.opacity = '1';
          }, 50);
        }
      });
    });
  });
  
  console.log('CMS: фильтры активны');
};

/**
 * Автозапуск
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CMSLoader.init());
} else {
  CMSLoader.init();
}

window.CMSLoader = CMSLoader;
