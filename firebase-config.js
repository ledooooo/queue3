// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFWC6YJzFi9B-XQbWQejEQOwuiL2G3PC4",
  authDomain: "queue2-5c4eb.firebaseapp.com",
  databaseURL: "https://queue2-5c4eb-default-rtdb.firebaseio.com",
  projectId: "queue2-5c4eb",
  storageBucket: "queue2-5c4eb.firebasestorage.app",
  messagingSenderId: "15303249058",
  appId: "1:15303249058:web:5aa93bf30cf62d6f015bfb",
  measurementId: "G-ZQF0DJH06Q"
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
