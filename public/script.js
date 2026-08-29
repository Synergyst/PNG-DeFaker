(() => {
  'use strict';

  const PREFS_KEY = 'png-defaker.preferences.v7';
  const LEGACY_PREF_KEYS = ['png-defaker.preferences.v6', 'png-defaker.preferences.v5', 'png-defaker.preferences.v4', 'pdf_prefs'];
  const DB_NAME = 'png-defaker-assets';
  const DB_VERSION = 1;
  const DB_STORE = 'images';
  const MIN_WIDTH = 280;
  const MIN_HEIGHT = 180;
  const $ = (selector, root = document) => root.querySelector(selector);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const DEFAULTS = {
    version: 7,
    method: 'global',
    bgColor: '#ffffff',
    tolerance: 10,
    feather: 0,
    brushMode: 'keep',
    brushSize: 32,
    sliderPercent: 50,
    loupeEnabled: false,
    loupeMagnification: 3,
    uiScale: 1,
    panes: {},
    layoutProfiles: { desktop: {}, mobile: {} },
    grid: { size: 16, colorA: '#2a2a2a', colorB: '#3a3a3a' }
  };

  const whimsyPool = [
    '> ASKING THE PIXELS TO FORM AN ORDERLY QUEUE... THEY REFUSE',
    '> CHECKING THE CACHE FOR LOST SOCKS... STILL A MATCHING PAIR SHORT',
    '> DOWNLOADING EXTRA RAM FROM THE MOON... SIGNAL IS SPARKLY',
    '> NEGOTIATING WITH THE GPU... IT WANTS A SNACK',
    '> CONSULTING THE NEON ORACLE ABOUT TRANSPARENCY... IT SAYS MAYBE',
    '> POLISHING THE ALPHA CHANNEL WITH A TINY DIGITAL CLOTH',
    '> COUNTING PIXELS... LOST COUNT AT 4,294,967,296',
    '> ASKING THE BACKGROUND TO LEAVE POLITELY... SUCCESS',
    '> ACTIVATING THE ANTI-CHECKERBOARD CHECKERBOARD',
    '> FILING A COMPLAINT AGAINST JPEG ARTIFACTS... FORM ACCEPTED',
    '> TELLING THE EDGE PIXELS THEY ARE DOING GREAT',
    '> SUMMONING A SMALL, RESPONSIBLE COMPUTER VISION GHOST',
    '> REMINDING THE CANVAS THAT THE GRID IS FOR DISPLAY ONLY',
    '> SEARCHING FOR A SINGLE HONEST PNG... FOUND ONE IN THE MIRROR',
    '> CALIBRATING VIBES... VIBES ARE WITHIN TOLERANCE',
    '> REMOVING INVISIBLE DUST FROM THE ALPHA BUFFER',
    '> RUNNING PIXEL ETIQUETTE TRAINING... EVERYONE SAYS PLEASE',
    '> CHECKING WHETHER THIS IS ART OR A VERY CONFIDENT SCREENSHOT',
    '> REASSURING THE TRANSPARENCY GRID IT WILL NOT BE EXPORTED',
    '> PUTTING THE TINY HAMSTER GPU ON A QUICK BREAK',
    '> DETECTING BACKGROUND MISCHIEF... MISCHIEF DETECTED',
    '> ALIGNING THE BEFORE AND AFTER UNIVERSES... NO COLLISIONS',
    '> CONVINCING OPENCV THAT THIS IS DEFINITELY AN IMAGE',
    '> SHAKING THE PIXELS GENTLY... PLEASE HOLD ONTO YOUR EDGES',
    '> APPLYING A VERY PROFESSIONAL AMOUNT OF CYBERPUNK',
    '> THE ALPHA CHANNEL HAS REQUESTED MORE PERSONAL SPACE',
    '> CHECKING FOR PHANTOM WHITE... PHANTOM WHITE LOCATED',
    '> DEPLOYING TACTICAL TRANSPARENCY... IT LOOKS FABULOUS',
    '> TEACHING THE MASK TO COLOR INSIDE THE LINES',
    '> NOTHING TO SEE HERE, JUST SOME EXTREMELY TIDY PIXELS'
  ];

  const criticalMessages = [
    '> INITIALIZING PNG-DEFaker WORKSPACE...',
    '> LOADING HTML5 IMAGE BUFFER... DONE',
    '> CONNECTING CANVAS PIXEL PIPELINE... DONE',
    '> CHECKING OPENCV WASM CORE... READY WHEN NEEDED',
    '> MOUNTING LOCAL-ONLY FILE INGESTION... DONE',
    '> BUILDING TRANSPARENCY VISUALIZER... DONE',
    '> ALIGNING BEFORE / AFTER COMPARISON RAILS... DONE',
    '> ACCESS GRANTED. ALPHA RECOVERY CONSOLE ONLINE.'
  ];

  const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULTS));

  function normalisePrefs(raw = {}) {
    const base = cloneDefaults();
    const panes = raw.panes || raw.paneState || {};
    const profiles = raw.layoutProfiles || base.layoutProfiles;
    const result = {
      ...base,
      ...raw,
      version: 7,
      panes,
      layoutProfiles: {
        desktop: { ...(profiles.desktop || {}) },
        mobile: { ...(profiles.mobile || {}) }
      },
      grid: { ...base.grid, ...(raw.grid || {}) },
      tolerance: Math.max(0, Math.min(160, numeric(raw.tolerance, base.tolerance))),
      feather: Math.max(0, Math.min(12, numeric(raw.feather, base.feather))),
      brushSize: Math.max(4, Math.min(160, numeric(raw.brushSize, base.brushSize))),
      loupeMagnification: Math.max(2, Math.min(8, numeric(raw.loupeMagnification, base.loupeMagnification))),
      sliderPercent: Math.max(0, Math.min(100, numeric(raw.sliderPercent, base.sliderPercent))),
      uiScale: Math.max(0.85, Math.min(1.2, numeric(raw.uiScale, base.uiScale)))
    };
    if (!['global', 'flood', 'checker', 'lumina', 'contour'].includes(result.method)) result.method = base.method;
    if (!['keep', 'remove'].includes(result.brushMode)) result.brushMode = base.brushMode;
    if (!/^#[0-9a-f]{6}$/i.test(result.bgColor)) result.bgColor = base.bgColor;
    if (!/^#[0-9a-f]{6}$/i.test(result.grid.colorA)) result.grid.colorA = base.grid.colorA;
    if (!/^#[0-9a-f]{6}$/i.test(result.grid.colorB)) result.grid.colorB = base.grid.colorB;
    return result;
  }

  function readPrefs() {
    for (const key of [PREFS_KEY, ...LEGACY_PREF_KEYS]) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const prefs = normalisePrefs(JSON.parse(raw));
        writePrefs(prefs);
        return prefs;
      } catch { /* Keep trying older profiles or safe defaults. */ }
    }
    return cloneDefaults();
  }

  function writePrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(normalisePrefs(prefs))); }
    catch { /* Storage failures must not prevent local image processing. */ }
  }

  function patchPrefs(patch) {
    const next = normalisePrefs({ ...readPrefs(), ...patch });
    writePrefs(next);
    return next;
  }

  function numeric(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function runBoot() {
    const boot = $('#boot-screen');
    const app = $('#app-screen');
    const output = $('#terminal-output');
    if (!boot || !app || !output) return Promise.resolve();
    const print = text => new Promise(resolve => {
      let index = 0;
      const timer = setInterval(() => {
        output.append(document.createTextNode(text[index++] || ''));
        if (index >= text.length) {
          clearInterval(timer);
          output.append(document.createElement('br'));
          resolve();
        }
      }, 4);
    });
    return (async () => {
      for (let i = 0; i < criticalMessages.length; i += 1) {
        if (i > 0 && Math.random() < 0.58) await print(whimsyPool[Math.floor(Math.random() * whimsyPool.length)]);
        await print(criticalMessages[i]);
        await wait(55);
      }
      await wait(250);
      boot.classList.add('is-closing');
      await wait(350);
      boot.classList.add('hidden');
      boot.setAttribute('aria-hidden', 'true');
      app.classList.remove('hidden');
      app.setAttribute('aria-hidden', 'false');
    })();
  }

  function openImageDB() {
    return new Promise(resolve => {
      if (!('indexedDB' in window)) { resolve(null); return; }
      let request;
      try { request = indexedDB.open(DB_NAME, DB_VERSION); }
      catch { resolve(null); return; }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }

  async function saveLastImage(file) {
    const db = await openImageDB();
    if (!db) return;
    await new Promise(resolve => {
      const transaction = db.transaction(DB_STORE, 'readwrite');
      transaction.objectStore(DB_STORE).put({ blob: file, name: file.name || 'image', type: file.type }, 'last');
      transaction.oncomplete = resolve;
      transaction.onerror = resolve;
      transaction.onabort = resolve;
    });
    db.close();
  }

  async function loadLastImage() {
    const db = await openImageDB();
    if (!db) return null;
    const record = await new Promise(resolve => {
      const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get('last');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
    db.close();
    return record;
  }

  async function clearLastImage() {
    const db = await openImageDB();
    if (!db) return;
    try {
      await new Promise(resolve => {
        const transaction = db.transaction(DB_STORE, 'readwrite');
        transaction.objectStore(DB_STORE).delete('last');
        transaction.oncomplete = resolve;
        transaction.onerror = resolve;
        transaction.onabort = resolve;
      });
    } catch { /* Storage failures must not prevent the page from resetting. */ }
    db.close();
  }

  class PaneManager {
    constructor(workspace) {
      this.workspace = workspace;
      this.panes = [...workspace.querySelectorAll('.cyber-window')].map(el => this.attach(el));
      this.activeProfile = this.profileName();
      this.applyScale(readPrefs().uiScale);
      window.addEventListener('resize', () => this.handleViewportResize());
    }

    profileName() { return window.innerWidth <= 760 ? 'mobile' : 'desktop'; }

    applyProfile(profileName = this.profileName()) {
      const prefs = readPrefs();
      const profile = prefs.layoutProfiles?.[profileName] || {};
      this.panes.forEach(pane => {
        const saved = profile[pane.el.id] || (profileName === 'desktop' ? prefs.panes?.[pane.el.id] : null);
        if (saved) {
          const config = this.configFor(pane.el.id);
          pane.el.style.left = `${Math.max(0, numeric(saved.left, 0))}px`;
          pane.el.style.top = `${Math.max(0, numeric(saved.top, 0))}px`;
          pane.el.style.width = `${Math.max(config.minWidth, numeric(saved.width, config.minWidth))}px`;
          pane.el.style.height = `${Math.max(config.minHeight, numeric(saved.height, config.minHeight))}px`;
        } else {
          pane.el.style.removeProperty('left');
          pane.el.style.removeProperty('top');
          pane.el.style.removeProperty('width');
          pane.el.style.removeProperty('height');
        }
      });
    }

    handleViewportResize() {
      const nextProfile = this.profileName();
      if (nextProfile === this.activeProfile) {
        this.constrainAll();
        return;
      }
      this.activeProfile = nextProfile;
      this.applyProfile(nextProfile);
      requestAnimationFrame(() => this.constrainAll());
    }

    configFor(id) {
      const mobile = this.profileName() === 'mobile';
      const defaults = {
        'win-upload': { minWidth: mobile ? 220 : 360, minHeight: mobile ? 250 : 300 },
        'win-controls': { minWidth: mobile ? 220 : 360, minHeight: mobile ? 700 : 460 },
        'win-preview': { minWidth: mobile ? 220 : 560, minHeight: mobile ? 420 : 430 }
      };
      return defaults[id] || { minWidth: mobile ? 220 : MIN_WIDTH, minHeight: mobile ? 180 : MIN_HEIGHT };
    }

    attach(el) {
      const pane = { el, header: $('[data-drag-handle]', el), grip: $('.resize-grip', el) };
      const prefs = readPrefs();
      const profile = prefs.layoutProfiles?.[this.profileName()] || {};
      const saved = profile[el.id] || (this.profileName() === 'desktop' ? prefs.panes?.[el.id] : null);
      const config = this.configFor(el.id);
      if (saved) {
        el.style.left = `${Math.max(0, numeric(saved.left, 0))}px`;
        el.style.top = `${Math.max(0, numeric(saved.top, 0))}px`;
        el.style.width = `${Math.max(config.minWidth, numeric(saved.width, config.minWidth))}px`;
        el.style.height = `${Math.max(config.minHeight, numeric(saved.height, config.minHeight))}px`;
      }
      this.bindDrag(pane);
      this.bindResize(pane);
      el.addEventListener('pointerdown', () => this.activate(pane), { passive: true });
      return pane;
    }

    activate(pane) {
      this.panes.forEach(item => item.el.classList.toggle('is-active', item === pane));
      this.panes.forEach(item => { item.el.style.zIndex = item === pane ? '50' : ''; });
    }

    scale() { return this.workspace.getBoundingClientRect().width / Math.max(this.workspace.offsetWidth, 1) || 1; }

    clamp(pane, left, top, width = pane.el.offsetWidth, height = pane.el.offsetHeight) {
      const config = this.configFor(pane.el.id);
      const scale = this.scale();
      const availableWidth = Math.max(config.minWidth, this.workspace.clientWidth / scale - 20);
      const availableHeight = Math.max(config.minHeight, this.workspace.clientHeight / scale);
      const safeWidth = Math.min(availableWidth, Math.max(config.minWidth, width || config.minWidth));
      const safeHeight = Math.min(availableHeight, Math.max(config.minHeight, height || config.minHeight));
      return {
        left: Math.max(0, Math.min(left, Math.max(0, availableWidth - safeWidth))),
        top: Math.max(0, Math.min(top, Math.max(0, availableHeight - safeHeight))),
        width: safeWidth,
        height: safeHeight
      };
    }

    bindDrag(pane) {
      if (!pane.header) return;
      pane.header.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('button, input, select')) return;
        event.preventDefault();
        this.activate(pane);
        const scale = this.scale();
        const start = { left: pane.el.offsetLeft, top: pane.el.offsetTop, x: event.clientX, y: event.clientY };
        pane.header.setPointerCapture?.(event.pointerId);
        const move = moveEvent => {
          const next = this.clamp(pane, start.left + (moveEvent.clientX - start.x) / scale, start.top + (moveEvent.clientY - start.y) / scale);
          pane.el.style.left = `${Math.round(next.left)}px`;
          pane.el.style.top = `${Math.round(next.top)}px`;
        };
        const end = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', end);
          pane.header.releasePointerCapture?.(event.pointerId);
          this.savePane(pane);
          this.wobbleOthers(pane);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
      });
    }

    bindResize(pane) {
      if (!pane.grip) return;
      pane.grip.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        this.activate(pane);
        const scale = this.scale();
        const start = { width: pane.el.offsetWidth, height: pane.el.offsetHeight, x: event.clientX, y: event.clientY };
        pane.grip.setPointerCapture?.(event.pointerId);
        const move = moveEvent => {
          const next = this.clamp(pane, pane.el.offsetLeft, pane.el.offsetTop, start.width + (moveEvent.clientX - start.x) / scale, start.height + (moveEvent.clientY - start.y) / scale);
          pane.el.style.width = `${Math.round(next.width)}px`;
          pane.el.style.height = `${Math.round(next.height)}px`;
        };
        const end = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', end);
          pane.grip.releasePointerCapture?.(event.pointerId);
          this.savePane(pane);
          this.wobbleOthers(pane);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
      });
    }

    savePane(pane) {
      const prefs = readPrefs();
      const profile = this.profileName();
      prefs.layoutProfiles ||= { desktop: {}, mobile: {} };
      prefs.layoutProfiles[profile] ||= {};
      const next = this.clamp(pane, pane.el.offsetLeft, pane.el.offsetTop, pane.el.offsetWidth, pane.el.offsetHeight);
      const geometry = { left: next.left, top: next.top, width: next.width, height: next.height };
      prefs.layoutProfiles[profile][pane.el.id] = geometry;
      prefs.panes ||= {};
      prefs.panes[pane.el.id] = geometry;
      writePrefs(prefs);
    }

    wobbleOthers(movedPane) {
      this.panes.forEach(pane => {
        if (pane !== movedPane && !pane.el.classList.contains('hidden')) {
          pane.el.classList.remove('wobble');
          void pane.el.offsetWidth;
          pane.el.classList.add('wobble');
          setTimeout(() => pane.el.classList.remove('wobble'), 450);
        }
      });
    }

    constrainAll(persist = false) {
      // The app starts hidden behind the boot screen; do not clamp panes against a 0px workspace.
      if (!this.workspace.clientWidth || !this.workspace.clientHeight) return;
      this.panes.forEach(pane => {
        if (pane.el.classList.contains('hidden')) return;
        const next = this.clamp(pane, pane.el.offsetLeft, pane.el.offsetTop, pane.el.offsetWidth, pane.el.offsetHeight);
        pane.el.style.left = `${Math.round(next.left)}px`;
        pane.el.style.top = `${Math.round(next.top)}px`;
        pane.el.style.width = `${Math.round(next.width)}px`;
        pane.el.style.height = `${Math.round(next.height)}px`;
        if (persist) this.savePane(pane);
      });
    }

    applyScale(value) {
      const scale = Math.max(0.85, Math.min(1.2, numeric(value, 1)));
      document.documentElement.style.setProperty('--ui-scale', String(scale));
      const control = $('#ui-scale');
      const output = $('#ui-scale-val');
      if (control) control.value = String(Math.round(scale * 100));
      if (output) output.value = `${Math.round(scale * 100)}%`;
    }

    setScale(value) {
      const scale = Math.max(0.85, Math.min(1.2, numeric(value, 100) / 100));
      this.applyScale(scale);
      const prefs = readPrefs();
      prefs.uiScale = scale;
      writePrefs(prefs);
      requestAnimationFrame(() => this.constrainAll(true));
    }

    async reset() {
      try {
        [PREFS_KEY, ...LEGACY_PREF_KEYS].forEach(key => localStorage.removeItem(key));
      } catch { /* Continue with image cleanup even when storage is unavailable. */ }
      await clearLastImage();
      window.location.reload();
    }
  }

  function initApp() {
    const workspace = $('#workspace');
    const dropZone = $('#drop-zone');
    const fileInput = $('#file-input');
    const controlsPane = $('#win-controls');
    const previewPane = $('#win-preview');
    const canvas = $('#canvas-result');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const original = $('#img-orig');
    const comparison = $('#comparison-slider');
    const afterLayer = $('#after-layer');
    const maskOverlay = $('#mask-overlay');
    const maskContext = maskOverlay.getContext('2d');
    const handle = $('#slider-handle');
    const status = $('#sys-status');
    const memory = $('#sys-mem');
    const method = $('#method-select');
    const bgColor = $('#bg-color');
    const sampleBg = $('#sample-bg');
    const tolerance = $('#tolerance');
    const toleranceOutput = $('#tol-val');
    const feather = $('#feather');
    const featherOutput = $('#feather-val');
    const processButton = $('#process-btn');
    const downloadButton = $('#download-btn');
    const modal = $('#modal-overlay');
    const modalBody = $('#modal-body');
    const modalImage = $('#modal-img');
    const zoomContainer = $('#zoom-container');
    const zoomLevel = $('#zoom-level');
    const gridSize = $('#grid-size');
    const gridSizeOutput = $('#grid-size-val');
    const gridColorA = $('#grid-color-1');
    const gridColorB = $('#grid-color-2');
    const showMask = $('#show-mask');
    const resetMask = $('#reset-mask');
    const brushMode = $('#brush-mode');
    const brushSize = $('#brush-size');
    const brushSizeOutput = $('#brush-size-val');
    const loupe = $('#loupe');
    const loupeCanvas = $('#loupe-canvas');
    const loupeContext = loupeCanvas.getContext('2d');
    const loupePower = $('#loupe-power');
    const loupeMagnificationInput = $('#loupe-magnification');
    const loupeMagnificationOutput = $('#loupe-magnification-val');
    const loupeToggle = $('#loupe-toggle');
    const largePreviewButton = $('#open-modal-btn-bottom');
    const resultMeta = $('#result-meta');
    if (!workspace || !dropZone || !canvas || !maskOverlay) return null;

    const prefs = readPrefs();
    const paneManager = new PaneManager(workspace);
    let sourceImage = null;
    let currentFileName = 'defaked_alpha_restore';
    let sourceData = null;
    let processedData = null;
    let maskData = null;
    let baselineProcessedData = null;
    let baselineMaskData = null;
    let sliderPercent = prefs.sliderPercent;
    let loupeEnabled = prefs.loupeEnabled === true;
    let loupeMagnification = prefs.loupeMagnification;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let panState = null;
    let lastPointer = { x: 0, y: 0 };
    let processingTimer = 0;
    let painting = false;

    const setStatus = value => { if (status) status.textContent = value; };
    const savePreference = (key, value) => patchPrefs({ [key]: value });

    function updateSlider(percent, persist = true) {
      sliderPercent = Math.max(0, Math.min(100, numeric(percent, 50)));
      afterLayer.style.clipPath = `inset(0 0 0 ${sliderPercent}%)`;
      handle.style.left = `${sliderPercent}%`;
      comparison.setAttribute('aria-valuenow', String(Math.round(sliderPercent)));
      if (persist) savePreference('sliderPercent', sliderPercent);
    }

    function moveSlider(clientX) {
      const rect = comparison.getBoundingClientRect();
      if (rect.width) updateSlider(((clientX - rect.left) / rect.width) * 100, false);
    }

    comparison.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target === maskOverlay || event.target.closest('button')) return;
      event.preventDefault();
      comparison.setPointerCapture?.(event.pointerId);
      moveSlider(event.clientX);
    });
    comparison.addEventListener('pointermove', event => {
      if (comparison.hasPointerCapture?.(event.pointerId)) moveSlider(event.clientX);
      if (loupeEnabled && !painting) updateLoupeAt(event.clientX, event.clientY);
    });
    comparison.addEventListener('pointerup', event => {
      savePreference('sliderPercent', sliderPercent);
      if (comparison.hasPointerCapture?.(event.pointerId)) comparison.releasePointerCapture(event.pointerId);
      painting = false;
    });
    comparison.addEventListener('pointercancel', event => {
      painting = false;
      savePreference('sliderPercent', sliderPercent);
      if (comparison.hasPointerCapture?.(event.pointerId)) comparison.releasePointerCapture(event.pointerId);
    });
    comparison.addEventListener('pointerenter', event => { if (loupeEnabled) { loupe.classList.remove('hidden'); updateLoupeAt(event.clientX, event.clientY); } });
    comparison.addEventListener('pointerleave', () => { if (loupeEnabled && !painting) loupe.classList.add('hidden'); });
    comparison.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') updateSlider(0);
      else if (event.key === 'End') updateSlider(100);
      else updateSlider(sliderPercent + (event.key === 'ArrowRight' ? 2 : -2));
    });

    function getRGB(hex) { return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) }; }
    function distance(a, b) { return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b); }

    function globalStrip(data, target, limit) {
      let changed = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0 && distance({ r: data[i], g: data[i + 1], b: data[i + 2] }, target) <= limit) {
          data[i + 3] = 0;
          changed += 1;
        }
      }
      return changed;
    }

    function smartFlood(data, width, height, target, limit) {
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let headIndex = 0;
      let tailIndex = 0;
      let changed = 0;
      const starts = [0, width - 1, (height - 1) * width, height * width - 1];
      const matches = index => data[index * 4 + 3] > 0 && distance({ r: data[index * 4], g: data[index * 4 + 1], b: data[index * 4 + 2] }, target) <= limit;
      starts.forEach(index => { if (!visited[index] && matches(index)) { visited[index] = 1; queue[tailIndex++] = index; } });
      while (headIndex < tailIndex) {
        const index = queue[headIndex++];
        if (data[index * 4 + 3] > 0) { data[index * 4 + 3] = 0; changed += 1; }
        const x = index % width;
        const y = Math.floor(index / width);
        const neighbors = [index - 1, index + 1, index - width, index + width];
        if (x === 0) neighbors[0] = -1;
        if (x === width - 1) neighbors[1] = -1;
        if (y === 0) neighbors[2] = -1;
        if (y === height - 1) neighbors[3] = -1;
        neighbors.forEach(next => { if (next >= 0 && next < width * height && !visited[next] && matches(next)) { visited[next] = 1; queue[tailIndex++] = next; } });
      }
      return changed;
    }

    function checkerboardMask(data, width, height, target, limit) {
      const pixelCount = width * height;
      const candidate = new Uint8Array(pixelCount);
      const colors = new Map();
      const samplePoints = [];
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 10))) {
        for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 10))) {
          if (x < width * 0.16 || x > width * 0.84 || y < height * 0.16 || y > height * 0.84) samplePoints.push((y * width + x) * 4);
        }
      }
      samplePoints.forEach(i => {
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colors.set(key, (colors.get(key) || 0) + 1);
      });
      const topColors = [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(entry => entry[0].split(',').map(Number));
      if (topColors.length < 2) return 0;
      for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
        if (data[i + 3] > 0 && topColors.some(pair => distance(color, { r: pair[0], g: pair[1], b: pair[2] }) <= limit)) candidate[p] = 1;
      }
      const visited = new Uint8Array(pixelCount);
      const queue = new Int32Array(pixelCount);
      let changed = 0;
      const isCandidate = index => candidate[index] === 1;
      for (let start = 0; start < pixelCount; start += 1) {
        if (!isCandidate(start) || visited[start]) continue;
        let head = 0; let tail = 0; let touchesBorder = false;
        queue[tail++] = start; visited[start] = 1;
        while (head < tail) {
          const index = queue[head++];
          const x = index % width; const y = Math.floor(index / width);
          if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
          const neighbors = [index - 1, index + 1, index - width, index + width];
          if (x === 0) neighbors[0] = -1;
          if (x === width - 1) neighbors[1] = -1;
          if (y === 0) neighbors[2] = -1;
          if (y === height - 1) neighbors[3] = -1;
          neighbors.forEach(next => { if (next >= 0 && next < pixelCount && isCandidate(next) && !visited[next]) { visited[next] = 1; queue[tail++] = next; } });
        }
        if (touchesBorder) {
          for (let i = 0; i < tail; i += 1) { const index = queue[i]; if (data[index * 4 + 3] > 0) { data[index * 4 + 3] = 0; changed += 1; } }
        }
      }
      return changed;
    }

    function luminanceMask(data, target, limit) {
      const targetLum = 0.299 * target.r + 0.587 * target.g + 0.114 * target.b;
      let changed = 0;
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (data[i + 3] > 0 && Math.abs(lum - targetLum) <= limit) { data[i + 3] = 0; changed += 1; }
      }
      return changed;
    }

    function contourMask(imageData) {
      if (typeof cv === 'undefined' || !cv.Mat) throw new Error('OpenCV is still loading. Try again in a moment.');
      const src = cv.matFromImageData(imageData);
      const gray = new cv.Mat(); const blurred = new cv.Mat(); const thresholded = new cv.Mat();
      const contours = new cv.MatVector(); const hierarchy = new cv.Mat(); const mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
      let changed = 0;
      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.threshold(blurred, thresholded, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
        cv.findContours(thresholded, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        if (!contours.size()) return 0;
        let largest = 0; let largestArea = 0;
        for (let i = 0; i < contours.size(); i += 1) {
          const contour = contours.get(i);
          try {
            const area = cv.contourArea(contour);
            if (area > largestArea) { largestArea = area; largest = i; }
          } finally { contour.delete(); }
        }
        cv.drawContours(mask, contours, largest, new cv.Scalar(255), -1);
        for (let i = 0; i < imageData.data.length; i += 4) if (mask.data[i / 4] === 0 && imageData.data[i + 3] > 0) { imageData.data[i + 3] = 0; changed += 1; }
        return changed;
      } finally { [src, gray, blurred, thresholded, contours, hierarchy, mask].forEach(item => item.delete()); }
    }

    function buildMaskPreview() {
      if (!maskData) return;
      maskOverlay.width = canvas.width;
      maskOverlay.height = canvas.height;
      const preview = new ImageData(new Uint8ClampedArray(maskData.length * 4), canvas.width, canvas.height);
      for (let i = 0; i < maskData.length; i += 1) {
        const value = maskData[i];
        preview.data[i * 4] = value > 0 ? 60 : 255;
        preview.data[i * 4 + 1] = value > 0 ? 255 : 40;
        preview.data[i * 4 + 2] = value > 0 ? 130 : 70;
        preview.data[i * 4 + 3] = 105;
      }
      maskContext.putImageData(preview, 0, 0);
    }

    function applyFeather(data, width, height, radius) {
      if (!radius) return;
      const sourceAlpha = new Uint8ClampedArray(width * height);
      for (let i = 0; i < sourceAlpha.length; i += 1) sourceAlpha[i] = data[i * 4 + 3];
      const radiusSquared = radius * radius;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = y * width + x;
          if (sourceAlpha[index] !== 0) continue;
          let nearestSquared = radiusSquared + 1;
          for (let dy = -radius; dy <= radius; dy += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
              const distanceSquared = dx * dx + dy * dy;
              if (distanceSquared >= nearestSquared) continue;
              const nx = x + dx; const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && sourceAlpha[ny * width + nx] > 0) nearestSquared = distanceSquared;
            }
          }
          if (nearestSquared <= radiusSquared) {
            const distance = Math.sqrt(nearestSquared);
            data[index * 4 + 3] = Math.max(1, Math.round(255 * (1 - distance / (radius + 1))));
          }
        }
      }
    }

    function applyProcessing() {
      if (!sourceData || !sourceImage) return;
      setStatus('PROCESSING');
      let imageData;
      let changed = 0;
      const target = getRGB(bgColor.value);
      const limit = numeric(tolerance.value, 10);
      try {
        imageData = new ImageData(new Uint8ClampedArray(sourceData.data), sourceData.width, sourceData.height);
        if (method.value === 'global') changed = globalStrip(imageData.data, target, limit);
        else if (method.value === 'flood') changed = smartFlood(imageData.data, imageData.width, imageData.height, target, limit);
        else if (method.value === 'checker') changed = checkerboardMask(imageData.data, imageData.width, imageData.height, target, limit);
        else if (method.value === 'lumina') changed = luminanceMask(imageData.data, target, limit);
        else changed = contourMask(imageData);
        applyFeather(imageData.data, imageData.width, imageData.height, numeric(feather.value, 0));
        baselineProcessedData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
        baselineMaskData = new Uint8Array(imageData.width * imageData.height);
        for (let i = 0; i < baselineMaskData.length; i += 1) baselineMaskData[i] = imageData.data[i * 4 + 3] === 0 ? 0 : 1;
        processedData = new ImageData(new Uint8ClampedArray(baselineProcessedData.data), baselineProcessedData.width, baselineProcessedData.height);
        maskData = new Uint8Array(baselineMaskData);
        context.putImageData(processedData, 0, 0);
        const percentage = ((changed / (imageData.width * imageData.height)) * 100).toFixed(1);
        resultMeta.textContent = changed ? `AFTER BUFFER // ${method.options[method.selectedIndex].text} // ${percentage}% PIXELS MADE TRANSPARENT` : 'AFTER BUFFER // NO PIXELS CHANGED // TRY A HIGHER TOLERANCE OR ANOTHER METHOD';
        setStatus(changed ? 'RESTORED' : 'NO_CHANGE');
        if (showMask.getAttribute('aria-pressed') === 'true') buildMaskPreview();
        if (loupeEnabled) drawLoupe(lastPointer.x, lastPointer.y);
      } catch (error) { setStatus('PROCESSING_ERROR'); window.alert(error.message); }
    }

    function resetCurrentMask() {
      if (!baselineProcessedData || !baselineMaskData) return;
      processedData = new ImageData(new Uint8ClampedArray(baselineProcessedData.data), baselineProcessedData.width, baselineProcessedData.height);
      maskData = new Uint8Array(baselineMaskData);
      context.putImageData(processedData, 0, 0);
      resultMeta.textContent = 'AFTER BUFFER // BASELINE MASK RESTORED';
      if (showMask.getAttribute('aria-pressed') === 'true') buildMaskPreview();
      setStatus('MASK_RESET');
    }

    function scheduleProcessing() { clearTimeout(processingTimer); processingTimer = window.setTimeout(applyProcessing, 120); }

    function loadFile(file, persist = true) {
      if (!file || !file.type?.startsWith('image/')) { setStatus('INVALID_FILE'); return; }
      if (persist) saveLastImage(file).catch(() => {});
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const image = new Image();
        image.addEventListener('load', () => {
          sourceImage = image;
          currentFileName = (file.name || 'defaked_alpha_restore').replace(/\.[^.]+$/, '') || 'defaked_alpha_restore';
          original.src = reader.result;
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          sourceData = context.getImageData(0, 0, canvas.width, canvas.height);
          processedData = null;
          baselineProcessedData = null;
          baselineMaskData = null;
          maskData = null;
          painting = false;
          showMask.setAttribute('aria-pressed', 'false');
          showMask.textContent = 'SHOW MASK';
          maskOverlay.classList.add('hidden');
          maskOverlay.setAttribute('aria-hidden', 'true');
          controlsPane.classList.remove('hidden');
          previewPane.classList.remove('hidden');
          memory.textContent = `${((canvas.width * canvas.height * 4) / (1024 * 1024)).toFixed(2)}MB`;
          $('#drop-title').textContent = file.name || 'IMAGE BUFFER';
          $('#drop-status').textContent = `${canvas.width} × ${canvas.height} // READY`;
          paneManager.constrainAll();
          setStatus('IMAGE_LOADED');
          updateSlider(sliderPercent, false);
          scheduleProcessing();
        });
        image.addEventListener('error', () => setStatus('READ_ERROR'));
        image.src = reader.result;
      });
      reader.readAsDataURL(file);
    }

    let dragDepth = 0;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); event.stopPropagation(); }));
    dropZone.addEventListener('dragenter', event => { if (event.dataTransfer?.types?.includes('Files')) { dragDepth += 1; dropZone.classList.add('is-dragover'); } });
    dropZone.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) dropZone.classList.remove('is-dragover'); });
    dropZone.addEventListener('dragover', event => { if (event.dataTransfer?.types?.includes('Files')) event.dataTransfer.dropEffect = 'copy'; });
    dropZone.addEventListener('drop', event => { dragDepth = 0; dropZone.classList.remove('is-dragover'); loadFile([...event.dataTransfer.files].find(file => file.type.startsWith('image/'))); });
    window.addEventListener('dragover', event => event.preventDefault());
    window.addEventListener('drop', event => { if (!dropZone.contains(event.target)) event.preventDefault(); });
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', event => { loadFile(event.target.files[0]); fileInput.value = ''; });

    sampleBg.addEventListener('click', () => {
      if (!sourceData) return;
      const points = [0, canvas.width - 1, (canvas.height - 1) * canvas.width, canvas.height * canvas.width - 1];
      const average = points.reduce((sum, index) => ({ r: sum.r + sourceData.data[index * 4], g: sum.g + sourceData.data[index * 4 + 1], b: sum.b + sourceData.data[index * 4 + 2] }), { r: 0, g: 0, b: 0 });
      bgColor.value = `#${[average.r / points.length, average.g / points.length, average.b / points.length].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
      savePreference('bgColor', bgColor.value);
      scheduleProcessing();
    });

    function updateGrid() {
      const size = Math.max(4, numeric(gridSize.value, 16));
      const half = size / 2;
      const colorA = gridColorA.value;
      const colorB = gridColorB.value;
      gridSizeOutput.value = String(size);
      afterLayer.style.backgroundColor = colorA;
      afterLayer.style.backgroundImage = `linear-gradient(45deg, ${colorB} 25%, transparent 25%), linear-gradient(-45deg, ${colorB} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${colorB} 75%), linear-gradient(-45deg, transparent 75%, ${colorB} 75%)`;
      afterLayer.style.backgroundSize = `${size}px ${size}px`;
      afterLayer.style.backgroundPosition = `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0`;
      patchPrefs({ grid: { size, colorA, colorB } });
    }

    const savedGrid = prefs.grid;
    gridSize.value = String(savedGrid.size);
    gridColorA.value = savedGrid.colorA;
    gridColorB.value = savedGrid.colorB;
    [gridSize, gridColorA, gridColorB].forEach(input => input.addEventListener('input', updateGrid));
    updateGrid();

    method.value = [...method.options].some(option => option.value === prefs.method) ? prefs.method : 'global';
    bgColor.value = prefs.bgColor;
    tolerance.value = String(prefs.tolerance);
    feather.value = String(prefs.feather);
    brushMode.value = prefs.brushMode;
    brushSize.value = String(prefs.brushSize);
    toleranceOutput.value = tolerance.value;
    featherOutput.value = feather.value;
    brushSizeOutput.value = brushSize.value;
    const saveControls = () => patchPrefs({ method: method.value, bgColor: bgColor.value, tolerance: numeric(tolerance.value, 10), feather: numeric(feather.value, 0), brushMode: brushMode.value, brushSize: numeric(brushSize.value, 32) });
    method.addEventListener('change', () => { saveControls(); scheduleProcessing(); });
    bgColor.addEventListener('input', () => { saveControls(); scheduleProcessing(); });
    tolerance.addEventListener('input', () => { toleranceOutput.value = tolerance.value; saveControls(); scheduleProcessing(); });
    feather.addEventListener('input', () => { featherOutput.value = feather.value; saveControls(); scheduleProcessing(); });
    brushMode.addEventListener('change', saveControls);
    brushSize.addEventListener('input', () => { brushSizeOutput.value = brushSize.value; saveControls(); });
    loupeMagnificationInput.addEventListener('input', () => {
      loupeMagnification = Math.max(2, Math.min(8, numeric(loupeMagnificationInput.value, 3)));
      loupeMagnificationOutput.value = `${loupeMagnification}×`;
      loupePower.textContent = `${loupeMagnification}×`;
      savePreference('loupeMagnification', loupeMagnification);
      if (loupeEnabled) drawLoupe(lastPointer.x, lastPointer.y);
    });
    processButton.addEventListener('click', applyProcessing);
    downloadButton.addEventListener('click', () => {
      if (!processedData) { setStatus('PROCESS_FIRST'); return; }
      canvas.toBlob(blob => {
        if (!blob) { setStatus('EXPORT_ERROR'); return; }
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.download = `${currentFileName}_defaked.png`;
        link.href = url;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus('EXPORTED');
      }, 'image/png');
    });

    function getImageRect() {
      const boxWidth = comparison.clientWidth;
      const boxHeight = comparison.clientHeight;
      const scale = Math.min(boxWidth / canvas.width, boxHeight / canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      return { scale, left: (boxWidth - width) / 2, top: (boxHeight - height) / 2, width, height };
    }

    function positionLoupe(x, y) {
      const radius = loupe.offsetWidth / 2;
      const pad = radius + 10;
      loupe.style.left = `${Math.max(pad, Math.min(comparison.clientWidth - pad, x))}px`;
      loupe.style.top = `${Math.max(pad, Math.min(comparison.clientHeight - pad, y))}px`;
    }

    function drawLoupe(x, y) {
      if (!sourceImage || !loupeEnabled || !canvas.width) return;
      const rect = getImageRect();
      const sourceX = Math.max(0, Math.min(canvas.width, (x - rect.left) / rect.scale));
      const sourceY = Math.max(0, Math.min(canvas.height, (y - rect.top) / rect.scale));
      const size = loupe.offsetWidth || 220;
      const sampleWidth = Math.max(1, size / (loupeMagnification * rect.scale));
      const sampleHeight = Math.max(1, size / (loupeMagnification * rect.scale));
      loupeContext.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
      loupeContext.drawImage(canvas, sourceX - sampleWidth / 2, sourceY - sampleHeight / 2, sampleWidth, sampleHeight, 0, 0, loupeCanvas.width, loupeCanvas.height);
      positionLoupe(x, y);
    }

    function updateLoupeAt(clientX, clientY) {
      const rect = comparison.getBoundingClientRect();
      lastPointer = { x: clientX - rect.left, y: clientY - rect.top };
      if (loupeEnabled) drawLoupe(lastPointer.x, lastPointer.y);
    }

    function setLoupe(enabled) {
      loupeEnabled = enabled;
      loupe.classList.toggle('hidden', !enabled);
      loupe.setAttribute('aria-hidden', String(!enabled));
      loupeToggle.setAttribute('aria-pressed', String(enabled));
      loupeToggle.textContent = `LOUPE: ${enabled ? 'ON' : 'OFF'}`;
      savePreference('loupeEnabled', enabled);
      if (enabled) drawLoupe(lastPointer.x || comparison.clientWidth / 2, lastPointer.y || comparison.clientHeight / 2);
    }
    loupeToggle.addEventListener('click', () => setLoupe(!loupeEnabled));

    function updateZoom() { zoomContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; zoomLevel.value = `${Math.round(zoom * 100)}%`; }
    function resetZoom() { zoom = 1; panX = 0; panY = 0; updateZoom(); }
    let modalReturnFocus = null;
    function closeModal() {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
      modalReturnFocus = null;
    }
    function openModal() {
      if (!sourceImage || !processedData) { setStatus('PROCESS_FIRST'); return; }
      modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      modalImage.src = canvas.toDataURL('image/png');
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      resetZoom();
      $('#close-modal').focus();
    }
    $('#open-modal-btn').addEventListener('click', openModal);
    largePreviewButton.addEventListener('click', openModal);
    $('#close-modal').addEventListener('click', closeModal);
    $('#zoom-in').addEventListener('click', () => { zoom = Math.min(8, zoom + .25); updateZoom(); });
    $('#zoom-out').addEventListener('click', () => { zoom = Math.max(.25, zoom - .25); updateZoom(); });
    $('#zoom-reset').addEventListener('click', resetZoom);
    modalBody.addEventListener('wheel', event => { if (!modal.classList.contains('hidden')) { event.preventDefault(); zoom = Math.max(.25, Math.min(8, zoom + (event.deltaY < 0 ? .15 : -.15))); updateZoom(); } }, { passive: false });
    zoomContainer.addEventListener('pointerdown', event => { if (event.button === 0) { panState = { x: event.clientX, y: event.clientY, panX, panY }; zoomContainer.classList.add('is-panning'); zoomContainer.setPointerCapture?.(event.pointerId); } });
    zoomContainer.addEventListener('pointermove', event => { if (panState) { panX = panState.panX + event.clientX - panState.x; panY = panState.panY + event.clientY - panState.y; updateZoom(); } });
    const endPan = () => { panState = null; zoomContainer.classList.remove('is-panning'); };
    zoomContainer.addEventListener('pointerup', endPan); zoomContainer.addEventListener('pointercancel', endPan);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });

    function paintAt(clientX, clientY) {
      if (!processedData || !maskData) return;
      const box = comparison.getBoundingClientRect();
      const imageRect = getImageRect();
      const localX = clientX - box.left;
      const localY = clientY - box.top;
      if (localX < imageRect.left || localX > imageRect.left + imageRect.width || localY < imageRect.top || localY > imageRect.top + imageRect.height) return;
      const x = Math.round((localX - imageRect.left) / imageRect.scale);
      const y = Math.round((localY - imageRect.top) / imageRect.scale);
      const radius = Math.max(2, numeric(brushSize.value, 32) / 2);
      const mode = brushMode.value;
      for (let py = Math.max(0, Math.floor(y - radius)); py < Math.min(canvas.height, Math.ceil(y + radius)); py += 1) {
        for (let px = Math.max(0, Math.floor(x - radius)); px < Math.min(canvas.width, Math.ceil(x + radius)); px += 1) {
          if (Math.hypot(px - x, py - y) > radius) continue;
          const index = py * canvas.width + px;
          maskData[index] = mode === 'keep' ? 1 : 0;
          processedData.data[index * 4 + 3] = mode === 'keep' ? sourceData.data[index * 4 + 3] : 0;
        }
      }
      context.putImageData(processedData, 0, 0);
      resultMeta.textContent = 'AFTER BUFFER // MANUAL MASK EDITS ACTIVE';
      if (showMask.getAttribute('aria-pressed') === 'true') buildMaskPreview();
    }

    showMask.addEventListener('click', () => {
      const visible = showMask.getAttribute('aria-pressed') !== 'true';
      showMask.setAttribute('aria-pressed', String(visible));
      showMask.textContent = visible ? 'HIDE MASK' : 'SHOW MASK';
      maskOverlay.classList.toggle('hidden', !visible);
      maskOverlay.setAttribute('aria-hidden', String(!visible));
      if (visible) buildMaskPreview();
    });
    resetMask.addEventListener('click', resetCurrentMask);
    maskOverlay.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      painting = true;
      maskOverlay.setPointerCapture?.(event.pointerId);
      paintAt(event.clientX, event.clientY);
    });
    maskOverlay.addEventListener('pointermove', event => {
      if (!painting) return;
      event.preventDefault();
      event.stopPropagation();
      paintAt(event.clientX, event.clientY);
    });
    maskOverlay.addEventListener('pointerup', event => {
      event.preventDefault();
      event.stopPropagation();
      painting = false;
      if (maskOverlay.hasPointerCapture?.(event.pointerId)) maskOverlay.releasePointerCapture(event.pointerId);
    });
    maskOverlay.addEventListener('pointercancel', event => {
      event.preventDefault();
      event.stopPropagation();
      painting = false;
      if (maskOverlay.hasPointerCapture?.(event.pointerId)) maskOverlay.releasePointerCapture(event.pointerId);
    });

    setLoupe(loupeEnabled);
    loupeMagnification = prefs.loupeMagnification;
    loupeMagnificationInput.value = String(loupeMagnification);
    loupeMagnificationOutput.value = `${loupeMagnification}×`;
    loupePower.textContent = `${loupeMagnification}×`;
    updateGrid();
    updateSlider(sliderPercent, false);
    $('#ui-scale').addEventListener('input', event => paneManager.setScale(event.target.value));
    $('#reset-prefs').addEventListener('click', () => paneManager.reset());

    loadLastImage().then(record => {
      if (record?.blob) loadFile(new File([record.blob], record.name || 'last-image', { type: record.type || record.blob.type || 'image/png' }), false);
    }).catch(() => {});

    return { paneManager };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const app = initApp();
    runBoot().then(() => app?.paneManager.constrainAll());
  });
})();
