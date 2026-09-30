# Drift-Signal: First Run

A static single-switch gear-sequencing game for SwitchMate. Entry: `/games/drift-signal/`.
Serve the repository over HTTP(S), including its `shared/` directory. No build or
account is required. The library link resolves to the site root.

## Play

Scanning begins automatically. The shared profile controls keys, scan time,
press filtering and touch area. Space/Enter select on release by default;
a hold or Escape opens the shared access menu. Labeled controls work directly.
Tab pauses scanning; the shared Resume switch scanning control restores it.
Hidden tabs and the access menu pause activity time without accruing penalties.

Five correct selections move from neutral through gears 1–5, then automatically across the finish line to a distinct post-finish image. Wrong selections retain the current gear and allow recovery.

Access preferences follow the player between all activities. Spoken choices are
optional. The extra-scan penalty is an activity option, imported from the previous
local settings and stored separately in the shared profile. See
[Shared switch access](../../docs/switch-access.md) for storage, overrides and input rules.

## Score

This is a simulated game time, not wall-clock time or a real drag-racing simulation:

`10 seconds + (wrong gear choices × 2 seconds) + (extra completed scan cycles × 0.5 seconds, if enabled)`

A scan cycle includes two gear choices and Pause. The first complete cycle at each gear is free. Only subsequent completed cycles count, so the correct choice appearing second does not cost more than appearing first. Menus, loading, pauses, and background time do not score. Wrong selections do not reset cycle count. Scan penalties default off, and the chosen setting is frozen for the duration of each run. Settings changes apply to the next run. No personal best is persisted yet.

## Art and fiction

Seven original AI-generated frames created with the built-in image generation tool, encoded as WebP from the project's PNG originals. Prompts are recorded in `ART-PROMPTS.txt`. The final frame is beyond the finish line. The fictional five-speed trainer preserves the dragster cockpit concept; real Top Fuel dragsters use direct drive, whereas Pro Stock cars use five-speed manual transmissions. Source: https://www.nhra.com/news/2016/nhra-101-introduction-nhra-drag-racing

## Integration

This is one of the library's eleven activities. Its adapter registers as
`drift-signal`; scan timers use the shared scan clock and race transitions use
the shared activity clock.

## Validation

See `VALIDATION.md` for checks completed for this package. Real switch hardware, screen readers, mobile browsers, and actual speech output still need device testing.
