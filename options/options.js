const ITEM_LABELS = {
  images: { name: 'Images', icon: '🖼️', desc: 'All image elements' },
  videos: { name: 'Videos', icon: '🎬', desc: 'Video and embedded players' },
  text: { name: 'Text', icon: '📝', desc: 'Paragraphs, headings, spans' },
  profile: { name: 'Profile', icon: '👤', desc: 'Avatars and profile pictures' },
  comments: { name: 'Comments', icon: '💬', desc: 'Comment sections' },
  messages: { name: 'Messages', icon: '✉️', desc: 'Chat messages' },
  forms: { name: 'Forms', icon: '📋', desc: 'Input fields and forms' },
  buttons: { name: 'Buttons', icon: '🔘', desc: 'Buttons and clickable elements' },
  custom: { name: 'Custom', icon: '⚙️', desc: 'Custom CSS selectors' }
};

let settings = {};
let presets = {};
let editingSite = null;

const globalEnabled = document.getElementById('globalEnabled');
const statusText = document.getElementById('statusText');
const globalBlurLevel = document.getElementById('globalBlurLevel');
const blurLevelDisplay = document.getElementById('blurLevelDisplay');
const globalBlurType = document.getElementById('globalBlurType');
const hoverToReveal = document.getElementById('hoverToReveal');
const clickToReveal = document.getElementById('clickToReveal');
const itemsList = document.getElementById('itemsList');
const builtinTemplates = document.getElementById('builtinTemplates');
const customTemplatesList = document.getElementById('customTemplatesList');
const addTemplateBtn = document.getElementById('addTemplateBtn');
const templateModal = document.getElementById('templateModal');
const closeModal = document.getElementById('closeModal');
const cancelTemplate = document.getElementById('cancelTemplate');
const saveTemplate = document.getElementById('saveTemplate');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');
const templateItems = document.getElementById('templateItems');
const customSelectorsGroup = document.getElementById('customSelectorsGroup');
const siteModal = document.getElementById('siteModal');
const closeSiteModal = document.getElementById('closeSiteModal');
const cancelSiteModal = document.getElementById('cancelSiteModal');
const saveSiteBtn = document.getElementById('saveSiteBtn');
const sitesList = document.getElementById('sitesList');
const addSiteBtn = document.getElementById('addSiteBtn');

async function loadSettings() {
  const result = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  settings = result;
  
  const presetResult = await chrome.runtime.sendMessage({ type: 'GET_PRESETS' });
  presets = presetResult;
  
  updateUI();
}

function updateUI() {
  globalEnabled.checked = settings.globalEnabled;
  updateStatus();
  
  globalBlurLevel.value = settings.globalBlurLevel;
  blurLevelDisplay.textContent = settings.globalBlurLevel + 'px';
  
  globalBlurType.value = settings.globalBlurType;
  hoverToReveal.checked = settings.hoverToReveal;
  clickToReveal.checked = settings.clickToReveal;

  renderItemsList();
  renderSitesList();
  renderDashboard();
  renderPresetTemplates();
}

function updateStatus() {
  if (settings.globalEnabled) {
    statusText.textContent = 'Extension Enabled';
    statusText.classList.remove('disabled');
  } else {
    statusText.textContent = 'Extension Disabled';
    statusText.classList.add('disabled');
  }
}

function renderDashboard() {
  let enabledSites = 0;
  let activeItems = 0;
  
  if (settings.siteSettings) {
    Object.values(settings.siteSettings).forEach(site => {
      if (site.enabled) enabledSites++;
    });
  }
  
  Object.values(settings.itemSettings).forEach(item => {
    if (item.enabled) activeItems++;
  });

  document.getElementById('enabledSitesCount').textContent = enabledSites;
  document.getElementById('activeItemsCount').textContent = activeItems;
  document.getElementById('customTemplatesCount').textContent = 
    (settings.customTemplates || []).length;

  const summary = document.getElementById('dashboardSummary');
  summary.innerHTML = '';
  
  Object.entries(ITEM_LABELS).forEach(([key, item]) => {
    const isEnabled = settings.itemSettings?.[key]?.enabled ?? false;
    const div = document.createElement('div');
    div.className = `summary-item ${isEnabled ? 'active' : ''}`;
    div.innerHTML = `
      <span class="dot"></span>
      <span>${item.icon} ${item.name}</span>
    `;
    summary.appendChild(div);
  });
}

function renderItemsList() {
  itemsList.innerHTML = '';
  
  Object.entries(ITEM_LABELS).forEach(([key, item]) => {
    const itemSettings = settings.itemSettings?.[key] || {
      enabled: false,
      level: settings.globalBlurLevel || 5,
      type: settings.globalBlurType || 'gaussian'
    };

    const div = document.createElement('div');
    div.className = 'item-config';
    div.innerHTML = `
      <span class="item-icon">${item.icon}</span>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
      </div>
      <div class="item-controls">
        <select data-item="${key}" class="blur-type-select">
          <option value="gaussian" ${itemSettings.type === 'gaussian' ? 'selected' : ''}>Gaussian</option>
          <option value="pixelate" ${itemSettings.type === 'pixelate' ? 'selected' : ''}>Pixelate</option>
          <option value="frosted" ${itemSettings.type === 'frosted' ? 'selected' : ''}>Frosted</option>
          <option value="blackout" ${itemSettings.type === 'blackout' ? 'selected' : ''}>Blackout</option>
        </select>
        <label class="toggle-switch">
          <input type="checkbox" data-item="${key}" ${itemSettings.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
    `;
    itemsList.appendChild(div);
  });

  itemsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const item = e.target.dataset.item;
      if (!settings.itemSettings[item]) {
        settings.itemSettings[item] = {
          enabled: false,
          level: settings.globalBlurLevel,
          type: settings.globalBlurType
        };
      }
      settings.itemSettings[item].enabled = e.target.checked;
      await saveSettings();
      renderDashboard();
    });
  });

  itemsList.querySelectorAll('.blur-type-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const item = e.target.dataset.item;
      if (!settings.itemSettings[item]) {
        settings.itemSettings[item] = {
          enabled: false,
          level: settings.globalBlurLevel,
          type: e.target.value
        };
      }
      settings.itemSettings[item].type = e.target.value;
      await saveSettings();
    });
  });
}

function renderSitesList() {
  sitesList.innerHTML = '';
  
  const siteSettings = settings.siteSettings || {};
  const siteEntries = Object.entries(siteSettings);
  
  if (siteEntries.length === 0) {
    sitesList.innerHTML = '<p class="empty-message">No custom site settings yet. Add a site to configure specific blur settings.</p>';
    return;
  }
  
  siteEntries.forEach(([domain, site]) => {
    const presetKey = site.usePreset;
    const presetName = presetKey ? presets[presetKey]?.name || presetKey : 'Custom';
    
    const enabledItems = Object.entries(site.items || {})
      .filter(([item, config]) => config.enabled)
      .map(([item]) => ITEM_LABELS[item]?.icon || '')
      .join(' ');
    
    const div = document.createElement('div');
    div.className = `site-card ${site.enabled ? 'enabled' : ''}`;
    div.innerHTML = `
      <div class="site-info">
        <div class="site-name">${domain}</div>
        <div class="site-meta">
          <span class="site-preset">${presetName}</span>
          ${site.enabled ? `<span class="site-enabled-items">${enabledItems}</span>` : ''}
        </div>
      </div>
      <div class="site-controls">
        <label class="toggle-switch">
          <input type="checkbox" data-site="${domain}" ${site.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <button class="btn-icon edit-site" data-site="${domain}" title="Edit">✏️</button>
        <button class="btn-icon delete-site" data-site="${domain}" title="Delete">🗑️</button>
      </div>
    `;
    sitesList.appendChild(div);
  });
  
  sitesList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const domain = e.target.dataset.site;
      if (settings.siteSettings[domain]) {
        settings.siteSettings[domain].enabled = e.target.checked;
        await saveSettings();
        renderSitesList();
        renderDashboard();
      }
    });
  });
  
  sitesList.querySelectorAll('.edit-site').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const domain = e.target.dataset.site;
      openSiteModal(domain);
    });
  });
  
  sitesList.querySelectorAll('.delete-site').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.target.dataset.site;
      if (confirm(`Delete settings for ${domain}?`)) {
        delete settings.siteSettings[domain];
        await saveSettings();
        renderSitesList();
        renderDashboard();
      }
    });
  });
}

function renderPresetTemplates() {
  builtinTemplates.innerHTML = '';
  
  Object.entries(presets).forEach(([key, preset]) => {
    const siteSettings = settings.siteSettings?.[preset.urlPatterns[0]] || { enabled: false };
    const div = document.createElement('div');
    div.className = `template-card ${siteSettings.enabled ? 'active' : ''}`;
    div.innerHTML = `
      <div class="template-info">
        <div class="template-name">${preset.name}</div>
        <div class="template-url">${preset.urlPatterns.join(', ')}</div>
      </div>
      <label class="toggle-switch template-toggle">
        <input type="checkbox" data-preset="${key}" data-url="${preset.urlPatterns[0]}" ${siteSettings.enabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    `;
    builtinTemplates.appendChild(div);
  });

  builtinTemplates.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const url = e.target.dataset.url;
      const presetKey = e.target.dataset.preset;
      const enabled = e.target.checked;
      
      if (!settings.siteSettings) {
        settings.siteSettings = {};
      }
      
      if (!settings.siteSettings[url]) {
        settings.siteSettings[url] = { 
          enabled: false, 
          usePreset: presetKey,
          items: {} 
        };
      }
      
      settings.siteSettings[url].enabled = enabled;
      settings.siteSettings[url].usePreset = presetKey;
      
      const preset = presets[presetKey];
      if (preset?.items) {
        Object.entries(preset.items).forEach(([item, config]) => {
          if (!settings.siteSettings[url].items[item]) {
            settings.siteSettings[url].items[item] = { useGlobal: false };
          }
          settings.siteSettings[url].items[item].enabled = config.enabled;
          settings.siteSettings[url].items[item].selectors = config.selectors || [];
        });
      }
      
      await saveSettings();
      renderSitesList();
      renderDashboard();
    });
  });
  
  customTemplatesList.innerHTML = '';
}

function openSiteModal(domain = null) {
  editingSite = domain;
  const modalTitle = document.getElementById('siteModalTitle');
  const siteDomainInput = document.getElementById('siteDomain');
  const sitePresetSelect = document.getElementById('sitePreset');
  const siteEnabledCheckbox = document.getElementById('siteEnabledInput');
  const siteItemsList = document.getElementById('siteItemsList');
  
  if (domain) {
    modalTitle.textContent = 'Edit Site';
    const site = settings.siteSettings[domain];
    siteDomainInput.value = domain;
    siteDomainInput.disabled = true;
    sitePresetSelect.value = site?.usePreset || '';
    siteEnabledCheckbox.checked = site?.enabled || false;
  } else {
    modalTitle.textContent = 'Add Site';
    siteDomainInput.value = '';
    siteDomainInput.disabled = false;
    sitePresetSelect.value = '';
    siteEnabledCheckbox.checked = false;
  }
  
  sitePresetSelect.innerHTML = '<option value="">Custom</option>';
  Object.entries(presets).forEach(([key, preset]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = preset.name;
    sitePresetSelect.appendChild(option);
  });
  
  renderSiteItemsList(domain);
  
  siteModal.classList.add('active');
}

function renderSiteItemsList(domain) {
  const siteItemsList = document.getElementById('siteItemsList');
  siteItemsList.innerHTML = '';
  
  const site = domain ? settings.siteSettings?.[domain] : null;
  const presetKey = site?.usePreset;
  const preset = presetKey ? presets[presetKey] : null;
  
  Object.entries(ITEM_LABELS).forEach(([key, item]) => {
    const siteItem = site?.items?.[key];
    const presetItem = preset?.items?.[key];
    const globalItem = settings.itemSettings?.[key];
    
    let enabled = false;
    let selectors = '';
    
    if (siteItem) {
      enabled = siteItem.enabled || false;
      selectors = (siteItem.selectors || []).join(', ');
    } else if (presetItem) {
      enabled = presetItem.enabled || false;
      selectors = (presetItem.selectors || []).join(', ');
    } else {
      enabled = globalItem?.enabled || false;
      selectors = (globalItem?.selectors || []).join(', ');
    }
    
    const div = document.createElement('div');
    div.className = 'site-item-config';
    div.innerHTML = `
      <div class="site-item-header">
        <span class="item-icon">${item.icon}</span>
        <span class="item-name">${item.name}</span>
        <label class="toggle-switch small">
          <input type="checkbox" data-item="${key}" ${enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <input type="text" class="site-item-selectors" data-item="${key}" 
        placeholder="Custom selectors (comma separated)" value="${selectors}">
    `;
    siteItemsList.appendChild(div);
  });
}

function closeSiteModalFunc() {
  siteModal.classList.remove('active');
  editingSite = null;
}

async function saveSiteFromModal() {
  const siteDomainInput = document.getElementById('siteDomain');
  const sitePresetSelect = document.getElementById('sitePreset');
  const siteEnabledCheckbox = document.getElementById('siteEnabledInput');
  const siteItemsList = document.getElementById('siteItemsList');
  
  const domain = siteDomainInput.value.trim();
  if (!domain) {
    alert('Please enter a domain');
    return;
  }
  
  if (!settings.siteSettings) {
    settings.siteSettings = {};
  }
  
  settings.siteSettings[domain] = {
    enabled: siteEnabledCheckbox.checked,
    usePreset: sitePresetSelect.value || null,
    items: {}
  };
  
  siteItemsList.querySelectorAll('.site-item-config').forEach(div => {
    const item = div.querySelector('input[type="checkbox"]').dataset.item;
    const enabled = div.querySelector('input[type="checkbox"]').checked;
    const selectors = div.querySelector('.site-item-selectors').value
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    
    settings.siteSettings[domain].items[item] = {
      useGlobal: false,
      enabled: enabled,
      selectors: selectors
    };
  });
  
  await saveSettings();
  closeSiteModalFunc();
  renderSitesList();
  renderDashboard();
}

globalEnabled.addEventListener('change', async () => {
  settings.globalEnabled = globalEnabled.checked;
  await saveSettings();
  updateStatus();
});

globalBlurLevel.addEventListener('input', async () => {
  const level = parseInt(globalBlurLevel.value);
  blurLevelDisplay.textContent = level + 'px';
  settings.globalBlurLevel = level;
  
  Object.keys(settings.itemSettings).forEach(item => {
    settings.itemSettings[item].level = level;
  });
  
  await saveSettings();
});

globalBlurType.addEventListener('change', async () => {
  settings.globalBlurType = globalBlurType.value;
  await saveSettings();
});

hoverToReveal.addEventListener('change', async () => {
  settings.hoverToReveal = hoverToReveal.checked;
  await saveSettings();
});

clickToReveal.addEventListener('change', async () => {
  settings.clickToReveal = clickToReveal.checked;
  await saveSettings();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

addTemplateBtn.addEventListener('click', () => {
  templateModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
  templateModal.classList.remove('active');
});

cancelTemplate.addEventListener('click', () => {
  templateModal.classList.remove('active');
});

templateItems.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    if (checkbox.value === 'custom' && checkbox.checked) {
      customSelectorsGroup.style.display = 'block';
    } else if (checkbox.value === 'custom' && !checkbox.checked) {
      customSelectorsGroup.style.display = 'none';
    }
  });
});

saveTemplate.addEventListener('click', async () => {
  const name = document.getElementById('templateName').value;
  const url = document.getElementById('templateUrl').value;
  const selectedItems = [];
  
  templateItems.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    selectedItems.push(cb.value);
  });
  
  if (!name || !url) {
    alert('Please fill in template name and URL pattern');
    return;
  }
  
  const customSelectors = document.getElementById('customSelectors').value
    .split(',')
    .map(s => s.trim())
    .filter(s => s);

  const template = {
    name,
    urlPattern: url,
    enabledItems: selectedItems,
    customSelectors: { custom: customSelectors }
  };
  
  if (!settings.customTemplates) {
    settings.customTemplates = [];
  }
  
  settings.customTemplates.push(template);
  await saveSettings();
  
  templateModal.classList.remove('active');
  document.getElementById('templateName').value = '';
  document.getElementById('templateUrl').value = '';
  document.getElementById('customSelectors').value = '';
  templateItems.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  customSelectorsGroup.style.display = 'none';
  
  renderSitesList();
  renderDashboard();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'blur-me-settings.json';
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
  const file = importFile.files[0];
  if (!file) {
    alert('Please select a file to import');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      settings = imported;
      await saveSettings();
      updateUI();
      alert('Settings imported successfully!');
    } catch (err) {
      alert('Invalid file format');
    }
  };
  reader.readAsText(file);
});

resetBtn.addEventListener('click', async () => {
  if (confirm('Reset all settings to defaults? This cannot be undone.')) {
    settings = {
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
      siteSettings: {},
      customTemplates: []
    };
    await saveSettings();
    updateUI();
  }
});

addSiteBtn.addEventListener('click', () => {
  openSiteModal(null);
});

closeSiteModal.addEventListener('click', closeSiteModalFunc);
cancelSiteModal.addEventListener('click', closeSiteModalFunc);
saveSiteBtn.addEventListener('click', saveSiteFromModal);

async function saveSettings() {
  await chrome.runtime.sendMessage({ 
    type: 'SAVE_SETTINGS', 
    settings: settings 
  });
}

loadSettings();
