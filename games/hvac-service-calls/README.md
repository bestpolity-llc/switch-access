# SwitchMate HVAC — Service Calls

Serve the repository over HTTP and open `games/hvac-service-calls/`. No build or account is required. Space/Enter select on release; hold the switch or press Escape for the shared access menu. Touch, mouse and native Tab buttons work too.

Start with a dirty filter. Later calls randomly choose a thermostat setting, blocked outdoor space, clogged toy drain, toy fan module, or filter without repeating the immediately preceding fault. Customer, location and scene color vary. Each call contains 14 meaningful selections: complaint, matching inspection, model preparation, six repair actions, tidying, model power, visible system test and customer thanks. This is a simplified pretend activity, not technical repair training.

Activity options choose 3/6/10 calls (default 6), hints and previews. Keep working adds calls after the target. Shared switch settings supply scan speed, speech, sounds, keys and pause behavior. There are no timers, scores, wrong answers or scan penalties. Look closer teaches eight named components. Roughly 20–60 minutes is an untested player estimate; pace and optional exploration vary widely.

`switchmate.hvac.shift.v1` saves each task and completed job locally. Resume uses the same browser and origin. Denied storage keeps the current page playable and reports that saving is unavailable. Starting/restarting requires a scanned confirmation. Settings change the next shift's length, not the active shift.

Validation: `node tests/hvac-service-calls.mjs`, `node tests/shared-access.mjs`, and the existing Rigs/Forklift controller suites. Chrome checks exercised all five calls, saved completion, restart cancellation, native Tab scanning pause and 1200/390px layouts. Physical switches, iOS/Android, screen readers, real player session lengths and cross-device behavior remain untested.
