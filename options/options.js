const DEFAULT_OPTIONS = {
  allowedModes: {
    endsAt24h: true,
    endsAt12h: true,
    endsIn: true,
    progress: true,
    progressBar: true
  },
  pbrEnabled: true,
  sbEnabled: true,
  progressBarRemaining: "░",
  progressBarPassed: "█",
  gradientSymbol: "▒",
  // simple (default/trailing) / nonTrailing / gradient
  progressBarVariant: "simple",
  progressBarNonTrailing: false,
  progressBarGradient: false
};

const elements = {
  modeEndsAt24h: document.getElementById('modeEndsAt24h'),
  modeEndsAt12h: document.getElementById('modeEndsAt12h'),
  modeEndsIn: document.getElementById('modeEndsIn'),
  modeProgress: document.getElementById('modeProgress'),
  modeProgressBar: document.getElementById('modeProgressBar'),
  pbrEnabled: document.getElementById('pbrEnabled'),
  sbEnabled: document.getElementById('sbEnabled'),
  progressBarRemaining: document.getElementById('progressBarRemaining'),
  progressBarPassed: document.getElementById('progressBarPassed'),
  gradientSymbol: document.getElementById('gradientSymbol'),
  progressBarNonTrailing: document.getElementById('progressBarNonTrailing'),
  progressBarGradient: document.getElementById('progressBarGradient'),
  status: document.getElementById('status')
};

function ensureOneDisplayModeEnabled(checkbox) {
  if (checkbox.checked) return true;
  
  const enabledCount = [
    elements.modeEndsAt24h,
    elements.modeEndsAt12h,
    elements.modeEndsIn,
    elements.modeProgress,
    elements.modeProgressBar
  ].filter(cb => cb.checked).length;
  
  if (enabledCount < 1) {
    showStatus('At least one time format must be enabled', true);
    checkbox.checked = true;
    return false;
  }
  return true;
}

function saveOptions() {
  let variant = "simple";
  if (elements.progressBarNonTrailing.checked) {
    variant = "nonTrailing";
  } else if (elements.progressBarGradient.checked) {
    variant = "gradient";
  }
  const options = {
    allowedModes: {
      endsAt24h: elements.modeEndsAt24h.checked,
      endsAt12h: elements.modeEndsAt12h.checked,
      endsIn: elements.modeEndsIn.checked,
      progress: elements.modeProgress.checked,
      progressBar: elements.modeProgressBar.checked
    },
    pbrEnabled: elements.pbrEnabled.checked,
    sbEnabled: elements.sbEnabled.checked,
    progressBarRemaining: elements.progressBarRemaining.value,
    progressBarPassed: elements.progressBarPassed.value,
    gradientSymbol: elements.gradientSymbol.value,
    progressBarVariant: variant,
    progressBarNonTrailing: elements.progressBarNonTrailing.checked,
    progressBarGradient: elements.progressBarGradient.checked
  };
  browser.storage.local.set(options).then(() => {
    showStatus('Options saved!');
  }, (error) => {
    showStatus('Error saving options: ' + error, true);
  });
}

function loadOptions() {
  browser.storage.local.get(DEFAULT_OPTIONS).then((options) => {
    elements.modeEndsAt24h.checked = options.allowedModes.endsAt24h;
    elements.modeEndsAt12h.checked = options.allowedModes.endsAt12h;
    elements.modeEndsIn.checked = options.allowedModes.endsIn;
    elements.modeProgress.checked = options.allowedModes.progress;
    elements.modeProgressBar.checked = options.allowedModes.progressBar;
    elements.pbrEnabled.checked = options.pbrEnabled;
    elements.sbEnabled.checked = options.sbEnabled;
    
    elements.progressBarRemaining.value = options.progressBarRemaining;
    elements.progressBarPassed.value = options.progressBarPassed;
    elements.gradientSymbol.value = options.gradientSymbol;
    
    if(options.progressBarVariant === "nonTrailing"){
      elements.progressBarNonTrailing.checked = true;
      elements.progressBarGradient.checked = false;
    } else if(options.progressBarVariant === "gradient"){
      elements.progressBarNonTrailing.checked = false;
      elements.progressBarGradient.checked = true;
    } else {
      elements.progressBarNonTrailing.checked = false;
      elements.progressBarGradient.checked = false;
    }
    
    const anyModeEnabled = options.allowedModes.endsAt24h || 
                           options.allowedModes.endsAt12h || 
                           options.allowedModes.endsIn || 
                           options.allowedModes.progress ||
                           options.allowedModes.progressBar;
    if (!anyModeEnabled) {
      elements.modeEndsIn.checked = true;
      saveOptions();
    }
  }, (error) => {
    console.error('Error loading options:', error);
  });
}

function showStatus(message, isError = false) {
  const status = elements.status;
  status.textContent = message;
  status.style.color = isError ? '#F44336' : '';
  status.classList.add('show');
  setTimeout(() => {
    status.classList.remove('show');
  }, 2000);
}

document.addEventListener('DOMContentLoaded', loadOptions);

elements.modeEndsAt24h.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeEndsAt12h.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeEndsIn.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeProgress.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeProgressBar.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});

elements.progressBarNonTrailing.addEventListener('change', function() {
  if (this.checked) {
    elements.progressBarGradient.checked = false;
  }
  saveOptions();
});
elements.progressBarGradient.addEventListener('change', function() {
  if (this.checked) {
    elements.progressBarNonTrailing.checked = false;
  }
  saveOptions();
});

elements.pbrEnabled.addEventListener('change', saveOptions);
elements.sbEnabled.addEventListener('change', saveOptions);
elements.progressBarRemaining.addEventListener('change', saveOptions);
elements.progressBarPassed.addEventListener('change', saveOptions);
elements.gradientSymbol.addEventListener('change', saveOptions);