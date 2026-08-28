(() => {
  'use strict';

  const PREFS_KEY = 'png-defaker.preferences.v4';
  const MIN_WIDTH = 280;
  const MIN_HEIGHT = 180;
  const $ = (selector, root = document) => root.querySelector(selector);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

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

  function runBoot() {
    const boot = $('#boot-screen');
    const app = $('#app-screen');
    const output = $('#terminal-output');
    if (!boot || !app || !output) return;
    const print = text => new Promise(resolve => {
      let index = 0;
      const timer = setInterval(() => {
        output.append(document.createTextNode(text[index++] || ''));
        if (index >= text.length) {
          clearInterval(timer);
          output.append(document.createElement('br'));
          resolve();
        }
      }, 5);
    });
    (async () => {
      for (let i = 0; i < criticalMessages.length; i += 1) {
        if (i > 0 && Math.random() < 0.58) await print(whimsyPool[Math.floor(Math.random() * whimsyPool.length)]);
        await print(criticalMessages[i]);
        await wait(75);
      }
      await wait(350);
      boot.classList.add('is-closing');
      await wait(350);
      boot.classList.add('hidden');
      app.classList.remove('hidden');
      app.setAttribute('aria-hidden', 'false');
    })();
  }

  function readPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
    catch { return {}; }
  }
  function writePrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
    catch { /* Private browsing or storage quotas should not break image work. */ }
  }
  function numeric(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  class PaneManager {
    constructor(workspace) {
      this.workspace = workspace;
      this.prefs = readPrefs();
      this.panes = [...workspace.querySelectorAll('.cyber-window')].map(el => this.attach(el));
      this.applyScale();
      requestAnimationFrame(() => this.constrainAll());
      window.addEventListener('resize', () => this.constrainAll());
    }
    attach(el) {
      const pane = { el, header: $('[data-drag-handle]', el), grip: $('.resize-grip', el) };
      const saved = this.prefs.panes?.[el.id];
      if (saved) {
        el.style.left = `${numeric(saved.left, 0)}px`;
        el.style.top = `${numeric(saved.top, 0)}px`;
        el.style.width = `${Math.max(MIN_WIDTH, numeric(saved.width, el.offsetWidth || MIN_WIDTH))}px`;
        el.style.height = `${Math.max(MIN_HEIGHT, numeric(saved.height, el.offsetHeight || MIN_HEIGHT))}px`;
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
    workspaceScale() {
      const rect = this.workspace.getBoundingClientRect();
      return rect.width / Math.max(this.workspace.offsetWidth, 1) || 1;
    }
    clampPosition(pane, left, top) {
      const scale = this.workspaceScale();
      const maxLeft = Math.max(0, (this.workspace.clientWidth - pane.el.offsetWidth) / scale);
      const maxTop = Math.max(0, (this.workspace.clientHeight - pane.el.offsetHeight) / scale);
      return { left: Math.max(0, Math.min(left, maxLeft)), top: Math.max(0, Math.min(top, maxTop)) };
    }
    bindDrag(pane) {
      if (!pane.header) return;
      pane.header.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('button, input, select')) return;
        event.preventDefault();
        this.activate(pane);
        const scale = this.workspaceScale();
        const startLeft = pane.el.offsetLeft;
        const startTop = pane.el.offsetTop;
        const startX = event.clientX;
        const startY = event.clientY;
        pane.header.setPointerCapture?.(event.pointerId);
        const move = moveEvent => {
          const next = this.clampPosition(pane, startLeft + (moveEvent.clientX - startX) / scale, startTop + (moveEvent.clientY - startY) / scale);
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
        window.addEventListener('pointerup', end, { once: true });
      });
    }
    bindResize(pane) {
      if (!pane.grip) return;
      pane.grip.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        this.activate(pane);
        const scale = this.workspaceScale();
        const startWidth = pane.el.offsetWidth;
        const startHeight = pane.el.offsetHeight;
        const startX = event.clientX;
        const startY = event.clientY;
        pane.grip.setPointerCapture?.(event.pointerId);
        const move = moveEvent => {
          const maxWidth = Math.max(MIN_WIDTH, (this.workspace.clientWidth - pane.el.offsetLeft) / scale);
          const maxHeight = Math.max(MIN_HEIGHT, (this.workspace.clientHeight - pane.el.offsetTop) / scale);
          pane.el.style.width = `${Math.round(Math.max(MIN_WIDTH, Math.min(maxWidth, startWidth + (moveEvent.clientX - startX) / scale)))}px`;
          pane.el.style.height = `${Math.round(Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeight + (moveEvent.clientY - startY) / scale)))}px`;
        };
        const end = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', end);
          pane.grip.releasePointerCapture?.(event.pointerId);
          this.savePane(pane);
          this.wobbleOthers(pane);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end, { once: true });
      });
    }
    savePane(pane) {
      this.prefs.panes ||= {};
      this.prefs.panes[pane.el.id] = { left: pane.el.offsetLeft, top: pane.el.offsetTop, width: pane.el.offsetWidth, height: pane.el.offsetHeight };
      writePrefs(this.prefs);
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
    constrainAll() {
      this.panes.forEach(pane => {
        if (pane.el.classList.contains('hidden')) return;
        const position = this.clampPosition(pane, pane.el.offsetLeft, pane.el.offsetTop);
        pane.el.style.left = `${Math.round(position.left)}px`;
        pane.el.style.top = `${Math.round(position.top)}px`;
        const scale = this.workspaceScale();
        const maxWidth = Math.max(MIN_WIDTH, (this.workspace.clientWidth - pane.el.offsetLeft) / scale);
        const maxHeight = Math.max(MIN_HEIGHT, (this.workspace.clientHeight - pane.el.offsetTop) / scale);
        pane.el.style.width = `${Math.round(Math.min(maxWidth, Math.max(MIN_WIDTH, pane.el.offsetWidth)))}px`;
        pane.el.style.height = `${Math.round(Math.min(maxHeight, Math.max(MIN_HEIGHT, pane.el.offsetHeight)))}px`;
      });
    }
    applyScale() {
      const scale = Math.max(0.85, Math.min(1.2, numeric(this.prefs.uiScale, 1)));
      document.documentElement.style.setProperty('--ui-scale', String(scale));
      const control = $('#ui-scale');
      const output = $('#ui-scale-val');
      if (control) control.value = String(Math.round(scale * 100));
      if (output) output.value = `${Math.round(scale * 100)}%`;
    }
    setScale(value) {
      this.prefs.uiScale = Math.max(0.85, Math.min(1.2, numeric(value, 100) / 100));
      writePrefs(this.prefs);
      this.applyScale();
      requestAnimationFrame(() => this.constrainAll());
    }
    reset() {
      localStorage.removeItem(PREFS_KEY);
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
    const handle = $('#slider-handle');
    const status = $('#sys-status');
    const memory = $('#sys-mem');
    const method = $('#method-select');
    const bgColor = $('#bg-color');
    const tolerance = $('#tolerance');
    const toleranceOutput = $('#tol-val');
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
    const loupe = $('#loupe');
    const loupeCanvas = $('#loupe-canvas');
    const loupeContext = loupeCanvas.getContext('2d');
    const loupeToggle = $('#loupe-toggle');
    if (!workspace || !dropZone || !canvas) return;

    const prefs = readPrefs();
    const paneManager = new PaneManager(workspace);
    let sourceImage = null;
    let currentFileName = 'defaked_alpha_restore';
    let sliderPercent = numeric(prefs.sliderPercent, 50);
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let panState = null;
    let loupeEnabled = prefs.loupeEnabled === true;

    const setStatus = value => { status.textContent = value; };
    const savePreference = (key, value) => {
      const next = readPrefs();
      next[key] = value;
      writePrefs(next);
    };
    const updateSlider = percent => {
      sliderPercent = Math.max(0, Math.min(100, percent));
      afterLayer.style.clipPath = `inset(0 0 0 ${sliderPercent}%)`;
      handle.style.left = `${sliderPercent}%`;
      comparison.setAttribute('aria-valuenow', String(Math.round(sliderPercent)));
      savePreference('sliderPercent', sliderPercent);
    };
    const moveSlider = clientX => {
      const rect = comparison.getBoundingClientRect();
      if (rect.width) updateSlider(((clientX - rect.left) / rect.width) * 100);
    };
    comparison.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      comparison.setPointerCapture?.(event.pointerId);
      moveSlider(event.clientX);
    });
    comparison.addEventListener('pointermove', event => {
      if (comparison.hasPointerCapture?.(event.pointerId)) moveSlider(event.clientX);
    });
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
      for (let i = 0; i < data.length; i += 4) if (distance({ r: data[i], g: data[i + 1], b: data[i + 2] }, target) <= limit) data[i + 3] = 0;
    }
    function smartFlood(data, width, height, target, limit) {
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0; let tail = 0;
      const starts = [0, width - 1, (height - 1) * width, height * width - 1];
      const matches = index => distance({ r: data[index * 4], g: data[index * 4 + 1], b: data[index * 4 + 2] }, target) <= limit;
      starts.forEach(index => { if (index >= 0 && !visited[index] && matches(index)) { visited[index] = 1; queue[tail++] = index; } });
      while (head < tail) {
        const index = queue[head++];
        data[index * 4 + 3] = 0;
        const x = index % width; const y = Math.floor(index / width);
        const neighbors = [index - 1, index + 1, index - width, index + width];
        if (x === 0) neighbors[0] = -1;
        if (x === width - 1) neighbors[1] = -1;
        if (y === 0) neighbors[2] = -1;
        if (y === height - 1) neighbors[3] = -1;
        neighbors.forEach(next => { if (next >= 0 && next < width * height && !visited[next] && matches(next)) { visited[next] = 1; queue[tail++] = next; } });
      }
    }
    function luminanceMask(data, target, limit) {
      const targetLum = 0.299 * target.r + 0.587 * target.g + 0.114 * target.b;
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (Math.abs(lum - targetLum) <= limit) data[i + 3] = 0;
      }
    }
    function contourMask(imageData) {
      if (typeof cv === 'undefined' || !cv.Mat) throw new Error('OpenCV is still loading. Try again in a moment.');
      const src = cv.matFromImageData(imageData); const gray = new cv.Mat(); const blurred = new cv.Mat();
      const thresholded = new cv.Mat(); const contours = new cv.MatVector(); const hierarchy = new cv.Mat();
      const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.threshold(blurred, thresholded, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
        cv.findContours(thresholded, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        if (!contours.size()) return;
        let largest = 0; let largestArea = 0;
        for (let i = 0; i < contours.size(); i += 1) { const area = cv.contourArea(contours.get(i)); if (area > largestArea) { largestArea = area; largest = i; } }
        cv.drawContours(mask, contours, largest, new cv.Scalar(255), -1);
        for (let i = 0; i < imageData.data.length; i += 4) if (mask.data[i / 4] === 0) imageData.data[i + 3] = 0;
      } finally { [src, gray, blurred, thresholded, contours, hierarchy, mask].forEach(item => item.delete()); }
    }
    function applyProcessing() {
      if (!sourceImage) return;
      setStatus('PROCESSING');
      context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(sourceImage, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const target = getRGB(bgColor.value); const limit = Number(tolerance.value);
      try {
        if (method.value === 'global') globalStrip(imageData.data, target, limit);
        else if (method.value === 'flood') smartFlood(imageData.data, canvas.width, canvas.height, target, limit);
        else if (method.value === 'lumina') luminanceMask(imageData.data, target, limit);
        else contourMask(imageData);
        context.putImageData(imageData, 0, 0); setStatus('RESTORED');
        if (loupeEnabled) updateLoupeFromPreview();
      } catch (error) { setStatus('READY'); window.alert(error.message); }
    }
    function loadFile(file) {
      if (!file || !file.type.startsWith('image/')) { setStatus('INVALID_FILE'); return; }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const image = new Image();
        image.addEventListener('load', () => {
          sourceImage = image; currentFileName = (file.name || 'defaked_alpha_restore').replace(/\.[^.]+$/, '') || 'defaked_alpha_restore';
          original.src = reader.result; canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; context.drawImage(image, 0, 0);
          controlsPane.classList.remove('hidden'); previewPane.classList.remove('hidden');
          memory.textContent = `${((image.naturalWidth * image.naturalHeight * 4) / (1024 * 1024)).toFixed(2)}MB`;
          $('.drop-title').textContent = file.name; $('#drop-status').textContent = `${image.naturalWidth} × ${image.naturalHeight} // READY`;
          updateSlider(sliderPercent); setStatus('IMAGE_LOADED'); paneManager.constrainAll();
          if (loupeEnabled) updateLoupeFromPreview();
        });
        image.addEventListener('error', () => setStatus('READ_ERROR')); image.src = reader.result;
      });
      reader.readAsDataURL(file);
    }

    let dragDepth = 0;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); event.stopPropagation(); }));
    dropZone.addEventListener('dragenter', () => { dragDepth += 1; dropZone.classList.add('is-dragover'); });
    dropZone.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) dropZone.classList.remove('is-dragover'); });
    dropZone.addEventListener('dragover', event => { event.dataTransfer.dropEffect = 'copy'; });
    dropZone.addEventListener('drop', event => { dragDepth = 0; dropZone.classList.remove('is-dragover'); loadFile(event.dataTransfer.files[0]); });
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', event => { loadFile(event.target.files[0]); fileInput.value = ''; });

    function updateGrid() {
      const size = Math.max(4, Number(gridSize.value)); const half = size / 2; const colorA = gridColorA.value; const colorB = gridColorB.value;
      gridSizeOutput.value = String(size); afterLayer.style.backgroundColor = colorA;
      afterLayer.style.backgroundImage = `linear-gradient(45deg, ${colorB} 25%, transparent 25%), linear-gradient(-45deg, ${colorB} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${colorB} 75%), linear-gradient(-45deg, transparent 75%, ${colorB} 75%)`;
      afterLayer.style.backgroundSize = `${size}px ${size}px`; afterLayer.style.backgroundPosition = `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0`;
      const next = readPrefs(); next.grid = { size, colorA, colorB }; writePrefs(next);
    }
    const savedGrid = prefs.grid;
    if (savedGrid) { gridSize.value = savedGrid.size || gridSize.value; gridColorA.value = savedGrid.colorA || gridColorA.value; gridColorB.value = savedGrid.colorB || gridColorB.value; }
    [gridSize, gridColorA, gridColorB].forEach(input => input.addEventListener('input', updateGrid)); updateGrid();

    method.value = prefs.method || method.value; bgColor.value = prefs.bgColor || bgColor.value; tolerance.value = prefs.tolerance ?? tolerance.value;
    toleranceOutput.value = tolerance.value;
    const saveControls = () => { const next = readPrefs(); next.method = method.value; next.bgColor = bgColor.value; next.tolerance = tolerance.value; writePrefs(next); };
    method.addEventListener('change', saveControls); bgColor.addEventListener('input', saveControls); tolerance.addEventListener('input', () => { toleranceOutput.value = tolerance.value; saveControls(); });

    downloadButton.addEventListener('click', () => { if (!sourceImage) return; const link = document.createElement('a'); link.download = `${currentFileName}_defaked.png`; link.href = canvas.toDataURL('image/png'); link.click(); });

    function updateLoupeFromPreview() {
      if (!sourceImage || !loupeEnabled) return;
      const rect = comparison.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = rect.width / 2; const y = rect.height / 2;
      drawLoupe(x, y); positionLoupe(x, y);
    }
    function positionLoupe(x, y) {
      const radius = loupe.offsetWidth / 2; const pad = radius + 12;
      loupe.style.left = `${Math.max(pad, Math.min(comparison.clientWidth - pad, x))}px`;
      loupe.style.top = `${Math.max(pad, Math.min(comparison.clientHeight - pad, y))}px`;
    }
    function drawLoupe(x, y) {
      const rect = comparison.getBoundingClientRect(); const sourceX = (x / rect.width) * canvas.width; const sourceY = (y / rect.height) * canvas.height;
      const sampleWidth = canvas.width / 3; const sampleHeight = canvas.height / 3;
      loupeContext.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
      loupeContext.drawImage(canvas, sourceX - sampleWidth / 2, sourceY - sampleHeight / 2, sampleWidth, sampleHeight, 0, 0, loupeCanvas.width, loupeCanvas.height);
    }
    function setLoupe(enabled) {
      loupeEnabled = enabled; loupe.classList.toggle('hidden', !enabled); loupe.setAttribute('aria-hidden', String(!enabled)); loupeToggle.setAttribute('aria-pressed', String(enabled)); loupeToggle.textContent = `LOUPE: ${enabled ? 'ON' : 'OFF'}`; savePreference('loupeEnabled', enabled);
      if (enabled) updateLoupeFromPreview();
    }
    loupeToggle.addEventListener('click', () => setLoupe(!loupeEnabled));
    comparison.addEventListener('pointermove', event => { if (!loupeEnabled) return; const rect = comparison.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; drawLoupe(x, y); positionLoupe(x, y); });
    comparison.addEventListener('pointerleave', () => { if (loupeEnabled) loupe.classList.add('hidden'); });
    comparison.addEventListener('pointerenter', () => { if (loupeEnabled) loupe.classList.remove('hidden'); });

    let modalSource = 'after';
    function updateZoom() { zoomContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; zoomLevel.value = `${Math.round(zoom * 100)}%`; }
    function resetZoom() { zoom = 1; panX = 0; panY = 0; updateZoom(); }
    function openModal() { if (!sourceImage) return; modalImage.src = canvas.toDataURL('image/png'); modal.classList.remove('hidden'); resetZoom(); $('#close-modal').focus(); }
    $('#open-modal-btn').addEventListener('click', openModal); $('#close-modal').addEventListener('click', () => modal.classList.add('hidden'));
    $('#zoom-in').addEventListener('click', () => { zoom = Math.min(8, zoom + 0.25); updateZoom(); }); $('#zoom-out').addEventListener('click', () => { zoom = Math.max(0.25, zoom - 0.25); updateZoom(); }); $('#zoom-reset').addEventListener('click', resetZoom);
    modalBody.addEventListener('wheel', event => { if (modal.classList.contains('hidden')) return; event.preventDefault(); zoom = Math.max(0.25, Math.min(8, zoom + (event.deltaY < 0 ? 0.15 : -0.15))); updateZoom(); }, { passive: false });
    zoomContainer.addEventListener('pointerdown', event => { if (event.button !== 0) return; panState = { x: event.clientX, y: event.clientY, panX, panY }; zoomContainer.classList.add('is-panning'); zoomContainer.setPointerCapture?.(event.pointerId); });
    zoomContainer.addEventListener('pointermove', event => { if (!panState) return; panX = panState.panX + event.clientX - panState.x; panY = panState.panY + event.clientY - panState.y; updateZoom(); });
    const endPan = () => { panState = null; zoomContainer.classList.remove('is-panning'); }; zoomContainer.addEventListener('pointerup', endPan); zoomContainer.addEventListener('pointercancel', endPan);
    modal.addEventListener('click', event => { if (event.target === modal) modal.classList.add('hidden'); }); document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.classList.add('hidden'); });

    setLoupe(loupeEnabled); updateSlider(sliderPercent); $('#ui-scale').addEventListener('input', event => paneManager.setScale(event.target.value)); $('#reset-prefs').addEventListener('click', () => paneManager.reset());
  }

  document.addEventListener('DOMContentLoaded', () => { runBoot(); initApp(); });
})();
