// --- Canvas Setup ---
const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');
let WIDTH = 900, HEIGHT = 250;

function resizeCanvas() {
  WIDTH = CANVAS.parentElement.offsetWidth - 10;
  HEIGHT = CANVAS.parentElement.offsetHeight - 10;
  CANVAS.width = WIDTH;
  CANVAS.height = HEIGHT;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- State ---
let array = [];
let arraySize = 30;
let inputType = 'random';
let algorithm = 'bubble';
let speed = 50;
let isPlaying = false;
let currentStep = 0;
let steps = [];
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let elapsedTime = 0;

// --- DOM Elements ---
const arraySizeSlider = document.getElementById('arraySize');
const arraySizeValue = document.getElementById('arraySizeValue');
const inputTypeSelect = document.getElementById('inputType');
const algorithmSelect = document.getElementById('algorithm');
const generateBtn = document.getElementById('generate');
const playPauseBtn = document.getElementById('playPause');
const stepBackBtn = document.getElementById('stepBack');
const stepForwardBtn = document.getElementById('stepForward');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const comparisonsSpan = document.getElementById('comparisons');
const swapsSpan = document.getElementById('swaps');
const timeSpan = document.getElementById('time');
const algoTitle = document.getElementById('algoTitle');
const currentAlgo = document.getElementById('currentAlgo');
const timeComplexity = document.getElementById('timeComplexity');
const spaceComplexity = document.getElementById('spaceComplexity');

// --- Algorithm Metadata ---
const algoMeta = {
  bubble: {
    name: "Bubble Sort",
    time: "O(n²)",
    space: "O(1)"
  },
  merge: {
    name: "Merge Sort",
    time: "O(n log n)",
    space: "O(n)"
  },
  quick: {
    name: "Quick Sort",
    time: "O(n log n)",
    space: "O(log n)"
  }
};

// --- Event Listeners ---
arraySizeSlider.oninput = function() {
  arraySize = parseInt(this.value);
  arraySizeValue.textContent = this.value;
  generateArray();
};
inputTypeSelect.onchange = function() {
  inputType = this.value;
  generateArray();
};
algorithmSelect.onchange = function() {
  algorithm = this.value;
  updateAlgoMeta();
  generateArray();
};
generateBtn.onclick = generateArray;
playPauseBtn.onclick = togglePlayPause;
stepBackBtn.onclick = () => step(-1);
stepForwardBtn.onclick = () => step(1);
speedSlider.oninput = function() {
  speed = parseInt(this.value);
  speedValue.textContent = this.value;
};

// --- Array Generation ---
function generateArray() {
  array = [];
  for (let i = 0; i < arraySize; i++) array.push(i + 1);

  switch (inputType) {
    case 'random':
      shuffle(array);
      break;
    case 'sorted':
      // Already sorted
      break;
    case 'reversed':
      array.reverse();
      break;
    case 'nearly':
      shuffle(array, Math.floor(arraySize * 0.1));
      break;
  }
  resetVisualization();
}

function shuffle(arr, swaps = arr.length) {
  for (let i = 0; i < swaps; i++) {
    const a = Math.floor(Math.random() * arr.length);
    const b = Math.floor(Math.random() * arr.length);
    [arr[a], arr[b]] = [arr[b], arr[a]];
  }
}

// --- Visualization ---
function drawArray(highlight = [], swapped = [], sortedIdx = []) {
  CTX.clearRect(0, 0, WIDTH, HEIGHT);
  const barWidth = WIDTH / array.length;
  const maxVal = Math.max(...array);

  for (let i = 0; i < array.length; i++) {
    let color = getComputedStyle(document.documentElement).getPropertyValue('--bar-default').trim();
    if (sortedIdx.includes(i)) color = getComputedStyle(document.documentElement).getPropertyValue('--bar-final').trim();
    else if (swapped.includes(i)) color = getComputedStyle(document.documentElement).getPropertyValue('--bar-swap').trim();
    else if (highlight.includes(i)) color = getComputedStyle(document.documentElement).getPropertyValue('--bar-highlight').trim();

    CTX.fillStyle = color;
    const barHeight = (array[i] / maxVal) * (HEIGHT - 20);
    CTX.fillRect(i * barWidth, HEIGHT - barHeight, barWidth - 2, barHeight);

    // Draw value for small arrays
    if (array.length <= 25) {
      CTX.fillStyle = "#fff";
      CTX.font = 'bold 12px Montserrat';
      CTX.textAlign = 'center';
      CTX.fillText(array[i], i * barWidth + barWidth / 2, HEIGHT - barHeight - 6);
    }
  }
}

// --- Sorting Algorithms with Step Recording ---
function resetVisualization() {
  isPlaying = false;
  playPauseBtn.textContent = '▶️';
  currentStep = 0;
  comparisons = 0;
  swaps = 0;
  elapsedTime = 0;
  steps = [];
  let arrCopy = array.slice();

  switch (algorithm) {
    case 'bubble':
      steps = getBubbleSortSteps(arrCopy);
      break;
    case 'merge':
      steps = getMergeSortSteps(arrCopy);
      break;
    case 'quick':
      steps = getQuickSortSteps(arrCopy);
      break;
  }
  updateMetrics();
  drawStep();
}

function getBubbleSortSteps(arr) {
  let s = [];
  let n = arr.length;
  let comps = 0, swps = 0;
  let sortedIdx = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      s.push({ arr: arr.slice(), highlight: [j, j + 1], swapped: [], comps, swps, sorted: sortedIdx.slice() });
      comps++;
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swps++;
        s.push({ arr: arr.slice(), highlight: [j, j + 1], swapped: [j, j + 1], comps, swps, sorted: sortedIdx.slice() });
      }
    }
    sortedIdx.unshift(n - 1 - i);
  }
  sortedIdx = Array.from({length: n}, (_, i) => i);
  s.push({ arr: arr.slice(), highlight: [], swapped: [], comps, swps, sorted: sortedIdx });
  return s;
}

function getMergeSortSteps(arr) {
  let s = [];
  let comps = 0, swps = 0;
  let sortedIdx = [];
  function mergeSort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    mergeSort(l, m);
    mergeSort(m + 1, r);
    let left = arr.slice(l, m + 1);
    let right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      s.push({ arr: arr.slice(), highlight: [k], swapped: [], comps, swps, sorted: sortedIdx.slice() });
      comps++;
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      swps++;
      s.push({ arr: arr.slice(), highlight: [k], swapped: [k], comps, swps, sorted: sortedIdx.slice() });
      k++;
    }
    while (i < left.length) {
      arr[k] = left[i];
      i++; k++; swps++;
      s.push({ arr: arr.slice(), highlight: [k-1], swapped: [k-1], comps, swps, sorted: sortedIdx.slice() });
    }
    while (j < right.length) {
      arr[k] = right[j];
      j++; k++; swps++;
      s.push({ arr: arr.slice(), highlight: [k-1], swapped: [k-1], comps, swps, sorted: sortedIdx.slice() });
    }
  }
  mergeSort(0, arr.length - 1);
  sortedIdx = Array.from({length: arr.length}, (_, i) => i);
  s.push({ arr: arr.slice(), highlight: [], swapped: [], comps, swps, sorted: sortedIdx });
  return s;
}

function getQuickSortSteps(arr) {
  let s = [];
  let comps = 0, swps = 0;
  let sortedIdx = [];
  function quickSort(l, r) {
    if (l >= r) return;
    let pivot = arr[r];
    let i = l;
    for (let j = l; j < r; j++) {
      s.push({ arr: arr.slice(), highlight: [j, r], swapped: [], comps, swps, sorted: sortedIdx.slice() });
      comps++;
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        swps++;
        s.push({ arr: arr.slice(), highlight: [i, j], swapped: [i, j], comps, swps, sorted: sortedIdx.slice() });
        i++;
      }
    }
    [arr[i], arr[r]] = [arr[r], arr[i]];
    swps++;
    s.push({ arr: arr.slice(), highlight: [i, r], swapped: [i, r], comps, swps, sorted: sortedIdx.slice() });
    quickSort(l, i - 1);
    quickSort(i + 1, r);
  }
  quickSort(0, arr.length - 1);
  sortedIdx = Array.from({length: arr.length}, (_, i) => i);
  s.push({ arr: arr.slice(), highlight: [], swapped: [], comps, swps, sorted: sortedIdx });
  return s;
}

// --- Animation Controls ---
function drawStep() {
  if (currentStep < 0) currentStep = 0;
  if (currentStep >= steps.length) currentStep = steps.length - 1;
  let step = steps[currentStep];
  array = step.arr.slice();
  comparisons = step.comps;
  swaps = step.swps;
  drawArray(step.highlight, step.swapped, step.sorted);
  updateMetrics();
}

function step(dir) {
  isPlaying = false;
  playPauseBtn.textContent = '▶️';
  currentStep += dir;
  if (currentStep < 0) currentStep = 0;
  if (currentStep >= steps.length) currentStep = steps.length - 1;
  drawStep();
}

function togglePlayPause() {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
  if (isPlaying) {
    startTime = performance.now() - elapsedTime;
    animate();
  } else {
    elapsedTime = performance.now() - startTime;
  }
}

function animate() {
  if (!isPlaying) return;
  if (currentStep < steps.length - 1) {
    currentStep++;
    drawStep();
    let delay = 500 - (speed * 4.5); // speed: 1(slowest)-100(fastest)
    setTimeout(animate, Math.max(10, delay));
  } else {
    isPlaying = false;
    playPauseBtn.textContent = '▶️';
    elapsedTime = performance.now() - startTime;
    updateMetrics();
  }
}

// --- Metrics ---
function updateMetrics() {
  comparisonsSpan.textContent = comparisons;
  swapsSpan.textContent = swaps;
  timeSpan.textContent = Math.round(isPlaying ? (performance.now() - startTime) : elapsedTime) + "ms";
}

// --- Algorithm Meta Info ---
function updateAlgoMeta() {
  const meta = algoMeta[algorithm];
  algoTitle.textContent = `${meta.name} Visualization`;
  currentAlgo.textContent = meta.name;
  timeComplexity.textContent = meta.time;
  spaceComplexity.textContent = meta.space;
}

// --- Initial Load ---
updateAlgoMeta();
generateArray();