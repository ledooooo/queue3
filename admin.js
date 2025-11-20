// Admin Panel JavaScript
let clinics = {};
let settings = {};

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to initialize
    setTimeout(() => {
        initializeAdmin();
    }, 1000);
});

async function initializeAdmin() {
    try {
        console.log('Starting admin panel initialization...');
        
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase library not loaded');
        }
        
        if (typeof database === 'undefined') {
            throw new Error('Firebase database not initialized');
        }
        
        // Initialize audio system
        if (typeof audioSystem !== 'undefined') {
            await audioSystem.initialize();
        } else {
            console.warn('Audio system not available');
        }
        
        // Load settings
        await loadSettings();
        
        // Load clinics
        await loadClinics();
        
        // Update UI
        updateUI();
        
        console.log('Admin panel initialized successfully');
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showNotification('خطأ في تحميل لوحة الإدارة: ' + error.message, 'error');
        
        // Show fallback UI
        showFallbackUI();
    }
}

// Load settings from Firebase
async function loadSettings() {
    try {
        settings = await firebaseUtils.getData('settings') || {};
        
        // Update UI with loaded settings
        document.getElementById('centerName').value = settings.centerName || '';
        document.getElementById('audioSpeed').value = settings.audioSpeed || 1.0;
        document.getElementById('speedValue').textContent = (settings.audioSpeed || 1.0) + 'x';
        document.getElementById('audioType').value = settings.audioType || 'tts';
        document.getElementById('audioPath').value = settings.audioPath || './resources/audio/';
        document.getElementById('mediaPath').value = settings.mediaPath || './resources/media/';
        document.getElementById('newsTicker').value = settings.newsTicker || '';
        
        console.log('Settings loaded:', settings);
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load clinics from Firebase
async function loadClinics() {
    try {
        clinics = await firebaseUtils.getData('clinics') || {};
        
        // Update clinics list
        updateClinicsList();
        
        // Update clinics dropdown
        updateClinicsDropdown();
        
        console.log('Clinics loaded:', clinics);
    } catch (error) {
        console.error('Error loading clinics:', error);
    }
}

// Update clinics list in UI
function updateClinicsList() {
    const clinicsList = document.getElementById('clinicsList');
    const totalClinics = document.getElementById('totalClinics');
    
    if (Object.keys(clinics).length === 0) {
        clinicsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-clinic-medical text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">لا توجد عيادات مضافة بعد</p>
                <button onclick="addClinic()" class="btn-primary mt-4 text-white px-6 py-3 rounded-lg font-semibold">
                    <i class="fas fa-plus ml-2"></i>
                    أضف أول عيادة
                </button>
            </div>
        `;
        totalClinics.textContent = '0';
        return;
    }
    
    clinicsList.innerHTML = Object.entries(clinics).map(([id, clinic]) => `
        <div class="clinic-card bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${clinic.name}</h3>
                    <p class="text-sm text-gray-600">الرقم الحالي: <span class="font-bold text-indigo-600">${clinic.currentNumber || 0}</span></p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editClinic('${id}')" class="text-blue-600 hover:text-blue-800 p-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteClinic('${id}')" class="text-red-600 hover:text-red-800 p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">كلمة المرور:</span>
                    <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">${clinic.password}</span>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="resetClinic('${id}')" class="flex-1 bg-orange-600 text-white py-2 px-3 rounded text-sm hover:bg-orange-700">
                        <i class="fas fa-redo ml-1"></i>
                        تصفير
                    </button>
                    <button onclick="callNext('${id}')" class="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700">
                        <i class="fas fa-bullhorn ml-1"></i>
                        التالي
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    totalClinics.textContent = Object.keys(clinics).length;
}

// Update clinics dropdown
function updateClinicsDropdown() {
    const dropdowns = ['customClinic'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            // Clear existing options except the first one
            while (dropdown.children.length > 1) {
                dropdown.removeChild(dropdown.lastChild);
            }
            
            // Add clinic options
            Object.entries(clinics).forEach(([id, clinic]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = clinic.name;
                dropdown.appendChild(option);
            });
        }
    });
}

// Save settings
async function saveSettings() {
    try {
        const newSettings = {
            centerName: document.getElementById('centerName').value,
            audioSpeed: parseFloat(document.getElementById('audioSpeed').value),
            audioType: document.getElementById('audioType').value,
            audioPath: document.getElementById('audioPath').value,
            mediaPath: document.getElementById('mediaPath').value,
            newsTicker: document.getElementById('newsTicker').value,
            lastUpdated: new Date().toISOString()
        };
        
        await firebaseUtils.setData('settings', newSettings);
        settings = newSettings;
        
        // Update audio system settings
        audioSystem.setAudioType(newSettings.audioType);
        audioSystem.setAudioSpeed(newSettings.audioSpeed);
        
        showNotification('تم حفظ الإعدادات بنجاح', 'success');
        console.log('Settings saved:', newSettings);
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('خطأ في حفظ الإعدادات', 'error');
    }
}

// Audio speed slider handler
document.getElementById('audioSpeed').addEventListener('input', function(e) {
    document.getElementById('speedValue').textContent = e.target.value + 'x';
});

// Add new clinic
function addClinic() {
    document.getElementById('addClinicModal').classList.remove('hidden');
    document.getElementById('newClinicName').focus();
}

// Close add clinic modal
function closeAddClinicModal() {
    document.getElementById('addClinicModal').classList.add('hidden');
    document.getElementById('newClinicName').value = '';
    document.getElementById('newClinicPassword').value = '';
    document.getElementById('newClinicNumber').value = '0';
}

// Save new clinic
async function saveClinic() {
    try {
        const name = document.getElementById('newClinicName').value.trim();
        const password = document.getElementById('newClinicPassword').value.trim();
        const currentNumber = parseInt(document.getElementById('newClinicNumber').value) || 0;
        
        if (!name || !password) {
            showNotification('يرجى إدخال اسم العيادة وكلمة المرور', 'warning');
            return;
        }
        
        const clinicId = 'clinic_' + Date.now();
        const newClinic = {
            name: name,
            password: password,
            currentNumber: currentNumber,
            createdAt: new Date().toISOString()
        };
        
        await firebaseUtils.setData(`clinics/${clinicId}`, newClinic);
        
        // Initialize queue for the clinic
        await firebaseUtils.setData(`queue/${clinicId}`, {
            currentNumber: currentNumber,
            lastCalled: null,
            lastUpdated: new Date().toISOString()
        });
        
        clinics[clinicId] = newClinic;
        updateClinicsList();
        updateClinicsDropdown();
        closeAddClinicModal();
        
        showNotification('تم إضافة العيادة بنجاح', 'success');
        console.log('Clinic added:', newClinic);
    } catch (error) {
        console.error('Error adding clinic:', error);
        showNotification('خطأ في إضافة العيادة', 'error');
    }
}

// Delete clinic
async function deleteClinic(clinicId) {
    if (!confirm('هل أنت متأكد من حذف هذه العيادة؟')) {
        return;
    }
    
    try {
        await firebaseUtils.setData(`clinics/${clinicId}`, null);
        await firebaseUtils.setData(`queue/${clinicId}`, null);
        
        delete clinics[clinicId];
        updateClinicsList();
        updateClinicsDropdown();
        
        showNotification('تم حذف العيادة بنجاح', 'success');
        console.log('Clinic deleted:', clinicId);
    } catch (error) {
        console.error('Error deleting clinic:', error);
        showNotification('خطأ في حذف العيادة', 'error');
    }
}

// Reset clinic (set current number to 0)
async function resetClinic(clinicId) {
    if (!confirm('هل أنت متأكد من تصفير العيادة؟')) {
        return;
    }
    
    try {
        await firebaseUtils.updateData(`clinics/${clinicId}`, { currentNumber: 0 });
        await firebaseUtils.updateData(`queue/${clinicId}`, { currentNumber: 0, lastCalled: null });
        
        clinics[clinicId].currentNumber = 0;
        updateClinicsList();
        
        showNotification('تم تصفير العيادة بنجاح', 'success');
        console.log('Clinic reset:', clinicId);
    } catch (error) {
        console.error('Error resetting clinic:', error);
        showNotification('خطأ في تصفير العيادة', 'error');
    }
}

// Call next number
async function callNext(clinicId) {
    try {
        const clinic = clinics[clinicId];
        const nextNumber = (clinic.currentNumber || 0) + 1;
        
        // Update clinic current number
        await firebaseUtils.updateData(`clinics/${clinicId}`, { currentNumber: nextNumber });
        await firebaseUtils.updateData(`queue/${clinicId}`, { 
            currentNumber: nextNumber, 
            lastCalled: new Date().toISOString() 
        });
        
        // Update display
        await firebaseUtils.setData('display/current', {
            clinicId: clinicId,
            clinicName: clinic.name,
            number: nextNumber,
            timestamp: new Date().toISOString()
        });
        
        // Play announcement
        audioSystem.playQueueAnnouncement(clinic.name, nextNumber);
        
        // Update local data
        clinic.currentNumber = nextNumber;
        updateClinicsList();
        
        showNotification(`تم نداء الرقم ${nextNumber} للعيادة ${clinic.name}`, 'success');
        console.log('Called next number:', { clinic: clinic.name, number: nextNumber });
    } catch (error) {
        console.error('Error calling next number:', error);
        showNotification('خطأ في نداء الرقم التالي', 'error');
    }
}

// Show custom message modal
function showCustomMessage() {
    document.getElementById('customMessageModal').classList.remove('hidden');
    document.getElementById('customMessageText').focus();
}

// Close custom message modal
function closeCustomMessageModal() {
    document.getElementById('customMessageModal').classList.add('hidden');
    document.getElementById('customMessageText').value = '';
}

// Display custom message
async function displayCustomMessage() {
    const message = document.getElementById('customMessageText').value.trim();
    
    if (!message) {
        showNotification('يرجى إدخال الرسالة', 'warning');
        return;
    }
    
    try {
        await firebaseUtils.setData('display/custom', {
            message: message,
            timestamp: new Date().toISOString()
        });
        
        closeCustomMessageModal();
        showNotification('تم عرض الرسالة بنجاح', 'success');
        console.log('Custom message displayed:', message);
    } catch (error) {
        console.error('Error displaying custom message:', error);
        showNotification('خطأ في عرض الرسالة', 'error');
    }
}

// Clear display
async function clearDisplay() {
    try {
        await firebaseUtils.setData('display/current', null);
        await firebaseUtils.setData('display/custom', null);
        
        showNotification('تم مسح الشاشة بنجاح', 'success');
        console.log('Display cleared');
    } catch (error) {
        console.error('Error clearing display:', error);
        showNotification('خطأ في مسح الشاشة', 'error');
    }
}

// Test audio
async function testAudio() {
    try {
        await audioSystem.playQueueAnnouncement('عيادة الاختبار', 1);
        showNotification('تم اختبار الصوت بنجاح', 'success');
    } catch (error) {
        console.error('Error testing audio:', error);
        showNotification('خطأ في اختبار الصوت', 'error');
    }
}

// Stop audio
function stopAudio() {
    audioSystem.stop();
    showNotification('تم إيقاف الصوت', 'success');
}

// Call custom number
async function callCustomNumber() {
    const number = parseInt(document.getElementById('customNumber').value);
    const clinicId = document.getElementById('customClinic').value;
    
    if (!number || !clinicId) {
        showNotification('يرجى إدخال الرقم واختيار العيادة', 'warning');
        return;
    }
    
    const clinic = clinics[clinicId];
    if (!clinic) {
        showNotification('العيادة غير موجودة', 'error');
        return;
    }
    
    try {
        // Update clinic current number
        await firebaseUtils.updateData(`clinics/${clinicId}`, { currentNumber: number });
        await firebaseUtils.updateData(`queue/${clinicId}`, { 
            currentNumber: number, 
            lastCalled: new Date().toISOString() 
        });
        
        // Update display
        await firebaseUtils.setData('display/current', {
            clinicId: clinicId,
            clinicName: clinic.name,
            number: number,
            timestamp: new Date().toISOString()
        });
        
        // Play announcement
        audioSystem.playQueueAnnouncement(clinic.name, number);
        
        // Update local data
        clinic.currentNumber = number;
        updateClinicsList();
        
        // Clear inputs
        document.getElementById('customNumber').value = '';
        document.getElementById('customClinic').value = '';
        
        showNotification(`تم نداء الرقم ${number} للعيادة ${clinic.name}`, 'success');
        console.log('Called custom number:', { clinic: clinic.name, number: number });
    } catch (error) {
        console.error('Error calling custom number:', error);
        showNotification('خطأ في نداء الرقم المخصص', 'error');
    }
}

// Update UI
function updateUI() {
    // Update audio status
    const audioStatus = document.getElementById('audioStatus');
    if (speechSynthesis || audioSystem.audioType === 'mp3') {
        audioStatus.textContent = 'جاهز';
        audioStatus.parentElement.querySelector('.text-purple-600').className = 'text-purple-600 text-xl';
    } else {
        audioStatus.textContent = 'غير متاح';
        audioStatus.parentElement.querySelector('.text-purple-600').className = 'text-red-600 text-xl';
    }
    
    // Calculate total numbers
    const totalNumbers = Object.values(clinics).reduce((sum, clinic) => sum + (clinic.currentNumber || 0), 0);
    document.getElementById('totalNumbers').textContent = totalNumbers;
}

// Show fallback UI when error occurs
function showFallbackUI() {
    const mainContent = document.querySelector('main') || document.body;
    
    const fallbackHTML = `
        <div class="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">خطأ في تحميل النظام</h2>
                <p class="text-gray-600 mb-6">حدث خطأ أثناء تحميل لوحة الإدارة. قد يكون السبب:</p>
                <ul class="text-sm text-gray-500 text-right mb-6">
                    <li>• مشكلة في اتصال الإنترنت</li>
                    <li>• خطأ في إعدادات Firebase</li>
                    <li>• المتصفح لا يدعم JavaScript</li>
                </ul>
                <div class="space-y-3">
                    <button onclick="location.reload()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                        <i class="fas fa-redo ml-2"></i>
                        إعادة المحاولة
                    </button>
                    <button onclick="window.location.href='index.html'" class="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700">
                        <i class="fas fa-home ml-2"></i>
                        العودة للصفحة الرئيسية
                    </button>
                </div>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = fallbackHTML;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set notification style based on type
    const styles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${styles[type] || styles.info}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} ml-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Handle page visibility for real-time updates
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page is visible, reload data
        loadSettings();
        loadClinics();
    }
});

// Listen for real-time updates
firebaseUtils.onValueChange('clinics', (data) => {
    if (data) {
        clinics = data;
        updateClinicsList();
        updateUI();
    }
});

firebaseUtils.onValueChange('settings', (data) => {
    if (data) {
        settings = data;
        // Update UI without overwriting current form values if user is editing
        if (document.activeElement !== document.getElementById('centerName')) {
            document.getElementById('centerName').value = settings.centerName || '';
        }
        if (document.activeElement !== document.getElementById('newsTicker')) {
            document.getElementById('newsTicker').value = settings.newsTicker || '';
        }
        // Update other non-editable fields
        document.getElementById('speedValue').textContent = (settings.audioSpeed || 1.0) + 'x';
    }
});