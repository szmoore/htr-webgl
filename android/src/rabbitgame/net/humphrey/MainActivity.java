package rabbitgame.net.humphrey;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;
import android.webkit.ConsoleMessage;

public class MainActivity extends Activity {

    protected WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        this.web = (WebView)findViewById(R.id.webview);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                android.util.Log.d("HumphreyTheRabbit", consoleMessage.message());
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return false;
            }
        });
        web.clearCache(true);
        web.loadUrl("https://rabbitgame.net");
    }

    protected void evaluateJavascript(String code) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            web.evaluateJavascript(code, null);
        } else {
            web.loadUrl("javascript:"+code);
        }
    }

    @Override
    protected void onPause() {
        evaluateJavascript("g_game.Pause();");
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        evaluateJavascript("g_game.Resume();");
    }
}
