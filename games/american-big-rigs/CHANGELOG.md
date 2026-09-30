# Changelog

## 2026-09-30 — SwitchMate library integration

- Added the game as the eleventh library tile.
- Added scanned Start, Settings, Pause, Restart, Next dock, Replay, and library
  exit menus, including cancellation for restart and exit.
- Kept the six driving moves, previews, coaching, and recovery mechanics.
- Added native labeled buttons, press/release handling, duplicate suppression,
  canceled drag handling, and a paused Tab-navigation mode.
- Pause/resume preserves a move already in progress; hidden tabs cancel held input.
- Validated local settings; dock-count changes apply to the next run.
- Reflowed controls for narrow screens and made menus scrollable.
- Added controller regression checks and a dedicated GitHub Actions workflow.
- Current validation and its limits are in README.md. The original build notes
  below are retained as history and are not a new verification claim.

## 2026-09-30 — first playable build

Single-switch accessibility game, one minigame (back into the loading dock).

- Six scanned choices: SWING LEFT, EASE LEFT, STRAIGHT, EASE RIGHT,
  SWING RIGHT, PULL FORWARD.
- Controls: `Space` / `Enter` / click anywhere. `S` opens caregiver settings.
- Trailer model: the trailer angle eases toward the chosen angle each step
  (first-order lag), so holding EASE drifts the rig across the lot while
  STRAIGHT settles it. This is why small angles are useful and why the
  counter-intuitive real-world wheel rule is not exposed.
- Three docks, starting offset 80px left / 150px left / 170px right.
- Ghost preview of the highlighted move, dashed backing-direction guide line,
  coaching hint line, soft optional tones.
- No fail state; every position has a recovery path.

### Bugs found and fixed during verification

1. **The dock was unreachable.** A wall clamp kept the trailer bumper at
   `y >= 220` while the win zone was `y 100–180`, so no move could ever satisfy
   `isParked()`. The game could not be won. Clamp moved to `y >= 62`.
2. **Backing too far was an unrecoverable dead end.** With only backing moves,
   a rig that overshot the dock was stuck against the wall forever — the player
   could not fix it and the round could not end. Added the `PULL FORWARD` option
   (a real-world recovery move) and a hint that names it.
3. **Six choices overflowed the side panel** at short viewport heights. Type and
   row heights now scale with `clamp()` against viewport height.

### Verified

Driven end-to-end in headless Chrome via scripted `KeyboardEvent` switch presses
(the game's real input path, not internal calls):

- All 3 docks parked, at both the shipped 2000ms scan speed and a 40ms test speed.
- A button-mashing player that presses on every highlight still parks all 3 docks
  (133 and 86 moves on the first two) — the no-dead-end property holds.
- Trailer offset stayed within ±0.55 rad, x stayed within the lot at all times.
- Enter dismisses the intro; exactly one choice is lit; mid-animation presses are
  ignored; a held key (`repeat: true`) does not auto-fire; click-anywhere counts
  as a switch press; the caregiver panel pauses, changes settings, persists them,
  and resumes.
- Zero JavaScript errors in every run.
- Rendered at 1920x1080 and inspected visually: rig, dock, hazard stripes, guide
  line, ghost preview, and all six buttons render cleanly with no clipped text.
