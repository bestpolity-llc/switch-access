# Rift-Signal — SwitchMate edition

Static entry point: /games/rift-signal/. No build step, account, remote image host, or third-party script is needed.

## Source and assets

Adapted from bestpolity-llc/rift-signal's **browser edition**, docs/play/index.html, app.js, mission.js and style.css at source tree 75cf65a718bd844aec8b387beb50a828722b4c72. The Godot project is not used. mission.js is copied unchanged (22 scenes, both picture branches).

art.js packages the four existing data:image/webp images from source docs/index.html (blob c1141cae1246b53bf52dc88f14c1a7b41026fd11): crew/hero, Captain Vale, Elena Torres and Chase Mercer. They remain embedded rather than fetching/parsing another site's landing page. The source has no committed docs/play/assets/audio or assets/scenes; its sync tool references an external remaster directory. This edition therefore uses browser speech directly, with complete visible text and failure status. It does not request nonexistent WAV/JPG files. Planet and star-field pictures are distinct self-contained CSS illustrations. Existing small character artwork is contained without forced enlargement.

The shell uses the SwitchMate blue, navy and gold palette and local toggle mark from homepage PR #8.

## Input and accessibility

Scanning starts automatically. Mission actions, Help, Settings, Replay, Restart,
Exit and confirmations participate. Picture choices repeat indefinitely and keep
an activity-specific dwell (2/3/5/8/12/20 seconds). Ordinary controls use the
shared site's scan time.

The profile controls switch keys, touch area, minimum press, repeat filtering,
menu hold, sounds and spoken choices. Space/Enter select on release by default.
A hold or Escape opens shared settings; Tab pauses scanning for native controls.
Settings and hidden pages pause the shared clock without changing the current
picture. Restart and Exit retain their scanned cancel/confirm choices.

Picture dwell and text scale (up to 140%) are activity options imported once from
legacy preferences. Access settings now follow the same profile as all other
activities. Serve the repository over HTTP(S), including `shared/`. See
[Shared switch access](../../docs/switch-access.md) for the schema and migration.
Browser speech still has visible missing/failed/delayed-voice fallback text.

## Verification

Run from repository root:
```sh
node tests/rift-signal-controller.mjs
npm install --prefix work/rift-tests playwright@1.51.1
work/rift-tests/node_modules/.bin/playwright install --with-deps chromium
node tests/rift-signal.mjs
```

GitHub Actions runs the controller checks and the shared browser suite, retaining
desktop/mobile screenshots. The current controller suite has nine mission,
narration-fallback, confirmation and storage scenarios. Shared input tests cover
filtering, holds, cancellation, timing and profile validation. Browser checks
complete both story paths and verify settings/persistence across all eleven apps.

Physical USB/Bluetooth switches, iOS Safari, Android/TWA, actual installed speech
voices, screen readers and device rotation still require device testing.
