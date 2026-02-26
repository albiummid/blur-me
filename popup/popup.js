let settings = {};
let currentUrl = '';

const globalToggle = document.getElementById('globalToggle');
const siteName = document.getElementById('siteName');
const itemsGrid = document.getElementById('itemsGrid');
const blurLevel = document.getElementById('blurLevel');
const blurLevelValue = document.getElementById('blurLevelValue');
const openSettings = document.getElementById('openSettings');

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

function getMatchedTemplate(url) {
  const domain = extractDomain(url);
  
  const templates = {
    'whatsapp.com': 'WhatsApp',
    'facebook.com': 'Facebook',
    'fb.com': 'Facebook',
    'instagram.com': 'Instagram',
    'gmail.com': 'Gmail',
    'mail.google.com': 'Gmail',
    'twitter.com': 'Twitter',
    'x.com': 'Twitter',
    'linkedin.com': 'LinkedIn',
    'youtube.com': 'YouTube'
  };

  for (const [key, name] of Object.entries(templates)) {
    if (domain.includes(key)) {
      return name;
    }
  }
  return null;
}

async function loadSettings() {
  const result = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  settings = result;
  
  globalToggle.checked = settings.globalEnabled;
  blurLevel.value = settings.globalBlurLevel;
  blurLevelValue.textContent = settings.globalBlurLevel;

  const domain = extractDomain(currentUrl);
  const templateName = getMatchedTemplate(currentUrl);
  
  if (templateName) {
    siteName.textContent = `${domain} (${templateName})`;
  } else {
    siteName.textContent = domain;
  }

  updateItemToggles();
}

function updateItemToggles() {
  const checkboxes = itemsGrid.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const item = checkbox.dataset.item;
    const isEnabled = settings.itemSettings?.[item]?.enabled ?? false;
    checkbox.checked = isEnabled;
  });
}

async function saveSettings() {
  await chrome.runtime.sendMessage({ 
    type: 'SAVE_SETTINGS', 
    settings: settings 
  });
}

globalToggle.addEventListener('change', async () => {
  settings.globalEnabled = globalToggle.checked;
  await saveSettings();
});

blurLevel.addEventListener('input', async () => {
  const level = parseInt(blurLevel.value);
  blurLevelValue.textContent = level;
  settings.globalBlurLevel = level;
  
  Object.keys(settings.itemSettings).forEach(item => {
    settings.itemSettings[item].level = level;
  });
  
  await saveSettings();
});

const itemCheckboxes = itemsGrid.querySelectorAll('input[type="checkbox"]');
itemCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', async () => {
    const item = checkbox.dataset.item;
    if (!settings.itemSettings[item]) {
      settings.itemSettings[item] = { 
        enabled: false, 
        level: settings.globalBlurLevel, 
        type: settings.globalBlurType 
      };
    }
    settings.itemSettings[item].enabled = checkbox.checked;
    await saveSettings();
  });
});

openSettings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url) {
    currentUrl = tabs[0].url;
  }
  loadSettings();
});
