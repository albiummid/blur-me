const DEFAULT_SELECTORS = {
  images: ['img', 'picture', '[role="img"]', '[data-bg-image]', '[style*="background-image"]', 'svg'],
  videos: ['video', 'iframe[src*="youtube"]', 'iframe[src*="vimeo"]', 'iframe[src*="player"]', '[role="video"]'],
  text: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span:not(.blur-me)', 'li', 'td', 'th', 'label'],
  profile: ['[class*="avatar"]', '[class*="profile"]', '[data-testid*="avatar"]', '[aria-label*="avatar"]', 'img[alt*="profile"]', 'img[alt*="Profile"]', 'img[alt*="user"]', 'img[alt*="User"]', '[data-pagelet*="avatar"]'],
  comments: ['[class*="comment"]', '[data-testid*="comment"]', '[aria-label*="comment"]', '[data-pagelet*="Comment"]'],
  messages: ['[class*="message"]', '[data-testid*="message"]', '[role="log"]', '[data-testid="message-text"]'],
  forms: ['input:not([type="hidden"]):not([type="submit"])', 'textarea', 'select'],
  buttons: ['button', '[role="button"]', 'a.btn', '[class*="button"]'],
  custom: []
};

let settings = null;
let currentUrl = '';
let processedElements = new WeakSet();
let observer = null;
let pickerMode = false;
let pickerTarget = null;
let pickerCallback = null;

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function getBlurStyle(itemSettings) {
  const level = itemSettings?.level || 5;
  const type = itemSettings?.type || 'gaussian';
  
  switch (type) {
    case 'pixelate':
      return `filter: blur(0); image-rendering: pixelated;`;
    case 'frosted':
      return `backdrop-filter: blur(${level}px); background: rgba(255,255,255,0.1);`;
    case 'blackout':
      return `background: #000 !important; color: transparent !important; user-select: none !important;`;
    case 'gaussian':
    default:
      return `filter: blur(${level}px);`;
  }
}

function buildSelector(item, customSelectors = [], defaultSelectors = []) {
  const baseSelectors = defaultSelectors[item] || [];
  const allSelectors = [...baseSelectors, ...customSelectors];
  return allSelectors.join(', ');
}

function getItemSettings(item, domain) {
  const siteSettings = settings.siteSettings?.[domain];
  const globalSettings = settings.itemSettings?.[item];
  
  if (siteSettings?.enabled && siteSettings.items?.[item]) {
    const siteItem = siteSettings.items[item];
    
    if (siteItem.useGlobal === false && siteItem.enabled !== undefined) {
      return {
        enabled: siteItem.enabled,
        level: siteItem.level ?? settings.globalBlurLevel,
        type: siteItem.type ?? settings.globalBlurType,
        selectors: siteItem.selectors ?? []
      };
    }
  }
  
  return {
    enabled: globalSettings?.enabled ?? false,
    level: globalSettings?.level ?? settings.globalBlurLevel,
    type: globalSettings?.type ?? settings.globalBlurType,
    selectors: globalSettings?.selectors ?? []
  };
}

function blurElement(el, itemSettings) {
  if (el.classList.contains('blur-me')) {
    const oldStyle = el.style.cssText;
    el.classList.remove('blur-me', 'blur-me-hover', 'blur-me-click', 'blur-me-revealed');
    el.style.cssText = oldStyle.replace(/filter: blur\([^)]*\);?/g, '')
      .replace(/image-rendering: pixelated;?/g, '')
      .replace(/backdrop-filter: blur\([^)]*\);?/g, '')
      .replace(/background: rgba\(255,255,255,0\.1\);?/g, '')
      .replace(/background: #000 !important;?/g, '')
      .replace(/color: transparent !important;?/g, '')
      .replace(/user-select: none !important;?/g, '');
  }
  
  if (el.closest('.blur-me')) {
    return;
  }

  if (processedElements.has(el)) {
    processedElements.delete(el);
  }
  
  processedElements.add(el);
  el.classList.add('blur-me');
  el.style.cssText += getBlurStyle(itemSettings);
  
  if (settings.hoverToReveal) {
    el.classList.add('blur-me-hover');
  }
  
  if (settings.clickToReveal) {
    el.classList.add('blur-me-click');
    el.addEventListener('click', function handler(e) {
      this.classList.add('blur-me-revealed');
      this.removeEventListener('click', handler);
    });
  }
}

function unblurElement(el) {
  if (!el.classList.contains('blur-me')) {
    return;
  }
  
  el.classList.remove('blur-me', 'blur-me-hover', 'blur-me-click', 'blur-me-revealed');
  processedElements.delete(el);
}

function getDomainSelectors(domain) {
  const presets = window.PRESETS || {};
  for (const [presetKey, preset] of Object.entries(presets)) {
    for (const pattern of preset.urlPatterns || []) {
      if (domain.includes(pattern.replace('www.', ''))) {
        return preset.items || {};
      }
    }
  }
  return {};
}

async function loadPresets() {
  try {
    const presets = await chrome.runtime.sendMessage({ type: 'GET_PRESETS' });
    window.PRESETS = presets;
  } catch (e) {
    console.warn('Blur Me: Could not load presets');
  }
}

function processElements() {
  if (!settings || !settings.globalEnabled) {
    removeAllBlur();
    return;
  }

  const domain = extractDomain(currentUrl);
  const siteSettings = settings.siteSettings?.[domain];
  const presetItems = getDomainSelectors(domain);
  
  const itemsToProcess = ['images', 'videos', 'text', 'profile', 'comments', 'messages', 'forms', 'buttons', 'custom'];
  
  itemsToProcess.forEach(item => {
    try {
      const siteItem = siteSettings?.items?.[item];
      const presetItem = presetItems[item];
      let itemSettings;
      
      if (siteSettings?.enabled && siteItem) {
        if (siteItem.useGlobal === false) {
          itemSettings = {
            enabled: siteItem.enabled ?? false,
            level: siteItem.level ?? settings.globalBlurLevel,
            type: siteItem.type ?? settings.globalBlurType,
            selectors: siteItem.selectors ?? []
          };
        } else if (presetItem && siteItem.usePreset !== false) {
          itemSettings = {
            enabled: siteItem.enabled ?? presetItem.enabled ?? false,
            level: siteItem.level ?? settings.globalBlurLevel,
            type: siteItem.type ?? settings.globalBlurType,
            selectors: siteItem.selectors ?? presetItem.selectors ?? []
          };
        } else {
          itemSettings = getItemSettings(item, domain);
        }
      } else if (presetItem) {
      const globalItem = settings.itemSettings?.[item];
      itemSettings = {
        enabled: globalItem?.enabled ?? presetItem.enabled ?? false,
        level: globalItem?.level ?? settings.globalBlurLevel,
        type: globalItem?.type ?? settings.globalBlurType,
        selectors: globalItem?.selectors?.length ? globalItem.selectors : (presetItem.selectors ?? [])
      };
    } else {
      itemSettings = getItemSettings(item, domain);
    }

    if (!itemSettings.enabled) {
      return;
    }

    const customSelectors = itemSettings.selectors || [];
    const selector = buildSelector(item, customSelectors, DEFAULT_SELECTORS);
    
    if (!selector) {
      return;
    }

    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => blurElement(el, itemSettings));
    } catch (e) {
      console.warn('Blur Me: Invalid selector', selector);
    }
    } catch (e) {
      console.warn('Blur Me: Error processing item', item, e);
    }
  });
}

function removeAllBlur() {
  const blurredElements = document.querySelectorAll('.blur-me');
  blurredElements.forEach(el => {
    el.classList.remove('blur-me', 'blur-me-hover', 'blur-me-click', 'blur-me-revealed');
    let style = el.style.cssText;
    style = style.replace(/filter: blur\([^)]*\);?/g, '')
      .replace(/image-rendering: pixelated;?/g, '')
      .replace(/backdrop-filter: blur\([^)]*\);?/g, '')
      .replace(/background: rgba\(255,255,255,0\.1\);?/g, '')
      .replace(/background: #000 !important;?/g, '')
      .replace(/color: transparent !important;?/g, '')
      .replace(/user-select: none !important;?/g, '');
    el.style.cssText = style;
  });
  processedElements = new WeakSet();
}

function initObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
      }
    });
    
    if (shouldProcess) {
      processElements();
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
}

function generateSelector(el) {
  if (el.id) {
    return '#' + el.id;
  }
  
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
    if (classes) {
      return el.tagName.toLowerCase() + '.' + classes;
    }
  }
  
  let path = [];
  let current = el;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += '#' + current.id;
      path.unshift(selector);
      break;
    }
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/)[0];
      if (classes) {
        selector += '.' + classes;
      }
    }
    
    const siblings = current.parentElement ? Array.from(current.parentElement.children).filter(e => e.tagName === current.tagName) : [];
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += ':nth-of-type(' + index + ')';
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

function startPicker(targetItem, callback) {
  pickerMode = true;
  pickerTarget = targetItem;
  pickerCallback = callback;
  
  document.body.classList.add('blur-me-picker-active');
  document.addEventListener('mouseover', pickerHover);
  document.addEventListener('click', pickerClick, true);
  document.addEventListener('keydown', pickerKeydown);
  
  const info = document.createElement('div');
  info.id = 'blur-me-picker-info';
  info.innerHTML = `
    <div class="blur-me-picker-content">
      <span>Click on an element to select it</span>
      <span class="blur-me-picker-hint">Press ESC to cancel</span>
    </div>
  `;
  document.body.appendChild(info);
}

function stopPicker() {
  pickerMode = false;
  pickerTarget = null;
  
  document.body.classList.remove('blur-me-picker-active');
  document.removeEventListener('mouseover', pickerHover);
  document.removeEventListener('click', pickerClick, true);
  document.removeEventListener('keydown', pickerKeydown);
  
  const info = document.getElementById('blur-me-picker-info');
  if (info) {
    info.remove();
  }
  
  const highlights = document.querySelectorAll('.blur-me-picker-highlight');
  highlights.forEach(el => el.classList.remove('blur-me-picker-highlight'));
}

function pickerHover(e) {
  e.stopPropagation();
  
  const highlights = document.querySelectorAll('.blur-me-picker-highlight');
  highlights.forEach(el => el.classList.remove('blur-me-picker-highlight'));
  
  if (e.target && e.target !== document.body) {
    e.target.classList.add('blur-me-picker-highlight');
  }
}

function pickerClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (e.target && e.target !== document.body) {
    const selector = generateSelector(e.target);
    
    if (pickerCallback) {
      pickerCallback(selector);
    }
    
    chrome.runtime.sendMessage({
      type: 'PICKER_SELECTED',
      selector: selector,
      item: pickerTarget
    });
  }
  
  stopPicker();
}

function pickerKeydown(e) {
  if (e.key === 'Escape') {
    stopPicker();
  }
}

async function init() {
  try {
    settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    await loadPresets();
  } catch (e) {
    settings = {
      globalEnabled: false,
      globalBlurLevel: 5,
      globalBlurType: 'gaussian',
      hoverToReveal: true,
      clickToReveal: true,
      itemSettings: {},
      siteSettings: {}
    };
  }

  if (settings.globalEnabled) {
    if (document.body) {
      processElements();
      initObserver();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        processElements();
        initObserver();
      });
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_URL') {
    currentUrl = message.url;
    loadPresets().then(() => {
      removeAllBlur();
      processedElements = new WeakSet();
      if (settings && settings.globalEnabled) {
        processElements();
        if (!document.body) {
          document.addEventListener('DOMContentLoaded', processElements);
        }
      }
    });
  }
  
  if (message.type === 'SETTINGS_UPDATED') {
    settings = message.settings;
    loadPresets().then(() => {
      removeAllBlur();
      processedElements = new WeakSet();
      if (settings.globalEnabled) {
        processElements();
        if (document.body) {
          initObserver();
        } else {
          document.addEventListener('DOMContentLoaded', initObserver);
        }
      } else {
        if (observer) {
          observer.disconnect();
        }
      }
    });
  }
  
  if (message.type === 'RELOAD_SETTINGS') {
    init();
  }
  
  if (message.type === 'START_PICKER') {
    startPicker(message.item, (selector) => {
      // Callback handled by background script
    });
  }
  
  if (message.type === 'STOP_PICKER') {
    stopPicker();
  }
});

init();
