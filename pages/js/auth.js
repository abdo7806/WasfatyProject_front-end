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
            credentials: 'include', 
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

        // const data = await response.json();
        
        // if (!data.token) {
        //     throw new Error('لم يتم استلام توكن الدخول');
        // }

        const data = await response.json();
        
        //  دعم خاصية Token أو AccessToken
        const token = data.token || data.accessToken;
        
        if (!token) {
            throw new Error('لم يتم استلام توكن الدخول');
        }

        //  تعديل بيانات المصادقة لتشمل التوكن
        const authData = {
            token: token,
            user: data.user
        };

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
// function logout(url) {
//     localStorage.clear(); // مسح كل شيء
//     if (url) {
//         window.location.href = url;
//     }
// }



/**
 * تسجيل الخروج من الخادم (إبطال Refresh Token)
 * @returns {Promise<boolean>} نجاح العملية
 */
async function logoutOnServer() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return true; // لا يوجد توكن أصلاً
        
        const response = await fetch('https://localhost:7219/api/Auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'  // ✅ يرسل الـ Refresh Token من الـ Cookie
        });
        
        if (response.ok) {
            console.log('Server logout successful');
            return true;
        } else {
            console.warn('Server logout failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Server logout error:', error);
        return false; // حتى لو فشل، نكمل مسح البيانات المحلية
    }
}

/**
 * تسجيل الخروج الكامل (خادم + محلي)
 * @param {string} redirectUrl - رابط التوجيه بعد الخروج
 * @param {boolean} skipServerConfirm - تخطي تأكيد الخادم
 */
async function logout(redirectUrl, skipServerConfirm = false) {
    try {
        // 1. إعلام الخادم بإبطال الـ Refresh Token
        if (!skipServerConfirm) {
            await logoutOnServer();
        }
        
        // 2. مسح البيانات المحلية
        localStorage.clear();
        sessionStorage.clear();
        
        // 3. حذف الـ Cookie من المتصفح (للتأكيد)
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        console.log('Logout completed successfully');
        
        // 4. التوجيه إلى صفحة login
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error('Logout error:', error);
        // حتى لو فشل، نحاول التوجيه
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    }
}


/**
 * إنشاء Modal تأكيد تسجيل الخروج ديناميكياً
 * @param {string} redirectUrl - رابط التوجيه بعد الخروج
 */
function logoutMassge(redirectUrl = '../../auth/login.html') {

    // ✅ إنشاء عنصر overlay (خلفية داكنة)
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    // ✅ إنشاء صندوق التأكيد
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: white;
        border-radius: 10px;
        width: 350px;
        max-width: 90%;
        padding: 20px;
        text-align: center;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        animation: fadeInScale 0.2s ease;
    `;
    
    // ✅ إضافة الحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // ✅ محتوى الـ Modal
    modal.innerHTML = `
        <div style="margin-bottom: 15px;">
            <div style="width: 60px; height: 60px; background-color: #fee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            </div>
            <h3 style="margin: 0 0 10px; font-size: 20px;">تأكيد تسجيل الخروج</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="confirmLogoutBtn" style="background-color: #dc3545; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                نعم، سجل خروج
            </button>
            <button id="cancelLogoutBtn" style="background-color: #6c757d; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                إلغاء
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // ✅ إغلاق الـ Modal
    const closeModal = () => {
        overlay.remove();
    };
    
    // ✅ أحداث الأزرار
    document.getElementById('confirmLogoutBtn').onclick = async () => {
        closeModal();
        await logout(redirectUrl);
    };
    
    document.getElementById('cancelLogoutBtn').onclick = closeModal;
    
    // ✅ إغلاق عند الضغط على الخلفية
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };
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










/**
 * تحديث الـ Access Token باستخدام Refresh Token
 * @returns {Promise<string|null>} التوكن الجديد أو null
 */
async function refreshAccessToken() {
    try {
        console.log('Attempting to refresh access token...');
        
        const response = await fetch('https://localhost:7219/api/Auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'  // مهم جداً - يرسل الـ Cookie تلقائياً
        });
        
        if (!response.ok) {
            console.error('Refresh failed:', response.status);
            return null;
        }
        
        const data = await response.json();
        
        if (data.token || data.accessToken) {
            const newToken = data.token || data.accessToken;
            localStorage.setItem('token', newToken);
            console.log('Token refreshed successfully');
            return newToken;
        }
        
        return null;
    } catch (error) {
        console.error('Refresh token error:', error);
        return null;
    }
}

/**
 * طلب API مع إعادة المحاولة تلقائياً عند انتهاء التوكن
 * @param {string} url - رابط الطلب
 * @param {object} options - خيارات fetch
 * @returns {Promise<Response>}
 */
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem('token');
    // إعداد الـ headers الأساسية
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };
    
    // إضافة التوكن إذا كان موجود
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // إعداد خيارات الطلب
    const fetchOptions = {
        ...options,
        headers: headers,
        credentials: 'include'  // ✅ مهم للـ Cookies
    };
    
    try {
        let response = await fetch(url, fetchOptions);
        
        // إذا كان 401 (Unauthorized)، حاول تجديد التوكن
        if (response.status === 401) {
            console.log('Token expired, attempting refresh...');
            
            const newToken = await refreshAccessToken();
            
            if (newToken) {
                // تحديث التوكن وإعادة المحاولة
                fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, fetchOptions);
            } else {
                // فشل التجديد - توجيه إلى صفحة login
                console.log('Refresh failed, redirecting to login...');
                localStorage.clear();
                // window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }
        }
        
        return response;
    } catch (error) {
        console.error('fetchWithAuth error:', error);
        throw error;
    }
}



/**
 * التحقق من صلاحية التوكن الحالي
 * @returns {boolean} هل التوكن صالح؟
 */
function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isValid = decoded.exp > currentTime;
    
    console.log(`Token valid: ${isValid}, expires at: ${new Date(decoded.exp * 1000)}`);
    return isValid;
}

/**
 * الحصول على التوكن الحالي
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * الحصول على بيانات المستخدم الحالي
 * @returns {object|null}
 */
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    try {
        return JSON.parse(userData);
    } catch {
        return null;
    }
}



/**
 * إبطال جميع جلسات المستخدم (جميع الأجهزة)
 * @returns {Promise<boolean>}
 */
async function revokeAllSessions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        const response = await fetch('https://localhost:7219/api/Auth/revoke-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('All sessions revoked');
            // بعد إبطال الجلسات، نسجل خروج
            await logout('login.html', true);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Revoke all error:', error);
        return false;
    }
}

/**
 * إعداد مؤقت للخروج التلقائي عند انتهاء التوكن
 * @param {number} bufferSeconds - ثواني قبل الانتهاء للتنبيه
 */
function setupAutoLogout(bufferSeconds = 60) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return;
    
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    const logoutTime = timeUntilExpiry - (bufferSeconds * 1000);
    
    if (logoutTime > 0) {
        console.log(`Auto logout scheduled in ${Math.floor(logoutTime / 1000)} seconds`);
        
        setTimeout(() => {
            console.log('Session expired, logging out...');
            logout('login.html', true);
        }, logoutTime);
    }
}