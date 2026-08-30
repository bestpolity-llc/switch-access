# Fire OS physical-device QA

Record the Fire model, Fire OS version, orientation, and app version for every pass.

## Installation and shell

- [ ] Clean install launches without a blank screen or crash.
- [ ] Upgrade install retains the selected switch mode and scan-audio preference.
- [ ] The top toolbar is visible on normal pages and does not cover page controls.
- [ ] Four rapid taps on ⚡ cycle Full screen → Bottom 25% → External → Full screen.
- [ ] One tap on 🔊/🔇 turns spoken scanning on or off and the setting survives relaunch.
- [ ] Opening Help, AAC Settings, or Caregiver Setup hides the native toolbar; closing the dialog restores it.
- [ ] Rotation preserves the page and recalculates the bottom switch area.
- [ ] Offline launch shows the retry screen; quick switch/tap retries after Wi-Fi returns.
- [ ] Android Back closes an open dialog first, then navigates web history normally.

## Input semantics

Test with touch and with a USB/Bluetooth keyboard that emits Space or Enter.

- [ ] Quick press causes exactly one activation.
- [ ] Holding an external key does not auto-repeat selections.
- [ ] Full-screen mode accepts a press anywhere except the native toolbar.
- [ ] Bottom mode leaves all content visible in the top 75% and activates from the dedicated bottom area.
- [ ] Two-second hold performs Back/Cancel.
- [ ] Ten-second hold returns to SwitchMate home.
- [ ] External mode hides the touch switch and accepts a keyboard-style switch key.

## Hub and document pages

- [ ] Hub scan starts with Type, then Calc and the remaining primary tools.
- [ ] Every visible hub control can be reached, including Help, sign-in, support, guide, feedback, source, privacy, and providers.
- [ ] Privacy, Providers, Staff, and other document pages scan links plus Scroll down, Scroll up, Back, and Home.
- [ ] Opening Help or another modal moves scanning into that modal and its close action works.
- [ ] With scan audio on, highlighted hub, document, and modal controls are spoken once per scan step.

## AAC / Type

Test portrait, landscape, Full-screen mode, and Bottom 25% mode.

- [ ] Text display, predictions, layers, keyboard, and action row are all visible with no overlap.
- [ ] Help and Caregiver icons do not cover the message or keyboard.
- [ ] The first scan row is **Predicted words** whenever predictions are visible.
- [ ] Selecting the prediction row enters individual words; each predicted word highlights and can be selected.
- [ ] Selecting a prediction inserts that word exactly once, including a word containing an apostrophe.
- [ ] Row scan includes message actions, all letter rows, action row, layers, and Help/Caregiver.
- [ ] Column scan visibly identifies one item and selects exactly that item.
- [ ] With scan audio on, row names and exact predicted words/keys/actions are spoken as they highlight.
- [ ] With scan audio off, highlights continue visually without scan announcements.
- [ ] The scan-audio toggle appears inside both AAC Settings and Caregiver Setup and is itself scannable.
- [ ] Speak reads the entire composed message through native Android speech even when scan audio is off.
- [ ] Clear empties the message.
- [ ] Letters, punctuation, Backspace, Space, Enter, and Settings work.
- [ ] Apostrophe, quotation mark, backtick, and backslash render and type correctly.
- [ ] ABC, 123, and #+= layers switch without losing scanning.
- [ ] Caregiver settings are fully scannable and close cleanly.
- [ ] Scan speed changes take effect without duplicate highlights or timers.
- [ ] Long messages scroll inside the text area instead of pushing keys off-screen.

## Calculator

- [ ] Display and all six button rows fit without clipping in portrait and landscape.
- [ ] Row/column scanning reaches every number, operator, fraction, Clear, Backspace, and Equals.
- [ ] Each press produces one input only.
- [ ] Back returns to the hub.

## Games

- [ ] Pop starts, pops one balloon per press, and remains responsive.
- [ ] Pick scans both choices, accepts direct choice taps, shows results, and starts a new round on the next switch press.
- [ ] Tap starts, records hits/misses, completes the round, and restarts.
- [ ] Game Maker menus and gameplay work with one switch; menu choices never double-fire.
- [ ] Hellgate menu scanning, firing, game-over menu, and Back behavior work.
- [ ] Solitaire Easy Play and Choose Moves modes both work with one switch.
- [ ] Every game returns to the hub using Back or the 10-second Home hold.

## Web services and release

- [ ] Firebase session state survives app pause/resume.
- [ ] Sign-in succeeds or presents a clear supported fallback.
- [ ] Feedback submission reports success/failure correctly.
- [ ] External links open predictably in the same WebView.
- [ ] A signed release build installs and launches after the debug build is removed.
