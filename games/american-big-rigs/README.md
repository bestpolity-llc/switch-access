# American Big Rigs — Back It Up

Back a semi-truck and trailer into a loading dock with a single switch. The
SwitchMate edition is at `/games/american-big-rigs/` and is self-contained in
`index.html`: no build step, account, network asset, or external dependency.

Adapted from the local game supplied for this integration on September 30, 2026.
Original `index.html` SHA-256:
`fe6beddabf171166cd4f32f70b5aa76c4b3aeb90db3745bd9ecbd8321c95ac48`.
The original local file and backups were not modified.

## Playing

Press and release **Space** or **Enter** when the desired choice is highlighted.
The six driving choices are Swing Left, Ease Left, Straight, Ease Right, Swing
Right, and Pull Forward. A ghost previews the highlighted move. The seventh
choice, **Menu**, pauses play and provides Settings, Restart, and Return to
library. Start, Next dock, Replay, every setting, and confirmations all use the
same automatic scanning. Waiting does not cost moves or end a run.

A stationary primary tap on the board or menu background selects the highlighted
choice; dragging/scrolling cancels it. Labeled buttons activate their own actions
directly. Click-only assistive input is supported. Held keys and closely repeated
activations are suppressed. Tab stops automatic scanning for ordinary keyboard
navigation; a switch press outside a focused button resumes automatic scanning.
Escape opens the menu; S opens Settings. Neither shortcut is required for play.

The motion is a simplified trailer model, not a driving simulator or vocational
assessment. There is no losing screen. Pull Forward supports recovery when the
trailer overshoots or needs realignment; boundary collisions gently reposition it.
Stars reflect move count, not reaction speed.

## Settings

- Scan time: 0.8–5.0 seconds, shared by this game's choices and menus.
- Docks per run: 1–5; a change applies to the next run.
- Move preview, sounds, and coaching hints: on/off.

Settings are saved locally under `switchmate.american-big-rigs.settings.v1`.
Legacy `abr-cfg` settings can be read and validated. Invalid or unavailable
storage falls back to defaults. No settings are synced or transmitted.

Menus freeze the current move; Resume completes it once. Leaving the tab pauses
play, cancels held input, and requires an explicit Resume. Restart and Exit offer
a scannable cancellation choice. The layout reflows into two columns of choices
on narrow screens; settings can scroll and keep the highlighted control visible.

Opening this HTML file directly supports standalone play. Return to library
expects the installed SwitchMate hierarchy; it does not navigate to a remote site.

## Validation — September 30, 2026

Run from the repository root with Node 22:

```sh
node tests/american-big-rigs-controller.mjs
```

Twelve deterministic scenarios passed in a V8 runtime with simulated DOM, switch
events, and animation time. They cover all five dock layouts, a recovery route
from the rear wall and far-left boundary, replay, held/repeated input, interrupted
moves, switch-only settings/exit, cancellation, saved settings, next-run dock
count, hidden-tab input cancellation, Tab navigation, dragging, click-only input,
and corrupt/unavailable storage. This is not rendered-browser testing or a proof
that arbitrary button-mashing always succeeds.

Separately, the integrated game completed all three default docks using visible
controls in the Codex browser. Desktop and 390×844 layouts were inspected;
the narrow layout had no horizontal overflow and settings were readable. No
JavaScript errors were observed during that run. The hub retains its previous
ten destinations and adds this game as the eleventh tile.

Physical USB/Bluetooth switches, touch hardware, installed audio, screen readers,
Safari, and Android/WebView remain unverified.
