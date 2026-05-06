
/* Фиксим высоту hero на мобильных */
(function fixHeroHeight() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  function setHeight() {
    hero.style.height = window.innerHeight + 'px';
  }

  setHeight();
  // НЕ пересчитываем при resize - в этом суть фикса
})();


/* ============================
   COUNTDOWN TIMER
   ============================ */
(function initCountdown() {
  const wedding = new Date('2026-09-22T14:00:00+03:00').getTime();
  const $d = document.getElementById('cDays');
  const $h = document.getElementById('cHours');
  const $m = document.getElementById('cMinutes');
  const $s = document.getElementById('cSeconds');

  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const diff = wedding - Date.now();
    if (diff <= 0) {
      $d.textContent = '0'; $h.textContent = '00';
      $m.textContent = '00'; $s.textContent = '00';
      return;
    }
    $d.textContent = Math.floor(diff / 86400000);
    $h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    $m.textContent = pad(Math.floor((diff % 3600000) / 60000));
    $s.textContent = pad(Math.floor((diff % 60000) / 1000));
  }
  tick();
  setInterval(tick, 1000);
})();

/* ============================
   REVEAL ON SCROLL
   ============================ */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => observer.observe(el));
})();

/* ============================
   MUSIC PLAYER
   ============================ */
(function initMusic() {
  const btn = document.getElementById('musicBtn');
  const audio = document.getElementById('bgMusic');
  const player = document.getElementById('player');
  const waveform = document.getElementById('waveform');

  if (!btn || !audio) return;

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  // Единый источник правды — события audio
  audio.addEventListener('play', () => {
    player?.classList.add('playing');
    btn.classList.add('playing');
    waveform?.classList.add('active');
  });

  audio.addEventListener('pause', () => {
    player?.classList.remove('playing');
    btn.classList.remove('playing');
    waveform?.classList.remove('active');
  });
})();

/* ============================
   RSVP FORM LOGIC
   ============================ */
(function initRSVP() {
  const form         = document.getElementById('rsvpForm');
  const conditional  = document.getElementById('attendYes');
  const plusOneCheck  = document.getElementById('plusOne');
  const partnerInput = document.getElementById('partnerName');
  const statusEl     = document.getElementById('rsvpStatus');
  const btn          = document.getElementById('submitBtn');

  const SCRIPT_URL   = 'https://script.google.com/macros/s/AKfycbx2lE-qgk7Ja5RxGJ7bEyz2GakoVpVJh6WMy-fj-fNz9dgM73YUvR-Zd4u_DMLlLhpc/exec';
  const STORAGE_KEY  = 'rsvp_submissions';
  const MAX_LOCAL    = 2;

  // ─── UI переключатели ───
  form.querySelectorAll('input[name="attendance"]').forEach(radio => {
    radio.addEventListener('change', () => {
      conditional.style.display = radio.value === 'yes' && radio.checked ? 'block' : 'none';
    });
  });

  plusOneCheck.addEventListener('change', () => {
    partnerInput.style.display = plusOneCheck.checked ? 'block' : 'none';
    if (!plusOneCheck.checked) partnerInput.value = '';
  });

  // ─── Хелперы ───
  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'rsvp__status ' + type;
  }

  function getLocalCount(name) {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      return store[key] || 0;
    } catch { return 0; }
  }

  function incrementLocal(name) {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      store[key] = (store[key] || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* localStorage недоступен */ }
  }

  async function checkServerLimit(name) {
    try {
      const url = SCRIPT_URL + '?action=check&name=' + encodeURIComponent(name);
      const res = await fetch(url);
      const json = await res.json();
      return json.allowed;
    } catch {
      // Сервер недоступен - разрешаем, бэк все равно проверит
      return true;
    }
  }

  // ─── Отправка ───
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'rsvp__status';

    const name = form.name.value.trim();

    if (!name) {
      showStatus('Пожалуйста, введите имя', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Проверяю...';

    // 1. Быстрая проверка localStorage
    if (getLocalCount(name) >= MAX_LOCAL) {
      showStatus('Вы уже отправляли ответ. Если нужно что-то изменить, напишите нам лично', 'warning');
      btn.disabled = false;
      btn.textContent = 'Отправить';
      return;
    }

    // 2. Проверка на сервере (GET, читаемый ответ)
    btn.textContent = 'Проверяю...';
    const allowed = await checkServerLimit(name);

    if (!allowed) {
      showStatus('Вы уже отправляли ответ. Если нужно что-то изменить, напишите нам лично', 'warning');
      // Синхронизируем localStorage с сервером
      try {
        const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        store[name.toLowerCase().replace(/\s+/g, ' ')] = MAX_LOCAL;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      } catch {}
      btn.disabled = false;
      btn.textContent = 'Отправить';
      return;
    }

    // 3. Отправка (POST, no-cors - ответ не читаем, но бэк запишет)
    btn.textContent = 'Отправляю...';

    const data = {
      name:       name,
      attendance: form.attendance.value,
      plusone:    plusOneCheck.checked ? 'Да' : 'Нет',
      partner:   partnerInput.value.trim(),
      drinks:    [...form.querySelectorAll('input[name="drinks"]:checked')].map(c => c.value).join(', '),
      comment:   form.comment.value.trim(),
      timestamp: new Date().toLocaleString('ru-RU')
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      incrementLocal(name);
      showStatus('Спасибо! Ваш ответ записан ♥', 'success');
      form.reset();
      conditional.style.display = 'none';
      partnerInput.style.display = 'none';

    } catch (err) {
      showStatus('Ошибка отправки. Попробуйте ещё раз', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Отправить';
    }
  });
})();
