/* JDC Facebook Ad — three 30s variations using real photography.
   1080x1080. Auto-loops. */

const { useState, useEffect, useRef } = React;
const DURATION = 30;

/* timeline — returns [t, { play, pause, toggle, seek, playing }] */
function useTimeline(duration = DURATION) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const tRef = useRef(0);
  tRef.current = t;

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(rafRef.current); return; }
    startRef.current = performance.now();
    baseRef.current = tRef.current;
    const tick = (now) => {
      const elapsed = (now - startRef.current) / 1000;
      const next = (baseRef.current + elapsed) % duration;
      setT(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration]);

  const seek = (newT) => {
    const v = ((newT % duration) + duration) % duration;
    setT(v);
    baseRef.current = v;
    startRef.current = performance.now();
  };

  return [t, {
    playing,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
    seek,
  }];
}

const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOut: (t) => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2),
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function p(t, a, b) { if (t<=a) return 0; if (t>=b) return 1; return (t-a)/(b-a); }
function vis(t, a, b, fi=0.3, fo=0.3) {
  if (t<a) return 0; if (t>b) return 0;
  if (t<a+fi) return ease.out(p(t,a,a+fi));
  if (t>b-fo) return 1 - ease.out(p(t,b-fo,b));
  return 1;
}
function lerp(a, b, t) { return a + (b - a) * t; }

/* ========================================================================
   PHOTO COMPONENTS — real images with motion
   ======================================================================== */

// 2D plan: top half of floor-plan.webp (image is 1333x2000, 2D is roughly top half)
function PhotoPlan2D({ progress = 1, scale = 1 }) {
  // progress 0..1 — sweep a "draftsman's reveal" from left
  // Use a clip-path that starts from the left
  const clip = lerp(0, 100, ease.outQuint(progress));
  return (
    <div className="photo-frame">
      <div className="photo-blueprint-wash"/>
      <div
        className="photo-img plan-2d"
        style={{
          backgroundImage: `url("assets/floor-plan.webp")`,
          transform: `scale(${scale})`,
          clipPath: `inset(0 ${100 - clip}% 0 0)`,
        }}
      />
      {/* draftsman's edge — gold line that sweeps across */}
      <div
        className="photo-sweep-line"
        style={{
          left: `${clip}%`,
          opacity: clip > 0.5 && clip < 99 ? 1 : 0,
        }}
      />
      {/* corner registration marks */}
      <div className="reg-marks">
        <div className="reg tl"/><div className="reg tr"/>
        <div className="reg bl"/><div className="reg br"/>
      </div>
    </div>
  );
}

// 3D plan: bottom half of same image — colored overhead with wood floors etc.
function PhotoPlan3D({ progress = 1, scale = 1 }) {
  // progress drives a "color floods in" — start desaturated, settle to full
  const sat = lerp(0, 1, ease.out(progress));
  const opacity = ease.out(progress);
  return (
    <div className="photo-frame">
      <div className="photo-blueprint-wash"/>
      <div
        className="photo-img plan-3d"
        style={{
          backgroundImage: `url("assets/floor-plan.webp")`,
          transform: `scale(${scale})`,
          filter: `saturate(${sat}) brightness(${lerp(1.15, 1, sat)})`,
          opacity,
        }}
      />
      <div className="reg-marks">
        <div className="reg tl"/><div className="reg tr"/>
        <div className="reg bl"/><div className="reg br"/>
      </div>
    </div>
  );
}

// 3D cutaway render — for the "vision" / "see inside" beat
function PhotoCutaway({ progress = 1, scale = 1 }) {
  const opacity = ease.out(progress);
  return (
    <div className="photo-frame">
      <div
        className="photo-img cutaway"
        style={{
          backgroundImage: `url("assets/render-cutaway.png")`,
          transform: `scale(${scale})`,
          opacity,
        }}
      />
    </div>
  );
}

// Finished home photo — ken-burns
function PhotoFinished({ progress = 1, kenburns = true }) {
  // slow zoom from 1.0 → 1.08 over the duration of the scene
  const sc = kenburns ? lerp(1.02, 1.12, progress) : 1;
  const opacity = ease.out(clamp(progress / 0.4, 0, 1));
  return (
    <div className="photo-frame">
      <div
        className="photo-img finished"
        style={{
          backgroundImage: `url("assets/finished-home.jpg")`,
          transform: `scale(${sc})`,
          opacity,
        }}
      />
      {/* subtle vignette */}
      <div className="photo-vignette"/>
    </div>
  );
}

/* ========================================================================
   AD 1 — ARCHITECTURAL
   ======================================================================== */
function AdArchitectural({ t }) {
  const phase1Op = vis(t, 2.5, 9.5, 0.5, 0.7);
  const phase2Op = vis(t, 9, 16.5, 0.5, 0.7);
  const phase3Op = vis(t, 16, 23.5, 0.5, 0.7);

  const phase1P = ease.outQuint(p(t, 2.8, 8.5));
  const phase2P = ease.outQuint(p(t, 9.3, 15.5));
  const phase3P = p(t, 16, 24);

  const phase1Active = t >= 2.5 && t <= 9.5;
  const phase2Active = t >= 9 && t <= 16.5;
  const phase3Active = t >= 16 && t <= 23.5;

  const phase1Scale = 1 + 0.04 * p(t, 2.5, 9.5);
  const phase2Scale = 1 + 0.04 * p(t, 9, 16.5);

  return (
    <div className="ad-stage" style={{background: "#fafaf7"}}>
      <div className="bp-grid"/>

      <div className="top-chrome">
        <img src="assets/jdc-icon.png" alt="" className="top-icon"/>
        <div className="top-rule"/>
        <div className="top-meta">
          <span>JDC / FILM 01</span>
          <span>Foundation to Keys</span>
        </div>
      </div>

      {/* INTRO */}
      <div className="layer" style={{opacity: vis(t, 0, 3, 0.3, 0.6)}}>
        <div className="intro-block">
          <div className="intro-eyebrow">JDC Construction · Est. 1996</div>
          <div className="intro-title">
            From <em>blueprint</em><br/>to <em>keys.</em>
          </div>
          <div className="intro-sub">A custom home in three measured moves.</div>
        </div>
      </div>

      {/* Phase 1 — 2D plan reveal */}
      <div className="phase-wrap" style={{opacity: phase1Op}}>
        <PhotoPlan2D progress={phase1P} scale={phase1Scale}/>
      </div>

      {/* Phase 2 — 3D cutaway render */}
      <div className="phase-wrap" style={{opacity: phase2Op}}>
        <PhotoCutaway progress={phase2P} scale={phase2Scale}/>
      </div>

      {/* Phase 3 — finished home, ken burns */}
      <div className="phase-wrap" style={{opacity: phase3Op}}>
        <PhotoFinished progress={phase3P}/>
      </div>

      <PhaseBanner opacity={phase1Op} num="01" title="Drafted" sub="Plans drawn around how you live."/>
      <PhaseBanner opacity={phase2Op} num="02" title="Rendered" sub="See it in 3D before a stake hits the ground."/>
      <PhaseBanner opacity={phase3Op} num="03" title="Built" sub="Finished, furnished, keys in hand."/>

      {/* CTA */}
      <div className="layer cta-layer" style={{opacity: vis(t, 23, 30, 0.5, 0.3)}}>
        <div className="cta-card">
          <div className="cta-eyebrow">Now booking · Southeast Indiana</div>
          <div className="cta-title">Your home,<br/>on the <em>level.</em></div>
          <div className="cta-rule"/>
          <div className="cta-body">Family-run general contracting for custom homes, additions, and remodels.</div>
          <div className="cta-button">
            <span>Get a Quote</span>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </div>
          <div className="cta-foot">JDC Construction · Est. 1996</div>
        </div>
      </div>

      <ProgressBar t={t} duration={DURATION}/>
    </div>
  );
}

function PhaseBanner({ opacity, num, title, sub }) {
  return (
    <div className="phase-banner" style={{opacity}}>
      <div className="pb-num">{num}</div>
      <div className="pb-rule"/>
      <div className="pb-text">
        <div className="pb-title">{title}</div>
        <div className="pb-sub">{sub}</div>
      </div>
    </div>
  );
}

function ProgressBar({ t, duration }) {
  return (
    <div className="prog-bar">
      <div className="prog-fill" style={{width: `${(t/duration)*100}%`}}/>
    </div>
  );
}

/* ========================================================================
   AD 2 — SNAPPY
   ======================================================================== */
function AdSnappy({ t }) {
  const hookOp = vis(t, 0, 2, 0.25, 0.5);
  const s1Op = vis(t, 1.7, 6, 0.3, 0.6);
  const s2Op = vis(t, 6, 12.5, 0.3, 0.6);
  const s3Op = vis(t, 12.5, 19.5, 0.3, 0.6);
  const proofOp = vis(t, 19, 23.5, 0.3, 0.5);
  const ctaOp = vis(t, 23, 30, 0.4, 0.3);

  const fp1 = ease.outQuint(p(t, 2, 5.5));
  const r3p = ease.outQuint(p(t, 6.3, 11.5));
  const fhp = p(t, 12.8, 19.5);

  const s1X = lerp(-100, 0, ease.out(p(t, 1.7, 2.5))) + lerp(0, -100, ease.out(p(t, 5.5, 6.2)));
  const s2X = lerp(100, 0, ease.out(p(t, 6, 6.8))) + lerp(0, -100, ease.out(p(t, 12, 12.7)));
  const s3X = lerp(100, 0, ease.out(p(t, 12.5, 13.3))) + lerp(0, -100, ease.out(p(t, 18.8, 19.5)));

  const hookScale = 1 + 0.05 * (1 - ease.out(p(t, 0, 1.5)));

  return (
    <div className="ad-stage" style={{background: "#091b37", color: "#fafaf7"}}>
      <div className="bp-grid dark"/>

      {/* HOOK */}
      <div className="layer hook-layer" style={{opacity: hookOp}}>
        <div className="hook-card" style={{transform:`scale(${hookScale})`}}>
          <div className="hook-eyebrow">↓ Watch how a custom home gets built</div>
          <div className="hook-title">From <span className="g">flat paper</span><br/>to <span className="g">front door.</span></div>
          <div className="hook-meta">30 seconds · JDC Construction</div>
        </div>
      </div>

      {/* STEP 1 — 2D plan */}
      <div className="step-layer" style={{opacity: s1Op, transform:`translateX(${s1X}%)`}}>
        <div className="step-numblock">
          <div className="step-num">01</div>
          <div className="step-name">Floor Plan</div>
        </div>
        <div className="step-art photo">
          <PhotoPlan2D progress={fp1}/>
        </div>
        <div className="step-caption">
          <strong>Designed around how you live.</strong>
          Every wall, every window — drawn for you, not from a catalog.
        </div>
      </div>

      {/* STEP 2 — 3D render */}
      <div className="step-layer" style={{opacity: s2Op, transform:`translateX(${s2X}%)`}}>
        <div className="step-numblock">
          <div className="step-num">02</div>
          <div className="step-name">3D Render</div>
        </div>
        <div className="step-art photo">
          <PhotoCutaway progress={r3p}/>
        </div>
        <div className="step-caption">
          <strong>See it before we build it.</strong>
          Walk the rooms, change a finish, move a window. No surprises.
        </div>
      </div>

      {/* STEP 3 — finished */}
      <div className="step-layer" style={{opacity: s3Op, transform:`translateX(${s3X}%)`}}>
        <div className="step-numblock">
          <div className="step-num">03</div>
          <div className="step-name">Move In</div>
        </div>
        <div className="step-art photo">
          <PhotoFinished progress={fhp}/>
        </div>
        <div className="step-caption">
          <strong>Finished, furnished, lit.</strong>
          We hand you keys to a home — not a punch list.
        </div>
      </div>

      {/* PROOF */}
      <div className="layer proof-layer" style={{opacity: proofOp}}>
        <div className="proof-grid">
          <div className="proof-cell">
            <div className="proof-num">30<small>+ yrs</small></div>
            <div className="proof-lab">Family-run, since 1996</div>
          </div>
          <div className="proof-cell">
            <div className="proof-num">100<small>%</small></div>
            <div className="proof-lab">Custom — no two alike</div>
          </div>
          <div className="proof-cell">
            <div className="proof-num">SE<small> IN</small></div>
            <div className="proof-lab">Local crews, local lumber</div>
          </div>
          <div className="proof-cell">
            <div className="proof-num">0<small></small></div>
            <div className="proof-lab">Cookie-cutter floor plans</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="layer cta-layer snappy" style={{opacity: ctaOp}}>
        <div className="cta-snappy">
          <div className="cta-snappy-top">
            <img src="assets/jdc-icon.png" alt="" className="cta-icon"/>
            <div className="cta-snappy-eyebrow">Booking 2026 builds now</div>
          </div>
          <div className="cta-snappy-title">Bring us<br/>your land.</div>
          <div className="cta-snappy-sub">We'll bring the plans, the renders, the crew, the keys.</div>
          <div className="cta-snappy-button">Get Your Free Quote →</div>
          <div className="cta-snappy-foot">JDC Construction · Built on the level.</div>
        </div>
      </div>

      <ProgressBar t={t} duration={DURATION}/>
    </div>
  );
}

/* ========================================================================
   AD 3 — EDITORIAL
   ======================================================================== */
function AdEditorial({ t }) {
  const coverOp = vis(t, 0, 4.5, 0.4, 0.6);
  const s1Op = vis(t, 4, 11.5, 0.5, 0.6);
  const s2Op = vis(t, 11, 18.5, 0.5, 0.6);
  const s3Op = vis(t, 18, 25.5, 0.5, 0.6);
  const closeOp = vis(t, 25, 30, 0.5, 0.3);

  const fp1 = ease.outQuint(p(t, 4.3, 10.5));
  const r3p = ease.outQuint(p(t, 11.3, 17.5));
  const fhp = p(t, 18.3, 25.5);

  return (
    <div className="ad-stage" style={{background: "#fafaf7"}}>
      {/* COVER */}
      <div className="layer ed-cover" style={{opacity: coverOp}}>
        <div className="ed-cover-frame">
          <div className="ed-folio">
            <span>JDC</span>
            <span className="ed-folio-verse">Col. 3:23</span>
          </div>
          <div className="ed-cover-title">How a<br/><em>house</em><br/>becomes a<br/><em>home.</em></div>
          <div className="ed-cover-foot">
            <img src="assets/jdc-logo-horizontal.png" alt="JDC Construction" className="ed-cover-logo"/>
            <div className="ed-cover-foot-tag">Est. 1996</div>
          </div>
        </div>
      </div>

      {/* SPREAD 1 — Plan */}
      <div className="layer ed-spread" style={{opacity: s1Op}}>
        <div className="ed-grid">
          <div className="ed-text">
            <div className="ed-num">I.</div>
            <div className="ed-h">The Plan</div>
            <div className="ed-rule"/>
            <p className="ed-p">A good home starts with a good plan. We sit with you, take notes, and go back to the table. When you see the drawings, you'll recognize your life on the page — every room where it ought to be.</p>
            <div className="ed-tag">Drafted in-house</div>
          </div>
          <div className="ed-art photo">
            <PhotoPlan2D progress={fp1}/>
          </div>
        </div>
      </div>

      {/* SPREAD 2 — Vision */}
      <div className="layer ed-spread" style={{opacity: s2Op}}>
        <div className="ed-grid reverse">
          <div className="ed-art photo">
            <PhotoCutaway progress={r3p}/>
          </div>
          <div className="ed-text">
            <div className="ed-num">II.</div>
            <div className="ed-h">The Vision</div>
            <div className="ed-rule"/>
            <p className="ed-p">Then we render it. Walls rise in 3D, finishes go on, the porch light comes on. You walk through your home before we ever break ground — and change anything you'd like.</p>
            <div className="ed-tag">Photoreal renders</div>
          </div>
        </div>
      </div>

      {/* SPREAD 3 — Home */}
      <div className="layer ed-spread" style={{opacity: s3Op}}>
        <div className="ed-grid">
          <div className="ed-text">
            <div className="ed-num">III.</div>
            <div className="ed-h">The Home</div>
            <div className="ed-rule"/>
            <p className="ed-p">And then we build it. Our crews are local, our subs are vetted, our standard is plumb and square. When we're done, you don't get a punch list — you get keys.</p>
            <div className="ed-tag">Fully custom built for you</div>
          </div>
          <div className="ed-art photo">
            <PhotoFinished progress={fhp}/>
          </div>
        </div>
      </div>

      {/* CLOSING */}
      <div className="layer ed-close" style={{opacity: closeOp}}>
        <div className="ed-close-frame">
          <div className="ed-close-cta">
            <div className="ed-close-title">Ready to start your <em>plan?</em></div>
            <div className="ed-close-button">Get a Quote →</div>
          </div>
          <div className="ed-close-rule"/>
          <div className="ed-close-foot">
            <div className="ed-close-verse-block">
              <div className="ed-verse">Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.</div>
              <div className="ed-verse-ref">— Colossians 3:23</div>
            </div>
            <img src="assets/jdc-logo-stacked.png" alt="JDC Construction" className="ed-close-logo"/>
          </div>
        </div>
      </div>

      <ProgressBar t={t} duration={DURATION}/>
    </div>
  );
}

/* Scene chapters per ad — start times in seconds */
const SCENES = {
  editorial: [
    { t: 0,    label: "Cover" },
    { t: 4.5,  label: "Plan" },
    { t: 11.5, label: "Vision" },
    { t: 18.5, label: "Home" },
    { t: 25.5, label: "Closing" },
  ],
  snappy: [
    { t: 0,    label: "Hook" },
    { t: 2,    label: "Plan" },
    { t: 6.5,  label: "Build" },
    { t: 13,   label: "Home" },
    { t: 19.5, label: "Proof" },
    { t: 24,   label: "Closing" },
  ],
  architectural: [
    { t: 0,    label: "Intro" },
    { t: 3,    label: "Plan" },
    { t: 9.5,  label: "Build" },
    { t: 16.5, label: "Home" },
    { t: 23,   label: "Closing" },
  ],
};

/* WRAPPER */
function Ad({ component: Component, scenes = SCENES.editorial }) {
  const [t, ctrl] = useTimeline(DURATION);

  // current scene index
  let sceneIdx = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (t >= scenes[i].t) sceneIdx = i;
  }
  const current = scenes[sceneIdx];

  const goPrev = () => {
    // If we're more than 0.6s into a scene, restart it; otherwise go to previous scene.
    if (t - current.t > 0.6 || sceneIdx === 0) {
      ctrl.seek(current.t);
    } else {
      ctrl.seek(scenes[sceneIdx - 1].t);
    }
  };
  const goNext = () => {
    const next = scenes[sceneIdx + 1];
    ctrl.seek(next ? next.t : 0);
  };

  // keyboard: space = play/pause, ←/→ = prev/next scene
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); ctrl.toggle(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // progress %
  const pct = (t / DURATION) * 100;

  // scrubber click
  const trackRef = useRef(null);
  const onTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    ctrl.seek(clamp(x, 0, 1) * DURATION);
  };

  return (
    <div className="ad-shell">
      <div className="ad-frame">
        <Component t={t}/>
      </div>

      <div className="ad-controls" onClick={(e) => e.stopPropagation()}>
        <button
          className="ad-btn ad-btn-icon"
          onClick={goPrev}
          aria-label="Previous scene"
          title="Previous scene (←)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/>
            <line x1="6" y1="4" x2="6" y2="20"/>
          </svg>
        </button>

        <button
          className="ad-btn ad-btn-play"
          onClick={ctrl.toggle}
          aria-label={ctrl.playing ? "Pause" : "Play"}
          title={ctrl.playing ? "Pause (space)" : "Play (space)"}
        >
          {ctrl.playing ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4"/>
            </svg>
          )}
        </button>

        <button
          className="ad-btn ad-btn-icon"
          onClick={goNext}
          aria-label="Next scene"
          title="Next scene (→)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/>
            <line x1="18" y1="4" x2="18" y2="20"/>
          </svg>
        </button>

        <div className="ad-track-wrap">
          <div className="ad-track" ref={trackRef} onClick={onTrackClick}>
            <div className="ad-track-fill" style={{ width: `${pct}%` }}/>
            {scenes.map((s, i) => (
              <button
                key={i}
                className={`ad-tick ${i === sceneIdx ? "active" : ""}`}
                style={{ left: `${(s.t / DURATION) * 100}%` }}
                onClick={(e) => { e.stopPropagation(); ctrl.seek(s.t); }}
                title={s.label}
                aria-label={`Jump to ${s.label}`}
              />
            ))}
          </div>
          <div className="ad-track-meta">
            <span className="ad-scene-label">{String(sceneIdx + 1).padStart(2,"0")} · {current.label}</span>
            <span className="ad-time-label">{t.toFixed(1)}s / {DURATION}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Ad = Ad;
window.SCENES = SCENES;
window.AdArchitectural = AdArchitectural;
window.AdSnappy = AdSnappy;
window.AdEditorial = AdEditorial;
