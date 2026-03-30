import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

class AuthService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.provider = null;
        this.user = null;
        this.initialized = false;
    }

    async init(config = firebaseConfig) {
        if (this.initialized) return;

        try {
            this.app = initializeApp(config);
            this.auth = getAuth(this.app);
            this.provider = new GoogleAuthProvider();
            this.initialized = true;

            onAuthStateChanged(this.auth, (user) => {
                this.user = user;
                console.info('AuthService: Auth state changed', user ? user.uid : 'Logged out');
                // Dispatch custom event for the app to react
                const event = new CustomEvent('auth-state-changed', { detail: { user } });
                window.dispatchEvent(event);
            });
        } catch (error) {
            console.error('AuthService: Initialization failed', error);
        }
    }

    async signInWithGoogle() {
        if (!this.initialized) await this.init();
        try {
            const result = await signInWithPopup(this.auth, this.provider);
            this.user = result.user;
            return this.user;
        } catch (error) {
            console.error('AuthService: Error during sign in', error);
            throw error;
        }
    }

    async logout() {
        if (!this.initialized) return;
        try {
            await signOut(this.auth);
            this.user = null;
        } catch (error) {
            console.error('AuthService: Error during logout', error);
            throw error;
        }
    }

    getCurrentUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.user;
    }
}

export const authService = new AuthService();
