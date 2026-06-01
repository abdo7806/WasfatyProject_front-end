// Doctor.js

let doctors = [];
let currentPage = 1;
const doctorsPerPage = 5;
let searchColumn = 'specialization';

// 1. جلب جميع الأطباء
async function fetchDoctors() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Doctor/All', {
            method: 'GET'
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            // ✅ معالجة الخطأ بشكل صحيح
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`فشل في جلب البيانات: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        // ✅ تأكد أن data هي مصفوفة
        doctors = Array.isArray(data) ? data : [];
        
        displayDoctors();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        showError('حدث خطأ أثناء جلب بيانات الأطباء: ' + error.message);
    }
}
// 2. عرض الأطباء في الجدول
function displayDoctors() {
    const tableBody = document.getElementById('doctorsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * doctorsPerPage;
    const end = start + doctorsPerPage;
    const paginatedDoctors = doctors.slice(start, end);

    paginatedDoctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.licenseNumber || ''}</td>
            <td>${doctor.specialization || ''}</td>
            <td>${doctor.user?.fullName || ''}</td>
            <td>${doctor.user?.email || ''}</td>
            <td>${doctor.medicalCenter?.name || ''}</td>
            <td>${doctor.medicalCenter?.address || ''}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deleteDoctor(${doctor.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="EditDoctor.html?id=${doctor.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedDoctors.length}</b> من <b>${doctors.length}</b> إدخالات`;
    }
}
// 3. إعداد التقليب
function setupPagination(totalCount = null) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';

    const total = totalCount || doctors.length;
    const totalPages = Math.ceil(total / doctorsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a href="#" class="page-link" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
}

// 4. تغيير الصفحة
function changePage(page) {
    currentPage = page;
    displayDoctors();
    setupPagination();
}

// 5. البحث عن الأطباء
function searchDoctors() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    
    const searchValue = input.value.toLowerCase();
    let filtered = [];
    
    if (searchColumn === "fullName" || searchColumn === "email") {
        filtered = doctors.filter(doctor => (doctor.user?.[searchColumn] || '').toLowerCase().includes(searchValue));
    } else {
        filtered = doctors.filter(doctor => (doctor[searchColumn] || '').toLowerCase().includes(searchValue));
    }
    
    const tableBody = document.getElementById('doctorsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    currentPage = 1;

    const start = (currentPage - 1) * doctorsPerPage;
    const end = start + doctorsPerPage;
    const paginatedDoctors = filtered.slice(start, end);

    paginatedDoctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}${'｝'}
            <td>${doctor.licenseNumber || ''}${'｝'}
            <td>${doctor.specialization || ''}${'｝'}
            <td>${doctor.user?.fullName || ''}${'｝'}
            <td>${doctor.user?.email || ''}${'｝'}
            <td>${doctor.medicalCenter?.name || ''}${'｝'}
            <td>${doctor.medicalCenter?.address || ''}${'｝'}
            <td>
                <button class="btn btn-danger btn-action" onclick="deleteDoctor(${doctor.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="EditDoctor.html?id=${doctor.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
             ${'｝'}
        `;
        tableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedDoctors.length}</b> من <b>${filtered.length}</b> إدخالات`;
    }
    setupPagination(filtered.length);
}

// 6. تغيير عمود البحث
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    if (columnSelect) {
        searchColumn = columnSelect.value;
        searchDoctors();
    }
}

// 7. حذف طبيب
async function deleteDoctor(doctorId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا الطبيب؟");
    if (!confirmDelete) return;

    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Doctor/${doctorId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            doctors = doctors.filter(d => d.id !== doctorId);
            displayDoctors();
            setupPagination();
            showSuccess('تم حذف الطبيب بنجاح');
        } else {
            throw new Error('فشل في حذف الطبيب');
        }
    } catch (error) {
        console.error('خطأ في حذف الطبيب:', error);
        showError('حدث خطأ أثناء حذف الطبيب');
    }
}

//  8. إضافة طبيب جديد (معدل)
async function addDoctor() {
    if (!validateForm()) {
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const medicalCenterId = document.getElementById('MedicalCenter').value;
    const specialization = document.getElementById('specialization').value;
    const licenseNumber = document.getElementById('licenseNumber').value;

    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Doctor/CreateDoctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                fullName, 
                email, 
                password, 
                medicalCenterId, 
                specialization, 
                licenseNumber 
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل إضافة الطبيب');
        }

        showSuccess('تم إضافة الطبيب بنجاح');
        setTimeout(() => {
            window.location.href = './Doctors.html';
        }, 1500);
        
    } catch (error) {
        console.error('خطأ في الإضافة:', error);
        showError(error.message);
    }
}

// 9. جلب المراكز الطبية
async function fetchMedicalCenters() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/MedicalCenter/All', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب المراكز الطبية');
        }
        
        const centers = await response.json();
        const select = document.getElementById('MedicalCenter');
        if (!select) return;
        
        select.innerHTML = '<option value="">اختر مركز طبي</option>';
        
        centers.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('خطأ في جلب بيانات المراكز الطبية:', error);
        showError('حدث خطأ أثناء جلب المراكز الطبية');
    }
}



// 11. تحديث بيانات الطبيب
async function updateDoctor() {
    const doctorId = new URLSearchParams(window.location.search).get('id');
    const submitBtn = document.getElementById("submitBtn");
    
    if (!doctorId) {
        showError('معرف الطبيب غير موجود');
        return;
    }
    
    if (submitBtn) submitBtn.disabled = true;

    if (!validateForm()) {
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const medicalCenterId = document.getElementById('MedicalCenter').value;
    const licenseNumber = document.getElementById('licenseNumber').value.trim();
    const specialization = document.getElementById('specialization').value.trim();

    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Doctor/${doctorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, medicalCenterId, specialization, licenseNumber })
        });

        if (!response.ok) {
            throw new Error("فشل تعديل بيانات الطبيب");
        }

        const updatedDoctor = await response.json();
        
        window.location.href = './Doctors.html';
    } catch (error) {
        console.error('خطأ في التعديل:', error);
        showError(error.message);
        if (submitBtn) submitBtn.disabled = false;
    }
}

// 12. جلب تفاصيل طبيب للتعديل
async function fetchDoctorDetails(id) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Doctor/${id}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error("فشل في جلب بيانات الطبيب");
        }
        
        const doctor = await response.json();
        
        const doctorIdField = document.getElementById('doctorId');
        const fullNameField = document.getElementById('fullName');
        const emailField = document.getElementById('email');
        const licenseNumberField = document.getElementById('licenseNumber');
        const specializationField = document.getElementById('specialization');
        
        if (doctorIdField) doctorIdField.value = id;
        if (fullNameField) fullNameField.value = doctor.user?.fullName || '';
        if (emailField) emailField.value = doctor.user?.email || '';
        if (licenseNumberField) licenseNumberField.value = doctor.licenseNumber || '';
        if (specializationField) specializationField.value = doctor.specialization || '';
        
        setTimeout(() => {
            if (doctor.medicalCenterId) {
                const centerSelect = document.getElementById('MedicalCenter');
                if (centerSelect) centerSelect.value = doctor.medicalCenterId;
            }
        }, 300);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

// 13. دوال مساعدة
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