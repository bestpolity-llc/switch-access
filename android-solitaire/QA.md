# SwitchMate Solitaire — Fire tablet QA

Record the Fire model, Fire OS version, orientation, and app version.

## Install and launch

- [ ] Clean install launches directly into Solitaire.
- [ ] Upgrade install preserves switch mode and audio state.
- [ ] No SwitchMate hub page appears during normal use.
- [ ] Offline launch shows a clear retry screen.
- [ ] Restoring Wi-Fi and pressing the switch retries successfully.

## Switch modes

- [ ] Four rapid taps on ⚡ cycle Full screen → Bottom 25% → External → Full screen.
- [ ] Full-screen mode accepts a press anywhere except the toolbar.
- [ ] Bottom mode keeps the entire game visible above the switch area.
- [ ] External mode hides the touch switch.
- [ ] A USB/Bluetooth Space or Enter switch works in External mode.
- [ ] Holding an external key does not cause repeated moves.
- [ ] Quick press causes exactly one game action.
- [ ] Two-second hold opens the Solitaire menu.
- [ ] Ten-second hold restarts Solitaire.

## Solitaire

- [ ] Main menu scans every item.
- [ ] Easy Play completes one sensible move per press.
- [ ] Choose Moves scans each legal move and selects the highlighted move.
- [ ] Stock, waste, foundation, and tableau renders remain visible.
- [ ] New Game works.
- [ ] Win/game-over flow remains usable by one switch.
- [ ] Android Back opens the game menu rather than leaving the app.
- [ ] Any in-game Home action returns to Solitaire, not the SwitchMate hub.

## Audio

- [ ] 🔊 enables game sounds and spoken scan/move prompts.
- [ ] 🔇 silences game sounds and spoken prompts.
- [ ] Audio preference survives app restart.
- [ ] Native speech is clear and does not overlap itself excessively.
- [ ] Web speech fallback works if native TTS is unavailable.

## Layout and lifecycle

- [ ] The toolbar does not cover game controls or score information.
- [ ] Portrait layout has no clipped cards or controls.
- [ ] Landscape layout has no clipped cards or controls.
- [ ] Bottom 25% mode works in both orientations.
- [ ] Rotation preserves a usable game state.
- [ ] Pause/resume preserves the current game.
- [ ] The screen remains awake during play.

## Release

- [ ] Signed release build installs after the debug build is removed.
- [ ] App icon and name display correctly in the Fire launcher.
- [ ] Version name/code are correct.
- [ ] Appstore screenshots match the release build.
