// Firebase configuration - Idol Domination
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
    apiKey: "AIzaSyDorDmf-jMxAveDP_qbqb2Sxgae-hoPUI0",
    authDomain: "outdoor-game-manager-app.firebaseapp.com",
    projectId: "outdoor-game-manager-app",
    storageBucket: "outdoor-game-manager-app.firebasestorage.app",
    messagingSenderId: "623701119306",
    appId: "1:623701119306:web:5fcbc3444a330aa9d1b1b3",
    measurementId: "G-WTQK1J81R5"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, analytics, auth, db }
