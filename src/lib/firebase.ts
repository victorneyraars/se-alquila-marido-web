import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 1. Iniciar sesión con redirect
export async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

// 2. Obtener resultado al volver del redirect
export async function getGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return await result.user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('[FIREBASE] Error en redirect:', error);
    return null;
  }
}
