# Switch Access for Fire OS

This Android project wraps the existing Switch Access web application for Amazon Fire tablets.

## Development

1. Open the `android-fire` directory in Android Studio.
2. Allow Gradle sync to complete.
3. Enable Developer Options and USB debugging on the Fire tablet.
4. Connect the tablet by USB and select it in Android Studio's device selector.
5. Run the `app` configuration.

The development build loads:

`https://switch.bestpolity.com/`

## Current scope

- Fire OS / Android launcher app
- Full-screen WebView
- JavaScript and DOM storage enabled
- Cookie support for web authentication/session state
- Back-button web navigation
- API 22+ compatibility
- No Google Play Services dependency

## Before Amazon Appstore submission

- Test sign-in/Firebase flows on physical Fire hardware
- Verify all games and switch-input workflows
- Add production launcher/store artwork
- Add offline/error-state handling
- Generate and securely retain a release signing key
- Build a signed release APK or App Bundle as accepted by Amazon Developer Console
