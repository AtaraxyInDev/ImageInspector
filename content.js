// Image Inspector — Content Script v24 (Beta Mode & Domain Tracking)
if (typeof window.__II_LOADED__ === 'undefined') {
  window.__II_LOADED__ = true;

  (() => {
    'use strict';

    let enabled = true;
    let blacklist = [];
    let activeImg = null;
    let inspectId = 0;
    let mouseX = 0;
    let mouseY = 0;
    let observer = null;
    let theme = { accent: '#c03962', bg: '#1c1a17' };
    let adv = { palette: true, search: true, eye: true, open: true, url: true, freeze: true, smartBorder: true, colorFormat: 'HEX', colorCount: 3, freezeMode: 'HOLD', lang: 'auto' };
    let metaPref = { domain: true, ratio: true, date: false, camera: false, gps: false, aperture: false, creator: false, copyright: false, orientation: false, software: false, title: false, profile: false };
    let isFrozen = false;
    let forceFrozen = false;
    let isPicking = false;
    let lastData = null;
    let rowCount = 0;
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0, ttStartX = null, ttStartY = null;
    let hideTimeout = null;

    // ── HELPERS ──────────────────────────────────────────────────────────────
    function isBlacklisted() { const host = window.location.hostname.toLowerCase(); return (blacklist || []).some(d => host === d || host.endsWith('.' + d)); }
    function getContrastColor(hex) { if (!hex || hex.length < 6) return '#eeeeee'; const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#111111' : '#eeeeee'; }
    function escHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    function getRatio(w, h) {
      const r = w / h;
      const standards = [
        { n: '1:1', v: 1 }, { n: '4:3', v: 4 / 3 }, { n: '3:2', v: 1.5 }, { n: '16:9', v: 16 / 9 },
        { n: '21:9', v: 21 / 9 }, { n: '9:16', v: 9 / 16 }, { n: '2:3', v: 0.666 }, { n: '3:4', v: 0.75 }
      ];
      const match = standards.find(s => Math.abs(s.v - r) < 0.035); // Tolerancia ligeramente mayor para pantallas retina/editadas
      if (match) return match.n;
      const common = gcd(w, h);
      if (w / common > 50 || h / common > 50) return `${(w / h).toFixed(2)}:1`;
      return `${w / common}:${h / common}`;
    }
    function getDomain(url) { try { return new URL(url).hostname; } catch (e) { return 'Unknown'; } }

    // ── LOCALIZATION ──────────────────────────────────────────────────────────
    const MESSAGES = {
      es: { dim: 'Dimensiones', mp: 'Megapíxeles', domain: 'Dominio', ratio: 'Relación', weight: 'Peso', format: 'Formato', alt: 'Alt text', getting: 'Obteniendo...', analyzing: 'Analizando...', lens: 'Lens', color: 'Color', open: 'Abrir', url: 'URL', copied: 'Copiado', frozen: 'CONGELADO', hold: 'Mantén', press: 'Pulsa', interact: 'para interactuar', url_copied: 'URL Copiada', date: 'Fecha/Hora', camera: 'Cámara', gps: 'GPS', aperture: 'Apertura', creator: 'Autor', copyright: 'Copyright', orientation: 'Orientación', software: 'Software', title: 'Título', profile: 'Perfil', copied_clean: 'Imagen Limpia Copiada', copied_code: 'Código de Borde Copiado', copied_silhouette: 'Silueta SVG Copiada' },
      en: { dim: 'Dimensions', mp: 'Megapixels', domain: 'Domain', ratio: 'Ratio', weight: 'Weight', format: 'Format', alt: 'Alt text', getting: 'Getting...', analyzing: 'Analyzing...', lens: 'Lens', color: 'Color', open: 'Open', url: 'URL', copied: 'Copied', frozen: 'FROZEN', hold: 'Hold', press: 'Press', interact: 'to interact', url_copied: 'URL Copied', date: 'Date/Time', camera: 'Camera', gps: 'GPS', aperture: 'Aperture', creator: 'Author', copyright: 'Copyright', orientation: 'Orientation', software: 'Software', title: 'Title', profile: 'Profile', copied_clean: 'Clean Image Copied', copied_code: 'Border Code Copied', copied_silhouette: 'SVG Silhouette Copied' },
      ru: { dim: 'Размеры', mp: 'Мегапиксели', domain: 'Домен', ratio: 'Формат', weight: 'Вес', format: 'Формат', alt: 'Alt текст', getting: 'Получение...', analyzing: 'Анализ...', lens: 'Lens', color: 'Цвет', open: 'Открыть', url: 'URL', copied: 'Скопировано', frozen: 'ЗАМОРОЖЕНО', hold: 'Удерживайте', press: 'Нажмите', interact: 'для взаимодействия', url_copied: 'URL скопирован', date: 'Дата/Время', camera: 'Камера', gps: 'GPS', aperture: 'Диафрагма', creator: 'Автор', copyright: 'Авторское право', orientation: 'Ориентация', software: 'ПО', title: 'Заголовок', profile: 'Профиль' },
      pt: { dim: 'Dimensões', mp: 'Megapixels', domain: 'Domínio', ratio: 'Proporção', weight: 'Peso', format: 'Formato', alt: 'Alt texto', getting: 'Obtendo...', analyzing: 'Analisando...', lens: 'Lens', color: 'Cor', open: 'Abrir', url: 'URL', copied: 'Copiado', frozen: 'CONGELADO', hold: 'Segure', press: 'Pressione', interact: 'para interagir', url_copied: 'URL Copiada', date: 'Data/Hora', camera: 'Câmera', gps: 'GPS', aperture: 'Abertura', creator: 'Autor', copyright: 'Copyright', orientation: 'Orientación', software: 'Software', title: 'Título', profile: 'Perfil' },
      ja: { dim: 'サイズ', mp: 'メガピクセル', domain: 'ドメイン', ratio: '比率', weight: '重さ', format: '形式', alt: '代替テキスト', getting: '取得中...', analyzing: '分析中...', lens: 'レンズ', color: '色', open: '開く', url: 'URL', copied: 'コピー完了', frozen: '固定中', hold: '長押し', press: '押す', interact: 'で操作', url_copied: 'URLをコピーしました', date: '日時', camera: 'カメラ', gps: 'GPS', aperture: '絞り', creator: '作者', copyright: '著作権', orientation: '方向', software: 'ソフト', title: 'タイトル', profile: 'プロファイル' },
      zh: { dim: '尺寸', mp: '百万像素', domain: '域名', ratio: '比例', weight: '重量', format: '格式', alt: 'Alt 文本', getting: '获取中...', analyzing: '分析中...', lens: 'Lens', color: '颜色', open: '打开', url: 'URL', copied: '已复制', frozen: '已冻结', hold: '按住', press: '按下', interact: '以交互', url_copied: 'URL 已复制', date: '日期/时间', camera: '相机', gps: 'GPS', aperture: '光圈', creator: '作者', copyright: '版权', orientation: '方向', software: '软件', title: '标题', profile: '配置' }
    };
    function getLang() { if (adv && adv.lang && adv.lang !== 'auto') return adv.lang; const l = navigator.language.split('-')[0]; return MESSAGES[l] ? l : 'en'; }
    function t(key) { return MESSAGES[getLang()][key] || MESSAGES.en[key]; }

    // ── COLOR CONVERSION ──────────────────────────────────────────────────────
    function hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return [r, g, b]; }
    function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) h = s = 0; else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; }
    function formatColor(hex) { if (!hex) return ''; const [r, g, b] = hexToRgb(hex); switch (adv.colorFormat) { case 'RGB': return `rgb(${r}, ${g}, ${b})`; case 'HSL': { const [h, s, l] = rgbToHsl(r, g, b); return `hsl(${h}, ${s}%, ${l}%)`; } default: return hex.toUpperCase(); } }

    // ── STYLES ────────────────────────────────────────────────────────────────
    function initStyles() {
      let s = document.getElementById('__II_STYLES__'); if (!s) { s = document.createElement('style'); s.id = '__II_STYLES__'; document.head.appendChild(s); }
      const textColor = getContrastColor(theme.bg), mutedColor = textColor === '#111111' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)', borderSubtle = textColor === '#111111' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)', swatchBorder = textColor === '#111111' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
      s.textContent = `:root { --ii-accent: ${theme.accent}; --ii-bg: ${theme.bg}; --ii-text: ${textColor}; --ii-text-muted: ${mutedColor}; --ii-border: ${borderSubtle}; --ii-swatch-border: ${swatchBorder}; }
        @keyframes ii-p-in { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes ii-r-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ii-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .__ii_tooltip { position: fixed; z-index: 2147483647; pointer-events: none; opacity: 0; max-width: 275px; font-family: 'Segoe UI', sans-serif; left: 0; top: 0; will-change: transform, opacity; transition: transform 0.45s cubic-bezier(0.15, 1, 0.3, 1), opacity 0.3s ease; transform: translate3d(0, 0, 0) scale(1); }
        .__ii_tooltip.show { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        .__ii_row { opacity: 1; }
        .__ii_tooltip:not(.moving) .__ii_row { animation: ii-r-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .__ii_card { pointer-events: none; transition: transform 0.3s cubic-bezier(0.15, 1, 0.3, 1), opacity 0.3s ease, background 0.3s ease; border: 1px solid var(--ii-border); user-select: none !important; }
        .__ii_card.frozen { pointer-events: auto !important; transform: scale(1.02); box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 1.5px var(--ii-accent); }
        .__ii_card_header { cursor: grab; padding-bottom: 10px; border-bottom: 1px solid var(--ii-border); display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
        .__ii_overlay { position: fixed; pointer-events: none; z-index: 2147483646; border: 2px solid var(--ii-accent); box-shadow: 0 0 0 2px rgba(0,0,0,0.2), 0 0 15px var(--ii-accent); transition: opacity 0.2s, width 0.4s cubic-bezier(0.15, 1, 0.3, 1), height 0.4s cubic-bezier(0.15, 1, 0.3, 1), transform 0.4s cubic-bezier(0.15, 1, 0.3, 1); opacity: 0; transform-origin: center; }
        .__ii_overlay.png-mode { border: none !important; box-shadow: none !important; }
        .__ii_overlay.png-mode #__ii_overlay_clone { opacity: 1 !important; }
        .__ii_btn { background: rgba(255,255,255,0.05); border: 1px solid var(--ii-border); border-radius: 6px; color: var(--ii-text); font-size: 9px; padding: 5px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 4px; text-decoration: none; font-weight: 700; flex: 1; justify-content: center; }
        .__ii_btn:hover { background: var(--ii-accent); color: #fff; border-color: var(--ii-accent); }
        .__ii_swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--ii-swatch-border); cursor: pointer; transition: transform 0.2s; position: relative; flex-shrink:0; }
        .__ii_toast { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: var(--ii-accent); color: #fff; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); pointer-events: none; z-index: 200; transform: translate(-50%, 10px); }
        .__ii_toast.global { position: fixed; bottom: 60px; z-index: 2147483647; font-size: 14px; padding: 10px 24px; border-radius: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .__ii_toast.show { opacity: 1; transform: translate(-50%, 0); }
        .__ii_spinner { width: 12px; height: 12px; border: 2px solid var(--ii-text-muted); border-top-color: var(--ii-accent); border-radius: 50%; animation: ii-spin 0.8s linear infinite; }`;
    }

    function getTooltip() { let el = document.getElementById('__II_TT__'); if (!el) { el = document.createElement('div'); el.id = '__II_TT__'; el.className = '__ii_tooltip'; document.documentElement.appendChild(el); } return el; }
    function getOverlay() { let el = document.getElementById('__II_OVERLAY__'); if (!el) { el = document.createElement('div'); el.id = '__II_OVERLAY__'; el.className = '__ii_overlay'; el.innerHTML = `<div id="__ii_overlay_clone" style="width:100%;height:100%;opacity:0;pointer-events:none;filter:url(#__ii_outline) drop-shadow(0 0 10px var(--ii-accent)); transition: opacity 0.2s;"></div>`; document.documentElement.appendChild(el); let svg = document.createElement('div'); svg.id = '__II_SVG_FILTERS__'; svg.innerHTML = `<svg width="0" height="0" style="position:absolute;pointer-events:none;"><filter id="__ii_outline" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="2" result="DILATED" /><feFlood flood-color="${theme.accent}" result="COLOR" id="__ii_flood" /><feComposite in="COLOR" in2="DILATED" operator="in" result="OUTLINE" /><feComposite in="OUTLINE" in2="SourceAlpha" operator="out" result="FINAL_OUTLINE" /></filter></svg>`; document.documentElement.appendChild(svg); } return el; }
    function showToast(txt, customBg, isGlobal = false) { let container = isGlobal ? document.documentElement : getTooltip(); let tId = isGlobal ? '__II_GLOBAL_TOAST__' : null; let t = tId ? document.getElementById(tId) : container.querySelector('.__ii_toast:not(.global)'); if (!t) { t = document.createElement('div'); t.className = isGlobal ? '__ii_toast global' : '__ii_toast'; if (tId) t.id = tId; container.appendChild(t); } t.textContent = txt; t.style.background = customBg || 'var(--ii-accent)'; t.style.color = customBg ? getContrastColor(customBg) : '#fff'; t.classList.add('show'); clearTimeout(t.ti); t.ti = setTimeout(() => { t.classList.remove('show'); if (isGlobal) setTimeout(() => t.remove(), 400); }, 2500); }
    function getVisibleBounds(el) { let r = el.getBoundingClientRect(); let bounds = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; let radius = window.getComputedStyle(el).borderRadius; let curr = el.parentElement; while (curr && curr !== document.body && curr !== document.documentElement) { const st = window.getComputedStyle(curr); if (st.overflow === 'hidden' || st.overflowX === 'hidden' || st.overflowY === 'hidden') { const pr = curr.getBoundingClientRect(); if (pr.width > 0 && pr.height > 0) { bounds.left = Math.max(bounds.left, pr.left); bounds.top = Math.max(bounds.top, pr.top); bounds.right = Math.min(bounds.right, pr.right); bounds.bottom = Math.min(bounds.bottom, pr.bottom); bounds.width = bounds.right - bounds.left; bounds.height = bounds.bottom - bounds.top; if (parseFloat(st.borderRadius) > 0 || st.borderRadius.includes('%')) radius = st.borderRadius; } } curr = curr.parentElement; } return { rect: bounds, radius: radius }; }
    function placeTooltip(tt) {
      if (!tt || !activeImg || isFrozen || forceFrozen || isPicking) return;
      const PAD = 25, W = 275, H = tt.offsetHeight || 200;
      const imgR = activeImg.getBoundingClientRect();
      const winW = window.innerWidth, winH = window.innerHeight;

      // 1. Intentar posicionar relativo al cursor inicialmente
      let left = mouseX + PAD, top = mouseY + PAD;

      // 2. Lógica de Evitación Inteligente (Solo si la imagen no es gigante)
      const isHuge = imgR.width > winW * 0.8 && imgR.height > winH * 0.8;
      if (!isHuge) {
        const overlaps = !(left + W < imgR.left || left > imgR.right || top + H < imgR.top || top > imgR.bottom);
        if (overlaps) {
          if (imgR.right + W + PAD < winW - 10) left = imgR.right + PAD;
          else if (imgR.left - W - PAD > 10) left = imgR.left - W - PAD;
          else if (imgR.top - H - PAD > 10) { top = imgR.top - H - PAD; left = mouseX - (W/2); }
          else if (imgR.bottom + PAD + H < winH - 10) top = imgR.bottom + PAD;
        }
      }

      // 3. Ajustes de seguridad
      if (left + W > winW - 10) left = winW - W - 10;
      if (left < 10) left = 10;
      if (top + H > winH - 10) top = winH - H - 10;
      if (top < 10) top = 10;

      if (tt.classList.contains('show')) {
        tt.classList.add('moving');
      }
      
      if (!tt.classList.contains('show')) {
        tt.style.transition = 'none';
        tt.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) scale(0)`;
        tt.style.opacity = '0';
        tt.offsetHeight;
        tt.style.transition = '';
        tt.classList.add('show');
      }

      tt.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`;
      tt.style.opacity = '1';

      const ov = getOverlay(), boundsInfo = getVisibleBounds(activeImg), r = boundsInfo.rect;
      if (window.getComputedStyle(ov).opacity === '0') {
        ov.style.transition = 'none';
        ov.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) scale(0)`;
        ov.style.opacity = '0';
        ov.style.width = '0px';
        ov.style.height = '0px';
        ov.offsetHeight;
        ov.style.transition = '';
      }
      ov.style.borderRadius = boundsInfo.radius;
      const srcLower = (activeImg.currentSrc || activeImg.src || '').toLowerCase();
      const isPng = adv.smartBorder && (srcLower.includes('.png') || srcLower.includes('.webp') || srcLower.includes('.avif') || srcLower.includes('.gif') || srcLower.startsWith('data:image/png') || srcLower.startsWith('data:image/webp'));
      const st = window.getComputedStyle(activeImg);
      const clone = document.getElementById('__ii_overlay_clone');
      if (isPng) {
        ov.classList.add('png-mode');
        ov.style.transform = `translate3d(${r.left}px, ${r.top}px, 0) scale(1)`;
        ov.style.width = r.width + 'px';
        ov.style.height = r.height + 'px';
        ov.style.left = '0px'; ov.style.top = '0px'; // Reset left/top to use transform exclusively
        if (activeImg.tagName === 'IMG') {
          clone.style.backgroundImage = `url("${activeImg.currentSrc || activeImg.src}")`;
          clone.style.backgroundSize = (st.objectFit === 'cover' || st.objectFit === 'contain') ? st.objectFit : '100% 100%';
          clone.style.backgroundPosition = st.objectPosition;
        } else {
          clone.style.backgroundImage = st.backgroundImage;
          clone.style.backgroundSize = st.backgroundSize;
          clone.style.backgroundPosition = st.backgroundPosition;
        }
        clone.style.backgroundRepeat = 'no-repeat';
        clone.style.borderRadius = boundsInfo.radius;
        const flood = document.getElementById('__ii_flood');
        if (flood) flood.setAttribute('flood-color', theme.accent);
      } else {
        ov.classList.remove('png-mode');
        ov.style.transform = `translate3d(${r.left - 2}px, ${r.top - 2}px, 0) scale(1)`;
        ov.style.width = (r.width + 4) + 'px';
        ov.style.height = (r.height + 4) + 'px';
        ov.style.left = '0px'; ov.style.top = '0px';
        if (clone) clone.style.backgroundImage = 'none';
      }
      ov.style.opacity = '1';
    }
    function hideUI(instant = false) { 
      if (isFrozen || forceFrozen) return; 
      
      clearTimeout(hideTimeout);
      if (instant) {
        performHide(true);
      } else {
        // Tiempo de gracia: esperamos un poco antes de ocultar por si entramos en otra imagen
        hideTimeout = setTimeout(() => {
          performHide(false);
        }, 300);
      }
    }

    function performHide(instant = false) {
      const tt = getTooltip(), ov = getOverlay(); 
      tt.classList.remove('show', 'moving');
      
      const ttR = tt.getBoundingClientRect();
      const ovR = ov.getBoundingClientRect();
      
      const ttX = mouseX - (ttR.width / 2);
      const ttY = mouseY - (ttR.height / 2);
      const ovX = mouseX - (ovR.width / 2);
      const ovY = mouseY - (ovR.height / 2);

      const ttTarget = `translate3d(${ttX}px, ${ttY}px, 0) scale(0)`;
      const ovTarget = `translate3d(${ovX}px, ${ovY}px, 0) scale(0)`;
      
      if (instant) { 
        tt.style.transition = 'none';
        tt.style.transform = ttTarget;
        tt.style.opacity = '0';
        ov.style.transition = 'none';
        ov.style.transform = ovTarget;
        ov.style.opacity = '0';
      } else { 
        tt.style.transform = ttTarget;
        tt.style.opacity = '0';
        ov.style.transform = ovTarget;
        ov.style.opacity = '0';
      } 
    }

    // ── RENDER ────────────────────────────────────────────────────────────────
    function row(label, val) { rowCount++; const delay = (rowCount * 0.04).toFixed(2); return `<div class="__ii_row" style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:2px 0;animation-delay:${delay}s"><span style="color:var(--ii-text-muted);font-size:11px">${label}</span><span style="text-align:right;word-break:break-all;font-size:11.5px">${val}</span></div>`; }
    function valS(text, opts = {}) { return `<span style="color:${opts.accent ? 'var(--ii-accent)' : (opts.muted ? 'var(--ii-text-muted)' : 'var(--ii-text)')};font-size:${opts.large ? '13px' : '12px'};font-weight:${opts.bold ? '700' : '400'}">${text}</span>`; }
    function badge(text) { return `<span style="display:inline-block;background:color-mix(in srgb, var(--ii-accent), transparent 85%);color:var(--ii-accent);border:1px solid color-mix(in srgb, var(--ii-accent), transparent 70%);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700">${text}</span>`; }
    function fmtSize(n) { if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'; return (n / 1048576).toFixed(2) + ' MB'; }

    function buildContent(d) {
      rowCount = 0;
      let h = row(t('dim'), valS(`${d.naturalW} × ${d.naturalH} px`, { accent: true, bold: true, large: true }));
      const mp = (d.naturalW * d.naturalH / 1_000_000).toFixed(2);
      h += row(t('mp'), valS(mp + ' MP'));

      // Beta/Dynamic Meta
      if (metaPref.domain) h += row(t('domain'), valS(getDomain(d.src), { muted: true }));
      if (metaPref.ratio) h += row(t('ratio'), valS(getRatio(d.naturalW, d.naturalH), { accent: true, bold: true }));

      if (d.exif) {
        const e = d.exif;
        if (metaPref.date && e.date) h += row(t('date'), valS(e.date));
        if (metaPref.camera && (e.make || e.model)) h += row(t('camera'), valS(`${e.make || ''} ${e.model || ''}`));
        if (metaPref.gps && e.gps) h += row(t('gps'), `<a href="https://www.google.com/maps/search/${encodeURIComponent(e.gps)}" target="_blank" style="color:var(--ii-accent);text-decoration:none;">${valS(e.gps, { accent: true })} ↗</a>`);
        if (metaPref.aperture && e.aperture) h += row(t('aperture'), valS(e.aperture));
        if (metaPref.creator && e.creator) h += row(t('creator'), valS(e.creator));
        if (metaPref.copyright && e.copyright) h += row(t('copyright'), valS(e.copyright));
        if (metaPref.orientation && e.orientation) h += row(t('orientation'), valS(e.orientation));
        if (metaPref.software && e.software) h += row(t('software'), valS(e.software));
        if (metaPref.title && e.title) h += row(t('title'), valS(e.title));
        if (metaPref.profile && e.colorSpace) h += row(t('profile'), valS(e.colorSpace));
      }

      h += '<div style="height:1px;background:var(--ii-border);margin:6px 0"></div>';
      if (d.sizePending) h += row(t('weight'), valS(t('getting'), { muted: true }));
      else if (d.size) h += row(t('weight'), valS(fmtSize(d.size), { accent: true, bold: true, large: true }));
      if (d.format) h += row(t('format'), badge(d.format));
      if (d.alt) h += row(t('alt'), `<span style="font-size:11px;color:var(--ii-text-muted)">${escHtml(d.alt)}</span>`);
      if (adv.palette && !d.palettePending && d.colors?.length) {
        h += '<div style="margin-top:10px;border-top:1px solid var(--ii-border);padding-top:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">';
        d.colors.forEach(c => { h += `<div class="__ii_swatch" style="background:${c}" data-hex="${c}"></div>`; });
        h += '</div>';
      }
      if (adv.freeze) {
        const btns = [adv.search && 'lens', adv.eye && 'eye', adv.open && 'open', adv.url && 'copy'].filter(Boolean);
        if (btns.length) {
          h += `<div style="display:grid;grid-template-columns:${btns.length > 1 ? '1fr 1fr' : '1fr'};gap:6px;margin-top:12px;border-top:1px solid var(--ii-border);padding-top:10px">`;
          if (adv.search) h += `<button class="__ii_btn" id="__ii_btn_lens" title="Google Lens"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg> ${t('lens')}</button>`;
          if (adv.eye) h += `<button class="__ii_btn" id="__ii_btn_eye" title="Cuentagotas"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21,7L20.03,8.03L15.97,3.97L17,3C17.78,2.22 19.05,2.22 19.83,3L21,4.17C21.78,4.95 21.78,6.22 21,7M2,21V19L14.56,6.44L17.56,9.44L5,22H2V21M13,11L11,13L12,14L14,12L13,11Z"/></svg> ${t('color')}</button>`;
          if (adv.open) h += `<button class="__ii_btn" id="__ii_btn_open" title="Abrir Origen"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/></svg> ${t('open')}</button>`;
          if (adv.url) h += `<button class="__ii_btn" id="__ii_btn_copy" title="Copiar URL"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg> ${t('url')}</button>`;
          h += '</div>';
          const srcLower = (d.src || '').toLowerCase();
          const isPng = adv.smartBorder && (srcLower.includes('.png') || srcLower.includes('.webp') || srcLower.includes('.avif') || srcLower.includes('.gif') || srcLower.startsWith('data:image/png') || srcLower.startsWith('data:image/webp'));
          if (isPng) {
            h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">`;
            h += `<button class="__ii_btn" id="__ii_btn_clean" title="Extraer PNG Limpio (Ctrl+C)"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z"/></svg> PNG</button>`;
            h += `<button class="__ii_btn" id="__ii_btn_css" title="Copiar Código de Borde (Ctrl+B)"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z"/></svg> CSS</button>`;
            h += `<button class="__ii_btn" id="__ii_btn_silhouette" title="Extraer Silueta SVG (Ctrl+X)"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/></svg> SVG</button>`;
            h += '</div>';
          }
        }
        if (!isFrozen) h += `<div style="text-align:center;font-size:8px;color:var(--ii-text-muted);margin-top:8px;letter-spacing:.05em;text-transform:uppercase"><b>${adv.freezeMode === 'HOLD' ? t('hold') : t('press')} SHIFT</b> ${t('interact')}</div>`;
      }
      return h;
    }

    function wrapCard(inner) {
      const isVisible = (isFrozen || forceFrozen || isPicking);
      return `<div class="__ii_card ${isVisible ? 'frozen' : ''}" style="background:var(--ii-bg);border-radius:12px;padding:14px;box-shadow:0 12px 40px rgba(0,0,0,0.6);color:var(--ii-text);backdrop-filter:blur(15px)"><div class="__ii_card_header"><div style="width:20px;height:20px;background:linear-gradient(135deg, var(--ii-accent), #7b5ea7);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="9" height="9" rx="1.5" stroke="white" stroke-width="1.2"/><circle cx="3.5" cy="3.5" r="1" fill="white"/><path d="M1 8.5l2.5-2.5 2 2 1.5-1.5L10 8.5" stroke="white" stroke-width="1" stroke-linecap="round"/></svg></div><span style="font-size:10px;font-weight:800;color:var(--ii-text-muted);text-transform:uppercase;letter-spacing:.1em">Image Inspector</span>${isVisible ? `<span style="margin-left:auto; font-size:9px; background:var(--ii-accent); color:#fff; padding:1px 5px; border-radius:4px; font-weight:900">${t('frozen')}</span>` : ''}</div><div>${inner}</div></div>`;
    }

    async function inspect(imgData) {
      const img = imgData.el;
      if ((isFrozen || forceFrozen || isPicking) && activeImg === img) return;
      const myId = ++inspectId; const src = imgData.src;
      let natW = img.naturalWidth || 0; let natH = img.naturalHeight || 0;
      if (!natW || !natH) {
        const r = img.getBoundingClientRect();
        if (img.tagName !== 'IMG' && r.width && r.height) { natW = Math.round(r.width); natH = Math.round(r.height); }
        const tmp = new Image(); tmp.src = src;
        tmp.onload = () => { if (lastData && lastData.src === src && tmp.naturalWidth) { lastData.naturalW = tmp.naturalWidth; lastData.naturalH = tmp.naturalHeight; updateTooltip(lastData); } };
      }
      let d = { src, alt: img.alt || img.getAttribute('aria-label') || '', naturalW: natW, naturalH: natH, size: null, sizePending: !src.startsWith('data:') && !!src, palettePending: adv.palette, format: null, colors: [], exif: null };
      lastData = d; updateTooltip(d); if (myId !== inspectId) return;
      if (src) {
        chrome.runtime.sendMessage({ type: 'FETCH_META', url: src, getPalette: adv.palette, colorCount: adv.colorCount }, (res) => {
          if (myId === inspectId && res) {
            d.size = res.size; d.format = (res.mime ? res.mime.split('/')[1].toUpperCase() : null);
            d.colors = res.colors || []; d.exif = res.exif; d.sizePending = false; d.palettePending = false;
            lastData = d; updateTooltip(d);
          }
        });
      }
    }

    function updateTooltip(d) {
      if (!d) return; const tt = getTooltip(); tt.innerHTML = wrapCard(buildContent(d)); tt.style.pointerEvents = (isFrozen || forceFrozen || isPicking) ? 'auto' : 'none'; 
      if (isFrozen || forceFrozen || isPicking) {
        // En modo congelado mantenemos translate3d para evitar saltos a "Narnia"
        if (ttStartX === null) { // Primera vez que congelamos
           const r = tt.getBoundingClientRect();
           ttStartX = r.left; ttStartY = r.top;
        }
        tt.style.transform = `translate3d(${ttStartX}px, ${ttStartY}px, 0) scale(1)`;
      } else {
        ttStartX = null; // Reset al descongelar
        placeTooltip(tt);
      }
      if (isFrozen || forceFrozen || isPicking) {
        const header = tt.querySelector('.__ii_card_header');
        header.onmousedown = (e) => { 
          isDragging = true; 
          dragStartX = e.clientX; 
          dragStartY = e.clientY; 
          const r = tt.getBoundingClientRect();
          ttStartX = r.left; ttStartY = r.top; 
          e.preventDefault(); 
        };
        tt.querySelector('#__ii_btn_lens')?.addEventListener('click', () => { chrome.runtime.sendMessage({ type: 'OPEN_LENS', url: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(d.src)}` }); isFrozen = false; forceFrozen = false; isPicking = false; endHover(); });
        tt.querySelector('#__ii_btn_open')?.addEventListener('click', () => { window.open(d.src, '_blank'); isFrozen = false; forceFrozen = false; isPicking = false; endHover(); });
        tt.querySelector('#__ii_btn_copy')?.addEventListener('click', () => { navigator.clipboard.writeText(d.src).then(() => showToast(t('url_copied'))); });
        tt.querySelector('#__ii_btn_clean')?.addEventListener('click', () => copyCleanImage(d.src));
        tt.querySelector('#__ii_btn_css')?.addEventListener('click', () => copyBorderCode());
        tt.querySelector('#__ii_btn_silhouette')?.addEventListener('click', () => copySilhouette(d));
        tt.querySelector('#__ii_btn_eye')?.addEventListener('click', async () => { if (!window.EyeDropper) return; isFrozen = false; forceFrozen = false; hideUI(true); isPicking = true; try { const result = await new EyeDropper().open(); const val = formatColor(result.sRGBHex); navigator.clipboard.writeText(val).then(() => { isPicking = false; showToast(`${t('copied')}: ${val}`, result.sRGBHex, true); }); } catch (e) { isPicking = false; } });
        tt.querySelectorAll('.__ii_swatch').forEach(s => { s.onclick = (e) => { e.preventDefault(); e.stopPropagation(); const hex = s.getAttribute('data-hex'); const val = formatColor(hex); navigator.clipboard.writeText(val).then(() => { showToast(`${t('copied')}: ${val}`, hex); const oldBg = s.style.background; s.style.background = '#fff'; setTimeout(() => { if (s) s.style.background = oldBg; }, 250); }); }; });
      }
    }

    function loadState() {
      chrome.storage.local.get({
        enabled: true,
        blacklist: ['youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'twitter.com', 'x.com'],
        theme: { accent: '#c03962', bg: '#1c1a17' },
        adv: { palette: true, search: true, eye: true, open: true, url: true, freeze: true, smartBorder: true, colorFormat: 'HEX', colorCount: 3, freezeMode: 'HOLD', lang: 'auto' },
        meta: { domain: true, ratio: true, date: false, camera: false, gps: false, aperture: false, creator: false, copyright: false, orientation: false, software: false, title: false, profile: false }
      }, (res) => {
        enabled = res.enabled ?? true; blacklist = res.blacklist || []; theme = res.theme || { accent: '#c03962', bg: '#1c1a17' };
        adv = res.adv || { palette: true, search: true, eye: true, open: true, url: true, freeze: true, colorFormat: 'HEX', colorCount: 3, freezeMode: 'HOLD', lang: 'auto' };
        metaPref = res.meta || { domain: true, ratio: true };
        initStyles(); if (enabled && !isBlacklisted()) setTimeout(checkInitial, 500);
      });
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.enabled) enabled = changes.enabled.newValue;
      if (changes.blacklist) blacklist = changes.blacklist.newValue;
      if (changes.theme) { theme = changes.theme.newValue; initStyles(); }
      if (changes.adv) adv = changes.adv.newValue;
      if (changes.meta) metaPref = changes.meta.newValue;
      if (!enabled || isBlacklisted()) { isFrozen = false; isPicking = false; forceFrozen = false; endHover(); }
      else if (activeImg && lastData) updateTooltip(lastData);
    });

    document.addEventListener('mousemove', (e) => { 
      mouseX = e.clientX; mouseY = e.clientY; 
      if (isDragging) { 
        const tt = getTooltip(); 
        ttStartX = ttStartX + (e.clientX - dragStartX);
        ttStartY = ttStartY + (e.clientY - dragStartY);
        tt.style.transform = `translate3d(${ttStartX}px, ${ttStartY}px, 0) scale(1.02)`;
        dragStartX = e.clientX; dragStartY = e.clientY;
        return; 
      } 
      if (!enabled || isBlacklisted() || isFrozen || forceFrozen || isPicking) return; 
      if (activeImg) { 
        const b = getVisibleBounds(activeImg).rect; 
        if (mouseX < b.left - 5 || mouseX > b.right + 5 || mouseY < b.top - 5 || mouseY > b.bottom + 5) endHover(); 
        else placeTooltip(getTooltip()); 
      } else { 
        const imgData = getValidImage(mouseX, mouseY, e.target); 
        if (imgData) startHover(imgData); 
      } 
    }, { passive: false });
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('scroll', () => { if (!enabled || isBlacklisted() || isFrozen || forceFrozen || isPicking || isDragging) return; if (activeImg) { const b = getVisibleBounds(activeImg).rect; if (mouseX < b.left - 5 || mouseX > b.right + 5 || mouseY < b.top - 5 || mouseY > b.bottom + 5) endHover(); else placeTooltip(getTooltip()); } }, { passive: true });
    function getValidImage(x, y, startEl) {
      let candidates = new Set(document.elementsFromPoint(x, y));
      let curr = startEl;
      while(curr && curr !== document.documentElement) { candidates.add(curr); curr = curr.parentElement; }
      const expanded = new Set(candidates);
      for (let el of candidates) {
        if (!el || !el.querySelectorAll) continue;
        const imgs = el.querySelectorAll('img');
        for (let img of imgs) {
          const r = img.getBoundingClientRect();
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) expanded.add(img);
        }
      }
      for (let el of expanded) {
        if (!el || el === document.documentElement || el === document.body) continue;
        if (el.tagName === 'IMG') return { el: el, src: el.currentSrc || el.src };
        try {
          const bg = window.getComputedStyle(el).backgroundImage;
          if (bg && bg !== 'none' && bg.includes('url(')) {
            const match = bg.match(/url\(["']?(.*?)["']?\)/);
            if (match && match[1] && !match[1].startsWith('data:image/svg')) return { el: el, src: match[1] };
          }
        } catch(e) {}
        const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || (el.tagName !== 'SCRIPT' && el.tagName !== 'IFRAME' && el.tagName !== 'A' ? el.getAttribute('src') : null);
        if (dataSrc && (dataSrc.startsWith('http') || dataSrc.startsWith('data:image/'))) return { el: el, src: dataSrc };
      }
      return null;
    }
    document.addEventListener('mouseover', (e) => { if (!enabled || isBlacklisted() || isFrozen || forceFrozen || isPicking) return; const imgData = getValidImage(e.clientX, e.clientY, e.target); if (imgData) startHover(imgData); }, { passive: true });
    function startHover(imgData) { 
      if (isFrozen || forceFrozen || isPicking) return; 
      if (activeImg === imgData.el) return; 
      
      clearTimeout(hideTimeout); // Cancelar ocultamiento pendiente
      activeImg = imgData.el; 
      inspect(imgData); 
      if (observer) observer.disconnect(); 
      observer = new MutationObserver(() => { if (!document.contains(imgData.el) || window.getComputedStyle(imgData.el).display === 'none') endHover(); }); 
      observer.observe(document.body, { childList: true, subtree: true }); 
      const tt = getTooltip();
      tt.classList.remove('moving'); 
    }
    function endHover() { 
      if (isFrozen || forceFrozen || isPicking) return; 
      activeImg = null; inspectId++; lastData = null; 
      if (observer) observer.disconnect(); 
      hideUI(); 
    }
    document.addEventListener('keydown', (e) => { 
      if (isPicking) return; 
      if (e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) { 
        e.preventDefault(); e.stopPropagation(); chrome.storage.local.set({ enabled: !enabled }); showHUD(!enabled ? '🔍 ON' : '⛔ OFF'); return; 
      } 
      if (adv.freeze && e.key === 'Shift' && activeImg) { 
        if (adv.freezeMode === 'TOGGLE') { isFrozen = !isFrozen; if (isFrozen && lastData) updateTooltip(lastData); else if (!isFrozen) endHover(); } 
        else if (adv.freezeMode === 'HOLD' && !isFrozen) { isFrozen = true; if (lastData) updateTooltip(lastData); } 
      }
      if ((isFrozen || forceFrozen) && lastData) {
        const srcLower = (lastData.src || '').toLowerCase();
        const isPng = adv.smartBorder && (srcLower.includes('.png') || srcLower.includes('.webp') || srcLower.includes('.avif') || srcLower.includes('.gif') || srcLower.startsWith('data:image/png') || srcLower.startsWith('data:image/webp'));
        if (isPng) {
          if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); copyCleanImage(lastData.src); }
          if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); copyBorderCode(); }
          if (e.ctrlKey && (e.key === 'x' || e.key === 'X')) { e.preventDefault(); copySilhouette(lastData); }
        }
      }
    }, true);
    document.addEventListener('keyup', (e) => { if (isPicking) return; if (adv.freeze && e.key === 'Shift' && adv.freezeMode === 'HOLD' && isFrozen) { isFrozen = false; const el = document.elementFromPoint(mouseX, mouseY); if (el !== activeImg && !activeImg?.contains(el)) endHover(); else if (lastData) updateTooltip(lastData); } }, true);
    function showHUD(txt) { let h = document.getElementById('__II_HUD__'); if (!h) { h = document.createElement('div'); h.id = '__II_HUD__'; Object.assign(h.style, { position: 'fixed', top: '24px', right: '24px', zIndex: '2147483647', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontFamily: "'Segoe UI', sans-serif", fontWeight: '600', pointerEvents: 'none', opacity: '0', transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transform: 'translateY(-10px)' }); document.documentElement.appendChild(h); } h.textContent = txt; h.style.opacity = '1'; h.style.transform = 'translateY(0)'; clearTimeout(h.t); h.t = setTimeout(() => { if (h) { h.style.opacity = '0'; h.style.transform = 'translateY(-10px)'; } }, 2000); }
    
    async function copyCleanImage(url) {
      showToast(t('analyzing') + '...');
      chrome.runtime.sendMessage({ type: 'FETCH_IMAGE', url: url }, async (res) => {
        if (res && res.dataUrl) {
          try {
            const blob = await (await fetch(res.dataUrl)).blob();
            try {
              // Intento 1: Copiado directo del blob
              await navigator.clipboard.write([ new ClipboardItem({ [blob.type]: blob }) ]);
              showToast(t('copied_clean'));
            } catch (err) {
              // Intento 2: Conversión a PNG vía Canvas (más compatible)
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(async (pngBlob) => {
                  try {
                    await navigator.clipboard.write([ new ClipboardItem({ 'image/png': pngBlob }) ]);
                    showToast(t('copied_clean'));
                  } catch (e2) { showToast('Clipboard Error', '#cc3333'); }
                }, 'image/png');
              };
              img.src = res.dataUrl;
            }
          } catch (e) { showToast('Error processing image', '#cc3333'); }
        } else { showToast('Error: ' + (res?.error || 'Fetch fail'), '#cc3333'); }
      });
    }
    function copyBorderCode() {
      const svg = document.getElementById('__II_SVG_FILTERS__').innerHTML;
      const css = `/* CSS */\n.smart-border {\n  filter: url(#__ii_outline) drop-shadow(0 0 10px ${theme.accent});\n}`;
      navigator.clipboard.writeText(svg + "\n\n" + css).then(() => showToast(t('copied_code')));
    }
    function copySilhouette(d) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d.naturalW}" height="${d.naturalH}">\n  <filter id="silhouette">\n    <feComponentTransfer in="SourceAlpha"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>\n    <feFlood flood-color="black" result="COLOR"/><feComposite in="COLOR" in2="SourceAlpha" operator="in" />\n  </filter>\n  <image href="${d.src}" width="100%" height="100%" filter="url(#silhouette)"/>\n</svg>`;
      navigator.clipboard.writeText(svg).then(() => showToast(t('copied_silhouette')));
    }
    function checkInitial() { if (!enabled || isBlacklisted() || isFrozen || forceFrozen || isPicking) return; const el = document.elementFromPoint(mouseX, mouseY); const imgData = getValidImage(mouseX, mouseY, el); if (imgData) startHover(imgData); }
    loadState();
  })();
}
