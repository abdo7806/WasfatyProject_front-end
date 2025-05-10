/*async function login() {


    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://localhost:7219/api/Auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!response.ok) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role); // تخزين الدور
        localStorage.setItem('email', JSON.stringify(data.user.email)); // تخزين الصلاحيات


        // توجيه للداشبورد
        window.location.href = 'dashboard.html';
    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
    }
}
*/


function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}




async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://localhost:7219/api/Auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        const data = await response.json();
        const token = data.token;
        localStorage.setItem('token', token);

        // فك التوكين
        const decodedToken = parseJwt(token);
        localStorage.setItem('role', decodedToken.role);
        localStorage.setItem('email', decodedToken.email);


        console.log(decodedToken);


        alert(decodedToken.role);
        if (decodedToken.role === 'Admin') {
            window.location.href = '../pages/admin/admin-dashboard.html';
        } else if (role === 'Doctor') {
            window.location.href = 'doctor-dashboard.html';
        } else if (role === 'Patient') {
            window.location.href = 'patient-dashboard.html';
        } else if (role === 'Pharmacist') {
            window.location.href = 'pharmacist-dashboard.html';
        } else {
            alert('صلاحيات غير معروفة، سيتم تسجيل الخروج.');
            localStorage.clear();
            window.location.href = 'login.html';
        }
    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        console.error(error);
    }
}




async function register() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    // إعادة تعيين رسائل الخطأ
    document.getElementById('fullNameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('confirmPasswordError').textContent = '';
    document.getElementById('roleError').textContent = '';

    let isValid = true;

    if (!fullName) {
        document.getElementById('fullNameError').textContent = 'الاسم الكامل مطلوب!';
        isValid = false;
    }
    if (!email) {
        document.getElementById('emailError').textContent = 'البريد الإلكتروني مطلوب!';
        isValid = false;
    }
    if (!password) {
        document.getElementById('passwordError').textContent = 'كلمة المرور مطلوبة!';
        isValid = false;
    }
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'كلمات المرور غير متطابقة!';
        isValid = false;
    }
    if (!role) {
        document.getElementById('roleError').textContent = 'يجب اختيار دور!';
        isValid = false;
    }

    if (!isValid) {
        return; // إذا كانت البيانات غير صحيحة، لا نتابع
    }

    // تحويل role إلى رقم
    const roleNumber = parseInt(role);

    try {
        const response = await fetch('https://localhost:7219/api/Auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                role: roleNumber // استخدام الرقم هنا
            })
        });

        if (!response.ok) {
            throw new Error('فشل التسجيل');
        }

        // تسجيل ناجح: إعادة توجيه إلى صفحة تسجيل الدخول
        window.location.href = 'login.html';
    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
    }
}