const DEFAULT_SELECTORS = {
  images: [
    'img',
    'picture',
    '[role="img"]',
    '[data-bg-image]',
    '[style*="background-image"]'
  ],
  videos: [
    'video',
    'iframe[src*="youtube"]',
    'iframe[src*="vimeo"]',
    '[role="video"]'
  ],
  text: [
    'p',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span',
    'li',
    'td',
    'th'
  ],
  profile: [
    '[class*="avatar"]',
    '[class*="profile"]',
    '[data-testid*="avatar"]',
    '[aria-label*="avatar"]',
    'img[alt*="profile"]',
    'img[alt*="Profile"]'
  ],
  comments: [
    '[class*="comment"]',
    '[data-testid*="comment"]',
    '[aria-label*="comment"]'
  ],
  messages: [
    '[class*="message"]',
    '[data-testid*="message"]',
    '[role="log"]'
  ],
  forms: [
    'input:not([type="hidden"])',
    'textarea',
    'select'
  ],
  buttons: [
    'button',
    '[role="button"]',
    'a.btn',
    '[class*="button"]'
  ],
  custom: []
};

let settings = null;
let currentUrl = '';
let processedElements = new WeakSet();

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function getSiteSettings(url) {
  const domain = extractDomain(url);
  
  const siteTemplates = {
    'whatsapp.com': {
      messages: true,
      profile: true,
      text: false
    },
    'facebook.com': {
      profile: true,
      comments: true,
      text: false
    },
    'instagram.com': {
      profile: true,
      images: true,
      messages: false
    },
    'gmail.com': {
      text: true,
      profile: false
    }
  };

  for (const [site, items] of Object.entries(siteTemplates)) {
    if (domain.includes(site)) {
      return items;
    }
  }
  return null;
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

function buildSelector(item, customSelectors = []) {
  const selectors = DEFAULT_SELECTORS[item] || [];
  if (item === 'custom' && customSelectors.length > 0) {
    return customSelectors.join(', ');
  }
  return selectors.join(', ');
}

function blurElement(el, itemSettings) {
  if (processedElements.has(el) || el.classList.contains('blur-me')) {
    return;
  }
  
  if (el.closest('.blur-me')) {
    return;
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

function processElements() {
  if (!settings || !settings.globalEnabled) {
    return;
  }

  const domain = extractDomain(currentUrl);
  const siteOverrides = settings.siteSettings?.[domain];
  const siteTemplateItems = getSiteSettings(currentUrl);

  for (const [item, itemSettings] of Object.entries(settings.itemSettings)) {
    if (!itemSettings?.enabled) {
      continue;
    }

    let isEnabled = itemSettings.enabled;
    
    if (siteOverrides?.itemOverrides?.[item]?.enabled !== undefined) {
      isEnabled = siteOverrides.itemOverrides[item].enabled;
    } else if (siteTemplateItems && siteTemplateItems[item] !== undefined) {
      isEnabled = siteTemplateItems[item];
    }

    if (!isEnabled) {
      continue;
    }

    const customSelectors = itemSettings.selectors || [];
    const selector = buildSelector(item, customSelectors);
    
    if (!selector) {
      continue;
    }

    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => blurElement(el, itemSettings));
    } catch (e) {
      console.warn('Blur Me: Invalid selector', selector);
    }
  }
}

function initObserver() {
  const observer = new MutationObserver((mutations) => {
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

async function init() {
  try {
    settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  } catch (e) {
    settings = {
      globalEnabled: false,
      globalBlurLevel: 5,
      globalBlurType: 'gaussian',
      hoverToReveal: true,
      clickToReveal: true,
      itemSettings: {}
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
  }
  
  if (message.type === 'RELOAD_SETTINGS') {
    init();
  }
});

init();
