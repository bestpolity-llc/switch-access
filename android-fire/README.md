# Switch Access for Fire OS

This Android project packages the SwitchMate web application as a Fire OS app and adds an app-only single-switch accessibility layer.

## Open and run

1. In Android Studio, open the `android-fire` directory—not the repository root.
2. Wait for Gradle sync to finish.
3. Enable Developer Options and USB debugging on the Fire tablet.
4. Connect the tablet, select it in Android Studio, and run the `app` configuration.

The development build loads `https://switch.bestpolity.com/` inside a hardened full-screen WebView.

## Switch modes

Tap the floating **⚡** icon four times quickly to cycle modes. The selected mode is remembered.

- **Full-screen switch:** a quick press anywhere activates the current scan item.
- **Bottom 25% switch:** the website is resized into the top 75%; the bottom quarter becomes a dedicated switch without covering controls.
- **External — TBD:** the touch switch is hidden. Keyboard-style external switches can still send a single key press while external-device setup is developed.

In either touch-switch mode:

- Quick press: select / activate
- Hold 2 seconds: back or cancel
- Hold 10 seconds: SwitchMate home

## App accessibility layer

The files in `app/src/main/assets/` are injected after each SwitchMate page loads. They provide:

- A consistent scanner for the hub and document pages
- Debounced keyboard/external-switch input
- Modal and dialog scanning
- In-app Back and Home scan actions
- AAC scanning for predictions, every keyboard row, Backspace, Space, Enter, Settings, layers, Speak, Clear, Help, and Caregiver Setup
- Safe AAC punctuation buttons, including apostrophe, quotation mark, backtick, and backslash
- Responsive AAC and calculator layouts that fit reduced-height and landscape Fire-tablet viewports
- Accessible names, roles, visible focus treatment, and minimum direct-touch target sizes
- A repair for Pick so direct choices work and a switch press restarts after results

## Reliability

The native shell also includes:

- No Google Play Services dependency
- JavaScript, DOM storage, cookies, and Firebase web-session support
- A visible network-error screen with switch/tap retry
- Same-window handling for links that request a new tab
- WebView cleanup and cookie flushing across lifecycle changes
- Accessibility-layer injection restricted to `switch.bestpolity.com`

## Testing

Run the static and build checks locally from the repository root:

```bash
base64 --decode android-fire/app/src/main/assets/switch_app_bridge.js.gz.b64 \
  | gzip --decompress > /tmp/switch_app_bridge.js
node --check /tmp/switch_app_bridge.js
gradle -p android-fire :app:lintDebug :app:assembleDebug
```

Use `QA.md` for the physical Fire-tablet pass. A successful build does not replace hands-on switch testing.

## Release work still required

- Complete the physical-device QA matrix
- Verify sign-in/Firebase behavior on the target Fire OS versions
- Add final Amazon Appstore screenshots and listing copy
- Generate and securely retain the release signing key
- Build and test the signed release artifact
