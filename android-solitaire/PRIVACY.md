# Standalone identity and privacy reconciliation

## Identity decision (2026-10-04)

Maintain the current main implementation and identity. Do not merge the old Fire
implementation over the shared switch controller.

| Evidence | Package / version |
| --- | --- |
| Main `app/build.gradle`, last changed by `1c7b215` | `com.bestpolity.switchmatesolitaire`, `1.0.3`, code `5` |
| Play project introduced by `2ff9008` | `com.bestpolity.switchmatesolitaire` |
| `.well-known/assetlinks.json` | Same package, two signing-certificate fingerprints |
| `twa-manifest.json` (historical generator input) | Same package; stale `1.0.0` / code `2` |
| PR #7 `APPSTORE_SUBMISSION.md` and Gradle | Fire package `com.bestpolity.switchsolitaire`, `0.2.0`, code `2` |

The repository's public release list contains only the older hub v2.0.0 release,
with no signed Android assets. These artifacts establish the current repository
build identity, not the latest version actually installed from either store.
No signed APK/AAB or store-console record was available to verify an installed
Fire application's identity. Preserve the old `solitaire-fire-app` branch as
historical Fire source; closing its superseded PR does not migrate Fire users.
A Fire update must retain its verified store package and signing key.

This privacy repair does not change package, version or signing configuration.
A future store upload must choose a higher version code after checking the store;
code 5 must not be reused as a replacement upload.

## Privacy behavior

- `?app=1` decides before loading optional services: no Firebase SDK, Firebase
  init or usage tracker request. Works for existing Android installs loading the
  updated website, without requiring a native update.
- Firebase init and the GA4 tracker independently reject app mode, including a
  stored analytics preference of `1` and subsequent preference changes. This
  also protects against accidentally reintroducing script tags.
- Updated native builds intercept Firebase scripts, init/tracker paths and known
  Firebase/GA endpoints independently of page preferences or old HTML. Navigation
  remaining inside the WebView must keep HTTPS, the exact Solitaire path and
  `app=1`; other navigation retains the existing external-browser behavior.
- Normal web Solitaire keeps optional Firebase/GA services. Shared switch access,
  scanning, keyboard/touch input, profile storage, audio and game logic are unchanged.
- This is service isolation, not a claim of zero networking: game hosting and
  Google Fonts requests remain. A cached old page cannot receive the web fix
  until it refreshes; native interception requires installing an updated build.

## Regression checks

`node tests/solitaire-privacy.mjs` executes the loader and both services against
app/browser URLs, default/on/off preferences, direct/stale script execution and
live storage changes. The browser check loads the real page, records requests,
checks service globals, reloads, and exercises keyboard/settings controls.
`StandalonePrivacyTest.java` exercises the production native request policy.
The Solitaire workflow also runs existing shared-access browser/unit tests,
Solitaire Python tests, Android debug assembly and Android lint.

Local validation initially passed the service, analytics, shared-access and nine
Python checks. Native build/lint could not start because Gradle's distribution
host was unreachable; the local runtime also lacks javac and a Chromium binary.
The GitHub Actions workflow provides the full JDK, browser and Android SDK checks.
Physical Fire/Android switch input and signed store builds remain release QA.
