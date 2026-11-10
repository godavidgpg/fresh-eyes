() => {
  // fresh-eyes / tokens.js — design-token audit + "AI slop" signal counter.
  // Paste into Playwright MCP `browser_evaluate`, or run via scripts/capture.mjs.
  // Signals adapted from unslop by Damir Sokolovsky (@heydamir), CC BY 4.0.
  // Numbers point to WHERE to look. Confirm every finding on the screenshot.
  const els = [...document.querySelectorAll('body *')].filter(el => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  }).slice(0, 4000);
  const tally = arr => { const m = {}; arr.forEach(v => { if (v != null && v !== '') m[v] = (m[v] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim();
  const rgb = c => { const m = (c || '').match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const sat = v => { const [r, g, b] = v.slice(0, 3).map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); };
  const label = el => (ownText(el) || el.getAttribute('aria-label') || el.className || el.tagName).toString().replace(/\s+/g, ' ').slice(0, 40);
  const emojiRe = /\p{Extended_Pictographic}/u;

  const f = { size: [], family: [], weight: [], color: [], bg: [], radius: [], shadow: [], space: [], left: [] };
  const sig = { gradientSurfaces: [], gradientText: [], glowShadows: [], emojiInUI: [], upperTracked: [], heavyWeights: [], negativeTrackingSmall: [], infiniteAnimations: [], transitionAll: [], exclamations: [], italicEmphasis: [] };
  const push = (k, v) => { if (sig[k].length < 12) sig[k].push(v); };

  for (const el of els) {
    const s = getComputedStyle(el); const t = ownText(el);
    if (t) {
      const fs = parseFloat(s.fontSize);
      f.size.push(s.fontSize); f.family.push(s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
      f.weight.push(s.fontWeight); f.color.push(s.color); f.left.push(Math.round(el.getBoundingClientRect().left));
      if (emojiRe.test(t)) push('emojiInUI', t.slice(0, 30));
      if (s.textTransform === 'uppercase' && parseFloat(s.letterSpacing) > fs * 0.04) push('upperTracked', t.slice(0, 30));
      if (+s.fontWeight >= 700 && fs >= 20) push('heavyWeights', `${s.fontWeight} ${fs}px "${t.slice(0, 24)}"`);
      if (fs < 16 && parseFloat(s.letterSpacing) < 0) push('negativeTrackingSmall', `${fs}px ${s.letterSpacing} "${t.slice(0, 20)}"`);
      if (/!/.test(t) && t.length < 120) push('exclamations', t.slice(0, 40));
      if (s.fontStyle === 'italic' && !['EM', 'I', 'CITE', 'BLOCKQUOTE'].includes(el.tagName)) push('italicEmphasis', t.slice(0, 30));
      if ((s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') && /gradient/.test(s.backgroundImage)) push('gradientText', t.slice(0, 30));
    }
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') f.bg.push(s.backgroundColor);
    if (s.borderRadius !== '0px') f.radius.push(s.borderRadius);
    if (s.boxShadow !== 'none') {
      f.shadow.push(s.boxShadow);
      // colored glow: saturated color, large blur, (near) zero offset
      const parts = s.boxShadow.split(/,(?![^(]*\))/);
      if (parts.some(p => { const c = rgb((p.match(/rgba?\([^)]*\)/) || [''])[0]); const nums = p.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) || [];
        const [x, y, blur] = nums.map(parseFloat); return c && sat(c) > 0.4 && (c[3] === undefined || c[3] > 0.15) && (blur || 0) >= 8 && Math.abs(x || 0) <= 2 && Math.abs(y || 0) <= 4; }))
        push('glowShadows', label(el));
    }
    if (/gradient/.test(s.backgroundImage) && !(s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text')) {
      const cols = (s.backgroundImage.match(/rgba?\([^)]*\)/g) || []).map(rgb).filter(Boolean);
      const hues = cols.filter(c => sat(c) > 0.3).length;
      if (hues >= 2) push('gradientSurfaces', label(el));
    }
    if (s.animationName !== 'none' && s.animationIterationCount === 'infinite') push('infiniteAnimations', `${s.animationName} on ${label(el)}`);
    if (/(^|,\s*)all(\s|$|,)/.test(s.transitionProperty) && parseFloat(s.transitionDuration) > 0) push('transitionAll', label(el));
    ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'rowGap', 'columnGap']
      .forEach(k => { const v = parseFloat(s[k]); if (v > 0) f.space.push(Math.round(v)); });
  }

  const space = tally(f.space); const total = f.space.length || 1;
  const offGrid = f.space.filter(v => v % 4 !== 0 && v > 2);
  const lefts = tally(f.left).filter(([, n]) => n >= 2).map(([v]) => +v).sort((a, b) => a - b);
  const nearMisses = [];
  for (let i = 1; i < lefts.length; i++) { const d = lefts[i] - lefts[i - 1]; if (d > 0 && d <= 4) nearMisses.push([lefts[i - 1], lefts[i]]); }
  const badImages = [...document.images].filter(i => i.naturalWidth && i.getBoundingClientRect().width > 0).map(i => {
    const r = i.getBoundingClientRect(); const fit = getComputedStyle(i).objectFit;
    return { src: i.currentSrc.slice(-50), upscaled: r.width > i.naturalWidth * 1.1,
      distorted: fit === 'fill' && Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight) > 0.05 };
  }).filter(i => i.upscaled || i.distorted).slice(0, 10);
  const broken = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map(i => i.src.slice(-50)).slice(0, 10);

  const signalCount = Object.values(sig).reduce((n, a) => n + (a.length ? 1 : 0), 0);
  return {
    counts: {
      fontSizes: tally(f.size).length, fontFamilies: tally(f.family).length, fontWeights: tally(f.weight).length,
      textColors: tally(f.color).length, bgColors: tally(f.bg).length, radii: tally(f.radius).length, shadowKinds: tally(f.shadow).length
    },
    fontSizes: tally(f.size), fontFamilies: tally(f.family), fontWeights: tally(f.weight),
    textColors: tally(f.color).slice(0, 12), bgColors: tally(f.bg).slice(0, 12), radii: tally(f.radius).slice(0, 12),
    spacingTop: space.slice(0, 15), offGrid4pxShare: +(offGrid.length / total).toFixed(2), offGridValues: tally(offGrid).slice(0, 10),
    alignmentNearMisses: nearMisses.slice(0, 10), badImages, brokenImages: broken,
    slopSignals: sig, slopSignalKinds: signalCount,
    readingGuide: 'fontSizes>6, textColors>5, radii>4, shadowKinds>3, offGrid4pxShare>0.2 => no system. Each slopSignals entry is a lead, verify on screenshot.'
  };
}
