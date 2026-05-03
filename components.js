// Google Analytics 4
(function() {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-24Y0PKB9XN';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-24Y0PKB9XN');
})();

(function () {
  'use strict';

  /* ───────────────────────────────
     CSS injection
     ─────────────────────────────── */
  var css = '\
    /* ── NAV ── */\
    nav {\
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;\
      padding: 0 3rem; height: 80px;\
      display: flex; align-items: center; justify-content: space-between;\
      background: rgba(9,27,55,0.0);\
      backdrop-filter: blur(0px);\
      transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease;\
    }\
    nav.scrolled {\
      background: #091b37;\
      backdrop-filter: blur(12px);\
      box-shadow: 0 1px 0 rgba(255,255,255,0.06);\
    }\
    .nav-logo img {\
      height: 52px; width: auto;\
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));\
    }\
    .nav-links {\
      display: flex; align-items: center; gap: 2.5rem;\
    }\
    .nav-links a {\
      font-size: 0.75rem; font-weight: 400;\
      letter-spacing: 0.15em; text-transform: uppercase;\
      color: rgba(255,255,255,0.7); text-decoration: none;\
      transition: color 0.2s ease;\
    }\
    .nav-links a:hover { color: white; }\
    .nav-links a.active { color: white; }\
    .nav-cta {\
      font-size: 0.7rem !important; font-weight: 500 !important;\
      letter-spacing: 0.18em !important;\
      color: var(--navy) !important; background: var(--gold);\
      padding: 0.6rem 1.5rem;\
      min-height: 44px !important; display: inline-flex !important; align-items: center !important;\
      transition: background 0.2s ease !important;\
    }\
    .nav-cta:hover { background: white !important; color: var(--navy) !important; }\
    .nav-cta:active { background: rgba(255,255,255,0.85) !important; }\
    .nav-back {\
      font-size: 0.68rem !important; letter-spacing: 0.1em !important;\
      color: rgba(255,255,255,0.4) !important;\
    }\
    .nav-back:hover { color: rgba(255,255,255,0.75) !important; }\
    .nav-back svg { transition: transform 0.2s ease; }\
    .nav-back:hover svg { transform: translateX(-3px); }\
    \
    /* ── HAMBURGER ── */\
    .nav-hamburger {\
      display: none; flex-direction: column; justify-content: center;\
      gap: 5px; width: 36px; height: 36px;\
      background: none; border: none; cursor: pointer;\
      padding: 4px; z-index: 1100;\
    }\
    .nav-hamburger span {\
      display: block; width: 100%; height: 1.5px;\
      background: white; border-radius: 1px;\
      transition: transform 0.3s ease, opacity 0.3s ease;\
    }\
    .nav-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }\
    .nav-hamburger.open span:nth-child(2) { opacity: 0; }\
    .nav-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }\
    \
    /* ── MOBILE NAV ── */\
    .mobile-nav-overlay {\
      display: none; position: fixed; inset: 0; z-index: 900;\
      background: rgba(9,27,55,0.97);\
      flex-direction: column; align-items: center; justify-content: center;\
      gap: 2rem; padding: 2rem;\
    }\
    .mobile-nav-overlay.open { display: flex; }\
    .mobile-nav-overlay a {\
      font-size: 1.1rem; font-weight: 300; letter-spacing: 0.2em;\
      text-transform: uppercase; color: rgba(255,255,255,0.75);\
      text-decoration: none; transition: color 0.2s ease;\
      min-height: 44px; display: flex; align-items: center; padding: 0.25rem 0;\
    }\
    .mobile-nav-overlay a:hover { color: white; }\
    .mobile-nav-overlay a:active { color: rgba(255,255,255,0.5); }\
    .mobile-nav-overlay .mobile-cta {\
      margin-top: 1rem; font-size: 0.85rem; font-weight: 500;\
      color: var(--navy); background: var(--gold);\
      padding: 0.85rem 2.25rem; letter-spacing: 0.18em;\
      min-height: 44px; display: flex; align-items: center; justify-content: center;\
    }\
    .mobile-nav-overlay .mobile-cta:active { background: rgba(255,255,255,0.85) !important; color: var(--navy); }\
    @media (max-width: 768px) {\
      nav { padding: 0 1.25rem; background: rgba(9,27,55,0.9) !important; backdrop-filter: blur(12px); }\
      .nav-links { display: none; }\
      .nav-hamburger { display: flex; }\
    }\
    \
    /* ── FOOTER ── */\
    footer {\
      background: #050f1e; padding: 2.5rem 5rem;\
      display: flex; align-items: center; justify-content: space-between;\
      gap: 2rem; border-top: 1px solid rgba(255,255,255,0.05);\
    }\
    .footer-left {\
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.65rem;\
    }\
    .footer-icon { height: 68px; width: auto; opacity: 0.85; }\
    .footer-contact { display: flex; flex-direction: column; gap: 0.18rem; }\
    .footer-contact span {\
      font-size: 0.78rem; letter-spacing: 0.08em; color: rgba(255,255,255,0.38);\
    }\
    .footer-fb {\
      display: inline-flex; align-items: center; justify-content: center;\
      width: 38px; height: 38px;\
      border: 1px solid rgba(255,255,255,0.1);\
      color: rgba(255,255,255,0.25);\
      transition: color 0.2s ease, border-color 0.2s ease;\
    }\
    .footer-fb:hover { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.3); }\
    .footer-copy {\
      font-size: 0.75rem; letter-spacing: 0.12em;\
      color: rgba(255,255,255,0.2); text-align: center;\
    }\
    .footer-links {\
      display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: flex-end;\
    }\
    .footer-links a {\
      font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase;\
      color: rgba(255,255,255,0.25); text-decoration: none;\
      transition: color 0.2s ease;\
      min-height: 44px; display: inline-flex; align-items: center;\
    }\
    .footer-links a:hover { color: rgba(255,255,255,0.6); }\
    .footer-links a:active { color: rgba(255,255,255,0.45); }\
    @media (max-width: 768px) {\
      footer { flex-direction: column; gap: 1.5rem; text-align: center; padding: 2rem 1.25rem; }\
      .footer-left { align-items: center; }\
      .footer-links { display: grid; grid-template-columns: repeat(2, auto); gap: 0.25rem 2rem; justify-content: center; }\
      .footer-links a { justify-content: center; min-height: 40px; }\
      .footer-icon { height: 48px; }\
      .footer-contact span { font-size: 0.88rem; color: rgba(255,255,255,0.55); }\
    }\
  ';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ───────────────────────────────
     Logo helper
     ─────────────────────────────── */
  var LOGO = '<img src="https://res.cloudinary.com/dybuigweq/image/upload/v1777581179/Brand_assets/jdc%20icon.png" alt="JDC Construction">';

  function logoLink(href) {
    return '<a href="' + href + '" class="nav-logo">' + LOGO + '</a>';
  }

  function link(href, label, cls) {
    cls = cls || '';
    return '<a href="' + href + '" class="' + cls + '">' + label + '</a>';
  }

  /* ───────────────────────────────
     Mobile nav builder
     ─────────────────────────────── */
  function buildMobileNav(links) {
    var html = '';
    for (var i = 0; i < links.length; i++) {
      var item = links[i];
      html += '<a href="' + item.href + '" onclick="closeMobileNav()">' + item.label + '</a>';
    }
    if (links.length > 0 && links[links.length - 1].label === 'Get a Quote') {
      html = html.replace('">Get a Quote</a>', ' mobile-cta">Get a Quote</a>');
    }
    return '<div class="mobile-nav-overlay" id="mobile-nav">' + html + '</div>';
  }

  function buildDesktopNav(hrefBase, logoHref, links) {
    var html = '<nav id="main-nav">\n    ' + logoLink(logoHref) + '\n    <div class="nav-links">\n';
    for (var i = 0; i < links.length; i++) {
      var item = links[i];
      var h = item.href;
      if (hrefBase && !/^(https?:|#|\/)/.test(h)) h = hrefBase + h;
      html += '      ' + link(h, item.label, item.cls || '') + '\n';
    }
    html += '    </div>\n'
      + '    <button class="nav-hamburger" id="hamburger" aria-label="Open menu" onclick="toggleMobileNav()">\n'
      + '      <span></span><span></span><span></span>\n'
      + '    </button>\n  </nav>';
    return html;
  }

  /* ───────────────────────────────
     Preset definitions
     ─────────────────────────────── */

  var presets = {};

  // Standard: Custom Homes, Remodeling, About, Articles, ← Home, Get a Quote
  presets.standard = function (active) {
    var links = [
      { href: 'custom-home.html', label: 'Custom Homes' },
      { href: 'remodeling.html', label: 'Remodeling' },
      { href: 'about.html', label: 'About' },
      { href: 'articles.html', label: 'Articles' },
      { href: 'index.html', label: '← Home', cls: 'nav-back' },
      { href: 'quote.html', label: 'Get a Quote', cls: 'nav-cta' }
    ];
    if (active) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].label === active || links[i].href === active + '.html') {
          links[i].cls = (links[i].cls ? links[i].cls + ' ' : '') + 'active';
          break;
        }
      }
    }
    var container = document.getElementById('nav-container');
    container.outerHTML = buildDesktopNav('', 'index.html', links);
    container = document.getElementById('mobile-nav-container');
    container.outerHTML = buildMobileNav(links);
  };

  // Custom-home: Portfolio, Process, About, Articles, ← Home, Get a Quote
  presets['custom-home'] = function (active) {
    var links = [
      { href: 'custom-home-portfolio.html', label: 'Portfolio' },
      { href: 'custom-home-process.html', label: 'Process' },
      { href: 'about.html', label: 'About' },
      { href: 'articles.html', label: 'Articles' },
      { href: 'index.html', label: '← Home', cls: 'nav-back' },
      { href: 'quote.html', label: 'Get a Quote', cls: 'nav-cta' }
    ];
    if (active) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].label.toLowerCase() === active.toLowerCase()) {
          links[i].cls = (links[i].cls ? links[i].cls + ' ' : '') + 'active';
          break;
        }
      }
    }
    var container = document.getElementById('nav-container');
    container.outerHTML = buildDesktopNav('', 'index.html', links);
    container = document.getElementById('mobile-nav-container');
    container.outerHTML = buildMobileNav(links);
  };

  // Minimal: Gallery (anchor), ← Remodeling, Get a Quote
  presets.minimal = function () {
    var links = [
      { href: '#gallery', label: 'Gallery' },
      { href: 'remodeling.html', label: '← Remodeling', cls: 'nav-back' },
      { href: 'quote.html', label: 'Get a Quote', cls: 'nav-cta' }
    ];
    var container = document.getElementById('nav-container');
    container.outerHTML = buildDesktopNav('', 'index.html', links);
    container = document.getElementById('mobile-nav-container');
    container.outerHTML = buildMobileNav(links);
  };

  // Quote: Custom Homes, Remodeling, Articles, ← Back to Home (SVG)
  presets.quote = function () {
    var links = [
      { href: 'custom-home.html', label: 'Custom Homes' },
      { href: 'remodeling.html', label: 'Remodeling' },
      { href: 'articles.html', label: 'Articles' }
    ];
    var mobileLinks = [
      { href: 'custom-home.html', label: 'Custom Homes' },
      { href: 'remodeling.html', label: 'Remodeling' },
      { href: 'articles.html', label: 'Articles' },
      { href: 'index.html', label: '← Home' }
    ];
    var desktopHtml = '<nav id="main-nav">\n    ' + logoLink('index.html') + '\n    <div class="nav-links">\n'
      + '      ' + link('custom-home.html', 'Custom Homes') + '\n'
      + '      ' + link('remodeling.html', 'Remodeling') + '\n'
      + '      ' + link('articles.html', 'Articles') + '\n'
      + '      <a href="index.html" class="nav-back">\n'
      + '        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">\n'
      + '          <path d="M13 5H1M5.5 1.5L2 5l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>\n'
      + '        </svg>\n        Back to Home\n      </a>\n'
      + '    </div>\n'
      + '    <button class="nav-hamburger" id="hamburger" aria-label="Open menu" onclick="toggleMobileNav()">\n'
      + '      <span></span><span></span><span></span>\n    </button>\n  </nav>';
    var container = document.getElementById('nav-container');
    container.outerHTML = desktopHtml;
    container = document.getElementById('mobile-nav-container');
    container.outerHTML = buildMobileNav(mobileLinks);
  };

  // Portfolio: Custom Homes, Our Process, About, Articles, ← Portfolio
  presets.portfolio = function () {
    var links = [
      { href: 'custom-home.html', label: 'Custom Homes' },
      { href: 'custom-home-process.html', label: 'Our Process' },
      { href: 'about.html', label: 'About' },
      { href: 'articles.html', label: 'Articles' },
      { href: 'custom-home-portfolio.html', label: '← Portfolio', cls: 'nav-back' }
    ];
    var mobileLinks = [
      { href: 'custom-home.html', label: 'Custom Homes' },
      { href: 'custom-home-process.html', label: 'Our Process' },
      { href: 'about.html', label: 'About' },
      { href: 'articles.html', label: 'Articles' },
      { href: 'index.html', label: 'Home' },
      { href: 'custom-home-portfolio.html', label: '← Portfolio' },
      { href: 'quote.html', label: 'Get a Quote' }
    ];
    var container = document.getElementById('nav-container');
    container.outerHTML = buildDesktopNav('', 'index.html', links);
    container = document.getElementById('mobile-nav-container');
    container.outerHTML = buildMobileNav(mobileLinks);
  };

  // Article sub-pages (../ paths)
  presets.article = function (active) {
    var links = [
      { href: 'custom-home.html', label: 'Custom Homes' },
      { href: 'remodeling.html', label: 'Remodeling' },
      { href: 'about.html', label: 'About' },
      { href: 'articles.html', label: 'Articles' },
      { href: 'index.html', label: '← Home', cls: 'nav-back' },
      { href: 'quote.html', label: 'Get a Quote', cls: 'nav-cta' }
    ];
    if (active) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].label === active || links[i].href === active + '.html') {
          links[i].cls = (links[i].cls ? links[i].cls + ' ' : '') + 'active';
          break;
        }
      }
    }
    var container = document.getElementById('nav-container');
    container.outerHTML = buildDesktopNav('../', '../index.html', links);
    container = document.getElementById('mobile-nav-container');
    container.outerHTML = buildMobileNav(links);
  };

  /* ───────────────────────────────
     Public API
     ─────────────────────────────── */
  window.JDC = {
    nav: function (preset, active) {
      if (!presets[preset]) {
        console.warn('JDC.nav: unknown preset "' + preset + '"');
        return;
      }
      presets[preset](active);
      // Re-bind nav reference after DOM replacement
      window._navEl = document.getElementById('main-nav');
    },

    footer: function () {
      var html = '<footer>\n'
        + '    <div class="footer-left">\n'
        + '      <a href="index.html"><img src="https://res.cloudinary.com/dybuigweq/image/upload/v1777581179/Brand_assets/jdc%20icon.png" alt="JDC Construction" class="footer-icon"></a>\n'
        + '      <div class="footer-contact">\n'
        + '        <span>(812) 637-2684</span>\n'
        + '        <span>customerservice@jdcremodeling.com</span>\n'
        + '      </div>\n'
        + '      <a href="https://www.facebook.com/JDCremodeling" class="footer-fb" target="_blank" rel="noopener" aria-label="JDC Construction on Facebook">\n'
        + '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>\n'
        + '      </a>\n'
        + '    </div>\n'
        + '    <p class="footer-copy">&copy; 2026 JDC Construction &middot; Licensed &amp; Insured &middot; Lawrenceburg, IN &middot; COL 3:23</p>\n'
        + '    <div class="footer-links">\n'
        + '      <a href="index.html">Home</a>\n'
        + '      <a href="custom-home.html">Custom Homes</a>\n'
        + '      <a href="remodeling.html">Remodeling</a>\n'
        + '      <a href="about.html">About</a>\n'
        + '      <a href="articles.html">Articles</a>\n'
        + '      <a href="quote.html">Get a Quote</a>\n'
        + '    </div>\n'
        + '  </footer>';
      var container = document.getElementById('footer-container');
      container.outerHTML = html;
    }
  };

  /* ───────────────────────────────
     Scroll & mobile nav behavior
     ─────────────────────────────── */
  window.addEventListener('scroll', function () {
    var nav = window._navEl || document.getElementById('main-nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  window.toggleMobileNav = function () {
    var overlay = document.getElementById('mobile-nav');
    var btn = document.getElementById('hamburger');
    if (!overlay || !btn) return;
    overlay.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
  };

  window.closeMobileNav = function () {
    var overlay = document.getElementById('mobile-nav');
    var btn = document.getElementById('hamburger');
    if (overlay) overlay.classList.remove('open');
    if (btn) btn.classList.remove('open');
    document.body.style.overflow = '';
  };

})();
