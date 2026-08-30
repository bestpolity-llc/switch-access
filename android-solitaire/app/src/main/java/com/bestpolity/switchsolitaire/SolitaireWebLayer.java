package com.bestpolity.switchsolitaire;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.net.Uri;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

final class SolitaireWebLayer {

    static final String GAME_URL =
        "https://switch.bestpolity.com/games/solitaire.html?standalone=1";

    private static final String TAG = "SwitchSolitaire";
    private static final String HOST = "switch.bestpolity.com";
    private static final String GAME_PATH = "/games/solitaire.html";

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
                        "Server error " +
                        response.getStatusCode()
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
            if (isGameUrl(uri)) {
                return false;
            }

            webView.loadUrl(GAME_URL);
            return true;
        }

        try {
            Intent intent = new Intent(
                Intent.ACTION_VIEW,
                uri
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (
            ActivityNotFoundException |
            SecurityException error
        ) {
            Log.w(
                TAG,
                "No external browser available",
                error
            );
        }
        return true;
    }

    private static boolean isGameUrl(Uri uri) {
        return uri != null &&
            "https".equalsIgnoreCase(uri.getScheme()) &&
            HOST.equalsIgnoreCase(uri.getHost()) &&
            GAME_PATH.equals(uri.getPath());
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
        WebView webView,
        String modeName,
        boolean audioEnabled
    ) {
        String script =
            "(function(){" +
                "if(window.__switchSolitaireStandalone){" +
                    "window.SwitchSolitaireApp.setMode('" +
                        escapeJavaScript(modeName) +
                    "');" +
                    "window.SwitchSolitaireApp.setAudio(" +
                        (audioEnabled ? "true" : "false") +
                    ");" +
                    "return;" +
                "}" +
                "window.__switchSolitaireStandalone=true;" +
                "var nativeBridge=window.SolitaireNative||null;" +
                "var originalSpeak=" +
                    "(typeof window.speak==='function')" +
                    "?window.speak:null;" +
                "function send(key,code,keyCode){" +
                    "var o={key:key,code:code,keyCode:keyCode," +
                        "which:keyCode,bubbles:true," +
                        "cancelable:true,repeat:false};" +
                    "document.dispatchEvent(" +
                        "new KeyboardEvent('keydown',o));" +
                    "document.dispatchEvent(" +
                        "new KeyboardEvent('keyup',o));" +
                "}" +
                "function applyAudio(enabled){" +
                    "enabled=!!enabled;" +
                    "window.__switchSolitaireAudio=enabled;" +
                    "try{" +
                        "if(typeof settings!=='undefined'&&settings){" +
                            "settings.voice=enabled;" +
                            "settings.sound=enabled;" +
                            "if(typeof saveSettings==='function'){" +
                                "saveSettings();" +
                            "}" +
                        "}" +
                    "}catch(error){}" +
                "}" +
                "window.SwitchSolitaireApp={" +
                    "activate:function(){" +
                        "send(' ','Space',32);" +
                    "}," +
                    "back:function(){" +
                        "send('Escape','Escape',27);" +
                    "}," +
                    "setMode:function(name){" +
                        "document.documentElement.setAttribute(" +
                            "'data-switch-mode'," +
                            "name||'full'" +
                        ");" +
                    "}," +
                    "setAudio:applyAudio" +
                "};" +
                "if(originalSpeak){" +
                    "window.speak=function(text){" +
                        "if(!window.__switchSolitaireAudio)return;" +
                        "var used=false;" +
                        "try{" +
                            "if(nativeBridge&&" +
                                "typeof nativeBridge.speak===" +
                                "'function'){" +
                                "used=!!nativeBridge.speak(" +
                                    "String(text||'')" +
                                ");" +
                            "}" +
                        "}catch(error){}" +
                        "if(!used)originalSpeak(text);" +
                    "};" +
                "}" +
                "window.SwitchSolitaireApp.setMode('" +
                    escapeJavaScript(modeName) +
                "');" +
                "applyAudio(" +
                    (audioEnabled ? "true" : "false") +
                ");" +
            "})();";

        evaluate(webView, script);
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
}
