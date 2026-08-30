package com.bestpolity.switchaccess;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity implements
    WebAppLayer.Listener, SwitchController.Callback, SpeechBridge.Host {

    private FrameLayout root;
    private WebView webView;
    private TextView errorView;
    private SwitchController switches;
    private SpeechBridge speech;

    @SuppressLint({"ClickableViewAccessibility", "AddJavascriptInterface"})
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
        root.addView(webView, fullParams());

        errorView = new TextView(this);
        errorView.setTextColor(Color.WHITE);
        errorView.setTextSize(20f);
        errorView.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        errorView.setGravity(Gravity.CENTER);
        errorView.setPadding(dp(28), dp(28), dp(28), dp(28));
        errorView.setBackgroundColor(Color.rgb(25, 31, 42));
        errorView.setText("Could not load SwitchMate\n\nTap to retry");
        errorView.setContentDescription("Could not load SwitchMate. Tap to retry.");
        errorView.setVisibility(View.GONE);
        errorView.setClickable(true);
        errorView.setOnClickListener(view -> retryAfterLoadError());
        root.addView(errorView, fullParams());

        switches = new SwitchController(this, root, webView, errorView, this);
        speech = new SpeechBridge(this, this);
        webView.addJavascriptInterface(speech, "SwitchAccessNative");
        setContentView(root);
        WebAppLayer.configure(this, webView, this);

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(WebAppLayer.HOME_URL);
        }
        webView.requestFocus(View.FOCUS_DOWN);
        hideSystemUi();
    }

    @Override public void onActivate() {
        if (errorView.getVisibility() == View.VISIBLE) retryAfterLoadError();
        else WebAppLayer.activate(webView);
    }

    @Override public void onBack() {
        if (errorView.getVisibility() == View.VISIBLE) {
            hideLoadError();
            webView.loadUrl(WebAppLayer.HOME_URL);
        } else WebAppLayer.back(webView);
    }

    @Override public void onHome() {
        if (errorView.getVisibility() == View.VISIBLE) {
            hideLoadError();
            webView.loadUrl(WebAppLayer.HOME_URL);
        } else WebAppLayer.home(webView);
    }

    @Override public void onModeChanged(String webName, String label, boolean announce) {
        WebAppLayer.setMode(webView, webName);
        if (announce) Toast.makeText(this, label, Toast.LENGTH_SHORT).show();
    }

    @Override public void onScanAudioChanged(boolean enabled, boolean announce) {
        WebAppLayer.setScanAudio(webView, enabled);
        if (announce) {
            String message = enabled ? "Scan audio on" : "Scan audio off";
            speech.speakUnconditional(message);
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        }
    }

    @Override public boolean isScanAudioEnabled() { return switches.isAudioEnabled(); }
    @Override public void setScanAudioEnabled(boolean enabled) { switches.setAudioFromWeb(enabled); }
    @Override public void setDialogOpen(boolean open) { switches.setDialogOpen(open); }

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
        switches.layout();
    }

    private void hideLoadError() { errorView.setVisibility(View.GONE); }

    private FrameLayout.LayoutParams fullParams() {
        return new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onLoadStarted() {
        hideLoadError();
        switches.setDialogOpen(false);
    }
    @Override public void onPageReady() { hideLoadError(); }
    @Override public void onMainFrameError(String description) { showLoadError(description); }
    @Override public String currentModeName() { return switches.modeWebName(); }
    @Override public boolean currentScanAudioEnabled() { return switches.isAudioEnabled(); }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override protected void onResume() {
        super.onResume();
        webView.onResume();
        hideSystemUi();
    }

    @Override protected void onPause() {
        speech.pause();
        webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (errorView.getVisibility() == View.VISIBLE) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hideLoadError();
                webView.loadUrl(WebAppLayer.HOME_URL);
            } else if (keyCode == KeyEvent.KEYCODE_VOLUME_UP ||
                       keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                       keyCode == KeyEvent.KEYCODE_VOLUME_MUTE) {
                return super.onKeyDown(keyCode, event);
            } else if (event == null || event.getRepeatCount() == 0) retryAfterLoadError();
            return true;
        }
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            WebAppLayer.back(webView);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override protected void onDestroy() {
        switches.destroy();
        speech.destroy();
        if (webView != null) {
            webView.removeJavascriptInterface("SwitchAccessNative");
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
