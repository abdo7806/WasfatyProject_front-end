checkAccess(['Admin', 'Pharmacist'], '../../../shared/unauthorized.html');

$(document).ready(function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        loadDispenseRecordDetails(id);
    } else {
        $('#detailsContainer').html('<div class="alert alert-danger">لم يتم تحديد السجل.</div>');
    }
});

// ✅ 1. تحميل تفاصيل سجل الصرف (معدل)
async function loadDispenseRecordDetails(id) {
    try {
        // تحميل سجل الصرف باستخدام fetchWithAuth
        const recordResponse = await fetchWithAuth(`https://localhost:7219/api/DispenseRecord/${id}`, {
            method: 'GET'
        });
        
        if (!recordResponse.ok) {
            throw new Error('فشل في تحميل تفاصيل السجل');
        }
        
        const record = await recordResponse.json();
        
        const dispenseId = document.getElementById('DispenseRecord-id');
        const prescriptionId = document.getElementById('DispenseRecord-prescriptionId');
        const pharmacyName = document.getElementById('DispenseRecord-pharmacy-name');
        const pharmacistName = document.getElementById('DispenseRecord-pharmacist-user-fullName');
        const dispensedDate = document.getElementById('DispenseRecord-dispensedDate');
        
        if (dispenseId) dispenseId.textContent = record.id;
        if (prescriptionId) prescriptionId.textContent = record.prescriptionId;
        if (pharmacyName) pharmacyName.textContent = record.pharmacy?.name || '';
        if (pharmacistName) pharmacistName.textContent = record.pharmacist?.user?.fullName || '';
        if (dispensedDate) dispensedDate.textContent = new Date(record.dispensedDate).toLocaleDateString('ar-EG');

        // تحميل تفاصيل الوصفة
        await loadPrescriptionDetails(record.prescriptionId);
        
    } catch (error) {
        console.error('Error:', error);
        $('#detailsContainer').html(`<div class="alert alert-danger">فشل في تحميل تفاصيل السجل: ${error.message}</div>`);
    }
}

// ✅ 2. تحميل تفاصيل الوصفة (معدل)
async function loadPrescriptionDetails(prescriptionId) {
    try {
        const prescriptionResponse = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'GET'
        });
        
        if (!prescriptionResponse.ok) {
            throw new Error('فشل في جلب بيانات الوصفة');
        }
        
        const prescription = await prescriptionResponse.json();
        
        if (!prescription) {
            $('#prescriptionInfo').html('<div class="alert alert-danger">الوصفة غير موجودة</div>');
            return;
        }
        
        const prescriptionIdEl = document.getElementById('prescription-id');
        const patientNameEl = document.getElementById('patient-name');
        const doctorNameEl = document.getElementById('doctor-name');
        const isDispensedEl = document.getElementById('isDispensed');
        const createdAtEl = document.getElementById('created-at');
        
        if (prescriptionIdEl) prescriptionIdEl.textContent = prescription.id;
        if (patientNameEl) patientNameEl.textContent = prescription.patient?.user?.fullName || '';
        if (doctorNameEl) doctorNameEl.textContent = prescription.doctor?.user?.fullName || '';
        if (isDispensedEl) isDispensedEl.textContent = prescription.isDispensed ? 'نعم' : 'لا';
        if (createdAtEl) createdAtEl.textContent = new Date(prescription.issuedDate).toLocaleDateString('ar-EG');
        
        // عرض عناصر الوصفة
        let html = "";
        if (prescription.prescriptionItems && prescription.prescriptionItems.length > 0) {
            prescription.prescriptionItems.forEach(item => {
                const medicationName = item.medicationId 
                    ? `دواء رقم: ${item.medicationId}` 
                    : item.customMedicationName || 'دواء مخصص';
                    
                html += `
                    <div class="medication-item mb-3 p-3 border rounded">
                        <h6><span class="badge bg-primary">${medicationName}</span></h6>
                        <p>💊 <strong>الجرعة:</strong> ${item.dosage || '-'}</p>
                        <p>⏰ <strong>مرات يومية:</strong> ${item.frequency || '-'}</p>
                        <p>📅 <strong>المدة:</strong> ${item.duration || '-'} يوم</p>
                    </div>
                `;
            });
        } else {
            html = '<div class="alert alert-info">لا توجد عناصر في هذه الوصفة</div>';
        }
        
        const medicationList = document.getElementById('medication-list');
        if (medicationList) medicationList.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        $('#prescriptionInfo').html(`<div class="alert alert-danger">فشل في جلب بيانات الوصفة: ${error.message}</div>`);
    }
}

// وظيفة مساعدة للرجوع للخلف (اختياري)
function goBack() {
    window.history.back();
}