# American Big Rigs — Back It Up

Back a semi-truck and trailer into a loading dock with a single switch. The
SwitchMate edition is at `/games/american-big-rigs/` and uses the repository’s `shared/` access controller: no build step, account,
remote game asset, or third-party runtime dependency.

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
Escape or a long switch hold opens the shared access menu. The visible Switch
settings button and the scanned game-menu Settings choice open it too.

The motion is a simplified trailer model, not a driving simulator or vocational
assessment. There is no losing screen. Pull Forward supports recovery when the
trailer overshoots or needs realignment; boundary collisions gently reposition it.
Stars reflect move count, not reaction speed.

## Settings

- Keys, scan time, touch area, press filtering, sounds and spoken choices follow
  the site-wide profile, unless an explicit activity override is enabled.
- Docks per run (1–5), move preview and coaching hints stay with this game.
  Dock-count changes apply to the next run.

Settings now use the versioned shared profile. Existing gameplay options from
`switchmate.american-big-rigs.settings.v1` or `abr-cfg` are imported once. See
[Shared switch access](../../docs/switch-access.md) for migration and storage scope.

Menus freeze the current move; Resume completes it once. Leaving the tab pauses
the shared activity clock and cancels held input. Returning restores the remaining
activity time. The in-game menu still offers an explicit Resume. Restart and Exit offer
a scannable cancellation choice. The layout reflows into two columns of choices
on narrow screens; settings can scroll and keep the highlighted control visible.

Serve the repository over HTTP(S), including `shared/`, to use one profile across
activities. Return to library expects the installed SwitchMate hierarchy.

## Validation

`node tests/american-big-rigs-controller.mjs` runs ten game-controller scenarios,
including all five docks, recovery from the rear wall/far-left boundary, replay,
interrupted movement and restart/exit cancellation. Input filtering now belongs
to `tests/shared-access.mjs`. The full browser suite checks desktop/mobile layouts,
settings persistence, and opening shared settings during a truck move.

See [Shared switch access](../../docs/switch-access.md#checks) for all test commands.

Physical USB/Bluetooth switches, touch hardware, installed audio, screen readers,
Safari, and Android/WebView remain unverified.
