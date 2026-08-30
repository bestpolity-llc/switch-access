package com.bestpolity.switchsolitaire;

import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Adds the clearly labelled app controls without changing the underlying
 * Solitaire activity and switch behavior.
 */
public class SolitaireActivity extends MainActivity {

    private static final String HELP_TAG =
        "switch-solitaire-native-help";
    private static final String HINT_TAG =
        "switch-solitaire-mode-hint";

    private int toolbarAttempts;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().post(this::decorateToolbarWhenReady);
    }

    private void decorateToolbarWhenReady() {
        if (decorateToolbar()) return;
        if (toolbarAttempts++ < 8) {
            getWindow().getDecorView().postDelayed(
                this::decorateToolbarWhenReady,
                125L
            );
        }
    }

    private boolean decorateToolbar() {
        TextView modeButton = findModeButton(
            getWindow().getDecorView()
        );
        if (modeButton == null ||
            !(modeButton.getParent() instanceof LinearLayout)) {
            return false;
        }

        LinearLayout toolbar = (LinearLayout) modeButton.getParent();

        modeButton.setText("⚡ Switch Mode");
        modeButton.setTextSize(15f);
        modeButton.setSingleLine(true);
        modeButton.setGravity(Gravity.CENTER);
        modeButton.setPadding(dp(12), 0, dp(12), 0);

        ViewGroup.LayoutParams current = modeButton.getLayoutParams();
        current.width = dp(160);
        current.height = dp(44);
        modeButton.setLayoutParams(current);

        TextView hint = findTaggedTextView(toolbar, HINT_TAG);
        if (hint == null) {
            hint = new TextView(this);
            hint.setTag(HINT_TAG);
            hint.setText("tap 4 times to change switch mode");
            hint.setTextColor(0xFFDDDDDD);
            hint.setTextSize(10f);
            hint.setSingleLine(true);
            hint.setGravity(Gravity.CENTER_VERTICAL);
            hint.setPadding(dp(7), 0, dp(7), 0);
            hint.setContentDescription(
                "Tap Switch Mode four times to change switch mode."
            );

            LinearLayout.LayoutParams hintParams =
                new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    dp(44)
                );
            hintParams.setMargins(dp(1), 0, dp(2), 0);
            toolbar.addView(hint, 1, hintParams);
        }

        if (findTaggedChild(toolbar, HELP_TAG) != null) {
            toolbar.requestLayout();
            toolbar.bringToFront();
            return true;
        }

        TextView helpButton = new TextView(this);
        helpButton.setTag(HELP_TAG);
        helpButton.setText("?");
        helpButton.setTextColor(modeButton.getCurrentTextColor());
        helpButton.setTextSize(20f);
        helpButton.setTypeface(modeButton.getTypeface());
        helpButton.setGravity(Gravity.CENTER);
        helpButton.setClickable(true);
        helpButton.setFocusable(true);
        helpButton.setContentDescription(
            "Help and support. Open game instructions and contact options."
        );

        Drawable background = modeButton.getBackground();
        if (background != null) {
            Drawable.ConstantState state = background.getConstantState();
            helpButton.setBackground(
                state == null
                    ? background.mutate()
                    : state.newDrawable(getResources()).mutate()
            );
        }
        helpButton.setElevation(modeButton.getElevation());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            helpButton.setTooltipText("Help and support");
        }

        LinearLayout.LayoutParams helpParams =
            new LinearLayout.LayoutParams(dp(44), dp(44));
        helpParams.setMargins(dp(3), 0, dp(3), 0);
        toolbar.addView(helpButton, helpParams);

        helpButton.setOnClickListener(view -> {
            view.performHapticFeedback(
                HapticFeedbackConstants.KEYBOARD_TAP
            );
            WebView webView = findWebView(
                getWindow().getDecorView()
            );
            if (webView != null) {
                openHelp(webView);
                webView.postDelayed(() -> openHelp(webView), 250L);
                webView.requestFocus(View.FOCUS_DOWN);
            }
        });

        toolbar.requestLayout();
        toolbar.bringToFront();
        return true;
    }

    private void openHelp(WebView webView) {
        webView.evaluateJavascript(
            "(function(){" +
                "if(window.SwitchSolitaireApp&&" +
                   "typeof window.SwitchSolitaireApp.openHelp==='function'){" +
                    "window.SwitchSolitaireApp.openHelp();return true;" +
                "}" +
                "var button=document.getElementById('standaloneHelpButton');" +
                "if(button){button.click();return true;}" +
                "return false;" +
            "})();",
            null
        );
    }

    private TextView findModeButton(View view) {
        if (view instanceof TextView) {
            TextView textView = (TextView) view;
            String text = String.valueOf(textView.getText());
            if ("⚡".equals(text) ||
                text.startsWith("⚡ Switch Mode")) {
                return textView;
            }
        }

        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int index = 0; index < group.getChildCount(); index++) {
                TextView found = findModeButton(group.getChildAt(index));
                if (found != null) return found;
            }
        }
        return null;
    }

    private View findTaggedChild(ViewGroup group, String tag) {
        for (int index = 0; index < group.getChildCount(); index++) {
            View child = group.getChildAt(index);
            if (tag.equals(child.getTag())) return child;
        }
        return null;
    }

    private TextView findTaggedTextView(ViewGroup group, String tag) {
        View found = findTaggedChild(group, tag);
        return found instanceof TextView ? (TextView) found : null;
    }

    private WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int index = 0; index < group.getChildCount(); index++) {
                WebView found = findWebView(group.getChildAt(index));
                if (found != null) return found;
            }
        }
        return null;
    }

    private int dp(int value) {
        return Math.round(
            value * getResources().getDisplayMetrics().density
        );
    }
}
