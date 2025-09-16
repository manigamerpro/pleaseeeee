/* =========================
   GLOBAL STATE
   ========================= */
let defaultCubeTypes = ["2x2", "3x3", "4x4", "5x5", "Pyraminx", "Megaminx", "Skewb", "Square-1", "Clock"];
const hiddenDefaultType = "???";
let selectedCubePre = ""; // UI selection for next solve
let running = false;
let interval = null;
let startMs = 0;
let lastTimeMs = 0;
let lastPendingUnknown = null;

// Inspection timer variables
let inspectionInterval = null;
let inspectionTimeLeft = 15;
let isInspecting = false;

// Data
let times = [];
let records = {};
let settings = {
  language: 'en',
  enabledFeatures: {
    inspectionTimer: true,
    saveUnknownSolves: true
  },
  timerDisplayDuration: 1500,
  inspectionTime: 15,
  inspectionDelay: 200
};

// DOM Elements
const timerCircle = document.getElementById('timerCircle');
const buttonsDiv = document.getElementById('buttons');
const postActions = document.getElementById('postActions');
const solvedTypeName = document.getElementById('solvedTypeName');
const recordMessage = document.getElementById('recordMessage');

/* =========================
   API FUNCTIONS
   ========================= */
const API_BASE = '/api';

async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  return await response.json();
}

async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return response;
}

async function apiPut(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return response;
}

async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE'
  });
  return response;
}

/* =========================
   UTIL FUNCTIONS
   ========================= */
function fmtHMSms(ms, precision) {
  // Remove timer precision logic and always use 3 decimals
  precision = 3;
  
  const totalMs = Math.max(0, Math.floor(ms));
  const milli = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  
  let msPart = '';
  if (precision > 0) {
    const msStr = milli.toString().padStart(3, '0');
    msPart = `.${msStr.substring(0, precision)}`;
  }

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${msPart}`;
  } else if (m > 0) {
    return `${m}:${s.toString().padStart(2, '0')}${msPart}`;
  } else {
    return `${s}${msPart}`;
  }
}

function nowISO(){ return new Date().toISOString(); }

/* =========================
   TIMER FUNCTIONS (SIMPLIFIED)
   ========================= */
function setCircle(text, clsAdd=null, clsRemove=null){
  timerCircle.textContent = text;
  if (clsRemove) timerCircle.classList.remove(clsRemove);
  if (clsAdd) timerCircle.classList.add(clsAdd);
}

function stopTimer() {
  if (!running) return;
  
  running = false;
  clearInterval(interval);
  lastTimeMs = performance.now() - startMs;
  timerCircle.classList.remove('running');
  setCircle(`Time: ${fmtHMSms(lastTimeMs)}`);
  
  // Hide cancel button when timer stops
  const cancelTimerBtn = document.getElementById('mainCancelTimerBtn');
  if (cancelTimerBtn) {
    cancelTimerBtn.style.display = 'none';
  }
  
  // Save the solve
  const cubeType = selectedCubePre || hiddenDefaultType;
  saveSolve(cubeType, lastTimeMs);
  
  // Brief delay then allow new solves (this is the cooldown period)
  setTimeout(() => { 
    if (timerCircle && !running) {
      setCircle(getTranslation('tap-to-start') || 'Tap or Hold to start');
    }
  }, 1500); // 1.5 second cooldown period
}

function startInspection() {
  // Only start inspection if timer is allowed to start (not in cooldown period)
  if (isInspecting || running) return;
  
  // Check if we're in the cooldown period by checking the timer text
  if (timerCircle && timerCircle.textContent.startsWith('Time:')) {
    return; // Don't start inspection during cooldown period
  }
  
  isInspecting = true;
  inspectionTimeLeft = settings.inspectionTime || 15;
  
  // Show inspection timer
  const inspectionTimer = document.getElementById('inspectionTimer');
  if (inspectionTimer) {
    inspectionTimer.textContent = inspectionTimeLeft;
    inspectionTimer.style.display = 'block';
  }
  
  // Keep the main timer circle visible but change its text
  if (timerCircle) {
    timerCircle.textContent = getTranslation('inspection-running') || 'Inspection Running...';
  }
  
  // Show cancel button when inspection starts
  const cancelTimerBtn = document.getElementById('mainCancelTimerBtn');
  if (cancelTimerBtn) {
    cancelTimerBtn.style.display = 'block';
  }
  
  inspectionInterval = setInterval(() => {
    inspectionTimeLeft--;
    
    // Update inspection timer display
    if (inspectionTimer) {
      inspectionTimer.textContent = inspectionTimeLeft;
    }
    
    // If inspection time runs out, start the timer automatically
    if (inspectionTimeLeft <= 0) {
      clearInterval(inspectionInterval);
      inspectionInterval = null;
      isInspecting = false;
      
      // Hide inspection timer
      if (inspectionTimer) {
        inspectionTimer.style.display = 'none';
      }
      
      // Start the actual timer
      startTimer();
    }
  }, 1000);
}

function startTimer() {
  // Only start timer if allowed (not in cooldown period)
  if (running || isInspecting) return;
  
  // Check if we're in the cooldown period by checking the timer text
  if (timerCircle && timerCircle.textContent.startsWith('Time:')) {
    return; // Don't start timer during cooldown period
  }
  
  resetTimerUI();
  
  running = true;
  startMs = performance.now();
  timerCircle.classList.add('running');
  interval = setInterval(() => {
    const cur = performance.now() - startMs;
    setCircle(fmtHMSms(cur), 'running');
  }, 16);
  
  // Show cancel button when timer starts
  const cancelTimerBtn = document.getElementById('mainCancelTimerBtn');
  if (cancelTimerBtn) {
    cancelTimerBtn.style.display = 'block';
  }
}

function cancelTimer() {
  // Stop the main timer if running
  if (running) {
    running = false;
    clearInterval(interval);
    timerCircle.classList.remove('running');
  }
  
  // Stop inspection timer if running
  if (isInspecting) {
    isInspecting = false;
    if (inspectionInterval) {
      clearInterval(inspectionInterval);
      inspectionInterval = null;
    }
    
    // Hide inspection timer
    const inspectionTimer = document.getElementById('inspectionTimer');
    if (inspectionTimer) {
      inspectionTimer.style.display = 'none';
    }
  }
  
  // Reset UI
  resetTimerUI();
}

function resetTimerUI() {
  setCircle(getTranslation('tap-to-start') || 'Tap or Hold to start', null, 'running');
  if (recordMessage) recordMessage.textContent = '';
  
  // Hide cancel timer button
  const cancelTimerBtn = document.getElementById('mainCancelTimerBtn');
  if (cancelTimerBtn) {
    cancelTimerBtn.style.display = 'none';
  }
  
  // Always show the main timer circle
  if (timerCircle) {
    timerCircle.style.display = 'flex';
  }
  
  // Hide inspection timer
  const inspectionTimer = document.getElementById('inspectionTimer');
  if (inspectionTimer) {
    inspectionTimer.style.display = 'none';
  }
}

/* =========================
   TIMER EVENT HANDLERS (COMPLETELY REWRITTEN TO PREVENT DOUBLE CLICKING)
   ========================= */
let pressStartTime = 0;
let isProcessing = false;

function onPress(e) {
  e.preventDefault();
  
  // Prevent processing if already handling an event
  if (isProcessing) return;
  
  pressStartTime = new Date().getTime();
  
  if (running) {
    // If timer is running, stop it
    isProcessing = true;
    stopTimer();
    setTimeout(() => { isProcessing = false; }, 300); // Prevent double click for 300ms
  } else if (isInspecting) {
    // If inspecting, start the actual timer
    isProcessing = true;
    
    // Cancel inspection
    if (inspectionInterval) {
      clearInterval(inspectionInterval);
      inspectionInterval = null;
    }
    isInspecting = false;
    
    // Hide inspection timer
    const inspectionTimer = document.getElementById('inspectionTimer');
    if (inspectionTimer) {
      inspectionTimer.style.display = 'none';
    }
    
    // Start the actual timer
    startTimer();
    
    setTimeout(() => { isProcessing = false; }, 300); // Prevent double click for 300ms
  } else {
    // Check if we're in cooldown period
    if (timerCircle && timerCircle.textContent.startsWith('Time:')) {
      return; // Don't start anything during cooldown period
    }
    
    // Timer is not running and not inspecting
    // Don't start immediately, wait for release or hold
    // The actual start will happen in onRelease or through hold detection
  }
}

function onRelease(e) {
  e.preventDefault();
  
  // Prevent processing if already handling an event
  if (isProcessing) return;
  
  const pressDuration = new Date().getTime() - pressStartTime;
  
  if (running) {
    // Timer is already handled in onPress for stopping
    return;
  } else if (isInspecting) {
    // Inspection is already handled in onPress for starting timer
    return;
  } else {
    // Check if we're in cooldown period
    if (timerCircle && timerCircle.textContent.startsWith('Time:')) {
      return; // Don't start anything during cooldown period
    }
    
    // Start timer based on press duration and settings
    isProcessing = true;
    
    if (settings.enabledFeatures && settings.enabledFeatures.inspectionTimer) {
      // If press was long (hold), start inspection
      if (pressDuration > (settings.inspectionDelay || 200)) {
        startInspection();
      } else {
        // If press was short (click), start timer immediately
        startTimer();
      }
    } else {
      // If inspection is disabled, start timer immediately
      startTimer();
    }
    
    setTimeout(() => { isProcessing = false; }, 300); // Prevent double click for 300ms
  }
}

/* =========================
   SOLVE MANAGEMENT
   ========================= */
async function saveSolve(cubeType, durationMs) {
  // Check if saving unknown solves is disabled
  if (cubeType === hiddenDefaultType && 
      settings.enabledFeatures && 
      settings.enabledFeatures.saveUnknownSolves === false) {
    if (recordMessage) {
      recordMessage.textContent = getTranslation('solve-not-saved-unknown') || 'Solve not saved (unknown cube type and saving disabled).';
    }
    return;
  }
  
  const isRecord = !records[cubeType] || durationMs < records[cubeType];
  const entry = {
    cube: cubeType,
    ms: durationMs,
    record: isRecord,
    timestamp: nowISO()
  };
  
  try {
    const response = await apiPost('/times', entry);
    if (response.ok) {
      const savedEntry = await response.json();
      times.push(savedEntry);
      
      if (isRecord) {
        records[cubeType] = durationMs;
        // Save records to server
        await apiPost('/records', records);
        if (recordMessage) {
          recordMessage.innerHTML = '<div class="record-broken">🎉 NEW RECORD! 🎉</div>';
        }
      } else {
        if (recordMessage) {
          recordMessage.textContent = getTranslation('solve-saved') || 'Solve saved!';
        }
      }
      
      updateHistoryPanel();
    } else {
      if (recordMessage) {
        recordMessage.textContent = getTranslation('error-saving-solve') || 'Error saving solve';
      }
    }
  } catch (e) {
    console.error('Error saving solve:', e);
    if (recordMessage) {
      recordMessage.textContent = getTranslation('error-saving-solve') || 'Error saving solve';
    }
  }
}

/* =========================
   MODAL FUNCTIONS
   ========================= */
function openSelectModal(currentSelection = "") {
  const cubeSelect = document.getElementById('cubeSelect');
  const selectMessage = document.getElementById('selectMessage');
  
  if (!cubeSelect || !selectMessage) return;
  
  // Populate main cube select
  cubeSelect.innerHTML = '';
  defaultCubeTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = getCubeDisplayName(type);
    
    if (type === currentSelection) option.selected = true;
    cubeSelect.appendChild(option);
  });
  
  selectMessage.textContent = '';
  const newCube = document.getElementById('newCube');
  const renameCube = document.getElementById('renameCube');
  
  if (newCube) newCube.value = '';
  if (renameCube) renameCube.value = '';
  
  document.getElementById('selectModal').style.display = 'flex';
}

function closeSelectModal() {
  document.getElementById('selectModal').style.display = 'none';
}

function openTimesModal() {
  refreshFilterOptions().then(() => {
    // Add a small delay to ensure filter options are populated before rendering the table
    setTimeout(() => {
      renderTimesModal();
    }, 10);
  }).catch((error) => {
    console.error('Error refreshing filter options:', error);
    // Still try to render the modal even if filter options failed
    renderTimesModal();
  });
  
  const timesModal = document.getElementById('timesModal');
  if (timesModal) {
    timesModal.style.display = 'flex';
    timesModal.scrollTop = 0;
  }
}

function closeTimesModal() {
  document.getElementById('timesModal').style.display = 'none';
}

function openSettingsModal() {
  updateSettingsUI();
  document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

function openImportExportModal(mode) {
  window.importExportMode = mode;
  document.getElementById('importExportModal').style.display = 'flex';
}

function closeImportExportModal() {
  document.getElementById('importExportModal').style.display = 'none';
}

function openFileOperationModal(type) {
  window.importExportType = type;
  document.getElementById('fileOperationModal').style.display = 'flex';
}

function closeFileOperationModal() {
  document.getElementById('fileOperationModal').style.display = 'none';
}

/* =========================
   SETTINGS MANAGEMENT
   ========================= */
function updateSettingsUI() {
  // Update language selector
  if (document.getElementById('languageSelect')) {
    document.getElementById('languageSelect').value = settings.language || 'en';
  }
  
  // Update feature toggles
  if (document.getElementById('inspectionTimerToggle') && settings.enabledFeatures) {
    document.getElementById('inspectionTimerToggle').checked = settings.enabledFeatures.inspectionTimer !== false;
  }
  if (document.getElementById('saveUnknownToggle') && settings.enabledFeatures) {
    document.getElementById('saveUnknownToggle').checked = settings.enabledFeatures.saveUnknownSolves !== false;
  }
  
  // Update timer display duration input
  if (document.getElementById('timerDisplayDurationInput') && settings.timerDisplayDuration) {
    document.getElementById('timerDisplayDurationInput').value = settings.timerDisplayDuration;
  }
  
  // Update inspection time input
  if (document.getElementById('inspectionTimeInput') && settings.inspectionTime) {
    document.getElementById('inspectionTimeInput').value = settings.inspectionTime;
  }
  
  // Update UI text based on language
  updateUIText();
  
  // Position settings button based on language
  const settingsBtn = document.getElementById('settingsGearBtn');
  if (settingsBtn) {
    if (settings.language === 'fa') {
      settingsBtn.classList.add('persian');
    } else {
      settingsBtn.classList.remove('persian');
    }
  }
}

async function saveSettings() {
  try {
    // Update settings object with current UI values
    settings.language = document.getElementById('languageSelect').value || 'en';
    settings.enabledFeatures = settings.enabledFeatures || {};
    settings.enabledFeatures.inspectionTimer = document.getElementById('inspectionTimerToggle')?.checked !== false;
    settings.enabledFeatures.saveUnknownSolves = document.getElementById('saveUnknownToggle')?.checked !== false;
    settings.timerDisplayDuration = parseInt(document.getElementById('timerDisplayDurationInput')?.value) || 1500;
    settings.inspectionTime = parseInt(document.getElementById('inspectionTimeInput')?.value) || 15;
    settings.inspectionDelay = parseInt(document.getElementById('inspectionDelayInput')?.value) || 200;
    
    // Save settings to server
    await apiPost('/settings', settings);
    
    // Update UI based on new settings
    updateSettingsUI();
    
    // Position settings button based on language
    const settingsBtn = document.getElementById('settingsGearBtn');
    if (settingsBtn) {
      if (settings.language === 'fa') {
        settingsBtn.classList.add('persian');
      } else {
        settingsBtn.classList.remove('persian');
      }
    }
    
    // Load translations based on selected language
    loadTranslations(settings.language || 'en');
    updateUIText();
    
    // Specifically update timer text to ensure it's correct
    if (timerCircle && !running) {
      const timerText = getTranslation('tap-to-start');
      timerCircle.textContent = timerText;
    }
    
    closeSettingsModal();
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

async function resetSettings() {
  if (!confirm(getTranslation('confirm-reset-settings') || 'Are you sure you want to reset all settings to default?')) return;
  
  // Default settings
  const defaultSettings = {
    language: 'en',
    enabledFeatures: {
      inspectionTimer: true,
      saveUnknownSolves: true
    },
    timerDisplayDuration: 1500,
    inspectionTime: 15,
    inspectionDelay: 200
  };
  
  try {
    // Save default settings
    await apiPost('/settings', defaultSettings);
    settings = {...settings, ...defaultSettings};
    
    // Update UI elements to reflect default settings
    document.getElementById('languageSelect').value = defaultSettings.language;
    document.getElementById('inspectionTimerToggle').checked = defaultSettings.enabledFeatures.inspectionTimer;
    document.getElementById('saveUnknownToggle').checked = defaultSettings.enabledFeatures.saveUnknownSolves;
    document.getElementById('timerDisplayDurationInput').value = defaultSettings.timerDisplayDuration;
    document.getElementById('inspectionTimeInput').value = defaultSettings.inspectionTime;
    document.getElementById('inspectionDelayInput').value = defaultSettings.inspectionDelay;
    
    // Load translations based on default language
    loadTranslations(defaultSettings.language);
    
    // Position settings button based on language
    const settingsBtn = document.getElementById('settingsGearBtn');
    if (settingsBtn) {
      if (defaultSettings.language === 'fa') {
        settingsBtn.classList.add('persian');
      } else {
        settingsBtn.classList.remove('persian');
      }
    }
    
    // Update all UI text based on selected language
    updateUIText();
    
    // Specifically update timer text to ensure it's correct
    if (timerCircle && !running) {
      const timerText = getTranslation('tap-to-start');
      timerCircle.textContent = timerText;
    }
    
    closeSettingsModal();
  } catch (e) {
    console.error('Error resetting settings:', e);
  }
}

/* =========================
   CUBE MANAGEMENT
   ========================= */
async function addCube() {
  const newCube = document.getElementById('newCube');
  const selectMessage = document.getElementById('selectMessage');
  if (!newCube || !selectMessage) return;
  
  const val = newCube.value.trim();
  if (!val) { 
    selectMessage.textContent = getTranslation('enter-new-name') || "Please enter a name.";
    selectMessage.className = "message error-message";
    return; 
  }
  
  // Check if cube already exists
  const existingCube = defaultCubeTypes.find(cube => cube === val);
  
  if (existingCube) { 
    selectMessage.textContent = getTranslation('name-already-exists') || "Name already exists.";
    selectMessage.className = "message error-message";
    return; 
  }
  
  try {
    // Add cube as is
    const cubeToAdd = val;
    
    await apiPost('/cubes', { cube: cubeToAdd });
    defaultCubeTypes.push(cubeToAdd);
    openSelectModal(cubeToAdd); // Refresh the modal with the new selection
    selectMessage.textContent = getTranslation('cube-added-successfully') || "Cube added successfully!";
    selectMessage.className = "message success-message";
  } catch (e) {
    console.error('Error adding cube:', e);
    selectMessage.textContent = getTranslation('error-adding-cube') || "Error adding cube";
    selectMessage.className = "message error-message";
  }
}

async function removeCube() {
  const cubeSelect = document.getElementById('cubeSelect');
  const selectMessage = document.getElementById('selectMessage');
  if (!cubeSelect || !selectMessage) return;
  
  const val = cubeSelect.value;
  if (!val) return;
  if (!confirm(`${getTranslation('confirm-remove')} '${val}'? ${getTranslation('cannot-undone') || 'This cannot be undone.'}`)) return;
  
  try {
    await apiDelete(`/cubes/${encodeURIComponent(val)}`);
    defaultCubeTypes = defaultCubeTypes.filter(c => c !== val);
    openSelectModal(); // Refresh the modal
    selectMessage.textContent = getTranslation('cube-removed') || "Cube removed";
    selectMessage.className = "message success-message";
  } catch (e) {
    console.error('Error removing cube:', e);
    selectMessage.textContent = getTranslation('error-removing-cube') || "Error removing cube";
    selectMessage.className = "message error-message";
  }
}

async function renameCube() {
  const cubeSelect = document.getElementById('cubeSelect');
  const renameInput = document.getElementById('renameCube');
  const selectMessage = document.getElementById('selectMessage');
  if (!cubeSelect || !renameInput || !selectMessage) return;
  
  const oldVal = cubeSelect.value;
  const newVal = (renameInput.value || '').trim();
  if (!oldVal || !newVal) { 
    selectMessage.textContent = getTranslation('enter-new-name') || "Enter a new name.";
    selectMessage.className = "message error-message";
    return; 
  }
  
  // Check if new name already exists
  const existingCube = defaultCubeTypes.find(cube => cube === newVal);
  
  if (existingCube) { 
    selectMessage.textContent = getTranslation('name-already-exists') || "Name already exists.";
    selectMessage.className = "message error-message";
    return; 
  }
  
  try {
    // Use new name as is
    const newNameWithLang = newVal;
    
    await apiPost('/cubes/rename', { oldName: oldVal, newName: newNameWithLang });
    defaultCubeTypes = defaultCubeTypes.map(c => c === oldVal ? newNameWithLang : c);
    openSelectModal(newNameWithLang); // Refresh the modal with the new selection
    selectMessage.textContent = getTranslation('cube-renamed') || "Cube renamed";
    selectMessage.className = "message success-message";
  } catch (e) {
    console.error('Error renaming cube:', e);
    selectMessage.textContent = getTranslation('error-renaming-cube') || "Error renaming cube";
    selectMessage.className = "message error-message";
  }
}

/* =========================
   MULTILINGUAL CUBE MANAGEMENT (SIMPLIFIED)
   ========================= */
   
// Function to get the display name for a cube based on current UI language
function getCubeDisplayName(cubeName) {
  // For standard cube types, translate if needed
  if (settings.language === 'fa') {
    const cubeTranslations = {
      '2x2': '۲×۲',
      '3x3': '۳×۳',
      '4x4': '۴×۴',
      '5x5': '۵×۵',
      'Pyraminx': 'پیرامینکس',
      'Megaminx': 'مگامینکس',
      'Skewb': 'اسکیوب',
      'Square-1': 'اسکوئر وان',
      'Clock': 'ساعت',
      '???': '???'
    };
    return cubeTranslations[cubeName] || cubeName;
  } else {
    return cubeName;
  }
}

// Simple cube creation
async function addMultilingualName() {
  // This function is no longer needed as we're simplifying the system
  // Keeping it for compatibility but it will just call addCube
  await addCube();
}

/* =========================
   TIMES MANAGEMENT
   ========================= */
async function loadTimes() {
  try {
    times = await apiGet('/times');
  } catch (e) {
    console.error('Error loading times:', e);
  }
}

async function deleteTime(id) {
  try {
    await apiDelete(`/times/${id}`);
    times = times.filter(t => t.id !== id);
    updateHistoryPanel();
    renderTimesModal();
  } catch (e) {
    console.error('Error deleting time:', e);
  }
}

async function updateTimeType(id, newType) {
  try {
    await apiPut(`/times/${id}/type`, { cube: newType });
    const timeEntry = times.find(t => t.id === id);
    if (timeEntry) timeEntry.cube = newType;
    updateHistoryPanel();
    renderTimesModal();
  } catch (e) {
    console.error('Error updating time type:', e);
  }
}

function refreshFilterOptions(){
  const filterSelect = document.getElementById('filterSelect');
  if (!filterSelect) return Promise.resolve(); // Return a resolved promise if no filter select
  
  // Clear existing options
  filterSelect.innerHTML = '';
  
  // Add the "all" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = getTranslation('all') || 'All';
  filterSelect.appendChild(allOption);
  
  // Get unique cube types and sort them
  const cubesForFilter = [...new Set(times.map(t => t.cube))].sort();
  
  // Add each cube type as an option
  cubesForFilter.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = getCubeDisplayName(c);
    filterSelect.appendChild(opt);
  });
  
  return Promise.resolve();
}

function renderTimesModal(){
  const filterVal = document.getElementById('filterSelect').value;
  const sortVal = document.getElementById('sortSelect').value;

  let arr = times.slice();
  if (filterVal !== 'all') arr = arr.filter(t => t.cube === filterVal);

  if (sortVal === 'fastest') arr.sort((a,b)=>a.ms-b.ms);
  else if (sortVal === 'slowest') arr.sort((a,b)=>b.ms-a.ms);
  else if (sortVal === 'first') arr.sort((a,b)=> (a.id||0) - (b.id||0));
  else arr.sort((a,b)=> (b.id||0) - (a.id||0));

  const body = document.getElementById('timesBody');
  if (!body) return; // Add safety check
  
  if (!arr.length) {
    body.innerHTML = '';
    const noTimesElement = document.getElementById('noTimes');
    if (noTimesElement) noTimesElement.style.display = 'block';
  } else {
    const noTimesElement = document.getElementById('noTimes');
    if (noTimesElement) noTimesElement.style.display = 'none';
    body.innerHTML = arr.map((t,i)=> `
      <tr>
        <td>${i+1}</td>
        <td>${getCubeDisplayName(t.cube)}${t.record?' 🎉':''}</td>
        <td>${fmtHMSms(t.ms)}</td>
        <td>
          <select class="times-select" data-id="${t.id}">
            ${defaultCubeTypes.map(c => `<option value="${c}" ${c===t.cube?'selected':''}>${getCubeDisplayName(c)}</option>`).join('')}
          </select>
        </td>
        <td><button class="delete-btn" data-del="${t.id}">${getTranslation('delete') || 'Delete'}</button></td>
      </tr>
    `).join('');
  }

  // Event handlers for table actions
  const selectElements = body.querySelectorAll('select.times-select');
  selectElements.forEach(sel=>{
    // Remove existing event listeners to prevent duplicates
    const clone = sel.cloneNode(true);
    sel.parentNode.replaceChild(clone, sel);
    
    clone.addEventListener('change', async (e)=>{
      const id = parseInt(e.target.getAttribute('data-id'),10);
      const newType = e.target.value;
      await updateTimeType(id, newType);
      renderTimesModal(); // Re-render to update any changes
    });
  });
  
  const deleteButtons = body.querySelectorAll('button[data-del]');
  deleteButtons.forEach(btn=>{
    // Remove existing event listeners to prevent duplicates
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    
    clone.addEventListener('click', async (e)=>{
      const id = parseInt(e.target.getAttribute('data-del'),10);
      await deleteTime(id);
      renderTimesModal(); // Re-render to update the table
    });
  });
}

async function clearAllTimes() {
  if (!confirm(getTranslation('delete-all-times') || 'Delete ALL solve times?')) return;
  try {
    await apiPost('/times/clear', {});
    times = [];
    updateHistoryPanel();
    renderTimesModal();
  } catch (e) {
    console.error('Error clearing times:', e);
  }
}

async function clearRecords() {
  if (!confirm(getTranslation('clear-all-records') || 'Clear all records?')) return;
  try {
    await apiPost('/records/clear', {});
    records = {};
    updateHistoryPanel();
    renderTimesModal();
  } catch (e) {
    console.error('Error clearing records:', e);
  }
}

/* =========================
   HISTORY PANEL
   ========================= */
function updateHistoryPanel(){
  const historyDiv = document.getElementById('history');
  if (!historyDiv) return;
  
  // Records line
  let recordsText = `<b>${getTranslation('records') || 'Records'}:</b><br>`;
  const keys = Object.keys(records);
  if (keys.length) {
    recordsText += keys.map(k => {
      return `${getCubeDisplayName(k)}: ${fmtHMSms(records[k])}`;
    }).join(' | ');
  } else {
    recordsText += getTranslation('no-records') || 'No records yet.';
  }
  // Recent solves (last 10)
  let solvesText = `<br><br><b>${getTranslation('recent-solves') || 'Recent Solves'}:</b><br>`;
  if (times.length) {
    const recent = times.slice(-10).reverse();
    solvesText += recent.map((x, i) => {
      const idx = times.length - i;
      let t = `#${idx}: [${getCubeDisplayName(x.cube)}] ${fmtHMSms(x.ms)}`;
      if (records[x.cube] && x.ms === records[x.cube]) t += ' 🎉';
      return t;
    }).join('<br>');
  } else {
    solvesText += getTranslation('no-solves') || 'No solves yet.';
  }
  historyDiv.innerHTML = recordsText + solvesText;
}

/* =========================
   IMPORT/EXPORT
   ========================= */
async function exportData() {
  try {
    // Get current data from server
    const timesData = await apiGet('/times');
    const recordsData = await apiGet('/records');
    const cubesData = await apiGet('/cubes');
    const settingsData = await apiGet('/settings');
    
    const payload = {
      times: timesData,
      records: recordsData,
      cubes: cubesData,
      settings: settingsData
    };
    
    // Store the data in a global variable for later use
    window.exportDataPayload = payload;
    
    // Open the file operation modal
    openFileOperationModal('export');
  } catch (e) {
    console.error('Error exporting data:', e);
    alert(getTranslation('error-exporting') || 'Error exporting data');
  }
}

async function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const r = new FileReader();
    r.onload = async function(){
      try {
        const obj = JSON.parse(this.result);
        
        // Import data to server
        if (obj.times) {
          // Clear existing times
          await apiPost('/times/clear', {});
          // Add new times
          for (const time of obj.times) {
            await apiPost('/times', time);
          }
        }
        
        if (obj.records) {
          await apiPost('/records', obj.records);
        }
        
        if (obj.cubes) {
          // Clear existing cubes
          await apiPost('/cubes/clear', {});
          // Add new cubes
          for (const cube of obj.cubes) {
            await apiPost('/cubes', {cube: cube});
          }
        }
        
        if (obj.settings) {
          await apiPost('/settings', obj.settings);
        }
        
        // Reload data
        await initializeApp();
        alert(getTranslation('import-success') || 'Import successful');
      } catch(e) {
        console.error('Import failed:', e);
        alert(getTranslation('import-failed') || 'Import failed');
      }
    };
    r.readAsText(file);
  };
  input.click();
}

// Add these functions for file operations
function saveToFile() {
  if (!window.exportDataPayload) return;
  
  try {
    const blob = new Blob([JSON.stringify(window.exportDataPayload, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rubik_timer_data.json';
    a.click();
    closeFileOperationModal();
  } catch (e) {
    console.error('Error saving to file:', e);
    alert('Error saving to file');
  }
}

function copyToClipboard() {
  if (!window.exportDataPayload) return;
  
  try {
    const dataStr = JSON.stringify(window.exportDataPayload, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      alert(getTranslation('data-copied-to-clipboard') || 'Data copied to clipboard');
      closeFileOperationModal();
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      alert(getTranslation('error-copying-to-clipboard') || 'Error copying to clipboard');
    });
  } catch (e) {
    console.error('Error copying to clipboard:', e);
    alert(getTranslation('error-copying-to-clipboard') || 'Error copying to clipboard');
  }
}

/* =========================
   INITIALIZATION
   ========================= */
async function loadSettings() {
  try {
    settings = await apiGet('/settings');
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

async function loadCubes() {
  try {
    defaultCubeTypes = await apiGet('/cubes');
  } catch (e) {
    console.error('Error loading cubes:', e);
  }
}

async function loadRecords() {
  try {
    records = await apiGet('/records');
  } catch (e) {
    console.error('Error loading records:', e);
  }
}

async function initializeApp(){
  try {
    // Load all data
    await loadSettings();
    await loadCubes();
    await loadTimes();
    await loadRecords();
    
    // Initialize UI
    selectedCubePre = '';
    resetTimerUI();
    if (solvedTypeName) solvedTypeName.textContent = selectedCubePre || hiddenDefaultType;
    updateHistoryPanel();
    updateSettingsUI();
    
    // Load translations
    loadTranslations(settings.language || 'en');
    updateUIText();
    
    // Add event listeners
    addEventListeners();
  } catch (e) {
    console.error('Error initializing app:', e);
  }
}

function addEventListeners() {
  // Timer circle event listeners (IMPROVED)
  if (timerCircle) {
    timerCircle.addEventListener('mousedown', onPress);
    timerCircle.addEventListener('mouseup', onRelease);
    timerCircle.addEventListener('touchstart', onPress, {passive: false});
    timerCircle.addEventListener('touchend', onRelease, {passive: false});
  }
  
  // Cancel timer button event listener
  const cancelTimerBtn = document.getElementById('mainCancelTimerBtn');
  if (cancelTimerBtn) {
    cancelTimerBtn.addEventListener('click', cancelTimer);
  }
  
  // Button event listeners
  const openSelectBtn = document.getElementById('openSelectBtn');
  if (openSelectBtn) {
    openSelectBtn.addEventListener('click', () => {
      openSelectModal(selectedCubePre);
    });
  }
  
  const viewTimesBtn = document.getElementById('viewTimesBtn');
  if (viewTimesBtn) {
    viewTimesBtn.addEventListener('click', () => {
      openTimesModal();
    });
  }
  
  const changeRubikBtn = document.getElementById('changeRubikBtn');
  if (changeRubikBtn) {
    changeRubikBtn.addEventListener('click', () => {
      openSelectModal(selectedCubePre);
    });
  }
  
  const cancelTimerBtnOld = document.getElementById('cancelTimerBtn');
  if (cancelTimerBtnOld) {
    cancelTimerBtnOld.addEventListener('click', () => {
      resetTimerUI();
    });
  }
  
  // Modal event listeners
  const selectModal = document.getElementById('selectModal');
  if (selectModal) {
    selectModal.addEventListener('click', (e) => {
      if (e.target === selectModal) closeSelectModal();
    });
  }
  
  const timesModal = document.getElementById('timesModal');
  if (timesModal) {
    timesModal.addEventListener('click', (e) => {
      if (e.target === timesModal) closeTimesModal();
    });
  }
  
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsModal();
    });
  }
  
  const importExportModal = document.getElementById('importExportModal');
  if (importExportModal) {
    importExportModal.addEventListener('click', (e) => {
      if (e.target === importExportModal) closeImportExportModal();
    });
  }
  
  const fileOperationModal = document.getElementById('fileOperationModal');
  if (fileOperationModal) {
    fileOperationModal.addEventListener('click', (e) => {
      if (e.target === fileOperationModal) closeFileOperationModal();
    });
  }
  
  // Button event listeners for modals
  const addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.addEventListener('click', addCube);
  
  const removeBtn = document.getElementById('removeBtn');
  if (removeBtn) removeBtn.addEventListener('click', removeCube);
  
  const renameBtn = document.getElementById('renameBtn');
  if (renameBtn) renameBtn.addEventListener('click', renameCube);
  
  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) confirmBtn.addEventListener('click', () => {
    const selectedCubeValue = document.getElementById('cubeSelect').value || hiddenDefaultType;
    selectedCubePre = selectedCubeValue;
    if (solvedTypeName) solvedTypeName.textContent = getCubeDisplayName(selectedCubePre);
    // if there is a pending unknown solve, save it now as this type
    if (lastPendingUnknown && selectedCubePre !== hiddenDefaultType) {
      const saveThis = lastPendingUnknown;
      lastPendingUnknown = null;
      saveSolve(selectedCubePre, saveThis.durationMs);
      if (recordMessage) recordMessage.textContent = getTranslation('pending-solve-saved') || 'Pending ??? solve saved to ' + getCubeDisplayName(selectedCubePre);
    }
    closeSelectModal();
    if (timerCircle && !running) resetTimerUI();
  });
  
  // Multilingual button event listener
  const addMultilingualBtn = document.getElementById('addMultilingualBtn');
  if (addMultilingualBtn) {
    addMultilingualBtn.addEventListener('click', addMultilingualName);
  }
  
  const cancelSelectBtn = document.getElementById('cancelSelectBtn');
  if (cancelSelectBtn) cancelSelectBtn.addEventListener('click', closeSelectModal);
  
  const closeTimesBtn = document.getElementById('closeTimesBtn');
  if (closeTimesBtn) closeTimesBtn.addEventListener('click', closeTimesModal);
  
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTimes);
  
  const clearRecordsBtn = document.getElementById('clearRecordsBtn');
  if (clearRecordsBtn) clearRecordsBtn.addEventListener('click', clearRecords);
  
  const settingsGearBtn = document.getElementById('settingsGearBtn');
  if (settingsGearBtn) settingsGearBtn.addEventListener('click', openSettingsModal);
  
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
  
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', resetSettings);
  
  const exportSettingsBtn = document.getElementById('exportSettingsBtn');
  if (exportSettingsBtn) exportSettingsBtn.addEventListener('click', () => {
    openImportExportModal('export');
  });
  
  const importSettingsBtn = document.getElementById('importSettingsBtn');
  if (importSettingsBtn) importSettingsBtn.addEventListener('click', () => {
    openImportExportModal('import');
  });
  
  const closeImportExportBtn = document.getElementById('closeImportExportBtn');
  if (closeImportExportBtn) closeImportExportBtn.addEventListener('click', closeImportExportModal);
  
  const importExportSettingsBtn = document.getElementById('importExportSettingsBtn');
  if (importExportSettingsBtn) importExportSettingsBtn.addEventListener('click', () => {
    closeImportExportModal();
    if (window.importExportMode === 'export') {
      exportData();
    } else {
      importData();
    }
  });
  
  const importExportTimesBtn = document.getElementById('importExportTimesBtn');
  if (importExportTimesBtn) importExportTimesBtn.addEventListener('click', () => {
    closeImportExportModal();
    if (window.importExportMode === 'export') {
      exportData();
    } else {
      importData();
    }
  });
  
  const importExportBothBtn = document.getElementById('importExportBothBtn');
  if (importExportBothBtn) importExportBothBtn.addEventListener('click', () => {
    closeImportExportModal();
    if (window.importExportMode === 'export') {
      exportData();
    } else {
      importData();
    }
  });
  
  const fileOperationCloseBtn = document.getElementById('fileOperationCloseBtn');
  if (fileOperationCloseBtn) fileOperationCloseBtn.addEventListener('click', closeFileOperationModal);
  
  const fileOperationSaveBtn = document.getElementById('fileOperationSaveBtn');
  if (fileOperationSaveBtn) fileOperationSaveBtn.addEventListener('click', saveToFile);
  
  const fileOperationCopyBtn = document.getElementById('fileOperationCopyBtn');
  if (fileOperationCopyBtn) fileOperationCopyBtn.addEventListener('click', copyToClipboard);
  
  const filterSelect = document.getElementById('filterSelect');
  if (filterSelect) filterSelect.addEventListener('change', renderTimesModal);
  
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', renderTimesModal);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Update cube type translations in the UI
function updateCubeTypeTranslations() {
  // Update cube type translations in select elements
  const cubeSelects = document.querySelectorAll('#cubeSelect, #filterSelect');
  for (const select of cubeSelects) {
    for (const option of select.options) {
      const cubeType = option.value;
      // Translate cube type if it's a standard cube type
      if (currentLanguage === 'fa') {
        // Map standard cube types to Persian translations
        const cubeTranslations = {
          '2x2': '۲×۲',
          '3x3': '۳×۳',
          '4x4': '۴×۴',
          '5x5': '۵×۵',
          'Pyraminx': 'پیرامینکس',
          'Megaminx': 'مگامینکس',
          'Skewb': 'اسکیوب',
          'Square-1': 'اسکوئر وان',
          'Clock': 'ساعت',
          '???': '???'
        };
        if (cubeTranslations[cubeType]) {
          option.textContent = cubeTranslations[cubeType];
        }
      } else {
        // For English UI, just show the cube name
        option.textContent = cubeType;
      }
    }
  }
  
  // Update cube type translations in history panel
  updateHistoryPanel();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
