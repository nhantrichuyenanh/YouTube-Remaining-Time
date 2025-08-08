const TIME_MODES = {
  ENDS_AT_24: 'endsAt24h',      // HH:MM
  ENDS_AT_12: 'endsAt12h',      // HH:MM AM/PM
  REMAINING: 'endsIn',          // HH:MM:SS
  PROGRESS: 'progress',         // %
  PROGRESS_BAR: 'progressBar'   // █████░░░░░
};

let currentDisplayMode = TIME_MODES.REMAINING;
let state = {
  options: {
    allowedModes: {
      endsAt24h: false,
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
    progressBarVariant: "simple",
    progressBarNonTrailing: false,
    progressBarGradient: false
  }
};

// state tracking
let isInitialized = false;
let isAnimationRunning = false;
let initializationRetries = 0;
const MAX_INIT_RETRIES = 20;

// extension settings
async function initializeExtension() {
  try {
    const result = await browser.storage.local.get([
      'allowedModes', 'displayMode', 'pbrEnabled', 'sbEnabled', 'totalSegments',
      'progressBarRemaining', 'progressBarPassed', 'gradientSymbol',
      'progressBarVariant', 'progressBarNonTrailing', 'progressBarGradient'
    ]);

    // update state with stored options
    if (result.allowedModes) {
      state.options.allowedModes = result.allowedModes;
    }
    if (result.pbrEnabled !== undefined) {
      state.options.pbrEnabled = result.pbrEnabled;
    }
    if (result.sbEnabled !== undefined) {
      state.options.sbEnabled = result.sbEnabled;
    }
    if (result.progressBarRemaining) {
      state.options.progressBarRemaining = result.progressBarRemaining;
    }
    if (result.progressBarPassed) {
      state.options.progressBarPassed = result.progressBarPassed;
    }
    if (result.gradientSymbol) {
      state.options.gradientSymbol = result.gradientSymbol;
    }
    if (result.progressBarVariant) {
      state.options.progressBarVariant = result.progressBarVariant;
    }
    if (result.progressBarNonTrailing !== undefined) {
      state.options.progressBarNonTrailing = result.progressBarNonTrailing;
    }
    if (result.progressBarGradient !== undefined) {
      state.options.progressBarGradient = result.progressBarGradient;
    }

    const allowedModes = getAllowedModes();

    if (result.displayMode && allowedModes.includes(result.displayMode)) {
      currentDisplayMode = result.displayMode;
    } else {
      currentDisplayMode = allowedModes[0];
      browser.storage.local.set({ displayMode: currentDisplayMode });
    }

    isInitialized = true;
    console.log('YouTube Remaining Time: Extension initialized');

    // start the main loop
    startMainLoop();

  } catch (error) {
    console.error('YouTube Remaining Time: Initialization error:', error);
    // retry initialization
    if (initializationRetries < MAX_INIT_RETRIES) {
      initializationRetries++;
      setTimeout(initializeExtension, 1000);
    }
  }
}

let sponsorBlock = null;

class SponsorBlock {
  constructor() {
    this.durationOffset = 0;
    this.isReady = false;
    this.initialize();
  }

  async initialize() {
    const player = getPlayer();
    if (!player || !player.getVideoData) return;
    try {
      const videoID = player.getVideoData().video_id;
      const url = `https://sponsor.ajay.app/api/skipSegments/?videoID=${videoID}`;
      const response = await fetch(url);
      const data = await response.json();
      let totalSponsorDuration = 0;
      data.forEach(segment => {
        const [start, end] = segment.segment;
        totalSponsorDuration += (end - start);
      });
      this.durationOffset = totalSponsorDuration;
      this.isReady = true;
    } catch (error) {
      console.error("SponsorBlock error:", error);
      this.isReady = false;
    }
  }

  getAdjustedDuration(originalDuration) {
    if (this.isReady) {
      return originalDuration - this.durationOffset;
    }
    return originalDuration;
  }
}

function getPlayer() {
  return document.getElementById('movie_player')?.wrappedJSObject || document.getElementById('movie_player');
}

// YouTube page detection
function isYouTubePage() {
  return window.location.hostname === 'www.youtube.com';
}

function isWatchPage() {
  return window.location.pathname.startsWith("/watch");
}

function canHaveVideoPlayer() {
  const path = window.location.pathname;
  return path.startsWith("/watch") ||
         path.startsWith("/@") ||
         path.includes("/channel/") ||
         path === "/" ||
         path.startsWith("/feed/") ||
         path.startsWith("/playlist");
}

function getAllowedModes() {
  const allowed = state.options.allowedModes || {
    endsAt24h: true,
    endsAt12h: true,
    endsIn: true,
    progress: true,
    progressBar: true
  };
  const modes = [];
  if (allowed.endsAt24h) modes.push(TIME_MODES.ENDS_AT_24);
  if (allowed.endsAt12h) modes.push(TIME_MODES.ENDS_AT_12);
  if (allowed.endsIn) modes.push(TIME_MODES.REMAINING);
  if (allowed.progress) modes.push(TIME_MODES.PROGRESS);
  if (allowed.progressBar) modes.push(TIME_MODES.PROGRESS_BAR);
  return modes;
}

function cycleDisplayMode() {
  const allowed = getAllowedModes();
  if (!allowed.length) {
    currentDisplayMode = TIME_MODES.REMAINING;
  } else {
    let currentIndex = allowed.indexOf(currentDisplayMode);
    if (currentIndex === -1) currentIndex = 0;
    const nextIndex = (currentIndex + 1) % allowed.length;
    currentDisplayMode = allowed[nextIndex];
  }
  browser.storage.local.set({ displayMode: currentDisplayMode });
  updateCustomTimeLabel();
}

function createCustomTimeDisplay() {
  const existingContainer = document.querySelector("#movie_player .customTimeContainer");
  if (existingContainer) return;

  const baseTimeDisplay = document.querySelector("#movie_player .ytp-time-display");
  if (!baseTimeDisplay) return;

  const customContainer = baseTimeDisplay.cloneNode(false);
  customContainer.classList.remove("ytp-live");
  customContainer.classList.add("customTimeContainer");
  customContainer.style.paddingLeft = "0";
  customContainer.style.cursor = "pointer";

  const separatorElement = document.createElement("span");
  separatorElement.textContent = "•";
  separatorElement.classList.add("ytp-chapter-title-prefix");
  customContainer.appendChild(separatorElement);

  const timeLabel = document.createElement("span");
  timeLabel.classList.add("customTimeLabel", "ytp-time-duration");
  customContainer.appendChild(timeLabel);

  customContainer.addEventListener("click", cycleDisplayMode);
  baseTimeDisplay.parentNode.insertBefore(customContainer, baseTimeDisplay.nextSibling);
}

function formatRemainingTime(totalSeconds) {
  totalSeconds = Math.floor(totalSeconds);
  const h = Math.floor(totalSeconds / 3600);
  const min = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${min}:${s.toString().padStart(2, '0')}`;
  }
}

function updateCustomTimeLabel() {
  const videoPlayer = document.querySelector("#movie_player video");
  if (!videoPlayer) return;

  const customLabel = document.querySelector("#movie_player .customTimeLabel");
  if (!customLabel) return;

  const baseTimeDisplay = document.querySelector("#movie_player .ytp-time-display");
  if (baseTimeDisplay && baseTimeDisplay.classList.contains("ytp-live")) {
    customLabel.textContent = "";
    const separator = customLabel.parentNode.querySelector('.ytp-chapter-title-prefix');
    if (separator) separator.textContent = "";
    return;
  }

  const { duration, playbackRate, currentTime } = videoPlayer;
  if (isNaN(duration) || isNaN(currentTime) || duration <= 0) return;

  if (state.options.sbEnabled && !sponsorBlock) {
    sponsorBlock = new SponsorBlock();
  }

  let effectiveDuration = duration;
  if (state.options.sbEnabled && sponsorBlock && sponsorBlock.isReady) {
    effectiveDuration = sponsorBlock.getAdjustedDuration(duration);
  }

  const adjustedRemainingTime = (effectiveDuration - currentTime) / (state.options.pbrEnabled ? playbackRate : 1);
  const estimatedEndDate = new Date(Date.now() + adjustedRemainingTime * 1000);

  switch (currentDisplayMode) {
    case TIME_MODES.ENDS_AT_24: {
      const formatter24 = new Intl.DateTimeFormat([], {
        timeStyle: "short",
        hour12: false,
      });
      customLabel.textContent = formatter24.format(estimatedEndDate);
      break;
    }
    case TIME_MODES.ENDS_AT_12: {
      const formatter12 = new Intl.DateTimeFormat([], {
        timeStyle: "short",
        hour12: true,
      });
      customLabel.textContent = formatter12.format(estimatedEndDate);
      break;
    }
    case TIME_MODES.REMAINING: {
      customLabel.textContent = formatRemainingTime(adjustedRemainingTime);
      break;
    }
    case TIME_MODES.PROGRESS: {
      const progressPercent = (currentTime / effectiveDuration) * 100;
      customLabel.textContent = progressPercent.toFixed(0) + '%';
      break;
    }
    case TIME_MODES.PROGRESS_BAR: {
      const totalSegments = state.options.totalSegments || 10;
      if(state.options.progressBarVariant === "nonTrailing"){
        const segmentsForMarker = totalSegments - 1;
        const passedSegments = Math.floor((currentTime / effectiveDuration) * segmentsForMarker);
        const remainingSegments = segmentsForMarker - passedSegments;
        const leftPart = state.options.progressBarRemaining.repeat(passedSegments);
        const marker = state.options.progressBarPassed;
        const rightPart = state.options.progressBarRemaining.repeat(remainingSegments);
        customLabel.textContent = leftPart + marker + rightPart;
      } else if(state.options.progressBarVariant === "gradient"){
          let bar = '';
          const fullSymbol = state.options.progressBarPassed || '▓';
          const emptySymbol = state.options.progressBarRemaining || '░';
          const gradSymbol = state.options.gradientSymbol || '▒';
          const fraction = currentTime / effectiveDuration;
          for(let i = 0; i < totalSegments; i++){
            const lowerBound = i / totalSegments;
            const upperBound = (i + 1) / totalSegments;
            if(fraction >= upperBound){
              bar += fullSymbol;
            } else if(fraction > lowerBound){
              bar += gradSymbol;
            } else {
              bar += emptySymbol;
            }
          }
          customLabel.textContent = bar;
      } else {
        const passedSegments = Math.round((currentTime / effectiveDuration) * totalSegments);
        const remainingSegments = totalSegments - passedSegments;
        customLabel.textContent =
              state.options.progressBarPassed.repeat(passedSegments) +
              state.options.progressBarRemaining.repeat(remainingSegments);
      }
      break;
    }
    default: {
      customLabel.textContent = "";
      break;
    }
  }
}

// main animation loop
function mainLoop() {
  if (!isInitialized) return;

  // always check if we're on a YouTube page that could have videos
  if (isYouTubePage() && canHaveVideoPlayer()) {
    // only create/update display if we're on a watch page
    if (isWatchPage()) {
      if (!document.querySelector("#movie_player .customTimeContainer")) {
        createCustomTimeDisplay();
      }
      updateCustomTimeLabel();
    }
  }

  // continue the loop
  if (isAnimationRunning) {
    window.requestAnimationFrame(mainLoop);
  }
}

function startMainLoop() {
  if (!isInitialized || isAnimationRunning) return;

  isAnimationRunning = true;
  console.log('YouTube Remaining Time: Starting main loop');

  // use a small delay to ensure DOM is ready
  setTimeout(() => {
    mainLoop();
  }, 100);
}

function stopMainLoop() {
  isAnimationRunning = false;
  console.log('YouTube Remaining Time: Stopping main loop');
}

// navigation detection
let lastUrl = location.href;
let lastPath = location.pathname;

function handleNavigation() {
  const currentUrl = location.href;
  const currentPath = location.pathname;

  if (currentUrl !== lastUrl || currentPath !== lastPath) {
    console.log('YouTube Remaining Time: Navigation detected', currentPath);

    // reset sponsorBlock when navigating to new video
    if (isWatchPage() && currentPath !== lastPath) {
      sponsorBlock = null;
    }

    // update tracking variables
    lastUrl = currentUrl;
    lastPath = currentPath;

    // ensure main loop is running if we're on a valid page
    if (isInitialized && canHaveVideoPlayer() && !isAnimationRunning) {
      startMainLoop();
    }
  }
}

// enhanced page load handling
function handlePageLoad() {
  console.log('YouTube Remaining Time: Page load detected');

  // initialize if not already done
  if (!isInitialized) {
    initializeExtension();
  } else if (canHaveVideoPlayer() && !isAnimationRunning) {
    startMainLoop();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handlePageLoad);
  document.addEventListener('load', handlePageLoad);
} else {
  setTimeout(handlePageLoad, 100);
}

setInterval(handleNavigation, 500);

// listen for storage changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    let updated = false;
    if (changes.allowedModes) {
      state.options.allowedModes = changes.allowedModes.newValue;
      const allowedModes = getAllowedModes();
      if (!allowedModes.includes(currentDisplayMode)) {
        currentDisplayMode = allowedModes[0];
        browser.storage.local.set({ displayMode: currentDisplayMode });
      }
      updated = true;
    }
    if (changes.displayMode) {
      currentDisplayMode = changes.displayMode.newValue;
      updated = true;
    }
    if (changes.pbrEnabled !== undefined) {
      state.options.pbrEnabled = changes.pbrEnabled.newValue;
      updated = true;
    }
    if (changes.sbEnabled !== undefined) {
      state.options.sbEnabled = changes.sbEnabled.newValue;
      if (!state.options.sbEnabled) {
        sponsorBlock = null;
      }
      updated = true;
    }
    if (changes.totalSegments) {
      state.options.totalSegments = changes.totalSegments.newValue;
      updated = true;
    }
    if (changes.progressBarRemaining) {
      state.options.progressBarRemaining = changes.progressBarRemaining.newValue;
      updated = true;
    }
    if (changes.progressBarPassed) {
      state.options.progressBarPassed = changes.progressBarPassed.newValue;
      updated = true;
    }
    if (changes.gradientSymbol) {
      state.options.gradientSymbol = changes.gradientSymbol.newValue;
      updated = true;
    }
    if (changes.progressBarVariant) {
      state.options.progressBarVariant = changes.progressBarVariant.newValue;
      updated = true;
    }
    if (changes.progressBarNonTrailing !== undefined) {
      state.options.progressBarNonTrailing = changes.progressBarNonTrailing.newValue;
      updated = true;
    }
    if (changes.progressBarGradient !== undefined) {
      state.options.progressBarGradient = changes.progressBarGradient.newValue;
      updated = true;
    }
    if (updated) {
      updateCustomTimeLabel();
    }
  }
});

// cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopMainLoop();
});

setTimeout(() => {
  if (!isInitialized) {
    console.log('YouTube Remaining Time: Force initializing after delay');
    initializeExtension();
  }
}, 2000);