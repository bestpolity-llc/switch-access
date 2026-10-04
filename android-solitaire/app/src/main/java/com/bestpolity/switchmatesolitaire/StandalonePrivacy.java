package com.bestpolity.switchmatesolitaire;

import java.util.Locale;

/** Applies regardless of URL flags, analytics preferences, or cached page markup. */
final class StandalonePrivacy {
    private StandalonePrivacy() {}

    static boolean shouldBlock(String host, String path) {
        host = host == null ? "" : host.toLowerCase(Locale.ROOT);
        path = path == null ? "" : path.toLowerCase(Locale.ROOT);
        // Block scripts by path as well as service endpoints; keep fonts and game assets.
        if (path.contains("/firebasejs/") || path.endsWith("/firebase-init.js")
                || path.endsWith("/switchmate-tracker.js")) return true;
        for (String domain : new String[] {"googletagmanager.com", "google-analytics.com",
                "analytics.google.com", "firebaseio.com", "firebaseapp.com",
                "firebasestorage.app", "firestore.googleapis.com",
                "identitytoolkit.googleapis.com", "securetoken.googleapis.com",
                "firebaseinstallations.googleapis.com"}) {
            if (host.equals(domain) || host.endsWith("." + domain)) return true;
        }
        return false;
    }
}
