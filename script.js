(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = (() => { try { return localStorage.getItem('loay-theme'); } catch { return null; } })();
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const portrait = document.getElementById("profilePortrait");
    if (portrait) portrait.src = theme === "dark" ? "images/profile-dark.png" : "images/profile-light.png";
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#141715' : '#f7f8fa';
  }
  applyTheme(storedTheme || (systemDark ? 'dark' : 'light'));
  if (themeToggle) themeToggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('loay-theme', next); } catch {}
  });
  const nav = document.getElementById('mainNav');
  const menuToggle = document.getElementById('menuToggle');
  if (nav && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); menuToggle.textContent='☰';
    }));
  }
  const moreToggle = document.getElementById('moreToggle');
  const moreMenu = document.getElementById('moreMenu');
  if (moreToggle && moreMenu) {
    moreToggle.addEventListener('click', () => {
      const open = moreMenu.classList.toggle('open');
      moreToggle.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-more')) { moreMenu.classList.remove('open'); moreToggle.setAttribute('aria-expanded','false'); }
    });
  }
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  window.showToast = showToast;
  const scholarLink = document.getElementById('scholarLink');
  if (scholarLink) scholarLink.addEventListener('click', e => {
    e.preventDefault(); showToast('Google Scholar profile coming soon.');
  });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const backToTop = document.getElementById('backToTop');
  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.toggle('active', b === button));
    const filter = button.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const categories = card.dataset.categories.split('|').map(category => category.trim());
      card.hidden = filter !== 'All' && !categories.includes(filter);
    });
  }));
  const form = document.getElementById('contactForm');
  const emailFallback = document.getElementById('emailFallback');
  if (form && emailFallback) emailFallback.addEventListener('click', () => {
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = encodeURIComponent(data.get('subject'));
    const body = encodeURIComponent('Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\n\n' + data.get('message'));
    window.location.href = 'mailto:loaymohamed165@gmail.com?subject=' + subject + '&body=' + body;
    const formStatus = document.getElementById('formStatus');
    if (formStatus) formStatus.textContent = 'Your email app should open with a prepared draft. The message has not been sent by this website.';
  });
  // Reveal elements only when motion is permitted.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.project-card,.service-list>div,.timeline-item,.education-card,.skills-grid article,.coming-card');
    targets.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(12px)'; el.style.transition = 'opacity .5s ease, transform .5s ease'; });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.style.opacity='1'; entry.target.style.transform='translateY(0)'; observer.unobserve(entry.target); }
    }), {threshold:.08});
    targets.forEach(el => observer.observe(el));
  }
})();