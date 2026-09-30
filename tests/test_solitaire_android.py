import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SolitaireAndroidIsolationTests(unittest.TestCase):
    def test_solitaire_android_launches_isolated_mode(self):
        manifest = json.loads((ROOT / "android-solitaire/twa-manifest.json").read_text())
        self.assertEqual(manifest["startUrl"], "/games/solitaire.html?app=1")
        self.assertGreaterEqual(manifest["appVersionCode"], 2)

    def test_isolated_mode_cannot_navigate_to_switchmate_home(self):
        source = (ROOT / "games/solitaire.html").read_text()
        self.assertIn('const IS_SOLITAIRE_APP = new URLSearchParams(location.search).get("app") === "1";', source)
        self.assertIn('isolated:IS_SOLITAIRE_APP', source)
        controller=(ROOT / 'shared/switch-access.js').read_text()
        self.assertIn("!adapter.isolated&&adapter.id!=='library'", controller)


if __name__ == "__main__":
    unittest.main()
