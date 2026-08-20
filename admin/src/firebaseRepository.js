import bundledContent from "../../public/content/portfolio.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const adminEmail = import.meta.env.VITE_FIREBASE_ADMIN_EMAIL || "dhruvith2004@gmail.com";
export const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:4174";

export function firebaseIsConfigured() {
  return [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId]
    .every((value) => value && value !== "replace_me");
}

async function services() {
  if (!firebaseIsConfigured()) throw new Error("Firebase web configuration is missing");

  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]);
  const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(firebaseConfig);
  return {
    auth: authModule.getAuth(app),
    authModule,
    db: firestoreModule.getFirestore(app),
    firestoreModule,
  };
}

export async function watchCloudSession(callback) {
  const { auth, authModule } = await services();
  return authModule.onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  const { auth, authModule } = await services();
  const provider = new authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await authModule.signInWithPopup(auth, provider);

  if (!result.user.emailVerified || result.user.email !== adminEmail) {
    await authModule.signOut(auth);
    throw new Error(`Use the verified ${adminEmail} Google account.`);
  }
  return result.user;
}

export async function signOutCloud() {
  const { auth, authModule } = await services();
  await authModule.signOut(auth);
}

export async function loadCloudContent() {
  const { db, firestoreModule } = await services();
  const reference = firestoreModule.doc(db, "portfolio", "public");
  const snapshot = await firestoreModule.getDoc(reference);
  if (!snapshot.exists()) return structuredClone(bundledContent);

  const content = snapshot.data()?.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("The Firestore portfolio document is invalid.");
  }
  return content;
}

export async function saveCloudContent(content) {
  const { auth, db, firestoreModule } = await services();
  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.email !== adminEmail) {
    throw new Error("Your Firebase owner session has expired.");
  }

  await firestoreModule.setDoc(firestoreModule.doc(db, "portfolio", "public"), {
    content,
    updatedAt: firestoreModule.serverTimestamp(),
    updatedBy: user.email,
  });
}
