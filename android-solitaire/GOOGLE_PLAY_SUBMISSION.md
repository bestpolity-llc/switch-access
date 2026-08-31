# SwitchMate Solitaire — Google Play submission

## Release identity

- App name: SwitchMate Solitaire
- Application ID: `com.bestpolity.switchsolitaire`
- Version: `0.3.0`
- Version code: `3`
- Price: **$2.99 USD**
- Ads: No
- In-app purchases: No
- Subscription: No
- Account required: No
- Privacy policy: https://switch.bestpolity.com/solitaire-privacy.html
- Support: support@bestpolity.com

## Android / Play build

The Google Play branch targets Android API 36 and uses Android Gradle Plugin 8.13.2.

Generate a signed Android App Bundle in Android Studio:

1. Open `android-solitaire/`.
2. Sync Gradle.
3. Choose **Build > Generate Signed App Bundle or APK**.
4. Choose **Android App Bundle**.
5. Select the existing SwitchMate Solitaire release keystore (`.jks`).
6. Use the same key alias/password retained for release signing.
7. Choose the `release` build variant.
8. Generate the bundle.
9. Expected output is under `app/build/outputs/bundle/release/` as `app-release.aab`.

Do not commit the keystore or passwords to GitHub.

## Play Console setup

- Organization: Best Polity LLC
- Website: https://bestpolity.com
- Category: Game > Card (recommended)
- Monetization: Paid app, $2.99 USD
- No ads
- No IAP
- No subscriptions

## Store listing assets

Reuse the prepared assets from the Amazon submission where dimensions meet Play requirements:

- 512×512 app icon
- 1024×500 feature graphic
- Real app screenshots captured from the Fire/Android tablet
- Optional screen recording for promotional video preparation

## Play declarations

Complete these before production submission:

- App access: all functionality available without login
- Ads: No
- Data safety: app does not intentionally collect or share user data; verify final binary behavior before submitting
- Content rating questionnaire
- Target audience and content
- Privacy policy URL
- Government / finance / health / news / gambling special categories: none

## Testing

Before upload, rerun the existing `QA.md` checklist on at least one general Android device/emulator in addition to the Fire tablet. Confirm:

- Easy Play
- Choose Moves
- Full-screen switch
- Bottom 25% switch
- External switch
- Quick press
- 2-second Settings hold
- 10-second restart hold
- Four-tap Switch Mode cycling
- Audio/TTS toggle
- Help and Support panel
- Network retry behavior
- Preference persistence

## Release sequence

1. Finish Play Console developer-account verification.
2. Create the app in Play Console as a paid app.
3. Set U.S. base price to $2.99.
4. Upload the signed `.aab` to Internal testing first.
5. Resolve any Play pre-launch / policy warnings.
6. Promote through required testing tracks and then Production when eligible.
