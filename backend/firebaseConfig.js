import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let db = null;

export function initFirebase() {
    try {
        // Check if already initialized
        admin.app();
    } catch (error) {
        // Create credentials from environment variables
        const firebaseConfig = {
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        };
        
        // Initialize Firebase with service account credentials
        const credential = admin.credential.cert(firebaseConfig);
        admin.initializeApp({ credential });
    }
    
    db = admin.firestore();
    return db;
}

export function getDb() {
    if (!db) {
        db = admin.firestore();
    }
    return db;
}

export async function verifyFirebaseToken(token) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.log(`Token verification failed: ${error}`);
        return null;
    }
}

export async function createCustomToken(uid) {
    try {
        const customToken = await admin.auth().createCustomToken(uid);
        return customToken;
    } catch (error) {
        console.log(`Token creation failed: ${error}`);
        return null;
    }
}