import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "games/solitaire.html"


class SolitaireAppToolbarTests(unittest.TestCase):
    def test_app_mode_has_accessibility_toolbar(self):
        source = SOURCE.read_text()
        for marker in (
            'id="appToolbar"',
            'id="switchModeBtn"',
            'tap 4 times to change switch mode',
            'id="appSoundBtn"',
            'id="appHelpBtn"',
            'id="appSwitchBtn"',
            '>SWITCH</span>',
        ):
            self.assertIn(marker, source)

    def test_toolbar_is_only_shown_in_solitaire_app_mode(self):
        source = SOURCE.read_text()
        self.assertIn('document.body.classList.toggle("solitaire-app", IS_SOLITAIRE_APP);', source)
        self.assertIn('body:not(.solitaire-app) .app-only', source)

    def test_four_taps_toggle_switch_mode(self):
        source = SOURCE.read_text()
        self.assertIn('if (modeTapCount === 4)', source)
        self.assertIn('settings.mode = settings.mode === "easy" ? "scan" : "easy";', source)

    def test_toolbar_controls_invoke_game_actions(self):
        source = SOURCE.read_text()
        self.assertIn('$("appSwitchBtn").addEventListener("click", onSwitch);', source)
        self.assertIn('settings.sound = !settings.sound;', source)
        self.assertIn('$("appHelpBtn").addEventListener("click", openSettings);', source)


if __name__ == "__main__":
    unittest.main()
