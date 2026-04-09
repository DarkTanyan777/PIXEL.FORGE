/**
 * CMS LOADER для PIXEL.FORGE
 * Загружает контент из Decap CMS и вставляет в нужные места
 */

const CMSLoader = {
  // Простой парсер YAML фронтматтера
  parseFrontmatter(content) {
    const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(fmRegex);
    if (!match) return { meta: {}, body: content };

    const yaml = match[1];
    const body = match[2];
    const meta = {};

    // Простой YAML парсер (для базовых типов)
    yaml.split('\n').forEach(line => {
      const [key, ...valParts] = line.split(':');
      if (!key?.trim()) return;
      let value = valParts.join(':').trim();
      
      // Убираем кавычки
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Булевы
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      // Числа
      if (!isNaN(value) && value !== '') value = Number(value);
      // Списки (простой случай)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
      }
      
      meta[key.trim()] = value;
    });

    return { meta, body };
  },

  // Генерация карточки услуги (точь-в-точь как в services.html)
  generateServiceCard(data) {
    const featuresHtml = (data.features || []).map(f => 
      `<li class="pixel-text small">▸ ${f}</li>`
    ).join('');

    const popularClass = data.popular ? 'popular' : '';
    const btnClass = data.popular ? 'btn-pink' : 'btn-outline-cyan';

    return `
      <div class="service-card fade-up ${popularClass}">
        <div class="service-header">
          <span class="pixel-text ${data.color_class || 'pixel-cyan'}">${String(data.number || '').padStart(2, '0')}</span>
          <h2 class="pixel-text">${data.title || ''}</h2>
        </div>
        <div class="service-body">
          <p class="pixel-text small">${data.description || ''}</p>
          <ul class="service-features">
            ${featuresHtml}
          </ul>
          <div class="service-price">
            <span class="pixel-text small">ОТ</span>
            <span class="pixel-text ${data.price_color || 'pixel-yellow'}">${data.price?.toLocaleString('ru-RU') || '0'}₽</span>
          </div>
          <a href="${data.calc_link || '#'}" class="btn btn-pixel ${btnClass} full-width">
            <span class="pixel-text small">ВЫБРАТЬ</span>
          </a>
        </div>
      </div>
    `;
  },

  // Генерация карточки портфолио (для portfolio.html)
  generatePortfolioCard(data, slug) {
    const tags = (data.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const tagsHtml = tags.map(tag => {
      const tagClass = tag.toLowerCase().includes('магазин') ? 'pixel-green' : 
                      tag.toLowerCase().includes('корпоратив') ? 'pixel-cyan' : '';
      return `<span class="tag ${tagClass}">${tag}</span>`;
    }).join('');

    return `
      <article class="project-card ${data.category || ''}" data-category="${data.category || ''}">
        <div class="project-img" style="background: ${data.image_gradient || 'linear-gradient(45deg, #00ccff, #001133)'};"></div>
        <div class="project-info">
          <div class="project-tags">${tagsHtml}</div>
          <h3 class="pixel-text">${data.title || ''}</h3>
          <p class="pixel-text small">${data.excerpt || ''}</p>
          <a href="${data.link || '#'}" class="link-pixel pixel-text">ОТКРЫТЬ ДОСЬЕ →</a>
        </div>
      </article>
    `;
  },

  // Загрузка и вставка контента
  async loadServices(containerSelector = '.services-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
      // Получаем список файлов из папки (GitHub API или прямой перебор)
      const files = ['landing', 'shop', 'corp', 'support']; // Можно расширить
      
      let html = '';
      for (const slug of files) {
        const resp = await fetch(`/content/services/${slug}.md`);
        if (!resp.ok) continue;
        const text = await resp.text();
        const { meta } = this.parseFrontmatter(text);
        html += this.generateServiceCard(meta);
      }
      
      if (html) container.innerHTML = html;
    } catch (e) {
      console.log('CMS services not loaded, using static HTML');
    }
  },

  async loadPortfolio(containerSelector = '.portfolio-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
      const files = ['crypto-dash', 'neon-plants', 'cyber-security', 'pixel-war'];
      
      let html = '';
      for (const slug of files) {
        const resp = await fetch(`/content/portfolio/${slug}.md`);
        if (!resp.ok) continue;
        const text = await resp.text();
        const { meta } = this.parseFrontmatter(text);
        html += this.generatePortfolioCard(meta, slug);
      }
      
      if (html) {
        container.innerHTML = html;
        // Перезапускаем фильтрацию, если она есть
        if (typeof initPortfolioFilters === 'function') {
          initPortfolioFilters();
        }
      }
    } catch (e) {
      console.log('CMS portfolio not loaded, using static HTML');
    }
  },

  // Инициализация
  init() {
    // Определяем, на какой странице мы
    const path = window.location.pathname;
    
    if (path.includes('services.html') || path.endsWith('/services.html')) {
      this.loadServices();
    }
    if (path.includes('portfolio.html') || path.endsWith('/portfolio.html')) {
      this.loadPortfolio();
    }
    // Для главной можно загрузить превью
    if (path === '/' || path.endsWith('index.html')) {
      this.loadPortfolio('#portfolio .pixel-grid-3');
    }
  }
};

// Запускаем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  CMSLoader.init();
});

// Перезапуск фильтрации после загрузки контента
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      
      projects.forEach(card => {
        const cat = card.dataset.category;
        card.style.display = (filter === 'all' || filter === cat) ? '' : 'none';
      });
    };
  });
}