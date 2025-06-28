    // DOM Elements
        const elements = {
            loading: document.getElementById('loading-indicator'),
            error: document.getElementById('error-alert'),
            filtersSection: document.getElementById('filters-section'),
            historyContent: document.getElementById('history-content'),
            historyList: document.getElementById('history-list'),
            noResults: document.getElementById('no-results'),
            totalCount: document.getElementById('total-count'),
            pagination: document.getElementById('pagination'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            exportBtn: document.getElementById('export-btn'),
            tryAgainBtn: document.getElementById('try-again-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            dateFilter: document.getElementById('date-filter'),
            patientFilter: document.getElementById('patient-filter'),
            doctorFilter: document.getElementById('doctor-filter'),
            statusFilter: document.getElementById('status-filter'),
            resetFilters: document.getElementById('reset-filters'),
            applyFilters: document.getElementById('apply-filters')
        };

        // App State
        const state = {
            dispenseRecord: [],
            filtereddispenseRecord: [],
            currentPage: 1,
            itemsPerPage: 10,
            filters: {
                date: 'all',
                patient: '',
                doctor: '',
                status: 'all'
            }
        };

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            // Check authentication
        checkAccess(['Pharmacist'], '../../../shared/unauthorized.html');

            
            // Load initial data
            fetchDispensedPrescriptions();
            
            // Event listeners
            setupEventListeners();
        });

        // Fetch Dispensed Prescriptions
        async function fetchDispensedPrescriptions() {
            try {
                showLoading();
                        const pharmacistData = JSON.parse(localStorage.getItem("PharmacistData"));
                
                const response = await axios.get(`https://localhost:7219/api/DispenseRecord/GetAllDispenseRecor/${pharmacistData.pharmacyId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                state.dispenseRecord = response.data;
								console.log("D=", state.dispenseRecord)
                state.filtereddispenseRecord = [...state.dispenseRecord];
								console.log(state.filtereddispenseRecord)
                
                renderHistoryList();
                
            } catch (error) {
                console.error('Error fetching prescriptions:', error);
                showError('حدث خطأ أثناء جلب سجل الصرف');
            } finally {
                hideLoading();
            }
        }

  // ...existing code...
function renderHistoryList() {
    elements.historyList.innerHTML = '';
    
    if (state.filtereddispenseRecord.length === 0) {
        elements.noResults.classList.remove('d-none');
        elements.historyContent.classList.add('d-none');
        elements.totalCount.textContent = '0';
        return;
    }
    
    elements.noResults.classList.add('d-none');
    elements.historyContent.classList.remove('d-none');
    
    // Pagination
    const totalPages = Math.ceil(state.filtereddispenseRecord.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const currentPrescriptions = state.filtereddispenseRecord.slice(startIndex, endIndex);
    
    // Update total count
    elements.totalCount.textContent = state.filtereddispenseRecord.length;
    
    // Render prescriptions
    currentPrescriptions.forEach(record => {
        // استخراج البيانات من المسارات الصحيحة
        const prescription = record.prescription || {};
        const patient = prescription.patient || {};
        const doctor = prescription.doctor || {};
        const pharmacist = record.pharmacist || {};
        const pharmacy = record.pharmacy || {};

        const prescriptionDate = new Date(record.dispensedDate);
        const formattedDate = prescriptionDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'col-12 mb-3';
         card.innerHTML = `
    <div class="card history-card shadow-sm">
        <div class="card-body">
            <div class="row">
                <div class="col-md-4">
                    <h5 class="card-title">رقم الوصفة: <span class="text-primary">${prescription.id || '--'}</span></h5>
                    <h6 class="card-subtitle mb-2 text-muted">${patient.user ? patient.user.fullName : 'غير معروف'}</h6>
                    <p class="card-text text-muted">
                        <i class="fas fa-id-card me-1"></i> ${patient.id || '--'}
                    </p>
                </div>
                <div class="col-md-4">
                    <p class="card-text">
                        <i class="fas fa-user-md me-1"></i> ${doctor.user ? doctor.user.fullName : 'غير معروف'}
                    </p>
                    <p class="card-text">
                        <i class="fas fa-calendar-alt me-1"></i> ${formattedDate}
                    </p>
                </div>
                <div class="col-md-4">
                    <span class="badge badge-pill badge-info me-1 mb-1">
                        ${pharmacy.name || 'غير معروف'}
                    </span>
                    <p class="card-text">
                        <strong>حالة الوصفة:</strong> 
                        <span class="${prescription.isDispensed ? 'text-success' : 'text-danger'}">
                            ${prescription.isDispensed ? 'مصروفه' : 'غير مصروفه'}
                        </span>
                    </p>
                </div>
            </div>
            <div class="text-end mt-3">
                <button class="btn btn-outline-primary btn-sm view-details-btn" 
                    data-id="${prescription.id}">
                    <i class="fas fa-eye me-1"></i> التفاصيل
                </button>
            </div>
        </div>
    </div>
`;
        elements.historyList.appendChild(card);
    });
    
    // Render pagination
    renderPagination(totalPages);
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', () => showPrescriptionDetails(btn.dataset.id));
    });
}
// ...existing code...
        // Show Prescription Details
function showPrescriptionDetails(prescriptionId) {
    // ابحث عن السجل في بيانات الصرف
    const record = state.dispenseRecord.find(r => r.prescription && r.prescription.id == prescriptionId);
    if (!record) {
        Swal.fire('خطأ', 'لم يتم العثور على تفاصيل الوصفة', 'error');
        return;
    }

    const prescription = record.prescription || {};
    const patient = prescription.patient || {};
    const doctor = prescription.doctor || {};
    const pharmacist = record.pharmacist || {};
    const pharmacy = record.pharmacy || {};

    // تعبئة بيانات المريض
    document.getElementById('patient-name').textContent = patient.user ? patient.user.fullName : 'غير معروف';
    document.getElementById('patient-id').textContent = patient.id || '--';
    document.getElementById('patient-age').textContent = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : '--';

    // تعبئة بيانات الصرف
    document.getElementById('prescription-id').textContent = prescription.id || '--';
    document.getElementById('dispensed-date').textContent = record.dispensedDate ? new Date(record.dispensedDate).toLocaleDateString('ar-EG') : '--';
    document.getElementById('pharmacist-name').textContent = pharmacist.user ? pharmacist.user.fullName : 'غير معروف';
    document.getElementById('pharmacy-name').textContent = pharmacy.name || 'غير معروف';

    // ملاحظات الطبيب (إذا وجدت)
    document.getElementById('doctor-notes').textContent = prescription.notes || 'لا توجد ملاحظات';




    console.log("data1", prescription.prescriptionItems)

    // قائمة الأدوية
    const medicationsList = document.getElementById('medications-list');
    medicationsList.innerHTML = '';
    if (Array.isArray(prescription.prescriptionItems) && prescription.prescriptionItems.length > 0) {
        prescription.prescriptionItems.forEach(async (item) => {
    console.log("data2", item)
                if(!item.medicationId) {

                                const medItem = document.createElement('div');
            medItem.className = 'list-group-item';
            medItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                                <small class="badge bg-info ms-2">مخصص</small>
                    
                        <h6 class="mb-1">${ item.medicationName || 'دواء غير معروف'}</h6>
                        <small class="text-muted">الجرعة: ${item.dosage || '--'} | التكرار: ${item.frequency || '--'}</small>
                    </div>
                    <span class="badge bg-secondary">${item.duration || '--'} يوم</span>
                </div>
            `;
            medicationsList.appendChild(medItem);
                    }
                    else{

                    const response = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    const medication = await response.json();
    console.log("medication", medication)

            const medItem = document.createElement('div');
            medItem.className = 'list-group-item';
            medItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${ medication.name || 'دواء غير معروف'}</h6>
                        <small class="text-muted">الجرعة: ${item.dosage || '--'} | التكرار: ${item.frequency || '--'}</small>
                    </div>
                    <span class="badge bg-secondary">${item.duration || '--'} يوم</span>
                </div>
            `;
            medicationsList.appendChild(medItem);
        }
        });


			

										
    } else {
        medicationsList.innerHTML = '<div class="text-muted">لا توجد أدوية</div>';
    }

    document.getElementById('medications-count').textContent = 
        `${prescription.prescriptionItems ? prescription.prescriptionItems.length : 0} دواء`;

    // زر الطباعة
    document.getElementById('print-btn').onclick = () => printPrescription(record);

    // عرض المودال
    const modal = new bootstrap.Modal(document.getElementById('prescriptionDetailsModal'));
    modal.show();
}
        // Print Prescription
        function printPrescription(record) {
    const prescription = record.prescription || {};
    const patient = prescription.patient || {};
    const doctor = prescription.doctor || {};
    const pharmacist = record.pharmacist || {};
    const pharmacy = record.pharmacy || {};

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <title>وصفة طبية #${prescription.id || '--'}</title>
            <style>
                body {
                    font-family: 'Tajawal', sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 10px;
                }
                .section {
                    margin-bottom: 15px;
                }
                .medication-item {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 5px;
                }
                .signature-area {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
                @media print {
                    body {
                        padding: 0 !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>وصفة طبية #${prescription.id || '--'}</h2>
                <p>تاريخ الصرف: ${record.dispensedDate ? new Date(record.dispensedDate).toLocaleDateString('ar-EG') : '--'}</p>
                <p>الصيدلية: ${pharmacy.name || 'غير معروف'}</p>
            </div>
            
            <div class="section">
                <h3>معلومات المريض:</h3>
                <p><strong>الاسم:</strong> ${patient.user ? patient.user.fullName : '--'}</p>
                <p><strong>رقم الهوية:</strong> ${patient.id || '--'}</p>
                <p><strong>العمر:</strong> ${patient.dateOfBirth ? calculateAge(patient.dateOfBirth) + ' سنة' : '--'}</p>
            </div>
            
            <div class="section">
                <h3>الأدوية الموصوفة:</h3>
                ${
                    Array.isArray(prescription.prescriptionItems) && prescription.prescriptionItems.length > 0
                    ? prescription.prescriptionItems.map(item => `
                        <div class="medication-item">
                            <p><strong>${item.medication ? item.medication.name : 'دواء غير معروف'}</strong></p>
                            <p>الجرعة: ${item.dosage || '--'} | التكرار: ${item.frequency || '--'} | المدة: ${item.duration || '--'} يوم</p>
                            ${item.notes ? `<p><small>ملاحظات: ${item.notes}</small></p>` : ''}
                        </div>
                    `).join('')
                    : '<div class="text-muted">لا توجد أدوية</div>'
                }
            </div>
            
            <div class="signature-area">
                <div>
                    <p>توقيع الطبيب: ___________________</p>
                    <p>الاسم: د. ${doctor.user ? doctor.user.fullName : '--'}</p>
                </div>
                <div>
                    <p>توقيع الصيدلي: ___________________</p>
                    <p>الاسم: ${pharmacist.user ? pharmacist.user.fullName : 'غير معروف'}</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

  function applyFilters() {
    state.filtereddispenseRecord = state.dispenseRecord.filter(record => {
        const prescription = record.prescription || {};
        const patient = prescription.patient || {};
        const doctor = prescription.doctor || {};

        // Date filter
        const prescriptionDate = new Date(record.dispensedDate);
        const now = new Date();

        if (state.filters.date === 'today' && !isSameDay(prescriptionDate, now)) return false;
        if (state.filters.date === 'week' && !isSameWeek(prescriptionDate, now)) return false;
        if (state.filters.date === 'month' && !isSameMonth(prescriptionDate, now)) return false;

        // Patient filter
        if (
            state.filters.patient &&
            !(patient.user && patient.user.fullName && patient.user.fullName.toLowerCase().includes(state.filters.patient.toLowerCase()))
        ) {
            return false;
        }

        // Doctor filter
        if (
            state.filters.doctor &&
            !(doctor.user && doctor.user.fullName && doctor.user.fullName.toLowerCase().includes(state.filters.doctor.toLowerCase()))
        ) {
            return false;
        }

        // Status filter (حسب بياناتك، فقط dispensed متوفر)
        if (state.filters.status === 'dispensed' && prescription.isDispensed !== true) return false;
        // إذا أضفت حالات أخرى مثل isCancelled عدل هنا

        return true;
    });

    state.currentPage = 1;
    renderHistoryList();
}
        // Helper Functions
        function calculateAge(birthDate) {
            const diff = Date.now() - new Date(birthDate).getTime();
            const ageDate = new Date(diff);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        }
        
        function isSameDay(date1, date2) {
            return date1.getFullYear() === date2.getFullYear() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getDate() === date2.getDate();
        }
        
        function isSameWeek(date1, date2) {
            const oneDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.abs((date1 - date2) / oneDay);
            return diffDays < 7;
        }
        
        function isSameMonth(date1, date2) {
            return date1.getFullYear() === date2.getFullYear() &&
                   date1.getMonth() === date2.getMonth();
        }
        
        function showLoading() {
            elements.loading.classList.remove('d-none');
            elements.error.classList.add('d-none');
            elements.filtersSection.classList.add('d-none');
            elements.historyContent.classList.add('d-none');
            elements.noResults.classList.add('d-none');
        }
        
        function hideLoading() {
            elements.loading.classList.add('d-none');
            elements.filtersSection.classList.remove('d-none');
        }
        
        function showError(message) {
            elements.error.classList.remove('d-none');
            elements.error.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
        }
        
        function renderPagination(totalPages) {
            elements.pagination.innerHTML = '';
            
            if (totalPages <= 1) return;
            
            // Previous button
            const prevLi = document.createElement('li');
            prevLi.className = `page-item ${state.currentPage === 1 ? 'disabled' : ''}`;
            prevLi.innerHTML = `
                <a class="page-link" href="#" aria-label="السابق">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            `;
            prevLi.addEventListener('click', (e) => {
                e.preventDefault();
                if (state.currentPage > 1) {
                    state.currentPage--;
                    renderHistoryList();
                }
            });
            elements.pagination.appendChild(prevLi);
            
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const pageLi = document.createElement('li');
                pageLi.className = `page-item ${state.currentPage === i ? 'active' : ''}`;
                pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
                pageLi.addEventListener('click', (e) => {
                    e.preventDefault();
                    state.currentPage = i;
                    renderHistoryList();
                });
                elements.pagination.appendChild(pageLi);
            }
            
            // Next button
            const nextLi = document.createElement('li');
            nextLi.className = `page-item ${state.currentPage === totalPages ? 'disabled' : ''}`;
            nextLi.innerHTML = `
                <a class="page-link" href="#" aria-label="التالي">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            `;
            nextLi.addEventListener('click', (e) => {
                e.preventDefault();
                if (state.currentPage < totalPages) {
                    state.currentPage++;
                    renderHistoryList();
                }
            });
            elements.pagination.appendChild(nextLi);
        }
        
        function setupEventListeners() {
            // Search
            elements.searchBtn.addEventListener('click', () => {
    const searchTerm = elements.searchInput.value.trim();
    if (searchTerm) {
        state.filtereddispenseRecord = state.dispenseRecord.filter(p =>
            p.prescription && p.prescription.id && p.prescription.id.toString().includes(searchTerm)
        );
    } else {
        state.filtereddispenseRecord = [...state.dispenseRecord];
    }
    renderHistoryList();
});
            
            // Export
            elements.exportBtn.addEventListener('click', exportToExcel);
            
            // Try again
            elements.tryAgainBtn.addEventListener('click', fetchDispensedPrescriptions);
            
            // Logout
            elements.logoutBtn.addEventListener('click', logout);
            
            // Filters
            elements.dateFilter.addEventListener('change', (e) => {
                state.filters.date = e.target.value;
            });
            
            elements.patientFilter.addEventListener('input', (e) => {
                state.filters.patient = e.target.value;
            });
            
            elements.doctorFilter.addEventListener('input', (e) => {
                state.filters.doctor = e.target.value;
            });
            
            elements.statusFilter.addEventListener('change', (e) => {
                state.filters.status = e.target.value;
            });
            
            elements.resetFilters.addEventListener('click', () => {
                elements.dateFilter.value = 'all';
                elements.patientFilter.value = '';
                elements.doctorFilter.value = '';
                elements.statusFilter.value = 'all';
                state.filters = {
                    date: 'all',
                    patient: '',
                    doctor: '',
                    status: 'all'
                };
                applyFilters();
            });
            
            elements.applyFilters.addEventListener('click', applyFilters);
        }
        
        function exportToExcel() {
            // This would typically call your backend to generate an Excel file
            Swal.fire({
                title: 'جاري التصدير',
                text: 'سيتم تحميل ملف Excel خلال لحظات',
                icon: 'info',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Simulate export (in a real app, this would be an API call)
            setTimeout(() => {
               /* const data = state.filtereddispenseRecord.map(p => ({
                    'رقم الوصفة': p.id,
                    'اسم المريض': p.prescription.patient.user.fullName,
                    'رقم الهوية': p.prescription.patient.id,
                    'اسم الطبيب': p.prescription.doctor.user.fullName,
                    'تاريخ الصرف': new Date(p.dispensedDate).toLocaleDateString('ar-EG'),
                    'عدد الأدوية': p.prescriptionItems.length,
                    'الحالة': p.isDispensed  ? 'ملغية' : 'تم الصرف'
                }));*/
                

                // ...داخل exportToExcel...
const data = state.filtereddispenseRecord.map(p => ({
    'رقم الوصفة': p.prescription ? p.prescription.id : '--',
    'اسم المريض': p.prescription && p.prescription.patient && p.prescription.patient.user ? p.prescription.patient.user.fullName : '--',
    'رقم الهوية': p.prescription && p.prescription.patient ? p.prescription.patient.id : '--',
    'اسم الطبيب': p.prescription && p.prescription.doctor && p.prescription.doctor.user ? p.prescription.doctor.user.fullName : '--',
    'تاريخ الصرف': p.dispensedDate ? new Date(p.dispensedDate).toLocaleDateString('ar-EG') : '--',
    'عدد الأدوية': p.prescription && Array.isArray(p.prescription.prescriptionItems) ? p.prescription.prescriptionItems.length : 0,
    'الحالة': (p.prescription && p.prescription.isDispensed) ? 'تم الصرف' : 'غير معروف'
}));
                // In a real app, you would send this data to your backend
                console.log('Data to export:', data);
                
                Swal.fire(
                    'تم التصدير',
                    'تم إنشاء ملف Excel بنجاح',
                    'success'
                );
            }, 2000);
        }
        
        function logout() {
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
            localStorage.removeItem('PharmacistData');
            window.location.href = '../../auth/login.html';
                }
            });
        }