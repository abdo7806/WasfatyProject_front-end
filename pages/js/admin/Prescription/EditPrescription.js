 checkAccess(['Admin'], '../../../shared/unauthorized.html');

        let selectedMedications = [];
        let existingPrescriptionItemIds = [];
        let doctors = [];
        let patients = [];
        let medications = [];
        let prescriptionId;

        async function loadDoctors() {
            showLoading(true);
            const response = await fetch('https://localhost:7219/api/Doctor/All', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            doctors = await response.json();
            const doctorSelect = document.getElementById('doctor');
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = doctor.user.fullName;
                doctorSelect.appendChild(option);
            });
            showLoading(false);
        }

        async function loadPatients() {
            showLoading(true);
            const response = await fetch('https://localhost:7219/api/PatientController/All', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            patients = await response.json();
            populatePatientSelect(patients);
            showLoading(false);
        }

        async function loadMedications() {
            showLoading(true);
            const response = await fetch('https://localhost:7219/api/Medication/All', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            medications = await response.json();
            populateMedicationSelect(medications);
            showLoading(false);
        }

        async function loadPrescriptionData(id) {

            showLoading(true);
            const response = await fetch(`https://localhost:7219/api/Prescription/${id}`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            const prescription = await response.json();
            if (prescription) {
                prescriptionId = prescription.id;
                document.getElementById('doctor').value = prescription.doctorId;
                document.getElementById('patient').value = prescription.patientId;


                selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
                    const response = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    const medication = await response.json();
                    return {
                        id: item.id,
                        medicationId: item.medicationId,
                        medicationName: medication.name, // تأكد من استخدام medication.name
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration
                    };
                }));

                existingPrescriptionItemIds = prescription.prescriptionItems.map(item => item.id);
                console.log(existingPrescriptionItemIds);

                updateMedicationList();
            } else {
                showMessage('لم يتم العثور على الوصفة الطبية', true);
            }
            showLoading(false);
        }

        function populatePatientSelect(patientsList) {
            const patientSelect = document.getElementById('patient');
            patientSelect.innerHTML = '';
            patientsList.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = patient.user.fullName;
                patientSelect.appendChild(option);
            });
        }

        function populateMedicationSelect(medicationsList) {
            const medicationSelect = document.getElementById('medication');
            medicationSelect.innerHTML = '';
            medicationsList.forEach(medication => {
                const option = document.createElement('option');
                option.value = medication.id;
                option.textContent = medication.name;
                medicationSelect.appendChild(option);
            });
        }

        function updateMedicationList() {
            const medicationList = document.getElementById('medication-list');
            medicationList.innerHTML = '';
            selectedMedications.forEach((medication, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
            <span>${medication.medicationName} - جرعة: ${medication.dosage}, مرات يومية: ${medication.frequency}, مدة: ${medication.duration}</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeMedication(${index})">حذف</button>
        `;
                medicationList.appendChild(listItem);
            });
        }

        function removeMedication(index) {
            const medication = selectedMedications[index];
            console.log(existingPrescriptionItemIds);

            if (existingPrescriptionItemIds.includes(medication.id)) {
                alert("1");
                // حذف من الـ backend
                fetch(`https://localhost:7219/api/PrescriptionItem/${medication.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    })
                    .then(response => {
                        if (!response.ok) throw new Error('خطأ في الحذف من الخادم');
                        selectedMedications.splice(index, 1);
                        existingPrescriptionItemIds = existingPrescriptionItemIds.filter(id => id !== medication.id);
                        updateMedicationList();
                        showMessage('تم حذف الدواء بنجاح ✅', false);
                    })
                    .catch(error => showMessage('حدث خطأ أثناء حذف الدواء ❌', true));
            } else {
                alert("2");

                // حذف محلي فقط
                selectedMedications.splice(index, 1);
                updateMedicationList();
            }
        }


        document.getElementById('add-medication').addEventListener('click', () => {
            const medicationId = document.getElementById('medication').value;
            const medicationName = document.getElementById('medication').options[document.getElementById('medication').selectedIndex].text;
            const dosage = document.getElementById('dosage').value;
            const frequency = document.getElementById('frequency').value;
            const duration = document.getElementById('duration').value;

            if (medicationId && dosage && frequency && duration) {
                const medication = {
                    medicationId,
                    medicationName,
                    dosage,
                    frequency,
                    duration
                };

                selectedMedications.push(medication);
                // existingPrescriptionItemIds.push(medication);
                console.log(existingPrescriptionItemIds);

                updateMedicationList();

                document.getElementById('dosage').value = '';
                document.getElementById('frequency').value = '';
                document.getElementById('duration').value = '';
            } else {
                showMessage('يرجى ملء جميع الحقول قبل إضافة الدواء', true);
            }
        });

        document.getElementById('prescription-form').addEventListener('submit', async(event) => {
            event.preventDefault();

            const doctorId = document.getElementById('doctor').value;
            const patientId = document.getElementById('patient').value;

            if (!doctorId || !patientId) {
                showMessage('يرجى اختيار الطبيب والمريض', true);
                return;
            }

            const prescriptionData = {
                doctorId,
                patientId,
                issuedDate: new Date().toISOString(),
                isDispensed: false
            };

            const prescriptionResponse = await fetch(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(prescriptionData)
            });

            await prescriptionResponse.json();

            //  alert(existingPrescriptionItemIds.length);
            // تحديث PrescriptionItems
            for (let medication of selectedMedications) {
                const prescriptionItemData = {
                    prescriptionId: prescriptionId,
                    medicationId: medication.medicationId,
                    dosage: medication.dosage,
                    frequency: medication.frequency,
                    duration: medication.duration
                };

                if (!existingPrescriptionItemIds.includes(medication.id)) {

                    await fetch('https://localhost:7219/api/PrescriptionItem/CreatePrescriptionItem', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')

                        },
                        body: JSON.stringify(prescriptionItemData)
                    });
                }
            }

            showMessage('تم تعديل الوصفة الطبية بنجاح!', false);
            window.location.href = './Prescriptions.html';
        });

        function showLoading(isLoading) {
            const loading = document.getElementById('loading');
            loading.style.display = isLoading ? 'block' : 'none';
        }

        function showMessage(message, isError) {
            const messageBox = isError ? document.getElementById('error-message') : document.getElementById('success-message');
            messageBox.textContent = message;
            messageBox.style.display = 'block';
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 3000);
        }


        function searchPatients() {
            const searchTerm = document.getElementById('patient-search').value.toLowerCase();
            const filteredPatients = patients.filter(patient => patient.user.fullName.toLowerCase().includes(searchTerm));
            populatePatientSelect(filteredPatients);
        }

        function searchMedications() {
            const searchTerm = document.getElementById('medication-search').value.toLowerCase();
            const filteredMedications = medications.filter(medication => medication.name.toLowerCase().includes(searchTerm));
            populateMedicationSelect(filteredMedications);
        }

        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
                loadDoctors();
                loadPatients();
                loadMedications();
                loadPrescriptionData(id);
            }
        };