let patientId;
let doctorData = JSON.parse(localStorage.getItem("doctorData"));
let allPrescriptions = [];
let filteredPrescriptions = [];

// ✅ 1. تحميل بيانات المريض والوصفات (معدل)
async function loadPatientData(id) {
    try {
        console.log('بدء تحميل البيانات...');
        showLoading(true);

        console.log('جاري جلب الوصفات الطبية...');
        const prescriptionsResponse = await fetchWithAuth('https://localhost:7219/api/Prescription/MyPrescriptions', {
            method: 'GET'
        });
        
        console.log('تم جلب الوصفات الطبية');

        if (!prescriptionsResponse.ok) {
            throw new Error('فشل في تحميل الوصفات الطبية');
        }

        allPrescriptions = await prescriptionsResponse.json();
        filteredPrescriptions = [...allPrescriptions];

        if (allPrescriptions.length === 0) {
            showMessage('لا توجد وصفات طبية لهذا المريض', false);
            document.getElementById('prescriptions-list').innerHTML = `
                <div class="no-prescriptions">
                    <p>لا توجد وصفات طبية مسجلة لهذا المريض</p>
                </div>
            `;
            document.getElementById('stats-section').classList.add('d-none');
            return;
        }

        const patient = allPrescriptions[0].patient;
        displayPatientInfo(patient);
        updateStats(allPrescriptions);
        setupEventListeners();
        displayAllPrescriptions();
        
    } catch (error) {
        console.error('Error loading patient data:', error);
        showMessage(error.message, true);
        document.getElementById('prescriptions-list').innerHTML = `
            <div class="no-prescriptions">
                <p>حدث خطأ أثناء تحميل البيانات</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

function displayPatientInfo(patient) {
    const patientName = document.getElementById('patient-name');
    const patientEmail = document.getElementById('patient-email');
    const patientBlood = document.getElementById('patient-blood');
    const patientDob = document.getElementById('patient-dob');
    const patientGender = document.getElementById('patient-gender');
    const patientIdEl = document.getElementById('patient-id');
    
    if (patientName) patientName.textContent = patient.user?.fullName || '—';
    if (patientEmail) patientEmail.textContent = patient.user?.email || 'غير متوفر';
    if (patientBlood) patientBlood.textContent = patient.bloodType || 'غير محدد';
    if (patientDob) patientDob.textContent = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'غير متوفر';
    if (patientGender) patientGender.textContent = patient.gender === 'Male' ? 'ذكر' : patient.gender === 'Female' ? 'أنثى' : 'غير محدد';
    if (patientIdEl) patientIdEl.textContent = patient.id;
}

function updateStats(prescriptions) {
    const total = prescriptions.length;
    const dispensed = prescriptions.filter(p => p.isDispensed).length;
    
    const totalEl = document.getElementById('total-prescriptions');
    const dispensedEl = document.getElementById('dispensed-prescriptions');
    const pendingEl = document.getElementById('pending-prescriptions');
    
    if (totalEl) totalEl.textContent = total;
    if (dispensedEl) dispensedEl.textContent = dispensed;
    if (pendingEl) pendingEl.textContent = total - dispensed;
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
    
    applyFilters();
}

function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilterValue = statusFilter ? statusFilter.value : 'all';
    const dateOrder = dateFilter ? dateFilter.value : 'newest';
    
    filteredPrescriptions = allPrescriptions.filter(p => {
        const matchesSearch = p.doctor?.user?.fullName?.toLowerCase().includes(searchTerm) ||
                              formatDateTime(p.issuedDate).includes(searchTerm) ||
                              p.id == searchTerm;

        const matchesStatus = statusFilterValue === 'all' ||
                              (statusFilterValue === 'dispensed' && p.isDispensed) ||
                              (statusFilterValue === 'pending' && !p.isDispensed);

        return matchesSearch && matchesStatus;
    });

    filteredPrescriptions.sort((a, b) => {
        return dateOrder === 'newest' ?
            new Date(b.issuedDate) - new Date(a.issuedDate) :
            new Date(a.issuedDate) - new Date(b.issuedDate);
    });

    updateStats(filteredPrescriptions);
    displayAllPrescriptions();
}

// ✅ 2. عرض جميع الوصفات (معدل)
async function displayAllPrescriptions() {
    const prescriptionsList = document.getElementById('prescriptions-list');
    if (!prescriptionsList) return;

    if (filteredPrescriptions.length === 0) {
        prescriptionsList.innerHTML = `
            <div class="no-prescriptions">
                <p>لا توجد وصفات تطابق معايير البحث</p>
            </div>
        `;
        return;
    }

    let html = '';
    const medicationIds = [];

    for (const prescription of filteredPrescriptions) {
        if (prescription.prescriptionItems) {
            prescription.prescriptionItems.forEach(item => {
                if (item.medicationId && !medicationIds.includes(item.medicationId)) {
                    medicationIds.push(item.medicationId);
                }
            });
        }
    }

    let medications = {};
    if (medicationIds.length > 0) {
        try {
            const response = await fetchWithAuth(`https://localhost:7219/api/Medication/GetMultipleByIds?ids=${medicationIds.join(',')}`, {
                method: 'GET'
            });

            if (response.ok) {
                const meds = await response.json();
                meds.forEach(m => medications[m.id] = m);
            }
        } catch (error) {
            console.error('Error fetching medications:', error);
        }
    }

    for (const prescription of filteredPrescriptions) {
        html += `
            <div class="prescription-card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5>وصفة طبية #${prescription.id}</h5>
                    <div>
                        <span class="badge ${prescription.isDispensed ? 'bg-success' : 'bg-warning text-dark'} me-2">
                            ${prescription.isDispensed ? 'تم صرفها' : 'قيد الانتظار'}
                        </span>
                        <span class="text-muted">${formatDateTime(prescription.issuedDate)}</span>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>الطبيب:</strong> ${prescription.doctor?.user?.fullName || '—'}
                    </div>
                    <div class="col-md-6">
                        <strong>التخصص:</strong> ${prescription.doctor?.specialization || 'غير محدد'}
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>الأدوية الموصوفة:</h6>
                    <div class="mt-2">
                        ${await generateMedicationsList(prescription.prescriptionItems, medications)}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="printPrescription(${prescription.id})">
                        <i class="fas fa-print"></i> طباعة الوصفة
                    </button>
                </div>
            </div>
        `;
    }

    prescriptionsList.innerHTML = html;
}

async function generateMedicationsList(items, medicationsCache = {}) {
    if (!items || items.length === 0) {
        return '<p class="text-muted">لا توجد أدوية في هذه الوصفة</p>';
    }

    let html = '';

    for (const item of items) {
        if (item.medicationId) {
            const medication = medicationsCache[item.medicationId];
            html += `
                <div class="medication-item">
                    <i class="bi bi-capsule me-2"></i>
                    <div style="flex-grow: 1;">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${medication?.name || 'دواء غير معروف'}</strong>
                                <small class="text-muted ms-2">${medication?.strength || ''}</small>
                            </div>
                            <span>${medication?.dosageForm || ''}</span>
                        </div>
                        <div class="text-muted">
                            ${item.frequency ? item.frequency + ' مرات/يوم' : ''}
                            ${item.duration ? 'لمدة ' + item.duration : ''}
                        </div>
                        ${medication?.description ? `<div class="text-muted small mt-1">${medication.description}</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="medication-item">
                    <i class="bi bi-pencil-square me-2 text-primary"></i>
                    <div style="flex-grow: 1;">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${item.customMedicationName || 'دواء مخصص'}</strong>
                                <small class="badge bg-info ms-2">مخصص</small>
                            </div>
                            <span>${item.customDosageForm || ''}</span>
                        </div>
                        <div class="text-muted">
                            ${item.customStrength ? 'تركيز: ' + item.customStrength : ''}
                        </div>
                        <div class="text-muted">
                            ${item.frequency ? item.frequency + ' مرات/يوم' : ''}
                            ${item.duration ? 'لمدة ' + item.duration : ''}
                        </div>
                        ${item.customMedicationDescription ? `<div class="text-muted small mt-1">${item.customMedicationDescription}</div>` : ''}
                    </div>
                </div>
            `;
        }
    }

    return html;
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '—';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ar-EG');
}

function showLoading(isLoading) {
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('prescriptions-list');
    
    if (loadingElement && contentElement) {
        loadingElement.style.display = isLoading ? 'flex' : 'none';
        contentElement.style.opacity = isLoading ? '0.5' : '1';
    }
}

function showMessage(message, isError) {
    const messageBox = document.getElementById('error-message');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        messageBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
}

// ✅ 3. الحصول على وصفة حسب المعرف للطباعة (معدل)
async function getPrescriptionById(prescriptionId) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('فشل تحميل البيانات');

        const prescription = await response.json();

        const prescriptionIdEl = document.getElementById('prescription-id');
        const patientNameEl = document.getElementById('patient-name');
        const doctorNameEl = document.getElementById('doctor-name');
        const createdAtEl = document.getElementById('created-at');
        
        if (prescriptionIdEl) prescriptionIdEl.textContent = prescription.id;
        if (patientNameEl) patientNameEl.textContent = prescription.patient?.user?.fullName || '—';
        if (doctorNameEl) doctorNameEl.textContent = prescription.doctor?.user?.fullName || '—';
        if (createdAtEl) createdAtEl.textContent = new Date(prescription.issuedDate).toLocaleDateString('ar-EG');

        const selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
            if (!item.medicationId) {
                return {
                    id: item.id,
                    medicationId: item.medicationId,
                    medicationName: item.customMedicationName,
                    dosage: item.customDosageForm,
                    frequency: item.frequency,
                    duration: item.customStrength
                };
            }
            const res = await fetchWithAuth(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                method: 'GET'
            });
            const medication = await res.json();
            return {
                id: item.id,
                medicationId: item.medicationId,
                medicationName: medication.name,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration
            };
        }));

    } catch (error) {
        alert('حدث خطأ أثناء تحميل تفاصيل الوصفة');
        console.error(error);
    }
}

// ✅ 4. طباعة الوصفة (معدل)
async function printPrescription(prescriptionId) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('فشل تحميل البيانات');

        const prescription = await response.json();
        
        const enrichedItems = await Promise.all(prescription.prescriptionItems.map(async item => {
            if (!item.medicationId) {
                return {
                    id: item.id,
                    medicationId: item.medicationId,
                    medicationName: item.customMedicationName,
                    dosage: item.customDosageForm,
                    frequency: item.frequency,
                    duration: item.customStrength
                };
            }
            const res = await fetchWithAuth(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                method: 'GET'
            });
            const medication = await res.json();
            return {
                id: item.id,
                medicationId: item.medicationId,
                medicationName: medication.name,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration
            };
        }));
        
        const patient = prescription.patient || {};
        const doctor = prescription.doctor || {};
        const medicalCenter = prescription.doctor?.medicalCenter || {};
        
        const issuedDate = new Date(prescription.issuedDate);
        const formattedDate = issuedDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printWindow = window.open('', '_blank');
        
        let itemsHtml = '';
        if (enrichedItems && enrichedItems.length > 0) {
            itemsHtml = enrichedItems.map(item => `
                <div class="medication-item">
                    <p><strong>${item.medicationName || 'دواء غير معروف'}</strong></p>
                    <p>الجرعة: ${item.dosage || '--'} | التكرار: ${item.frequency || '--'} | المدة: ${item.duration || '--'} يوم</p>
                </div>
            `).join('');
        } else {
            itemsHtml = '<div class="text-muted">لا توجد أدوية</div>';
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>وصفة طبية #${prescription.id || '--'}</title>
                <style>
                    body {
                        font-family: 'Tajawal', Arial, sans-serif;
                        line-height: 1.6;
                        padding: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    .info-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                    }
                    .info-box {
                        flex: 1;
                        padding: 10px;
                        min-width: 200px;
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
                        flex-wrap: wrap;
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
                    <h2>وصفة طبية</h2>
                    <p>${medicalCenter.name || 'مركز طبي'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>معلومات المريض</h4>
                        <p><strong>الاسم:</strong> ${patient.user?.fullName || '—'}</p>
                        <p><strong>رقم الهوية:</strong> ${patient.id || '—'}</p>
                    </div>
                    <div class="info-box">
                        <h4>معلومات الوصفة</h4>
                        <p><strong>رقم الوصفة:</strong> #${prescription.id || '—'}</p>
                        <p><strong>التاريخ:</strong> ${formattedDate}</p>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>الطبيب المعالج</h4>
                        <p><strong>الاسم:</strong> د. ${doctor.user?.fullName || '—'}</p>
                        <p><strong>التخصص:</strong> ${doctor.specialization || '—'}</p>
                    </div>
                    <div class="info-box">
                        <h4>المركز الطبي</h4>
                        <p><strong>الاسم:</strong> ${medicalCenter.name || '—'}</p>
                        <p><strong>العنوان:</strong> ${medicalCenter.address || '—'}</p>
                    </div>
                </div>
                
                <div>
                    <h3>الأدوية الموصوفة</h3>
                    ${itemsHtml}
                </div>
                
                <div class="signature-area">
                    <div>
                        <p>توقيع الطبيب: ___________________</p>
                        <p>الاسم: د. ${doctor.user?.fullName || '—'}</p>
                    </div>
                    <div>
                        <p>توقيع الصيدلي: ___________________</p>
                        <p>الاسم: ___________________</p>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 200);
                    }
                <\/script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    } catch (error) {
        console.error('حدث خطأ أثناء الطباعة:', error);
        alert('حدث خطأ أثناء محاولة الطباعة');
    }
}

// ✅ 5. بدء التحميل عند فتح الصفحة
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    patientId = urlParams.get('id');

    if (patientId) {
        loadPatientData(patientId);
    } else {
        showMessage('لم يتم تحديد مريض', true);
        const prescriptionsList = document.getElementById('prescriptions-list');
        if (prescriptionsList) {
            prescriptionsList.innerHTML = `
                <div class="no-prescriptions">
                    <p>لم يتم تحديد مريض</p>
                </div>
            `;
        }
    }
};