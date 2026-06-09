import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCfHb_KtiofePMZvt_hgaRE25ZOG_WClKw",
  authDomain: "simplesize-d1171.firebaseapp.com",
  projectId: "simplesize-d1171",
  storageBucket: "simplesize-d1171.firebasestorage.app",
  messagingSenderId: "63100675129",
  appId: "1:63100675129:web:9be22dbddb9cd2f48599e8",
  measurementId: "G-2CLEH2JWCR"
};

/*
 * FIRESTORE RULES (copy to Firebase Console → Firestore → Rules):
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /submissions/{doc} {
 *       allow read: if true;
 *       allow create: if request.resource.data.approved == false
 *                    && request.resource.data.title is string
 *                    && request.resource.data.title.size() < 200;
 *       allow update, delete: if true;  // Admin protected at app level (password gate)
 *     }
 *   }
 * }
 *
 * STORAGE RULES (copy to Firebase Console → Storage → Rules):
 *
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /submissions/{filename} {
 *       allow read: if true;
 *       allow write: if request.resource.size < 5 * 1024 * 1024
 *                   && request.resource.contentType.matches('image/.*');
 *     }
 *   }
 * }
 */

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
