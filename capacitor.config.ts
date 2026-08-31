import type { CapacitorConfig } from "@capacitor/cli";

// This config wraps the live Pouya web app (hosted on Vercel) into an
// installable Android app. The APK is a WebView shell that loads the
// production URL directly — it always reflects the latest deployment,
// no separate mobile build/sync step is ever needed for content updates.
//
// This file is only used by the "Build Pouya APK" GitHub Actions workflow.
// It does not affect the main web app build or the Vercel deployment.
const config: CapacitorConfig = {
  appId: "ir.hossein.pouya",
  appName: "پویا",
  webDir: "android-shell",
  server: {
    url: "https://prairie-pine-drift-earth.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
