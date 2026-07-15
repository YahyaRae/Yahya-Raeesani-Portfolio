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
  '.service-card, .step-row, .work-item, .stat, .brand-logo-item, .contact-link, .testimonial-inner, blockquote, .tool-card, .clip-card'
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

// ── Hero: intro reel → paper-plane fold → name burst state machine ───────
(function heroIntro() {
  const intro = document.getElementById('heroIntro');
  const fold = document.getElementById('introFold');
  const reel = document.getElementById('heroReel');
  const plane = document.getElementById('paperPlane');
  const skipBtn = document.getElementById('introSkip');
  const replayBtn = document.getElementById('reelReplay');
  const cue = document.querySelector('.hero-scroll-cue');
  if (!intro || !fold || !reel || !plane) return;

  const INTRO_SECONDS = 8;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = 'playing';       // playing | folding | plane | done
  let mode = 'intro';          // intro (8s cap) | replay (full reel)
  let timers = [];

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  // Hide the scroll cue until the intro is over (its entrance animation
  // would out-cascade a plain inline opacity, so suspend that too)
  if (cue) { cue.style.animation = 'none'; cue.style.opacity = '0'; }

  function burst(instant) {
    window.dispatchEvent(new CustomEvent('nameBurst', { detail: { instant: !!instant } }));
  }

  function finish() {
    state = 'done';
    plane.hidden = true;
    plane.classList.remove('fly', 'appear');
    if (replayBtn) replayBtn.hidden = false;
    if (cue) { cue.style.animation = ''; cue.style.opacity = ''; } // replays its entrance
  }

  // Freeze the current video frame onto the two fold halves so the "paper"
  // being folded is the actual reel image
  function snapshotToFoldHalves() {
    const l = document.getElementById('foldLeft');
    const r = document.getElementById('foldRight');
    if (!l || !r) return;
    try {
      const c = document.createElement('canvas');
      // Match the on-screen crop of object-fit:cover so the halves line up
      const vw = reel.videoWidth || 1280, vh = reel.videoHeight || 720;
      const bw = intro.clientWidth || 1280, bh = intro.clientHeight || 720;
      const scale = Math.max(bw / vw, bh / vh);
      c.width = bw; c.height = bh;
      const cctx = c.getContext('2d');
      cctx.drawImage(reel, (bw - vw * scale) / 2, (bh - vh * scale) / 2, vw * scale, vh * scale);
      const url = `url(${c.toDataURL('image/jpeg', 0.72)})`;
      l.style.backgroundImage = url;
      r.style.backgroundImage = url;
    } catch (e) { /* halves fall back to their paper-dark background color */ }
  }

  function startFold() {
    if (state !== 'playing') return;
    state = 'folding';
    reel.pause();
    reel.muted = true;
    if (reduced) {
      // No theatrics: cut straight to the formed name
      intro.style.display = 'none';
      burst(true);
      finish();
      return;
    }
    snapshotToFoldHalves();
    intro.classList.add('folding');
    // The plane materialises while the dart is still sharpening (t≈1.05s),
    // so it's on screen as the fold completes rather than after it
    later(() => {
      plane.hidden = false;
      plane.classList.add('appear');
    }, 1050);
    later(() => {
      intro.style.display = 'none';
      state = 'plane';
      plane.classList.remove('appear');
      // reflow so the .fly animation restarts cleanly on replays
      void plane.offsetWidth;
      plane.classList.add('fly');
      // The name bursts as the plane launches
      later(() => burst(false), 380);
      later(finish, 1550);
    }, 1600);
  }

  // Intro mode folds at the 8s mark; replay mode plays the whole reel
  reel.addEventListener('timeupdate', () => {
    if (state === 'playing' && mode === 'intro' && reel.currentTime >= INTRO_SECONDS) startFold();
  });
  reel.addEventListener('ended', () => { if (state === 'playing') startFold(); });

  if (skipBtn) skipBtn.addEventListener('click', startFold);

  // Scrolling away during the intro also skips it
  window.addEventListener('scroll', () => {
    if (state === 'playing' && window.scrollY > 40) startFold();
  }, { passive: true });

  // Replay: bring the intro back full-screen and play the full reel
  if (replayBtn) replayBtn.addEventListener('click', () => {
    clearTimers(); // no stale fold/flight callbacks from a previous run
    mode = 'replay';
    state = 'playing';
    replayBtn.hidden = true;
    plane.hidden = true;
    plane.classList.remove('fly', 'appear');
    intro.classList.remove('folding');
    intro.style.display = '';
    reel.currentTime = 0;
    reel.play().catch(() => {});
  });

  // Reduced motion: skip the intro entirely. Deferred a tick so the particle
  // engine (defined later in this file) has attached its nameBurst listener.
  if (reduced) setTimeout(startFold, 0);
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

// ── Client shorts: modal player ──────────────────────────────────────────
(function clipModal() {
  const modal = document.getElementById('clipModal');
  if (!modal) return;
  const frame = document.getElementById('clipFrame');
  const closeBtn = modal.querySelector('.clip-modal-close');
  const backdrop = modal.querySelector('.clip-modal-backdrop');

  function open(src) {
    frame.src = src;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    frame.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.clip-thumb[data-embed]').forEach(btn => {
    btn.addEventListener('click', () => open(btn.dataset.embed));
  });
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
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

// ── Hero: particle name — bursts in after the intro, scatters under cursor ─
(function heroNameParticles() {
  const canvas = document.getElementById('nameParticles');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const LIME = [232, 255, 71];
  const WHITE = [245, 242, 237];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  let dpr = 1, W = 0, H = 0;
  let particles = [];
  let stars = [];
  let dust = [];
  let sparks = [];
  // Burst timeline: idle → exploding (0.38s) → forming (1.2s) → formed
  let phase = 'idle';
  let phaseStart = 0;
  const NAME_LINES = ['Yahya', 'Raeesani'];

  // Cursor state (tracked on window so the canvas can stay pointer-events:none
  // and never block the video cards / sound button beneath it).
  let mx = -9999, my = -9999, pointerOn = false;
  let rect = { left: 0, top: 0 };

  function refreshRect() { rect = canvas.getBoundingClientRect(); }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // Sample the two name lines into target points, then spawn particles.
  function build() {
    const cssW = hero.clientWidth;
    const cssH = hero.clientHeight;
    if (!cssW || !cssH) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cssW; H = cssH;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mobile = cssW < 760;
    const step = mobile ? 6 : 4;
    const maxParticles = mobile ? 1800 : 4200;

    // Offscreen text raster
    const off = document.createElement('canvas');
    off.width = cssW; off.height = cssH;
    const octx = off.getContext('2d');

    // Fit font so the longest line spans ~84% of hero width
    const longest = NAME_LINES.reduce((a, b) => (a.length >= b.length ? a : b));
    let fontSize = cssW * 0.24;
    octx.font = `800 ${fontSize}px 'Syne', sans-serif`;
    const measured = octx.measureText(longest).width || 1;
    fontSize *= (cssW * 0.84) / measured;
    fontSize = Math.min(fontSize, cssH * 0.30);

    octx.font = `800 ${fontSize}px 'Syne', sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = '#fff';
    const lineH = fontSize * 1.02;
    const cx = cssW / 2;
    const cy = cssH * 0.44; // slightly above centre — cards sit lower
    const startY = cy - ((NAME_LINES.length - 1) * lineH) / 2;
    NAME_LINES.forEach((line, i) => octx.fillText(line, cx, startY + i * lineH));

    const img = octx.getImageData(0, 0, cssW, cssH).data;
    const pts = [];
    for (let y = 0; y < cssH; y += step) {
      for (let x = 0; x < cssW; x += step) {
        if (img[(y * cssW + x) * 4 + 3] > 128) pts.push([x, y]);
      }
    }
    // Subsample if over budget
    if (pts.length > maxParticles) {
      for (let i = pts.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = pts[i]; pts[i] = pts[j]; pts[j] = t;
      }
      pts.length = maxParticles;
    }

    // Preserve current positions across rebuilds so a resize doesn't snap
    const prev = particles;
    particles = pts.map((p, i) => {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.max(cssW, cssH) * (0.35 + Math.random() * 0.5);
      const sx = cx + Math.cos(ang) * rad;
      const sy = cy + Math.sin(ang) * rad * 0.6;
      const src = prev[i];
      const lime = Math.random() < 0.58;
      return {
        hx: p[0], hy: p[1],
        sx, sy,
        x: src ? src.x : sx,
        y: src ? src.y : sy,
        size: (lime ? 1.1 : 1.0) + Math.random() * 1.1,
        col: lime ? LIME : WHITE,
        a: 0.55 + Math.random() * 0.4,
        seed: Math.random() * 6.283,
        drift: 6 + Math.random() * 14,
      };
    });

    // Starfield
    const starCount = mobile ? 70 : 160;
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * cssW,
      y: Math.random() * cssH,
      r: Math.random() * 1.1 + 0.3,
      a: Math.random() * 0.4 + 0.15,
      tw: Math.random() * 6.283,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
    }));

    // Floating dust motes — bigger, slower, glowing; fill the empty space
    // around the name and react to the cursor for an interactive feel
    const dustCount = mobile ? 26 : 55;
    dust = Array.from({ length: dustCount }, () => {
      const lime = Math.random() < 0.5;
      return {
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        r: 1.2 + Math.random() * 2.2,
        col: lime ? LIME : WHITE,
        a: 0.1 + Math.random() * 0.22,
        seed: Math.random() * 6.283,
        vy: -(0.05 + Math.random() * 0.16), // slow upward float, like embers
        sway: 14 + Math.random() * 26,
        ox: 0, oy: 0, // cursor-push offset, relaxes back
      };
    });

    refreshRect();
  }

  // ── Heavy burst: sparks fly out and die, name particles explode then form ─
  const EXPLODE_MS = 380, FORM_MS = 1200;

  function startBurst(instant) {
    const cx = W / 2, cy = H * 0.44;
    if (instant || reduced) {
      phase = 'formed';
      particles.forEach(q => { q.x = q.hx; q.y = q.hy; });
      return;
    }
    phase = 'exploding';
    phaseStart = performance.now();
    // Cluster the name particles at the launch point with outward velocity
    for (const q of particles) {
      q.x = cx + (Math.random() - 0.5) * 30;
      q.y = cy + (Math.random() - 0.5) * 30;
      const ang = Math.random() * 6.283;
      const spd = 3 + Math.random() * 14;
      q.vx = Math.cos(ang) * spd;
      q.vy = Math.sin(ang) * spd * 0.75;
    }
    // One-shot sparks for the heavy-burst flash
    const mobile = W < 760;
    const n = mobile ? 160 : 350;
    sparks = Array.from({ length: n }, () => {
      const ang = Math.random() * 6.283;
      const spd = 4 + Math.random() * 20;
      const lime = Math.random() < 0.6;
      return {
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.8,
        r: 0.8 + Math.random() * 2.2,
        col: lime ? LIME : WHITE,
        life: 1,
        decay: 0.012 + Math.random() * 0.022,
      };
    });
  }
  window.addEventListener('nameBurst', (e) => startBurst(e.detail && e.detail.instant));

  let tms = 0;
  function frame(now) {
    tms = now || 0;
    ctx.clearRect(0, 0, W, H);

    // Formation factor from the burst timeline (was scroll-driven before v5)
    let f = 0;
    if (phase === 'formed') f = 1;
    else if (phase === 'exploding') {
      if (tms - phaseStart >= EXPLODE_MS) {
        // Hand over to formation from wherever the explosion left them
        phase = 'forming';
        phaseStart = tms;
        particles.forEach(q => { q.sx = q.x; q.sy = q.y; });
      }
    } else if (phase === 'forming') {
      f = easeOutCubic(Math.min((tms - phaseStart) / FORM_MS, 1));
      if (f >= 1) phase = 'formed';
    }

    // Starfield (drawn first, dim, behind the name)
    for (const s of stars) {
      if (!reduced) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x += W; else if (s.x > W) s.x -= W;
        if (s.y < 0) s.y += H; else if (s.y > H) s.y -= H;
      }
      const tw = reduced ? 1 : 0.6 + 0.4 * Math.sin(tms * 0.002 + s.tw);
      ctx.fillStyle = `rgba(200,220,180,${(s.a * tw).toFixed(3)})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    ctx.globalCompositeOperation = 'lighter';
    const R = 92, R2 = R * R;

    // Floating dust motes — drift upward with a sway, pushed by the cursor
    const DR = 130, DR2 = DR * DR;
    for (const m of dust) {
      if (!reduced) {
        m.y += m.vy;
        if (m.y < -6) { m.y = H + 6; m.x = Math.random() * W; }
        if (pointerOn) {
          const dx = (m.x + m.ox) - mx, dy = (m.y + m.oy) - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < DR2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = ((DR - d) / DR) * 5;
            m.ox += (dx / d) * push;
            m.oy += (dy / d) * push;
          }
        }
        m.ox *= 0.9; m.oy *= 0.9; // relax the cursor push
      }
      const swayX = reduced ? 0 : Math.sin(tms * 0.00035 + m.seed) * m.sway;
      const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(tms * 0.0016 + m.seed * 2);
      const c = m.col;
      ctx.beginPath();
      ctx.arc(m.x + swayX + m.ox, m.y + m.oy, m.r, 0, 6.283);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(m.a * tw).toFixed(3)})`;
      ctx.fill();
    }

    // Name particles — additive so overlaps bloom into a glow
    for (const q of particles) {
      if (phase === 'exploding') {
        // Ballistic outward flight with drag
        q.x += q.vx; q.y += q.vy;
        q.vx *= 0.93; q.vy *= 0.93;
      } else {
        let sx = q.sx, sy = q.sy;
        if (!reduced && f < 1) {
          sx += Math.sin(tms * 0.0006 + q.seed) * q.drift;
          sy += Math.cos(tms * 0.0007 + q.seed) * q.drift;
        }
        let tx = sx + (q.hx - sx) * f;
        let ty = sy + (q.hy - sy) * f;
        if (!reduced) {
          // Perpetual micro-wobble so the assembled name shimmers alive
          tx += Math.sin(tms * 0.0013 + q.seed) * 1.6;
          ty += Math.cos(tms * 0.0011 + q.seed * 1.7) * 1.6;
        }
        q.x += (tx - q.x) * 0.14;
        q.y += (ty - q.y) * 0.14;
      }

      // Cursor repulsion — scatter whatever is near the pointer
      if (pointerOn && f > 0.12) {
        const dx = q.x - mx, dy = q.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = ((R - d) / R) * 26;
          q.x += (dx / d) * push;
          q.y += (dy / d) * push;
        }
      }

      const c = q.col;
      const tw = reduced ? 1 : 0.82 + 0.18 * Math.sin(tms * 0.0021 + q.seed * 3);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(q.a * tw).toFixed(3)})`;
      ctx.fillRect(q.x, q.y, q.size, q.size);
    }

    // One-shot burst sparks — fly, fade, die
    if (sparks.length) {
      for (const s of sparks) {
        s.x += s.vx; s.y += s.vy;
        s.vx *= 0.955; s.vy *= 0.955;
        s.life -= s.decay;
        if (s.life <= 0) continue;
        const c = s.col;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.5 + s.life * 0.5), 0, 6.283);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(s.life * 0.85).toFixed(3)})`;
        ctx.fill();
      }
      sparks = sparks.filter(s => s.life > 0);
    }
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(frame);
  }

  // Cursor tracking (skip repulsion entirely on touch/coarse devices)
  if (!coarse) {
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      pointerOn = true;
    }, { passive: true });
    window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) pointerOn = false; });
    window.addEventListener('blur', () => { pointerOn = false; });
  }
  window.addEventListener('scroll', refreshRect, { passive: true });

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(build, 180);
  });

  // Syne may still be loading; rebuild once it's ready so glyphs are correct
  build();
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
})();

// ── YR. keyboard: scroll-scrubbed exploded-view image sequence ─
(function keyboardShowcase() {
  const section = document.getElementById('keyboard-showcase');
  const canvas = document.getElementById('kbCanvas');
  if (!section || !canvas) return;

  const FRAME_COUNT = 192;
  const BASE_PATH = 'Keboard Sequence';
  const STUDIO_BG = '#e7e7e4';
  const frameUrl = (i) => encodeURI(`${BASE_PATH}/${String(i + 1).padStart(5, '0')}.jpg`);

  const reducedFrame = document.getElementById('kbReducedFrame');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: one static frame, no scroll wiring, no preloading the rest
  if (reduced) {
    section.classList.add('kb-reduced');
    if (reducedFrame) reducedFrame.src = frameUrl(Math.floor(FRAME_COUNT * 0.5));
    return;
  }

  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('kbLoader');
  const percentEl = document.getElementById('kbPercent');
  const scenes = Array.from(section.querySelectorAll('.kb-scene'));

  let dpr = 1, W = 0, H = 0;
  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let currentFrame = -1;

  function draw(img) {
    if (!img || !img.naturalWidth || !W || !H) return;
    ctx.fillStyle = STUDIO_BG;
    ctx.fillRect(0, 0, W, H);
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = W / H;
    let dw, dh;
    if (ir > cr) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentFrame >= 0) draw(images[currentFrame]);
  }

  function loadFrame(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const done = () => {
        loadedCount++;
        if (percentEl) percentEl.textContent = Math.round((loadedCount / FRAME_COUNT) * 100);
        resolve();
      };
      img.onload = () => (img.decode ? img.decode().then(done).catch(done) : done());
      img.onerror = done;
      images[i] = img;
      img.src = frameUrl(i);
    });
  }

  const CONCURRENCY = 12;
  async function loadAll() {
    await loadFrame(0);
    currentFrame = 0;
    draw(images[0]);

    let next = 1;
    async function worker() {
      while (next < FRAME_COUNT) {
        const i = next++;
        await loadFrame(i);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, FRAME_COUNT) }, worker));

    if (loader) {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 700);
    }
  }

  // Clamped piecewise-linear interpolation for the scroll-tied scene fades
  function mapRange(v, range, out) {
    if (v <= range[0]) return out[0];
    const last = range.length - 1;
    if (v >= range[last]) return out[last];
    for (let i = 0; i < last; i++) {
      if (v >= range[i] && v <= range[i + 1]) {
        const t = (v - range[i]) / (range[i + 1] - range[i]);
        return out[i] + t * (out[i + 1] - out[i]);
      }
    }
    return out[last];
  }

  const WINDOW = 0.1;
  const sceneRanges = scenes.map((el) => {
    const at = parseFloat(el.dataset.kbAt);
    const isFirst = at <= 0;
    const isLast = at >= 1;
    const range = isFirst
      ? [0, WINDOW * 0.6, WINDOW]
      : isLast
      ? [1 - WINDOW, 1 - WINDOW * 0.4, 1]
      : [at - WINDOW, at, at + WINDOW * 0.6, at + WINDOW];
    const opacityOut = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];
    const yOut = isFirst ? [0, 0, -24] : isLast ? [24, 0, 0] : [24, 0, 0, -24];
    return { el, range, opacityOut, yOut };
  });

  let ticking = false;
  function update() {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const trackHeight = section.offsetHeight - window.innerHeight;
    const progress = trackHeight > 0 ? Math.min(1, Math.max(0, -rect.top / trackHeight)) : 0;

    const frameIndex = Math.round(progress * (FRAME_COUNT - 1));
    if (frameIndex !== currentFrame && images[frameIndex] && images[frameIndex].naturalWidth) {
      currentFrame = frameIndex;
      draw(images[frameIndex]);
    }

    sceneRanges.forEach(({ el, range, opacityOut, yOut }) => {
      el.style.opacity = mapRange(progress, range, opacityOut);
      el.style.setProperty('--kb-y', mapRange(progress, range, yOut) + 'px');
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { resize(); update(); });

  resize();
  loadAll();
  update();
})();
