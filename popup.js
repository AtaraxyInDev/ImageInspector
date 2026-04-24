// Image Inspector — Popup v8 (Beta Labels & Domain Field)
const tog         = document.getElementById('tog');
const dot         = document.getElementById('dot');
const statusTxt   = document.getElementById('statusTxt');
const toggleCard  = document.getElementById('toggleCard');
const accentColor = document.getElementById('accentColor');
const bgColor     = document.getElementById('bgColor');
const btnGoSettings   = document.getElementById('btnGoSettings');
const btnBack         = document.getElementById('btnBack');
const btnTheme        = document.getElementById('btnTheme');
const btnMagicPalette = document.getElementById('btnMagicPalette');
const panelsWrapper   = document.getElementById('panelsWrapper');

// --- BASE DE DATOS COLOR HUNT (53 Paletas Reales) ---
const COLORHUNT_PALETTES = [
  ["#9ab17a", "#c3cc9b", "#e4dfb5", "#fbe8ce"], ["#f9b2d7", "#cfecf3", "#daf9de", "#f6ffdc"],
  ["#546b41", "#99ad7a", "#dcccac", "#fff8ec"], ["#346739", "#79ae6f", "#9fcb98", "#f2edc2"],
  ["#f13e93", "#f891bb", "#f9d0cd", "#faffcb"], ["#021a54", "#ff85bb", "#ffcee3", "#f5f5f5"],
  ["#6e1a37", "#ae2448", "#72baa9", "#d5e7b5"], ["#ff9a86", "#ffb399", "#ffd6a6", "#fff0be"],
  ["#e87f24", "#ffc81e", "#fefddf", "#73a5ca"], ["#1f6f5f", "#2fa084", "#6fcf97", "#eeeeee"],
  ["#ffedce", "#ffc193", "#ff8383", "#ff3737"], ["#c0e1d2", "#e5eee4", "#f6f4e8", "#dc9b9b"],
  ["#e8edf2", "#2c3947", "#547a95", "#c2a56d"], ["#427ab5", "#406aaf", "#f7dd7d", "#ffe8be"],
  ["#aaffc7", "#67c090", "#215b63", "#124170"], ["#170c79", "#efe3ca", "#56b6c6", "#8acbd0"],
  ["#35858e", "#7da78c", "#c2d099", "#e6eec9"], ["#1e104e", "#452e5a", "#ff653f", "#ffc85c"],
  ["#2f2fe4", "#162e93", "#1a1953", "#080616"], ["#091413", "#285a48", "#408a71", "#b0e4cc"],
  ["#0d1a63", "#1a2ca3", "#2845d6", "#f68048"], ["#280905", "#740a03", "#c3110c", "#e6501b"],
  ["#000080", "#ff0000", "#9e2a3a", "#3a2525"], ["#1b211a", "#628141", "#8bae66", "#ebd5ab"],
  ["#bf092f", "#132440", "#16476a", "#3b9797"], ["#f25912", "#5c3e94", "#412b6b", "#211832"],
  ["#432323", "#2f5755", "#5a9690", "#e0d9d9"], ["#1b3c53", "#234c6a", "#456882", "#d2c1b6"],
  ["#37353e", "#44444e", "#715a5a", "#d3dad9"], ["#0d1164", "#640d5f", "#ea2264", "#f78d60"],
  ["#17153b", "#2e236c", "#433d8b", "#c8acd6"], ["#402e7a", "#4c3bcf", "#4b70f5", "#3dc2ec"],
  ["#240750", "#344c64", "#577b8d", "#57a6a1"], ["#32012f", "#524c42", "#e2dfd0", "#f97300"],
  ["#49243e", "#704264", "#bb8493", "#dbafa0"], ["#0c0c0c", "#481e14", "#9b3922", "#f2613f"],
  ["#ff204e", "#a0153e", "#5d0e41", "#00224d"], ["#430a5d", "#5f374b", "#8c6a5d", "#eee4b1"],
  ["#222831", "#31363f", "#76abae", "#eeeeee"], ["#35374b", "#344955", "#50727b", "#78a083"],
  ["#070f2b", "#1b1a55", "#535c91", "#9290c3"], ["#e19898", "#a2678a", "#4d3c77", "#3f1d38"],
  ["#35155d", "#512b81", "#4477ce", "#8cabff"], ["#331d2c", "#3f2e3e", "#a78295", "#efe1d1"],
  ["#2d4356", "#435b66", "#a76f6f", "#eab2a0"], ["#0e2954", "#1f6e8c", "#2e8a99", "#84a7a1"],
  ["#116d6e", "#321e1e", "#4e3636", "#cd1818"], ["#27374d", "#526d82", "#9db2bf", "#dde6ed"],
  ["#0c134f", "#1d267d", "#5c469c", "#d4adfc"], ["#5f264a", "#643a6b", "#957777", "#b0a4a4"],
  ["#070a52", "#d21312", "#ed2b2a", "#f15a59"], ["#393646", "#4f4557", "#6d5d6e", "#f4eee0"],
  ["#0b2447", "#19376d", "#576cbc", "#a5d7e8"]
];
const btnAddCurrent   = document.getElementById('btnAddCurrent');
const blContainer     = document.getElementById('blacklistContainer');
const switchLabel     = document.getElementById('switchLabel');

const checkPalette    = document.getElementById('checkPalette');
const checkSearch     = document.getElementById('checkSearch');
const checkEye        = document.getElementById('checkEye');
const checkOpen       = document.getElementById('checkOpen');
const checkUrl        = document.getElementById('checkUrl');
const checkFreeze     = document.getElementById('checkFreeze');
const colorFormat     = document.getElementById('colorFormat');
const colorCount      = document.getElementById('colorCount');
const freezeMode      = document.getElementById('freezeMode');
const langSelect      = document.getElementById('langSelect');
const checkSmartBorder = document.getElementById('checkSmartBorder');
const detailsAdv      = document.getElementById('detailsAdv');
const detailsMeta     = document.getElementById('detailsMeta');

// Metadata Checkboxes
const checkMetaDomain     = document.getElementById('checkMetaDomain');
const checkMetaRatio      = document.getElementById('checkMetaRatio');
const checkMetaDate       = document.getElementById('checkMetaDate');
const checkMetaCamera     = document.getElementById('checkMetaCamera');
const checkMetaGPS        = document.getElementById('checkMetaGPS');
const checkMetaAperture   = document.getElementById('checkMetaAperture');
const checkMetaCreator    = document.getElementById('checkMetaCreator');
const checkMetaCopyright  = document.getElementById('checkMetaCopyright');
const checkMetaOrientation= document.getElementById('checkMetaOrientation');
const checkMetaSoftware   = document.getElementById('checkMetaSoftware');
const checkMetaTitle      = document.getElementById('checkMetaTitle');
const checkMetaProfile    = document.getElementById('checkMetaProfile');

let blacklist = [];
let popupTheme = 'dark';

// ── LOCALIZATION ──────────────────────────────────────────────────────────
const MESSAGES = {
  es: { 
    titleApp: 'Image Inspector', subTitle: 'Configuración v4.5', txtStatusOn: 'Inspector Activo', txtStatusOff: 'Inspector Desactivado',
    txtShortcut: 'Activar/Desactivar inspector', txtAdv: 'Ajustes y funciones avanzadas', txtAccent: 'Color de acento', txtBgPanel: 'Fondo del panel',
    txtPalette: 'Paleta de colores', txtFormat: 'Formato de copiado', txtSamples: 'Muestras (1-50)', txtSearch: 'Búsqueda inversa (Lens)',
    txtEye: 'Cuentagotas (EyeDropper)', txtOpen: 'Abrir origen de imagen', txtUrl: 'Copiar URL de imagen', txtFreeze: 'Modo Congelar (Shift)',
    txtAction: 'Acción de Shift', optHold: 'Mantener presionado', optToggle: 'Pulsar una vez (Toggle)', txtInterface: 'Idioma (Interface)',
    optAuto: 'Automático', txtBlacklistTitle: 'Lista Negra', txtBlacklistDesc: 'Los sitios en esta lista se iniciarán con la extensión en OFF automáticamente.',
    txtSmartBorder: 'Borde Inteligente (PNGs)',
    btnAddCurrent: 'Añadir sitio actual', txtFooter: 'By AtaraxInDev | Todos los derechos reservados © 2026',
    txtMetaTitle: 'Visualización de Metadatos', 
    lblMetaDomain: 'Dominio de origen', lblMetaRatio: 'Relación de aspecto', lblMetaDate: 'Fecha y hora (BETA)', lblMetaCamera: 'Cámara (BETA)', lblMetaGPS: 'Coordenadas GPS (BETA)',
    lblMetaAperture: 'Apertura (BETA)', lblMetaCreator: 'Autor (BETA)', lblMetaCopyright: 'Copyright (BETA)', lblMetaOrientation: 'Orientación (BETA)',
    lblMetaSoftware: 'Software (BETA)', lblMetaTitle: 'Título (BETA)', lblMetaProfile: 'Perfil color (BETA)'
  },
  en: { 
    titleApp: 'Image Inspector', subTitle: 'Configuration v4.5', txtStatusOn: 'Inspector Active', txtStatusOff: 'Inspector Disabled',
    txtShortcut: 'Enable/Disable inspector', txtAdv: 'Advanced settings & features', txtAccent: 'Accent color', txtBgPanel: 'Panel background',
    txtPalette: 'Color palette', txtFormat: 'Copy format', txtSamples: 'Samples (1-50)', txtSearch: 'Reverse search (Lens)',
    txtEye: 'EyeDropper', txtOpen: 'Open image source', txtUrl: 'Copy image URL', txtFreeze: 'Freeze Mode (Shift)',
    txtAction: 'Shift action', optHold: 'Hold to freeze', optToggle: 'Press once (Toggle)', txtInterface: 'Interface Language',
    optAuto: 'Automatic', txtBlacklistTitle: 'Blacklist', txtBlacklistDesc: 'Sites on this list will automatically start with the extension OFF.',
    txtSmartBorder: 'Smart Border (PNGs)',
    btnAddCurrent: 'Add current site', txtFooter: 'By AtaraxInDev | All rights reserved © 2026',
    txtMetaTitle: 'Metadata Display',
    lblMetaDomain: 'Source Domain', lblMetaRatio: 'Aspect Ratio', lblMetaDate: 'Date and Time (BETA)', lblMetaCamera: 'Camera (BETA)', lblMetaGPS: 'GPS Coordinates (BETA)',
    lblMetaAperture: 'Aperture (BETA)', lblMetaCreator: 'Author (BETA)', lblMetaCopyright: 'Copyright (BETA)', lblMetaOrientation: 'Orientation (BETA)',
    lblMetaSoftware: 'Software (BETA)', lblMetaTitle: 'Title (BETA)', lblMetaProfile: 'Color Profile (BETA)'
  },
  ru: { 
    titleApp: 'Image Inspector', subTitle: 'Настройки v4.5', txtStatusOn: 'Инспектор активен', txtStatusOff: 'Инспектор выключен',
    txtShortcut: 'Вкл/Выкл инспектор', txtAdv: 'Дополнительные функции', txtAccent: 'Цвет акцента', txtBgPanel: 'Фон панели',
    txtPalette: 'Палитра цветов', txtFormat: 'Формат копирования', txtSamples: 'Образцы (1-50)', txtSearch: 'Поиск по картинке (Lens)',
    txtEye: 'Пипетка', txtOpen: 'Открыть оригинал', txtUrl: 'Копировать URL', txtFreeze: 'Заморозка (Shift)',
    txtAction: 'Действие Shift', optHold: 'Удерживать', optToggle: 'Нажать один раз', txtInterface: 'Язык интерфейса',
    optAuto: 'Автоматически', txtBlacklistTitle: 'Черный список', txtBlacklistDesc: 'Сайты в этом списке будут запускаться с выключенным расширением.',
    btnAddCurrent: 'Добавить текущий сайт', txtFooter: 'By AtaraxInDev | Все права защищены © 2026',
    txtMetaTitle: 'Отображение метаданных',
    lblMetaDomain: 'Домен источника', lblMetaRatio: 'Соотношение сторон', lblMetaDate: 'Дата и время (BETA)', lblMetaCamera: 'Камера (BETA)', lblMetaGPS: 'Координаты GPS (BETA)',
    lblMetaAperture: 'Диафрагма (BETA)', lblMetaCreator: 'Автор (BETA)', lblMetaCopyright: 'Авторское право (BETA)', lblMetaOrientation: 'Ориентация (BETA)',
    lblMetaSoftware: 'ПО (BETA)', lblMetaTitle: 'Заголовок (BETA)', lblMetaProfile: 'Профиль (BETA)'
  },
  pt: { 
    titleApp: 'Image Inspector', subTitle: 'Configuração v4.5', txtStatusOn: 'Inspetor Ativo', txtStatusOff: 'Inspetor Desactivado',
    txtShortcut: 'Ativar/Desativar inspetor', txtAdv: 'Ajustes e funciones avanzadas', txtAccent: 'Cor de destaque', txtBgPanel: 'Fundo do painel',
    txtPalette: 'Paleta de cores', txtFormat: 'Formato de cópia', txtSamples: 'Amostras (1-50)', txtSearch: 'Busca reversa (Lens)',
    txtEye: 'Conta-gotas', txtOpen: 'Abrir origem da imagem', txtUrl: 'Copiar URL da imagem', txtFreeze: 'Modo Congelar (Shift)',
    txtAction: 'Ação do Shift', optHold: 'Manter pressionado', optToggle: 'Pressionar una vez', txtInterface: 'Idioma da Interface',
    optAuto: 'Automático', txtBlacklistTitle: 'Lista Negra', txtBlacklistDesc: 'Sites nesta lista iniciarão com a extensión em OFF automáticamente.',
    btnAddCurrent: 'Adicionar site actual', txtFooter: 'By AtaraxInDev | Todos os derechos reservados © 2026',
    txtMetaTitle: 'Exibição de Metadados',
    lblMetaDomain: 'Domínio de origem', lblMetaRatio: 'Proporção', lblMetaDate: 'Data e hora (BETA)', lblMetaCamera: 'Câmera (BETA)', lblMetaGPS: 'Coordenadas GPS (BETA)',
    lblMetaAperture: 'Abertura (BETA)', lblMetaCreator: 'Autor (BETA)', lblMetaCopyright: 'Copyright (BETA)', lblMetaOrientation: 'Orientação (BETA)',
    lblMetaSoftware: 'Software (BETA)', lblMetaTitle: 'Título (BETA)', lblMetaProfile: 'Perfil cor (BETA)'
  },
  ja: { 
    titleApp: 'Image Inspector', subTitle: '設定 v4.5', txtStatusOn: 'インスペクター有効', txtStatusOff: 'インスペクター無効',
    txtShortcut: '有効/無効の切り替え', txtAdv: '詳細設定と機能', txtAccent: 'アクセントカラー', txtBgPanel: 'パネルの背景',
    txtPalette: 'カラーパレット', txtFormat: 'コピー形式', txtSamples: 'サンプル数 (1-50)', txtSearch: '画像検索 (Lens)',
    txtEye: 'スポイト', txtOpen: '画像ソースを開く', txtUrl: '画像URLをコピー', txtFreeze: 'フリーズモード (Shift)',
    txtAction: 'Shiftキーの動作', optHold: '長押し', optToggle: '一度押す (トグル)', txtInterface: 'インターフェース言語',
    optAuto: '自動', txtBlacklistTitle: 'ブラックリスト', txtBlacklistDesc: 'このリストにあるサイトでは、拡張機能が自動的にOFFになります。',
    btnAddCurrent: '現在のサイトを追加', txtFooter: 'By AtaraxInDev | 無断複写・転載を禁じます © 2026',
    txtMetaTitle: 'メタデータの表示',
    lblMetaDomain: 'ソースドメイン', lblMetaRatio: 'アスペクト比', lblMetaDate: '日時 (BETA)', lblMetaCamera: 'カメラ (BETA)', lblMetaGPS: 'GPS座標 (BETA)',
    lblMetaAperture: '絞り (BETA)', lblMetaCreator: '作者 (BETA)', lblMetaCopyright: '著作権 (BETA)', lblMetaOrientation: '方向 (BETA)',
    lblMetaSoftware: 'ソフト (BETA)', lblMetaTitle: 'タイトル (BETA)', lblMetaProfile: 'プロファイル (BETA)'
  },
  zh: { 
    titleApp: 'Image Inspector', subTitle: '设置 v4.5', txtStatusOn: '检查员已启用', txtStatusOff: '检查员已禁用',
    txtShortcut: '启用/禁用检查员', txtAdv: '高级设置与功能', txtAccent: '强调色', txtBgPanel: '面板背景',
    txtPalette: '调色板', txtFormat: '复制格式', txtSamples: '样本数 (1-50)', txtSearch: '以图搜图 (Lens)',
    txtEye: '吸管', txtOpen: '打开图片来源', txtUrl: '复制图片链接', txtFreeze: '冻结模式 (Shift)',
    txtAction: 'Shift 键操作', optHold: '按住', optToggle: '按一次 (切换)', txtInterface: '界面语言',
    optAuto: '自动', txtBlacklistTitle: '黑名单', txtBlacklistDesc: '此列表中的网站将自动以 OFF 状态启动。',
    btnAddCurrent: '添加当前网站', txtFooter: 'By AtaraxInDev | 版权所有 © 2026',
    txtMetaTitle: '元数据显示',
    lblMetaDomain: '来源域名', lblMetaRatio: '比例', lblMetaDate: '时间 (BETA)', lblMetaCamera: '相机 (BETA)', lblMetaGPS: 'GPS (BETA)',
    lblMetaAperture: '光圈 (BETA)', lblMetaCreator: '作者 (BETA)', lblMetaCopyright: '版权 (BETA)', lblMetaOrientation: '方向 (BETA)',
    lblMetaSoftware: '软件 (BETA)', lblMetaTitle: '标题 (BETA)', lblMetaProfile: '配置 (BETA)'
  }
};

function getLang(pref) { 
  if (pref && pref !== 'auto') return pref;
  const l = navigator.language.split('-')[0]; 
  return MESSAGES[l] ? l : 'en'; 
}

function updateLanguage(pref) {
  const lang = getLang(pref);
  const msgs = MESSAGES[lang];
  for (const id in msgs) {
    const el = document.getElementById(id);
    if (el) el.textContent = msgs[id];
  }
  setUI(tog.checked);
}

// ── INIT ──────────────────────────────────────────────────────────────────
chrome.storage.local.get({
  enabled: true,
  popupTheme: 'dark',
  theme: { accent: '#c03962', bg: '#1c1a17' },
  blacklist: ['youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'twitter.com', 'x.com'],
  adv: { palette: true, search: true, eye: true, open: true, url: true, freeze: true, smartBorder: true, colorFormat: 'HEX', colorCount: 3, freezeMode: 'HOLD', lang: 'auto' },
  meta: { domain: true, ratio: true, date: false, camera: false, gps: false, aperture: false, creator: false, copyright: false, orientation: false, software: false, title: false, profile: false }
}, (res) => {
  tog.checked = res.enabled;
  popupTheme = res.popupTheme || 'dark';
  applyPopupTheme(popupTheme);
  applyAccentColor(res.theme.accent);
  accentColor.value = res.theme.accent;
  bgColor.value = res.theme.bg;
  blacklist = res.blacklist;
  checkPalette.checked = res.adv.palette;
  checkSearch.checked = res.adv.search;
  checkEye.checked = res.adv.eye ?? true;
  checkOpen.checked = res.adv.open ?? true;
  checkUrl.checked = res.adv.url ?? true;
  checkFreeze.checked = res.adv.freeze;
  colorFormat.value = res.adv.colorFormat || 'HEX';
  colorCount.value = res.adv.colorCount || 3;
  freezeMode.value = res.adv.freezeMode || 'HOLD';
  langSelect.value = res.adv.lang || 'auto';
  checkSmartBorder.checked = res.adv.smartBorder ?? true;
  
  // Meta Res (Defaults applied if first time)
  checkMetaDomain.checked = res.meta.domain ?? true;
  checkMetaRatio.checked = res.meta.ratio ?? true;
  checkMetaDate.checked = res.meta.date ?? false;
  checkMetaCamera.checked = res.meta.camera ?? false;
  checkMetaGPS.checked = res.meta.gps ?? false;
  checkMetaAperture.checked = res.meta.aperture ?? false;
  checkMetaCreator.checked = res.meta.creator ?? false;
  checkMetaCopyright.checked = res.meta.copyright ?? false;
  checkMetaOrientation.checked = res.meta.orientation ?? false;
  checkMetaSoftware.checked = res.meta.software ?? false;
  checkMetaTitle.checked = res.meta.title ?? false;
  checkMetaProfile.checked = res.meta.profile ?? false;

  updateLanguage(res.adv.lang);
  renderBlacklist();
  forcePopupResize();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) { tog.checked = changes.enabled.newValue; setUI(changes.enabled.newValue); }
  if (changes.blacklist) { blacklist = changes.blacklist.newValue; renderBlacklist(); }
});

function setUI(on) {
  const lang = getLang(langSelect.value);
  statusTxt.textContent = on ? MESSAGES[lang].txtStatusOn : MESSAGES[lang].txtStatusOff;
  dot.className = 'status-dot' + (on ? ' on' : '');
  toggleCard.className = 'toggle-card' + (on ? ' on' : '');
}

function applyPopupTheme(theme) {
  document.body.className = theme === 'light' ? 'light-theme' : '';
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
}

function generateMagicPalette() {
  const p = COLORHUNT_PALETTES[Math.floor(Math.random() * COLORHUNT_PALETTES.length)];
  
  // Mapeo inteligente estilo Color Hunt:
  // p[0] suele ser el más oscuro/base, p[3] el más claro/acento (o viceversa)
  
  // Calculamos luminancia básica para saber si la paleta es "Dark" o "Light"
  const isDarkPalette = (hexToL(p[0]) < 128); 

  let hexAccent, hexBg;

  if (isDarkPalette) {
    hexBg = p[0];     // Color base oscuro
    hexAccent = p[3]; // Color de acento claro/brillante
    popupTheme = 'dark';
  } else {
    hexBg = p[3];     // Color base claro
    hexAccent = p[0]; // Color de acento oscuro/fuerte
    popupTheme = 'light';
  }

  accentColor.value = hexAccent;
  bgColor.value = hexBg;
  
  applyAccentColor(hexAccent);
  applyPopupTheme(popupTheme);
  
  chrome.storage.local.set({ popupTheme, accent: hexAccent, bg: hexBg });
  updateTheme();
}

function hexToL(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b; // Luminosidad relativa
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

btnMagicPalette.addEventListener('click', generateMagicPalette);

btnGoSettings.addEventListener('click', () => { panelsWrapper.style.transform = 'translateX(-253px)'; forcePopupResize(); });
btnBack.addEventListener('click', () => { panelsWrapper.style.transform = 'translateX(0)'; forcePopupResize(); });

// ── RESIZE ENGINE ────────────────────────────────────────────────────────
function forcePopupResize() {
  document.body.style.height = 'auto';
  const h = document.body.scrollHeight;
  document.body.style.height = h + 'px';
  document.documentElement.style.height = h + 'px';
}

const observer = new MutationObserver((mutations) => {
  const isResizeMutation = mutations.some(m => m.attributeName === 'style' && (m.target === document.body || m.target === document.documentElement));
  if (!isResizeMutation) forcePopupResize();
});
observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class'] });

// Animación manual para los menús desplegables (Accordion)
function setupAccordion(details) {
  const summary = details.querySelector('summary');
  const content = details.querySelector('.custom-card');
  let animation = null;
  let isClosing = false;
  let isExpanding = false;

  summary.addEventListener('click', (e) => {
    e.preventDefault();
    details.style.overflow = 'hidden';
    if (isClosing || !details.open) {
      open();
    } else if (isExpanding || details.open) {
      shrink();
    }
  });

  function shrink() {
    isClosing = true;
    const startHeight = details.offsetHeight;
    const endHeight = summary.offsetHeight;
    if (animation) animation.cancel();
    animation = details.animate({ height: [`${startHeight}px`, `${endHeight}px`] }, { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    animation.onfinish = () => onAnimationFinish(false);
  }

  function open() {
    details.style.height = `${details.offsetHeight}px`;
    details.open = true;
    window.requestAnimationFrame(() => expand());
  }

  function expand() {
    isExpanding = true;
    const startHeight = details.offsetHeight;
    const endHeight = summary.offsetHeight + content.offsetHeight + 10;
    if (animation) animation.cancel();
    animation = details.animate({ height: [`${startHeight}px`, `${endHeight}px`] }, { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    animation.onfinish = () => onAnimationFinish(true);
  }

  function onAnimationFinish(open) {
    details.open = open;
    animation = null;
    isClosing = false;
    isExpanding = false;
    details.style.height = details.style.overflow = '';
    document.body.classList.remove('animating-menu');
    forcePopupResize();
  }
}

[detailsAdv, detailsMeta].forEach(setupAccordion);

// Al iniciar animación, avisar al body para efectos de UI
[detailsAdv, detailsMeta].forEach(d => {
  d.querySelector('summary').addEventListener('click', () => {
    document.body.classList.add('animating-menu');
  });
});

// Seguimiento constante del tamaño del popup durante cualquier animación de CSS
setInterval(forcePopupResize, 100);

btnTheme.addEventListener('click', (e) => {
  const toggle = () => {
    popupTheme = popupTheme === 'dark' ? 'light' : 'dark';
    applyPopupTheme(popupTheme);
    chrome.storage.local.set({ popupTheme });
    forcePopupResize();
  };

  if (!document.startViewTransition) {
    toggle();
    return;
  }

  const rect = btnTheme.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(toggle);

  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
      {
        duration: 450,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  });
});

tog.addEventListener('change', () => { const enabled = tog.checked; chrome.storage.local.set({ enabled }); setUI(enabled); forcePopupResize(); });
toggleCard.addEventListener('click', (e) => { if (e.target.closest('.switch')) return; const enabled = !tog.checked; tog.checked = enabled; chrome.storage.local.set({ enabled }); setUI(enabled); forcePopupResize(); });
switchLabel.addEventListener('click', e => e.stopPropagation());

accentColor.addEventListener('input', updateTheme);
bgColor.addEventListener('input', updateTheme);

function updateTheme() { 
  const color = accentColor.value;
  applyAccentColor(color);
  chrome.storage.local.set({ theme: { accent: color, bg: bgColor.value } }); 
}
function updateAdv() {
  const pref = langSelect.value;
  chrome.storage.local.set({ 
    adv: { palette: checkPalette.checked, search: checkSearch.checked, eye: checkEye.checked, open: checkOpen.checked, url: checkUrl.checked, freeze: checkFreeze.checked, smartBorder: checkSmartBorder.checked, colorFormat: colorFormat.value, colorCount: parseInt(colorCount.value, 10) || 3, freezeMode: freezeMode.value, lang: pref },
    meta: {
      domain: checkMetaDomain.checked, ratio: checkMetaRatio.checked, date: checkMetaDate.checked, camera: checkMetaCamera.checked, gps: checkMetaGPS.checked, 
      aperture: checkMetaAperture.checked, creator: checkMetaCreator.checked, copyright: checkMetaCopyright.checked, 
      orientation: checkMetaOrientation.checked, software: checkMetaSoftware.checked, title: checkMetaTitle.checked, profile: checkMetaProfile.checked
    }
  });
  updateLanguage(pref);
  forcePopupResize();
}
[checkPalette, checkSearch, checkEye, checkOpen, checkUrl, checkFreeze, checkSmartBorder, colorFormat, colorCount, freezeMode, langSelect,
 checkMetaDomain, checkMetaRatio, checkMetaDate, checkMetaCamera, checkMetaGPS, checkMetaAperture, checkMetaCreator, checkMetaCopyright,
 checkMetaOrientation, checkMetaSoftware, checkMetaTitle, checkMetaProfile].forEach(el => { el.addEventListener('change', updateAdv); });

btnAddCurrent.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try { const url = new URL(tabs[0].url); const domain = url.hostname; if (!blacklist.includes(domain)) { blacklist.push(domain); chrome.storage.local.set({ blacklist }); renderBlacklist(); forcePopupResize(); } } catch(e) {}
  });
});

function renderBlacklist() {
  blContainer.innerHTML = '';
  blacklist.forEach((domain, idx) => {
    const item = document.createElement('div');
    item.className = 'bl-item';
    item.innerHTML = `<span>${domain}</span><button class="btn-del" data-idx="${idx}">×</button>`;
    blContainer.appendChild(item);
  });
  blContainer.querySelectorAll('.btn-del').forEach(btn => { btn.onclick = () => { blacklist.splice(btn.dataset.idx, 1); chrome.storage.local.set({ blacklist }); renderBlacklist(); forcePopupResize(); }; });
}
