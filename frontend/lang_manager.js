// Load language files
let currentLanguage = 'en';
let translations = {};

// Function to load translations based on language
function loadTranslations(lang) {
  if (lang === 'fa') {
    translations = translations_fa;
    currentLanguage = 'fa';
  } else {
    translations = translations_en;
    currentLanguage = 'en';
  }
}

// Function to get translation by key
function getTranslation(key) {
  return translations[key] || key;
}

// Function to update all elements with translations
function updateUIText() {
  // Update all elements with translation keys
  const elements = document.querySelectorAll('*');
  for (const element of elements) {
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
      const text = element.childNodes[0].nodeValue.trim();
      if (text && translations[text]) {
        element.childNodes[0].nodeValue = getTranslation(text);
      }
    }
    // Special handling for buttons and other elements that might have text content
    else if (element.nodeType === 1 && element.textContent && translations[element.textContent.trim()]) {
      // Check if this is a button or other element that should be translated
      if (element.tagName === 'BUTTON' || element.classList.contains('aux-btn') || 
          element.id === 'saveSettingsBtn' || element.id === 'openSelectBtn' || 
          element.id === 'viewTimesBtn') {
        element.textContent = getTranslation(element.textContent.trim());
      }
    }
  }
  
  // Update placeholders
  const inputs = document.querySelectorAll('input[placeholder]');
  for (const input of inputs) {
    const placeholderKey = input.placeholder;
    if (placeholderKey && translations[placeholderKey]) {
      input.placeholder = getTranslation(placeholderKey);
    }
  }
  
  // Update options in select elements
  const selects = document.querySelectorAll('select');
  for (const select of selects) {
    for (const option of select.options) {
      const optionText = option.textContent;
      if (optionText && translations[optionText]) {
        option.textContent = getTranslation(optionText);
      }
    }
  }
  
  // Special handling for Persian text in timer circle
  const timerCircle = document.getElementById('timerCircle');
  if (timerCircle) {
    if (currentLanguage === 'fa') {
      timerCircle.classList.add('persian-text');
    } else {
      timerCircle.classList.remove('persian-text');
    }
  }
  
  // Update cube type translations in the UI
  updateCubeTypeTranslations();
}

// Function to update cube type translations
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

// Remove the initialization line since it's handled in the main app
// loadTranslations('en');