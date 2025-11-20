// Firebase Configuration Test
// هذا الملف للمساعدة في اكتشاف الأخطاء واختبار الاتصال

console.log('=== Firebase Configuration Test ===');

// Test 1: Check if Firebase is loaded
try {
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase library loaded successfully');
    } else {
        console.error('❌ Firebase library not found');
        console.error('Make sure you have included Firebase scripts in your HTML');
    }
} catch (error) {
    console.error('❌ Error checking Firebase:', error.message);
}

// Test 2: Check firebaseConfig
try {
    if (typeof firebaseConfig !== 'undefined') {
        console.log('✅ firebaseConfig is defined');
        
        // Check required fields
        const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
        let missingFields = [];
        
        requiredFields.forEach(field => {
            if (!firebaseConfig[field] || firebaseConfig[field].includes('YOUR_')) {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length === 0) {
            console.log('✅ All required fields are configured');
        } else {
            console.error('❌ Missing or invalid fields:', missingFields);
            console.error('Please update firebase-config.js with your Firebase project details');
        }
    } else {
        console.error('❌ firebaseConfig is not defined');
    }
} catch (error) {
    console.error('❌ Error checking firebaseConfig:', error.message);
}

// Test 3: Check database connection
try {
    if (typeof database !== 'undefined' && database !== null) {
        console.log('✅ Database reference created successfully');
        
        // Test connection
        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                console.log('✅ Connected to Firebase Realtime Database');
            } else {
                console.warn('⚠️ Disconnected from Firebase Realtime Database');
            }
        });
    } else {
        console.error('❌ Database reference not created');
        console.error('This might be due to incorrect firebaseConfig or Firebase not being initialized');
    }
} catch (error) {
    console.error('❌ Error checking database:', error.message);
}

// Test 4: Check firebaseUtils
try {
    if (typeof firebaseUtils !== 'undefined') {
        console.log('✅ firebaseUtils is defined');
        
        // Test getData function
        console.log('Testing firebaseUtils.getData...');
        firebaseUtils.getData('settings').then(result => {
            if (result !== null) {
                console.log('✅ Successfully retrieved data from Firebase');
                console.log('Settings:', result);
            } else {
                console.warn('⚠️ Could not retrieve data (this might be normal if no data exists)');
            }
        }).catch(error => {
            console.error('❌ Error retrieving data:', error.message);
        });
    } else {
        console.error('❌ firebaseUtils is not defined');
    }
} catch (error) {
    console.error('❌ Error checking firebaseUtils:', error.message);
}

// Test 5: Check for common issues
console.log('\n=== Common Issues Check ===');

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
const userAgent = navigator.userAgent;
console.log('User Agent:', userAgent);

// Check for CORS issues (if applicable)
if (window.location.origin.includes('github.io')) {
    console.log('✅ Running on GitHub Pages (CORS should be configured)');
} else {
    console.log('ℹ️ Not running on GitHub Pages');
}

console.log('\n=== Test Complete ===');

// Function to show Firebase status
function showFirebaseStatus() {
    const status = {
        firebaseLoaded: typeof firebase !== 'undefined',
        configDefined: typeof firebaseConfig !== 'undefined',
        databaseAvailable: typeof database !== 'undefined' && database !== null,
        utilsAvailable: typeof firebaseUtils !== 'undefined',
        online: navigator.onLine
    };
    
    console.log('Firebase Status:', status);
    
    // Show visual status if on admin page
    if (window.location.pathname.includes('admin.html')) {
        let statusHTML = '<div class="fixed top-20 left-4 bg-white p-4 rounded-lg shadow-lg z-50 text-sm">';
        statusHTML += '<h3 class="font-bold mb-2">Firebase Status:</h3>';
        
        Object.entries(status).forEach(([key, value]) => {
            const icon = value ? '✅' : '❌';
            statusHTML += `<div>${icon} ${key}</div>`;
        });
        
        statusHTML += '<button onclick="this.parentElement.remove()" class="mt-2 text-xs text-red-600">إغلاق</button>';
        statusHTML += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', statusHTML);
    }
}

// Run status check after a delay
setTimeout(showFirebaseStatus, 3000);