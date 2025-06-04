function parseJwt(token) {
    try {
        if (!token) throw new Error('No token provided');

        const base64Url = token.split('.')[1];
        if (!base64Url) throw new Error('Invalid token format');

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedData = atob(base64);

        const jsonPayload = decodeURIComponent(
            decodedData.split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return null;
    }
}





async function login() {


    // الحصول على قيم المدخلات
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error-message');

    // التحقق الأساسي من المدخلات
    if (!email || !password) {
        errorElement.textContent = 'يجب ملء جميع الحقول المطلوبة';
        return;
    }


    try {
        // إظهار مؤشر تحميل
        //  showLoader();

        const response = await fetch('https://localhost:7219/api/Auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // إخفاء مؤشر تحميل
        //  hideLoader();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        const data = await response.json();

        // التحقق من وجود التوكن
        if (!data.token) {
            throw new Error('لم يتم استلام توكن الدخول');
        }


        // حفظ التوكن في localStorage
        localStorage.setItem('token', data.token);

        // فك تشفير التوكن
        const decodedToken = parseJwt(data.token);
        console.log(decodedToken);
        if (!decodedToken) {
            throw new Error('فشل تحليل بيانات التوكن');
        }

        // حفظ بيانات المستخدم
        localStorage.setItem('userData', JSON.stringify({
            fullName: data.user.fullName,
            userId: data.user.id,
            email: decodedToken.email,
            role: decodedToken.role,

        }));



        // التوجيه حسب الدور
        redirectBasedOnRole(decodedToken.role);

    } catch (error) {
        // hideLoader();
        errorElement.textContent = error.message;
        console.error('Login error:', error);
    }
}

function redirectBasedOnRole(role) {
    const rolePages = {
        'Admin': '../admin/admin-dashboard.html',
        'Doctor': '../doctor/doctor-dashboard.html',
        'Patient': '../patient/patient-dashboard.html',
        'Pharmacist': '../pharmacist/pharmacist-dashboard.html'
    };

    if (rolePages[role]) {
        window.location.href = rolePages[role];
    } else {
        alert('صلاحيات غير معروفة، سيتم تسجيل الخروج.');
        logout();
    }
}

function logout(url) {
    localStorage.clear();
    window.location.href = url;
}


        // Logout Function
        function logoutMassge(mode, url) {
          // alert("sccd")
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
                    	localStorage.removeItem('token');
            localStorage.removeItem('userData');
            if(mode === "doctor"){
            localStorage.removeItem('doctorData');
            }
            else if(mode === "patient"){
            localStorage.removeItem('patientData');
            }
            else if(mode === "PharmacistData"){
            localStorage.removeItem('PharmacistData');
            }
            window.location.href = url;;
                
                }
            });
        }




async function register() {
    // جمع البيانات من النموذج
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        role: 3
    };

    // التحقق من الصحة

    const errors = validateRegistration(formData);
    if (Object.keys(errors).length > 0) {
        displayErrors(errors);
        return;
    }

    try {
        // إظهار مؤشر تحميل
        // showLoader();

        const response = await fetch('https://localhost:7219/api/Auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: parseInt(formData.role)
            })
        });



        // إخفاء مؤشر تحميل
        //hideLoader();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل في عملية التسجيل');
        }

        // عرض رسالة نجاح
        showSuccess('تم التسجيل بنجاح! سيتم توجيهك لصفحة تسجيل الدخول...');

        // التوجيه بعد 3 ثواني
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (error) {
        hideLoader();
        showError(error.message);
        console.error('Registration error:', error);
    }
}

function validateRegistration(data) {

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;


    if (!data.fullName) errors.fullName = 'الاسم الكامل مطلوب!';
    if (!data.email) {
        errors.email = 'البريد الإلكتروني مطلوب!';
    } else if (!emailRegex.test(data.email)) {
        errors.email = 'البريد الإلكتروني غير صالح!';
    }
    if (!data.password) {
        errors.password = 'كلمة المرور مطلوبة!';
    } else if (data.password.length < 6) {
        errors.password = 'كلمة المرور يجب أن تحتوي على الأقل 6 أحرف وتشمل حروف وأرقام!';
    }
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'كلمات المرور غير متطابقة!';
    }
    if (!data.role) {
        errors.role = 'يجب اختيار دور!';
    }

    return errors;
}

function displayErrors(errors) {
    // إعادة تعيين جميع رسائل الخطأ
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });

    // عرض الأخطاء الحالية
    for (const [field, message] of Object.entries(errors)) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    successElement.textContent = message;
    successElement.style.display = 'block';

    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}