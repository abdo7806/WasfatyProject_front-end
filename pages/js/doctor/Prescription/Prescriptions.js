$(document).ready(function() {
    // إغلاق القائمة الجانبية تلقائياً على الهواتف
    if ($(window).width() < 768) {
        $('body').addClass('sidebar-collapse');
    }

    // إعادة حساب الأبعاد عند تغيير حجم النافذة
    $(window).resize(function() {
        if ($(window).width() < 768) {
            $('body').addClass('sidebar-collapse');
        } else {
            $('body').removeClass('sidebar-collapse');
        }
    });

    // زر إنشاء وصفة جديدة
    $('.new-prescription-btn').click(function() {
        window.location.href = './Doctor/Doctors.html';
    });
});

// تخزين الوصفات في المتغير لتصفية البحث لاحقاً
let prescriptions = [];
let currentPage = 1;
const prescriptionsPerPage = 5;

// ✅ 1. تحميل الوصفات (معدل)
async function loadPrescriptions() {
    let doctorData = JSON.parse(localStorage.getItem("doctorData"));
    const doctorId = doctorData?.id;

    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Prescription/MyPrescriptions', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('فشل في تحميل الوصفات');
        }

        prescriptions = await response.json();
        displayPrescriptions(prescriptions);
        setupPagination();
    } catch (error) {
        console.error('حدث خطأ أثناء جلب البيانات:', error);
        showMessage('حدث خطأ أثناء تحميل الوصفات', true);
    }
}

// عرض الوصفات في الجدول
function displayPrescriptions(data) {
    const tableBody = document.getElementById('prescription-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * prescriptionsPerPage;
    const end = start + prescriptionsPerPage;
    const paginatedprescriptions = data.slice(start, end);

    paginatedprescriptions.forEach(prescription => {
        const row = document.createElement('tr');


        row.innerHTML = `
            <td>${prescription.id}${'</td>'}
            <td>${prescription.patient?.user?.fullName || '—'}</td>
            <td>${prescription.doctor?.user?.fullName || '—'}</td>
            <td>${prescription.prescriptionItems?.length || 0}</td>
            <td>${prescription.issuedDate ? new Date(prescription.issuedDate).toLocaleDateString() : '—'}</td>
            <td>${prescription.isDispensed ? 'نعم' : 'لا'}</td>
            <td>
                <a href="./DetailsPrescription.html?id=${prescription.id}" class="btn btn-info btn-action" title="عرض">
                    <i class="fas fa-eye"></i>
                </a>
                <button class="btn btn-danger btn-action" onclick="deletePrescription(${prescription.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="./EditPrescription.html?id=${prescription.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
		         </td>
        `;
        tableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedprescriptions.length}</b> من <b>${data.length}</b> إدخالات`;
    }
}

// ✅ 2. حذف وصفة (معدل)
async function deletePrescription(prescriptionId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذه الوصفة؟");
    if (!confirmDelete) return;
    
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            prescriptions = prescriptions.filter(prescription => prescription.id !== prescriptionId);
            displayPrescriptions(prescriptions);
            setupPagination();
            showMessage('تم حذف الوصفة بنجاح', false);
        } else {
            throw new Error('فشل في حذف الوصفة');
        }
    } catch (error) {
        console.error('خطأ في حذف الوصفة:', error);
        showMessage('حدث خطأ أثناء حذف الوصفة', true);
    }
}

// وظيفة لإعداد التقليب
function setupPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';

    const totalPages = Math.ceil(prescriptions.length / prescriptionsPerPage);

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
    displayPrescriptions(prescriptions);
    setupPagination();
}

// ✅ 3. تصفية الوصفات بناءً على البحث (معدلة)
function searchPrescriptions() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase();
    const filteredPrescriptions = prescriptions.filter(prescription => {
        return (
            prescription.id?.toString().includes(searchValue) ||
            prescription.patient?.user?.fullName?.toLowerCase().includes(searchValue) ||
            prescription.doctor?.user?.fullName?.toLowerCase().includes(searchValue) ||
            (prescription.prescriptionItems?.length || 0).toString().includes(searchValue)
        );
    });

    currentPage = 1;
    displayPrescriptions(filteredPrescriptions);
    
    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${Math.min(filteredPrescriptions.length, prescriptionsPerPage)}</b> من <b>${filteredPrescriptions.length}</b> إدخالات (نتائج البحث)`;
    }
    
    setupPaginationForFiltered(filteredPrescriptions);
}

// ✅ 4. إعداد التقليب للنتائج المفلترة
function setupPaginationForFiltered(filteredData) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / prescriptionsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="changePageToFiltered(${i}, filteredData)">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

// ✅ 5. تغيير الصفحة للنتائج المفلترة
function changePageToFiltered(page, filteredData) {
    currentPage = page;
    displayPrescriptions(filteredData);
    setupPaginationForFiltered(filteredData);
}

// ✅ 6. دالة عرض الرسائل
function showMessage(message, isError) {
    const messageBox = document.getElementById('message');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        messageBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// تحميل الوصفات عند تحميل الصفحة
window.onload = loadPrescriptions;