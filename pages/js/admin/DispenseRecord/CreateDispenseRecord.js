checkAccess(['Admin', 'Pharmacist'], '../../../shared/unauthorized.html');

$(document).ready(function() {
    let currentPrescription = null;

    // تحميل بيانات الصيدليات
    loadPharmacies();
    
    // تحميل بيانات الصيادلة
    loadPharmacists();

    // عند تغيير رقم الوصفة
    $('#prescriptionId').on('change', function() {
        const prescriptionId = $(this).val();
        if (!prescriptionId) return;
        loadPrescriptionDetails(prescriptionId);
    });

    // إرسال النموذج
    $('#dispenseForm').on('submit', function(e) {
        e.preventDefault();
        createDispenseRecord();
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

// ✅ 3. تحميل تفاصيل الوصفة (معدل)
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
            currentPrescription = null;
            return;
        }

        if (prescription.isDispensed) {
            $('#prescriptionInfo').html('<div class="alert alert-warning">⚠️ تم صرف هذه الوصفة من قبل</div>');
            currentPrescription = null;
            return;
        }

        currentPrescription = prescription;

        let html = `
            <div class="card mb-4 border-success">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">💊 تفاصيل الوصفة الطبية</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>🔢 رقم الوصفة:</strong> <span class="badge bg-secondary">${prescription.id}</span></p>
                            <p><strong>👤 المريض:</strong> ${prescription.patient?.user?.fullName || '—'}</p>
                            <p><strong>👨‍⚕️ الطبيب:</strong> ${prescription.doctor?.user?.fullName || '—'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>📅 تاريخ الإنشاء:</strong> ${new Date(prescription.issuedDate).toLocaleDateString('ar-EG')}</p>
                            <p><strong>📋 عدد الأدوية:</strong> ${prescription.prescriptionItems?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <h5 class="mb-3 text-info">📝 قائمة الأدوية الموصوفة</h5>
        `;

        if (prescription.prescriptionItems && prescription.prescriptionItems.length > 0) {
            prescription.prescriptionItems.forEach((item, index) => {
                const medicationName = item.medicationId 
                    ? `دواء رقم: ${item.medicationId}` 
                    : item.customMedicationName || 'دواء مخصص';
                    
                html += `
                    <div class="medication-item mb-3 p-3 border rounded">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6><span class="badge bg-primary">#${index + 1}</span> ${medicationName}</h6>
                        </div>
                        <p class="mb-1">💊 <strong>الجرعة:</strong> ${item.dosage || '-'}</p>
                        <p class="mb-1">⏰ <strong>مرات يومية:</strong> ${item.frequency || '-'}</p>
                        <p class="mb-0">📅 <strong>المدة:</strong> ${item.duration || '-'} يوم</p>
                    </div>
                `;
            });
        } else {
            html += '<div class="alert alert-info">لا توجد عناصر في هذه الوصفة</div>';
        }

        $('#prescriptionInfo').html(html);
        
    } catch (error) {
        console.error('Error:', error);
        $('#prescriptionInfo').html(`<div class="alert alert-danger">فشل في جلب بيانات الوصفة: ${error.message}</div>`);
        currentPrescription = null;
    }
}

// ✅ 4. إنشاء سجل صرف جديد (معدل)
async function createDispenseRecord() {
    if (!currentPrescription) {
        $('#message').html('<div class="alert alert-warning">⚠️ يجب التحقق من رقم الوصفة أولاً</div>');
        return;
    }

    const prescriptionId = parseInt($('#prescriptionId').val());
    const pharmacyId = parseInt($('#pharmacySelect').val());
    const pharmacistId = parseInt($('#pharmacistSelect').val());
    const dispensedDate = $('#dispensedDate').val();

    // التحقق من الحقول المطلوبة
    if (!pharmacyId) {
        $('#message').html('<div class="alert alert-danger">يرجى اختيار الصيدلية</div>');
        return;
    }

    if (!pharmacistId) {
        $('#message').html('<div class="alert alert-danger">يرجى اختيار الصيدلي</div>');
        return;
    }

    if (!dispensedDate) {
        $('#message').html('<div class="alert alert-danger">يرجى إدخال تاريخ الصرف</div>');
        return;
    }

    const data = {
        prescriptionId: prescriptionId,
        pharmacyId: pharmacyId,
        pharmacistId: pharmacistId,
        dispensedDate: dispensedDate
    };

    try {
        // إنشاء سجل الصرف
        const dispenseResponse = await fetchWithAuth('https://localhost:7219/api/DispenseRecord/CreateDispenseRecord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!dispenseResponse.ok) {
            const errorData = await dispenseResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل في إنشاء سجل الصرف');
        }

        // تحديث حالة الوصفة إلى "تم صرفها"
        const markResponse = await fetchWithAuth(`https://localhost:7219/api/Prescription/MarkAsDispensed/${prescriptionId}`, {
            method: 'PUT'
        });

        if (markResponse.ok) {
            $('#message').html('<div class="alert alert-success">✅ تم صرف الدواء وتحديث حالة الوصفة بنجاح!</div>');
        } else {
            $('#message').html('<div class="alert alert-warning">⚠️ تم صرف الدواء، لكن فشل تحديث حالة الوصفة</div>');
        }

        // إعادة تعيين النموذج
        resetForm();
        
        // التمرير إلى الأعلى
        $('html, body').animate({ scrollTop: 0 }, 500);
        
        // إعادة التوجيه بعد 3 ثواني (اختياري)
        setTimeout(() => {
            window.location.href = 'DispenseRecords.html';
        }, 3000);

    } catch (error) {
        console.error('Error:', error);
        $('#message').html(`<div class="alert alert-danger">❌ حدث خطأ أثناء الإضافة: ${error.message}</div>`);
    }
}

// ✅ 5. إعادة تعيين النموذج
function resetForm() {
    $('#dispenseForm')[0].reset();
    $('#pharmacySelect').val(null).trigger('change');
    $('#pharmacistSelect').val(null).trigger('change');
    $('#prescriptionId').val('');
    $('#prescriptionInfo').html('');
    currentPrescription = null;
}