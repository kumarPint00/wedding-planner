package com.pankajneetu.weddingmanager;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public final class MainActivity extends Activity {
    private static final int PICK_FILES = 124;
    private static final String START_URL = WebUrlPolicy.HOME;

    private WebView webView;
    private WebChromeClient.FileChooserParams activeParams;
    private android.webkit.ValueCallback<Uri[]> chooserCallback;
    private Uri cameraOutputUri;
    private ProgressBar loading;
    private TextView offlineLabel;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setPadding(dp(14),dp(8),dp(10),dp(8));
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setBackgroundColor(Color.rgb(121,30,53));
        TextView title = new TextView(this);
        title.setText("Pankaj & Neetu • Wedding");
        title.setTextColor(Color.WHITE);
        title.setTextSize(16);
        title.setMaxLines(1);
        toolbar.addView(title, new LinearLayout.LayoutParams(0,dp(40),1));
        Button reload = new Button(this);
        reload.setText("↻");
        reload.setContentDescription("Reload the wedding app");
        reload.setTextSize(18);
        reload.setOnClickListener(v -> webView.reload());
        toolbar.addView(reload,new LinearLayout.LayoutParams(dp(55),dp(48)));
        root.addView(toolbar);

        loading = new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        loading.setMax(100);
        root.addView(loading,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,dp(3)));

        offlineLabel = new TextView(this);
        offlineLabel.setText("Connection unavailable. Cached screens may still work; use ↻ to retry.");
        offlineLabel.setTextColor(Color.rgb(120,54,23));
        offlineLabel.setBackgroundColor(Color.rgb(255,242,224));
        offlineLabel.setPadding(dp(12),dp(8),dp(12),dp(8));
        offlineLabel.setVisibility(View.GONE);
        root.addView(offlineLabel);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        root.addView(webView,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1));
        setContentView(root);

        WebSettings options = webView.getSettings();
        options.setJavaScriptEnabled(true);
        options.setDomStorageEnabled(true);
        options.setDatabaseEnabled(true);
        options.setAllowFileAccess(false);
        options.setAllowContentAccess(true);
        options.setJavaScriptCanOpenWindowsAutomatically(false);
        options.setSupportMultipleWindows(false);
        options.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        options.setCacheMode(WebSettings.LOAD_DEFAULT);
        options.setMediaPlaybackRequiresUserGesture(true);
        options.setBuiltInZoomControls(false);
        options.setDisplayZoomControls(false);
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri uri=request.getUrl();
                String address=uri.toString();
                if (WebUrlPolicy.staysInApp(address)) return false;
                if (WebUrlPolicy.externalWebLink(address)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); }
                    catch (ActivityNotFoundException err) {
                        Toast.makeText(MainActivity.this,"No browser available",Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError err) {
                if (request.isForMainFrame()) offlineLabel.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view,String url) {
                if (WebUrlPolicy.staysInApp(url)) offlineLabel.setVisibility(View.GONE);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view,int value) {
                loading.setProgress(value);
                loading.setVisibility(value==100?View.GONE:View.VISIBLE);
            }

            @Override public boolean onShowFileChooser(WebView view,
                android.webkit.ValueCallback<Uri[]> callback, FileChooserParams parameters) {
                cancelChooser();
                chooserCallback=callback;
                activeParams=parameters;
                return openChooser(parameters);
            }
        });
        webView.setDownloadListener((address, userAgent, disposition, mime, size) -> {
            if (!WebUrlPolicy.externalWebLink(address)) {
                Toast.makeText(this,"Use Full Evidence Backup in your browser for large offline exports.",Toast.LENGTH_LONG).show();
                return;
            }
            try {
                String name = android.webkit.URLUtil.guessFileName(address,disposition,mime);
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(address));
                request.addRequestHeader("Cookie",CookieManager.getInstance().getCookie(address));
                request.setTitle(name);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,name);
                ((DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);
                Toast.makeText(this,"Downloading "+name,Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this,"Download failed: "+e.getMessage(),Toast.LENGTH_LONG).show();
            }
        });

        if (savedInstanceState!=null && webView.restoreState(savedInstanceState)!=null) return;
        webView.loadUrl(START_URL);
    }

    private int dp(int pixels) {
        return Math.round(pixels*getResources().getDisplayMetrics().density);
    }

    private boolean openChooser(WebChromeClient.FileChooserParams params) {
        Intent browse = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        browse.addCategory(Intent.CATEGORY_OPENABLE);
        browse.setType("*/*");
        browse.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        browse.putExtra(Intent.EXTRA_MIME_TYPES,
            new String[]{"image/*","application/pdf","application/json","text/plain"});
        browse.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
            params.getMode()==WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE);

        List<Intent> extra = new ArrayList<>();
        boolean acceptsImage=false;
        for (String type : params.getAcceptTypes()) {
            if (type.contains("image") || type.contains(".jpg") || type.contains(".png")) acceptsImage=true;
        }
        if (acceptsImage) {
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME,"wedding_"+System.currentTimeMillis()+".jpg");
                values.put(MediaStore.Images.Media.MIME_TYPE,"image/jpeg");
                cameraOutputUri=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);
                if (cameraOutputUri!=null) {
                    Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    camera.putExtra(MediaStore.EXTRA_OUTPUT,cameraOutputUri);
                    camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    if (camera.resolveActivity(getPackageManager())!=null) extra.add(camera);
                }
            } catch (Exception e) {
                cameraOutputUri=null;
            }
        }
        try {
            Intent chooser=Intent.createChooser(browse,"Select wedding photos or files");
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS,extra.toArray(new Intent[0]));
            startActivityForResult(chooser,PICK_FILES);
            return true;
        } catch (Exception error) {
            cancelChooser();
            Toast.makeText(this,"File selection is unavailable.",Toast.LENGTH_LONG).show();
            return false;
        }
    }

    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request!=PICK_FILES)return;
        Uri[] selections=null;
        if(result==RESULT_OK) {
            if(data!=null && data.getClipData()!=null) {
                ClipData clip=data.getClipData();
                selections=new Uri[clip.getItemCount()];
                for(int i=0;i<clip.getItemCount();i++)selections[i]=clip.getItemAt(i).getUri();
            } else if(data!=null && data.getData()!=null) {
                selections=new Uri[]{data.getData()};
            } else if(cameraOutputUri!=null) {
                selections=new Uri[]{cameraOutputUri};
            }
        }
        if(chooserCallback!=null)chooserCallback.onReceiveValue(selections);
        chooserCallback=null;activeParams=null;
        if(result!=RESULT_OK && cameraOutputUri!=null) {
            try{getContentResolver().delete(cameraOutputUri,null,null);}catch(Exception ignored){}
        }
        cameraOutputUri=null;
    }

    private void cancelChooser() {
        if(chooserCallback!=null)chooserCallback.onReceiveValue(null);
        chooserCallback=null;
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        webView.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override public void onBackPressed() {
        if(webView!=null && webView.canGoBack())webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        cancelChooser();
        if(webView!=null){webView.destroy();webView=null;}
        super.onDestroy();
    }
}
