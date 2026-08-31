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
        self.assertIn('if (IS_SOLITAIRE_APP) {', source)
        self.assertIn('$("optHome").hidden = true;', source)
        self.assertIn('if (!IS_SOLITAIRE_APP) window.location.href = "../index.html";', source)


if __name__ == "__main__":
    unittest.main()
