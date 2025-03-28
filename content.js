const TIME_MODES = {
  ENDS_AT_24: 'endsAt24h',
  ENDS_AT_12: 'endsAt12h',
  REMAINING: 'endsIn',
  PROGRESS: 'progress',
};


let currentDisplayMode = localStorage.getItem("yt-ends-at-mode") || TIME_MODES.REMAINING;

/**
 * ensures that the custom time display element exists
 * if not, it clones the existing YouTube time display element, modifies it, and adds a click listener to cycle through modes.
 */
function createCustomTimeDisplay() {
  const existingContainer = document.querySelector("#movie_player .customTimeContainer");
  if (existingContainer) return;

  const baseTimeDisplay = document.querySelector("#movie_player .ytp-time-display");
  if (!baseTimeDisplay) return; // exit if no time display exists

  // clone the base element without its children
  const customContainer = baseTimeDisplay.cloneNode(false);
  customContainer.classList.remove("ytp-live");
  customContainer.classList.add("customTimeContainer");
  customContainer.style.paddingLeft = "0";
  customContainer.style.cursor = "pointer";

  // mimic separator element between ytp-time-display and ytp-chapter-container
  const separatorElement = document.createElement("span");
  separatorElement.textContent = "•";
  separatorElement.classList.add("ytp-chapter-title-prefix");
  customContainer.appendChild(separatorElement);

  // label element to display current display mode
  const timeLabel = document.createElement("span");
  timeLabel.classList.add("customTimeLabel", "ytp-time-duration");
  customContainer.appendChild(timeLabel);

  // click event to cycle through all time modes
  customContainer.addEventListener("click", () => {
    // Cycle: ENDS_AT_24 -> ENDS_AT_12 -> REMAINING -> PROGRESS -> ENDS_AT_24 ...
    if (currentDisplayMode === TIME_MODES.ENDS_AT_24) {
      currentDisplayMode = TIME_MODES.ENDS_AT_12;
    } else if (currentDisplayMode === TIME_MODES.ENDS_AT_12) {
      currentDisplayMode = TIME_MODES.REMAINING;
    } else if (currentDisplayMode === TIME_MODES.REMAINING) {
      currentDisplayMode = TIME_MODES.PROGRESS;
    } else {
      currentDisplayMode = TIME_MODES.ENDS_AT_24;
    }
    localStorage.setItem("yt-ends-at-mode", currentDisplayMode);
    updateCustomTimeLabel(); // immediately update on mode change
  });

  // custom container right after ytp-time-display
  baseTimeDisplay.parentNode.insertBefore(customContainer, baseTimeDisplay.nextSibling);
}

/**
 * formats duration (in seconds) into a digital clock format (hh:mm:ss or mm:ss)
 * @param {number} totalSeconds -> the duration in seconds
 * @returns {string} -> formatted time string
 */
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

/**
 * updates the custom time label based on the current video state and display mode
 * it also performs error handling to ensure all necessary elements exist
 */
function updateCustomTimeLabel() {
  const videoPlayer = document.querySelector("#movie_player video");
  if (!videoPlayer) return; // no video found

  const customLabel = document.querySelector("#movie_player .customTimeLabel");
  if (!customLabel) return; // custom label not found

  // restore default display if the video is live
  const baseTimeDisplay = document.querySelector("#movie_player .ytp-time-display");
  if (baseTimeDisplay && baseTimeDisplay.classList.contains("ytp-live")) {
    customLabel.textContent = "";
	const separator = customLabel.parentNode.querySelector('.ytp-chapter-title-prefix');
  	if (separator) separator.textContent = "";
  	return;
  }

  // retrieve current video properties
  const { duration, playbackRate, currentTime } = videoPlayer;
  if (isNaN(duration) || isNaN(currentTime) || duration <= 0) return;

  // calculate remaining time (adjusted for playback rate)
  const adjustedRemainingTime = (duration - currentTime) / playbackRate;
  // calculate the estimated end time in milliseconds
  const estimatedEndDate = new Date(Date.now() + adjustedRemainingTime * 1000);

  // update label based on the current display mode
  switch (currentDisplayMode) {
    case TIME_MODES.ENDS_AT_24: {
      // 24-hour
      const formatter24 = new Intl.DateTimeFormat([], {
        timeStyle: "short",
        hour12: false,
      });
      customLabel.textContent = formatter24.format(estimatedEndDate);
      break;
    }
    case TIME_MODES.ENDS_AT_12: {
      // 12-hour
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
      // %
      const progressPercent = (currentTime / duration) * 100;
      customLabel.textContent = progressPercent.toFixed(0) + '%';
      break;
    }
    default: {
      // fallback in case an unknown mode is set
      customLabel.textContent = "";
      break;
    }
  }
}

/**
 * the animation loop updates the custom time label smoothly
 * it uses requestAnimationFrame for better performance
 */
function animationLoop() {
  // only run on https://www.youtube.com/watch?v=
  if (location.pathname.startsWith("/watch")) {
    createCustomTimeDisplay();
    updateCustomTimeLabel();
  }
  window.requestAnimationFrame(animationLoop);
}

animationLoop();