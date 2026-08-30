package com.bestpolity.switchsolitaire;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

final class SolitaireWebLayer {

    static final String GAME_URL =
        "https://switch.bestpolity.com/games/solitaire.html?standalone=1";

    private static final String TAG = "SwitchSolitaire";
    private static final String HOST = "switch.bestpolity.com";
    private static final String GAME_PATH = "/games/solitaire.html";
    private static final String CSS_ASSET = "solitaire_app.css";
    private static final String JS_ASSET = "solitaire_app.js";

    interface Listener {
        void onLoadStarted();
        void onPageReady();
        void onMainFrameError(String description);
        String currentModeName();
        boolean currentAudioEnabled();
    }

    private SolitaireWebLayer() {}

    @SuppressLint("SetJavaScriptEnabled")
    static void configure(
        Context context,
        WebView webView,
        Listener listener
    ) {
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
        settings.setMixedContentMode(
            WebSettings.MIXED_CONTENT_NEVER_ALLOW
        );

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setLongClickable(false);
        webView.setOnLongClickListener(view -> true);

        boolean debuggable =
            (context.getApplicationInfo().flags &
             ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(debuggable);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            private boolean mainFrameFailed;

            @Override
            public boolean shouldOverrideUrlLoading(
                WebView view,
                WebResourceRequest request
            ) {
                if (request == null || !request.isForMainFrame()) {
                    return false;
                }
                return handleNavigation(
                    context,
                    view,
                    request.getUrl()
                );
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(
                WebView view,
                String url
            ) {
                return handleNavigation(
                    context,
                    view,
                    Uri.parse(url)
                );
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(
                WebView view,
                WebResourceRequest request
            ) {
                if (request != null && shouldBlockScript(request.getUrl())) {
                    return emptyJavaScript();
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageStarted(
                WebView view,
                String url,
                Bitmap favicon
            ) {
                mainFrameFailed = false;
                listener.onLoadStarted();
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(
                WebView view,
                String url
            ) {
                super.onPageFinished(view, url);
                if (mainFrameFailed) return;

                listener.onPageReady();
                if (isGameUrl(Uri.parse(url))) {
                    injectStandaloneLayer(
                        context,
                        view,
                        listener.currentModeName(),
                        listener.currentAudioEnabled()
                    );
                }
            }

            @Override
            public void onReceivedHttpError(
                WebView view,
                WebResourceRequest request,
                WebResourceResponse response
            ) {
                super.onReceivedHttpError(
                    view,
                    request,
                    response
                );

                if (request != null &&
                    request.isForMainFrame() &&
                    response != null &&
                    response.getStatusCode() >= 400) {
                    mainFrameFailed = true;
                    listener.onMainFrameError(
                        "Server error " + response.getStatusCode()
                    );
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
                super.onReceivedError(
                    view,
                    errorCode,
                    description,
                    failingUrl
                );

                String current = view.getUrl();
                if (current == null ||
                    failingUrl == null ||
                    current.equals(failingUrl)) {
                    mainFrameFailed = true;
                    listener.onMainFrameError(
                        description == null
                            ? "Network error"
                            : description
                    );
                }
            }
        });
    }

    private static boolean handleNavigation(
        Context context,
        WebView webView,
        Uri uri
    ) {
        if (uri == null) return true;

        String scheme = uri.getScheme();
        if ("about".equalsIgnoreCase(scheme)) {
            return false;
        }

        if ("https".equalsIgnoreCase(scheme) &&
            HOST.equalsIgnoreCase(uri.getHost())) {
            if (isGameUrl(uri) &&
                "1".equals(uri.getQueryParameter("openBrowser"))) {
                openExternal(
                    context,
                    Uri.parse(
                        "https://switch.bestpolity.com/games/solitaire.html"
                    )
                );
                return true;
            }

            if (isGameUrl(uri)) {
                return false;
            }

            webView.loadUrl(GAME_URL);
            return true;
        }

        openExternal(context, uri);
        return true;
    }

    private static void openExternal(Context context, Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (
            ActivityNotFoundException |
            SecurityException error
        ) {
            Log.w(TAG, "No external handler available", error);
        }
    }

    private static boolean isGameUrl(Uri uri) {
        return uri != null &&
            "https".equalsIgnoreCase(uri.getScheme()) &&
            HOST.equalsIgnoreCase(uri.getHost()) &&
            GAME_PATH.equals(uri.getPath());
    }

    private static boolean shouldBlockScript(Uri uri) {
        if (uri == null) return false;
        String host = uri.getHost();
        String path = uri.getPath();
        if (path == null) return false;

        if ("www.gstatic.com".equalsIgnoreCase(host) &&
            path.startsWith("/firebasejs/")) {
            return true;
        }

        return HOST.equalsIgnoreCase(host) &&
            (path.endsWith("/firebase-init.js") ||
             path.endsWith("/switchmate-tracker.js"));
    }

    private static WebResourceResponse emptyJavaScript() {
        return new WebResourceResponse(
            "application/javascript",
            "UTF-8",
            new ByteArrayInputStream(new byte[0])
        );
    }

    static void activate(WebView webView) {
        evaluate(
            webView,
            "(function(){" +
                "if(window.SwitchSolitaireApp){" +
                    "window.SwitchSolitaireApp.activate();" +
                    "return;" +
                "}" +
                "var o={key:' ',code:'Space',keyCode:32," +
                    "which:32,bubbles:true,cancelable:true," +
                    "repeat:false};" +
                "document.dispatchEvent(" +
                    "new KeyboardEvent('keydown',o));" +
                "document.dispatchEvent(" +
                    "new KeyboardEvent('keyup',o));" +
            "})();"
        );
    }

    static void back(WebView webView) {
        evaluate(
            webView,
            "(function(){" +
                "if(window.SwitchSolitaireApp){" +
                    "window.SwitchSolitaireApp.back();" +
                    "return;" +
                "}" +
                "var o={key:'Escape',code:'Escape'," +
                    "keyCode:27,which:27,bubbles:true," +
                    "cancelable:true,repeat:false};" +
                "document.dispatchEvent(" +
                    "new KeyboardEvent('keydown',o));" +
                "document.dispatchEvent(" +
                    "new KeyboardEvent('keyup',o));" +
            "})();"
        );
    }

    static void setMode(
        WebView webView,
        String modeName
    ) {
        evaluate(
            webView,
            "(function(){" +
                "if(window.SwitchSolitaireApp){" +
                    "window.SwitchSolitaireApp.setMode('" +
                    escapeJavaScript(modeName) +
                    "');" +
                "}" +
            "})();"
        );
    }

    static void setAudio(
        WebView webView,
        boolean enabled
    ) {
        evaluate(
            webView,
            "(function(){" +
                "if(window.SwitchSolitaireApp){" +
                    "window.SwitchSolitaireApp.setAudio(" +
                    (enabled ? "true" : "false") +
                    ");" +
                "}" +
            "})();"
        );
    }

    private static void injectStandaloneLayer(
        Context context,
        WebView webView,
        String modeName,
        boolean audioEnabled
    ) {
        try {
            String css = readAsset(context, CSS_ASSET);
            String javascript = readAsset(context, JS_ASSET);
            String encodedCss = Base64.encodeToString(
                css.getBytes(StandardCharsets.UTF_8),
                Base64.NO_WRAP
            );
            String injectCss =
                "(function(){" +
                    "var old=document.getElementById(" +
                        "'switch-solitaire-native-style');" +
                    "if(old)old.remove();" +
                    "var s=document.createElement('style');" +
                    "s.id='switch-solitaire-native-style';" +
                    "s.textContent=atob('" + encodedCss + "');" +
                    "(document.head||document.documentElement)" +
                        ".appendChild(s);" +
                "})();";

            webView.evaluateJavascript(
                injectCss,
                ignored -> webView.evaluateJavascript(
                    javascript,
                    ignoredScript -> {
                        setMode(webView, modeName);
                        setAudio(webView, audioEnabled);
                    }
                )
            );
        } catch (IOException error) {
            Log.e(
                TAG,
                "Could not inject standalone Solitaire layer",
                error
            );
        }
    }

    private static String escapeJavaScript(
        String value
    ) {
        if (value == null) return "";
        return value
            .replace("\\", "\\\\")
            .replace("'", "\\'");
    }

    private static void evaluate(
        WebView webView,
        String script
    ) {
        if (webView != null) {
            webView.evaluateJavascript(script, null);
        }
    }

    private static String readAsset(
        Context context,
        String name
    ) throws IOException {
        try (InputStream input = context.getAssets().open(name)) {
            return readUtf8(input);
        }
    }

    private static String readUtf8(
        InputStream input
    ) throws IOException {
        try (ByteArrayOutputStream output =
                 new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            return output.toString(
                StandardCharsets.UTF_8.name()
            );
        }
    }
}
