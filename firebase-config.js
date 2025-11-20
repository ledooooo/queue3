// Firebase Configuration Example
// قم بنسخ هذا الملف إلى firebase-config.js وأضف بياناتك الخاصة

// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAU1VRuWIzg_i6zPQdcI2qlpLKe3RCSWbk",
    authDomain: "queue3-1c986.firebaseapp.com",
    projectId: "queue3-1c986",
    storageBucket: "queue3-1c986.firebasestorage.app",
    messagingSenderId: "607086598036",
    appId: "1:607086598036:web:9da0e4be5db7c62cd82181",
    measurementId: "G-Y02LH633BH"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Database References
const dbRefs = {
    settings: database.ref('settings'),
    clinics: database.ref('clinics'),
    queue: database.ref('queue'),
    display: database.ref('display'),
    audio: database.ref('audio')
};

// Utility Functions
const firebaseUtils = {
    // Get data from Firebase
    async getData(path) {
        try {
            const snapshot = await database.ref(path).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting data:', error);
            return null;
        }
    },

    // Set data in Firebase
    async setData(path, data) {
        try {
            await database.ref(path).set(data);
            return true;
        } catch (error) {
            console.error('Error setting data:', error);
            return false;
        }
    },

    // Update data in Firebase
    async updateData(path, data) {
        try {
            await database.ref(path).update(data);
            return true;
        } catch (error) {
            console.error('Error updating data:', error);
            return false;
        }
    },

    // Listen to real-time changes
    onValueChange(path, callback) {
        return database.ref(path).on('value', (snapshot) => {
            callback(snapshot.val());
        });
    },

    // Remove listener
    offValueChange(path) {
        database.ref(path).off('value');
    }
};

// Initialize Firebase when script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase initialized successfully');
    
    // Test connection
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
            console.log('Connected to Firebase');
        } else {
            console.log('Disconnected from Firebase');
        }
    });
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, database, dbRefs, firebaseUtils };
}
