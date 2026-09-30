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
            'Shared switch settings',
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

    def test_toolbar_opens_shared_switch_settings(self):
        self.assertIn("$(\"switchModeBtn\").addEventListener('click',()=>SwitchAccess.open('access'))", SOURCE.read_text())

    def test_bottom_mode_reserves_bottom_quarter_for_switch(self):
        source = SOURCE.read_text()
        self.assertIn('.solitaire-app.bottom-switch .app-switch-btn', source)
        self.assertIn('height: 25vh;', source)
        self.assertIn('document.body.classList.toggle("bottom-switch", switchZone === "bottom");', source)

    def test_switch_pad_uses_shared_input_controller(self):
        controller = (ROOT / "shared/switch-access.js").read_text()
        self.assertIn('#switchPad,#appSwitchBtn', controller)
        self.assertIn('activate:onSwitch', SOURCE.read_text())


if __name__ == "__main__":
    unittest.main()
