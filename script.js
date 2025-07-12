// script.js

// --- Variables for brushes ---
let currentBrush = 'default'; // default, pixel, shade

const brushSelector = document.getElementById('brush-type');

// Canvas elements
const canvasWrapper = document.getElementById('canvas-wrapper');
const colorPicker = document.getElementById('color-picker');
const brushSizeSlider = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const saveBtn = document.getElementById('save-btn');
const layerSelect = document.getElementById('layer-select');
const addLayerBtn = document.getElementById('add-layer');
const removeLayerBtn = document.getElementById('remove-layer');
const presetColors = document.querySelectorAll('.preset-color');

let layers = [];
let currentLayer = 0;
let drawing = false;
let history = [];
let currentColor = '#ffffff';
let brushSize = 5;

createLayer();
updateLayerSelect();

function createLayer() {
  const layer = document.createElement('canvas');
  layer.className = 'drawing-layer';
  layer.width = canvasWrapper.offsetWidth;
  layer.height = canvasWrapper.offsetHeight;
  layer.style.zIndex = layers.length;
  canvasWrapper.appendChild(layer);

  layers.push(layer);
  setupDrawingEvents(layer);
  updateLayerSelect();
  saveState();
}

function updateLayerSelect() {
  layerSelect.innerHTML = '';
  layers.forEach((layer, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `Layer ${index + 1}`;
    if (index === currentLayer) option.selected = true;
    layerSelect.appendChild(option);
  });
}

function getCurrentCtx() {
  return layers[currentLayer].getContext('2d');
}

function drawBrush(ctx, x, y) {
  if (currentBrush === 'pixel') {
    ctx.fillStyle = currentColor;
    ctx.fillRect(x, y, 1, 1);
  } else if (currentBrush === 'shade') {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize);
    gradient.addColorStop(0, currentColor);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
}

function setupDrawingEvents(layer) {
  const ctx = layer.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = brushSize;

  layer.addEventListener('mousedown', (e) => {
    const rect = layer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawing = true;
    if (currentBrush !== 'default') drawBrush(ctx, x, y);
    else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  });

  layer.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = layer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawBrush(ctx, x, y);
  });

  ['mouseup', 'mouseleave'].forEach(event => {
    layer.addEventListener(event, () => {
      if (drawing) {
        drawing = false;
        ctx.beginPath();
        saveState();
      }
    });
  });
}

function saveState() {
  const state = layers.map(layer => layer.toDataURL());
  history.push(state);
  if (history.length > 20) history.shift();
}

function undo() {
  if (history.length > 1) {
    history.pop();
    const prevState = history[history.length - 1];
    prevState.forEach((dataURL, index) => {
      const img = new Image();
      img.onload = function () {
        const ctx = layers[index].getContext('2d');
        ctx.clearRect(0, 0, layers[index].width, layers[index].height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataURL;
    });
  }
}

layerSelect.addEventListener('change', () => {
  currentLayer = parseInt(layerSelect.value);
});

addLayerBtn.addEventListener('click', () => {
  createLayer();
  currentLayer = layers.length - 1;
  updateLayerSelect();
});

removeLayerBtn.addEventListener('click', () => {
  if (layers.length > 1) {
    const removed = layers.pop();
    removed.remove();
    currentLayer = layers.length - 1;
    updateLayerSelect();
    saveState();
  }
});

colorPicker.addEventListener('input', function () {
  currentColor = this.value;
  getCurrentCtx().strokeStyle = currentColor;
});

brushSizeSlider.addEventListener('input', function () {
  brushSize = this.value;
  brushSizeValue.textContent = brushSize + 'px';
  getCurrentCtx().lineWidth = brushSize;
});

presetColors.forEach(color => {
  color.addEventListener('click', function () {
    currentColor = this.dataset.color;
    colorPicker.value = currentColor;
    getCurrentCtx().strokeStyle = currentColor;
    presetColors.forEach(c => c.classList.remove('active'));
    this.classList.add('active');
  });
});

clearBtn.addEventListener('click', () => {
  const ctx = getCurrentCtx();
  ctx.clearRect(0, 0, layers[currentLayer].width, layers[currentLayer].height);
  saveState();
});

undoBtn.addEventListener('click', undo);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  }
});

saveBtn.addEventListener('click', function () {
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = canvasWrapper.offsetWidth;
  mergedCanvas.height = canvasWrapper.offsetHeight;
  const mergedCtx = mergedCanvas.getContext('2d');
  layers.forEach(layer => mergedCtx.drawImage(layer, 0, 0));
  const link = document.createElement('a');
  link.download = 'pixel-artwork.png';
  link.href = mergedCanvas.toDataURL('image/png');
  link.click();
});

window.addEventListener('resize', () => {
  layers.forEach(layer => {
    const oldData = layer.toDataURL();
    layer.width = canvasWrapper.offsetWidth;
    layer.height = canvasWrapper.offsetHeight;
    const ctx = layer.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = oldData;
  });
});

// Brush selector
if (brushSelector) {
  brushSelector.addEventListener('change', (e) => {
    currentBrush = e.target.value;
  });
}
