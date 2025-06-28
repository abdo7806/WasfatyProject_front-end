 checkAccess(['Admin'], '../../../shared/unauthorized.html');

        let prescriptionItemId = getQueryParam('id');

        document.addEventListener('DOMContentLoaded', loadPrescriptionItemData);

        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        async function loadPrescriptionItemData() {
            try {
                const response = await fetch(`https://localhost:7219/api/PrescriptionItem/${prescriptionItemId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                    },
                });
                if (!response.ok) throw new Error('فشل تحميل البيانات');

                const prescriptionItem = await response.json();
					
                // عرض بيانات عنصر الوصفة
                document.getElementById('prescription-id').textContent = prescriptionItem.prescriptionId;
                document.getElementById('medication-name').textContent = prescriptionItem.medicationId == null ? prescriptionItem.customMedicationName : prescriptionItem.medicationName; // يمكنك تعديل هذا بناءً على كيفية إرسال البيانات
                document.getElementById('dosage').textContent = prescriptionItem.dosage == null ? prescriptionItem.customDosageForm : prescriptionItem.dosage;
                document.getElementById('frequency').textContent = prescriptionItem.frequency;
                document.getElementById('duration').textContent = prescriptionItem.duration == null ? prescriptionItem.customStrength : prescriptionItem.duration;

                // تحميل بيانات الوصفة المرتبطة
                const prescriptionResponse = await fetch(`https://localhost:7219/api/Prescription/${prescriptionItem.prescriptionId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token') // أضف التوكن إلى الهيدر
                    },
                });
                if (!prescriptionResponse.ok) throw new Error('فشل تحميل الوصفة');

                const prescription = await prescriptionResponse.json();
                updatePrescriptionDetails(prescription);

            } catch (error) {
                alert('حدث خطأ أثناء تحميل تفاصيل العنصر');
                console.error(error);
            }
        }

        function updatePrescriptionDetails(prescription) {
            const detailsDiv = document.getElementById('prescription-details');
            detailsDiv.innerHTML = `
                <p><strong>المريض:</strong> ${prescription.patient.user.fullName}</p>
                <p><strong>الطبيب:</strong> ${prescription.doctor.user.fullName}</p>
                <p><strong>تاريخ الإنشاء:</strong> ${new Date(prescription.issuedDate).toLocaleDateString('ar-EG')}</p>
            `;
        }

        function goBack() {
            window.history.back();
        }