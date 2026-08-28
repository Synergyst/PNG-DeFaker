document.addEventListener('DOMContentLoaded', () => {
    const bootScreen = document.getElementById('boot-screen');
    const appScreen = document.getElementById('app-screen');
    const terminalOutput = document.getElementById('terminal-output');
    const cursor = document.getElementById('cursor');

    const criticalMessages = [
        { text: "> INITIALIZING BOOT SEQUENCE...", delay: 500 },
        { text: "> LOADING HTML5_DOM_STRUCTURE... DONE", delay: 300 },
        { text: "> PARSING CYBER_STYLING_SHEETS... DONE", delay: 400 },
        { text: "> ATTACHING JAVASCRIPT_RUNTIME_CORE... DONE", delay: 300 },
        { text: "> INITIALIZING CANVAS_PIXEL_PROCESSOR... DONE", delay: 600 },
        { text: "> LOADING OPENCV_WASM_KERNEL... WAITING", delay: 400 },
        { text: "> SCANNING FOR HARDWARE ACCELERATION... OK", delay: 400 },
        { text: "> ESTABLISHING CONNECTION TO 0.0.0.0... OK", delay: 500 },
        { text: "> ACCESS GRANTED. ENTERING ALPHA_RECOVERY_MODE...", delay: 800 },
    ];

    const whimsyPool = [
        "> ATTEMPTING TO CONTACT THE INTERNET GHOSTS... NO RESPONSE",
        "> IGNORING ALL WARNINGS FROM THE BIOS... WHO NEEDS THEM?",
        "> CALCULATING THE MEANING OF LIFE... (42 FOUND)",
        "> RE-ROUTING POWER FROM THE TOASTER... SUCCESS",
        "> SEARCHING FOR LOST SOCKS IN THE CACHE... 0 FOUND",
        "> DOWNLOADING MORE RAM... ERROR: DISK FULL",
        "> APOLOGIZING TO THE CPU FOR THE OVERCLOCK...",
        "> SUMMONING THE SPIRIT OF THE 8-BIT ERA...",
        "> CHECKING IF THE USER IS A ROBOT... PROBABLY",
        "> BYPASSING THE MAINFRAME'S EMOTIONAL BARRIER...",
        "> OPTIMIZING PIXELS FOR MAXIMUM GLAMOUR...",
        "> ATTEMPTING TO DESCRAMBLE EGGS... FAILED",
        "> SYNCING WITH THE NEON GRID... VIBES DETECTED",
        "> CLEARING COBWEBS FROM THE REGISTER...",
        "> TRYING TO CONVINCE THE GPU TO COOPERATE...",
    ];

    async function runBootSequence() {
        for (let i = 0; i < criticalMessages.length; i++) {
            const msg = criticalMessages[i];
            if (i > 0 && Math.random() > 0.6) {
                const randomWhimsy = whimsyPool[Math.floor(Math.random() * whimsyPool.length)];
                await typeText(randomWhimsy, 200);
                terminalOutput.innerHTML += '<br>';
            }
            await typeText(msg.text, msg.delay);
            terminalOutput.innerHTML += '<br>';
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        bootScreen.style.opacity = '0';
        setTimeout(() => {
            bootScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            appScreen.style.opacity = '1';
        }, 500);
    }

    function typeText(text, delay) {
        return new Promise(resolve => {
            let i = 0;
            const interval = setInterval(() => {
                terminalOutput.innerHTML += text[i];
                i++;
                if (i >= text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 15);
        });
    }

    runBootSequence();
});

window.addEventListener('load', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controls = document.getElementById('controls');
    const preview = document.getElementById('preview');
    const imgOrig = document.getElementById('img-orig');
    const canvasResult = document.getElementById('canvas-result');
    const ctxResult = canvasResult.getContext('2d');
    const afterLayer = document.getElementById('after-layer');
    const sliderHandle = document.getElementById('slider-handle');
    const comparisonSlider = document.getElementById('comparison-slider');

    const methodSelect = document.getElementById('method-select');
    const bgColorInput = document.getElementById('bg-color');
    const toleranceInput = document.getElementById('tolerance');
    const tolValDisplay = document.getElementById('tol-val');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');
    const sysStatus = document.getElementById('sys-status');
    const sysMem = document.getElementById('sys-mem');

    // Grid Config Elements
    const gridSizeInput = document.getElementById('grid-size');
    const gridColor1Input = document.getElementById('grid-color-1');
    const gridColor2Input = document.getElementById('grid-color-2');

    let sourceImage = null;

    toleranceInput.oninput = () => {
        tolValDisplay.innerText = toleranceInput.value;
    };

    // Grid Configuration Logic
    function updateGrid() {
        const size = gridSizeInput.value;
        const c1 = gridColor1Input.value;
        const c2 = gridColor2Input.value;
        const half = size / 2;

        afterLayer.style.backgroundColor = c1;
        afterLayer.style.backgroundImage = `
            linear-gradient(45deg, ${c2} 25%, transparent 25%), 
            linear-gradient(-45deg, ${c2} 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, ${c2} 75%), 
            linear-gradient(-45deg, transparent 75%, ${c2} 75%)
        `;
        afterLayer.style.backgroundSize = `${size}px ${size}px`;
        afterLayer.style.backgroundPosition = `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0px`;
    }

    gridSizeInput.oninput = updateGrid;
    gridColor1Input.oninput = updateGrid;
    gridColor2Input.oninput = updateGrid;
    updateGrid(); // Initial call

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#ff00ff'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = '#00f3ff'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#00f3ff';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    };

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                sourceImage = img;
                imgOrig.src = e.target.result;
                controls.classList.remove('hidden');
                preview.classList.remove('hidden');
                sysStatus.innerText = 'IMAGE_LOADED';
                
                const aspect = img.width / img.height;
                comparisonSlider.style.aspectRatio = `${aspect}`;
                
                canvasResult.width = img.width;
                canvasResult.height = img.height;
                ctxResult.drawImage(img, 0, 0);
                
                const bytes = img.width * img.height * 4;
                sysMem.innerText = (bytes / (1024 * 1024)).toFixed(2) + 'MB';
                
                updateSlider(50);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function updateSlider(percent) {
        percent = Math.max(0, Math.min(100, percent));
        afterLayer.style.clipPath = `inset(0 0 0 ${percent}%)`;
        sliderHandle.style.left = `${percent}%`;
    }

    let isDragging = false;
    comparisonSlider.onmousedown = (e) => { isDragging = true; handleMove(e); };
    window.onmousemove = (e) => {
        if (!isDragging) return;
        handleMove(e);
    };
    window.onmouseup = () => { isDragging = false; };

    function handleMove(e) {
        const rect = comparisonSlider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = (x / rect.width) * 100;
        updateSlider(percent);
    }

    function getTargetRGB() {
        const hex = bgColorInput.value;
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        };
    }

    function colorDistance(c1, c2) {
        return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
    }

    function methodGlobalStrip(imageData, target, tolerance) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (colorDistance({r: data[i], g: data[i+1], b: data[i+2]}, target) <= tolerance) {
                data[i + 3] = 0;
            }
        }
        return imageData;
    }

    function methodSmartFlood(imageData, target, tolerance) {
        const { width, height } = canvasResult;
        const data = imageData.data;
        const visited = new Uint8Array(width * height);
        const queue = [];
        const startPoints = [
            {x: 0, y: 0}, {x: width - 1, y: 0},
            {x: 0, y: height - 1}, {x: width - 1, y: height - 1}
        ];
        startPoints.forEach(p => {
            const idx = p.y * width + p.x;
            const pixel = { r: data[idx*4], g: data[idx*4+1], b: data[idx*4+2] };
            if (colorDistance(pixel, target) <= tolerance) {
                queue.push(p);
                visited[idx] = 1;
            }
        });
        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            data[(y * width + x) * 4 + 3] = 0;
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = ny * width + nx;
                    if (!visited[nIdx]) {
                        const pixel = { r: data[nIdx*4], g: data[nIdx*4+1], b: data[nIdx*4+2] };
                        if (colorDistance(pixel, target) <= tolerance) {
                            visited[nIdx] = 1;
                            queue.push({x: nx, y: ny});
                        }
                    }
                }
            }
        }
        return imageData;
    }

    function methodLuminaMask(imageData) {
        const data = imageData.data;
        const target = getTargetRGB();
        const targetLum = 0.299 * target.r + 0.587 * target.g + 0.114 * target.b;
        const tolerance = parseInt(toleranceInput.value);
        for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            if (Math.abs(lum - targetLum) <= tolerance) {
                data[i + 3] = 0;
            }
        }
        return imageData;
    }

    function methodCVContour(imageData) {
        if (typeof cv === 'undefined') {
            alert("OpenCV Kernel not loaded yet. Please wait a moment.");
            return imageData;
        }
        let src = cv.matFromImageData(imageData);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        let blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        let thresh = new cv.Mat();
        cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        if (contours.size() > 0) {
            let maxArea = 0;
            let maxContourIdx = -1;
            for (let i = 0; i < contours.size(); ++i) {
                let area = cv.contourArea(contours.get(i));
                if (area > maxArea) {
                    maxArea = area;
                    maxContourIdx = i;
                }
            }
            let mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
            cv.drawContours(mask, contours, maxContourIdx, [255, 0, 0], -1);
            const data = imageData.data;
            const maskData = mask.data;
            for (let i = 0; i < data.length; i += 4) {
                if (maskData[i/4] === 0) {
                    data[i + 3] = 0;
                }
            }
            src.delete(); gray.delete(); blurred.delete(); thresh.delete();
            contours.delete(); hierarchy.delete(); mask.delete();
        } else {
            src.delete(); gray.delete(); blurred.delete(); thresh.delete();
            contours.delete(); hierarchy.delete();
        }
        return imageData;
    }

    processBtn.onclick = () => {
        if (!sourceImage) return;
        sysStatus.innerText = 'PROCESSING...';
        const method = methodSelect.value;
        const target = getTargetRGB();
        const tolerance = parseInt(toleranceInput.value);
        ctxResult.drawImage(sourceImage, 0, 0);
        let imageData = ctxResult.getImageData(0, 0, canvasResult.width, canvasResult.height);
        if (method === 'global') {
            imageData = methodGlobalStrip(imageData, target, tolerance);
        } else if (method === 'flood') {
            imageData = methodSmartFlood(imageData, target, tolerance);
        } else if (method === 'lumina') {
            imageData = methodLuminaMask(imageData);
        } else if (method === 'contour') {
            imageData = methodCVContour(imageData);
        }
        ctxResult.putImageData(imageData, 0, 0);
        sysStatus.innerText = 'RESTORED';
    };

    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.download = 'defaked_alpha_restore.png';
        link.href = canvasResult.toDataURL('image/png');
        link.click();
    };
});
