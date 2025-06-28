 //checkAccess(['Admin'], '../../../shared/unauthorized.html');

        let prescriptionId = getQueryParam('id');
        let selectedMedications = [];

        document.addEventListener('DOMContentLoaded', loadPrescriptionData);

        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        async function loadPrescriptionData() {
            try {
                const response = await fetch(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                });
                if (!response.ok) throw new Error('فشل تحميل البيانات');

                const prescription = await response.json();

                document.getElementById('prescription-id').textContent = prescription.id;
                document.getElementById('patient-name').textContent = prescription.patient.user.fullName;
                document.getElementById('doctor-name').textContent = prescription.doctor.user.fullName;
                document.getElementById('created-at').textContent = new Date(prescription.createdAt).toLocaleDateString('ar-EG');

                selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
                    if(!item.medicationId) {
                    return {
                        id: item.id,
                        medicationId: item.medicationId,
                        medicationName: item.customMedicationName,
                        dosage: item.customDosageForm,
                        frequency: item.frequency,
                        duration: item.customStrength
                    };
                    }
                    const res = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                    });
                    const medication = await res.json();
                    return {
                        id: item.id,
                        medicationId: item.medicationId,
                        medicationName: medication.name,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration
                    };
                }));
                updateMedicationList();
            } catch (error) {
                alert('حدث خطأ أثناء تحميل تفاصيل الوصفة');
                console.error(error);
            }
        }

        function updateMedicationList() {
            const medicationList = document.getElementById('medication-list');
            medicationList.innerHTML = '';

            selectedMedications.forEach(medication => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'medication-item';
                itemDiv.innerHTML = `
                    <h6><span class="badge bg-primary">${medication.medicationName}</span></h6>
                    <p class="mb-1">💊 <strong>جرعة:</strong> ${medication.dosage}</p>
                    <p class="mb-1">⏰ <strong>مرات يومية:</strong> ${medication.frequency}</p>
                    <p class="mb-0">📅 <strong>مدة:</strong> ${medication.duration} يوم</p>
                `;
                medicationList.appendChild(itemDiv);
            });
        }

        function goBack() {
            window.history.back();
        }