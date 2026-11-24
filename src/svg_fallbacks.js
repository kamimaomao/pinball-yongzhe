// SVG 过渡矢量图形层（遵循「不新增外部栅格资产、不保留原项目资产、缺失处用 SVG 过渡」原则）
// 仅用于《闯关勇者》解包图集中无 1:1 现成切图的弹珠机制指示件：
// 1. 五大元素克制纹章（赤焰 / 寒霜 / 森毒 / 圣耀 / 暗影）
// 2. 弹珠移动类型印章（反射「弹」 / 贯通「贯」）
// 3. 首领旋转弱点准星（3倍暴击靶心）
// 4. 顶栏音量开关矢量图标与拉弓蓄力弦刻度

function toSvgDataUri(svgMarkup) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup.trim())}`;
}

export const ELEMENT_SVG_MARKUP = {
  fire: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#9e2418" stroke="#ffd479" stroke-width="2.4"/>
    <path d="M18 6C21 11 26 13.5 25.5 20.5C25 26 21.5 29.5 18 29.5C14.2 29.5 10.5 26.2 10.5 21C10.5 16.8 13.2 14.2 14.5 11.5C14.8 14.2 16.3 15 16.8 15C16.2 11.8 16.5 8.5 18 6Z" fill="#ff7a3d" stroke="#24100a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M18 15.5C19.8 17.8 21.2 19.6 20.8 23C20.5 25.5 19.2 27 18 27C16.6 27 15.2 25.5 15.2 23.2C15.2 20.6 16.6 18.2 18 15.5Z" fill="#ffe680"/>
  </svg>`,
  water: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#144d7a" stroke="#9be4ff" stroke-width="2.4"/>
    <path d="M18 6.5L21 14.5L29 18L21 21.5L18 29.5L15 21.5L7 18L15 14.5Z" fill="#5fd0ff" stroke="#0d2238" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="18" cy="18" r="3.6" fill="#eaffff"/>
  </svg>`,
  wood: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#185a37" stroke="#9cf5b5" stroke-width="2.4"/>
    <path d="M26.5 9.5C26.5 19.5 21.5 26.5 12 27C11.5 17.5 16.8 10.5 26.5 9.5Z" fill="#4cd97b" stroke="#0e2919" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M11 27.5C15.5 22.5 19.5 18.2 24.5 12" stroke="#d8ffe4" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  gold: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#7a4c0c" stroke="#fff0a6" stroke-width="2.4"/>
    <polygon points="18,6 22,13.8 30.5,14.8 24.2,20.8 25.8,29.2 18,25 10.2,29.2 11.8,20.8 5.5,14.8 14,13.8" fill="#ffd23f" stroke="#2b1706" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#3f1c6b" stroke="#deb8ff" stroke-width="2.4"/>
    <path d="M22.8 8.5C17.2 9.2 13 13.8 13 19.5C13 24.2 16 28 20.5 29.2C14.2 29.8 8.8 25 8.8 18.5C8.8 12.2 13.8 7.2 20.2 7.2C21.1 7.2 22 7.6 22.8 8.5Z" fill="#c07aff" stroke="#1b0933" stroke-width="1.4"/>
    <circle cx="23.5" cy="15.5" r="3.2" fill="#ffe999"/>
  </svg>`,
};

export const MOVE_TYPE_SVG_MARKUP = {
  reflect: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14.5" fill="#c93b2b" stroke="#24100a" stroke-width="2.4"/>
    <path d="M8 21L15 11L23 19" fill="none" stroke="#fff6df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="24.5,21.5 24,14.5 17.5,20.5" fill="#ffd966"/>
  </svg>`,
  pierce: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14.5" fill="#1e8c6e" stroke="#24100a" stroke-width="2.4"/>
    <line x1="7" y1="24" x2="23" y2="8" stroke="#fff6df" stroke-width="3.2" stroke-linecap="round"/>
    <polygon points="25.5,6.5 23.5,14.5 17.5,8.5" fill="#9effdf"/>
  </svg>`,
};

export const WEAKPOINT_RETICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">
  <circle cx="22" cy="22" r="16" fill="rgba(255,214,64,0.25)" stroke="#ffd84d" stroke-width="2.8" stroke-dasharray="5 3"/>
  <polygon points="22,4 26,16 38,22 26,28 22,40 18,28 6,22 18,16" fill="#ffdf59" stroke="#2b1208" stroke-width="2"/>
  <circle cx="22" cy="22" r="5.2" fill="#d92b1e" stroke="#fff7d6" stroke-width="1.8"/>
</svg>`;

export const AUDIO_ICON_SVG = {
  on: `<svg class="svg-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5H8.2L13.5 5V19L8.2 14.5H4V9.5Z" fill="#ffe7a3" stroke="#24100a" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M16.5 8.5C18.2 10.2 18.2 13.8 16.5 15.5M19.2 6C22 8.8 22 15.2 19.2 18" fill="none" stroke="#ffd24d" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  off: `<svg class="svg-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5H8.2L13.5 5V19L8.2 14.5H4V9.5Z" fill="#a8998c" stroke="#24100a" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M16.5 9L21.5 15M21.5 9L16.5 15" fill="none" stroke="#ff6b5e" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`,
};

export const ELEMENT_SVG_URIS = {
  fire: toSvgDataUri(ELEMENT_SVG_MARKUP.fire),
  water: toSvgDataUri(ELEMENT_SVG_MARKUP.water),
  wood: toSvgDataUri(ELEMENT_SVG_MARKUP.wood),
  gold: toSvgDataUri(ELEMENT_SVG_MARKUP.gold),
  star: toSvgDataUri(ELEMENT_SVG_MARKUP.star),
};

export const MOVE_TYPE_SVG_URIS = {
  reflect: toSvgDataUri(MOVE_TYPE_SVG_MARKUP.reflect),
  pierce: toSvgDataUri(MOVE_TYPE_SVG_MARKUP.pierce),
};

export const WEAKPOINT_RETICLE_URI = toSvgDataUri(WEAKPOINT_RETICLE_SVG);
