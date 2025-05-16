 checkAccess(['Admin'], '../../../shared/unauthorized.html');

        let itemId = null;

        $(document).ready(function() {
            const urlParams = new URLSearchParams(window.location.search);
            itemId = urlParams.get('id');

            if (itemId) {
                fetchPrescriptionItem(itemId);
            }

            $('#updateForm').submit(function(e) {
                e.preventDefault();
                updatePrescriptionItem();
            });
        });

        function fetchPrescriptionItem(id) {
            // تحميل بيانات العنصر
            $.ajax({
                url: `https://localhost:7219/api/PrescriptionItem/${id}`,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                },
                success: function(item) {
                    $('#prescriptionId').val(item.prescriptionId);
                    $('#dosage').val(item.dosage);
                    $('#frequency').val(item.frequency);
                    $('#duration').val(item.duration);
                },
                error: function() {
                    showMessage('حدث خطأ أثناء جلب بيانات العنصر', 'danger');
                }
            });

            // تحميل بيانات الأدوية
            const token = 'YOUR_TOKEN_HERE'; // استبدل هذا بالتوكن الخاص بك

            // تحميل الأدوية
            $.ajax({
                url: 'https://localhost:7219/api/Medication/All',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
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

                    // بعد تحميل الأدوية، نضبط قيمة الدواء المختار
                    $.ajax({
                        url: `https://localhost:7219/api/PrescriptionItem/${id}`,
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                        },
                        success: function(item) {
                            $('#medicationId').val(item.medicationId).trigger('change');
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
            const medicationId = $('#medicationId').val();
            const dosage = $('#dosage').val();
            const frequency = $('#frequency').val();
            const duration = $('#duration').val();

            if (!medicationId) {
                alert('يرجى اختيار الدواء');
                return;
            }

            if (!dosage.trim()) {
                alert('يرجى إدخال الجرعة');
                return;
            }

            if (!frequency.trim()) {
                alert('يرجى إدخال عدد مرات اليوم');
                return;
            }

            if (!duration.trim()) {
                alert('يرجى إدخال مدة الاستخدام');
                return;
            }

            const updatedItem = {
                medicationId: parseInt(medicationId),
                dosage: dosage.trim(),
                frequency: frequency.trim(),
                duration: duration.trim()
            };

            console.log(JSON.stringify(updatedItem));

            $.ajax({
                url: `https://localhost:7219/api/PrescriptionItem/${itemId}`,
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                },
                contentType: 'application/json',
                data: JSON.stringify(updatedItem),
                success: function() {
                    alert('تم تحديث العنصر بنجاح');
                    window.location.href = 'PrescriptionItems.html';
                },
                error: function(xhr, status, error) {
                    console.error('خطأ في التحديث:', error);
                    alert('فشل في تحديث العنصر');
                }
            });
        }

        function showMessage(message, type) {
            $('#message').html(`<div class="alert alert-${type}">${message}</div>`);
        }