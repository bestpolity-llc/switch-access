# Rift-Signal — SwitchMate edition

Static entry point: /games/rift-signal/. No build step, account, remote image host, or third-party script is needed.

## Source and assets

Adapted from bestpolity-llc/rift-signal's **browser edition**, docs/play/index.html, app.js, mission.js and style.css at source tree 75cf65a718bd844aec8b387beb50a828722b4c72. The Godot project is not used. mission.js is copied unchanged (22 scenes, both picture branches).

art.js packages the four existing data:image/webp images from source docs/index.html (blob c1141cae1246b53bf52dc88f14c1a7b41026fd11): crew/hero, Captain Vale, Elena Torres and Chase Mercer. They remain embedded rather than fetching/parsing another site's landing page. The source has no committed docs/play/assets/audio or assets/scenes; its sync tool references an external remaster directory. This edition therefore uses browser speech directly, with complete visible text and failure status. It does not request nonexistent WAV/JPG files. Planet and star-field pictures are distinct self-contained CSS illustrations. Existing small character artwork is contained without forced enlargement.

The shell uses the SwitchMate blue, navy and gold palette and local toggle mark from homepage PR #8.

## Input and accessibility

Scanning starts automatically. All mission actions, Help, Settings, Replay, Restart, Exit, setting changes, and confirmations participate. The gold outline identifies the selected command. Picture scenes use their own adjustable dwell (5/8/12/20 seconds); other controls use 2/3/5/8 seconds. Choices repeat indefinitely.

Full-screen input accepts a stationary tap anywhere; bottom-quarter input provides a fixed pad occupying 25dvh; external mode accepts Space/Enter. Labeled buttons always support direct activation. Selection happens on release; held/repeating keys, compatibility clicks, double activation within 650ms, canceled pointers and scrolling gestures cannot advance multiple scenes. Tab pauses scanning for normal keyboard use. Escape returns from panels or opens Help. Panels and hidden tabs pause mission progression. Restart and Exit have scannable cancel/confirm choices.

Settings use the isolated localStorage key switchmate.rift-signal.settings.v1, validate stored values, and tolerate unavailable/corrupt storage. No SwitchMate account or existing tools' settings are changed. Text scales to 140%, layouts reflow, zoom is allowed, and there is no animated countdown. Browser speech queries available English voices on each invocation; missing/failed/delayed speech reports a visible fallback without blocking play.

## Verification

Run from repository root:
```sh
npm install --prefix work/rift-tests playwright@1.51.1
work/rift-tests/node_modules/.bin/playwright install --with-deps chromium
node tests/rift-signal.mjs
```

GitHub Actions runs the same checks and retains desktop/mobile screenshots. Tests cover the mission graph and both paths at 1440×900 and 390×844, all input modes, scannable utility/settings access, repeat protection, restart/exit cancellation, settings persistence and failure, text layout, and unavailable/error/success browser-speech states.

Physical USB/Bluetooth switch hardware, iOS Safari, Android/TWA, actual installed speech voices/audio output, screen readers, and device rotation still require device testing. Automated mobile viewports are not physical-device validation.
