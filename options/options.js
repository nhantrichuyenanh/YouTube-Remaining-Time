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
  totalSegments: 10,
  progressBarRemaining: "░",
  progressBarPassed: "█",
  gradientSymbol: "▒",
  progressBarVariant: "simple",
  progressBarNonTrailing: false,
  progressBarGradient: false,
  remainingShowMinus: false,
};

const elements = {
  modeEndsAt24h: document.getElementById('modeEndsAt24h'),
  modeEndsAt12h: document.getElementById('modeEndsAt12h'),
  modeEndsIn: document.getElementById('modeEndsIn'),
  modeProgress: document.getElementById('modeProgress'),
  modeProgressBar: document.getElementById('modeProgressBar'),
  pbrEnabled: document.getElementById('pbrEnabled'),
  sbEnabled: document.getElementById('sbEnabled'),
  totalSegments: document.getElementById('totalSegments'),
  totalSegmentsValue: document.getElementById('totalSegmentsValue'),
  progressBarRemaining: document.getElementById('progressBarRemaining'),
  progressBarPassed: document.getElementById('progressBarPassed'),
  gradientSymbol: document.getElementById('gradientSymbol'),
  progressBarSimple: document.getElementById('progressBarSimple'),
  progressBarGradient: document.getElementById('progressBarGradient'),
  progressBarNonTrailing: document.getElementById('progressBarNonTrailing'),
  remainingShowMinus: document.getElementById('remainingShowMinus'),
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
    checkbox.checked = true;
    return false;
  }
  return true;
}

function saveOptions() {
  let variant = "simple";
  if (elements.progressBarSimple.checked) {
    variant = "simple";
  } else if (elements.progressBarGradient.checked) {
    variant = "gradient";
  } else if (elements.progressBarNonTrailing.checked) {
    variant = "nonTrailing";
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
    totalSegments: Number(elements.totalSegments.value),
    progressBarRemaining: elements.progressBarRemaining.value,
    progressBarPassed: elements.progressBarPassed.value,
    gradientSymbol: elements.gradientSymbol.value,
    progressBarVariant: variant,
    progressBarNonTrailing: elements.progressBarNonTrailing.checked,
    progressBarGradient: elements.progressBarGradient.checked,
    remainingShowMinus: elements.remainingShowMinus.checked,
  };
  browser.storage.local.set(options);
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
    elements.remainingShowMinus.checked = options.remainingShowMinus;
    updateRemainingSignState();
    elements.totalSegments.value = options.totalSegments;
    elements.totalSegmentsValue.textContent = options.totalSegments;
    elements.progressBarRemaining.value = options.progressBarRemaining;
    elements.progressBarPassed.value = options.progressBarPassed;
    elements.gradientSymbol.value = options.gradientSymbol;

    if (options.progressBarVariant === "nonTrailing") {
      elements.progressBarNonTrailing.checked = true;
      elements.progressBarGradient.checked = false;
      elements.progressBarSimple.checked = false;
    } else if (options.progressBarVariant === "gradient") {
      elements.progressBarNonTrailing.checked = false;
      elements.progressBarGradient.checked = true;
      elements.progressBarSimple.checked = false;
    } else {
      elements.progressBarNonTrailing.checked = false;
      elements.progressBarGradient.checked = false;
      elements.progressBarSimple.checked = true;
    }

    updateProgressBarState();

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

function enforceSingleVariant(changedElement) {
  if (!elements.progressBarSimple.checked &&
      !elements.progressBarGradient.checked &&
      !elements.progressBarNonTrailing.checked) {
    changedElement.checked = true;
  } else {
    if (changedElement === elements.progressBarSimple && changedElement.checked) {
      elements.progressBarGradient.checked = false;
      elements.progressBarNonTrailing.checked = false;
    }
    if (changedElement === elements.progressBarGradient && changedElement.checked) {
      elements.progressBarSimple.checked = false;
      elements.progressBarNonTrailing.checked = false;
    }
    if (changedElement === elements.progressBarNonTrailing && changedElement.checked) {
      elements.progressBarSimple.checked = false;
      elements.progressBarGradient.checked = false;
    }
  }
  saveOptions();
}

function updateProgressBarState() {
  const progressBarSettings = document.querySelector('.progressBarSettings');
  const isProgressBarEnabled = elements.modeProgressBar.checked;

  if (isProgressBarEnabled) {
    progressBarSettings.classList.remove('disabled');
  } else {
    progressBarSettings.classList.add('disabled');
  }
}

function updateRemainingSignState() {
  const isEnabled = elements.modeEndsIn.checked;
  elements.remainingShowMinus.style.opacity = isEnabled ? '1' : '0.4';
  elements.remainingShowMinus.style.pointerEvents = isEnabled ? 'auto' : 'none';
  const label = document.querySelector('label[for="remainingShowMinus"]');
  label.style.opacity = isEnabled ? '1' : '0.4';
  label.style.pointerEvents = isEnabled ? 'auto' : 'none';
}

function enforceMinLimitOfOne(input) {
  const graphemes = [...new Intl.Segmenter().segment(input.value)].map(s => s.segment);
  if (graphemes.length > 1) { input.value = graphemes[0]; }
}

document.addEventListener('DOMContentLoaded', loadOptions);

elements.modeEndsAt24h.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeEndsAt12h.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeEndsIn.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) {
    updateRemainingSignState();
    saveOptions();
  }
});
elements.modeProgress.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) saveOptions();
});
elements.modeProgressBar.addEventListener('change', function() {
  if (ensureOneDisplayModeEnabled(this)) {
    updateProgressBarState();
    saveOptions();
  }
});

elements.progressBarSimple.addEventListener('change', function() {
  enforceSingleVariant(this);
});
elements.progressBarGradient.addEventListener('change', function() {
  enforceSingleVariant(this);
});
elements.progressBarNonTrailing.addEventListener('change', function() {
  enforceSingleVariant(this);
});

elements.pbrEnabled.addEventListener('change', saveOptions);
elements.sbEnabled.addEventListener('change', saveOptions);
elements.progressBarRemaining.addEventListener('change', saveOptions);
elements.remainingShowMinus.addEventListener('change', saveOptions);
elements.progressBarPassed.addEventListener('change', saveOptions);
elements.gradientSymbol.addEventListener('change', saveOptions);
elements.progressBarRemaining.addEventListener('input', function() { enforceMinLimitOfOne(this); saveOptions(); });
elements.progressBarPassed.addEventListener('input', function() { enforceMinLimitOfOne(this); saveOptions(); });
elements.gradientSymbol.addEventListener('input', function() { enforceMinLimitOfOne(this); saveOptions(); });
elements.totalSegments.addEventListener('input', function() {
  elements.totalSegmentsValue.textContent = elements.totalSegments.value;
  saveOptions();
});