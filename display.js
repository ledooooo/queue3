// Display Screen JavaScript
let clinics = {};
let settings = {};
let currentDisplay = null;
let customMessage = null;

// Initialize display
document.addEventListener('DOMContentLoaded', function() {
    initializeDisplay();
});

async function initializeDisplay() {
    try {
        // Initialize audio system
        await audioSystem.initialize();
        
        // Load initial data
        await loadSettings();
        await loadClinics();
        
        // Setup real-time listeners
        setupRealTimeListeners();
        
        // Initialize UI
        initializeUI();
        
        // Start clock
        updateClock();
        setInterval(updateClock, 1000);
        
        console.log('Display initialized successfully');
    } catch (error) {
        console.error('Error initializing display:', error);
    }
}

// Load settings
async function loadSettings() {
    try {
        settings = await firebaseUtils.getData('settings') || {};
        
        // Update UI
        if (settings.centerName) {
            document.getElementById('centerName').textContent = settings.centerName;
        }
        
        if (settings.newsTicker) {
            document.getElementById('newsTickerText').textContent = settings.newsTicker;
        }
        
        // Update audio system settings
        if (settings.audioType) {
            audioSystem.setAudioType(settings.audioType);
        }
        if (settings.audioSpeed) {
            audioSystem.setAudioSpeed(settings.audioSpeed);
        }
        
        console.log('Settings loaded:', settings);
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load clinics
async function loadClinics() {
    try {
        clinics = await firebaseUtils.getData('clinics') || {};
        updateClinicsDisplay();
        console.log('Clinics loaded:', clinics);
    } catch (error) {
        console.error('Error loading clinics:', error);
    }
}

// Update clinics display
function updateClinicsDisplay() {
    const container = document.getElementById('clinicsContainer');
    const totalClinics = document.getElementById('totalClinics');
    
    if (Object.keys(clinics).length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-clinic-medical text-6xl text-gray-500 mb-4"></i>
                <p class="text-gray-400 text-lg">لا توجد عيادات نشطة حالياً</p>
            </div>
        `;
        totalClinics.textContent = '0';
        return;
    }
    
    container.innerHTML = Object.entries(clinics).map(([id, clinic]) => `
        <div id="clinic-${id}" class="clinic-card rounded-xl p-4 shadow-lg">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-bold text-gray-800">${clinic.name}</h3>
                <div class="w-3 h-3 bg-green-400 rounded-full pulse-ring"></div>
            </div>
            
            <div class="text-center">
                <div class="text-sm text-gray-600 mb-2">الرقم الحالي</div>
                <div class="number-display text-4xl text-indigo-600 mb-2">${clinic.currentNumber || 0}</div>
                <div class="text-xs text-gray-500">آخر تحديث: ${formatTime(clinic.lastUpdated)}</div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-gray-200">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">الحالة:</span>
                    <span class="text-green-600 font-semibold">نشط</span>
                </div>
            </div>
        </div>
    `).join('');
    
    totalClinics.textContent = Object.keys(clinics).length;
}

// Highlight clinic when called
function highlightClinic(clinicId, number) {
    const clinicCard = document.getElementById(`clinic-${clinicId}`);
    if (clinicCard) {
        clinicCard.classList.add('highlight');
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
            clinicCard.classList.remove('highlight');
        }, 5000);
        
        // Update current call display
        const clinic = clinics[clinicId];
        if (clinic) {
            document.getElementById('currentCallText').textContent = `عيادة ${clinic.name} - الرقم ${number}`;
            document.getElementById('currentCallTime').textContent = new Date().toLocaleLocaleString('ar-SA');
            document.getElementById('currentCallDisplay').classList.remove('hidden');
            
            // Hide after 10 seconds
            setTimeout(() => {
                document.getElementById('currentCallDisplay').classList.add('hidden');
            }, 10000);
        }
    }
}

// Setup real-time listeners
function setupRealTimeListeners() {
    // Listen for clinic changes
    firebaseUtils.onValueChange('clinics', (data) => {
        if (data) {
            clinics = data;
            updateClinicsDisplay();
        }
    });
    
    // Listen for settings changes
    firebaseUtils.onValueChange('settings', (data) => {
        if (data) {
            settings = data;
            loadSettings();
        }
    });
    
    // Listen for display changes
    firebaseUtils.onValueChange('display/current', (data) => {
        if (data) {
            currentDisplay = data;
            handleCurrentDisplay(data);
        }
    });
    
    // Listen for custom messages
    firebaseUtils.onValueChange('display/custom', (data) => {
        if (data) {
            customMessage = data;
            handleCustomMessage(data);
        }
    });
}

// Handle current display updates
function handleCurrentDisplay(data) {
    const { clinicId, clinicName, number, timestamp } = data;
    
    // Highlight the clinic
    highlightClinic(clinicId, number);
    
    // Update clinic card with new number
    const clinicCard = document.getElementById(`clinic-${clinicId}`);
    if (clinicCard) {
        const numberElement = clinicCard.querySelector('.number-display');
        if (numberElement) {
            numberElement.textContent = number;
            numberElement.classList.add('fade-in');
            
            // Remove animation class
            setTimeout(() => {
                numberElement.classList.remove('fade-in');
            }, 500);
        }
    }
    
    // Update last update time
    document.getElementById('lastUpdate').textContent = 'الآن';
    
    console.log('Current display updated:', data);
}

// Handle custom message display
function handleCustomMessage(data) {
    const { message, timestamp } = data;
    
    // Show custom message modal
    const modal = document.getElementById('customDisplayModal');
    const content = document.getElementById('customMessageContent');
    const time = document.getElementById('customMessageTime');
    
    content.textContent = message;
    time.textContent = new Date(timestamp).toLocaleString('ar-SA');
    
    modal.classList.remove('hidden');
    
    // Auto-hide after 15 seconds
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 15000);
    
    console.log('Custom message displayed:', message);
}

// Initialize UI
function initializeUI() {
    // Generate QR code
    generateQRCode();
    
    // Load media content
    loadMediaContent();
    
    // Update date
    updateDate();
}

// Generate QR code
function generateQRCode() {
    try {
        const currentUrl = window.location.origin + window.location.pathname.replace('display.html', '');
        const qrcodeElement = document.getElementById('qrcode');
        
        QRCode.toCanvas(qrcodeElement, currentUrl, {
            width: 80,
            margin: 1,
            color: {
                dark: '#1e3c72',
                light: '#ffffff'
            }
        });
        
        console.log('QR code generated for:', currentUrl);
    } catch (error) {
        console.error('Error generating QR code:', error);
        // Fallback: show URL text
        document.getElementById('qrcode').innerHTML = `
            <div class="w-full h-full flex items-center justify-center text-xs text-center p-1">
                رابط الصفحة
            </div>
        `;
    }
}

// Load media content
function loadMediaContent() {
    const mediaContent = document.getElementById('mediaContent');
    
    // For now, show a placeholder
    // In a real implementation, you would load actual media files
    mediaContent.innerHTML = `
        <div class="text-center">
            <div class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-12 mb-6">
                <i class="fas fa-heartbeat text-8xl text-white mb-4"></i>
                <h3 class="text-3xl font-bold text-white mb-2">مرحباً بكم</h3>
                <p class="text-xl text-blue-100">في مركزنا الطبي</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-8">
                <div class="bg-white bg-opacity-20 rounded-lg p-4">
                    <i class="fas fa-user-md text-4xl text-green-400 mb-2"></i>
                    <p class="text-lg font-semibold">أفضل الأطباء</p>
                </div>
                <div class="bg-white bg-opacity-20 rounded-lg p-4">
                    <i class="fas fa-stethoscope text-4xl text-blue-400 mb-2"></i>
                    <p class="text-lg font-semibold">أحدث التجهيزات</p>
                </div>
            </div>
        </div>
    `;
}

// Update clock
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('currentTime').textContent = timeString;
}

// Update date
function updateDate() {
    const now = new Date();
    const dateString = now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('currentDate').textContent = dateString;
}

// Format time for display
function formatTime(timestamp) {
    if (!timestamp) return 'غير محدث';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If less than 1 minute, show "الآن"
    if (diff < 60000) {
        return 'الآن';
    }
    
    // If less than 1 hour, show minutes
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `منذ ${minutes} دقيقة`;
    }
    
    // Otherwise, show time
    return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // F11 for fullscreen
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
    
    // Escape to exit fullscreen
    if (e.key === 'Escape') {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
    
    // F5 to refresh
    if (e.key === 'F5') {
        e.preventDefault();
        location.reload();
    }
});

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Display hidden - pausing updates');
    } else {
        console.log('Display visible - resuming updates');
        // Refresh data when page becomes visible
        loadSettings();
        loadClinics();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    // Regenerate QR code on resize to ensure it fits properly
    setTimeout(generateQRCode, 100);
});

// Auto-refresh every 5 minutes
setInterval(() => {
    if (!document.hidden) {
        console.log('Auto-refreshing display data...');
        loadSettings();
        loadClinics();
    }
}, 300000); // 5 minutes

// Error handling
window.addEventListener('error', function(e) {
    console.error('Display error:', e.error);
});

// Network status handling
window.addEventListener('online', function() {
    console.log('Network connected - resuming real-time updates');
    setupRealTimeListeners();
    loadSettings();
    loadClinics();
});

window.addEventListener('offline', function() {
    console.log('Network disconnected - showing offline message');
    // You could show an offline indicator here
});