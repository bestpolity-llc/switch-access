# Drift-Signal: First Run

A complete static single-switch gear-sequencing game for SwitchMate. Entry: `/games/drift-signal/`. No build, accounts, analytics, remote media, or dependencies. Deploy this folder unchanged under `games/`; the library return link resolves to the site root. Open `index.html` directly for standalone play (the library link only applies when hosted under `games/`).

## Play

Scanning begins automatically. Space/Enter select on release, or tap the large selection pad. All choices can also be activated directly. Start, settings, gear choices, Pause, Resume, replay, restart confirmation and exit confirmation participate in scanning. Tab suspends scanning for ordinary keyboard navigation; the pad resumes it. Escape pauses. Hidden tabs/window blur pause the race without accruing penalties. Repeating/held keys select at most once, with a 450ms duplicate-activation guard.

Five correct selections move from neutral through gears 1–5, then automatically across the finish line to a distinct post-finish image. Wrong selections retain the current gear and allow recovery.

Scan dwell options: 1.5, 2.5 (default), 4, 6 seconds. Optional spoken choices use browser speech with visible text always present. Settings are validated and persisted in `switchmate.drift-signal.settings.v1`; unavailable/corrupt storage does not block play. Scanning only runs while visible/focused. Physical USB/Bluetooth switches should be mapped to Space or Enter.

## Score

This is a simulated game time, not wall-clock time or a real drag-racing simulation:

`10 seconds + (wrong gear choices × 2 seconds) + (extra completed scan cycles × 0.5 seconds, if enabled)`

A scan cycle includes two gear choices and Pause. The first complete cycle at each gear is free. Only subsequent completed cycles count, so the correct choice appearing second does not cost more than appearing first. Menus, loading, pauses, and background time do not score. Wrong selections do not reset cycle count. Scan penalties default off, and the chosen setting is frozen for the duration of each run. Settings changes apply to the next run. No personal best is persisted yet.

## Art and fiction

Seven original AI-generated frames created with the built-in image generation tool, encoded as WebP from the project's PNG originals. Prompts are recorded in `ART-PROMPTS.txt`. The final frame is beyond the finish line. The fictional five-speed trainer preserves the dragster cockpit concept; real Top Fuel dragsters use direct drive, whereas Pro Stock cars use five-speed manual transmissions. Source: https://www.nhra.com/news/2016/nhra-101-introduction-nhra-drag-racing

## Integration

The accompanying hub change adds a tenth, automatically scanned library tile without changing existing game destinations. No changes are made to the separate Rift-Signal space adventure, Android manifests, account integration, or other game settings.

## Validation

See `VALIDATION.md` for checks completed for this package. Real switch hardware, screen readers, mobile browsers, and actual speech output still need device testing.
