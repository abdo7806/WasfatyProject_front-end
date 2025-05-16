   checkAccess(['Admin'], '../../../shared/unauthorized.html');

        $(document).ready(function() {
            const urlParams = new URLSearchParams(window.location.search);
            const dispenseId = urlParams.get('id'); // جلب ID من الرابط

            if (!dispenseId) {
                $('#message').html('<div class="alert alert-danger">لم يتم تحديد سجل الصرف للتعديل</div>');
                return;
            }

            $('#dispenseId').val(dispenseId);

            // تحميل الصيدليات

            $.ajax({
                url: 'https://localhost:7219/api/Pharmacy/All',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                },
                success: function(pharmacies) {
                    const pharmacyData = pharmacies.map(p => ({
                        id: p.id,
                        text: p.name
                    }));
                    $('#pharmacySelect').select2({
                        data: pharmacyData,
                        placeholder: 'اختر الصيدلية',
                        allowClear: true
                    });
                },
                error: function() {
                    $('#message').html('<div class="alert alert-danger">فشل في تحميل الصيدليات</div>');
                }
            });

            // تحميل الصيادلة

            $.ajax({
                url: 'https://localhost:7219/api/Pharmacist/All',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                },
                success: function(pharmacists) {
                    const pharmacistData = pharmacists.map(p => ({
                        id: p.id,
                        text: p.user ? p.user.fullName : ''
                    }));
                    $('#pharmacistSelect').select2({
                        data: pharmacistData,
                        placeholder: 'اختر الصيدلي',
                        allowClear: true
                    });
                },
                error: function() {
                    $('#message').html('<div class="alert alert-danger">فشل في تحميل الصيادلة</div>');
                }
            });


            // تحميل سجل الصرف
            $.ajax({
                url: `https://localhost:7219/api/DispenseRecord/${dispenseId}`,
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                },
                success: function(dispense) {
                    $('#prescriptionId').val(dispense.prescriptionId);
                    $('#pharmacySelect').val(dispense.pharmacyId).trigger('change');
                    $('#pharmacistSelect').val(dispense.pharmacistId).trigger('change');
                    $('#dispensedDate').val(dispense.dispensedDate.split('T')[0]); // لتنسيق التاريخ

                    // تحميل الوصفة
                    $.ajax({
                        url: `https://localhost:7219/api/Prescription/${dispense.prescriptionId}`,
                        type: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                        },
                        success: function(prescription) {
                            if (!prescription) {
                                $('#prescriptionInfo').html('<div class="alert alert-danger">الوصفة غير موجودة</div>');
                                return;
                            }

                            $('#prescription-id').text(`${prescription.id}`);
                            $('#patient-name').text(`${prescription.patient.user.fullName}`);
                            $('#doctor-name').text(`${prescription.doctor.user.fullName}`);
                            $('#isDispensed').text(`${prescription.isDispensed ? 'نعم' : 'لا'}`);
                            $('#created-at').text(`${new Date(prescription.issuedDate).toLocaleDateString('ar-EG')}`);

                            let html = "";
                            prescription.prescriptionItems.forEach(item => {
                                html += `
                        <div id="medication-item" class="mb-3">
                            <h6><span class="badge bg-primary">${item.medicationId}</span></h6>
                            <p>💊 <strong>جرعة:</strong> ${item.dosage}</p>
                            <p>⏰ <strong>مرات يومية:</strong> ${item.frequency}</p>
                            <p>📅 <strong>مدة:</strong> ${item.duration} يوم</p>
                        </div>`;
                            });

                            $('#medication-list').html(html);
                        },
                        error: function() {
                            $('#prescriptionInfo').html('<div class="alert alert-danger">فشل في جلب بيانات الوصفة</div>');
                        }
                    });
                },
                error: function() {
                    $('#message').html('<div class="alert alert-danger">فشل في تحميل بيانات سجل الصرف</div>');
                }
            });


            // إرسال النموذج للتحديث
            $('#dispenseForm').on('submit', function(e) {
                e.preventDefault();

                const data = {
                    id: parseInt($('#dispenseId').val()),
                    prescriptionId: parseInt($('#prescriptionId').val()),
                    pharmacyId: parseInt($('#pharmacySelect').val()),
                    pharmacistId: parseInt($('#pharmacistSelect').val()),
                    dispensedDate: $('#dispensedDate').val()
                };

                $.ajax({
                    url: `https://localhost:7219/api/DispenseRecord/${dispenseId}`,
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                    },
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function() {
                        $('#message').html('<div class="alert alert-success">تم التحديث بنجاح!</div>');
                    },
                    error: function(xhr) {
                        $('#message').html('<div class="alert alert-danger">حدث خطأ أثناء التحديث: ' + xhr.responseText + '</div>');
                    }
                });
            });
        });