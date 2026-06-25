// ── Smooth cursor with rAF lerp ─────────────────────────────────────────
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const ringPos = { x: mouse.x, y: mouse.y };
const LERP = 0.13;

document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  cursor.style.left = mouse.x + 'px';
  cursor.style.top = mouse.y + 'px';
}, { passive: true });

(function animateCursor() {
  ringPos.x += (mouse.x - ringPos.x) * LERP;
  ringPos.y += (mouse.y - ringPos.y) * LERP;
  ring.style.left = ringPos.x + 'px';
  ring.style.top = ringPos.y + 'px';
  requestAnimationFrame(animateCursor);
})();

// Scroll reveal
const revealEls = document.querySelectorAll(
  '.service-card, .step-row, .work-item, .stat, .brand-logo-item, .contact-link, .testimonial-inner, blockquote, .tool-card'
);
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(32px)';
  el.style.transition = `opacity 0.65s ${i * 0.04}s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.65s ${i * 0.04}s cubic-bezier(0.25,0.46,0.45,0.94)`;
  observer.observe(el);
});
// ── Counter animation for hero stats ─────────────────────────────────
function countUp(el, target, duration) {
  const start = performance.now();
  let lastVal = -1;
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(ease * target);
    if (current !== lastVal) {
      el.classList.add('counting');
      el.textContent = current;
      lastVal = current;
      clearTimeout(el._blurTimer);
      el._blurTimer = setTimeout(() => el.classList.remove('counting'), 80);
    }
    if (progress < 1) requestAnimationFrame(step);
    else {
      el.textContent = target;
      el.classList.remove('counting');
    }
  }
  requestAnimationFrame(step);
}

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.n[data-target]').forEach(n => {
          const target = parseInt(n.dataset.target, 10);
          const numEl = n.querySelector('.count-num');
          if (numEl) countUp(numEl, target, 1800);
        });
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  statsObserver.observe(statsSection);
}

// ── Scroll reveal ───────────────────────────────────────────────────────
const revealStyle = document.createElement('style');
revealStyle.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(revealStyle);

// ── Work-item 3D tilt ───────────────────────────────────────────────────
document.querySelectorAll('.work-item').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
  });
});

// ── Hero sequential reveal (eyebrow → sub → CTAs after name drops in) ──
window.addEventListener('load', () => {
  // Complete progress bar
  const pb = document.getElementById('progress-bar');
  if (pb) {
    pb.style.width = '100%';
    setTimeout(() => { pb.style.opacity = '0'; }, 350);
    setTimeout(() => { pb.remove(); }, 900);
  }

  const seq = [
    { sel: '.hero-eyebrow',  delay: 950  },
    { sel: '.hero-sub',      delay: 1200 },
    { sel: '.hero-actions',  delay: 1420 },
  ];
  seq.forEach(({ sel, delay }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
  });
});

// ── Floating accent particles on hero ───────────────────────────────────
const hero = document.querySelector('.hero');
if (hero) {
  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      background:#e8ff47;
      border-radius:50%;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      opacity:${Math.random() * 0.2 + 0.05};
      animation: floatParticle ${Math.random() * 8 + 6}s ease-in-out infinite alternate;
      animation-delay: ${Math.random() * 4}s;
      pointer-events:none;
      z-index:1;
    `;
    hero.appendChild(p);
  }
  const pStyle = document.createElement('style');
  pStyle.textContent = `
    @keyframes floatParticle {
      from { transform: translate(0, 0); }
      to { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random()*30+10)}px, ${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random()*30+10)}px); }
    }
  `;
  document.head.appendChild(pStyle);
}

// ── Mobile hamburger menu ──────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

function closeMobileNav() {
  hamburger.classList.remove('open');
  mobileNav.classList.remove('visible');
  setTimeout(() => mobileNav.classList.remove('open'), 300);
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  if (isOpen) {
    mobileNav.classList.add('open');
    requestAnimationFrame(() => requestAnimationFrame(() => mobileNav.classList.add('visible')));
    document.body.style.overflow = 'hidden';
  } else {
    closeMobileNav();
  }
});

mobileNav.querySelectorAll('.mn-link').forEach((a, i) => {
  a.style.transitionDelay = `${i * 0.06}s`;
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = a.getAttribute('href').slice(1);
    closeMobileNav();
    setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 320);
  });
});

// ── Magnetic buttons ───────────────────────────────────────────────────────
document.querySelectorAll('.btn-main, .nav-cta').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.transition = 'transform 0.15s ease, opacity 0.2s';
  });
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.38;
    const y = (e.clientY - r.top - r.height / 2) * 0.38;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.2s';
    btn.style.transform = '';
  });
});

// ── Video play on hover ──────────────────────────────────────────────────────
document.querySelectorAll('.work-item video').forEach(video => {
  const item = video.closest('.work-item');
  if (!item) return;
  let playTimer;
  item.addEventListener('mouseenter', () => {
    playTimer = setTimeout(() => {
      video.currentTime = 0;
      video.play().catch(() => {});
    }, 300);
  });
  item.addEventListener('mouseleave', () => {
    clearTimeout(playTimer);
    video.pause();
    video.currentTime = 0;
  });
  item.addEventListener('click', (e) => {
    e.preventDefault();
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
});

// ── Nav: scroll-spy active state ──────────────────────────────────────────
const NAV_SECTIONS = ['work', 'services', 'process', 'contact'];
const navItemMap = {};
NAV_SECTIONS.forEach(id => {
  navItemMap[id] = document.querySelector(`.nav-item[data-section="${id}"]`);
});

const spyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const id = entry.target.id;
    if (entry.isIntersecting && navItemMap[id]) {
      Object.values(navItemMap).forEach(el => el?.classList.remove('active'));
      navItemMap[id].classList.add('active');
    }
  });
}, { threshold: 0.35 });

NAV_SECTIONS.forEach(id => {
  const el = document.getElementById(id);
  if (el) spyObserver.observe(el);
});

// Nav item click → smooth scroll
document.querySelectorAll('.nav-item[data-section]').forEach(item => {
  item.addEventListener('click', () => {
    const id = item.dataset.section;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Logo disc click → scroll to top
document.querySelector('.nav-disc')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
