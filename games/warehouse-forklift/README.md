# Warehouse Forklift — SwitchMate

Drive to PICKUP, choose LIFT / LOWER, carry the pallet to DELIVERY, and lower
it. Five jobs vary pickup and delivery positions. Shelves and walls block travel
without ending the run. Stars reflect move count; there is no time limit.

Adapted from American Big Rigs. Uses the site's shared switch profile, input,
scan timing, sounds, and pause controls. Activity options set 1–5 deliveries,
move previews, and coaching hints. Open Switch settings, press Escape, or hold
your switch to adjust controls. Serve the repo over HTTP(S) for shared settings.

This is a play activity, not forklift training or an operator assessment.

## Validation

Run `node tests/warehouse-forklift-controller.mjs` for all five deliveries,
replay, interrupted moves, settings delegation, exit and restart cancellation,
manual scanning, shared pause, invalid storage, and shelf/wall collisions.
Shared input behavior is covered by `node tests/shared-access.mjs`.
Rendered layouts and physical assistive hardware remain unverified.
