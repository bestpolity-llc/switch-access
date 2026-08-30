# SwitchMate Solitaire for Fire OS

A standalone Amazon Fire tablet app for the single-switch Solitaire game at:

`https://switch.bestpolity.com/games/solitaire.html`

The app has its own Android package and can be submitted as a separate Amazon Appstore listing.

## Open and run

1. In Android Studio choose **File → Open**.
2. Open the repository's `android-solitaire` folder.
3. Wait for Gradle sync.
4. Select the connected Fire tablet.
5. Run the `app` configuration.

Application ID: `com.bestpolity.switchsolitaire`

Current version: `0.2.0` (`versionCode 2`)

## Switch controls

The top toolbar has two controls:

- **⚡** — tap four times quickly to cycle Full screen → Bottom 25% → External.
- **🔊 / 🔇** — turn Solitaire voice and sound on or off.

Touch-switch behavior:

- Quick press: play/select the current Solitaire action.
- Hold 2 seconds: open or close Settings.
- Hold 10 seconds: restart Solitaire.

Bottom 25% mode resizes the game into the upper portion instead of covering it. External mode hides the touch switch so a keyboard-style USB or Bluetooth switch can control the game.

## Help and support

The game header and Settings panel include an accessible **? Help & support** control. The help panel explains:

- Easy Play
- Choose Moves
- Full-screen, Bottom 25%, and External switch modes
- Quick-press and hold controls
- Audio controls

The help panel is single-switch scannable and includes:

- Direct email support at `support@bestpolity.com`
- A link to the free browser version
- A clear explanation that the paid Appstore edition supports Fire tablet maintenance and development of more accessible software

## Standalone behavior and privacy

- The app launches directly into Solitaire.
- Attempts to navigate to the broader SwitchMate hub return to Solitaire.
- External links open outside the app.
- Native Android text-to-speech is used for Solitaire's spoken move prompts, with the web speech engine as fallback.
- The selected switch mode and audio preference are remembered.
- A network error screen supports touch or switch retry.
- The game is laid out below the native toolbar so controls are not covered.
- Firebase and page-view analytics scripts are blocked in the standalone app.
- Dedicated privacy policy: `https://switch.bestpolity.com/solitaire-privacy.html`

## Pricing

- Introductory Appstore price: **$1.99**
- Standard price after approximately 30 days: **$2.99**
- No advertising, subscriptions, or in-app purchases
- The website version remains free

## Before Appstore submission

- Complete `QA.md` on the physical Fire tablet.
- Follow `APPSTORE_SUBMISSION.md` for listing copy, privacy answers, pricing, assets, signing, and Developer Console steps.
- Generate and securely retain the permanent release signing key.
- Build and test the signed release APK on the target Fire tablet.
