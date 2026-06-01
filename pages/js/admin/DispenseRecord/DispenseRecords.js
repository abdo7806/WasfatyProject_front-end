let dispenseRecords = [];
let currentPage = 1;
const itemsPerPage = 5;

// ✅ 1. جلب سجلات الصرف (معدل)
async function fetchDispenseRecords() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/DispenseRecord/All', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        
        dispenseRecords = await response.json();
        displayDispenseRecords(dispenseRecords);
        setupPagination(dispenseRecords);
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        showError('حدث خطأ أثناء جلب بيانات سجلات الصرف');
    }
}

// عرض سجلات الصرف (نفسها مع تحسينات)
function displayDispenseRecords(data) {
    const tableBody = document.getElementById('dispenseTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = data.slice(start, end);

    paginated.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.id}${'</td>'}
            <td>${record.prescriptionId}${'</td>'}
            <td>${record.pharmacistId || ''}${'</td>'}
            <td>${record.pharmacist?.user?.fullName || '—'}${'</td>'}
            <td>${record.pharmacyId || ''}${'</td>'}
            <td>${record.pharmacy?.name || '—'}${'</td>'}
            <td>${record.prescription?.doctorId || '—'}${'</td>'}
            <td>${record.prescription?.doctor?.user?.fullName || '—'}${'</td>'}
            <td>${record.prescription?.patientId || '—'}${'</td>'}
            <td>${record.prescription?.patient?.user?.fullName || '—'}${'</td>'}
            <td>${record.dispensedDate ? new Date(record.dispensedDate).toLocaleDateString() : '—'}${'</td>'}
            <td>
                <a href="DetailsDispenseRecord.html?id=${record.id}" class="btn btn-info btn-action" title="عرض">
                    <i class="fas fa-eye"></i>
                </a>
                <button class="btn btn-danger btn-action" onclick="deleteDispenseRecord(${record.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
                <a href="EditDispenseRecord.html?id=${record.id}" class="btn btn-primary btn-action" title="تعديل">
                    <i class="fas fa-edit"></i>
                </a>
             ${'</td>'}
        `;
        tableBody.appendChild(row);
    });

    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginated.length}</b> من <b>${data.length}</b> إدخالات`;
    }
}

// إعداد التقليب (نفسها)
function setupPagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';

    const totalPages = Math.ceil(data.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

// تغيير الصفحة (معدلة)
function changePage(page) {
    currentPage = page;
    const searchInput = document.getElementById('searchInput')?.value.trim() || '';
    const filtered = searchInput ? filterDispenseRecords(searchInput) : dispenseRecords;
    displayDispenseRecords(filtered);
    setupPagination(filtered);
}

// ✅ 2. حذف سجل صرف (معدل)
async function deleteDispenseRecord(id) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا السجل؟");
    if (!confirmDelete) return;
    
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/DispenseRecord/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            dispenseRecords = dispenseRecords.filter(r => r.id !== id);
            const searchInput = document.getElementById('searchInput')?.value.trim() || '';
            const filtered = searchInput ? filterDispenseRecords(searchInput) : dispenseRecords;
            displayDispenseRecords(filtered);
            setupPagination(filtered);
            showSuccess('تم حذف السجل بنجاح');
        } else {
            throw new Error('فشل في حذف السجل');
        }
    } catch (error) {
        console.error('خطأ في حذف السجل:', error);
        showError('حدث خطأ أثناء حذف السجل');
    }
}

// البحث في السجلات (نفسها مع تحسينات)
function searchDispenseRecords() {
    currentPage = 1;
    const searchInput = document.getElementById('searchInput')?.value.trim() || '';
    const filtered = searchInput ? filterDispenseRecords(searchInput) : dispenseRecords;
    displayDispenseRecords(filtered);
    setupPagination(filtered);
}

// فلترة السجلات (معدلة)
function filterDispenseRecords(searchInput) {
    const lowerInput = searchInput.toLowerCase();
    const column = document.getElementById('searchColumn')?.value || 'all';

    return dispenseRecords.filter(record => {
        switch (column) {
            case 'id':
                return record.id?.toString().includes(lowerInput);
            case 'prescriptionId':
                return record.prescriptionId?.toString().includes(lowerInput);
            case 'pharmacistName':
                return record.pharmacist?.user?.fullName?.toLowerCase().includes(lowerInput);
            case 'pharmacyName':
                return record.pharmacy?.name?.toLowerCase().includes(lowerInput);
            case 'dispensedDate':
                return record.dispensedDate && new Date(record.dispensedDate).toLocaleDateString().includes(lowerInput);
            case 'doctor':
                return record.prescription?.doctor?.user?.fullName?.toString().toLowerCase().includes(lowerInput);
            case 'patient':
                return record.prescription?.patient?.user?.fullName?.toString().toLowerCase().includes(lowerInput);
            case 'all':
            default:
                return (
                    record.id?.toString().includes(lowerInput) ||
                    record.prescriptionId?.toString().includes(lowerInput) ||
                    record.pharmacist?.user?.fullName?.toLowerCase().includes(lowerInput) ||
                    record.pharmacy?.name?.toLowerCase().includes(lowerInput) ||
                    (record.dispensedDate && new Date(record.dispensedDate).toLocaleDateString().includes(lowerInput))
                );
        }
    });
}

// ✅ 3. دوال مساعدة
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