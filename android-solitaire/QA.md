# SwitchMate Solitaire — Fire tablet QA

Record the Fire model, Fire OS version, orientation, app version, and whether the test uses touch or an external switch.

## Install and launch

- [ ] Clean install launches directly into Solitaire.
- [ ] Upgrade install preserves switch mode and audio state.
- [ ] No SwitchMate hub page appears during normal use.
- [ ] Offline launch shows a clear retry screen.
- [ ] Restoring Wi-Fi and pressing the switch retries successfully.
- [ ] Firebase sign-in and page-view analytics requests are not made by the standalone app.

## Switch modes

- [ ] Four rapid taps on ⚡ cycle Full screen → Bottom 25% → External → Full screen.
- [ ] Full-screen mode accepts a press anywhere except the toolbar.
- [ ] Bottom mode keeps the entire game visible above the switch area.
- [ ] External mode hides the touch switch.
- [ ] A USB/Bluetooth Space or Enter switch works in External mode.
- [ ] Holding an external key does not cause repeated moves.
- [ ] Quick press causes exactly one game action.
- [ ] Two-second hold opens or closes Settings.
- [ ] Ten-second hold restarts Solitaire.

## Solitaire modes

- [ ] Easy Play completes one sensible legal move per press.
- [ ] Easy Play offers no invalid or dead-end selection controls to the player.
- [ ] Choose Moves scans each legal move and selects the highlighted move.
- [ ] Slow, Medium, and Fast scanning speeds take effect after closing Settings.
- [ ] Stock, waste, foundations, and tableau remain visible.
- [ ] New Game works.
- [ ] Win flow remains usable by one switch.
- [ ] Android Back opens or closes Settings rather than leaving the app.
- [ ] Any in-game Home action returns to Solitaire, not the SwitchMate hub.

## Help and support

- [ ] The ? control opens Help without triggering a game move.
- [ ] Help explains Easy Play, Choose Moves, switch modes, quick press, two-second hold, ten-second hold, and audio.
- [ ] Help items scan one at a time with an obvious highlight.
- [ ] A single switch press activates the highlighted Help item.
- [ ] Instruction items can be read aloud.
- [ ] Back to the game closes Help and resumes play.
- [ ] Settings includes a scannable Help & support item.
- [ ] Email support opens an email app addressed to `support@bestpolity.com`.
- [ ] The free web version opens in an external browser and does not replace the standalone game inside the app.
- [ ] Help states that the one-time purchase supports Fire edition maintenance and accessible-software development.

## Audio

- [ ] 🔊 enables game sounds and spoken scan/move prompts.
- [ ] 🔇 silences game sounds and spoken prompts.
- [ ] Audio preference survives app restart.
- [ ] Native speech is clear and does not overlap itself excessively.
- [ ] Web speech fallback works if native TTS is unavailable.
- [ ] Help and Settings scan announcements follow the audio setting.

## Layout and lifecycle

- [ ] The toolbar does not cover game controls or score information.
- [ ] Help and Settings panels do not overlap the native toolbar or bottom switch area.
- [ ] Portrait layout has no clipped cards or controls.
- [ ] Landscape layout has no clipped cards or controls.
- [ ] Bottom 25% mode works in both orientations.
- [ ] Rotation preserves a usable game state.
- [ ] Pause/resume preserves the current game.
- [ ] The screen remains awake during play.

## Privacy and release

- [ ] The dedicated privacy-policy URL loads publicly.
- [ ] The app contains no ads, subscription flow, or in-app purchase flow.
- [ ] Signed release build installs after the debug build is removed.
- [ ] App icon and name display correctly in the Fire launcher.
- [ ] Version name is `0.2.0` and version code is `2`.
- [ ] Appstore screenshots match the signed release build.
- [ ] Price appears only in the Appstore listing, not in screenshots or promotional artwork.
