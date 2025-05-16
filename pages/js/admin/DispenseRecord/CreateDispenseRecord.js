checkAccess(['Admin'], '../../../shared/unauthorized.html');

        $(document).ready(function() {

            // تحميل بيانات الصيدليات

            $.ajax({
                url: 'https://localhost:7219/api/Pharmacy/All',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
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

            // تحميل بيانات الصيادلة
            $.ajax({
                url: 'https://localhost:7219/api/Pharmacist/All',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
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
            let currentPrescription = null;

            $('#prescriptionId').on('change', function() {
                const prescriptionId = $(this).val();

                if (!prescriptionId) return;

                $.ajax({
                    url: `https://localhost:7219/api/Prescription/${prescriptionId}`,
                    type: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    success: function(prescription) {
                        if (!prescription) {
                            $('#prescriptionInfo').html('<div class="alert alert-danger">الوصفة غير موجودة</div>');
                            currentPrescription = null;
                            return;
                        }

                        if (prescription.isDispensed) {
                            $('#prescriptionInfo').html('<div class="alert alert-warning">تم صرف هذه الوصفة من قبل</div>');
                            currentPrescription = null;
                            return;
                        }

                        currentPrescription = prescription;

                        let html = `
            <h2 class="mb-4 text-center text-primary">💊 تفاصيل الوصفة الطبية</h2>
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title text-success">معلومات الوصفة</h5>
                    <p><strong>رقم الوصفة:</strong> <span class="badge bg-secondary">${prescription.id}</span></p>
                    <p><strong>المريض:</strong> ${prescription.patient.user.fullName}</p>
                    <p><strong>الطبيب:</strong> ${prescription.doctor.user.fullName}</p>
                    <p><strong>تاريخ الإنشاء:</strong> ${new Date(prescription.issuedDate).toLocaleDateString('ar-EG')}</p>
                </div>
            </div>
            <h4 class="mb-3 text-info">📝 قائمة الأدوية</h4>`;

                        prescription.prescriptionItems.forEach(item => {
                            html += `
                <div class="medication-item">
                    <h6><span class="badge bg-primary">${item.medicationId}</span></h6>
                    <p>💊 <strong>جرعة:</strong> ${item.dosage}</p>
                    <p>⏰ <strong>مرات يومية:</strong> ${item.frequency}</p>
                    <p>📅 <strong>مدة:</strong> ${item.duration} يوم</p>
                </div>`;
                        });

                        $('#prescriptionInfo').html(html);
                    },
                    error: function() {
                        $('#prescriptionInfo').html('<div class="alert alert-danger">فشل في جلب بيانات الوصفة</div>');
                        currentPrescription = null;
                    }
                });
            });

            // إرسال النموذج
            $('#dispenseForm').on('submit', function(e) {
                e.preventDefault();

                if (!currentPrescription) {
                    $('#message').html('<div class="alert alert-warning">يجب التحقق من رقم الوصفة أولاً</div>');
                    return;
                }

                const data = {
                    prescriptionId: parseInt($('#prescriptionId').val()),
                    pharmacyId: parseInt($('#pharmacySelect').val()),
                    pharmacistId: parseInt($('#pharmacistSelect').val()),
                    dispensedDate: $('#dispensedDate').val()
                };

                alert(data.pharmacistId);

                $.ajax({
                    url: 'https://localhost:7219/api/DispenseRecord/CreateDispenseRecord',
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function() {
                        // بعد نجاح صرف الدواء → تحديث حالة الوصفة
                        $.ajax({
                            url: `https://localhost:7219/api/Prescription/MarkAsDispensed/${data.prescriptionId}`,
                            method: 'PUT',
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('token')
                            },
                            success: function() {
                                $('#message').html('<div class="alert alert-success">تم صرف الدواء وتحديث حالة الوصفة بنجاح!</div>');
                            },
                            error: function() {
                                $('#message').html('<div class="alert alert-warning">تم صرف الدواء، لكن فشل تحديث حالة الوصفة</div>');
                            }
                        });

                        // إعادة تعيين النموذج
                        $('#dispenseForm')[0].reset();
                        $('#pharmacySelect').val(null).trigger('change');
                        $('#pharmacistSelect').val(null).trigger('change');
                        $('#prescriptionInfo').html('');
                        currentPrescription = null;
                    },
                    error: function(xhr) {
                        $('#message').html('<div class="alert alert-danger">حدث خطأ أثناء الإضافة: ' + xhr.responseText + '</div>');
                    }
                });
            });
        });