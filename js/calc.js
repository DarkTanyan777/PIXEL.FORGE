document.addEventListener('DOMContentLoaded', () => {
  
  const tariffButtons = document.querySelectorAll('.tariff-btn');
  const tariffDisplay = document.getElementById('tariff-display');
  const priceDisplay = document.getElementById('final-price');
  const timeDisplay = document.getElementById('time-estimate');
  const addons = document.querySelectorAll('.addon');
  const confirmBtn = document.getElementById('confirm-btn');

  let basePrice = 0;
  let baseName = "";
  let baseDays = 0;

  // Выбор тарифа
  function selectTariff(name, price, days) {
    basePrice = price;
    baseName = name;
    baseDays = days;

    tariffDisplay.textContent = name;
    updateTotal(); // Пересчитываем сразу при смене тарифа

    // Подсветка активной кнопки
    tariffButtons.forEach(btn => {
      btn.classList.remove('active');
      if(btn.getAttribute('data-name') === name) {
        btn.classList.add('active');
      }
    });
  }

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ ПОДСЧЁТА
  function updateTotal() {
    let addonsSum = 0;
    let extraDays = 0;

    addons.forEach(box => {
      if (box.checked) {
        addonsSum += parseInt(box.value);
        extraDays += 3; // +3 дня за каждый включённый модуль
      }
    });

    const totalDays = baseDays + extraDays;
    const total = basePrice + addonsSum;

    // Визуальное обновление цены
    priceDisplay.style.opacity = 0;
    setTimeout(() => {
      priceDisplay.textContent = total.toLocaleString('ru-RU') + ' ₽';
      timeDisplay.textContent = `~${totalDays} ДНЕЙ`;
      priceDisplay.style.opacity = 1;
    }, 150);
  }

  // Клик по тарифам
  tariffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const price = parseInt(btn.getAttribute('data-price'));
      const days = parseInt(btn.getAttribute('data-days'));
      selectTariff(name, price, days);
    });
  });

  // Клик по чекбоксам
  addons.forEach(box => {
    box.addEventListener('change', updateTotal);
  });

  // Инициализация при загрузке
  const params = new URLSearchParams(window.location.search);
  const urlName = params.get('name');
  const urlPrice = parseInt(params.get('price'));
  const urlDays = parseInt(params.get('days'));

  if (urlName && urlPrice) {
    selectTariff(urlName, urlPrice, urlDays || 7);
  } else {
    selectTariff("СТАРТ", 25000, 7);
  }

  // Кнопка "Заказать"
  confirmBtn.addEventListener('click', () => {
    let selectedAddons = [];
    addons.forEach(box => {
      if(box.checked) selectedAddons.push(box.getAttribute('data-name'));
    });
    
    const finalPrice = priceDisplay.textContent;
    const message = `ПРИВЕТ! ХОЧУ ЗАКАЗАТЬ САЙТ.%0A%0A` +
                    `ТАРИФ: ${baseName}%0A` +
                    `ОПЦИИ: ${selectedAddons.length > 0 ? selectedAddons.join(', ') : 'БЕЗ ДОПОВ'}%0A` +
                    `ИТОГО: ${finalPrice}%0A` +
                    `СРОКИ: ${timeDisplay.textContent}`;
    
    window.location.href = `https://t.me/USERNAME?text=${message}`;
  });

});