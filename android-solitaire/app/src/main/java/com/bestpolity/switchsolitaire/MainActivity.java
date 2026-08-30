package com.bestpolity.switchsolitaire;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity
    implements SolitaireWebLayer.Listener, SpeechBridge.Host {

    private static final String PREFS = "switch_solitaire_prefs";
    private static final String PREF_MODE = "switch_mode";
    private static final String PREF_AUDIO = "audio_enabled";

    private static final long QUAD_TAP_WINDOW_MS = 2200L;
    private static final long BACK_HOLD_MS = 2000L;
    private static final long HOME_HOLD_MS = 10000L;

    private enum SwitchMode {
        FULL_SCREEN("Full-screen switch", "full"),
        BOTTOM_QUARTER("Bottom 25% switch", "bottom"),
        EXTERNAL("External switch", "external");

        final String label;
        final String webName;

        SwitchMode(String label, String webName) {
            this.label = label;
            this.webName = webName;
        }
    }

    private final Handler handler = new Handler(Looper.getMainLooper());

    private FrameLayout root;
    private WebView webView;
    private TextView errorView;
    private TextView switchArea;
    private LinearLayout toolbar;
    private TextView modeButton;
    private TextView audioButton;
    private SpeechBridge speech;

    private SharedPreferences preferences;
    private SwitchMode switchMode = SwitchMode.FULL_SCREEN;
    private boolean audioEnabled = true;
    private int modeTapCount;
    private long firstModeTapAt;
    private long switchDownAt;

    private final Runnable backHoldHint = () -> {
        if (switchDownAt != 0L && switchArea != null) {
            setSwitchPrompt("Release for Menu");
            switchArea.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        }
    };

    private final Runnable homeHoldHint = () -> {
        if (switchDownAt != 0L && switchArea != null) {
            setSwitchPrompt("Release to Restart");
            switchArea.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        }
    };

    @SuppressLint({"ClickableViewAccessibility", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        preferences = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int savedMode = preferences.getInt(
            PREF_MODE,
            SwitchMode.FULL_SCREEN.ordinal()
        );
        if (savedMode >= 0 && savedMode < SwitchMode.values().length) {
            switchMode = SwitchMode.values()[savedMode];
        }
        audioEnabled = preferences.getBoolean(PREF_AUDIO, true);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(7, 26, 20));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 26, 20));
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        root.addView(webView, fullScreenParams());

        errorView = textView(20f, Typeface.BOLD);
        errorView.setGravity(Gravity.CENTER);
        errorView.setPadding(dp(28), dp(28), dp(28), dp(28));
        errorView.setBackgroundColor(Color.rgb(7, 26, 20));
        errorView.setText(
            "Could not load Solitaire\n\n" +
            "Tap or press the switch to retry"
        );
        errorView.setContentDescription(
            "Could not load Solitaire. Tap or press the switch to retry."
        );
        errorView.setVisibility(View.GONE);
        errorView.setClickable(true);
        errorView.setOnClickListener(view -> retryAfterLoadError());
        root.addView(errorView, fullScreenParams());

        switchArea = textView(22f, Typeface.BOLD);
        switchArea.setGravity(Gravity.CENTER);
        switchArea.setClickable(true);
        switchArea.setFocusable(false);
        switchArea.setLongClickable(false);
        switchArea.setOnClickListener(view -> { });
        switchArea.setOnTouchListener(this::handleSwitchTouch);
        root.addView(switchArea, fullScreenParams());

        toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER);
        toolbar.setPadding(dp(2), 0, dp(2), 0);

        modeButton = controlButton(
            "⚡",
            "Switch mode. Tap four times quickly to change mode."
        );
        audioButton = controlButton(
            audioEnabled ? "🔊" : "🔇",
            "Turn Solitaire voice and sound on or off."
        );

        modeButton.setOnClickListener(view -> {
            registerModeTap();
            webView.requestFocus(View.FOCUS_DOWN);
        });
        audioButton.setOnClickListener(view -> {
            setAudioEnabled(!audioEnabled, true);
            webView.requestFocus(View.FOCUS_DOWN);
        });

        LinearLayout.LayoutParams buttonParams =
            new LinearLayout.LayoutParams(dp(44), dp(44));
        buttonParams.setMargins(dp(3), 0, dp(3), 0);
        toolbar.addView(
            modeButton,
            new LinearLayout.LayoutParams(buttonParams)
        );
        toolbar.addView(
            audioButton,
            new LinearLayout.LayoutParams(buttonParams)
        );

        FrameLayout.LayoutParams toolbarParams =
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                dp(48),
                Gravity.TOP | Gravity.CENTER_HORIZONTAL
            );
        toolbarParams.topMargin = dp(4);
        root.addView(toolbar, toolbarParams);

        speech = new SpeechBridge(this, this);
        webView.addJavascriptInterface(speech, "SolitaireNative");

        setContentView(root);
        SolitaireWebLayer.configure(this, webView, this);

        root.addOnLayoutChangeListener(
            (view, left, top, right, bottom,
             oldLeft, oldTop, oldRight, oldBottom) -> {
                if (right - left != oldRight - oldLeft ||
                    bottom - top != oldBottom - oldTop) {
                    layoutForCurrentMode();
                }
            }
        );

        applySwitchMode(false);
        updateAudioButton();

        if (savedInstanceState == null ||
            webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(SolitaireWebLayer.GAME_URL);
        }

        webView.requestFocus(View.FOCUS_DOWN);
        hideSystemUi();
    }

    private boolean handleSwitchTouch(View view, MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                if (switchDownAt != 0L) return true;
                switchDownAt = SystemClock.elapsedRealtime();
                showSwitchPressed(true);
                handler.postDelayed(backHoldHint, BACK_HOLD_MS);
                handler.postDelayed(homeHoldHint, HOME_HOLD_MS);
                return true;

            case MotionEvent.ACTION_UP:
                if (switchDownAt == 0L) return true;
                long held =
                    SystemClock.elapsedRealtime() - switchDownAt;
                clearSwitchHoldState();
                view.performClick();

                if (held >= HOME_HOLD_MS) {
                    restartSolitaire();
                } else if (held >= BACK_HOLD_MS) {
                    openSolitaireMenu();
                } else {
                    view.performHapticFeedback(
                        HapticFeedbackConstants.KEYBOARD_TAP
                    );
                    activateSwitch();
                }
                return true;

            case MotionEvent.ACTION_CANCEL:
                clearSwitchHoldState();
                return true;

            default:
                return true;
        }
    }

    private void activateSwitch() {
        if (errorView.getVisibility() == View.VISIBLE) {
            retryAfterLoadError();
        } else {
            SolitaireWebLayer.activate(webView);
        }
    }

    private void openSolitaireMenu() {
        if (errorView.getVisibility() == View.VISIBLE) {
            hideLoadError();
            webView.loadUrl(SolitaireWebLayer.GAME_URL);
        } else {
            SolitaireWebLayer.back(webView);
        }
    }

    private void restartSolitaire() {
        hideLoadError();
        webView.loadUrl(SolitaireWebLayer.GAME_URL);
    }

    private void clearSwitchHoldState() {
        handler.removeCallbacks(backHoldHint);
        handler.removeCallbacks(homeHoldHint);
        switchDownAt = 0L;
        showSwitchPressed(false);
        setSwitchPrompt(defaultSwitchText());
    }

    private void registerModeTap() {
        modeButton.performHapticFeedback(
            HapticFeedbackConstants.KEYBOARD_TAP
        );
        modeButton.animate()
            .scaleX(0.82f)
            .scaleY(0.82f)
            .setDuration(65)
            .withEndAction(() ->
                modeButton.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(90)
                    .start()
            )
            .start();

        long now = SystemClock.elapsedRealtime();
        if (modeTapCount == 0 ||
            now - firstModeTapAt > QUAD_TAP_WINDOW_MS) {
            modeTapCount = 1;
            firstModeTapAt = now;
        } else {
            modeTapCount++;
        }

        if (modeTapCount >= 4) {
            modeTapCount = 0;
            firstModeTapAt = 0L;
            switch (switchMode) {
                case FULL_SCREEN:
                    switchMode = SwitchMode.BOTTOM_QUARTER;
                    break;
                case BOTTOM_QUARTER:
                    switchMode = SwitchMode.EXTERNAL;
                    break;
                default:
                    switchMode = SwitchMode.FULL_SCREEN;
                    break;
            }

            preferences.edit()
                .putInt(PREF_MODE, switchMode.ordinal())
                .apply();
            applySwitchMode(true);
        }
    }

    private void applySwitchMode(boolean announce) {
        switchArea.setText(defaultSwitchText());
        modeButton.setContentDescription(
            switchMode.label +
            ". Tap four times quickly to change mode."
        );

        if (switchMode == SwitchMode.BOTTOM_QUARTER) {
            switchArea.setVisibility(View.VISIBLE);
            switchArea.setContentDescription(
                "Bottom twenty-five percent switch area"
            );
            switchArea.setBackground(
                rounded(
                    Color.rgb(20, 62, 49),
                    0,
                    Color.rgb(244, 197, 66),
                    dp(3)
                )
            );
        } else if (switchMode == SwitchMode.EXTERNAL) {
            switchArea.setVisibility(View.GONE);
            switchArea.setContentDescription(
                "External keyboard switch mode"
            );
            switchArea.setBackgroundColor(Color.TRANSPARENT);
        } else {
            switchArea.setVisibility(View.VISIBLE);
            switchArea.setContentDescription(
                "Full-screen switch area"
            );
            switchArea.setBackgroundColor(Color.TRANSPARENT);
        }

        layoutForCurrentMode();
        root.post(this::layoutForCurrentMode);
        SolitaireWebLayer.setMode(webView, switchMode.webName);

        if (announce) {
            Toast.makeText(
                this,
                switchMode.label,
                Toast.LENGTH_SHORT
            ).show();
        }
    }

    private void setAudioEnabled(
        boolean enabled,
        boolean announce
    ) {
        audioEnabled = enabled;
        preferences.edit()
            .putBoolean(PREF_AUDIO, enabled)
            .apply();

        updateAudioButton();
        SolitaireWebLayer.setAudio(webView, enabled);

        if (announce) {
            String message = enabled
                ? "Solitaire audio on"
                : "Solitaire audio off";
            speech.speakUnconditional(message);
            Toast.makeText(
                this,
                message,
                Toast.LENGTH_SHORT
            ).show();
        }
    }

    private void updateAudioButton() {
        audioButton.setText(audioEnabled ? "🔊" : "🔇");
        audioButton.setContentDescription(
            (audioEnabled
                ? "Solitaire audio on"
                : "Solitaire audio off") +
            ". Tap to toggle."
        );
    }

    private void layoutForCurrentMode() {
        if (root == null || root.getHeight() <= 0) return;

        FrameLayout.LayoutParams webParams;
        FrameLayout.LayoutParams switchParams;
        int toolbarHeight = dp(56);

        if (switchMode == SwitchMode.BOTTOM_QUARTER) {
            int switchHeight =
                Math.max(1, root.getHeight() / 4);
            int topAreaHeight =
                Math.max(1, root.getHeight() - switchHeight);
            webParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                Math.max(1, topAreaHeight - toolbarHeight),
                Gravity.TOP
            );
            webParams.topMargin = toolbarHeight;
            switchParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                switchHeight,
                Gravity.BOTTOM
            );
        } else {
            webParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                Math.max(1, root.getHeight() - toolbarHeight),
                Gravity.TOP
            );
            webParams.topMargin = toolbarHeight;
            switchParams = fullScreenParams();
        }

        webView.setLayoutParams(webParams);
        errorView.setLayoutParams(
            new FrameLayout.LayoutParams(webParams)
        );
        switchArea.setLayoutParams(switchParams);
        bringControlsForward();
    }

    private void bringControlsForward() {
        if (switchArea.getVisibility() == View.VISIBLE) {
            switchArea.bringToFront();
        }
        if (errorView.getVisibility() == View.VISIBLE) {
            errorView.bringToFront();
        }
        toolbar.bringToFront();
    }

    private void showSwitchPressed(boolean pressed) {
        if (switchMode == SwitchMode.FULL_SCREEN) {
            switchArea.setBackgroundColor(
                pressed
                    ? Color.argb(65, 244, 197, 66)
                    : Color.TRANSPARENT
            );
        } else if (
            switchMode == SwitchMode.BOTTOM_QUARTER
        ) {
            int fill = pressed
                ? Color.rgb(42, 105, 82)
                : Color.rgb(20, 62, 49);
            switchArea.setBackground(
                rounded(
                    fill,
                    0,
                    Color.rgb(244, 197, 66),
                    dp(3)
                )
            );
        }
    }

    private String defaultSwitchText() {
        return switchMode == SwitchMode.BOTTOM_QUARTER
            ? "●  SWITCH"
            : "";
    }

    private void setSwitchPrompt(String text) {
        if (switchArea.getVisibility() == View.VISIBLE) {
            switchArea.setText(text);
        }
    }

    private void retryAfterLoadError() {
        hideLoadError();
        String current = webView.getUrl();
        if (current == null || current.startsWith("about:")) {
            webView.loadUrl(SolitaireWebLayer.GAME_URL);
        } else {
            webView.reload();
        }
    }

    private void showLoadError(String description) {
        String detail =
            description == null || description.trim().isEmpty()
                ? "Check the internet connection."
                : description.trim();

        errorView.setText(
            "Could not load Solitaire\n\n" +
            detail +
            "\n\nTap or press the switch to retry"
        );
        errorView.setVisibility(View.VISIBLE);
        bringControlsForward();
    }

    private void hideLoadError() {
        errorView.setVisibility(View.GONE);
    }

    private TextView textView(float size, int style) {
        TextView view = new TextView(this);
        view.setTextColor(Color.WHITE);
        view.setTextSize(size);
        view.setTypeface(Typeface.DEFAULT, style);
        return view;
    }

    private TextView controlButton(
        String text,
        String tooltip
    ) {
        TextView button = textView(20f, Typeface.NORMAL);
        button.setText(text);
        button.setGravity(Gravity.CENTER);
        button.setClickable(true);
        button.setFocusable(true);
        button.setBackground(
            rounded(
                Color.argb(244, 11, 61, 46),
                dp(22),
                Color.WHITE,
                dp(2)
            )
        );
        button.setElevation(dp(10));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            button.setTooltipText(tooltip);
        }
        return button;
    }

    private FrameLayout.LayoutParams fullScreenParams() {
        return new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
    }

    private GradientDrawable rounded(
        int color,
        int radius,
        int strokeColor,
        int strokeWidth
    ) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        if (strokeWidth > 0) {
            drawable.setStroke(strokeWidth, strokeColor);
        }
        return drawable;
    }

    private int dp(int value) {
        return Math.round(
            value * getResources().getDisplayMetrics().density
        );
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    public void onLoadStarted() {
        hideLoadError();
    }

    @Override
    public void onPageReady() {
        hideLoadError();
    }

    @Override
    public void onMainFrameError(String description) {
        showLoadError(description);
    }

    @Override
    public String currentModeName() {
        return switchMode.webName;
    }

    @Override
    public boolean currentAudioEnabled() {
        return audioEnabled;
    }

    @Override
    public boolean isAudioEnabled() {
        return audioEnabled;
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUi();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        hideSystemUi();
    }

    @Override
    protected void onPause() {
        speech.pause();
        webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (errorView.getVisibility() == View.VISIBLE) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                restartSolitaire();
            } else if (
                keyCode == KeyEvent.KEYCODE_VOLUME_UP ||
                keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                keyCode == KeyEvent.KEYCODE_VOLUME_MUTE
            ) {
                return super.onKeyDown(keyCode, event);
            } else if (
                event == null || event.getRepeatCount() == 0
            ) {
                retryAfterLoadError();
            }
            return true;
        }

        if (keyCode == KeyEvent.KEYCODE_BACK) {
            openSolitaireMenu();
            return true;
        }

        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        speech.destroy();

        if (webView != null) {
            webView.removeJavascriptInterface("SolitaireNative");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.loadUrl("about:blank");
            webView.clearHistory();
            webView.removeAllViews();
            webView.destroy();
        }

        super.onDestroy();
    }
}
