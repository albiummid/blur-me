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

const BUILTIN_TEMPLATES = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Web',
    url: 'web.whatsapp.com',
    icon: '💬',
    enabledItems: ['messages', 'profile']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'facebook.com',
    icon: '📘',
    enabledItems: ['profile', 'comments', 'images']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'instagram.com',
    icon: '📷',
    enabledItems: ['profile', 'images']
  },
  {
    id: 'gmail',
    name: 'Gmail',
    url: 'gmail.com',
    icon: '📧',
    enabledItems: ['text', 'profile']
  }
];

let settings = {};

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

async function loadSettings() {
  settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
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
  renderDashboard();
  renderTemplates();
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

function renderTemplates() {
  builtinTemplates.innerHTML = '';
  
  BUILTIN_TEMPLATES.forEach(template => {
    const siteSettings = settings.siteSettings?.[template.url] || { enabled: false };
    const div = document.createElement('div');
    div.className = 'template-card';
    div.innerHTML = `
      <div class="template-info">
        <div class="template-name">${template.icon} ${template.name}</div>
        <div class="template-url">${template.url}</div>
      </div>
      <label class="toggle-switch template-toggle">
        <input type="checkbox" data-template="${template.id}" data-url="${template.url}" ${siteSettings.enabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    `;
    builtinTemplates.appendChild(div);
  });

  builtinTemplates.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const url = e.target.dataset.url;
      const enabled = e.target.checked;
      
      if (!settings.siteSettings) {
        settings.siteSettings = {};
      }
      
      if (!settings.siteSettings[url]) {
        settings.siteSettings[url] = { enabled: false, itemOverrides: {} };
      }
      
      settings.siteSettings[url].enabled = enabled;
      await saveSettings();
      renderDashboard();
    });
  });

  customTemplatesList.innerHTML = '';
  const customTemplates = settings.customTemplates || [];
  
  if (customTemplates.length === 0) {
    customTemplatesList.innerHTML = '<p style="color:#888;font-size:13px;">No custom templates yet</p>';
  } else {
    customTemplates.forEach((template, index) => {
      const div = document.createElement('div');
      div.className = 'template-card';
      div.innerHTML = `
        <div class="template-info">
          <div class="template-name">⚙️ ${template.name}</div>
          <div class="template-url">${template.urlPattern}</div>
        </div>
        <button class="btn-secondary" onclick="deleteTemplate(${index})" style="padding:6px 12px;font-size:12px;">Delete</button>
      `;
      customTemplatesList.appendChild(div);
    });
  }
}

window.deleteTemplate = async function(index) {
  if (confirm('Delete this template?')) {
    settings.customTemplates.splice(index, 1);
    await saveSettings();
    renderTemplates();
    renderDashboard();
  }
};

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
  
  renderTemplates();
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
    await saveSettings();
    updateUI();
  }
});

async function saveSettings() {
  await chrome.runtime.sendMessage({ 
    type: 'SAVE_SETTINGS', 
    settings: settings 
  });
}

loadSettings();
