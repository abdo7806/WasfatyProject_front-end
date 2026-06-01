// checkAccess(['Admin', 'Doctor'], '../../../shared/unauthorized.html');

let prescriptionId = getQueryParam('id');
let selectedMedications = [];

document.addEventListener('DOMContentLoaded', loadPrescriptionData);

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ✅ 1. تحميل بيانات الوصفة (معدل)
async function loadPrescriptionData() {
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
        if (createdAtEl) createdAtEl.textContent = prescription.issuedDate ? new Date(prescription.issuedDate).toLocaleDateString('ar-EG') : '—';

        selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
            if (!item.medicationId) {
                return {
                    id: item.id,
                    medicationId: item.medicationId,
                    medicationName: item.customMedicationName || 'دواء مخصص',
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    notes: item.notes || ''
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
                duration: item.duration,
                strength: medication.strength,
                dosageForm: medication.dosageForm,
                notes: item.notes || ''
            };
        }));
        
        updateMedicationList();
        
    } catch (error) {
        console.error('حدث خطأ أثناء تحميل تفاصيل الوصفة:', error);
        showMessage('حدث خطأ أثناء تحميل تفاصيل الوصفة', true);
    }
}

// ✅ 2. عرض قائمة الأدوية (معدلة)
function updateMedicationList() {
    const medicationList = document.getElementById('medication-list');
    if (!medicationList) return;
    
    medicationList.innerHTML = '';

    if (!selectedMedications || selectedMedications.length === 0) {
        medicationList.innerHTML = '<div class="alert alert-info">لا توجد أدوية في هذه الوصفة</div>';
        return;
    }

    selectedMedications.forEach((medication, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'medication-item mb-3 p-3 border rounded';
        
        let medicationDetails = '';
        
        if (medication.medicationId) {
            // دواء موجود في النظام
            medicationDetails = `
                <div class="d-flex justify-content-between align-items-start">
                    <h6><span class="badge bg-primary">#${index + 1}</span> ${medication.medicationName}</h6>
                    ${medication.strength ? `<span class="badge bg-secondary">${medication.strength}</span>` : ''}
                </div>
                ${medication.dosageForm ? `<p class="mb-1">📦 <strong>شكل الجرعة:</strong> ${medication.dosageForm}</p>` : ''}
            `;
        } else {
            // دواء مخصص
            medicationDetails = `
                <div class="d-flex justify-content-between align-items-start">
                    <h6><span class="badge bg-info">#${index + 1}</span> ${medication.medicationName}</h6>
                    <span class="badge bg-warning text-dark">مخصص</span>
                </div>
            `;
        }
        
        itemDiv.innerHTML = `
            ${medicationDetails}
            <p class="mb-1 mt-2">💊 <strong>الجرعة:</strong> ${medication.dosage || '-'}</p>
            <p class="mb-1">⏰ <strong>مرات يومية:</strong> ${medication.frequency || '-'}</p>
            <p class="mb-0">📅 <strong>المدة:</strong> ${medication.duration || '-'} يوم</p>
            ${medication.notes ? `<p class="mb-0 mt-2 text-muted"><small>📝 ملاحظات: ${medication.notes}</small></p>` : ''}
        `;
        
        medicationList.appendChild(itemDiv);
    });
}

// ✅ 3. دالة عرض الرسائل
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

// ✅ 4. دالة الرجوع للخلف
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = './Prescriptions.html';
    }
}

// ✅ 5. دالة طباعة الوصفة
async function printPrescription() {
    if (!prescriptionId) {
        showMessage('لا توجد بيانات للطباعة', true);
        return;
    }
    
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('فشل تحميل البيانات للطباعة');
        
        const prescription = await response.json();
        
        const printWindow = window.open('', '_blank');
        
        let medicationsHtml = '';
        selectedMedications.forEach((med, index) => {
            medicationsHtml += `
                <div class="medication-item" style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                    <strong>${index + 1}. ${med.medicationName}</strong>
                    <div style="margin-top: 5px;">
                        <span>الجرعة: ${med.dosage || '-'}</span> | 
                        <span>التردد: ${med.frequency || '-'} مرة/يوم</span> | 
                        <span>المدة: ${med.duration || '-'} يوم</span>
                    </div>
                </div>
            `;
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>وصفة طبية #${prescription.id}</title>
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
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #eee;
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
                    <p>${prescription.doctor?.medicalCenter?.name || 'مركز طبي'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>معلومات المريض</h4>
                        <p><strong>الاسم:</strong> ${prescription.patient?.user?.fullName || '—'}</p>
                        <p><strong>رقم الهوية:</strong> ${prescription.patient?.id || '—'}</p>
                    </div>
                    <div class="info-box">
                        <h4>معلومات الوصفة</h4>
                        <p><strong>رقم الوصفة:</strong> #${prescription.id}</p>
                        <p><strong>التاريخ:</strong> ${new Date(prescription.issuedDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>الطبيب المعالج</h4>
                        <p><strong>الاسم:</strong> د. ${prescription.doctor?.user?.fullName || '—'}</p>
                        <p><strong>التخصص:</strong> ${prescription.doctor?.specialization || '—'}</p>
                    </div>
                    <div class="info-box">
                        <h4>المركز الطبي</h4>
                        <p><strong>الاسم:</strong> ${prescription.doctor?.medicalCenter?.name || '—'}</p>
                        <p><strong>العنوان:</strong> ${prescription.doctor?.medicalCenter?.address || '—'}</p>
                    </div>
                </div>
                
                <div>
                    <h3>الأدوية الموصوفة</h3>
                    ${medicationsHtml || '<div class="alert alert-info">لا توجد أدوية في هذه الوصفة</div>'}
                </div>
                
                <div class="signature-area">
                    <div>
                        <p>توقيع الطبيب: ___________________</p>
                        <p>الاسم: د. ${prescription.doctor?.user?.fullName || '—'}</p>
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
                        }, 300);
                    }
                <\/script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
    } catch (error) {
        console.error('خطأ في الطباعة:', error);
        showMessage('حدث خطأ أثناء الطباعة', true);
    }
}