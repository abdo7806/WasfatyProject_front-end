let pharmacists = [];
let currentPage = 1;
const pharmacistsPerPage = 5;
let searchColumn = 'fullName'; // العمود الافتراضي للبحث

// ✅ 1. وظيفة لجلب بيانات الصيادلة من API (معدلة)
async function fetchPharmacists() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Pharmacist/All', {
            method: 'GET'
        });
        pharmacists = await response.json();
        displayPharmacists();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        showError('حدث خطأ أثناء جلب بيانات الصيادلة');
    }
}

// وظيفة لعرض بيانات الصيادلة في الجدول (نفسها)
function displayPharmacists(url = 'EditPharmacist.html') {
    const pharmacistsTableBody = document.getElementById('pharmacistsTableBody');
    if (!pharmacistsTableBody) return;
    
    pharmacistsTableBody.innerHTML = '';

    const start = (currentPage - 1) * pharmacistsPerPage;
    const end = start + pharmacistsPerPage;
    const paginatedPharmacists = pharmacists.slice(start, end);

    paginatedPharmacists.forEach(pharmacist => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pharmacist.id}</td>
            <td>${pharmacist.licenseNumber || ''}</td>
            <td>${pharmacist.user?.fullName || ''}</td>
            <td>${pharmacist.user?.email || ''}</td>
            <td>${pharmacist.pharmacy?.name || ''}</td>
            <td>${pharmacist.pharmacy?.address || ''}</td>
            <td>${pharmacist.user?.createdAt ? new Date(pharmacist.user.createdAt).toLocaleDateString('ar-EG') : ''}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deletePharmacist(${pharmacist.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="${url}?id=${pharmacist.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
            </td>
        `;
        pharmacistsTableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedPharmacists.length}</b> من <b>${pharmacists.length}</b> إدخالات`;
    }
}

// وظيفة لإعداد التقليب (نفسها)
function setupPagination(totalCount = null) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';

    const total = totalCount || pharmacists.length;
    const totalPages = Math.ceil(total / pharmacistsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

// وظيفة لتغيير الصفحة (نفسها)
function changePage(page) {
    currentPage = page;
    displayPharmacists();
    setupPagination();
}

// وظيفة للبحث عن الصيادلة (نفسها)
function searchPharmacists() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase();
    let filteredPharmacists = [];
    
    if (searchColumn === "address" || searchColumn === "name") {
        filteredPharmacists = pharmacists.filter(pharmacist => {
            return (pharmacist.pharmacy?.[searchColumn] || '').toLowerCase().includes(searchValue);
        });
    } else if (searchColumn === "licenseNumber") {
        filteredPharmacists = pharmacists.filter(pharmacist => {
            return (pharmacist[searchColumn] || '').toLowerCase().includes(searchValue);
        });
    } else {
        filteredPharmacists = pharmacists.filter(pharmacist => {
            return (pharmacist.user?.[searchColumn] || '').toLowerCase().includes(searchValue);
        });
    }
    
    console.log("filter", filteredPharmacists);
    
    const pharmacistsTableBody = document.getElementById('pharmacistsTableBody');
    if (!pharmacistsTableBody) return;
    
    pharmacistsTableBody.innerHTML = '';
    currentPage = 1;
    
    const start = (currentPage - 1) * pharmacistsPerPage;
    const end = start + pharmacistsPerPage;
    const paginatedPharmacists = filteredPharmacists.slice(start, end);

    paginatedPharmacists.forEach(pharmacist => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pharmacist.id}</td>
            <td>${pharmacist.licenseNumber || ''}</td>
            <td>${pharmacist.user?.fullName || ''}</td>
            <td>${pharmacist.user?.email || ''}</td>
            <td>${pharmacist.pharmacy?.name || ''}</td>
            <td>${pharmacist.pharmacy?.address || ''}</td>
            <td>${pharmacist.user?.createdAt ? new Date(pharmacist.user.createdAt).toLocaleDateString('ar-EG') : ''}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deletePharmacist(${pharmacist.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="EditPharmacist.html?id=${pharmacist.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
            </td>
        `;
        pharmacistsTableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedPharmacists.length}</b> من <b>${filteredPharmacists.length}</b> إدخالات`;
    }
    
    setupPagination(filteredPharmacists.length);
}

// وظيفة لتحديد العمود الذي سيتم البحث فيه (نفسها)
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    if (columnSelect) {
        searchColumn = columnSelect.value;
        searchPharmacists();
    }
}

// ✅ 2. وظيفة لحذف الصيدلي (معدلة)
async function deletePharmacist(pharmacistId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا الصيدلي؟");
    if (!confirmDelete) return;
    
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Pharmacist/${pharmacistId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            pharmacists = pharmacists.filter(pharmacist => pharmacist.id !== pharmacistId);
            displayPharmacists();
            setupPagination();
            showSuccess('تم حذف الصيدلي بنجاح');
        } else {
            throw new Error('فشل في حذف الصيدلي');
        }
    } catch (error) {
        console.error('خطأ في حذف الصيدلي:', error);
        showError('حدث خطأ أثناء حذف الصيدلي');
    }
}

//  3. دالة إضافة الصيدلي (صيدلي) (معدلة)
async function addPharmacist() {
    if (!validateForm()) {
        return;
    }

    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const pharmacyId = document.getElementById('Pharmacy')?.value;
    const licenseNumber = document.getElementById('licenseNumber')?.value;

    try {
    const response = await fetchWithAuth('https://localhost:7219/api/Pharmacist/CreatePharmacist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullName,
            email,
            password,
            pharmacyId,
            licenseNumber
        })
    });

        if (!response.ok) {
            throw new Error('فشل التسجيل');
        }

        const createdUser = await response.json();
        window.history.back();

    } catch (error) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.style.display = "block";
            errorMsg.textContent = error.message;
        }
    }
}



// ✅ 5. دالة جلب الصيدليات (معدلة)
async function fetchPharmacies() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Pharmacy/All', {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error("فشل جلب قائمة الصيدليات");
        
        const pharmacies = await response.json();
        const select = document.getElementById('Pharmacy');
        if (!select) return;
        
        select.innerHTML = '<option value="">اختر صيدلية</option>';
        
        pharmacies.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('خطأ في جلب بيانات الصيدليات:', error);
        showError(error.message);
    }
}

// ✅ 6. دالة جلب تفاصيل صيدلي للتعديل (معدلة)
async function fetchPharmacistDetails(id) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Pharmacist/${id}`, {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error("فشل في جلب بيانات الصيدلي");

        const pharmacist = await response.json();
        
        const fullNameField = document.getElementById('fullName');
        const emailField = document.getElementById('email');
        const licenseNumberField = document.getElementById('licenseNumber');
        const pharmacyField = document.getElementById('Pharmacy');
        
        if (fullNameField) fullNameField.value = pharmacist.user?.fullName || '';
        if (emailField) emailField.value = pharmacist.user?.email || '';
        if (licenseNumberField) licenseNumberField.value = pharmacist.licenseNumber || '';
        if (pharmacyField) pharmacyField.value = pharmacist.pharmacyId || '';
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}


// ✅ 8. دالة تحديث الصيدلي (معدلة)
async function updatePharmacist() {
    const pharmacistId = new URLSearchParams(window.location.search).get('id');
    const submitBtn = document.getElementById("submitBtn");
    
    if (submitBtn) submitBtn.disabled = true;

    if (!validateForm()) {
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const pharmacyId = document.getElementById('Pharmacy')?.value;
    const licenseNumber = document.getElementById('licenseNumber')?.value.trim();

    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Pharmacist/${pharmacistId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                 fullName,
                 email,
                licenseNumber,
                pharmacyId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "فشل تعديل بيانات الصيدلي.");
        }

        const updatedPharmacist = await response.json();
        
        window.history.back();

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ✅ 9. دالة جلب صيادلة حسب الصيدلية (معدلة)
async function GetPharmacistsByPharmacyId(PharmacyId) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Pharmacist/GetByPharmacyIdAsync/${PharmacyId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        
        pharmacists = await response.json();
        displayPharmacists();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        showError('حدث خطأ أثناء جلب البيانات');
    }
}

// ✅ 10. دوال مساعدة
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = "block";
        errorDiv.textContent = message;
        setTimeout(() => {
            errorDiv.style.display = "none";
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = "block";
        setTimeout(() => {
            successDiv.style.display = "none";
        }, 3000);
    } else {
        alert(message);
    }
}

function validateForm() {
    // دالة التحقق من الصحة (ضعها حسب احتياجاتك)
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const licenseNumber = document.getElementById('licenseNumber')?.value.trim();
    const pharmacyId = document.getElementById('Pharmacy')?.value;
    
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
    }
    
    if (!licenseNumber) {
        const errorEl = document.getElementById('licenseNumberError');
        if (errorEl) errorEl.textContent = 'رقم الترخيص مطلوب';
        isValid = false;
    }
    
    if (!pharmacyId) {
        const errorEl = document.getElementById('PharmacyError');
        if (errorEl) errorEl.textContent = 'يجب اختيار الصيدلية';
        isValid = false;
    }
    
    return isValid;
}