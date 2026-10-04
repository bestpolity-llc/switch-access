# SwitchMate / Switch Access — A Project of Best Polity LLC

All 12 activities share one persistent switch-access profile on this browser/device.
Open **Switch settings**, press Escape, or hold your switch to adjust it. Activity
options and optional access overrides stay separate. See [Shared switch access](docs/switch-access.md)
for the user guide, profile format, new-activity contract and test commands.


Single-switch accessibility tools for people with developmental disabilities.
Built with care, perpetually free.

## Place in the Polity

Rift-Signal is Best Polity LLC's flagship sub-unit and product. SwitchMate / Switch Access is an earlier product and technical predecessor in Rift-Signal's accessibility lineage. It demonstrates Best Polity's use of state-of-the-art technology and accessible interaction design to help people succeed.

This repository remains the independently deployed SwitchMate / Switch Access implementation until a later approved specification changes its lifecycle status. Best Polity Google Workspace is authoritative for governance and product records; this Git repository is the versioned executable mirror.

- **AAC keyboard** with row-column scanning, word prediction, AI
- **Calculator** with fractions and percentages
- **10 games**: Pop It!, Pick One, Tap the Dot, Game Maker, Hellgate, Solitaire, Rift-Signal, Drift-Signal, American Big Rigs, and Warehouse Forklift
- **Google sign-in** for feedback; access settings save locally without an account

## Pages

| Page | What it does |
|------|-------------|
| `index.html` | Hub |
| `keyboard.html` | AAC keyboard |
| `calc.html` | Calculator with fractions & % |
| `games/pop.html` | Pop balloons |
| `games/choose.html` | Two-option scanning choice game |
| `games/tap.html` | Reaction timing game |
| `games/maker.html` | Generated mini-games with themes and local history |
| `games/hellgate.html` | Single-switch corridor shooter |
| `games/solitaire.html` | Switch-accessible solitaire |
| `games/rift-signal/` | Branching space adventure |
| `games/drift-signal/` | Five-gear racing activity |
| `games/american-big-rigs/` | Single-switch truck docking with move previews |
| `games/warehouse-forklift/` | Single-switch warehouse pallet pickup and delivery |

## Shelved staff workflow

The public site focuses on Type, Calc, and the ten games. The staff portal,
provider page, participant session runner, and provider demo documents were
removed from the deployed source. Their last retained version is commit
`6c8b0439afc283c223bc46ab23b1e904352629f9`; recover the files from Git history
when revisiting that separate workflow.

This removal does not delete Firebase records or change the shared Firestore
rules. Authentication and feedback for the public tools remain. Switch access preferences now use the local shared profile.

## Touch Controls (iPad)

- **Press and release** = select / action (Space and Enter work by default)
- **Hold ~2s** = shared access menu (hold time is configurable)
- **Return to library** in the access menu = confirmed exit to the hub

## Support

Free to use. Pay what you want to support development:
https://buy.stripe.com/5kQ3cu5ekaIRevL3zF2Ry00

## Android app

The Play Store build is a Trusted Web Activity for `https://switch.bestpolity.com/`.

- Package ID: `com.bestpolity.switchmate`
- Initial version: `1.0.0` (`versionCode` 1)
- Build: install Bubblewrap CLI, configure JDK 17 and Android SDK 36, then run `bubblewrap build`
- Signing credentials are intentionally stored outside this repository.
- Digital Asset Links are published from `.well-known/assetlinks.json`.

For future releases, increment both `appVersionName` and `appVersionCode` in
`twa-manifest.json`, run `bubblewrap update --skipVersionUpgrade`, and build with
the same upload key.

### Solitaire-only Play app

The embedded WebView project in `android-solitaire/` opens only
`/games/solitaire.html?app=1`.

- App name: SwitchMate Solitaire
- Package ID: `com.bestpolity.switchmatesolitaire`
- Version: `1.0.3` (`versionCode` 5)
- Its upload key is separate and remains outside this repository.
- Standalone mode does not load Firebase or GA4, regardless of analytics preferences.
- Identity evidence and verification: [standalone privacy notes](android-solitaire/PRIVACY.md).

## License

MIT — see [LICENSE](LICENSE)
