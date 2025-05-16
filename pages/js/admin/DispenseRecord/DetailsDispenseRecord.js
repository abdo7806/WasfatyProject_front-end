 checkAccess(['Admin'], '../../../shared/unauthorized.html');

        $(document).ready(function() {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');

            if (id) {
                loadDispenseRecordDetails(id);
            } else {
                $('#detailsContainer').html('<div class="alert alert-danger ">لم يتم تحديد السجل.</div>');
            }
        });

        function loadDispenseRecordDetails(id) {

            // تحميل سجل الصرف
            $.ajax({
                url: `https://localhost:7219/api/DispenseRecord/${id}`,
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                success: function(record) {
                    $('#DispenseRecord-id').text(`${record.id}`);
                    $('#DispenseRecord-prescriptionId').text(`${record.prescriptionId}`);
                    $('#DispenseRecord-pharmacy-name').text(`${record.pharmacy.name}`);
                    $('#DispenseRecord-pharmacist-user-fullName').text(`${record.pharmacist.user.fullName}`);
                    $('#DispenseRecord-dispensedDate').text(`${new Date(record.dispensedDate).toLocaleDateString('ar-EG')}`);

                    // تحميل الوصفة
                    $.ajax({
                        url: `https://localhost:7219/api/Prescription/${record.prescriptionId}`,
                        type: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
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
                    $('#detailsContainer').html('<div class="alert alert-danger">فشل في تحميل تفاصيل السجل.</div>');
                }
            });
        }