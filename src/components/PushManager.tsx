"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";
import { saveSubscriptionId } from "@/actions/push";

export default function PushManager() {
  const oneSignalInit = useRef(false);

  useEffect(() => {
    // 1. Guard to prevent double-fire
    if (oneSignalInit.current) return;
    oneSignalInit.current = true;

    console.log("🚀 PUSH MANAGER STARTING...");

    const runOneSignal = async () => {
      try {
        // 2. Initialize
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
        });
        console.log("✅ OneSignal Initialized!");

        // 3. Prompt the user (Force the slide-down)
        // This makes sure the prompt appears if they haven't answered yet
        await OneSignal.Slidedown.promptPush(); 

        // 4. Check status
        const isOptedIn = OneSignal.User.PushSubscription.optedIn;
        console.log("👀 Current Subscription Status:", isOptedIn);

        if (isOptedIn) {
          const id = OneSignal.User.PushSubscription.id;
          console.log("🆔 Found ID:", id);
          if (id) await saveSubscriptionId(id);
        }

        // 5. Listen for future changes (if they click 'Allow' later)
        OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
          console.log("🔔 Subscription Changed:", event.current.optedIn);
          if (event.current.optedIn) {
            const newId = event.current.id;
            console.log("🆔 New ID:", newId);
            if (newId) await saveSubscriptionId(newId);
          }
        });

      } catch (error) {
        console.error("❌ OneSignal Logic Failed:", error);
      }
    };

    runOneSignal();
  }, []);

  return null;
}