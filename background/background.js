const PRESETS = {
  whatsapp: {
    name: "WhatsApp Web",
    urlPatterns: ["web.whatsapp.com"],
    items: {
      messages: { enabled: true, selectors: [".message.focusable-list-item", "[data-testid='message-text']", ".msg-compose-container"] },
      profile: { enabled: true, selectors: ["[data-testid='avatar'] img", ".avatar", "[data-testid='user-shortcuts'] img"] },
      images: { enabled: false, selectors: ["[data-testid='status-image']", "[data-testid='image-thumb'] img", ".focusable-list-item img"] },
      videos: { enabled: false, selectors: ["[data-testid='video-player']", "[data-testid='status-video']"] },
      text: { enabled: false, selectors: ["[data-testid='conversation-info']", ".chat-subject"] }
    }
  },
  telegram: {
    name: "Telegram Web",
    urlPatterns: ["web.telegram.org", "web2.telegram.org"],
    items: {
      messages: { enabled: true, selectors: [".message", ".message-body", ".im_message_text"] },
      profile: { enabled: true, selectors: [".avatar", ".im_profile_avatar", "[class*='avatar']"] },
      images: { enabled: true, selectors: [".im_message_media_wrap img", ".im_image_thumb", "[class*='media-photo']"] },
      videos: { enabled: true, selectors: [".im_message_video", "[class*='video-player']"] },
      text: { enabled: false, selectors: [".im_message_author", ".im_message_name"] }
    }
  },
  facebook: {
    name: "Facebook",
    urlPatterns: ["facebook.com", "fb.com", "m.facebook.com"],
    items: {
      profile: { enabled: true, selectors: ["[data-pagelet='ProfileAvatar'] img", "image[mask-id='avatar']", "a[aria-label*='Profile'] img", ".x1lliihq img[alt*='Profile']"] },
      comments: { enabled: true, selectors: ["[data-pagelet*='Comment']", ".comment", ".x1n2onr6 [role='article']"] },
      images: { enabled: true, selectors: ["[data-pagelet*='Photo'] img", "image[visibility]", ".x1lliihq img:not([alt*='Profile'])"] },
      text: { enabled: false, selectors: ["[data-pagelet*='FeedUnit'] h2", ".x1n2onr6 h3"] },
      messages: { enabled: false, selectors: ["[data-pagelet='Messenger']", ".x1lliihq div[role='button']"] }
    }
  },
  instagram: {
    name: "Instagram",
    urlPatterns: ["instagram.com"],
    items: {
      profile: { enabled: true, selectors: ["img[alt*='Profile']", "header img", "._aao7 img"] },
      images: { enabled: true, selectors: ["article img", "div[role='button'] img", "._aagw img", "._aap2 img"] },
      videos: { enabled: true, selectors: ["video", "article video"] },
      text: { enabled: false, selectors: ["h2", "._aacl", "._aacu"] },
      comments: { enabled: false, selectors: ["ul._a9ym li", "._a9zr"] }
    }
  },
  gmail: {
    name: "Gmail",
    urlPatterns: ["mail.google.com", "gmail.com"],
    items: {
      text: { enabled: true, selectors: [".adE", ".bsN", ".yP", ".h7"] },
      profile: { enabled: true, selectors: ["img.yaq", ".gb_xa img", "span.gb_1"] },
      images: { enabled: true, selectors: [".adF img", ".nH div[role='list'] img"] },
      messages: { enabled: false, selectors: [".a3s.aiL", ".adC"] }
    }
  },
  twitter: {
    name: "Twitter/X",
    urlPatterns: ["twitter.com", "x.com"],
    items: {
      profile: { enabled: true, selectors: ["[data-testid='User-avatar'] img", "img[alt*='profile']"] },
      images: { enabled: true, selectors: ["[data-testid='tweetPhoto'] img", "img[alt='Image']", "[data-testid='card'] img"] },
      text: { enabled: false, selectors: ["[data-testid='tweetText']", "div[lang]"] },
      comments: { enabled: false, selectors: ["[data-testid='reply']", "[data-testid='cellInnerDiv']"] }
    }
  },
  linkedin: {
    name: "LinkedIn",
    urlPatterns: ["linkedin.com"],
    items: {
      profile: { enabled: true, selectors: [".presence-entity__image img", ".feed-shared-actor__image img"] },
      images: { enabled: true, selectors: [".feed-shared-image__image", ".ivm-view-msg__image img"] },
      text: { enabled: false, selectors: [".feed-shared-text__text", ".feed-shared-actor__name"] },
      comments: { enabled: false, selectors: [".comments-comments-list__comment", ".social-details-social-activity"] }
    }
  },
  youtube: {
    name: "YouTube",
    urlPatterns: ["youtube.com", "youtu.be"],
    items: {
      profile: { enabled: true, selectors: ["ytd-channel-name img", "#avatar img", "#channel-thumbnail img"] },
      images: { enabled: false, selectors: ["ytd-thumbnail img", "yt-image img"] },
      text: { enabled: false, selectors: ["#title", "#channel-name"] },
      comments: { enabled: false, selectors: ["ytd-comment-thread-renderer", "#comments"] }
    }
  },
  reddit: {
    name: "Reddit",
    urlPatterns: ["reddit.com", "old.reddit.com"],
    items: {
      profile: { enabled: true, selectors: ["img[alt='User avatar']", "a[href*='/u/'] img"] },
      images: { enabled: true, selectors: ["[data-testid='post-image'] img", ".post-image", "img.shreddit-image"] },
      text: { enabled: false, selectors: ["[data-testid='post-title']", ".title"] },
      comments: { enabled: false, selectors: ["[data-testid='comment']", ".comment"] }
    }
  },
  tiktok: {
    name: "TikTok",
    urlPatterns: ["tiktok.com"],
    items: {
      profile: { enabled: true, selectors: ["[data-e2e='avatar'] img", ".tiktok-avatar img"] },
      images: { enabled: true, selectors: ["[data-e2e='video-cover'] img"] },
      videos: { enabled: true, selectors: ["video", "[data-e2e='video-player']"] },
      text: { enabled: false, selectors: ["[data-e2e='video-desc']", "[data-e2e='user-title']"] }
    }
  }
};

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

const DEFAULT_SETTINGS = {
  globalEnabled: true,
  globalBlurLevel: 5,
  globalBlurType: 'gaussian',
  hoverToReveal: true,
  clickToReveal: true,
  itemSettings: {
    images: { enabled: false, level: 5, type: 'gaussian', selectors: [] },
    videos: { enabled: false, level: 5, type: 'gaussian', selectors: [] },
    text: { enabled: false, level: 3, type: 'gaussian', selectors: [] },
    profile: { enabled: false, level: 5, type: 'gaussian', selectors: [] },
    comments: { enabled: false, level: 3, type: 'gaussian', selectors: [] },
    messages: { enabled: false, level: 3, type: 'gaussian', selectors: [] },
    forms: { enabled: false, level: 3, type: 'gaussian', selectors: [] },
    buttons: { enabled: false, level: 3, type: 'gaussian', selectors: [] },
    custom: { enabled: false, level: 5, type: 'gaussian', selectors: [] }
  },
  siteSettings: {}
};

const STORAGE_KEY = 'blurMeSettings';

function getPresetForDomain(domain) {
  for (const [key, preset] of Object.entries(PRESETS)) {
    for (const pattern of preset.urlPatterns) {
      if (domain.includes(pattern.replace('www.', ''))) {
        return { key, ...preset };
      }
    }
  }
  return null;
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (!stored[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
  }
});

function injectPresets(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (presets) => {
      window.PRESETS = presets;
    },
    args: [PRESETS]
  }).catch(() => {});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    injectPresets(tabId);
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
      broadcastSettingsUpdate(message.settings);
    });
    return true;
  }

  if (message.type === 'GET_SELECTORS') {
    sendResponse(DEFAULT_SELECTORS);
    return true;
  }

  if (message.type === 'GET_PRESETS') {
    sendResponse(PRESETS);
    return true;
  }

  if (message.type === 'GET_PRESET_FOR_DOMAIN') {
    const preset = getPresetForDomain(message.domain);
    sendResponse(preset);
    return true;
  }

  if (message.type === 'GET_PRESET_NAMES') {
    const names = Object.entries(PRESETS).map(([key, preset]) => ({
      key,
      name: preset.name,
      urlPatterns: preset.urlPatterns
    }));
    sendResponse(names);
    return true;
  }

  if (message.type === 'GET_CURRENT_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      }
    });
    return true;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    broadcastSettingsUpdate(changes[STORAGE_KEY].newValue);
  }
});

function broadcastSettingsUpdate(settings) {
  chrome.tabs.query({}).then(tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings: settings
      }).catch(() => {});
    });
  });
}

chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_URL', url: tabs[0].url }).catch(() => {});
  }
});
