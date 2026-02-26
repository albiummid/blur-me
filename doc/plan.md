# Blur Me - Browser Extension Implementation Plan

## 1. Project Overview

A browser extension that allows users to configure which elements to blur on websites, with pre-built templates for popular sites and custom template creation capability.

## 2. Architecture

### File Structure
```
blur-me/
├── manifest.json           # Extension manifest (V3)
├── popup/
│   ├── popup.html         # Main popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
├── options/
│   ├── options.html       # Full settings page
│   ├── options.js         # Settings logic
│   └── options.css        # Options styles
├── content/
│   ├── content.js         # Content script (blur logic)
│   └── content.css        # Injected blur styles
├── background/
│   └── background.js      # Service worker (storage, messaging)
├── templates/
│   ├── whatsapp.json      # Pre-built templates
│   └── facebook.json
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/              # Internationalization
```

## 3. Blur Item Types (Selectable)

| Category | Elements | Default Selector |
|----------|----------|------------------|
| Images | `<img>`, `picture`, `[role="img"]` | `img, picture, [role="img"], [data-bg-image]` |
| Videos | `<video>`, `<iframe>`, `[role="video"]` | `video, iframe[src*="youtube"], iframe[src*="vimeo"]` |
| Text | Paragraphs, headings, spans | `p, h1-h6, span, li, td, th` |
| Profile | Avatars, user images | `[class*="avatar"], [class*="profile"], [data-testid*="avatar"]` |
| Comments | Comment sections | `[class*="comment"], [data-testid*="comment"]` |
| Messages | Chat messages | `[class*="message"], [data-testid*="message"]` |
| Forms | Inputs, textareas | `input, textarea, select` |
| Buttons | Clickable elements | `button, [role="button"], a.btn` |
| Custom | User-defined CSS | Custom selector input |

## 4. Blur Styles (Configurable per type)

- **Blur Level**: 1-20px (slider)
- **Blur Type**: Gaussian blur, Pixelate, Frosted glass, Blackout
- **Hover Behavior**: Reveal on hover (toggle)
- **Click Behavior**: Permanent reveal on click (toggle)

## 5. Website Templates

### Pre-built Templates (Initial)
| Website | Target URL Pattern | Enabled Blur Items |
|---------|-------------------|-------------------|
| WhatsApp Web | `web.whatsapp.com` | Messages, Profile, Status |
| Facebook | `facebook.com`, `fb.com` | Posts, Comments, Profile, Stories |

### Custom Template Schema
```json
{
  "name": "Custom Site",
  "urlPattern": "example.com/*",
  "enabledItems": ["images", "text", "profile"],
  "selectors": {
    "images": [".custom-img", "[data-custom]"],
    "text": [".custom-text"],
    "profile": [".user-avatar"]
  },
  "blurSettings": {
    "images": { "type": "gaussian", "level": 5 },
    "text": { "type": "pixelate", "level": 3 }
  }
}
```

## 6. Storage Schema

```javascript
{
  "globalEnabled": boolean,
  "globalBlurLevel": number,
  "globalBlurType": "gaussian" | "pixelate" | "frosted" | "blackout",
  
  "itemSettings": {
    "images": { "enabled": boolean, "level": number, "type": string },
    "videos": { "enabled": boolean, "level": number, "type": string },
    "text": { "enabled": boolean, "level": number, "type": string },
    "profile": { "enabled": boolean, "level": number, "type": string },
    "comments": { "enabled": boolean, "level": number, "type": string },
    "messages": { "enabled": boolean, "level": number, "type": string },
    "forms": { "enabled": boolean, "level": number, "type": string },
    "buttons": { "enabled": boolean, "level": number, "type": string },
    "custom": { "enabled": boolean, "level": number, "type": string, "selectors": [] }
  },
  
  "siteSettings": {
    "web.whatsapp.com": { "enabled": boolean, "itemOverrides": {} }
  },
  
  "customTemplates": []
}
```

## 7. UI/UX Design

### Popup (Quick Access)
- Toggle ON/OFF for entire extension
- Quick preset selector
- Mini dashboard showing active blur items
- "Open Settings" button

### Options Page Tabs
1. Dashboard - Overview of enabled sites
2. Items - Configure which element types to blur
3. Templates - Manage website templates
4. Blur Settings - Configure intensity, type, behaviors
5. Import/Export - Backup and restore settings

## 8. Development Phases

### Phase 1: Foundation
- [ ] Project structure setup
- [ ] manifest.json
- [ ] Storage system
- [ ] Basic popup UI

### Phase 2: Core Blur Functionality
- [ ] Content script with CSS injection
- [ ] MutationObserver for dynamic content
- [ ] Blur level/type controls
- [ ] Hover/click reveal

### Phase 3: Template System
- [ ] Pre-built templates (WhatsApp, Facebook)
- [ ] Custom template editor
- [ ] URL pattern matching

### Phase 4: UI Polish
- [ ] Full options page
- [ ] Import/Export functionality

### Phase 5: Testing
- [ ] Cross-browser testing

## 9. Technical Notes

- Manifest V3
- Vanilla JavaScript (no framework)
- Chrome Storage API for persistence
- CSS filter for blurring
- MutationObserver for dynamic content
