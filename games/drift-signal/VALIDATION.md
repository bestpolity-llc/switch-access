# Validation — 2026-09-27

Checked in the Codex browser against the local integrated library:

- Loaded the game with all seven bundled WebP images, no JavaScript console errors.
- Enter selected Start in scanning mode; Space selected the highlighted first gear.
- Tab suspended scanning and allowed direct keyboard activation of labeled controls.
- Selecting gear 2 from neutral retained neutral and displayed a recoverable +2 second penalty.
- Completed gears 1–5 after that error: finish showed 12.0 seconds, with a 10.0 base and 2.0 gear penalty.
- Replay reset to neutral. A clean run finished at 10.0 seconds with no carried-over penalties.
- Paused during the first-gear movement, opened Settings, returned to Pause, resumed, and completed the run correctly.
- Completion used the distinct post-finish artwork with the line and gantry behind the car.
- Settings were reached by selecting its moving scan highlight with Enter.
- At a 390 × 844 viewport, content width equaled viewport width and pause controls/selection pad remained visible.
- Static validation confirmed seven decodable images, valid controller-to-DOM references, and all nine prior hub destinations plus the new tenth tile.
- Enabled scan penalties in Settings, reloaded, and completed a new run after five extra completed cycles: 12.5 seconds (10.0 base + 2.5 scan penalty), with zero wrong gears. This also checked persistence.

Physical switches, screen-reader output, actual spoken audio, iOS/Android browsers, and deployed-site behavior remain unverified. Browser input testing is not physical-device certification. Additional checks and limits are recorded in the pull request.
