package com.bestpolity.switchaccess;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Owns the native switch surface, mode selection, and compact app toolbar. */
final class SwitchController {
    interface Callback {
        void onActivate();
        void onBack();
        void onHome();
        void onModeChanged(String webName, String label, boolean announce);
        void onScanAudioChanged(boolean enabled, boolean announce);
    }

    private static final String PREFS = "switch_access_prefs";
    private static final String PREF_MODE = "switch_mode";
    private static final String PREF_AUDIO = "scan_audio";
    private static final long QUAD_TAP_MS = 2200L;
    private static final long BACK_HOLD_MS = 2000L;
    private static final long HOME_HOLD_MS = 10000L;

    private enum Mode {
        FULL("Full-screen switch", "full"),
        BOTTOM("Bottom 25% switch", "bottom"),
        EXTERNAL("External — TBD", "external");
        final String label;
        final String webName;
        Mode(String label, String webName) { this.label = label; this.webName = webName; }
    }

    private final Activity activity;
    private final FrameLayout root;
    private final WebView webView;
    private final View errorView;
    private final Callback callback;
    private final SharedPreferences prefs;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final TextView switchArea;
    private final LinearLayout toolbar;
    private final TextView modeButton;
    private final TextView audioButton;
    private Mode mode = Mode.FULL;
    private boolean audioEnabled;
    private boolean dialogOpen;
    private int modeTaps;
    private long firstModeTap;
    private long switchDown;

    SwitchController(Activity activity, FrameLayout root, WebView webView, View errorView, Callback callback) {
        this.activity = activity;
        this.root = root;
        this.webView = webView;
        this.errorView = errorView;
        this.callback = callback;
        prefs = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int savedMode = prefs.getInt(PREF_MODE, Mode.FULL.ordinal());
        if (savedMode >= 0 && savedMode < Mode.values().length) mode = Mode.values()[savedMode];
        audioEnabled = prefs.getBoolean(PREF_AUDIO, true);

        switchArea = textView(22f, Typeface.BOLD);
        switchArea.setGravity(Gravity.CENTER);
        switchArea.setClickable(true);
        switchArea.setFocusable(true);
        switchArea.setLongClickable(false);
        switchArea.setOnClickListener(view -> { });
        switchArea.setOnTouchListener(this::handleTouch);
        root.addView(switchArea, fullParams());

        toolbar = new LinearLayout(activity);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER);
        toolbar.setPadding(dp(2), 0, dp(2), 0);
        modeButton = controlButton("⚡", "Switch mode. Tap four times quickly to change mode.");
        audioButton = controlButton(audioEnabled ? "🔊" : "🔇", "Toggle spoken scanning");
        modeButton.setOnClickListener(view -> registerModeTap());
        audioButton.setOnClickListener(view -> setAudioEnabled(!audioEnabled, true));
        LinearLayout.LayoutParams button = new LinearLayout.LayoutParams(dp(44), dp(44));
        button.setMargins(dp(3), 0, dp(3), 0);
        toolbar.addView(modeButton, new LinearLayout.LayoutParams(button));
        toolbar.addView(audioButton, new LinearLayout.LayoutParams(button));
        FrameLayout.LayoutParams bar = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, dp(48), Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        bar.topMargin = dp(4);
        root.addView(toolbar, bar);

        root.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, oright, ob) -> {
            if (r - l != oright - ol || b - t != ob - ot) layout();
        });
        applyMode(false);
        updateAudioButton();
    }

    String modeWebName() { return mode.webName; }
    boolean isAudioEnabled() { return audioEnabled; }

    void setDialogOpen(boolean open) {
        dialogOpen = open;
        toolbar.setVisibility(open ? View.INVISIBLE : View.VISIBLE);
        bringForward();
    }

    void setAudioFromWeb(boolean enabled) {
        setAudioEnabled(enabled, true);
    }

    void layout() {
        if (root.getHeight() <= 0) return;
        FrameLayout.LayoutParams web;
        FrameLayout.LayoutParams area;
        if (mode == Mode.BOTTOM) {
            int switchHeight = Math.max(1, root.getHeight() / 4);
            web = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                Math.max(1, root.getHeight() - switchHeight), Gravity.TOP);
            area = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, switchHeight, Gravity.BOTTOM);
        } else {
            web = fullParams();
            area = fullParams();
        }
        webView.setLayoutParams(web);
        errorView.setLayoutParams(new FrameLayout.LayoutParams(web));
        switchArea.setLayoutParams(area);
        bringForward();
    }

    void destroy() {
        handler.removeCallbacksAndMessages(null);
    }

    private boolean handleTouch(View view, MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                if (switchDown != 0L) return true;
                switchDown = SystemClock.elapsedRealtime();
                showPressed(true);
                handler.postDelayed(this::showBackHint, BACK_HOLD_MS);
                handler.postDelayed(this::showHomeHint, HOME_HOLD_MS);
                return true;
            case MotionEvent.ACTION_UP:
                if (switchDown == 0L) return true;
                long held = SystemClock.elapsedRealtime() - switchDown;
                clearHold();
                view.performClick();
                if (held >= HOME_HOLD_MS) callback.onHome();
                else if (held >= BACK_HOLD_MS) callback.onBack();
                else {
                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
                    callback.onActivate();
                }
                return true;
            case MotionEvent.ACTION_CANCEL:
                clearHold();
                return true;
            default:
                return true;
        }
    }

    private void showBackHint() {
        if (switchDown != 0L) {
            setPrompt("Release for Back");
            switchArea.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        }
    }

    private void showHomeHint() {
        if (switchDown != 0L) {
            setPrompt("Release for Home");
            switchArea.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        }
    }

    private void clearHold() {
        handler.removeCallbacksAndMessages(null);
        switchDown = 0L;
        showPressed(false);
        setPrompt(defaultText());
    }

    private void registerModeTap() {
        modeButton.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
        modeButton.animate().scaleX(0.82f).scaleY(0.82f).setDuration(65)
            .withEndAction(() -> modeButton.animate().scaleX(1f).scaleY(1f).setDuration(90).start()).start();
        long now = SystemClock.elapsedRealtime();
        if (modeTaps == 0 || now - firstModeTap > QUAD_TAP_MS) {
            modeTaps = 1;
            firstModeTap = now;
        } else modeTaps++;
        if (modeTaps >= 4) {
            modeTaps = 0;
            firstModeTap = 0L;
            mode = mode == Mode.FULL ? Mode.BOTTOM : mode == Mode.BOTTOM ? Mode.EXTERNAL : Mode.FULL;
            prefs.edit().putInt(PREF_MODE, mode.ordinal()).apply();
            applyMode(true);
        }
    }

    private void applyMode(boolean announce) {
        switchArea.setText(defaultText());
        modeButton.setContentDescription(mode.label + ". Tap four times quickly to change mode.");
        if (mode == Mode.BOTTOM) {
            switchArea.setVisibility(View.VISIBLE);
            switchArea.setContentDescription("Bottom twenty-five percent switch area");
            switchArea.setBackground(rounded(Color.rgb(34, 52, 76), 0, Color.rgb(91, 151, 225), dp(3)));
        } else if (mode == Mode.EXTERNAL) {
            switchArea.setVisibility(View.GONE);
            switchArea.setContentDescription("External switch mode, not yet configured");
            switchArea.setBackgroundColor(Color.TRANSPARENT);
        } else {
            switchArea.setVisibility(View.VISIBLE);
            switchArea.setContentDescription("Full-screen switch area");
            switchArea.setBackgroundColor(Color.TRANSPARENT);
        }
        layout();
        root.post(this::layout);
        callback.onModeChanged(mode.webName, mode.label, announce);
    }

    private void setAudioEnabled(boolean enabled, boolean announce) {
        audioEnabled = enabled;
        prefs.edit().putBoolean(PREF_AUDIO, enabled).apply();
        updateAudioButton();
        callback.onScanAudioChanged(enabled, announce);
    }

    private void updateAudioButton() {
        audioButton.setText(audioEnabled ? "🔊" : "🔇");
        audioButton.setContentDescription(
            (audioEnabled ? "Spoken scanning on" : "Spoken scanning off") + ". Tap to toggle.");
    }

    private void showPressed(boolean pressed) {
        if (mode == Mode.FULL) {
            switchArea.setBackgroundColor(pressed ? Color.argb(55, 74, 123, 196) : Color.TRANSPARENT);
        } else if (mode == Mode.BOTTOM) {
            int fill = pressed ? Color.rgb(62, 111, 171) : Color.rgb(34, 52, 76);
            switchArea.setBackground(rounded(fill, 0, Color.rgb(91, 151, 225), dp(3)));
        }
    }

    private String defaultText() { return mode == Mode.BOTTOM ? "●  SWITCH" : ""; }
    private void setPrompt(String text) { if (switchArea.getVisibility() == View.VISIBLE) switchArea.setText(text); }

    private void bringForward() {
        if (switchArea.getVisibility() == View.VISIBLE) switchArea.bringToFront();
        if (errorView.getVisibility() == View.VISIBLE) errorView.bringToFront();
        if (!dialogOpen) toolbar.bringToFront();
    }

    private TextView textView(float size, int style) {
        TextView view = new TextView(activity);
        view.setTextColor(Color.WHITE);
        view.setTextSize(size);
        view.setTypeface(Typeface.DEFAULT, style);
        return view;
    }

    private TextView controlButton(String text, String tooltip) {
        TextView button = textView(20f, Typeface.NORMAL);
        button.setText(text);
        button.setGravity(Gravity.CENTER);
        button.setClickable(true);
        button.setFocusable(true);
        button.setBackground(rounded(Color.argb(244, 43, 57, 76), dp(22), Color.WHITE, dp(2)));
        button.setElevation(dp(10));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) button.setTooltipText(tooltip);
        return button;
    }

    private FrameLayout.LayoutParams fullParams() {
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
        return Math.round(value * activity.getResources().getDisplayMetrics().density);
    }
}
