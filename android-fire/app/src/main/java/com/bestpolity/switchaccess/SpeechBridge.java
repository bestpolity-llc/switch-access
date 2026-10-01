package com.bestpolity.switchaccess;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;

import java.util.Locale;

/** Native speech and the narrow JavaScript API exposed to trusted SwitchMate pages. */
final class SpeechBridge {
    interface Host {
        boolean isScanAudioEnabled();
        void setScanAudioEnabled(boolean enabled);
        void setDialogOpen(boolean open);
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Host host;
    private TextToSpeech tts;
    private boolean ready;
    private volatile boolean failed;
    private String pendingText;
    private boolean pendingHonorsToggle;
    private int utteranceId;

    SpeechBridge(Context context, Host host) {
        this.host = host;
        tts = new TextToSpeech(context.getApplicationContext(), status -> handler.post(() -> finishInit(status)));
    }

    private void finishInit(int status) {
        if (status != TextToSpeech.SUCCESS || tts == null) {
            failed = true;
            ready = false;
            return;
        }
        int language = tts.setLanguage(Locale.getDefault());
        if (unsupported(language)) language = tts.setLanguage(Locale.US);
        if (unsupported(language)) {
            failed = true;
            ready = false;
            return;
        }
        tts.setSpeechRate(0.92f);
        tts.setPitch(1.0f);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
        }
        ready = true;
        failed = false;
        if (pendingText != null) {
            String text = pendingText;
            boolean honorsToggle = pendingHonorsToggle;
            pendingText = null;
            speak(text, honorsToggle);
        }
    }

    private boolean unsupported(int result) {
        return result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED;
    }

    boolean speakUnconditional(String text) {
        return speak(text, false);
    }

    private boolean speak(String rawText, boolean honorScanToggle) {
        if (rawText == null || failed) return false;
        String text = rawText.trim();
        if (text.isEmpty()) return false;
        if (text.length() > 5000) text = text.substring(0, 5000);
        final String finalText = text;
        handler.post(() -> {
            if (honorScanToggle && !host.isScanAudioEnabled()) return;
            if (!ready || tts == null) {
                pendingText = finalText;
                pendingHonorsToggle = honorScanToggle;
                return;
            }
            tts.speak(finalText, TextToSpeech.QUEUE_FLUSH, null, "switch-access-" + (++utteranceId));
        });
        return true;
    }

    void pause() {
        if (tts != null) tts.stop();
    }

    void destroy() {
        handler.removeCallbacksAndMessages(null);
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }

    @JavascriptInterface
    public boolean announce(String text) {
        return speak(text, true);
    }

    @JavascriptInterface
    public boolean speak(String text) {
        return speak(text, false);
    }

    @JavascriptInterface
    public boolean isScanAudioEnabled() {
        return host.isScanAudioEnabled();
    }

    @JavascriptInterface
    public void setScanAudioEnabled(boolean enabled) {
        handler.post(() -> host.setScanAudioEnabled(enabled));
    }

    @JavascriptInterface
    public void setDialogOpen(boolean open) {
        handler.post(() -> host.setDialogOpen(open));
    }
}
