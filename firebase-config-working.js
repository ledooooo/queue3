// Firebase Configuration - Working Version with Error Handling
// قم بتعديل هذا الملف ووضع بياناتك الخاصة

// Firebase Configuration
const firebaseConfig = {
    // استبدل هذه القيم ببيانات مشروعك في Firebase
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Global variables
let database = null;
let firebaseUtils = null;

// Initialize Firebase when script loads
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
        
        // Create database reference
        database = firebase.database();
        
        // Create utility functions
        firebaseUtils = {
            // Get data from Firebase
            async getData(path) {
                try {
                    if (!database) {
                        console.error('❌ Database not available');
                        return null;
                    }
                    const snapshot = await database.ref(path).once('value');
                    return snapshot.val();
                } catch (error) {
                    console.error('❌ Error getting data:', error.message);
                    return null;
                }
            },

            // Set data in Firebase
            async setData(path, data) {
                try {
                    if (!database) {
                        console.error('❌ Database not available');
                        return false;
                    }
                    await database.ref(path).set(data);
                    return true;
                } catch (error) {
                    console.error('❌ Error setting data:', error.message);
                    return false;
                }
            },

            // Update data in Firebase
            async updateData(path, data) {
                try {
                    if (!database) {
                        console.error('❌ Database not available');
                        return false;
                    }
                    await database.ref(path).update(data);
                    return true;
                } catch (error) {
                    console.error('❌ Error updating data:', error.message);
                    return false;
                }
            },

            // Listen to real-time changes
            onValueChange(path, callback) {
                if (!database) {
                    console.error('❌ Database not available');
                    return null;
                }
                return database.ref(path).on('value', (snapshot) => {
                    callback(snapshot.val());
                });
            },

            // Remove listener
            offValueChange(path) {
                if (!database) {
                    console.error('❌ Database not available');
                    return;
                }
                database.ref(path).off('value');
            }
        };
        
        // Test connection
        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                console.log('✅ Connected to Firebase Realtime Database');
            } else {
                console.warn('⚠️ Disconnected from Firebase Realtime Database');
            }
        });
        
    } else {
        console.error('❌ Firebase library not loaded');
        console.error('Make sure you have included Firebase scripts in your HTML');
        console.error('Add this to your HTML head:');
        console.error('<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>');
        console.error('<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js"></script>');
    }
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    console.error('Error details:', error);
}

// Database References (if database is available)
let dbRefs = null;
if (database) {
    dbRefs = {
        settings: database.ref('settings'),
        clinics: database.ref('clinics'),
        queue: database.ref('queue'),
        display: database.ref('display'),
        audio: database.ref('audio')
    };
}

// Check for common issues
console.log('\n=== System Check ===');

// Check if running locally
if (window.location.protocol === 'file:') {
    console.warn('⚠️ Running from file:// protocol');
    console.warn('Some browsers may block Firebase when running locally');
    console.warn('Consider using a local server (e.g., python -m http.server 8000)');
}

// Check internet connection
if (navigator.onLine) {
    console.log('✅ Internet connection detected');
} else {
    console.error('❌ No internet connection');
}

// Check browser compatibility
console.log('User Agent:', navigator.userAgent);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        firebaseConfig, 
        database, 
        dbRefs, 
        firebaseUtils 
    };
}

// Make available globally
window.FirebaseStatus = {
    isLoaded: typeof firebase !== 'undefined',
    isInitialized: typeof database !== 'undefined' && database !== null,
    isConnected: false // Will be updated by connection listener
};

console.log('\n=== Firebase Configuration Test Complete ===');