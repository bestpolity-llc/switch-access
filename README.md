# SwitchMate / Switch Access — A Project of Best Polity LLC

Single-switch accessibility tools for people with developmental disabilities.
Built with care, perpetually free.

## Place in the Polity

Rift-Signal is Best Polity LLC's flagship sub-unit and product. SwitchMate / Switch Access is an earlier product and technical predecessor in Rift-Signal's accessibility lineage. It demonstrates Best Polity's use of state-of-the-art technology and accessible interaction design to help people succeed.

This repository remains the independently deployed SwitchMate / Switch Access implementation until a later approved specification changes its lifecycle status. Best Polity Google Workspace is authoritative for governance and product records; this Git repository is the versioned executable mirror.

- **AAC keyboard** with row-column scanning, word prediction, AI
- **Calculator** with fractions and percentages
- **3 games** (Pop It!, Pick One, Tap the Dot)
- **Google sign-in** to sync settings and send feedback

## Pages

| Page | What it does |
|------|-------------|
| `index.html` | Hub |
| `keyboard.html` | AAC keyboard |
| `calc.html` | Calculator with fractions & % |
| `games/pop.html` | Pop balloons |
| `games/choose.html` | Two-option scanning choice game |
| `games/tap.html` | Reaction timing game |

## Touch Controls (iPad)

- **Quick tap** = select / action
- **Hold ~2s** = cancel / go back
- **Hold ~10s** = exit to hub

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

## License

MIT — see [LICENSE](LICENSE)
