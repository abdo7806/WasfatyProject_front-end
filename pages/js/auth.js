/**
 * تحليل توكن JWT
 * @param {string} token - توكن JWT
 * @returns {object|null} بيانات التوكن المفكوكة أو null في حالة الخطأ
 */
function parseJwt(token) {
    try {
        if (!token) throw new Error('No token provided');
        if (typeof token !== 'string') throw new Error('Token must be a string');

        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token format');

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // استخدام TextDecoder لتفادي مشاكل Unicode
        const decodedData = new TextDecoder().decode(
            Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        );
        
        return JSON.parse(decodedData);
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return null;
    }
}

/**
 * التحقق من صيغة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} صحيح إذا كان البريد صالحاً
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * تسجيل الدخول إلى النظام
 */
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElement = document.getElementById('error-message');
    const loginBtn = document.querySelector('.btn-login');
    
    try {
        // التحقق من الحقول المطلوبة
        if (!email || !password) {
            showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        // التحقق من صيغة البريد الإلكتروني
        if (!validateEmail(email)) {
            showError('صيغة البريد الإلكتروني غير صالحة');
            return;
        }
        
        // عرض حالة التحميل
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري المعالجة...';
        loginBtn.disabled = true;
        
        // إرسال طلب تسجيل الدخول
        const response = await fetch('https://localhost:7219/api/Auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'same-origin' // للأمان
        });

        // معالجة الاستجابة
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // التحقق من وجود التوكن
        if (!data.token) {
            throw new Error('لم يتم استلام توكن الدخول');
        }

        // حفظ التوكن وبيانات المستخدم
        saveAuthData(data);
        
        // فك تشفير التوكن والتوجيه حسب الدور
        const decodedToken = parseJwt(data.token);
        if (!decodedToken) {
            throw new Error('فشل تحليل بيانات التوكن');
        }
        
        redirectBasedOnRole(decodedToken.role);
        
    } catch (error) {
        showError(error.message);
        console.error('Login error:', error);
        
        // تسجيل الحدث في نظام التتبع
        logError('Login', error);
        
    } finally {
        // إعادة تعيين زر تسجيل الدخول
        resetLoginButton(loginBtn);
    }
}

/**
 * حفظ بيانات المصادقة في التخزين المحلي
 * @param {object} authData - بيانات المصادقة
 */
function saveAuthData(authData) {
    try {
        localStorage.setItem('token', authData.token);
        
        const decodedToken = parseJwt(authData.token);
        if (!decodedToken) return;
        
        const userData = {
            fullName: authData.user?.fullName || '',
            userId: authData.user?.id || '',
            email: decodedToken.email || '',
            role: decodedToken.role || ''
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        
    } catch (error) {
        console.error('Failed to save auth data:', error);
    }
}

/**
 * التوجيه حسب دور المستخدم
 * @param {string} role - دور المستخدم
 */
function redirectBasedOnRole(role) {
    const rolePages = {
        'Admin': '../admin/admin-dashboard.html',
        'Doctor': '../doctor/doctor-dashboard.html',
        'Patient': '../patient/patient-dashboard.html',
        'Pharmacist': '../pharmacist/pharmacist-dashboard.html'
    };

    const targetPage = rolePages[role];
    if (targetPage) {
        window.location.href = targetPage;
    } else {
        showError('صلاحيات غير معروفة، سيتم تسجيل الخروج.');
        setTimeout(() => logout('../login.html'), 3000);
    }
}

/**
 * تسجيل الخروج
 * @param {string} url - رابط الصفحة للتوجيه بعد التسجيل
 */
function logout(url) {
    try {
        // مسح جميع بيانات المصادقة
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('doctorData');
        localStorage.removeItem('patientData');
        localStorage.removeItem('PharmacistData');
        
        // التوجيه إلى صفحة تسجيل الدخول
        if (url) {
            window.location.href = url;
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * تأكيد تسجيل الخروج
 * @param {string} mode - نوع المستخدم
 * @param {string} url - رابط الصفحة للتوجيه
 */
function logoutMassge(mode, url) {
    Swal.fire({
        title: 'تأكيد تسجيل الخروج',
        text: 'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، سجل خروج',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            logout(url);
        }
    });
}

/**
 * إعادة تعيين زر تسجيل الدخول
 * @param {HTMLElement} btn - عنصر الزر
 */
function resetLoginButton(btn) {
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sign-in-alt ml-2"></i> تسجيل الدخول';
        btn.disabled = false;
    }
}

/**
 * عرض رسالة خطأ
 * @param {string} message - نص الرسالة
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        
        setTimeout(() => {
            errorElement.classList.add('d-none');
        }, 5000);
    }
}

/**
 * تسجيل الأخطاء
 * @param {string} context - سياق الخطأ
 * @param {Error} error - كائن الخطأ
 */
function logError(context, error) {
    // هنا يمكنك إضافة كود لإرسال الأخطاء إلى سيرفر للتتبع
    console.error(`${context} Error:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
}

// السماح بتسجيل الدخول عند الضغط على Enter
document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});