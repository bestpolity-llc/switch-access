package com.bestpolity.switchaccess;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;

final class WebAppLayer {
    static final String HOME_URL = "https://switch.bestpolity.com/";

    private static final String TAG = "SwitchAccess";
    private static final String CSS_ASSET = "switch_app.css";
    private static final String BRIDGE_ASSET = "switch_app_bridge.js.gz.b64";
    private static final String PATCH_ASSET = "switch_app_patch.js";

    interface Listener {
        void onLoadStarted();
        void onPageReady();
        void onMainFrameError(String description);
        String currentModeName();
        boolean currentScanAudioEnabled();
    }

    private WebAppLayer() {}

    @SuppressLint("SetJavaScriptEnabled")
    static void configure(Context context, WebView webView, Listener listener) {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setLongClickable(false);
        webView.setOnLongClickListener(view -> true);
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            private boolean mainFrameFailed;

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                mainFrameFailed = false;
                listener.onLoadStarted();
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (mainFrameFailed) return;
                listener.onPageReady();
                if (isSwitchMateUrl(url)) {
                    inject(
                        context,
                        view,
                        listener.currentModeName(),
                        listener.currentScanAudioEnabled()
                    );
                }
            }

            @Override
            public void onReceivedHttpError(
                WebView view,
                WebResourceRequest request,
                WebResourceResponse response
            ) {
                super.onReceivedHttpError(view, request, response);
                if (request != null && request.isForMainFrame() &&
                    response != null && response.getStatusCode() >= 400) {
                    mainFrameFailed = true;
                    listener.onMainFrameError("Server error " + response.getStatusCode());
                }
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(
                WebView view,
                int errorCode,
                String description,
                String failingUrl
            ) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                String current = view.getUrl();
                if (current == null || failingUrl == null || current.equals(failingUrl)) {
                    mainFrameFailed = true;
                    listener.onMainFrameError(
                        description == null ? "Network error" : description
                    );
                }
            }
        });
    }

    private static boolean isSwitchMateUrl(String url) {
        return HOME_URL.substring(0, HOME_URL.length() - 1).equals(url) ||
            (url != null && url.startsWith(HOME_URL));
    }

    static void activate(WebView webView) {
        evaluate(webView,
            "(function(){" +
                "if(window.SwitchAccessApp&&typeof window.SwitchAccessApp.activate==='function'){" +
                    "window.SwitchAccessApp.activate();return;}" +
                "var o={key:' ',code:'Space',keyCode:32,which:32,bubbles:true,cancelable:true,repeat:false};" +
                "document.dispatchEvent(new KeyboardEvent('keydown',o));" +
                "document.dispatchEvent(new KeyboardEvent('keyup',o));" +
            "})();"
        );
    }

    static void back(WebView webView) {
        evaluate(webView,
            "(function(){" +
                "if(window.SwitchAccessApp&&typeof window.SwitchAccessApp.back==='function'){" +
                    "window.SwitchAccessApp.back();return;}" +
                "var o={key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true,cancelable:true,repeat:false};" +
                "document.dispatchEvent(new KeyboardEvent('keydown',o));" +
                "document.dispatchEvent(new KeyboardEvent('keyup',o));" +
            "})();"
        );
    }

    static void home(WebView webView) {
        evaluate(webView,
            "(function(){" +
                "if(window.SwitchAccessApp&&typeof window.SwitchAccessApp.home==='function'){" +
                    "window.SwitchAccessApp.home();return;}" +
                "location.href='" + HOME_URL + "';" +
            "})();"
        );
    }

    static void setMode(WebView webView, String modeName) {
        evaluate(webView,
            "(function(){if(window.SwitchAccessApp&&typeof window.SwitchAccessApp.setMode==='function'){" +
                "window.SwitchAccessApp.setMode('" + modeName + "');" +
            "}})();"
        );
    }

    static void setScanAudio(WebView webView, boolean enabled) {
        evaluate(webView,
            "(function(){if(window.SwitchAccessApp&&typeof window.SwitchAccessApp.setScanAudio==='function'){" +
                "window.SwitchAccessApp.setScanAudio(" + (enabled ? "true" : "false") + ");" +
            "}})();"
        );
    }

    private static void inject(
        Context context,
        WebView webView,
        String modeName,
        boolean scanAudioEnabled
    ) {
        try {
            String css = readAsset(context, CSS_ASSET);
            String bridge = readCompressedBase64Asset(context, BRIDGE_ASSET);
            String patch = readAsset(context, PATCH_ASSET);
            String encodedCss = Base64.encodeToString(
                css.getBytes(StandardCharsets.UTF_8),
                Base64.NO_WRAP
            );
            String injectCss =
                "(function(){" +
                    "var old=document.getElementById('switch-app-native-style');if(old)old.remove();" +
                    "var s=document.createElement('style');s.id='switch-app-native-style';" +
                    "s.textContent=atob('" + encodedCss + "');" +
                    "(document.head||document.documentElement).appendChild(s);" +
                "})();";

            webView.evaluateJavascript(injectCss, ignored ->
                webView.evaluateJavascript(bridge, ignoredBridge ->
                    webView.evaluateJavascript(patch, ignoredPatch -> {
                        setMode(webView, modeName);
                        setScanAudio(webView, scanAudioEnabled);
                    })
                )
            );
        } catch (IOException error) {
            Log.e(TAG, "Could not inject app accessibility layer", error);
        }
    }

    private static void evaluate(WebView webView, String script) {
        if (webView != null) webView.evaluateJavascript(script, null);
    }

    private static String readAsset(Context context, String name) throws IOException {
        try (InputStream input = context.getAssets().open(name)) {
            return readUtf8(input);
        }
    }

    private static String readCompressedBase64Asset(Context context, String name)
        throws IOException {
        String encoded = readAsset(context, name).replaceAll("\\s+", "");
        byte[] compressed = Base64.decode(encoded, Base64.DEFAULT);
        try (GZIPInputStream gzip =
                 new GZIPInputStream(new ByteArrayInputStream(compressed))) {
            return readUtf8(gzip);
        }
    }

    private static String readUtf8(InputStream input) throws IOException {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }
}
