# Shared switch access

All eleven activities, the library and the guided tour use `shared/profile.js`,
`shared/switch-access.js` and `shared/switch-access.css`. They require the same
web origin to share settings; serve the site over HTTP(S), rather than opening
individual files with `file://`.

## For players and supporters

- Open **Switch settings** on any page, press Escape, or hold your switch.
- By default, Space and Enter select on release. Holding for two seconds opens
  the access menu without selecting the activity underneath it.
- Scan time, switch keys, touch area, minimum press, repeat filtering, menu hold,
  sounds and spoken choices follow you between activities.
- **Use different switch settings here** creates an explicit override for that
  activity. Turning it off restores the site default. While an override is on,
  changes in that panel affect only the current activity.
- **Activity options** keeps gameplay choices separate: Solitaire's play style,
  Hellgate's difficulty, Rift's picture dwell/text size, Drift's scan penalty,
  Type's prediction/character speech/theme, and Rigs' docks/preview/hints.
- **Test my switch** counts accepted presses without playing. Hold the switch or
  press Escape to leave the test. Buttons also work with touch, mouse and Tab.
- Tab pauses automatic scanning while native keyboard controls stay available.
  **Resume switch scanning** returns to switch control.
- Activities pause during a switch hold, the access menu, and a hidden/unfocused
  page. Their remaining timer durations are preserved. Tab pauses only scanning.
- Return to the library asks for confirmation. The standalone Android Solitaire
  mode does not expose that exit.

Settings save automatically in this browser on this device, without signing in.
They are not synced to an account or other devices. Clearing site data clears the
profile. If storage is blocked, settings work for the current page and the menu
says they are temporary. Type's explicit **Speak message** is always available;
the sound preference controls activity sounds and automatic speech.

## Storage and migration

`switchmate.access.v1` contains:

```json
{
  "version": 1,
  "activeProfileId": "default",
  "profiles": {
    "default": {
      "name": "Default",
      "access": {
        "scanMs": 2000,
        "pointerMode": "full",
        "keys": ["Space", "Enter", "NumpadEnter"],
        "minimumPressMs": 0,
        "debounceMs": 250,
        "menuHoldMs": 2000,
        "sound": true,
        "spokenLabels": false
      },
      "apps": {
        "american-big-rigs": {
          "settings": {"rounds": 3, "preview": true, "hints": true}
        }
      }
    }
  }
}
```

An optional `apps[id].access` object overrides the active profile. The UI currently
offers one default profile. Profile IDs and `activeProfileId` prepare the format
for named profiles without another per-activity storage migration.

The former site-wide `switchaac_speed` is imported once, if valid. Each activity
imports its own gameplay options once when first registered. Old game-specific
scan/sound/input preferences no longer compete with the shared profile. Legacy
keys are left intact for rollback. Cloud preferences cannot overwrite this local
access profile. Changes in other tabs arrive via the storage event. Updates read
the latest saved profile before applying a patch; simultaneous edits to the same
field use the last write. A future schema version is preserved and this older
client uses temporary settings instead of overwriting it.

## Adding an activity

Load the shared scripts before the controller. Load the shared CSS after the
activity's own CSS. Register once after creating the activity state and controls:

```js
SwitchAccess.register({
  id: 'new-activity',
  home: '../../',
  activate: selectHighlightedChoice,
  settings: {
    rounds: {label: 'Rounds next run', values: [1, 3, 5], default: 3}
  },
  legacy: oldGameplayPreferences,
  apply(access, options) {
    scanMs = access.scanMs;
    sound = access.sound;
    roundsForNextRun = options.rounds;
  }
});
```

- Use `SwitchAccess.scanClock` timers for scanning, and `SwitchAccess.clock`
  timers for activity transitions. Both expose set/clearTimeout and
  set/clearInterval. Do not mix timer IDs from different clocks.
- RAF loops must check `SwitchAccess.paused`, use `SwitchAccess.clock.now()` for
  elapsed activity time, and check `SwitchAccess.manual` before scanning.
- Use native buttons for direct choices. Remove activity-wide key/touch/pointer
  switch listeners; the shared controller owns those events. Game adapters should
  not add a second debounce threshold. Native labeled buttons work directly.
- `SwitchAccess.open('activity')` opens activity options; `open()` opens the access
  menu. `announce(text)` respects shared spoken-choice and sound preferences.
- `update(patch)` edits access settings in the current scope; `setApp(patch)` saves
  gameplay preferences. `apply` must update state without saving again.
- Extend the central defaults/validation/menu together when adding a switch
  parameter, and supply a default for old profiles. Activity descriptors accept
  `label`, `values`, `default` and an optional `format` function.

No typed messages or gameplay progress are included in this profile.

## Checks

```sh
node tests/shared-access.mjs
node tests/rift-signal-controller.mjs
node tests/american-big-rigs-controller.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
npm install --prefix work/rift-tests playwright@1.51.1
work/rift-tests/node_modules/.bin/playwright install chromium
node tests/shared-access-browser.mjs
```

Browser checks cover every activity at desktop/mobile widths, persistence,
overrides, denied storage, key learning, the AAC utility scan row, both Rift story
paths, Drift's five gears, and pausing a moving truck. The controller checks cover
all five docks and recovery routes. Physical switch adapters, iOS Safari and the
Android app still require device testing.
