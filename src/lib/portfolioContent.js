const staticContentUrl = "/content/portfolio.json";
const firestoreDocument = ["portfolio", "public"];

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function firebaseIsConfigured() {
  return [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId]
    .every((value) => value && value !== "replace_me");
}

async function loadStaticContent() {
  const response = await fetch(staticContentUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Static portfolio content failed (${response.status})`);
  return response.json();
}

async function loadFirestoreContent() {
  const [{ getApp, getApps, initializeApp }, { doc, getDoc, getFirestore }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore/lite"),
  ]);

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const snapshot = await getDoc(doc(getFirestore(app), ...firestoreDocument));
  if (!snapshot.exists()) return null;

  const payload = snapshot.data()?.content;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Firestore portfolio content has an invalid shape");
  }
  return payload;
}

export async function loadPortfolioContent() {
  if (!firebaseIsConfigured()) return loadStaticContent();

  try {
    const remoteContent = await loadFirestoreContent();
    if (remoteContent) return remoteContent;
  } catch (error) {
    console.warn("Firebase content unavailable; using the bundled portfolio content.", error);
  }

  return loadStaticContent();
}
