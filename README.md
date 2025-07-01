# YouTube Remaining Time

A browser extension that enhances the YouTube player by displaying a highly customizable remaining time indicator, including advanced features like SponsorBlock integration and various display formats.

## Features

- **Customizable Remaining Time Formats**
  - **Time left until video ends** (HH:MM:SS)
  - **End time (24-hour or 12-hour format)** (e.g., 17:20 or 5:20 PM)
  - **Progress percentage** (e.g., 64%)
  - **Progress bar** (e.g., `████░░░░░`)
    - Several visual variants: simple, non-trailing marker, and gradient
    - Customizable symbols for passed, remaining, and gradient segments
    - Adjustable total segments for the progress bar

- **SponsorBlock Integration**
  - Automatically subtracts the duration of sponsored segments (from the [SponsorBlock](https://sponsor.ajay.app) API) when calculating the remaining time, so you see the true time left if you skip sponsors.

- **Playback Rate Awareness**
  - Remaining time and end time are dynamically adjusted if you change playback speed.

- **Fully Customizable**
  - Choose which display modes appear and cycle between them with a click on the time label.
  - Enable/disable SponsorBlock or playback rate integration.
  - Tweak progress bar appearance in detail from the options page.

- **Seamless YouTube Integration**
  - Integrates directly into the YouTube player UI, appearing next to the default time display.
  - Supports both standard and live videos (automatically hides on live streams).

## Installation

Available on [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/yt-remaining-time).

## Usage

1. Install the extension and open any YouTube video.
2. A new time display will appear next to YouTube’s own time information.
3. Click the custom time label to cycle through your enabled display modes.
4. Right-click the extension icon and select "Options" to configure appearance, enabled modes, progress bar style, and integrations.

## Options

- **Display Modes:** Enable or disable each of the following:
  - Ends at (24h/12h)
  - Remaining time
  - Progress percentage
  - Progress bar
- **Progress Bar:** Choose between simple, non-trailing, or gradient variants. Customize symbols and segment count.
- **SponsorBlock:** Toggle SponsorBlock integration on or off.
- **Playback Rate:** Toggle playback rate awareness on or off.

## Advanced

- All settings are saved locally and applied immediately.
- The extension is open source under the MIT License.

## License

MIT License

---

Made by [@nhantrichuyenanh](https://github.com/nhantrichuyenanh)
