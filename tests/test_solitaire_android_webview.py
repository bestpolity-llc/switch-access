import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "android-solitaire"


class SolitaireAndroidWebViewTests(unittest.TestCase):
    def test_release_uses_embedded_webview_not_chrome_twa(self):
        gradle = (PROJECT / "app/build.gradle").read_text()
        activity = (PROJECT / "app/src/main/java/com/bestpolity/switchmatesolitaire/LauncherActivity.java").read_text()
        self.assertNotIn("androidbrowserhelper", gradle)
        self.assertIn("android.webkit.WebView", activity)
        self.assertIn('https://switch.bestpolity.com/games/solitaire.html?app=1', activity)

    def test_webview_release_has_new_version_code(self):
        gradle = (PROJECT / "app/build.gradle").read_text()
        self.assertIn("versionCode 5", gradle)
        self.assertIn("versionName '1.0.3'", gradle)


if __name__ == "__main__":
    unittest.main()
