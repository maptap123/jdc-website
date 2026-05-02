/* JDC Facebook Ad — three 30s variations
   1080x1080. Each variation is a self-contained React component.
   Single shared timeline (0..30s) per ad with looped playback. */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ========================================================================
   SHARED: timeline hook
   ======================================================================== */
const DURATION = 30; // seconds

function useTimeline(duration = DURATION, playing = true) {
  const [t, setT] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now();
    baseRef.current = t;
    const tick = (now) => {
      const elapsed = (now - startRef.current) / 1000;
      const next = (baseRef.current + elapsed) % duration;
      setT(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [playing, duration]);

  return t;
}

/* ========================================================================
   SHARED: easing + helpers
   ======================================================================== */
const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  linear: (t) => t,
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// progress within window [a..b], 0..1, clamped
function p(t, a, b) {
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

// visibility: fades in over [a..a+fi], stays, fades out over [b-fo..b]
function vis(t, a, b, fi = 0.3, fo = 0.3) {
  if (t < a) return 0;
  if (t > b) return 0;
  if (t < a + fi) return ease.out(p(t, a, a + fi));
  if (t > b - fo) return 1 - ease.out(p(t, b - fo, b));
  return 1;
}

// linear interpolate
function lerp(a, b, t) { return a + (b - a) * t; }

/* ========================================================================
   PLACEHOLDER ASSETS — drawn with SVG so we can keep them on-brand
   while real photos are wired up.
   ======================================================================== */

// 2D Floor Plan placeholder — animated draw-in
function FloorPlan({ progress = 1, accent = "#091b37", ink = "#465462" }) {
  // progress 0..1 — controls how much of the plan is "drawn"
  // We'll stagger walls, then dimensions, then labels.
  const wallP = clamp(progress / 0.55, 0, 1);
  const dimP = clamp((progress - 0.45) / 0.35, 0, 1);
  const labelP = clamp((progress - 0.7) / 0.3, 0, 1);

  // Walls: array of paths with their length to do stroke draw-on
  // Outer rectangle + interior partitions
  const walls = [
    "M 80 80 L 720 80",         // top
    "M 720 80 L 720 600",       // right
    "M 720 600 L 80 600",       // bottom
    "M 80 600 L 80 80",         // left
    "M 80 280 L 360 280",       // h interior 1
    "M 360 80 L 360 280",       // v interior 1
    "M 360 280 L 360 600",      // v interior 2
    "M 360 440 L 720 440",      // h interior 2
    "M 540 440 L 540 600",      // v interior 3
  ];

  const wallStyle = (i) => {
    const stagger = i / walls.length;
    const local = clamp((wallP - stagger * 0.5) / 0.5, 0, 1);
    return {
      strokeDasharray: 2000,
      strokeDashoffset: 2000 * (1 - local),
    };
  };

  return (
    <svg viewBox="0 0 800 680" width="100%" height="100%" style={{display:"block"}}>
      {/* paper bg + grid */}
      <rect x="0" y="0" width="800" height="680" fill="#fafaf7"/>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#091b37" strokeOpacity="0.06" strokeWidth="0.5"/>
        </pattern>
        <pattern id="gridMaj" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#091b37" strokeOpacity="0.12" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="800" height="680" fill="url(#grid)"/>
      <rect x="0" y="0" width="800" height="680" fill="url(#gridMaj)"/>

      {/* corner registration marks */}
      {[[20,20],[780,20],[20,660],[780,660]].map(([x,y],i)=>(
        <g key={i} stroke="#091b37" strokeOpacity="0.4" strokeWidth="0.8" fill="none">
          <circle cx={x} cy={y} r="6"/>
          <line x1={x-10} y1={y} x2={x+10} y2={y}/>
          <line x1={x} y1={y-10} x2={x} y2={y+10}/>
        </g>
      ))}

      {/* walls */}
      <g stroke={accent} strokeWidth="6" fill="none" strokeLinecap="square">
        {walls.map((d, i) => (
          <path key={i} d={d} style={wallStyle(i)}/>
        ))}
      </g>

      {/* doors / openings (gaps + arcs) */}
      <g stroke={accent} strokeWidth="1.5" fill="none" opacity={dimP}>
        <path d="M 200 280 A 60 60 0 0 1 260 220" />
        <line x1="200" y1="280" x2="260" y2="280"/>
        <path d="M 540 440 A 50 50 0 0 1 590 390" />
        <line x1="540" y1="440" x2="590" y2="440"/>
      </g>

      {/* dimensions */}
      <g stroke={ink} strokeWidth="0.8" fill={ink} opacity={dimP} fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="1">
        <line x1="80" y1="50" x2="720" y2="50"/>
        <line x1="80" y1="40" x2="80" y2="60"/>
        <line x1="720" y1="40" x2="720" y2="60"/>
        <text x="400" y="40" textAnchor="middle" stroke="none">52' - 0"</text>

        <line x1="50" y1="80" x2="50" y2="600"/>
        <line x1="40" y1="80" x2="60" y2="80"/>
        <line x1="40" y1="600" x2="60" y2="600"/>
        <text x="38" y="340" textAnchor="middle" stroke="none" transform="rotate(-90 38 340)">42' - 6"</text>
      </g>

      {/* room labels */}
      <g fill={accent} fontFamily="Cormorant Garamond, serif" opacity={labelP}>
        <text x="220" y="170" textAnchor="middle" fontSize="22" fontStyle="italic">Great Room</text>
        <text x="220" y="190" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="1.5" fill={ink}>22' × 18'</text>

        <text x="220" y="430" textAnchor="middle" fontSize="20" fontStyle="italic">Kitchen</text>
        <text x="220" y="540" textAnchor="middle" fontSize="20" fontStyle="italic">Dining</text>

        <text x="540" y="240" textAnchor="middle" fontSize="22" fontStyle="italic">Primary Suite</text>
        <text x="540" y="360" textAnchor="middle" fontSize="18" fontStyle="italic">Bath</text>
        <text x="630" y="540" textAnchor="middle" fontSize="18" fontStyle="italic">Bed 2</text>
        <text x="450" y="540" textAnchor="middle" fontSize="18" fontStyle="italic">Bed 3</text>
      </g>

      {/* title block */}
      <g opacity={labelP}>
        <rect x="560" y="620" width="220" height="50" fill="none" stroke="#091b37" strokeOpacity="0.4" strokeWidth="0.8"/>
        <text x="572" y="640" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="1.5" fill="#465462">SHEET A-101</text>
        <text x="572" y="658" fontFamily="Cormorant Garamond, serif" fontSize="14" fill="#091b37" fontStyle="italic">Hawthorne Residence</text>
      </g>
    </svg>
  );
}

// 3D Render placeholder — wireframe house with build-up materials
function Render3D({ progress = 1 }) {
  // progress 0..1: wireframe → walls fill → roof + windows → landscaping
  const wireP = clamp(progress / 0.4, 0, 1);
  const fillP = clamp((progress - 0.3) / 0.4, 0, 1);
  const detailP = clamp((progress - 0.6) / 0.4, 0, 1);

  return (
    <svg viewBox="0 0 800 680" width="100%" height="100%" style={{display:"block"}}>
      {/* sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#dde4ee"/>
          <stop offset="1" stopColor="#fafaf7"/>
        </linearGradient>
        <linearGradient id="wallFace" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f1efe8"/>
          <stop offset="1" stopColor="#d8d3c5"/>
        </linearGradient>
        <linearGradient id="wallSide" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c9c2b1"/>
          <stop offset="1" stopColor="#a8a294"/>
        </linearGradient>
        <linearGradient id="roof" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3a4555"/>
          <stop offset="1" stopColor="#22293a"/>
        </linearGradient>
        <linearGradient id="window" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2b900" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#d99a00" stopOpacity="0.55"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="800" height="680" fill="url(#sky)"/>

      {/* ground */}
      <rect x="0" y="500" width="800" height="180" fill="#9aa493" opacity={fillP*0.9}/>
      <rect x="0" y="500" width="800" height="180" fill="url(#grid3d)" opacity={wireP*0.4}/>
      <defs>
        <pattern id="grid3d" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#091b37" strokeOpacity="0.12" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* House: simple 2-pt perspective */}
      {/* Side wall (left) */}
      <polygon
        points="120,500 360,500 360,260 120,320"
        fill="url(#wallSide)"
        opacity={fillP}
      />
      {/* Front face */}
      <polygon
        points="360,500 680,500 680,260 360,260"
        fill="url(#wallFace)"
        opacity={fillP}
      />
      {/* Roof — front slope */}
      <polygon
        points="340,260 700,260 660,160 380,160"
        fill="url(#roof)"
        opacity={detailP}
      />
      {/* Roof — side slope */}
      <polygon
        points="120,320 360,260 380,160 140,220"
        fill="#22293a"
        opacity={detailP * 0.85}
      />

      {/* Windows */}
      <g opacity={detailP}>
        <rect x="400" y="320" width="80" height="120" fill="url(#window)" stroke="#091b37" strokeWidth="2"/>
        <line x1="440" y1="320" x2="440" y2="440" stroke="#091b37" strokeWidth="2"/>
        <line x1="400" y1="380" x2="480" y2="380" stroke="#091b37" strokeWidth="2"/>

        <rect x="560" y="320" width="80" height="120" fill="url(#window)" stroke="#091b37" strokeWidth="2"/>
        <line x1="600" y1="320" x2="600" y2="440" stroke="#091b37" strokeWidth="2"/>
        <line x1="560" y1="380" x2="640" y2="380" stroke="#091b37" strokeWidth="2"/>

        {/* door */}
        <rect x="490" y="370" width="60" height="130" fill="#1c2535" stroke="#091b37" strokeWidth="2"/>
        <circle cx="540" cy="438" r="2" fill="#f2b900"/>
        {/* porch light */}
        <circle cx="475" cy="370" r="6" fill="#f2b900" opacity="0.9"/>
        <circle cx="475" cy="370" r="14" fill="#f2b900" opacity="0.2"/>
      </g>

      {/* Wireframe overlay — fades out as fill comes in */}
      <g
        stroke="#091b37"
        strokeWidth="1.5"
        fill="none"
        opacity={Math.max(0, wireP - fillP * 0.9)}
      >
        <polygon points="120,500 360,500 360,260 120,320"/>
        <polygon points="360,500 680,500 680,260 360,260"/>
        <polygon points="340,260 700,260 660,160 380,160"/>
        <polygon points="120,320 360,260 380,160 140,220"/>
        {/* construction lines */}
        <line x1="120" y1="500" x2="360" y2="500" strokeDasharray="3 3"/>
        <line x1="360" y1="260" x2="380" y2="160" strokeDasharray="3 3"/>
        <line x1="700" y1="260" x2="680" y2="500" strokeDasharray="3 3"/>
      </g>

      {/* landscaping */}
      <g opacity={detailP}>
        <ellipse cx="180" cy="540" rx="50" ry="14" fill="#091b37" opacity="0.18"/>
        <circle cx="180" cy="510" r="38" fill="#5d7556"/>
        <circle cx="160" cy="495" r="22" fill="#6d855e"/>

        <ellipse cx="720" cy="560" rx="60" ry="14" fill="#091b37" opacity="0.18"/>
        <circle cx="720" cy="525" r="42" fill="#5d7556"/>

        {/* path */}
        <polygon points="490,500 550,500 580,580 460,580" fill="#c9c2b1"/>
      </g>

      {/* dimension callouts (technical) — fade out */}
      <g
        stroke="#465462"
        strokeWidth="0.8"
        fill="#465462"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
        letterSpacing="1"
        opacity={Math.max(0, wireP - detailP * 1.2)}
      >
        <line x1="360" y1="240" x2="680" y2="240"/>
        <line x1="360" y1="234" x2="360" y2="246"/>
        <line x1="680" y1="234" x2="680" y2="246"/>
        <text x="520" y="232" textAnchor="middle" stroke="none">32' - 0"</text>
      </g>
    </svg>
  );
}

// Finished home photo placeholder — warm, lived-in scene
function FinishedHome({ progress = 1 }) {
  // progress controls a subtle fade up + windows lighting up
  const lights = clamp((progress - 0.3) / 0.5, 0, 1);
  return (
    <svg viewBox="0 0 800 680" width="100%" height="100%" style={{display:"block"}}>
      <defs>
        <linearGradient id="dusk" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a3a55"/>
          <stop offset="0.5" stopColor="#5c5544"/>
          <stop offset="1" stopColor="#3d3325"/>
        </linearGradient>
        <linearGradient id="warmWindow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff1bf"/>
          <stop offset="1" stopColor="#f2b900"/>
        </linearGradient>
        <radialGradient id="windowGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff1bf" stopOpacity="0.6"/>
          <stop offset="1" stopColor="#fff1bf" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="finishedWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3a3225"/>
          <stop offset="1" stopColor="#2a2218"/>
        </linearGradient>
      </defs>

      {/* dusk sky */}
      <rect x="0" y="0" width="800" height="680" fill="url(#dusk)"/>

      {/* distant tree silhouettes */}
      <g fill="#1a1410" opacity="0.6">
        <ellipse cx="60" cy="450" rx="60" ry="80"/>
        <ellipse cx="760" cy="440" rx="50" ry="90"/>
        <ellipse cx="700" cy="460" rx="40" ry="60"/>
      </g>

      {/* ground */}
      <rect x="0" y="500" width="800" height="180" fill="#1a1810"/>
      {/* grass texture suggestion */}
      <g stroke="#2a2818" strokeWidth="1" opacity="0.6">
        {Array.from({length: 30}).map((_,i)=>(
          <line key={i} x1={i*30} y1="510" x2={i*30+10} y2="500"/>
        ))}
      </g>

      {/* House silhouette — warm finished */}
      {/* Side wall */}
      <polygon points="120,500 360,500 360,260 120,320" fill="#231d14"/>
      {/* Front face — dark stone/painted */}
      <polygon points="360,500 680,500 680,260 360,260" fill="url(#finishedWall)"/>
      {/* Roof */}
      <polygon points="340,260 700,260 660,160 380,160" fill="#0a0805"/>
      <polygon points="120,320 360,260 380,160 140,220" fill="#0a0805"/>

      {/* board & batten lines on front */}
      <g stroke="#0a0805" strokeWidth="1.5" opacity="0.6">
        {[400,440,480,520,560,600,640].map(x=>(
          <line key={x} x1={x} y1="260" x2={x} y2="500"/>
        ))}
      </g>

      {/* Glowing windows */}
      <g>
        {/* big front windows */}
        <rect x="400" y="320" width="80" height="120" fill="url(#warmWindow)" opacity={lights}/>
        <rect x="400" y="320" width="80" height="120" fill="none" stroke="#0a0805" strokeWidth="3"/>
        <line x1="440" y1="320" x2="440" y2="440" stroke="#0a0805" strokeWidth="2"/>
        <line x1="400" y1="380" x2="480" y2="380" stroke="#0a0805" strokeWidth="2"/>

        <rect x="560" y="320" width="80" height="120" fill="url(#warmWindow)" opacity={lights}/>
        <rect x="560" y="320" width="80" height="120" fill="none" stroke="#0a0805" strokeWidth="3"/>
        <line x1="600" y1="320" x2="600" y2="440" stroke="#0a0805" strokeWidth="2"/>
        <line x1="560" y1="380" x2="640" y2="380" stroke="#0a0805" strokeWidth="2"/>

        {/* small upper window in gable */}
        <rect x="500" y="190" width="40" height="50" fill="url(#warmWindow)" opacity={lights*0.9}/>
        <rect x="500" y="190" width="40" height="50" fill="none" stroke="#0a0805" strokeWidth="2"/>

        {/* door */}
        <rect x="490" y="370" width="60" height="130" fill="#1a1208" stroke="#0a0805" strokeWidth="2"/>
        {/* door light from inside */}
        <rect x="495" y="380" width="50" height="20" fill="url(#warmWindow)" opacity={lights*0.8}/>

        {/* glow halos */}
        <ellipse cx="440" cy="380" rx="100" ry="70" fill="url(#windowGlow)" opacity={lights*0.7}/>
        <ellipse cx="600" cy="380" rx="100" ry="70" fill="url(#windowGlow)" opacity={lights*0.7}/>

        {/* porch sconce */}
        <circle cx="475" cy="365" r="4" fill="#fff1bf" opacity={lights}/>
        <circle cx="475" cy="365" r="14" fill="#fff1bf" opacity={lights*0.3}/>
      </g>

      {/* landscape */}
      <g>
        <ellipse cx="180" cy="540" rx="55" ry="14" fill="#000" opacity="0.5"/>
        <circle cx="180" cy="510" r="42" fill="#1a2615"/>
        <circle cx="160" cy="495" r="24" fill="#22301c"/>

        <ellipse cx="720" cy="560" rx="65" ry="14" fill="#000" opacity="0.5"/>
        <circle cx="720" cy="525" r="46" fill="#1a2615"/>

        {/* path with up-lights */}
        <polygon points="490,500 550,500 580,580 460,580" fill="#2a2418"/>
        {[470,540].map((x,i)=>(
          <g key={i}>
            <circle cx={x} cy={530+i*20} r="3" fill="#fff1bf" opacity={lights}/>
            <circle cx={x} cy={530+i*20} r="10" fill="#fff1bf" opacity={lights*0.25}/>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ========================================================================
   AD VARIATION 1 — "Architectural / Blueprint"
   The cinematic build: blueprint → render → finished, with technical type
   and dimension lines. Quiet, confident, blueprint-paper aesthetic.
   ======================================================================== */
function AdArchitectural({ t }) {
  /* Scene timing (30s)
     0  - 2.5  Brand intro (logo + slug)
     2.5- 9    Phase 1: 2D floor plan draws in
     9  -16    Phase 2: 3D render builds up
     16 -23    Phase 3: Finished home glows on
     23 -30    CTA card with verse + Get a quote
  */

  // Phase windows
  const i1 = vis(t, 0, 3, 0.3, 0.5);
  const phase1Active = t >= 2.5 && t <= 9.5;
  const phase2Active = t >= 9 && t <= 16.5;
  const phase3Active = t >= 16 && t <= 23.5;
  const cta = t >= 23;

  // Phase progress (drives the SVG draw-in)
  const phase1P = ease.outQuint(p(t, 2.8, 8.5));
  const phase2P = ease.outQuint(p(t, 9.3, 15.5));
  const phase3P = ease.outQuint(p(t, 16.3, 22.5));

  const phase1Op = vis(t, 2.5, 9.5, 0.5, 0.7);
  const phase2Op = vis(t, 9, 16.5, 0.5, 0.7);
  const phase3Op = vis(t, 16, 23.5, 0.5, 0.7);

  // Subtle pan/scale on each phase
  const phase1Scale = 1 + 0.04 * p(t, 2.5, 9.5);
  const phase2Scale = 1 + 0.04 * p(t, 9, 16.5);
  const phase3Scale = 1 + 0.05 * p(t, 16, 23.5);

  return (
    <div className="ad-stage" style={{background: "#fafaf7"}}>
      {/* blueprint grid wash */}
      <div className="bp-grid"/>

      {/* TOP CHROME — persistent throughout */}
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

      {/* PHASE LABEL — common style */}
      {/* Phase 1 */}
      <div className="phase-wrap" style={{opacity: phase1Op}}>
        <div className="phase-art" style={{transform: `scale(${phase1Scale})`}}>
          <FloorPlan progress={phase1P}/>
        </div>
      </div>

      {/* Phase 2 */}
      <div className="phase-wrap" style={{opacity: phase2Op}}>
        <div className="phase-art" style={{transform: `scale(${phase2Scale})`}}>
          <Render3D progress={phase2P}/>
        </div>
      </div>

      {/* Phase 3 */}
      <div className="phase-wrap" style={{opacity: phase3Op}}>
        <div className="phase-art" style={{transform: `scale(${phase3Scale})`}}>
          <FinishedHome progress={phase3P}/>
        </div>
      </div>

      {/* PHASE BANNERS — bottom strip */}
      <PhaseBanner
        active={phase1Active}
        opacity={phase1Op}
        num="01"
        title="Drafted"
        sub="Plans drawn around how you live."
      />
      <PhaseBanner
        active={phase2Active}
        opacity={phase2Op}
        num="02"
        title="Rendered"
        sub="See it in 3D before a stake hits the ground."
      />
      <PhaseBanner
        active={phase3Active}
        opacity={phase3Op}
        num="03"
        title="Built"
        sub="Finished, furnished, keys in hand."
      />

      {/* CTA */}
      <div className="layer cta-layer" style={{opacity: vis(t, 23, 30, 0.5, 0.3)}}>
        <div className="cta-card">
          <div className="cta-eyebrow">Now booking · Southeast Indiana</div>
          <div className="cta-title">
            Your home,<br/>on the <em>level.</em>
          </div>
          <div className="cta-rule"/>
          <div className="cta-body">
            Family-run general contracting for custom homes,
            additions, and remodels — at a price that fits.
          </div>
          <div className="cta-button">
            <span>Get a Quote</span>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </div>
          <div className="cta-foot">JDC Construction · Est. 1996</div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <ProgressBar t={t} duration={DURATION}/>
    </div>
  );
}

function PhaseBanner({ active, opacity, num, title, sub }) {
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
  const pct = (t / duration) * 100;
  return (
    <div className="prog-bar">
      <div className="prog-fill" style={{width: `${pct}%`}}/>
    </div>
  );
}

/* ========================================================================
   AD VARIATION 2 — "Snappy / Bold"
   Quick cuts, big bold type, navy/gold blocks. Designed for thumb-stop.
   ======================================================================== */
function AdSnappy({ t }) {
  /* Beat structure — quick attention grabs:
     0  - 1.5  HOOK card (gold, big type)
     1.5- 4.5  "Step 1" wipe + floor plan (fast draw)
     4.5- 6    Transition: blueprint slides off
     6  - 11   "Step 2" + 3D render
     11 -13    Transition
     13 -19    "Step 3" + finished home (hero)
     19 -23    Stat / proof slabs
     23 -30    CTA — gold call out
  */

  const hookOp = vis(t, 0, 2, 0.25, 0.5);
  const s1Op = vis(t, 1.7, 6, 0.3, 0.6);
  const s2Op = vis(t, 6, 12.5, 0.3, 0.6);
  const s3Op = vis(t, 12.5, 19.5, 0.3, 0.6);
  const proofOp = vis(t, 19, 23.5, 0.3, 0.5);
  const ctaOp = vis(t, 23, 30, 0.4, 0.3);

  // floor plan draw progress when in s1
  const fp1 = ease.outQuint(p(t, 2, 5.5));
  const r3p = ease.outQuint(p(t, 6.3, 11.5));
  const fhp = ease.outQuint(p(t, 12.8, 18.5));

  // step 1 slide-in from left
  const s1X = lerp(-100, 0, ease.out(p(t, 1.7, 2.5))) - 0 + lerp(0, -100, ease.out(p(t, 5.5, 6.2)));
  const s2X = lerp(100, 0, ease.out(p(t, 6, 6.8))) + lerp(0, -100, ease.out(p(t, 12, 12.7)));
  const s3X = lerp(100, 0, ease.out(p(t, 12.5, 13.3))) + lerp(0, -100, ease.out(p(t, 18.8, 19.5)));

  // hook scale punch
  const hookScale = 1 + 0.05 * (1 - ease.out(p(t, 0, 1.5)));

  return (
    <div className="ad-stage" style={{background: "#091b37", color: "#fafaf7"}}>
      <div className="bp-grid dark"/>

      {/* HOOK */}
      <div className="layer hook-layer" style={{opacity: hookOp}}>
        <div className="hook-card" style={{transform:`scale(${hookScale})`}}>
          <div className="hook-eyebrow">↓ Watch how a custom home gets built</div>
          <div className="hook-title">
            From <span className="g">flat paper</span><br/>
            to <span className="g">front door.</span>
          </div>
          <div className="hook-meta">30 seconds · JDC Construction</div>
        </div>
      </div>

      {/* STEP 1 */}
      <div className="step-layer" style={{opacity: s1Op, transform:`translateX(${s1X}%)`}}>
        <div className="step-numblock">
          <div className="step-num">01</div>
          <div className="step-name">Floor Plan</div>
        </div>
        <div className="step-art">
          <FloorPlan progress={fp1} accent="#091b37" ink="#465462"/>
        </div>
        <div className="step-caption">
          <strong>Designed around how you live.</strong>
          Every wall, every window — drawn for you, not from a catalog.
        </div>
      </div>

      {/* STEP 2 */}
      <div className="step-layer" style={{opacity: s2Op, transform:`translateX(${s2X}%)`}}>
        <div className="step-numblock">
          <div className="step-num">02</div>
          <div className="step-name">3D Render</div>
        </div>
        <div className="step-art">
          <Render3D progress={r3p}/>
        </div>
        <div className="step-caption">
          <strong>See it before we build it.</strong>
          Walk the rooms, change a finish, move a window. No surprises.
        </div>
      </div>

      {/* STEP 3 */}
      <div className="step-layer" style={{opacity: s3Op, transform:`translateX(${s3X}%)`}}>
        <div className="step-numblock">
          <div className="step-num">03</div>
          <div className="step-name">Move In</div>
        </div>
        <div className="step-art">
          <FinishedHome progress={fhp}/>
        </div>
        <div className="step-caption">
          <strong>Finished, furnished, lit.</strong>
          We hand you keys to a home — not a punch list.
        </div>
      </div>

      {/* PROOF SLABS */}
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
          <div className="cta-snappy-title">
            Bring us<br/>your land.
          </div>
          <div className="cta-snappy-sub">
            We'll bring the plans, the renders, the crew, the keys.
          </div>
          <div className="cta-snappy-button">
            Get Your Free Quote →
          </div>
          <div className="cta-snappy-foot">
            JDC Construction · Built on the level.
          </div>
        </div>
      </div>

      <ProgressBar t={t} duration={DURATION} dark/>
    </div>
  );
}

/* ========================================================================
   AD VARIATION 3 — "Editorial / Magazine"
   Slower, more refined. Two-column compositions. Serif-driven.
   Feels like an architecture magazine spread coming to life.
   ======================================================================== */
function AdEditorial({ t }) {
  /* Beats:
     0  - 4    Cover spread (folio + serif headline)
     4  - 11   Spread 1 — "The Plan" (floor plan + paragraph)
     11 -18    Spread 2 — "The Vision" (3D render + paragraph)
     18 -25    Spread 3 — "The Home" (finished + paragraph)
     25 -30    Closing — verse + CTA
  */

  const coverOp = vis(t, 0, 4.5, 0.4, 0.6);
  const s1Op = vis(t, 4, 11.5, 0.5, 0.6);
  const s2Op = vis(t, 11, 18.5, 0.5, 0.6);
  const s3Op = vis(t, 18, 25.5, 0.5, 0.6);
  const closeOp = vis(t, 25, 30, 0.5, 0.3);

  const fp1 = ease.outQuint(p(t, 4.3, 10.5));
  const r3p = ease.outQuint(p(t, 11.3, 17.5));
  const fhp = ease.outQuint(p(t, 18.3, 24.5));

  // gentle Ken-Burns
  const sc = (a,b) => 1 + 0.04 * p(t, a, b);

  return (
    <div className="ad-stage" style={{background: "#fafaf7"}}>
      {/* COVER */}
      <div className="layer ed-cover" style={{opacity: coverOp}}>
        <div className="ed-cover-frame">
          <div className="ed-folio">
            <span>JDC · No. 04</span>
            <span>Vol. III · Spring 2026</span>
          </div>
          <div className="ed-cover-eyebrow">A short film for prospective owners</div>
          <div className="ed-cover-title">
            How a<br/>
            <em>house</em><br/>
            becomes a<br/>
            <em>home.</em>
          </div>
          <div className="ed-cover-foot">
            <div>JDC Construction</div>
            <div>Three movements · Thirty seconds</div>
          </div>
        </div>
      </div>

      {/* SPREAD 1 */}
      <div className="layer ed-spread" style={{opacity: s1Op}}>
        <div className="ed-grid">
          <div className="ed-text">
            <div className="ed-num">I.</div>
            <div className="ed-h">The Plan</div>
            <div className="ed-rule"/>
            <p className="ed-p">
              Every JDC home begins on paper. We sit at the table, sketch
              over coffee, and shape rooms around the way you actually
              live — the morning light, the back porch, the dog by the door.
            </p>
            <div className="ed-tag">Drafted in-house · Indiana</div>
          </div>
          <div className="ed-art" style={{transform: `scale(${sc(4,11)})`}}>
            <FloorPlan progress={fp1}/>
          </div>
        </div>
      </div>

      {/* SPREAD 2 */}
      <div className="layer ed-spread" style={{opacity: s2Op}}>
        <div className="ed-grid reverse">
          <div className="ed-art" style={{transform: `scale(${sc(11,18)})`}}>
            <Render3D progress={r3p}/>
          </div>
          <div className="ed-text">
            <div className="ed-num">II.</div>
            <div className="ed-h">The Vision</div>
            <div className="ed-rule"/>
            <p className="ed-p">
              Then we render it. Walls rise in 3D, finishes go on, the
              porch light comes on. You walk through your home before
              we ever break ground — and change anything you'd like.
            </p>
            <div className="ed-tag">Photoreal renders · Free with build</div>
          </div>
        </div>
      </div>

      {/* SPREAD 3 */}
      <div className="layer ed-spread" style={{opacity: s3Op}}>
        <div className="ed-grid">
          <div className="ed-text">
            <div className="ed-num">III.</div>
            <div className="ed-h">The Home</div>
            <div className="ed-rule"/>
            <p className="ed-p">
              And then we build it. Our crews are local, our subs are
              vetted, our standard is plumb and square. When we're done,
              you don't get a punch list — you get keys.
            </p>
            <div className="ed-tag">Furnished walk-through included</div>
          </div>
          <div className="ed-art" style={{transform: `scale(${sc(18,25)})`}}>
            <FinishedHome progress={fhp}/>
          </div>
        </div>
      </div>

      {/* CLOSING */}
      <div className="layer ed-close" style={{opacity: closeOp}}>
        <div className="ed-close-frame">
          <div className="ed-verse">
            Whatever you do, work at it with all your heart.
          </div>
          <div className="ed-verse-ref">— Colossians 3:23</div>
          <div className="ed-close-rule"/>
          <div className="ed-close-cta">
            <div className="ed-close-title">
              Ready to start your <em>plan?</em>
            </div>
            <div className="ed-close-button">Get a Quote →</div>
          </div>
          <div className="ed-close-foot">
            <img src="assets/jdc-icon.png" alt="" />
            <div>
              <div>JDC Construction</div>
              <small>Est. 1996 · Southeast Indiana</small>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar t={t} duration={DURATION}/>
    </div>
  );
}

/* ========================================================================
   AD WRAPPER — handles autoplay + scrub
   ======================================================================== */
function Ad({ component: Component, paused }) {
  const t = useTimeline(DURATION, !paused);
  return (
    <div className="ad-frame">
      <Component t={t}/>
      <div className="ad-time">{t.toFixed(1)}s / 30s</div>
    </div>
  );
}

window.Ad = Ad;
window.AdArchitectural = AdArchitectural;
window.AdSnappy = AdSnappy;
window.AdEditorial = AdEditorial;
