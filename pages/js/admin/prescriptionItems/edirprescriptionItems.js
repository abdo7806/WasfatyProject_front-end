$(document).ready(function() {
    checkAccess(['Admin'], '../../../shared/unauthorized.html');
    
    const urlParams = new URLSearchParams(window.location.search);
    itemId = urlParams.get('id');

    // تبديل بين الدواء الموجود والمخصص
    $('#isCustomToggle').change(function() {
        if ($(this).is(':checked')) {
            $('#existingMedFields').hide();
            $('#customMedFields').show();
            $('#medicationId').val('').trigger('change');
        } else {
            $('#existingMedFields').show();
            $('#customMedFields').hide();
            $('#customName, #customDescription, #customDosageForm, #customStrength').val('');
        }
    });

    if (itemId) {
        fetchPrescriptionItem(itemId);
    }

    $('#updateForm').submit(function(e) {
        e.preventDefault();
        updatePrescriptionItem();
    });
});

function fetchPrescriptionItem(id) {
    // تحميل الأدوية أولاً
    $.ajax({
        url: 'https://localhost:7219/api/Medication/All',
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        success: function(medications) {
            const medicationData = medications.map(m => ({
                id: m.id,
                text: m.name
            }));
            
            $('#medicationId').select2({
                data: medicationData,
                placeholder: 'اختر الدواء',
                allowClear: true
            });

            // الآن جلب بيانات عنصر الوصفة
            $.ajax({
                url: `https://localhost:7219/api/PrescriptionItem/${id}`,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                success: function(item) {
                    $('#prescriptionId').val(item.prescriptionId);
                    $('#dosage').val(item.dosage);
                    $('#frequency').val(item.frequency);
                    $('#duration').val(item.duration);

                    if (item.medicationId) {
                        // إذا كان دواءً موجوداً
                        $('#isCustomToggle').prop('checked', false);
                        $('#medicationId').val(item.medicationId).trigger('change');
                        $('#existingMedFields').show();
                        $('#customMedFields').hide();
                    } else {
                        // إذا كان دواءً مخصصاً
                        $('#isCustomToggle').prop('checked', true);
                        $('#existingMedFields').hide();
                        $('#customMedFields').show();
                        $('#customName').val(item.customMedicationName);
                        $('#customDescription').val(item.customMedicationDescription);
                        $('#customDosageForm').val(item.customDosageForm);
                        $('#customStrength').val(item.customStrength);
                    }
                },
                error: function() {
                    showMessage('فشل في تحميل بيانات عنصر الوصفة', 'danger');
                }
            });
        },
        error: function() {
            showMessage('فشل في تحميل قائمة الأدوية', 'danger');
        }
    });
}

function updatePrescriptionItem() {
    const isCustom = $('#isCustomToggle').is(':checked');
    const dosage = $('#dosage').val().trim();
    const frequency = $('#frequency').val().trim();
    const duration = $('#duration').val().trim();

    // التحقق من الحقول المطلوبة
    if (!dosage) {
        alert('يرجى إدخال الجرعة');
        return;
    }

    if (!frequency) {
        alert('يرجى إدخال عدد مرات اليوم');
        return;
    }

    if (!duration) {
        alert('يرجى إدخال مدة الاستخدام');
        return;
    }

    let updatedItem = {
        dosage: dosage,
        frequency: frequency,
        duration: duration
    };

    if (isCustom) {
        const customName = $('#customName').val().trim();
        const customDesc = $('#customDescription').val().trim();
        
        if (!customName) {
            alert('يرجى إدخال اسم الدواء المخصص');
            return;
        }

        updatedItem.medicationId = null;
        updatedItem.customMedicationName = customName;
        updatedItem.customMedicationDescription = customDesc;
        updatedItem.customDosageForm = $('#customDosageForm').val().trim();
        updatedItem.customStrength = $('#customStrength').val().trim();
    } else {
        const medicationId = $('#medicationId').val();
        
        if (!medicationId) {
            alert('يرجى اختيار الدواء');
            return;
        }

        updatedItem.medicationId = parseInt(medicationId);
        updatedItem.customMedicationName = null;
        updatedItem.customMedicationDescription = null;
        updatedItem.customDosageForm = null;
        updatedItem.customStrength = null;
    }

    $.ajax({
        url: `https://localhost:7219/api/PrescriptionItem/${itemId}`,
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(updatedItem),
        success: function() {
            showMessage('تم تحديث العنصر بنجاح', 'success');
            setTimeout(() => {
                window.location.href = 'PrescriptionItems.html';
            }, 1500);
        },
        error: function(xhr) {
            console.error('Error:', xhr.responseText);
            showMessage('فشل في تحديث العنصر: ' + (xhr.responseJSON?.message || xhr.statusText), 'danger');
        }
    });
}

function showMessage(message, type) {
    $('#message').html(`<div class="alert alert-${type}">${message}</div>`);
}