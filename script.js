// ── Smooth cursor with rAF lerp ──────────────────────────────────────────
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

// ── Scroll reveal ────────────────────────────────────────────────────────
const revealEls = document.querySelectorAll(
  '.service-card, .step-row, .work-item, .stat, .brand-logo-item, .contact-link, .testimonial-inner, blockquote, .tool-card'
);
const revealStyle = document.createElement('style');
revealStyle.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(revealStyle);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); }
  });
}, { threshold: 0.12 });
revealEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(32px)';
  el.style.transition = `opacity 0.65s ${i * 0.04}s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.65s ${i * 0.04}s cubic-bezier(0.25,0.46,0.45,0.94)`;
  observer.observe(el);
});

// ── Counter animation ────────────────────────────────────────────────────
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
    else { el.textContent = target; el.classList.remove('counting'); }
  }
  requestAnimationFrame(step);
}
const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
  const so = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.n[data-target]').forEach(n => {
          const numEl = n.querySelector('.count-num');
          if (numEl) countUp(numEl, parseInt(n.dataset.target, 10), 1800);
        });
        so.disconnect();
      }
    });
  }, { threshold: 0.3 });
  so.observe(statsSection);
}

// ── Page load: finish progress bar ───────────────────────────────────────
window.addEventListener('load', () => {
  const pb = document.getElementById('progress-bar');
  if (pb) {
    pb.style.width = '100%';
    setTimeout(() => { pb.style.opacity = '0'; }, 350);
    setTimeout(() => { pb.remove(); }, 900);
  }
});

// ── Hero: running timecode HUD ───────────────────────────────────────────
(function heroTimecode() {
  const reel = document.getElementById('heroReel');
  const tc = document.getElementById('hudTimecode');
  if (!reel || !tc) return;
  const FPS = 24;
  function tick() {
    const t = reel.currentTime || 0;
    const h = String(Math.floor(t / 3600)).padStart(2, '0');
    const m = String(Math.floor(t / 60) % 60).padStart(2, '0');
    const s = String(Math.floor(t) % 60).padStart(2, '0');
    const f = String(Math.floor((t % 1) * FPS)).padStart(2, '0');
    tc.textContent = `${h}:${m}:${s}:${f}`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ── Hero: sound toggle (reel autoplays muted per browser policy) ─────────
(function heroSound() {
  const reel = document.getElementById('heroReel');
  const btn = document.getElementById('heroSound');
  if (!reel || !btn) return;
  const label = btn.querySelector('.hud-sound-label');
  function render() {
    btn.classList.toggle('sound-on', !reel.muted);
    if (label) label.textContent = reel.muted ? 'SOUND ON' : 'MUTE';
  }
  btn.addEventListener('click', () => {
    reel.muted = !reel.muted;
    if (!reel.muted && reel.paused) reel.play().catch(() => {});
    render();
  });
  render();
})();

// ── Hero: 3D screen tilt-away on scroll ──────────────────────────────────
(function heroTilt3d() {
  const screen = document.getElementById('heroScreen');
  const heroEl = document.querySelector('.hero');
  const reel = document.getElementById('heroReel');
  if (!screen || !heroEl) return;
  let ticking = false;
  function apply() {
    ticking = false;
    const h = heroEl.offsetHeight || 1;
    const p = Math.min(Math.max(window.scrollY / h, 0), 1);
    screen.style.transform = `rotateX(${p * 14}deg) scale(${1 - p * 0.18}) translateY(${p * -60}px)`;
    screen.style.opacity = String(1 - p * 0.55);
    // Pause the reel offscreen so it doesn't burn resources
    if (reel) {
      if (p >= 1 && !reel.paused) reel.pause();
      else if (p < 1 && reel.paused && !reel.dataset.userPaused) reel.play().catch(() => {});
    }
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(apply); }
  }, { passive: true });
  apply();
})();

// ── Mobile hamburger ─────────────────────────────────────────────────────
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
  } else { closeMobileNav(); }
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

// ── Magnetic buttons ─────────────────────────────────────────────────────
document.querySelectorAll('.btn-main, .nav-cta').forEach(btn => {
  btn.addEventListener('mouseenter', () => { btn.style.transition = 'transform 0.15s ease, opacity 0.2s'; });
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

// ── Pill nav: animated waveform bar generation ──────────────────────────
(function buildWave() {
  const wave = document.getElementById('navWave');
  if (!wave) return;
  const BARS = 48;
  for (let i = 0; i < BARS; i++) {
    const bar = document.createElement('span');
    const dur = (0.7 + (i % 5) * 0.16).toFixed(2);
    const delay = (((i * 0.13) % 1.1)).toFixed(2);
    bar.style.animationDuration = dur + 's';
    bar.style.animationDelay = delay + 's';
    wave.appendChild(bar);
  }
})();

// ── Pill nav: 3D scroll-away ─────────────────────────────────────────────
const mainNav = document.getElementById('main-nav');
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 90 && y > lastScrollY) {
    mainNav?.classList.add('nav-scrolled');
  } else if (y < 80 || y < lastScrollY) {
    mainNav?.classList.remove('nav-scrolled');
  }
  lastScrollY = y;
}, { passive: true });

// ── Pill nav: mouse-reactive 3D tilt ─────────────────────────────────────
(function navTilt() {
  const pill = document.getElementById('navPill');
  if (!pill) return;
  pill.addEventListener('mousemove', e => {
    const r = pill.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    pill.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
  });
  pill.addEventListener('mouseleave', () => {
    pill.style.transform = 'rotateY(0deg) rotateX(0deg)';
  });
})();

// ── Pill nav: scroll-spy + active marker glow ────────────────────────────
const NAV_CLIPS = ['work', 'services', 'process', 'contact'];
const clipMap = {};
NAV_CLIPS.forEach(id => {
  clipMap[id] = document.querySelector(`.nav-marker[data-section="${id}"]`);
});

function movePlayhead(id) {
  const playhead = document.getElementById('navPlayhead');
  const marker = clipMap[id];
  const track = document.querySelector('.nav-markers');
  if (!playhead || !marker || !track) return;
  const trackRect = track.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const glowWidth = Math.max(24, markerRect.width * 0.6);
  playhead.style.left = (markerRect.left - trackRect.left + markerRect.width / 2 - glowWidth / 2) + 'px';
  playhead.style.width = glowWidth + 'px';
}

const spyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const id = entry.target.id;
    if (!entry.isIntersecting || !clipMap[id]) return;
    NAV_CLIPS.forEach(k => clipMap[k]?.classList.remove('active'));
    clipMap[id].classList.add('active');
    movePlayhead(id);
  });
}, { threshold: 0.35 });

NAV_CLIPS.forEach(id => {
  const el = document.getElementById(id);
  if (el) spyObserver.observe(el);
});

// Nav marker clicks
document.querySelectorAll('.nav-marker[data-section]').forEach(marker => {
  marker.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById(marker.dataset.section)?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Logo click → top
document.getElementById('navMonitor')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Init glow on first active marker
setTimeout(() => movePlayhead('work'), 100);

// ── Custom video player on work items ───────────────────────────────────
function fmtTime(s) {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}

document.querySelectorAll('.work-item video').forEach(video => {
  const item = video.closest('.work-item');
  if (!item) return;

  // Build overlay HTML
  const overlay = document.createElement('div');
  overlay.className = 'vp-overlay';
  overlay.innerHTML = `
    <div class="vp-controls">
      <div class="vp-progress-row">
        <span class="vp-time vp-cur">0:00</span>
        <div class="vp-progress-track">
          <div class="vp-progress-fill"></div>
        </div>
        <span class="vp-time vp-dur">0:00</span>
      </div>
      <div class="vp-bottom-row">
        <div class="vp-left">
          <button class="vp-btn vp-play" title="Play/Pause">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="vp-btn vp-mute" title="Mute">
            <svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
          </button>
          <div class="vp-vol-wrap">
            <div class="vp-vol-track"><div class="vp-vol-fill"></div></div>
          </div>
        </div>
        <div class="vp-right">
          <button class="vp-btn vp-speed-btn" data-speed="0.5">0.5x</button>
          <button class="vp-btn vp-speed-btn vp-active" data-speed="1">1x</button>
          <button class="vp-btn vp-speed-btn" data-speed="1.5">1.5x</button>
          <button class="vp-btn vp-speed-btn" data-speed="2">2x</button>
        </div>
      </div>
    </div>`;
  item.appendChild(overlay);

  const playBtn  = overlay.querySelector('.vp-play');
  const muteBtn  = overlay.querySelector('.vp-mute');
  const progTrack = overlay.querySelector('.vp-progress-track');
  const progFill  = overlay.querySelector('.vp-progress-fill');
  const volTrack  = overlay.querySelector('.vp-vol-track');
  const volFill   = overlay.querySelector('.vp-vol-fill');
  const curEl     = overlay.querySelector('.vp-cur');
  const durEl     = overlay.querySelector('.vp-dur');

  const PLAY_ICON  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const PAUSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="15" x2="10" y2="9"/><line x1="15" y1="15" x2="15" y2="9"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
  const VOL_ICON   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`;
  const MUTE_ICON  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

  function syncPlayIcon() {
    playBtn.innerHTML = video.paused ? PLAY_ICON : PAUSE_ICON;
  }

  // Play/pause
  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    video.paused ? video.play().catch(()=>{}) : video.pause();
  });

  // Mute toggle
  muteBtn.addEventListener('click', e => {
    e.stopPropagation();
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? MUTE_ICON : VOL_ICON;
    volFill.style.width = video.muted ? '0%' : (video.volume * 100) + '%';
  });

  // Progress scrub
  progTrack.addEventListener('click', e => {
    e.stopPropagation();
    const pct = (e.offsetX / progTrack.offsetWidth);
    if (isFinite(video.duration)) video.currentTime = pct * video.duration;
  });

  // Volume scrub
  volTrack.addEventListener('click', e => {
    e.stopPropagation();
    const pct = Math.max(0, Math.min(1, e.offsetX / volTrack.offsetWidth));
    video.volume = pct;
    video.muted = pct === 0;
    volFill.style.width = (pct * 100) + '%';
    muteBtn.innerHTML = pct === 0 ? MUTE_ICON : VOL_ICON;
  });

  // Speed buttons
  overlay.querySelectorAll('.vp-speed-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      overlay.querySelectorAll('.vp-speed-btn').forEach(b => b.classList.remove('vp-active'));
      btn.classList.add('vp-active');
      video.playbackRate = parseFloat(btn.dataset.speed);
    });
  });

  // Time updates
  video.addEventListener('timeupdate', () => {
    if (!isFinite(video.duration)) return;
    const pct = (video.currentTime / video.duration) * 100;
    progFill.style.width = pct + '%';
    curEl.textContent = fmtTime(video.currentTime);
  });
  video.addEventListener('loadedmetadata', () => {
    durEl.textContent = fmtTime(video.duration);
  });
  video.addEventListener('play', () => { syncPlayIcon(); item.classList.add('is-playing'); });
  video.addEventListener('pause', () => { syncPlayIcon(); item.classList.remove('is-playing'); });
  video.addEventListener('ended', () => { video.currentTime = 0; syncPlayIcon(); item.classList.remove('is-playing'); });

  // Hover auto-play
  let playTimer;
  item.addEventListener('mouseenter', () => {
    playTimer = setTimeout(() => { video.currentTime = 0; video.play().catch(()=>{}); }, 300);
  });
  item.addEventListener('mouseleave', () => {
    clearTimeout(playTimer);
    video.pause();
    video.currentTime = 0;
  });

  // Click video body to toggle (not controls)
  video.addEventListener('click', e => {
    e.stopPropagation();
    video.paused ? video.play().catch(()=>{}) : video.pause();
  });
});

// ── Sticky-stacking project cards (with 3D recede) ───────────────────────
(function projectStack() {
  const wraps = Array.from(document.querySelectorAll('.project-card-wrap'));
  if (!wraps.length) return;

  function update() {
    wraps.forEach(wrap => {
      const card = wrap.querySelector('.project-card');
      if (!card) return;
      const stickyTop = parseFloat(getComputedStyle(card).top) || 0;
      const wrapRect = wrap.getBoundingClientRect();
      const maxScroll = Math.max(wrapRect.height - card.offsetHeight, 1);
      const progress = Math.min(Math.max((stickyTop - wrapRect.top) / maxScroll, 0), 1);
      const scale = 1 - progress * 0.06;
      card.style.transform = `scale(${scale}) rotateX(${progress * 7}deg) translateZ(${progress * -40}px)`;
      card.style.opacity = String(1 - progress * 0.2);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  setTimeout(update, 100);
})();

// ── 3D mouse tilt on cards ───────────────────────────────────────────────
(function tiltCards() {
  if (window.matchMedia('(hover: none)').matches) return; // skip touch devices
  const els = document.querySelectorAll('.project-card-media, .service-card, .tool-card');
  els.forEach(el => {
    let raf = null;
    // The scroll-reveal leaves an inline staggered transition and a .revealed
    // class with transform:!important — both would fight the tilt. Hand the
    // element fully over to the tilt on first hover.
    el.addEventListener('mouseenter', () => {
      if (el.dataset.tiltReady) return;
      el.dataset.tiltReady = '1';
      el.classList.remove('revealed');
      el.style.opacity = '1';
      el.style.transition = '';
      el.style.transform = 'none';
    });
    el.addEventListener('mousemove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 6}deg) translateZ(12px)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    });
  });
})();
