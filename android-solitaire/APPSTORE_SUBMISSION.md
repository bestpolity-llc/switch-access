# Amazon Appstore Submission — SwitchMate Solitaire

This is the working submission sheet for the standalone Fire tablet app.

## Product identity

- **App title:** SwitchMate Solitaire
- **Application ID:** `com.bestpolity.switchsolitaire`
- **Current app version:** `0.2.0`
- **Current version code:** `2`
- **Developer:** Best Polity LLC
- **Support email:** `support@bestpolity.com`
- **Privacy policy:** `https://switch.bestpolity.com/solitaire-privacy.html`
- **Free web version:** `https://switch.bestpolity.com/games/solitaire.html`
- **Devices:** Fire tablets only; do not target Fire TV
- **Monetization:** Paid download; no ads, subscriptions, or in-app purchases

## Pricing plan

- **Launch list price:** USD **$1.99**
- **Standard list price:** USD **$2.99**
- Keep the launch price for approximately 30 days, then change the normal list price to $2.99.
- Do not put either price, “sale,” or discount language in the app title, description, screenshots, icon, or promotional artwork. Prices change by marketplace and can change later.
- Let Amazon calculate international prices initially. Review them before submission and optionally round important marketplaces to conventional endings.

## Suggested category and audience

- Choose the closest available category to **Games → Cards / Solitaire**.
- Target **Fire tablets**.
- Do not select Fire TV unless remote-control navigation is separately tested and supported.
- Suggested audience: general audience. Review Amazon's current age-rating questions carefully; the game has no gambling, real-money prizes, chat, violence, advertising, or user-generated content.

## Store listing copy

### Short description

One-switch Klondike Solitaire with Easy Play, scanning choices, spoken prompts, and accessible Fire tablet controls.

### Feature bullets

- Play Klondike Solitaire with one switch, one key, or a screen tap
- Easy Play offers only legal moves with no wrong choices
- Choose Moves scans available moves one at a time
- Spoken prompts, sound controls, and adjustable scanning speed
- Full-screen, bottom-quarter, and external switch modes
- In-game instructions and direct support contact
- One-time purchase with no ads, subscription, or in-app purchases
- A free browser version remains available from Best Polity

### Full description

SwitchMate Solitaire is a one-switch version of Klondike Solitaire designed for players who benefit from simplified, accessible controls.

**Easy Play** performs the best available legal move with each switch press. There are no wrong choices, making it useful for cause-and-effect play, recreation, and practicing reliable switch activation.

**Choose Moves** highlights legal moves one at a time. Press the switch when the desired move is highlighted. Scanning speed, sound, and spoken prompts can be adjusted in the game settings.

The Fire tablet edition supports the full screen as a switch, a dedicated switch area across the bottom quarter of the screen, and keyboard-style external switches. Quick press plays or selects, a two-second hold opens Settings, and a ten-second hold restarts the game.

The app includes in-game help, accessible settings, native speech, and direct support from Best Polity LLC. There are no advertisements, subscriptions, or in-app purchases. The one-time Appstore purchase supports ongoing maintenance of the Fire tablet edition and development of more accessible software. The same Solitaire game can also be played free in a web browser.

### Keywords

`solitaire, switch access, accessibility, adaptive gaming, single switch, disability, assistive technology, Klondike, accessible game, Fire tablet`

## Required listing assets

Prepare these before submission:

- App icon in every size requested by the Developer Console
- At least three clear Fire tablet screenshots; capture both portrait and landscape if both are supported
- One 1024 × 500 PNG or JPEG promotional image
- Do not put a price, sale language, review quotes, buttons, or screenshot-style UI inside the promotional image

Suggested screenshots:

1. Easy Play showing a highlighted legal move and spoken caption
2. Choose Moves showing move scanning
3. Help screen showing game modes and switch instructions
4. Settings showing speed and sound options
5. Bottom 25% switch mode on the physical Fire tablet

Suggested promotional-art text:

**SwitchMate Solitaire**

**One switch. A complete game.**

## Privacy questionnaire — conservative answers

The standalone app blocks the website's Firebase and page-view analytics scripts. It has no account, advertising, location access, contacts, microphone recording, uploads, or in-app payment collection.

Because the game is delivered from a web host, ordinary server requests can include an IP address and browser/device information. Use the following conservative disclosure unless the final hosting configuration changes:

- **Does the app collect user data or transfer user data to third parties?** Yes
- **Device or other IDs — Collected:** Yes
- **Device or other IDs — Third-party transfer:** No, when infrastructure providers are acting only as service providers on Best Polity's behalf
- **Purposes:** App functionality; Fraud Prevention, Security & Compliance
- **Analytics:** No
- **App interactions/gameplay:** No
- **Email address/messages:** No for the normal app flow. The support link is a specific user-initiated action that opens the user's email app.
- **Payment information:** No. Amazon handles the paid download outside the app, and the app/developer does not receive card credentials.
- **Privacy-policy URL:** `https://switch.bestpolity.com/solitaire-privacy.html`

Review the live questionnaire wording and the actual host logging configuration before submitting. The final answers must remain accurate.

## Developer account prerequisites for a paid app

Before Amazon will publish a monetized app:

- Create or use the Best Polity LLC Amazon Developer account
- Confirm the public developer/company name
- Complete **My Settings → Payments and Benefits** with the business bank/payment information
- Complete the tax identity interview and required tax forms
- Verify that the account-owner email is monitored because Amazon sends review correspondence there

## Build the signed release

Do not upload the Android Studio debug build.

1. Open `android-solitaire/` in Android Studio.
2. Select **Build → Generate Signed Bundle / APK**.
3. Choose **APK**.
4. Create or select the permanent release keystore.
5. Store the keystore and passwords securely in at least two protected locations. Losing the signing key can prevent future updates.
6. Choose the `release` build variant and finish the build.
7. Install the signed release APK on the Fire tablet after removing the debug build.
8. Complete every applicable item in `QA.md`.

The signed APK will normally be under:

`android-solitaire/app/release/`

or

`android-solitaire/app/build/outputs/apk/release/`

## Developer Console sequence

1. Sign in to the Amazon Developer Console.
2. Complete Payments and Benefits and the tax interview first.
3. Go to **My Apps** and choose **Add New App → Android**.
4. Enter **SwitchMate Solitaire** and choose the closest card/solitaire category.
5. **Upload Your App File**
   - Upload the signed release APK
   - Select English language support
   - Confirm package name `com.bestpolity.switchsolitaire`
6. **Target Your App**
   - Target compatible Fire tablets
   - Exclude Fire TV
   - Select the countries where the app will be sold
   - Complete the privacy questionnaire
7. **Appstore Details**
   - Paste the listing copy from this document
   - Enter `support@bestpolity.com`
   - Enter the privacy-policy URL
   - Set the launch list price to **$1.99**
   - Upload the icon, screenshots, and 1024 × 500 promotional image
8. **Review and Submit**
   - Resolve every warning
   - Confirm there are no ads, IAP items, or subscriptions
   - Submit for review

## After launch

- Keep version code increasing for every binary update: `3`, `4`, `5`, and so on.
- Keep the application ID and signing key unchanged.
- After approximately 30 days, change the list price to **$2.99**, or use an Amazon price-discount campaign if you want the storefront to show a formal promotion.
- Monitor the account-owner email, reviews, crashes, support messages, sales, and payments.
- Update the privacy questionnaire whenever data practices change.
