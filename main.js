// Main JavaScript File for Queue Management System
// This file contains shared utilities and functions used across all pages

// System Configuration
const SYSTEM_CONFIG = {
    version: '1.0.0',
    name: 'نظام نداء وانتظار المرضى',
    author: 'Medical Queue System',
    maxTickets: 100,
    maxClinics: 50,
    audioTimeout: 30000, // 30 seconds
    displayTimeout: 10000, // 10 seconds
    notificationDuration: 3000 // 3 seconds
};

// Utility Functions
const utils = {
    // Format numbers to Arabic
    formatNumber(num) {
        const arabicNumbers = {
            0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤',
            5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩'
        };
        
        return num.toString().replace(/\d/g, digit => arabicNumbers[digit] || digit);
    },
    
    // Format time ago
    formatTimeAgo(timestamp) {
        if (!timestamp) return 'غير محدث';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    },
    
    // Generate unique ID
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Validate password
    validatePassword(password) {
        return password && password.length >= 4 && /^[a-zA-Z0-9]+$/.test(password);
    },
    
    // Validate clinic name
    validateClinicName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 50;
    },
    
    // Sanitize input
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Local Storage Helper
const storage = {
    // Set item with expiry
    setItem(key, value, expiryHours = 24) {
        const item = {
            value: value,
            expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    // Get item with expiry check
    getItem(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        } catch (e) {
            localStorage.removeItem(key);
            return null;
        }
    },
    
    // Remove item
    removeItem(key) {
        localStorage.removeItem(key);
    },
    
    // Clear all
    clear() {
        localStorage.clear();
    }
};

// Network Status Monitor
const networkMonitor = {
    isOnline: navigator.onLine,
    
    init() {
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    },
    
    handleOnline() {
        this.isOnline = true;
        console.log('Network connected');
        this.showNetworkStatus('تم الاتصال بالشبكة', 'success');
    },
    
    handleOffline() {
        this.isOnline = false;
        console.log('Network disconnected');
        this.showNetworkStatus('تم فقد الاتصال بالشبكة', 'error');
    },
    
    showNetworkStatus(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 left-4 z-50 p-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-wifi' : 'fa-wifi-slash'} ml-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, SYSTEM_CONFIG.notificationDuration);
    }
};

// Performance Monitor
const performanceMonitor = {
    startTime: Date.now(),
    metrics: {},
    
    startTiming(name) {
        this.metrics[name] = { start: Date.now() };
    },
    
    endTiming(name) {
        if (this.metrics[name]) {
            this.metrics[name].end = Date.now();
            this.metrics[name].duration = this.metrics[name].end - this.metrics[name].start;
            console.log(`${name}: ${this.metrics[name].duration}ms`);
        }
    },
    
    getMetrics() {
        return {
            ...this.metrics,
            totalUptime: Date.now() - this.startTime
        };
    }
};

// Error Handler
const errorHandler = {
    init() {
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    },
    
    handleError(event) {
        console.error('Global error:', event.error);
        this.logError({
            type: 'JavaScript Error',
            message: event.error.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: new Date().toISOString()
        });
    },
    
    handlePromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        this.logError({
            type: 'Promise Rejection',
            message: event.reason.message || event.reason,
            timestamp: new Date().toISOString()
        });
    },
    
    logError(errorInfo) {
        // In a real application, you might want to send this to a logging service
        const errors = storage.getItem('system_errors') || [];
        errors.push(errorInfo);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        storage.setItem('system_errors', errors, 168); // Keep for 1 week
    },
    
    getErrors() {
        return storage.getItem('system_errors') || [];
    }
};

// Notification System
const notificationSystem = {
    show(message, type = 'info', duration = SYSTEM_CONFIG.notificationDuration) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const styles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.className += ` ${styles[type] || styles.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icons[type] || icons.info} ml-2"></i>
                <span>${utils.sanitizeInput(message)}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        return notification;
    }
};

// Loading Manager
const loadingManager = {
    show(message = 'جاري التحميل...') {
        const loader = document.createElement('div');
        loader.id = 'system-loader';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        loader.innerHTML = `
            <div class="bg-white rounded-xl p-6 text-center shadow-2xl">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p class="text-gray-800 font-semibold">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loader);
    },
    
    hide() {
        const loader = document.getElementById('system-loader');
        if (loader) {
            loader.remove();
        }
    }
};

// Session Manager
const sessionManager = {
    startSession(page) {
        const sessionId = utils.generateId();
        const session = {
            id: sessionId,
            page: page,
            startTime: Date.now(),
            lastActivity: Date.now()
        };
        
        storage.setItem('current_session', session, 24);
        return session;
    },
    
    updateActivity() {
        const session = storage.getItem('current_session');
        if (session) {
            session.lastActivity = Date.now();
            storage.setItem('current_session', session, 24);
        }
    },
    
    endSession() {
        storage.removeItem('current_session');
    },
    
    getCurrentSession() {
        return storage.getItem('current_session');
    }
};

// Initialize system on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core systems
    networkMonitor.init();
    errorHandler.init();
    
    // Determine current page
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    sessionManager.startSession(currentPage);
    
    // Update activity on user interaction
    document.addEventListener('click', () => sessionManager.updateActivity());
    document.addEventListener('keydown', () => sessionManager.updateActivity());
    
    console.log(`Queue Management System v${SYSTEM_CONFIG.version} initialized`);
    console.log(`Current page: ${currentPage}`);
});

// Export utilities for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SYSTEM_CONFIG,
        utils,
        storage,
        networkMonitor,
        performanceMonitor,
        errorHandler,
        notificationSystem,
        loadingManager,
        sessionManager
    };
} else {
    // Make utilities available globally
    window.SystemUtils = {
        SYSTEM_CONFIG,
        utils,
        storage,
        networkMonitor,
        performanceMonitor,
        errorHandler,
        notificationSystem,
        loadingManager,
        sessionManager
    };
}