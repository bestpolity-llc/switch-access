package com.bestpolity.switchmatesolitaire;

public class StandalonePrivacyTest {
    public static void main(String[] args) {
        String[] blocked = {
            "https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js",
            "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth-compat.js",
            "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore-compat.js",
            "https://switch.bestpolity.com/firebase-init.js?v=old",
            "https://switch.bestpolity.com/switchmate-tracker.js?v=new",
            "https://www.googletagmanager.com/gtag/js?id=anything",
            "https://region1.google-analytics.com/g/collect",
            "https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel",
            "https://project.firebaseio.com/data.json",
            "https://identitytoolkit.googleapis.com/v1/accounts:lookup"
        };
        String[] allowed = {
            "https://switch.bestpolity.com/games/solitaire.html?app=1",
            "https://switch.bestpolity.com/shared/switch-access.js?v=20261004-1",
            "https://switch.bestpolity.com/shared/profile.js",
            "https://switch.bestpolity.com/shared/switch-access.css",
            "https://fonts.googleapis.com/css2?family=Fredoka",
            "https://fonts.gstatic.com/font.woff2"
        };
        for (String url : blocked) check(url, true);
        for (String url : allowed) check(url, false);
        System.out.println("PASS: native privacy policy blocks services and preserves game assets.");
    }
    private static void check(String url, boolean expected) {
        java.net.URI uri = java.net.URI.create(url);
        if (StandalonePrivacy.shouldBlock(uri.getHost(), uri.getPath()) != expected)
            throw new AssertionError(url);
    }
}
