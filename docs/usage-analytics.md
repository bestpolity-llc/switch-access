# SwitchMate usage reports

The public site uses the existing GA4 web stream `G-K6HGF1692H`.
Sign into https://analytics.google.com/ with the account that owns this property.
Visitors do not need to sign in to SwitchMate.

## Find the most popular activities

Open **Reports → Engagement → Pages and screens** (report collections may vary;
search for “Pages and screens” if it is not in the navigation). Choose **Page title
and screen name**, then sort by **Views** or **Active users**. Choose a date range
starting after this change. Friendly titles distinguish all 12 activities.

- Views: page loads, including reloads and repeat visits.
- Active users: Google's estimate of browsers/users, not identified people.
- Average engagement time: time the page was in focus; not a measure of successful
  play, learning, therapeutic benefit, or accessibility.
- The library and guide also appear; exclude these when comparing activities.

**Reports → Realtime** can help verify new visits. Standard reports may take
24–48 hours to process. Historical homepage-only data cannot reconstruct earlier
visits to activities that were not tagged.

## Events

`page_view` is sent once per document. Each activity also sends `activity_open`
with `activity_id`. Game Maker sends `maker_play` and `maker_love` with
`activity_id` and numeric `game_seed`. To break down custom events in Explorations,
register `activity_id` as an event-scoped custom dimension under Admin → Custom
definitions. The standard Pages and screens report needs no custom dimensions.
Avoid registering seeds as a dimension unless needed; they can have high cardinality.

## Property checks

In Admin → Data streams, select the web stream matching the measurement ID.
Review Enhanced measurement and disable form interactions, site search, and
outbound click collection if enabled; these are not needed for popularity reports.
Keep Google signals and advertising features off. Choose an appropriate event-data
retention period in Admin and document any future changes to collection.
These account-level settings are not changed by the repository deployment.

## Collection and verification

The tracker only runs on `switch.bestpolity.com` and allowlisted activity paths.
Local previews, unknown paths, and packaged/offline builds do not report.
It replaces the old Firebase page-view and Game Maker event feeds. Old Firestore
records remain; the client no longer writes those feeds.

The Usage statistics switch stops reporting immediately and syncs across tabs.
When off on arrival, the Google script is not loaded. Blocked browser storage
fails closed unless the shared switch controller provides its in-memory preference.
Ad blockers and opt-outs mean these reports undercount usage.

Run `node tests/usage-analytics.mjs` for coverage, URL redaction, duplicate-load,
opt-out, and event payload tests. After deployment, check Realtime while opening an
activity with statistics enabled. Then turn statistics off and verify the browser
stops sending requests to Google Analytics. Do not submit fake feedback for testing.

References:
- https://support.google.com/analytics/answer/12926732
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/tag-platform/security/guides/privacy
