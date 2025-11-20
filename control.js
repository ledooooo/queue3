// Control Panel JavaScript
let clinics = {};
let currentClinic = null;
let currentNumber = 0;
let actionHistory = [];

// Initialize control panel
document.addEventListener('DOMContentLoaded', function() {
    initializeControl();
});

async function initializeControl() {
    try {
        // Load clinics for login
        await loadClinicsForLogin();
        
        // Setup real-time listeners
        setupRealTimeListeners();
        
        // Start clock
        updateClock();
        setInterval(updateClock, 1000);
        
        console.log('Control panel initialized successfully');
    } catch (error) {
        console.error('Error initializing control panel:', error);
    }
}

// Load clinics for login dropdown
async function loadClinicsForLogin() {
    try {
        clinics = await firebaseUtils.getData('clinics') || {};
        
        const clinicSelect = document.getElementById('clinicSelect');
        clinicSelect.innerHTML = '<option value="">-- اختر العيادة --</option>';
        
        Object.entries(clinics).forEach(([id, clinic]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = clinic.name;
            clinicSelect.appendChild(option);
        });
        
        console.log('Clinics loaded for login:', Object.keys(clinics).length);
    } catch (error) {
        console.error('Error loading clinics for login:', error);
    }
}

// Setup real-time listeners
function setupRealTimeListeners() {
    // Listen for clinic changes
    firebaseUtils.onValueChange('clinics', (data) => {
        if (data) {
            clinics = data;
            
            // Update current clinic if logged in
            if (currentClinic && clinics[currentClinic.id]) {
                currentClinic = clinics[currentClinic.id];
                currentNumber = currentClinic.currentNumber || 0;
                updateCurrentNumber();
            }
        }
    });
}

// Login function
async function login() {
    const clinicId = document.getElementById('clinicSelect').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!clinicId || !password) {
        showLoginError('يرجى اختيار العيادة وإدخال كلمة المرور');
        return;
    }
    
    const clinic = clinics[clinicId];
    if (!clinic) {
        showLoginError('العيادة غير موجودة');
        return;
    }
    
    if (clinic.password !== password) {
        showLoginError('كلمة المرور غير صحيحة');
        shakeLoginForm();
        return;
    }
    
    // Successful login
    currentClinic = clinic;
    currentClinic.id = clinicId;
    currentNumber = clinic.currentNumber || 0;
    
    showControlPanel();
    addToHistory('تسجيل دخول', `العيادة: ${clinic.name}`);
    
    console.log('Login successful:', clinic.name);
}

// Show login error
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

// Shake login form
function shakeLoginForm() {
    const loginSection = document.getElementById('loginSection');
    loginSection.classList.add('shake');
    
    setTimeout(() => {
        loginSection.classList.remove('shake');
    }, 500);
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// Show control panel
function showControlPanel() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('controlSection').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('currentClinicInfo').classList.remove('hidden');
    
    // Update clinic info
    document.getElementById('currentClinicName').textContent = currentClinic.name;
    
    // Update current number
    updateCurrentNumber();
    
    // Add success animation
    const controlSection = document.getElementById('controlSection');
    controlSection.classList.add('success-animation');
    
    setTimeout(() => {
        controlSection.classList.remove('success-animation');
    }, 600);
}

// Update current number display
function updateCurrentNumber() {
    const currentNumberElement = document.getElementById('currentNumber');
    const currentNumberValue = currentNumberElement.textContent;
    
    if (currentNumberValue !== currentNumber.toString()) {
        currentNumberElement.textContent = currentNumber;
        
        // Add animation
        currentNumberElement.classList.add('success-animation');
        setTimeout(() => {
            currentNumberElement.classList.remove('success-animation');
        }, 600);
    }
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

// Next patient
async function nextPatient() {
    if (!currentClinic) return;
    
    const newNumber = currentNumber + 1;
    
    try {
        // Update clinic number
        await firebaseUtils.updateData(`clinics/${currentClinic.id}`, { 
            currentNumber: newNumber,
            lastUpdated: new Date().toISOString()
        });
        
        // Update queue
        await firebaseUtils.updateData(`queue/${currentClinic.id}`, { 
            currentNumber: newNumber,
            lastCalled: new Date().toISOString()
        });
        
        // Update display
        await firebaseUtils.setData('display/current', {
            clinicId: currentClinic.id,
            clinicName: currentClinic.name,
            number: newNumber,
            timestamp: new Date().toISOString()
        });
        
        // Play announcement
        audioSystem.playQueueAnnouncement(currentClinic.name, newNumber);
        
        // Update local state
        currentNumber = newNumber;
        currentClinic.currentNumber = newNumber;
        updateCurrentNumber();
        
        // Update last call time
        document.getElementById('lastCallTime').textContent = new Date().toLocaleTimeString('ar-SA');
        
        // Add to history
        addToHistory('نداء التالي', `الرقم: ${newNumber}`);
        
        console.log('Called next patient:', newNumber);
    } catch (error) {
        console.error('Error calling next patient:', error);
        showNotification('خطأ في نداء المريض التالي', 'error');
    }
}

// Previous patient
async function prevPatient() {
    if (!currentClinic) return;
    
    if (currentNumber <= 0) {
        showNotification('لا يمكن الرجوع إلى رقم سالب', 'warning');
        return;
    }
    
    const newNumber = currentNumber - 1;
    
    try {
        // Update clinic number
        await firebaseUtils.updateData(`clinics/${currentClinic.id}`, { 
            currentNumber: newNumber,
            lastUpdated: new Date().toISOString()
        });
        
        // Update queue
        await firebaseUtils.updateData(`queue/${currentClinic.id}`, { 
            currentNumber: newNumber,
            lastCalled: new Date().toISOString()
        });
        
        // Update display
        await firebaseUtils.setData('display/current', {
            clinicId: currentClinic.id,
            clinicName: currentClinic.name,
            number: newNumber,
            timestamp: new Date().toISOString()
        });
        
        // Play announcement
        audioSystem.playQueueAnnouncement(currentClinic.name, newNumber);
        
        // Update local state
        currentNumber = newNumber;
        currentClinic.currentNumber = newNumber;
        updateCurrentNumber();
        
        // Update last call time
        document.getElementById('lastCallTime').textContent = new Date().toLocaleTimeString('ar-SA');
        
        // Add to history
        addToHistory('نداء السابق', `الرقم: ${newNumber}`);
        
        console.log('Called previous patient:', newNumber);
    } catch (error) {
        console.error('Error calling previous patient:', error);
        showNotification('خطأ في نداء المريض السابق', 'error');
    }
}

// Repeat call
async function repeatCall() {
    if (!currentClinic) return;
    
    if (currentNumber <= 0) {
        showNotification('لا يوجد رقم لإعادة النداء', 'warning');
        return;
    }
    
    try {
        // Update display
        await firebaseUtils.setData('display/current', {
            clinicId: currentClinic.id,
            clinicName: currentClinic.name,
            number: currentNumber,
            timestamp: new Date().toISOString()
        });
        
        // Play announcement
        audioSystem.playQueueAnnouncement(currentClinic.name, currentNumber);
        
        // Update last call time
        document.getElementById('lastCallTime').textContent = new Date().toLocaleTimeString('ar-SA');
        
        // Add to history
        addToHistory('إعادة النداء', `الرقم: ${currentNumber}`);
        
        console.log('Repeated call for patient:', currentNumber);
    } catch (error) {
        console.error('Error repeating call:', error);
        showNotification('خطأ في إعادة النداء', 'error');
    }
}

// Reset clinic
function resetClinic() {
    showConfirmModal(
        'تصفير العيادة',
        'هل أنت متأكد من تصفير العيادة؟ سيتم إعادة العداد إلى الصفر.',
        'fa-exclamation-triangle',
        'text-red-500',
        async () => {
            if (!currentClinic) return;
            
            try {
                // Reset clinic number
                await firebaseUtils.updateData(`clinics/${currentClinic.id}`, { 
                    currentNumber: 0,
                    lastUpdated: new Date().toISOString()
                });
                
                // Reset queue
                await firebaseUtils.updateData(`queue/${currentClinic.id}`, { 
                    currentNumber: 0,
                    lastCalled: null
                });
                
                // Clear display
                await firebaseUtils.setData('display/current', null);
                
                // Update local state
                currentNumber = 0;
                currentClinic.currentNumber = 0;
                updateCurrentNumber();
                
                // Reset last call time
                document.getElementById('lastCallTime').textContent = 'لم يتم النداء بعد';
                
                // Add to history
                addToHistory('تصفير العيادة', 'تم إعادة العداد إلى الصفر');
                
                showNotification('تم تصفير العيادة بنجاح', 'success');
                console.log('Clinic reset successfully');
            } catch (error) {
                console.error('Error resetting clinic:', error);
                showNotification('خطأ في تصفير العيادة', 'error');
            }
        }
    );
}

// Call custom number
async function callCustomNumber() {
    const number = parseInt(document.getElementById('customNumber').value);
    
    if (!number || number < 0) {
        showNotification('يرجى إدخال رقم صحيح', 'warning');
        return;
    }
    
    try {
        // Update clinic number
        await firebaseUtils.updateData(`clinics/${currentClinic.id}`, { 
            currentNumber: number,
            lastUpdated: new Date().toISOString()
        });
        
        // Update queue
        await firebaseUtils.updateData(`queue/${currentClinic.id}`, { 
            currentNumber: number,
            lastCalled: new Date().toISOString()
        });
        
        // Update display
        await firebaseUtils.setData('display/current', {
            clinicId: currentClinic.id,
            clinicName: currentClinic.name,
            number: number,
            timestamp: new Date().toISOString()
        });
        
        // Play announcement
        audioSystem.playQueueAnnouncement(currentClinic.name, number);
        
        // Update local state
        currentNumber = number;
        currentClinic.currentNumber = number;
        updateCurrentNumber();
        
        // Update last call time
        document.getElementById('lastCallTime').textContent = new Date().toLocaleTimeString('ar-SA');
        
        // Clear input
        document.getElementById('customNumber').value = '';
        
        // Add to history
        addToHistory('نداء رقم مخصص', `الرقم: ${number}`);
        
        showNotification(`تم نداء الرقم ${number}`, 'success');
        console.log('Called custom number:', number);
    } catch (error) {
        console.error('Error calling custom number:', error);
        showNotification('خطأ في نداء الرقم المخصص', 'error');
    }
}

// Display custom message
async function displayCustomMessage() {
    const message = document.getElementById('customMessage').value.trim();
    
    if (!message) {
        showNotification('يرجى إدخال الرسالة', 'warning');
        return;
    }
    
    try {
        await firebaseUtils.setData('display/custom', {
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // Clear input
        document.getElementById('customMessage').value = '';
        
        // Add to history
        addToHistory('عرض رسالة', message);
        
        showNotification('تم عرض الرسالة بنجاح', 'success');
        console.log('Custom message displayed:', message);
    } catch (error) {
        console.error('Error displaying custom message:', error);
        showNotification('خطأ في عرض الرسالة', 'error');
    }
}

// Logout
function logout() {
    showConfirmModal(
        'تأكيد الخروج',
        'هل أنت متأكد من الخروج من لوحة التحكم؟',
        'fa-sign-out-alt',
        'text-blue-500',
        () => {
            currentClinic = null;
            currentNumber = 0;
            actionHistory = [];
            
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('controlSection').classList.add('hidden');
            document.getElementById('logoutBtn').classList.add('hidden');
            document.getElementById('currentClinicInfo').classList.add('hidden');
            
            // Clear form
            document.getElementById('clinicSelect').value = '';
            document.getElementById('passwordInput').value = '';
            
            // Clear history
            document.getElementById('actionHistory').innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-clock text-3xl mb-2"></i>
                    <p>سيتم عرض سجل العمليات هنا</p>
                </div>
            `;
            
            addToHistory('تسجيل خروج', 'تم تسجيل الخروج من النظام');
            console.log('Logged out successfully');
        }
    );
}

// Show confirmation modal
function showConfirmModal(title, message, icon, iconColor, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmIcon').className = `fas ${icon} text-4xl ${iconColor} mb-2`;
    
    document.getElementById('confirmYes').onclick = () => {
        closeConfirmModal();
        onConfirm();
    };
    
    document.getElementById('confirmModal').classList.remove('hidden');
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}

// Add to action history
function addToHistory(action, details) {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    
    actionHistory.unshift({
        action: action,
        details: details,
        timestamp: timestamp
    });
    
    // Keep only last 10 actions
    if (actionHistory.length > 10) {
        actionHistory = actionHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('actionHistory');
    
    if (actionHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-clock text-3xl mb-2"></i>
                <p>سيتم عرض سجل العمليات هنا</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = actionHistory.map((item, index) => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg ${index === 0 ? 'border-l-4 border-green-500' : ''}">
            <div>
                <div class="font-semibold text-gray-800">${item.action}</div>
                <div class="text-sm text-gray-600">${item.details}</div>
            </div>
            <div class="text-sm text-gray-500">${item.timestamp}</div>
        </div>
    `).join('');
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Only handle shortcuts when logged in
    if (!currentClinic) return;
    
    // Arrow Right or Space: Next patient
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPatient();
    }
    
    // Arrow Left: Previous patient
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPatient();
    }
    
    // R: Repeat call
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        repeatCall();
    }
    
    // Escape: Focus on custom number input
    if (e.key === 'Escape') {
        e.preventDefault();
        document.getElementById('customNumber').focus();
    }
    
    // Enter in custom number input: Call custom number
    if (e.key === 'Enter' && document.activeElement === document.getElementById('customNumber')) {
        e.preventDefault();
        callCustomNumber();
    }
});

// Handle page visibility
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Control panel hidden');
    } else {
        console.log('Control panel visible');
        loadClinicsForLogin();
    }
});