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

## Switch controls

The top toolbar has two controls:

- **⚡** — tap four times quickly to cycle Full screen → Bottom 25% → External.
- **🔊 / 🔇** — turn Solitaire voice and sound on or off.

Touch-switch behavior:

- Quick press: play/select the current Solitaire action.
- Hold 2 seconds: open the Solitaire menu.
- Hold 10 seconds: restart Solitaire.

Bottom 25% mode resizes the game into the upper portion instead of covering it. External mode hides the touch switch so a keyboard-style USB or Bluetooth switch can control the game.

## Standalone behavior

- The app launches directly into Solitaire.
- Attempts to navigate to the broader SwitchMate hub return to Solitaire.
- External web links open outside the app.
- Native Android text-to-speech is used for Solitaire's spoken move prompts, with the web speech engine as fallback.
- The selected switch mode and audio preference are remembered.
- A network error screen supports touch or switch retry.
- The game is laid out below the native toolbar so controls are not covered.

## Before Appstore submission

- Complete `QA.md` on the physical Fire tablet.
- Add final store icon, screenshots, feature graphic, and listing copy.
- Verify the privacy-policy URL.
- Generate and retain the release signing key.
- Build and test the signed release APK or App Bundle accepted by Amazon.
