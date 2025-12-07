// 'use client';

// import { useEffect, useRef } from 'react';
// import OneSignal from 'react-onesignal';
// import { saveSubscriptionId } from '@/actions/push';

// export default function PushManager() {
//   const initialized = useRef(false);

//   useEffect(() => {
//     const initializeOneSignal = async () => {
//       try {
//         // Check if already initialized by checking if User exists
//         if (!OneSignal.User) {
//           await OneSignal.init({
//             appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
//             allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
//           });
//         }

//         // Check if user is subscribed
//         if (OneSignal.User?.PushSubscription?.optedIn) {
//           const subscriptionId = OneSignal.User.PushSubscription.id;
//           if (subscriptionId) {
//             await saveSubscriptionId(subscriptionId);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to initialize OneSignal:', error);
//         // Silently fail to prevent app crashes
//       }
//     };

//     initializeOneSignal();
//   }, []);

//   return null; // This component doesn't render anything
// }

"use client";
import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export default function PushManager() {
  const oneSignalInit = useRef(false);

  useEffect(() => {
    // --- ADD THIS LOG ---
    console.log("🚀 PUSH MANAGER IS TRYING TO START..."); 
    
    if (oneSignalInit.current) return;
    oneSignalInit.current = true;
    
    // ... rest of your code ...
  }, []);

  return null;
}