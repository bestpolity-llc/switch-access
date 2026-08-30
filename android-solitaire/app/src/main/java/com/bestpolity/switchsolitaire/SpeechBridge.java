package com.bestpolity.switchsolitaire;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;

import java.util.Locale;

final class SpeechBridge {

    interface Host {
        boolean isAudioEnabled();
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Host host;

    private TextToSpeech textToSpeech;
    private boolean ready;
    private boolean failed;
    private String pendingText;
    private int utteranceId;

    SpeechBridge(Context context, Host host) {
        this.host = host;
        textToSpeech = new TextToSpeech(
            context.getApplicationContext(),
            status -> handler.post(() -> finishInitialization(status))
        );
    }

    private void finishInitialization(int status) {
        if (status != TextToSpeech.SUCCESS || textToSpeech == null) {
            failed = true;
            ready = false;
            return;
        }

        int languageResult =
            textToSpeech.setLanguage(Locale.getDefault());
        if (unsupported(languageResult)) {
            languageResult = textToSpeech.setLanguage(Locale.US);
        }

        if (unsupported(languageResult)) {
            failed = true;
            ready = false;
            return;
        }

        textToSpeech.setSpeechRate(0.94f);
        textToSpeech.setPitch(1.0f);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            textToSpeech.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(
                        AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY
                    )
                    .setContentType(
                        AudioAttributes.CONTENT_TYPE_SPEECH
                    )
                    .build()
            );
        }

        ready = true;
        failed = false;

        if (pendingText != null) {
            String text = pendingText;
            pendingText = null;
            speakInternal(text, true);
        }
    }

    private boolean unsupported(int result) {
        return result == TextToSpeech.LANG_MISSING_DATA ||
            result == TextToSpeech.LANG_NOT_SUPPORTED;
    }

    @JavascriptInterface
    public boolean speak(String text) {
        return speakInternal(text, true);
    }

    boolean speakUnconditional(String text) {
        return speakInternal(text, false);
    }

    private boolean speakInternal(
        String rawText,
        boolean honorAudioSetting
    ) {
        if (rawText == null || failed) return false;

        String text = rawText.trim();
        if (text.isEmpty()) return false;
        if (text.length() > 5000) {
            text = text.substring(0, 5000);
        }

        final String finalText = text;
        handler.post(() -> {
            if (honorAudioSetting && !host.isAudioEnabled()) {
                return;
            }

            if (!ready || textToSpeech == null) {
                pendingText = finalText;
                return;
            }

            textToSpeech.speak(
                finalText,
                TextToSpeech.QUEUE_FLUSH,
                null,
                "switch-solitaire-" + (++utteranceId)
            );
        });

        return true;
    }

    void pause() {
        if (textToSpeech != null) {
            textToSpeech.stop();
        }
    }

    void destroy() {
        handler.removeCallbacksAndMessages(null);
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
        }
    }
}
