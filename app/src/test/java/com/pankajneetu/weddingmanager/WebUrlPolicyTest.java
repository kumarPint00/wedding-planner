package com.pankajneetu.weddingmanager;

import org.junit.Test;
import static org.junit.Assert.*;

public class WebUrlPolicyTest {
    @Test public void keepsOnlyWeddingOrigin() {
        assertTrue(WebUrlPolicy.staysInApp("https://pankaj-wedding-roadtrip-checklist.vercel.app/settings.html"));
        assertTrue(WebUrlPolicy.staysInApp("https://pankaj-wedding-roadtrip-checklist.vercel.app/travel.html#train"));
        assertFalse(WebUrlPolicy.staysInApp("https://evil.example.com/"));
        assertFalse(WebUrlPolicy.staysInApp("https://pankaj-wedding-roadtrip-checklist.vercel.app.evil.com/"));
        assertFalse(WebUrlPolicy.staysInApp("http://pankaj-wedding-roadtrip-checklist.vercel.app/"));
        assertFalse(WebUrlPolicy.staysInApp("javascript:alert(1)"));
    }
    @Test public void filtersExternalSchemes() {
        assertTrue(WebUrlPolicy.externalWebLink("https://supabase.com/dashboard"));
        assertFalse(WebUrlPolicy.externalWebLink("javascript:alert(1)"));
        assertFalse(WebUrlPolicy.externalWebLink("file:///storage/emulated/0/foo"));
        assertFalse(WebUrlPolicy.externalWebLink("intent://some-app"));
    }
}
