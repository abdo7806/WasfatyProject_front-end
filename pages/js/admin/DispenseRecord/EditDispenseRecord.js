checkAccess(['Admin', 'Pharmacist'], '../../../shared/unauthorized.html');

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const dispenseId = urlParams.get('id');

    if (!dispenseId) {
        $('#message').html('<div class="alert alert-danger">لم يتم تحديد سجل الصرف للتعديل</div>');
        return;
    }

    $('#dispenseId').val(dispenseId);

    // تحميل البيانات
    loadPharmacies();
    loadPharmacists();
    loadDispenseRecord(dispenseId);

    // إرسال النموذج للتحديث
    $('#dispenseForm').on('submit', function(e) {
        e.preventDefault();
        updateDispenseRecord(dispenseId);
    });
});

// ✅ 1. تحميل الصيدليات (معدل)
async function loadPharmacies() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Pharmacy/All', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الصيدليات');
        }
        
        const pharmacies = await response.json();
        const pharmacyData = pharmacies.map(p => ({
            id: p.id,
            text: p.name
        }));
        
        $('#pharmacySelect').select2({
            data: pharmacyData,
            placeholder: 'اختر الصيدلية',
            allowClear: true
        });
        
    } catch (error) {
        console.error('Error:', error);
        $('#message').html('<div class="alert alert-danger">فشل في تحميل الصيدليات</div>');
    }
}

// ✅ 2. تحميل الصيادلة (معدل)
async function loadPharmacists() {
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Pharmacist/All', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الصيادلة');
        }
        
        const pharmacists = await response.json();
        const pharmacistData = pharmacists.map(p => ({
            id: p.id,
            text: p.user ? p.user.fullName : 'بدون اسم'
        }));
        
        $('#pharmacistSelect').select2({
            data: pharmacistData,
            placeholder: 'اختر الصيدلي',
            allowClear: true
        });
        
    } catch (error) {
        console.error('Error:', error);
        $('#message').html('<div class="alert alert-danger">فشل في تحميل الصيادلة</div>');
    }
}

// ✅ 3. تحميل سجل الصرف (معدل)
async function loadDispenseRecord(dispenseId) {
    try {
        // تحميل سجل الصرف
        const recordResponse = await fetchWithAuth(`https://localhost:7219/api/DispenseRecord/${dispenseId}`, {
            method: 'GET'
        });
        
        if (!recordResponse.ok) {
            throw new Error('فشل في تحميل بيانات سجل الصرف');
        }
        
        const dispense = await recordResponse.json();
        
        $('#prescriptionId').val(dispense.prescriptionId);
        $('#pharmacySelect').val(dispense.pharmacyId).trigger('change');
        $('#pharmacistSelect').val(dispense.pharmacistId).trigger('change');
        
        if (dispense.dispensedDate) {
            $('#dispensedDate').val(dispense.dispensedDate.split('T')[0]);
        }
        
        // تحميل تفاصيل الوصفة
        await loadPrescriptionDetails(dispense.prescriptionId);
        
    } catch (error) {
        console.error('Error:', error);
        $('#message').html(`<div class="alert alert-danger">فشل في تحميل بيانات سجل الصرف: ${error.message}</div>`);
    }
}

// ✅ 4. تحميل تفاصيل الوصفة (معدل)
async function loadPrescriptionDetails(prescriptionId) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب بيانات الوصفة');
        }
        
        const prescription = await response.json();
        
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
        if (patientNameEl) patientNameEl.textContent = prescription.patient?.user?.fullName || '—';
        if (doctorNameEl) doctorNameEl.textContent = prescription.doctor?.user?.fullName || '—';
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

// ✅ 5. تحديث سجل الصرف (معدل)
async function updateDispenseRecord(dispenseId) {
    const data = {
        id: parseInt($('#dispenseId').val()),
        prescriptionId: parseInt($('#prescriptionId').val()),
        pharmacyId: parseInt($('#pharmacySelect').val()),
        pharmacistId: parseInt($('#pharmacistSelect').val()),
        dispensedDate: $('#dispensedDate').val()
    };
    
    // التحقق من الحقول المطلوبة
    if (!data.pharmacyId) {
        $('#message').html('<div class="alert alert-danger">يرجى اختيار الصيدلية</div>');
        return;
    }
    
    if (!data.pharmacistId) {
        $('#message').html('<div class="alert alert-danger">يرجى اختيار الصيدلي</div>');
        return;
    }
    
    if (!data.dispensedDate) {
        $('#message').html('<div class="alert alert-danger">يرجى إدخال تاريخ الصرف</div>');
        return;
    }
    
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/DispenseRecord/${dispenseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل في تحديث السجل');
        }
        
        $('#message').html('<div class="alert alert-success">تم التحديث بنجاح!</div>');
        
        // إعادة التوجيه بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'DispenseRecords.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        $('#message').html(`<div class="alert alert-danger">حدث خطأ أثناء التحديث: ${error.message}</div>`);
    }
}