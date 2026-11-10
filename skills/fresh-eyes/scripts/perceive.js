() => {
  // fresh-eyes / perceive.js
  // Paste the whole function into Playwright MCP `browser_evaluate` (function param),
  // or run it with scripts/capture.mjs. Read its output ONLY AFTER you recorded the
  // screenshot-only judgement (blind-first rule).
  //
  // Returns:
  //   predictedScanOrder  heuristic visual-weight ranking of above-the-fold elements
  //                       (size x luminance contrast x saturation x weight x top-left bias).
  //                       An approximation of bottom-up saliency, NOT eye-tracking.
  //   controls            every visible control: visible text vs accessible name,
  //                       icon-only, signifier strength, fake buttons, label-in-name mismatch
  //   smallTargets        controls under 24px (WCAG 2.2 2.5.8) and under 44px (HIG)
  //   lowContrast, tinyText, falseAffordances, placeholderOnly, deadLinks, a11y basics
  const VW = innerWidth, VH = innerHeight;
  const vis = el => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05;
  };
  const rgb = c => { const m = (c || '').match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = c => {
    const v = rgb(c); if (!v) return null;
    const [r, g, b] = v.slice(0, 3).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const sat = c => {
    const v = rgb(c); if (!v) return 0;
    const [r, g, b] = v.slice(0, 3).map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = (mx + mn) / 2; return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  };
  const opaque = c => { const v = rgb(c); return v && (v.length < 4 || v[3] > 0.5); };
  const bgOf = el => {
    let onImage = false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') onImage = true;
      if (opaque(s.backgroundColor)) return { color: s.backgroundColor, onImage };
    }
    return { color: 'rgb(255,255,255)', onImage };
  };
  const ratio = (a, b) => { const A = lum(a), B = lum(b); if (A == null || B == null) return null; return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
  const clean = t => (t || '').replace(/\s+/g, ' ').trim();
  const visibleText = el => clean(el.innerText || el.value || '').slice(0, 60);
  const accName = el => {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean).map(n => n.innerText).join(' '); if (clean(t)) return clean(t).slice(0, 60); }
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label')).slice(0, 60);
    if (el.labels && el.labels.length) return clean(el.labels[0].innerText).slice(0, 60);
    const t = visibleText(el); if (t) return t;
    const img = el.querySelector && el.querySelector('img[alt]'); if (img && img.alt) return clean(img.alt).slice(0, 60);
    const svgT = el.querySelector && el.querySelector('svg title'); if (svgT) return clean(svgT.textContent).slice(0, 60);
    return clean(el.getAttribute('title') || el.getAttribute('placeholder') || '').slice(0, 60);
  };
  const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const where = b => {
    const cx = b.x + b.w / 2, cy = b.y - scrollY + b.h / 2;
    const h = cx < VW / 3 ? 'left' : cx > VW * 2 / 3 ? 'right' : 'center';
    const v = cy < VH / 3 ? 'top' : cy > VH * 2 / 3 ? 'bottom' : 'middle';
    return cy > VH ? 'below-fold' : `${v}-${h}`;
  };
  const describe = el => {
    const t = visibleText(el);
    if (t) return t.slice(0, 40);
    const n = accName(el);
    return `[${el.tagName.toLowerCase()}${n ? ' "' + n.slice(0, 30) + '"' : ''}]`;
  };

  // ---------- controls ----------
  const ctrlSel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=switch],[role=checkbox],[tabindex]:not([tabindex="-1"])';
  const ctrlSet = new Set([...document.querySelectorAll(ctrlSel)].filter(vis));
  // fake buttons: pointer cursor, not focusable / not a control, not inside a control
  const fake = [...document.querySelectorAll('div,span,li,img,svg,p,td')].filter(el => {
    if (!vis(el) || ctrlSet.has(el) || el.closest(ctrlSel)) return false;
    const s = getComputedStyle(el); if (s.cursor !== 'pointer') return false;
    const p = el.parentElement; return !(p && getComputedStyle(p).cursor === 'pointer' && !ctrlSet.has(p));
  }).slice(0, 15);
  const bodyColor = getComputedStyle(document.body).color;
  const signifier = el => {
    const s = getComputedStyle(el); const pBg = bgOf(el.parentElement || el).color;
    const ownBg = opaque(s.backgroundColor) && ratio(s.backgroundColor, pBg) > 1.15;
    const border = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && (rgb(s.borderTopColor) || [0, 0, 0, 0])[3] !== 0;
    const underline = /underline/.test(s.textDecorationLine);
    const shadow = s.boxShadow !== 'none';
    const distinctColor = ratio(s.color, bodyColor) > 1.3 || sat(s.color) > 0.35;
    const score = (ownBg ? 2 : 0) + (border ? 1 : 0) + (underline ? 2 : 0) + (shadow ? 1 : 0) + (distinctColor ? 1 : 0);
    return { level: score >= 2 ? 'strong' : score === 1 ? 'weak' : 'none', cues: { ownBg, border, underline, shadow, distinctColor } };
  };
  const controls = [...ctrlSet, ...fake].slice(0, 120).map((el, i) => {
    const text = visibleText(el); const name = accName(el); const b = box(el);
    const hasGraphic = !!(el.querySelector && el.querySelector('svg,img,i,[class*="icon"]'));
    const iconOnly = hasGraphic && text.replace(/[^\p{L}\p{N}]/gu, '').length <= 1;
    const nameMismatch = !!(text && name && text.length > 1 && !name.toLowerCase().includes(text.toLowerCase().slice(0, 20)));
    return {
      i, tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || undefined,
      where: where(b), box: b, text, name, iconOnly,
      unnamed: !name, nameMismatch, signifier: signifier(el),
      fakeButton: !ctrlSet.has(el) || undefined,
      disabled: el.disabled || el.getAttribute('aria-disabled') === 'true' || undefined,
      href: el.tagName === 'A' ? (el.getAttribute('href') || '').slice(0, 60) : undefined
    };
  });
  const smallTargets = controls.filter(c => !c.fakeButton && c.tag !== 'a' || c.iconOnly)
    .filter(c => c.box.w < 44 || c.box.h < 44)
    .map(c => ({ i: c.i, label: c.text || c.name || c.tag, w: c.box.w, h: c.box.h, belowWcag24: c.box.w < 24 || c.box.h < 24 }))
    .slice(0, 25);

  // ---------- false affordances: looks clickable, is not ----------
  const falseAffordances = [...document.querySelectorAll('span,p,div,li,strong,em,h1,h2,h3,h4,label')].filter(el => {
    if (!vis(el) || el.closest(ctrlSel) || el.querySelector(ctrlSel)) return false;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) return false;
    const s = getComputedStyle(el);
    const underlined = /underline/.test(s.textDecorationLine);
    const linkBlue = (() => { const v = rgb(s.color); return v && v[2] > 150 && v[2] > v[0] + 60 && v[2] > v[1] + 20; })();
    const buttonish = opaque(s.backgroundColor) && parseFloat(s.borderRadius) >= 4 && el.getBoundingClientRect().height <= 48 && el.getBoundingClientRect().width <= 260 && sat(s.backgroundColor) > 0.3;
    return underlined || linkBlue || buttonish;
  }).slice(0, 12).map(el => ({ text: visibleText(el).slice(0, 40), where: where(box(el)), why: /underline/.test(getComputedStyle(el).textDecorationLine) ? 'underlined text' : 'link-colored or button-like but not interactive' }));

  // ---------- predicted scan order (above the fold) ----------
  const candSel = 'h1,h2,h3,h4,p,li,div,a,button,input,select,textarea,img,svg,video,canvas,label,span,strong,[role=button],[class*="price"],[class*="badge"],[class*="hero"]';
  const seen = new Set();
  const cands = [...document.querySelectorAll(candSel)].filter(el => {
    if (!vis(el)) return false; const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > VH || r.right < 0 || r.left > VW) return false;
    if (r.width * r.height > VW * VH * 0.6) return false; // full-bleed backgrounds
    const tag = el.tagName;
    if (['SPAN', 'STRONG', 'LI', 'P', 'LABEL'].includes(tag) && !visibleText(el)) return false;
    if (tag === 'DIV' && ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false;
    return true;
  });
  const scored = [];
  for (const el of cands) {
    // skip descendants of an already-counted control so a button is counted once
    const anc = el.parentElement && el.parentElement.closest('a,button,[role=button]');
    if (anc && seen.has(anc)) continue;
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    const isMedia = ['IMG', 'SVG', 'VIDEO', 'CANVAS'].includes(el.tagName.toUpperCase());
    const visW = Math.min(r.right, VW) - Math.max(r.left, 0), visH = Math.min(r.bottom, VH) - Math.max(r.top, 0);
    let area = Math.max(visW, 0) * Math.max(visH, 0);
    const fs = parseFloat(s.fontSize) || 14;
    if (!isMedia && visibleText(el)) area = Math.min(area, visibleText(el).length * fs * fs * 0.6 + fs * fs);
    const bg = bgOf(el);
    const fg = opaque(s.backgroundColor) && el.parentElement ? s.backgroundColor : s.color;
    const parentBg = opaque(s.backgroundColor) ? bgOf(el.parentElement || el).color : bg.color;
    const clipText = (s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') && /gradient/.test(s.backgroundImage);
    const transparentInk = (rgb(fg) || [])[3] === 0;
    const c = isMedia || clipText ? 3 : transparentInk ? 1 : (ratio(fg, parentBg) || 1);
    const sw = Math.max(sat(fg), isMedia || clipText ? 0.4 : 0);
    const w = (+s.fontWeight || 400) >= 600 ? 1.15 : 1;
    const cx = (r.left + r.width / 2) / VW, cy = (r.top + r.height / 2) / VH;
    const pos = 1 - 0.35 * Math.min(cy, 1) - 0.15 * Math.min(cx, 1);
    const big = /[\d][\d,.]{2,}/.test(visibleText(el)) && fs >= 24 ? 1.2 : 1;
    const weight = Math.sqrt(area) * Math.log2(1 + c) * (1 + 0.5 * sw) * w * pos * big;
    seen.add(el);
    scored.push({ el, weight });
  }
  // keep the strongest of nested duplicates
  scored.sort((a, b) => b.weight - a.weight);
  const picked = [];
  for (const s of scored) {
    if (picked.some(p => p.el.contains(s.el) || s.el.contains(p.el))) continue;
    picked.push(s); if (picked.length >= 8) break;
  }
  const maxW = picked.length ? picked[0].weight : 1;
  const predictedScanOrder = picked.map((p, k) => ({
    rank: k + 1, label: describe(p.el), tag: p.el.tagName.toLowerCase(), where: where(box(p.el)),
    relWeight: +(p.weight / maxW).toFixed(2), interactive: !!p.el.closest(ctrlSel)
  }));

  // ---------- text legibility ----------
  const lowContrast = [], tinyText = [];
  for (const el of document.querySelectorAll('body *')) {
    if (lowContrast.length >= 15 && tinyText.length >= 15) break;
    if (!vis(el)) continue;
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ');
    if (!t) continue;
    const s = getComputedStyle(el); const size = parseFloat(s.fontSize);
    if (size < 12 && tinyText.length < 15) tinyText.push({ text: t.slice(0, 30), size });
    const bg = bgOf(el); const cr = ratio(s.color, bg.color); if (cr == null) continue;
    const large = size >= 24 || (size >= 18.66 && +s.fontWeight >= 700);
    if (cr < (large ? 3 : 4.5) && lowContrast.length < 15) lowContrast.push({ text: t.slice(0, 30), ratio: +cr.toFixed(2), size, onImage: bg.onImage || undefined });
  }

  const placeholderOnly = [...document.querySelectorAll('input[placeholder],textarea[placeholder]')]
    .filter(el => vis(el) && !(el.labels && el.labels.length) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el => el.placeholder).slice(0, 10);
  const deadLinks = [...document.querySelectorAll('a')].filter(a => vis(a) && /^(#|javascript:.*)?$/.test(a.getAttribute('href') || '')).map(describe).slice(0, 10);
  const vagueLinks = controls.filter(c => /^(더\s?보기|자세히(\s?보기)?|바로\s?가기|여기|클릭|click here|here|more|read more|learn more|details?)$/i.test(c.text)).map(c => c.text).slice(0, 10);

  return {
    url: location.href, viewport: [VW, VH], title: document.title,
    horizontalOverflow: document.documentElement.scrollWidth > VW + 1,
    predictedScanOrder,
    controlsSummary: {
      total: controls.length,
      iconOnly: controls.filter(c => c.iconOnly).length,
      unnamed: controls.filter(c => c.unnamed).length,
      weakOrNoSignifier: controls.filter(c => c.signifier.level !== 'strong').length,
      fakeButtons: controls.filter(c => c.fakeButton).length,
      nameMismatch: controls.filter(c => c.nameMismatch).length
    },
    controls, smallTargets, falseAffordances, placeholderOnly, deadLinks, vagueLinks, lowContrast, tinyText,
    imgsWithoutAlt: [...document.images].filter(i => vis(i) && !i.hasAttribute('alt')).length,
    headings: [...document.querySelectorAll('h1,h2,h3')].filter(vis).map(h => h.tagName + ' ' + clean(h.innerText).slice(0, 40)).slice(0, 15),
    lang: document.documentElement.lang || null
  };
}
