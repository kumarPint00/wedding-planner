package com.pankajneetu.weddingmanager;

import java.net.URI;
import java.util.Locale;

public final class WebUrlPolicy {
    public static final String HOME = "https://pankaj-wedding-roadtrip-checklist.vercel.app/";
    public static final String HOST = "pankaj-wedding-roadtrip-checklist.vercel.app";

    private WebUrlPolicy() { }

    /** Main-frame navigation is restricted to the wedding site. External HTTPS links use Android. */
    public static boolean staysInApp(String uri) {
        if (uri == null) return false;
        try {
            URI url = new URI(uri);
            return "https".equalsIgnoreCase(url.getScheme()) &&
                HOST.equalsIgnoreCase(url.getHost());
        } catch (Exception ignored) {
            return false;
        }
    }

    public static boolean externalWebLink(String uri) {
        if (uri == null) return false;
        try {
            URI url = new URI(uri);
            String scheme = url.getScheme();
            return "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme);
        } catch (Exception ignored) {
            return false;
        }
    }
}
