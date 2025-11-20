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
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    } else {
        console.error('Firebase library not loaded');
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

const database = typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null;

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
            if (!database) {
                console.error('Database not available');
                return null;
            }
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
            if (!database) {
                console.error('Database not available');
                return false;
            }
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
            if (!database) {
                console.error('Database not available');
                return false;
            }
            await database.ref(path).update(data);
            return true;
        } catch (error) {
            console.error('Error updating data:', error);
            return false;
        }
    },

    // Listen to real-time changes
    onValueChange(path, callback) {
        if (!database) {
            console.error('Database not available');
            return null;
        }
        return database.ref(path).on('value', (snapshot) => {
            callback(snapshot.val());
        });
    },

    // Remove listener
    offValueChange(path) {
        if (!database) {
            console.error('Database not available');
            return;
        }
        database.ref(path).off('value');
    }
};
