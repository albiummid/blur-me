let settings = {};
let currentUrl = '';
let currentDomain = '';
let presets = {};

const ITEM_LABELS = {
  images: { name: 'Images', icon: '🖼️' },
  videos: { name: 'Videos', icon: '🎬' },
  text: { name: 'Text', icon: '📝' },
  profile: { name: 'Profile', icon: '👤' },
  comments: { name: 'Comments', icon: '💬' },
  messages: { name: 'Messages', icon: '✉️' },
  forms: { name: 'Forms', icon: '📋' },
  buttons: { name: 'Buttons', icon: '🔘' },
  custom: { name: 'Custom', icon: '⚙️' }
};

const globalToggle = document.getElementById('globalToggle');
const siteSelect = document.getElementById('siteSelect');
const presetSelect = document.getElementById('presetSelect');
const presetRow = document.getElementById('presetRow');
const siteEnabled = document.getElementById('siteEnabled');
const itemsGrid = document.getElementById('itemsGrid');
const blurLevel = document.getElementById('blurLevel');
const blurLevelValue = document.getElementById('blurLevelValue');
const openSettings = document.getElementById('openSettings');
const customSelectorsSection = document.getElementById('customSelectorsSection');
const customSelectorsInput = document.getElementById('customSelectorsInput');
const pickerBtn = document.getElementById('pickerBtn');

let selectedPickerItem = 'custom';

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

async function loadPresets() {
  const result = await chrome.runtime.sendMessage({ type: 'GET_PRESETS' });
  presets = result;
  
  presetSelect.innerHTML = '<option value="">Custom</option>';
  
  Object.entries(presets).forEach(([key, preset]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });
}

function getMatchedPreset(domain) {
  for (const [key, preset] of Object.entries(presets)) {
    for (const pattern of preset.urlPatterns || []) {
      if (domain.includes(pattern.replace('www.', ''))) {
        return key;
      }
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
  
  await loadPresets();
  await loadCurrentSite();
  populateSiteDropdown();
  updateUIForCurrentSite();
}

async function loadCurrentSite() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.url) {
    currentUrl = tabs[0].url;
    currentDomain = extractDomain(currentUrl);
  }
}

function populateSiteDropdown() {
  siteSelect.innerHTML = '<option value="__current__">Current Site</option>';
  
  const configuredSites = Object.keys(settings.siteSettings || {});
  configuredSites.forEach(site => {
    if (site !== currentDomain) {
      const option = document.createElement('option');
      option.value = site;
      option.textContent = site;
      siteSelect.appendChild(option);
    }
  });
}

function getSelectedDomain() {
  const value = siteSelect.value;
  if (value === '__current__') {
    return currentDomain;
  }
  return value;
}

function updateUIForCurrentSite() {
  const domain = getSelectedDomain();
  const presetKey = getMatchedPreset(domain);
  const siteSettings = settings.siteSettings?.[domain];
  
  if (presetKey) {
    presetRow.style.display = 'flex';
    presetSelect.value = presetKey;
  } else {
    presetRow.style.display = 'none';
  }
  
  siteEnabled.checked = siteSettings?.enabled || false;
  
  const globalItems = settings.itemSettings || {};
  const siteItems = siteSettings?.items || {};
  
  const checkboxes = itemsGrid.querySelectorAll('input[type="checkbox"][data-item]');
  checkboxes.forEach(checkbox => {
    const item = checkbox.dataset.item;
    const siteItem = siteItems[item];
    const presetItem = presets[presetKey]?.items?.[item];
    
    if (siteSettings?.enabled && siteItem) {
      checkbox.checked = siteItem.enabled || false;
      customSelectorsSection.style.display = item === 'custom' ? 'block' : 'none';
      if (item === 'custom') {
        customSelectorsInput.value = (siteItem.selectors || []).join(', ');
      }
    } else if (presetItem && presetSelect.value) {
      checkbox.checked = presetItem.enabled || false;
      customSelectorsSection.style.display = 'none';
    } else {
      checkbox.checked = globalItems[item]?.enabled || false;
      customSelectorsSection.style.display = 'none';
    }
  });
}

async function saveSettings() {
  await chrome.runtime.sendMessage({ 
    type: 'SAVE_SETTINGS', 
    settings: settings 
  });
}

async function saveCurrentSiteSettings() {
  const domain = getSelectedDomain();
  const presetKey = presetSelect.value;
  
  if (!settings.siteSettings) {
    settings.siteSettings = {};
  }
  
  if (siteEnabled.checked) {
    if (!settings.siteSettings[domain]) {
      settings.siteSettings[domain] = { enabled: false, items: {} };
    }
    
    settings.siteSettings[domain].enabled = true;
    
    if (presetKey) {
      settings.siteSettings[domain].usePreset = presetKey;
    }
    
    const items = settings.siteSettings[domain].items;
    const checkboxes = itemsGrid.querySelectorAll('input[type="checkbox"][data-item]');
    checkboxes.forEach(checkbox => {
      const item = checkbox.dataset.item;
      
      if (presetKey && presets[presetKey]?.items?.[item]) {
        if (!items[item]) {
          items[item] = { useGlobal: false };
        }
        items[item].enabled = checkbox.checked;
        items[item].selectors = presets[presetKey].items[item]?.selectors || [];
      } else {
        items[item] = { useGlobal: false, enabled: checkbox.checked };
        
        if (item === 'custom') {
          items[item].selectors = customSelectorsInput.value
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        }
      }
    });
  } else {
    if (settings.siteSettings[domain]) {
      settings.siteSettings[domain].enabled = false;
    }
  }
  
  populateSiteDropdown();
  await saveSettings();
}

globalToggle.addEventListener('change', async () => {
  settings.globalEnabled = globalToggle.checked;
  await saveSettings();
});

siteSelect.addEventListener('change', () => {
  updateUIForCurrentSite();
});

presetSelect.addEventListener('change', () => {
  const presetKey = presetSelect.value;
  const domain = getSelectedDomain();
  
  if (presetKey) {
    const preset = presets[presetKey];
    const checkboxes = itemsGrid.querySelectorAll('input[type="checkbox"][data-item]');
    checkboxes.forEach(checkbox => {
      const item = checkbox.dataset.item;
      const presetItem = preset?.items?.[item];
      if (presetItem) {
        checkbox.checked = presetItem.enabled || false;
      }
    });
    customSelectorsSection.style.display = 'none';
  } else {
    updateUIForCurrentSite();
  }
  
  saveCurrentSiteSettings();
});

siteEnabled.addEventListener('change', () => {
  const enabled = siteEnabled.checked;
  const domain = getSelectedDomain();
  const checkboxes = itemsGrid.querySelectorAll('input[type="checkbox"][data-item]');
  
  if (enabled) {
    presetRow.style.display = 'flex';
    if (!presetSelect.value) {
      const presetKey = getMatchedPreset(domain);
      if (presetKey) {
        presetSelect.value = presetKey;
      }
    }
  } else {
    presetRow.style.display = 'none';
  }
  
  saveCurrentSiteSettings();
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

const itemCheckboxes = itemsGrid.querySelectorAll('input[type="checkbox"][data-item]');
itemCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const item = checkbox.dataset.item;
    
    if (siteEnabled.checked) {
      const domain = getSelectedDomain();
      if (!settings.siteSettings[domain]) {
        settings.siteSettings[domain] = { enabled: true, items: {} };
      }
      
      if (!settings.siteSettings[domain].items[item]) {
        settings.siteSettings[domain].items[item] = { useGlobal: false };
      }
      
      settings.siteSettings[domain].items[item].enabled = checkbox.checked;
      
      if (item === 'custom') {
        customSelectorsSection.style.display = checkbox.checked ? 'block' : 'none';
        settings.siteSettings[domain].items[item].selectors = customSelectorsInput.value
          .split(',')
          .map(s => s.trim())
          .filter(s => s);
      }
    } else {
      if (!settings.itemSettings[item]) {
        settings.itemSettings[item] = { 
          enabled: false, 
          level: settings.globalBlurLevel, 
          type: settings.globalBlurType 
        };
      }
      settings.itemSettings[item].enabled = checkbox.checked;
    }
    
    saveSettings();
  });
});

customSelectorsInput.addEventListener('input', () => {
  if (siteEnabled.checked) {
    const domain = getSelectedDomain();
    if (settings.siteSettings[domain]?.items?.custom) {
      settings.siteSettings[domain].items.custom.selectors = customSelectorsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      saveSettings();
    }
  }
});

pickerBtn.addEventListener('click', async () => {
  const domain = getSelectedDomain();
  
  if (!siteEnabled.checked) {
    alert('Please enable custom settings for this site first');
    return;
  }
  
  selectedPickerItem = 'custom';
  
  try {
    await chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'START_PICKER',
        item: 'custom'
      });
    });
    
    alert('Picker mode activated! Click on any element in the page to select it.');
    window.close();
  } catch (e) {
    console.error('Picker error:', e);
  }
});

openSettings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

loadSettings();
