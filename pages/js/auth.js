/**
 * تحليل توكن JWT
 * @param {string} token - توكن JWT
 * @returns {object|null} بيانات التوكن المفكوكة
 */
function parseJwt(token) {
    try {
        if (!token) throw new Error('No token provided');
        if (typeof token !== 'string') throw new Error('Token must be a string');

        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token format');

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
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
 * استخراج الـ Claims من التوكن (دعم لـ ClaimTypes المختلفة)
 * @param {object} decodedToken - التوكن المفكوك
 * @returns {object} البيانات المستخرجة
 */
function extractClaimsFromToken(decodedToken) {
    if (!decodedToken) return { userId: '', email: '', role: '', fullName: '' };
    
    // جميع الأسماء المحتملة لكل Claim
    const userId = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier'] ||
                   decodedToken['sub'] ||
                   decodedToken['nameidentifier'] ||
                   decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                   decodedToken['userId'] ||
                   '';
    
    const email = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/email'] ||
                  decodedToken['email'] ||
                  decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                  '';
    
    const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                 decodedToken['role'] ||
                 decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] ||
                 '';
    
    const fullName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                     decodedToken['name'] ||
                     decodedToken['unique_name'] ||
                     decodedToken['fullName'] ||
                     '';
    
    return {
        userId: String(userId),
        email: String(email),
        role: String(role),
        fullName: String(fullName),
        exp: decodedToken['exp'] || null,
        iat: decodedToken['iat'] || null
    };
}

/**
 * حفظ بيانات المصادقة في التخزين المحلي
 * @param {object} authData - بيانات المصادقة من الـ API
 * @returns {object|null} بيانات المستخدم
 */
function saveAuthData(authData) {
    try {
        if (!authData || !authData.token) {
            console.error('No token in authData');
            return null;
        }
        
        // حفظ التوكن
        localStorage.setItem('token', authData.token);
        
        // فك وتحليل التوكن
        const decodedToken = parseJwt(authData.token);
        if (!decodedToken) {
            console.error('Failed to decode token');
            return null;
        }
        
        // استخراج الـ Claims
        const claims = extractClaimsFromToken(decodedToken);
        
        // بناء بيانات المستخدم
        const userData = {
            userId: authData.user?.id || claims.userId,
            fullName: authData.user?.fullName || claims.fullName,
            email: authData.user?.email || claims.email,
            role: claims.role,  // الدور من التوكن
            tokenExpiry: claims.exp ? new Date(claims.exp * 1000).toISOString() : null,
            loginTime: new Date().toISOString()
        };
        
        console.log('User data saved:', userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        return userData;
        
    } catch (error) {
        console.error('Failed to save auth data:', error);
        return null;
    }
}

/**
 * التحقق من صيغة البريد الإلكتروني
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * عرض رسالة خطأ
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        setTimeout(() => {
            errorElement.classList.add('d-none');
        }, 5000);
    } else {
        alert(message);
    }
}

/**
 * إعادة تعيين زر تسجيل الدخول
 */
function resetLoginButton(btn) {
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sign-in-alt ml-2"></i> تسجيل الدخول';
        btn.disabled = false;
    }
}

/**
 * تسجيل الأخطاء
 */
function logError(context, error) {
    console.error(`${context} Error:`, {
        message: error.message,
        timestamp: new Date().toISOString()
    });
}

/**
 * التوجيه حسب دور المستخدم
 * @param {string} role - دور المستخدم
 */
function redirectBasedOnRole(role) {
    // التحقق من وجود role وكونه string
    let userRole = '';
    
    if (role && typeof role === 'string') {
        userRole = role;
    } else if (role && typeof role === 'object') {
        // لو كانت role object غريب
        userRole = role.value || role.name || String(role);
    } else {
        userRole = String(role || '');
    }
    
    console.log('Redirecting with role:', userRole);
    
    const rolePages = {
        'Admin': '../admin/admin-dashboard.html',
        'Doctor': '../doctor/doctor-dashboard.html',
        'Patient': '../patient/patient-dashboard.html',
        'Pharmacist': '../pharmacist/pharmacist-dashboard.html'
    };
    
    // محاولة إيجاد الصفحة المناسبة
    let targetPage = rolePages[userRole];
    
    // لو ما لقيت، حاول تقارن بدون حساسية الأحرف
    if (!targetPage) {
        const roleLower = userRole.toLowerCase();
        for (const [key, page] of Object.entries(rolePages)) {
            if (key.toLowerCase() === roleLower) {
                targetPage = page;
                break;
            }
        }
    }
    
    if (targetPage) {
        console.log(`Redirecting to: ${targetPage}`);
        window.location.href = targetPage;
    } else {
        console.error(`Unknown role: ${userRole}`);
        showError(`صلاحية غير معروفة: ${userRole || 'غير محددة'}`);
        setTimeout(() => logout('./login.html'), 3000);
    }
}

/**
 * تسجيل الدخول إلى النظام
 */
async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.btn-login');
    
    if (!emailInput || !passwordInput) {
        console.error('Email or password input not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    try {
        // التحقق من الحقول
        if (!email || !password) {
            showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        if (!validateEmail(email)) {
            showError('صيغة البريد الإلكتروني غير صالحة');
            return;
        }
        
        // حالة التحميل
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري المعالجة...';
            loginBtn.disabled = true;
        }
        
        // طلب تسجيل الدخول
        const response = await fetch('https://localhost:7219/api/Auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // معالجة الاستجابة
        if (!response.ok) {
            let errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.title || errorMessage;
            } catch (e) {
                // تجاهل
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.token) {
            throw new Error('لم يتم استلام توكن الدخول');
        }

        // حفظ البيانات
        const userData = saveAuthData(data);
        
        if (!userData) {
            throw new Error('فشل حفظ بيانات المستخدم');
        }
        
        console.log('Login successful, user role:', userData.role);
        
        // التوجيه حسب الدور
        redirectBasedOnRole(userData.role);
        
    } catch (error) {
        showError(error.message);
        logError('Login', error);
    } finally {
        if (loginBtn) {
            resetLoginButton(loginBtn);
        }
    }
}

/**
 * تسجيل الخروج
 */
function logout(url) {
    localStorage.clear(); // مسح كل شيء
    if (url) {
        window.location.href = url;
    }
}

/**
 * تأكيد تسجيل الخروج
 */
function logoutMassge(mode, url) {
    if (typeof Swal !== 'undefined') {
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
    } else {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            logout(url);
        }
    }
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
});