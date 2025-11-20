// Tickets Printing JavaScript
let clinics = {};
let currentClinic = null;

// Initialize tickets page
document.addEventListener('DOMContentLoaded', function() {
    initializeTickets();
});

async function initializeTickets() {
    try {
        // Load clinics
        await loadClinics();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('Tickets page initialized successfully');
    } catch (error) {
        console.error('Error initializing tickets page:', error);
    }
}

// Load clinics
async function loadClinics() {
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
        
        console.log('Clinics loaded:', Object.keys(clinics).length);
    } catch (error) {
        console.error('Error loading clinics:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Clinic selection change
    document.getElementById('clinicSelect').addEventListener('change', function(e) {
        const clinicId = e.target.value;
        if (clinicId && clinics[clinicId]) {
            currentClinic = clinics[clinicId];
            currentClinic.id = clinicId;
            updateQueueInfo();
        } else {
            currentClinic = null;
            clearQueueInfo();
        }
    });
    
    // Number inputs change
    document.getElementById('startNumber').addEventListener('input', updateEstimatedTime);
    document.getElementById('endNumber').addEventListener('input', updateEstimatedTime);
    
    // Setup real-time listeners
    setupRealTimeListeners();
}

// Setup real-time listeners
function setupRealTimeListeners() {
    // Listen for clinic changes
    firebaseUtils.onValueChange('clinics', (data) => {
        if (data) {
            clinics = data;
            
            // Update current clinic if selected
            if (currentClinic && clinics[currentClinic.id]) {
                currentClinic = clinics[currentClinic.id];
                currentClinic.id = currentClinic.id;
                updateQueueInfo();
            }
            
            // Update clinic dropdown
            const clinicSelect = document.getElementById('clinicSelect');
            const currentValue = clinicSelect.value;
            
            clinicSelect.innerHTML = '<option value="">-- اختر العيادة --</option>';
            Object.entries(clinics).forEach(([id, clinic]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = clinic.name;
                clinicSelect.appendChild(option);
            });
            
            // Restore selection
            if (currentValue && clinics[currentValue]) {
                clinicSelect.value = currentValue;
            }
        }
    });
}

// Update queue information
function updateQueueInfo() {
    if (!currentClinic) return;
    
    const currentNumber = currentClinic.currentNumber || 0;
    const waitingCount = Math.max(0, currentNumber - 1);
    const estimatedMinutes = waitingCount * 5; // Assume 5 minutes per patient
    
    document.getElementById('currentNumber').textContent = currentNumber;
    document.getElementById('waitingCount').textContent = waitingCount;
    document.getElementById('estimatedTime').textContent = formatTime(estimatedMinutes);
}

// Clear queue information
function clearQueueInfo() {
    document.getElementById('currentNumber').textContent = '--';
    document.getElementById('waitingCount').textContent = '--';
    document.getElementById('estimatedTime').textContent = '--';
}

// Update estimated time
function updateEstimatedTime() {
    if (!currentClinic) return;
    
    const startNumber = parseInt(document.getElementById('startNumber').value) || 0;
    const endNumber = parseInt(document.getElementById('endNumber').value) || 0;
    const currentNumber = currentClinic.currentNumber || 0;
    
    if (startNumber > 0 && endNumber >= startNumber) {
        const totalTickets = endNumber - startNumber + 1;
        const estimatedMinutes = Math.max(0, (startNumber - currentNumber - 1) * 5);
        
        document.getElementById('estimatedTime').textContent = formatTime(estimatedMinutes);
    }
}

// Format time
function formatTime(minutes) {
    if (minutes <= 0) return 'الآن';
    
    if (minutes < 60) {
        return `${minutes} دقيقة`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} ساعة`;
        } else {
            return `${hours} س ${remainingMinutes} د`;
        }
    }
}

// Generate tickets
async function generateTickets() {
    const clinicId = document.getElementById('clinicSelect').value;
    const startNumber = parseInt(document.getElementById('startNumber').value);
    const endNumber = parseInt(document.getElementById('endNumber').value);
    
    // Validation
    if (!clinicId || !clinics[clinicId]) {
        showNotification('يرجى اختيار العيادة', 'warning');
        return;
    }
    
    if (!startNumber || startNumber < 1) {
        showNotification('يرجى إدخال رقم بداية صحيح', 'warning');
        return;
    }
    
    if (!endNumber || endNumber < startNumber) {
        showNotification('يرجى إدخال رقم نهاية صحيح', 'warning');
        return;
    }
    
    if (endNumber - startNumber > 100) {
        showNotification('الحد الأقصى لعدد التذاكر هو 100 تذكرة', 'warning');
        return;
    }
    
    const clinic = clinics[clinicId];
    const totalTickets = endNumber - startNumber + 1;
    
    // Show preview section
    document.getElementById('previewSection').classList.remove('hidden');
    document.getElementById('ticketCount').textContent = `${totalTickets} تذكرة`;
    
    // Generate tickets HTML
    const ticketsGrid = document.getElementById('ticketsGrid');
    ticketsGrid.innerHTML = '';
    
    for (let number = startNumber; number <= endNumber; number++) {
        const ticket = createTicket(clinic.name, number, clinic.currentNumber || 0);
        ticketsGrid.appendChild(ticket);
    }
    
    // Generate QR codes for tickets
    await generateQRCodes(startNumber, endNumber);
    
    showNotification(`تم إنشاء ${totalTickets} تذكرة بنجاح`, 'success');
    console.log(`Generated ${totalTickets} tickets for ${clinic.name}`);
}

// Create ticket element
function createTicket(clinicName, ticketNumber, currentNumber) {
    const ticket = document.createElement('div');
    ticket.className = 'ticket-preview';
    
    const waitingCount = Math.max(0, ticketNumber - currentNumber - 1);
    const waitingTime = waitingCount * 5; // 5 minutes per patient
    
    ticket.innerHTML = `
        <div class="clinic-name">${clinicName}</div>
        <div class="number-display">${ticketNumber}</div>
        <div class="ticket-info">
            <div>رقم الدور</div>
            <div id="qr-${ticketNumber}" class="qr-small"></div>
        </div>
        <div class="waiting-time">
            ${waitingCount > 0 ? `الانتظار: ${formatTime(waitingTime)}` : 'الدور الحالي'}
        </div>
    `;
    
    return ticket;
}

// Generate QR codes for tickets
async function generateQRCodes(startNumber, endNumber) {
    const currentUrl = window.location.origin + window.location.pathname.replace('tickets.html', '');
    
    for (let number = startNumber; number <= endNumber; number++) {
        try {
            const qrElement = document.getElementById(`qr-${number}`);
            if (qrElement) {
                // Create canvas for QR code
                const canvas = document.createElement('canvas');
                await QRCode.toCanvas(canvas, `${currentUrl}?ticket=${number}`, {
                    width: 20,
                    margin: 0,
                    errorCorrectionLevel: 'L',
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });
                
                // Replace the div with canvas
                qrElement.parentNode.replaceChild(canvas, qrElement);
                canvas.style.width = '20px';
                canvas.style.height = '20px';
            }
        } catch (error) {
            console.error(`Error generating QR code for ticket ${number}:`, error);
            // Fallback: show number instead of QR
            const qrElement = document.getElementById(`qr-${number}`);
            if (qrElement) {
                qrElement.textContent = number;
                qrElement.style.fontSize = '8px';
            }
        }
    }
}

// Clear tickets
function clearTickets() {
    document.getElementById('previewSection').classList.add('hidden');
    document.getElementById('ticketsGrid').innerHTML = '';
    
    // Reset inputs
    document.getElementById('startNumber').value = '1';
    document.getElementById('endNumber').value = '20';
    
    console.log('Tickets cleared');
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

// Handle print event
window.addEventListener('beforeprint', function() {
    console.log('Printing started');
    
    // Add print optimization
    const tickets = document.querySelectorAll('.ticket-preview');
    tickets.forEach(ticket => {
        ticket.style.border = '1px solid #ddd';
        ticket.style.boxShadow = 'none';
    });
});

window.addEventListener('afterprint', function() {
    console.log('Printing completed');
    
    // Restore styles
    const tickets = document.querySelectorAll('.ticket-preview');
    tickets.forEach(ticket => {
        ticket.style.border = '2px dashed #ccc';
        ticket.style.boxShadow = '';
    });
});

// Handle URL parameters (for ticket scanning)
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketNumber = urlParams.get('ticket');
    
    if (ticketNumber) {
        // This could be used for ticket verification
        console.log('Ticket scanned:', ticketNumber);
        showNotification(`تذكرة رقم ${ticketNumber} تم مسحها`, 'info');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+P: Print
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    
    // Escape: Clear tickets
    if (e.key === 'Escape') {
        clearTickets();
    }
    
    // Enter: Generate tickets
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT') {
            generateTickets();
        }
    }
});

// Auto-update queue info every 30 seconds
setInterval(() => {
    if (currentClinic) {
        updateQueueInfo();
    }
}, 30000);