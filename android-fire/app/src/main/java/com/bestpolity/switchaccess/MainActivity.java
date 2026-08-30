package com.bestpolity.switchaccess;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://switch.bestpolity.com/";
    private static final String PREFS = "switch_access_prefs";
    private static final String PREF_MODE = "switch_mode";
    private static final long QUAD_TAP_WINDOW_MS = 1800L;

    private enum SwitchMode {
        FULL_SCREEN,
        BOTTOM_QUARTER,
        EXTERNAL
    }

    private FrameLayout root;
    private WebView webView;
    private TextView switchArea;
    private TextView modeButton;
    private SwitchMode switchMode = SwitchMode.FULL_SCREEN;
    private int modeTapCount = 0;
    private long firstModeTapAt = 0L;

    @SuppressLint({"SetJavaScriptEnabled", "ClickableViewAccessibility"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        root.addView(webView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        switchArea = new TextView(this);
        switchArea.setGravity(Gravity.CENTER);
        switchArea.setTextColor(Color.WHITE);
        switchArea.setTextSize(22f);
        switchArea.setAllCaps(false);
        switchArea.setClickable(true);
        switchArea.setFocusable(true);
        switchArea.setOnTouchListener((v, event) -> {
            if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
                showSwitchPressed(true);
                return true;
            }
            if (event.getActionMasked() == MotionEvent.ACTION_UP) {
                showSwitchPressed(false);
                activateSwitch();
                v.performClick();
                return true;
            }
            if (event.getActionMasked() == MotionEvent.ACTION_CANCEL) {
                showSwitchPressed(false);
                return true;
            }
            return true;
        });
        root.addView(switchArea);

        modeButton = new TextView(this);
        modeButton.setText("⚡ Switch Mode");
        modeButton.setTextColor(Color.WHITE);
        modeButton.setTextSize(14f);
        modeButton.setGravity(Gravity.CENTER);
        modeButton.setPadding(dp(14), dp(10), dp(14), dp(10));
        modeButton.setClickable(true);
        modeButton.setFocusable(true);
        modeButton.setContentDescription("Switch mode. Tap four times to change mode.");
        modeButton.setBackground(makeRoundedBackground(Color.argb(230, 50, 70, 95), dp(22)));
        modeButton.setElevation(dp(8));
        modeButton.setOnClickListener(v -> registerModeTap());

        FrameLayout.LayoutParams modeParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.END
        );
        modeParams.topMargin = dp(14);
        modeParams.rightMargin = dp(14);
        root.addView(modeButton, modeParams);

        setContentView(root);

        int savedMode = getSharedPreferences(PREFS, MODE_PRIVATE)
            .getInt(PREF_MODE, SwitchMode.FULL_SCREEN.ordinal());
        if (savedMode >= 0 && savedMode < SwitchMode.values().length) {
            switchMode = SwitchMode.values()[savedMode];
        }
        applySwitchMode(false);

        if (savedInstanceState == null) {
            webView.loadUrl(HOME_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }

        hideSystemUi();
    }

    private void registerModeTap() {
        long now = SystemClock.elapsedRealtime();
        if (modeTapCount == 0 || now - firstModeTapAt > QUAD_TAP_WINDOW_MS) {
            modeTapCount = 1;
            firstModeTapAt = now;
        } else {
            modeTapCount++;
        }

        if (modeTapCount >= 4) {
            modeTapCount = 0;
            firstModeTapAt = 0L;
            cycleSwitchMode();
        }
    }

    private void cycleSwitchMode() {
        switch (switchMode) {
            case FULL_SCREEN:
                switchMode = SwitchMode.BOTTOM_QUARTER;
                break;
            case BOTTOM_QUARTER:
                switchMode = SwitchMode.EXTERNAL;
                break;
            case EXTERNAL:
            default:
                switchMode = SwitchMode.FULL_SCREEN;
                break;
        }

        getSharedPreferences(PREFS, MODE_PRIVATE)
            .edit()
            .putInt(PREF_MODE, switchMode.ordinal())
            .apply();
        applySwitchMode(true);
    }

    private void applySwitchMode(boolean announce) {
        FrameLayout.LayoutParams areaParams;
        String message;

        switch (switchMode) {
            case BOTTOM_QUARTER:
                areaParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    Gravity.BOTTOM
                );
                switchArea.setVisibility(View.VISIBLE);
                switchArea.setText("●  SWITCH");
                switchArea.setBackgroundColor(Color.argb(210, 34, 52, 76));
                root.post(() -> {
                    FrameLayout.LayoutParams p = (FrameLayout.LayoutParams) switchArea.getLayoutParams();
                    p.height = Math.max(1, root.getHeight() / 4);
                    p.gravity = Gravity.BOTTOM;
                    switchArea.setLayoutParams(p);
                });
                message = "Switch mode: bottom 25%";
                break;

            case EXTERNAL:
                areaParams = new FrameLayout.LayoutParams(0, 0);
                switchArea.setVisibility(View.GONE);
                switchArea.setText("");
                switchArea.setBackgroundColor(Color.TRANSPARENT);
                message = "Switch mode: External — TBD";
                break;

            case FULL_SCREEN:
            default:
                areaParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
                switchArea.setVisibility(View.VISIBLE);
                switchArea.setText("");
                switchArea.setBackgroundColor(Color.TRANSPARENT);
                message = "Switch mode: full screen";
                break;
        }

        switchArea.setLayoutParams(areaParams);
        modeButton.bringToFront();
        modeButton.setText("⚡ Switch Mode");
        modeButton.setContentDescription(message + ". Tap four times to change mode.");

        if (announce) {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        }
    }

    private void showSwitchPressed(boolean pressed) {
        if (switchMode == SwitchMode.FULL_SCREEN) {
            switchArea.setBackgroundColor(
                pressed ? Color.argb(55, 74, 123, 196) : Color.TRANSPARENT
            );
        } else if (switchMode == SwitchMode.BOTTOM_QUARTER) {
            switchArea.setBackgroundColor(
                pressed ? Color.argb(240, 74, 123, 196) : Color.argb(210, 34, 52, 76)
            );
        }
    }

    private void activateSwitch() {
        webView.evaluateJavascript(
            "(function(){" +
                "var d=document;" +
                "var t=d.activeElement||d.body;" +
                "['keydown','keyup'].forEach(function(type){" +
                    "var e=new KeyboardEvent(type,{key:' ',code:'Space',keyCode:32,which:32,bubbles:true,cancelable:true});" +
                    "t.dispatchEvent(e);" +
                    "if(t!==d){d.dispatchEvent(new KeyboardEvent(type,{key:' ',code:'Space',keyCode:32,which:32,bubbles:true,cancelable:true}));}" +
                "});" +
            "})();",
            null
        );
    }

    private GradientDrawable makeRoundedBackground(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        return drawable;
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
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
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUi();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
