package com.bestpolity.switchaccess;

import android.annotation.SuppressLint;
import android.app.Activity;
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
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity implements WebAppLayer.Listener {
    private static final String PREFS = "switch_access_prefs";
    private static final String PREF_MODE = "switch_mode";
    private static final long QUAD_TAP_WINDOW_MS = 2200L;
    private static final long BACK_HOLD_MS = 2000L;
    private static final long HOME_HOLD_MS = 10000L;

    private enum SwitchMode {
        FULL_SCREEN("Full-screen switch", "full"),
        BOTTOM_QUARTER("Bottom 25% switch", "bottom"),
        EXTERNAL("External — TBD", "external");

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
    private TextView switchArea;
    private TextView modeButton;
    private TextView errorView;
    private SwitchMode switchMode = SwitchMode.FULL_SCREEN;
    private int modeTapCount;
    private long firstModeTapAt;
    private long switchDownAt;

    private final Runnable backHoldHint = () -> {
        if (switchDownAt != 0L) {
            setSwitchPrompt("Release for Back");
            switchArea.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        }
    };

    private final Runnable homeHoldHint = () -> {
        if (switchDownAt != 0L) {
            setSwitchPrompt("Release for Home");
            switchArea.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        }
    };

    @SuppressLint("ClickableViewAccessibility")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        root.addView(webView, fullScreenParams());

        errorView = makeTextView(20f, Typeface.BOLD);
        errorView.setGravity(Gravity.CENTER);
        errorView.setPadding(dp(28), dp(28), dp(28), dp(28));
        errorView.setBackgroundColor(Color.rgb(25, 31, 42));
        errorView.setText("Could not load SwitchMate\n\nTap to retry");
        errorView.setContentDescription("Could not load SwitchMate. Tap to retry.");
        errorView.setVisibility(View.GONE);
        errorView.setClickable(true);
        errorView.setOnClickListener(view -> retryAfterLoadError());
        root.addView(errorView, fullScreenParams());

        switchArea = makeTextView(22f, Typeface.BOLD);
        switchArea.setGravity(Gravity.CENTER);
        switchArea.setClickable(true);
        switchArea.setFocusable(true);
        switchArea.setLongClickable(false);
        switchArea.setOnClickListener(view -> { });
        switchArea.setOnTouchListener(this::handleSwitchTouch);
        root.addView(switchArea, fullScreenParams());

        modeButton = makeTextView(22f, Typeface.NORMAL);
        modeButton.setText("⚡");
        modeButton.setGravity(Gravity.CENTER);
        modeButton.setClickable(true);
        modeButton.setFocusable(true);
        modeButton.setBackground(rounded(Color.argb(242, 43, 57, 76), dp(24), Color.WHITE, dp(2)));
        modeButton.setElevation(dp(10));
        modeButton.setOnClickListener(view -> registerModeTap());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            modeButton.setTooltipText("Switch mode — tap four times");
        }
        FrameLayout.LayoutParams modeParams = new FrameLayout.LayoutParams(dp(48), dp(48), Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        modeParams.topMargin = dp(4);
        root.addView(modeButton, modeParams);

        setContentView(root);
        WebAppLayer.configure(this, webView, this);

        int saved = getSharedPreferences(PREFS, MODE_PRIVATE)
            .getInt(PREF_MODE, SwitchMode.FULL_SCREEN.ordinal());
        if (saved >= 0 && saved < SwitchMode.values().length) switchMode = SwitchMode.values()[saved];

        root.addOnLayoutChangeListener((view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) layoutForCurrentMode();
        });
        applySwitchMode(false);

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(WebAppLayer.HOME_URL);
        }
        webView.requestFocus(View.FOCUS_DOWN);
        hideSystemUi();
    }

    private TextView makeTextView(float size, int style) {
        TextView view = new TextView(this);
        view.setTextColor(Color.WHITE);
        view.setTextSize(size);
        view.setTypeface(Typeface.DEFAULT, style);
        return view;
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
                long held = SystemClock.elapsedRealtime() - switchDownAt;
                clearSwitchHoldState();
                view.performClick();
                if (held >= HOME_HOLD_MS) goHomeFromSwitch();
                else if (held >= BACK_HOLD_MS) goBackFromSwitch();
                else {
                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
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

    private void clearSwitchHoldState() {
        handler.removeCallbacks(backHoldHint);
        handler.removeCallbacks(homeHoldHint);
        switchDownAt = 0L;
        showSwitchPressed(false);
        setSwitchPrompt(defaultSwitchText());
    }

    private void registerModeTap() {
        modeButton.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
        modeButton.animate().scaleX(0.82f).scaleY(0.82f).setDuration(65)
            .withEndAction(() -> modeButton.animate().scaleX(1f).scaleY(1f).setDuration(90).start())
            .start();
        long now = SystemClock.elapsedRealtime();
        if (modeTapCount == 0 || now - firstModeTapAt > QUAD_TAP_WINDOW_MS) {
            modeTapCount = 1;
            firstModeTapAt = now;
        } else modeTapCount++;
        if (modeTapCount >= 4) {
            modeTapCount = 0;
            firstModeTapAt = 0L;
            cycleSwitchMode();
        }
    }

    private void cycleSwitchMode() {
        switch (switchMode) {
            case FULL_SCREEN: switchMode = SwitchMode.BOTTOM_QUARTER; break;
            case BOTTOM_QUARTER: switchMode = SwitchMode.EXTERNAL; break;
            default: switchMode = SwitchMode.FULL_SCREEN; break;
        }
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putInt(PREF_MODE, switchMode.ordinal()).apply();
        applySwitchMode(true);
    }

    private void applySwitchMode(boolean announce) {
        switchArea.setText(defaultSwitchText());
        modeButton.setContentDescription(switchMode.label + ". Tap four times quickly to change mode.");
        if (switchMode == SwitchMode.BOTTOM_QUARTER) {
            switchArea.setVisibility(View.VISIBLE);
            switchArea.setContentDescription("Bottom twenty-five percent switch area");
            switchArea.setBackground(rounded(Color.rgb(34, 52, 76), 0, Color.rgb(91, 151, 225), dp(3)));
        } else if (switchMode == SwitchMode.EXTERNAL) {
            switchArea.setVisibility(View.GONE);
            switchArea.setContentDescription("External switch mode, not yet configured");
            switchArea.setBackgroundColor(Color.TRANSPARENT);
        } else {
            switchArea.setVisibility(View.VISIBLE);
            switchArea.setContentDescription("Full-screen switch area");
            switchArea.setBackgroundColor(Color.TRANSPARENT);
        }
        layoutForCurrentMode();
        root.post(this::layoutForCurrentMode);
        bringControlsForward();
        WebAppLayer.setMode(webView, switchMode.webName);
        if (announce) Toast.makeText(this, switchMode.label, Toast.LENGTH_SHORT).show();
    }

    private void layoutForCurrentMode() {
        if (root == null || root.getHeight() <= 0) return;
        FrameLayout.LayoutParams webParams;
        FrameLayout.LayoutParams switchParams;
        if (switchMode == SwitchMode.BOTTOM_QUARTER) {
            int switchHeight = Math.max(1, root.getHeight() / 4);
            webParams = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                Math.max(1, root.getHeight() - switchHeight), Gravity.TOP);
            switchParams = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                switchHeight, Gravity.BOTTOM);
        } else {
            webParams = fullScreenParams();
            switchParams = fullScreenParams();
        }
        webView.setLayoutParams(webParams);
        errorView.setLayoutParams(new FrameLayout.LayoutParams(webParams));
        switchArea.setLayoutParams(switchParams);
        bringControlsForward();
    }

    private void bringControlsForward() {
        if (switchArea.getVisibility() == View.VISIBLE) switchArea.bringToFront();
        if (errorView.getVisibility() == View.VISIBLE) errorView.bringToFront();
        modeButton.bringToFront();
    }

    private void activateSwitch() {
        if (errorView.getVisibility() == View.VISIBLE) retryAfterLoadError();
        else WebAppLayer.activate(webView);
    }

    private void goBackFromSwitch() {
        if (errorView.getVisibility() == View.VISIBLE) {
            hideLoadError();
            webView.loadUrl(WebAppLayer.HOME_URL);
        } else WebAppLayer.back(webView);
    }

    private void goHomeFromSwitch() {
        if (errorView.getVisibility() == View.VISIBLE) {
            hideLoadError();
            webView.loadUrl(WebAppLayer.HOME_URL);
        } else WebAppLayer.home(webView);
    }

    private String defaultSwitchText() {
        return switchMode == SwitchMode.BOTTOM_QUARTER ? "●  SWITCH" : "";
    }

    private void setSwitchPrompt(String text) {
        if (switchArea.getVisibility() == View.VISIBLE) switchArea.setText(text);
    }

    private void showSwitchPressed(boolean pressed) {
        if (switchMode == SwitchMode.FULL_SCREEN) {
            switchArea.setBackgroundColor(pressed ? Color.argb(55, 74, 123, 196) : Color.TRANSPARENT);
        } else if (switchMode == SwitchMode.BOTTOM_QUARTER) {
            int fill = pressed ? Color.rgb(62, 111, 171) : Color.rgb(34, 52, 76);
            switchArea.setBackground(rounded(fill, 0, Color.rgb(91, 151, 225), dp(3)));
        }
    }

    private void retryAfterLoadError() {
        hideLoadError();
        String current = webView.getUrl();
        if (current == null || current.startsWith("about:")) webView.loadUrl(WebAppLayer.HOME_URL);
        else webView.reload();
    }

    private void showLoadError(String description) {
        String detail = description == null || description.trim().isEmpty()
            ? "Check the internet connection." : description.trim();
        errorView.setText("Could not load SwitchMate\n\n" + detail + "\n\nTap or press the switch to retry");
        errorView.setVisibility(View.VISIBLE);
        bringControlsForward();
    }

    private void hideLoadError() {
        errorView.setVisibility(View.GONE);
    }

    private FrameLayout.LayoutParams fullScreenParams() {
        return new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private GradientDrawable rounded(int color, int radius, int strokeColor, int strokeWidth) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        if (strokeWidth > 0) drawable.setStroke(strokeWidth, strokeColor);
        return drawable;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override public void onLoadStarted() { hideLoadError(); }
    @Override public void onPageReady() { hideLoadError(); }
    @Override public void onMainFrameError(String description) { showLoadError(description); }
    @Override public String currentModeName() { return switchMode.webName; }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        hideSystemUi();
    }

    @Override
    protected void onPause() {
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
                hideLoadError();
                webView.loadUrl(WebAppLayer.HOME_URL);
            } else if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                       keyCode == KeyEvent.KEYCODE_VOLUME_MUTE) {
                return super.onKeyDown(keyCode, event);
            } else if (event == null || event.getRepeatCount() == 0) retryAfterLoadError();
            return true;
        }
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (webView != null) {
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
