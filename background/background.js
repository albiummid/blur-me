const DEFAULT_SETTINGS = {
  globalEnabled: true,
  globalBlurLevel: 5,
  globalBlurType: 'gaussian',
  hoverToReveal: true,
  clickToReveal: true,
  itemSettings: {
    images: { enabled: true, level: 5, type: 'gaussian' },
    videos: { enabled: true, level: 5, type: 'gaussian' },
    text: { enabled: false, level: 3, type: 'gaussian' },
    profile: { enabled: true, level: 5, type: 'gaussian' },
    comments: { enabled: false, level: 3, type: 'gaussian' },
    messages: { enabled: false, level: 3, type: 'gaussian' },
    forms: { enabled: false, level: 3, type: 'gaussian' },
    buttons: { enabled: false, level: 3, type: 'gaussian' },
    custom: { enabled: false, level: 5, type: 'gaussian', selectors: [] }
  },
  siteSettings: {},
  customTemplates: []
};

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
    'span:not(.blur-me)',
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

const STORAGE_KEY = 'blurMeSettings';

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (!stored[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(STORAGE_KEY).then(result => {
      sendResponse(result[STORAGE_KEY] || DEFAULT_SETTINGS);
    });
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ [STORAGE_KEY]: message.settings }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_SELECTORS') {
    sendResponse(DEFAULT_SELECTORS);
    return true;
  }

  if (message.type === 'GET_CURRENT_URL') {
    chrome.runtime.sendMessage({ type: 'GET_TAB_URL' }).then(response => {
      sendResponse(response);
    });
    return true;
  }
});

chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_URL', url: tabs[0].url }).catch(() => {});
  }
});
