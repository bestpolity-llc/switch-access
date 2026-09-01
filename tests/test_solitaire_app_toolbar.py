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

    def test_four_taps_toggle_switch_activation_zone(self):
        source = SOURCE.read_text()
        self.assertIn('if (modeTapCount === 4)', source)
        self.assertIn('switchZone = switchZone === "fullscreen" ? "bottom" : "fullscreen";', source)
        self.assertIn('localStorage.setItem("switchaac_sol_zone", switchZone);', source)
        self.assertIn('switchZone === "fullscreen" ? "Full Screen" : "Bottom 25%"', source)

    def test_bottom_mode_reserves_bottom_quarter_for_switch(self):
        source = SOURCE.read_text()
        self.assertIn('.solitaire-app.bottom-switch .app-switch-btn', source)
        self.assertIn('height: 25vh;', source)
        self.assertIn('document.body.classList.toggle("bottom-switch", switchZone === "bottom");', source)

    def test_toolbar_is_excluded_from_switch_input(self):
        source = SOURCE.read_text()
        self.assertIn('e.target.closest(".app-toolbar, .panel, .gear")', source)

    def test_toolbar_controls_invoke_game_actions(self):
        source = SOURCE.read_text()
        self.assertIn('$("appSwitchBtn").addEventListener("click", onSwitch);', source)
        self.assertIn('settings.sound = !settings.sound;', source)
        self.assertIn('$("appHelpBtn").addEventListener("click", openSettings);', source)


if __name__ == "__main__":
    unittest.main()
