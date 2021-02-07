package rabbitgame.net.humphrey;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView web = (WebView)findViewById(R.id.webview);
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
        web.clearCache(true);
        web.loadUrl("https://rabbitgame.net");


    }
}
