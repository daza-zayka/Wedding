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
  const form = document.getElementById('rsvpForm');
  const conditional = document.getElementById('attendYes');
  const plusOneCheck = document.getElementById('plusOne');
  const partnerInput = document.getElementById('partnerName');
  const statusEl = document.getElementById('rsvpStatus');

  form.querySelectorAll('input[name="attendance"]').forEach(radio => {
    radio.addEventListener('change', () => {
      conditional.style.display = radio.value === 'yes' && radio.checked ? 'block' : 'none';
    });
  });

  plusOneCheck.addEventListener('change', () => {
    partnerInput.style.display = plusOneCheck.checked ? 'block' : 'none';
    if (!plusOneCheck.checked) partnerInput.value = '';
  });

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-YsIIA5VPCgKTt66Xe80GfBPyylFQtqqR0JER-PXvp5YvaEN2ToA_whLU28pzF3HK/exec'; // вставишь URL Apps Script

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'rsvp__status';

    if (!SCRIPT_URL) {
      statusEl.textContent = 'Форма пока не подключена к серверу';
      statusEl.classList.add('error');
      return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Отправляю...';

    const data = {
      name: form.name.value.trim(),
      attendance: form.attendance.value,
      plusone: plusOneCheck.checked ? 'Да' : 'Нет',
      partner: partnerInput.value.trim(),
      drinks: [...form.querySelectorAll('input[name="drinks"]:checked')].map(c => c.value).join(', '),
      comment: form.comment.value.trim(),
      timestamp: new Date().toLocaleString('ru-RU')
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      statusEl.textContent = 'Спасибо! Ваш ответ записан ♥';
      statusEl.classList.add('success');
      form.reset();
      conditional.style.display = 'none';
      partnerInput.style.display = 'none';
    } catch (err) {
      statusEl.textContent = 'Ошибка отправки. Попробуйте ещё раз.';
      statusEl.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Отправить';
    }
  });
})();