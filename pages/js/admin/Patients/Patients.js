let patients = [];
let currentPage = 1;
const patientsPerPage = 5;
let searchColumn = 'fullName'; // العمود الافتراضي للبحث

//  1. وظيفة لجلب بيانات المرضى من API (معدلة)
async function fetchPatients() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/PatientController/All', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        
        patients = await response.json();
        displayPatients();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        showError('حدث خطأ أثناء جلب بيانات المرضى');
    }
}

// وظيفة لعرض بيانات المرضى في الجدول
function displayPatients() {
    const patientsTableBody = document.getElementById('patientsTableBody');
    if (!patientsTableBody) return;
    
    patientsTableBody.innerHTML = '';

    const start = (currentPage - 1) * patientsPerPage;
    const end = start + patientsPerPage;
    const paginatedPatients = patients.slice(start, end);

    paginatedPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.userId}</td>
            <td>${patient.user?.fullName || ''}</td>
            <td>${patient.user?.email || ''}</td>
            <td>${patient.gender || ''}</td>
            <td>${patient.bloodType || ''}</td>
            <td>${patient.user?.createdAt ? new Date(patient.user.createdAt).toLocaleDateString('ar-EG') : ''}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deletePatient(${patient.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="EditePatient.html?id=${patient.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
            </td>
        `;
        patientsTableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedPatients.length}</b> من <b>${patients.length}</b> إدخالات`;
    }
}

// وظيفة لإعداد التقليب
function setupPagination(totalCount = null) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';

    const total = totalCount || patients.length;
    const totalPages = Math.ceil(total / patientsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

// وظيفة لتغيير الصفحة
function changePage(page) {
    currentPage = page;
    displayPatients();
    setupPagination();
}

// وظيفة للبحث عن المرضى حسب العمود المحدد
function searchPatients() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase();
    let filteredPatients = [];
    
    if (searchColumn === "gender" || searchColumn === "bloodType") {
        filteredPatients = patients.filter(patient => {
            return (patient[searchColumn] || '').toLowerCase().includes(searchValue);
        });
    } else {
        filteredPatients = patients.filter(patient => {
            return (patient.user?.[searchColumn] || '').toLowerCase().includes(searchValue);
        });
    }
    
    const patientsTableBody = document.getElementById('patientsTableBody');
    if (!patientsTableBody) return;
    
    patientsTableBody.innerHTML = '';
    currentPage = 1;
    
    const start = (currentPage - 1) * patientsPerPage;
    const end = start + patientsPerPage;
    const paginatedPatients = filteredPatients.slice(start, end);

    paginatedPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.userId}</td>
            <td>${patient.user?.fullName || ''}</td>
            <td>${patient.user?.email || ''}</td>
            <td>${patient.gender || ''}</td>
            <td>${patient.bloodType || ''}</td>
            <td>${patient.user?.createdAt ? new Date(patient.user.createdAt).toLocaleDateString('ar-EG') : ''}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deletePatient(${patient.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="EditePatient.html?id=${patient.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
            </td>
        `;
        patientsTableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedPatients.length}</b> من <b>${filteredPatients.length}</b> إدخالات`;
    }
    
    setupPagination(filteredPatients.length);
}

// وظيفة لتحديد العمود الذي سيتم البحث فيه
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    if (columnSelect) {
        searchColumn = columnSelect.value;
        searchPatients();
    }
}

//  2. وظيفة لحذف المريض (معدلة)
async function deletePatient(patientId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا المريض؟");
    if (!confirmDelete) return;
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/PatientController/${patientId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            patients = patients.filter(patient => patient.id !== patientId);
            displayPatients();
            setupPagination();
            showSuccess('تم حذف المريض بنجاح');
        } else {
            throw new Error('فشل في حذف المريض');
        }
    } catch (error) {
        console.error('خطأ في حذف المريض:', error);
        showError('حدث خطأ أثناء حذف المريض');
    }
}

//  3. دالة تحميل بيانات المريض للتعديل (معدلة)
async function loadUserData(patientId) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/PatientController/${patientId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error("فشل تحميل البيانات");
        }

        const data = await response.json();
        if (!data.user) throw new Error("بيانات المستخدم غير موجودة");

        const fullNameField = document.getElementById("fullName");
        const emailField = document.getElementById("email");
        const dateOfBirthField = document.getElementById("DateOfBirth");
        const genderField = document.getElementById("gender");
        const bloodTypeField = document.getElementById("bloodType");
        const phoneNumberField = document.getElementById("phoneNumber");
        
        if (fullNameField) fullNameField.value = data.user.fullName || '';
        if (emailField) emailField.value = data.user.email || '';
        if (dateOfBirthField && data.dateOfBirth) dateOfBirthField.value = data.dateOfBirth.split("T")[0];
        if (genderField) genderField.value = data.gender || '';
        if (bloodTypeField) bloodTypeField.value = data.bloodType || '';
        if (phoneNumberField) phoneNumberField.value = data.user.phoneNumber || '';
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}



//  5. دالة تحديث المريض (معدلة)
async function updatePatient() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    
    if (!patientId) {
        showError('معرف المريض غير موجود');
        return;
    }
    
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const dateOfBirth = document.getElementById('DateOfBirth')?.value;
    const gender = document.getElementById('gender')?.value;
    const bloodType = document.getElementById('bloodType')?.value;
    const phoneNumber = document.getElementById('phoneNumber')?.value;

    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/PatientController/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dateOfBirth,
                gender,
                bloodType,
                fullName,
                email,
                phoneNumber
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "فشل تعديل بيانات المريض");
        }
        
        showSuccess("تم تعديل البيانات بنجاح");
        setTimeout(() => {
            window.location.href = './Patient.html';
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

async function addUser() {
    if (!validateForm()) return;

    showLoading(true);

    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const dateOfBirth = document.getElementById('DateOfBirth')?.value;
    const gender = document.getElementById('gender')?.value;
    const bloodType = document.getElementById('bloodType')?.value;
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
    const role = 3; // Patient Role

    try {
        const patientResponse = await fetchWithAuth('https://localhost:7219/api/PatientController', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName,
                email,
                password,
                dateOfBirth,
                gender,
                bloodType,
                phoneNumber
            })
        });
        
        if (patientResponse.status !== 201 && !patientResponse.ok) {
            throw new Error('فشل في إضافة بيانات المريض');
        }

        showMessage('تم إضافة المريض بنجاح', false);
        setTimeout(() => {
            window.location.href = './Patient.html';
        }, 1500);

    } catch (error) {
        showMessage(error.message);
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

//  7. دوال مساعدة
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

function showMessage(message, isError = true) {
    if (isError) {
        showError(message);
    } else {
        showSuccess(message);
    }
}

function showLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.getElementById('submitBtn');
    
    if (loadingDiv) loadingDiv.style.display = isLoading ? 'flex' : 'none';
    if (submitBtn) submitBtn.disabled = isLoading;
}

function resetErrors() {
    document.querySelectorAll('.text-danger').forEach(el => {
        el.textContent = '';
    });
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
}

function validateForm() {
    resetErrors();

    const fullName = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const dateOfBirth = document.getElementById('DateOfBirth')?.value || '';
    const gender = document.getElementById('gender')?.value || '';
    const bloodType = document.getElementById('bloodType')?.value || '';
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim() || '';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d{9}$/;

    let isValid = true;

    if (!fullName) {
        const errorEl = document.getElementById('fullNameError');
        if (errorEl) errorEl.textContent = 'الاسم الكامل مطلوب';
        isValid = false;
    }

    if (!email) {
        const errorEl = document.getElementById('emailError');
        if (errorEl) errorEl.textContent = 'البريد الإلكتروني مطلوب';
        isValid = false;
    } else if (!emailPattern.test(email)) {
        const errorEl = document.getElementById('emailError');
        if (errorEl) errorEl.textContent = 'بريد إلكتروني غير صالح';
        isValid = false;
    }

    if (!password) {
        const errorEl = document.getElementById('passwordError');
        if (errorEl) errorEl.textContent = 'كلمة المرور مطلوبة';
        isValid = false;
    } else if (password.length < 6) {
        const errorEl = document.getElementById('passwordError');
        if (errorEl) errorEl.textContent = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
        isValid = false;
    }

    if (password !== confirmPassword) {
        const errorEl = document.getElementById('confirmPasswordError');
        if (errorEl) errorEl.textContent = 'كلمة المرور غير متطابقة';
        isValid = false;
    }

    if (!dateOfBirth) {
        const errorEl = document.getElementById('DateOfBirthError');
        if (errorEl) errorEl.textContent = 'تاريخ الميلاد مطلوب';
        isValid = false;
    } else {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        if (birthDate >= today) {
            const errorEl = document.getElementById('DateOfBirthError');
            if (errorEl) errorEl.textContent = 'تاريخ الميلاد يجب أن يكون في الماضي';
            isValid = false;
        }
    }

    if (!gender) {
        const errorEl = document.getElementById('genderError');
        if (errorEl) errorEl.textContent = 'الجنس مطلوب';
        isValid = false;
    }

    if (!bloodType) {
        const errorEl = document.getElementById('bloodTypeError');
        if (errorEl) errorEl.textContent = 'فصيلة الدم مطلوبة';
        isValid = false;
    }

    if (phoneNumber && !phonePattern.test(phoneNumber)) {
        const errorEl = document.getElementById('phoneError');
        if (errorEl) errorEl.textContent = 'رقم الهاتف يجب أن يتكون من 9 أرقام';
        isValid = false;
    }

    return isValid;
}