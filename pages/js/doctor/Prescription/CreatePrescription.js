 let selectedMedications = [];
        let doctors = [];
        let patients = [];
        let medications = [];
        let doctorData = JSON.parse(localStorage.getItem("doctorData"));

        async function loadPatients() {
            showLoading(true);
            try {
                const response = await fetch('https://localhost:7219/api/PatientController/All', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!response.ok) throw new Error('فشل في تحميل قائمة المرضى');

                patients = await response.json();
                populatePatientSelect(patients);
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                showLoading(false);
            }
        }

        async function loadMedications() {
            showLoading(true);
            try {
                const response = await fetch('https://localhost:7219/api/Medication/All', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!response.ok) throw new Error('فشل في تحميل قائمة الأدوية');

                medications = await response.json();
                populateMedicationSelect(medications);
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                showLoading(false);
            }
        }

        function populatePatientSelect(patientsList) {
            const patientSelect = document.getElementById('patient');
            patientSelect.innerHTML = '<option value="">-- اختر المريض --</option>';
            patientsList.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.user.fullName} - ${patient.user.email || ''} - ${patient.id }`;
                patientSelect.appendChild(option);
            });

        }

        function populateMedicationSelect(medicationsList) {
            const medicationSelect = document.getElementById('medication');
            medicationSelect.innerHTML = '<option value="">-- اختر الدواء --</option>';

            medicationsList.forEach(medication => {
                const option = document.createElement('option');
                option.value = medication.id;
                option.textContent = medication.name;
                medicationSelect.appendChild(option);
            });
        }

        function searchPatients() {
            const searchTerm = document.getElementById('patient-search').value.toLowerCase();
            const filteredPatients = patients.filter(patient =>
                patient.user.fullName.toLowerCase().includes(searchTerm) ||
                (patient.user.email.toLowerCase().includes(searchTerm)) ||
                (patient.id.toString().includes(searchTerm))
            );
            populatePatientSelect(filteredPatients.length ? filteredPatients : patients);
        }

        // البحث المحلي
        function searchLocalPatients(searchTerm) {
            return patients.filter(patient => {
                return (
                    patient.user.fullName.toLowerCase().includes(searchTerm) ||
                    (patient.user.email && patient.user.email.toLowerCase().includes(searchTerm)) ||
                    (patient.id.toString().includes(searchTerm))
                );
            });
        }

        function searchMedications() {
            const searchTerm = document.getElementById('medication-search').value.toLowerCase();
            const filteredMedications = medications.filter(medication =>
                medication.name.toLowerCase().includes(searchTerm)
            );
            populateMedicationSelect(filteredMedications.length ? filteredMedications : medications);
        }

        document.getElementById('add-medication').addEventListener('click', () => {
            const medicationId = document.getElementById('medication').value;
            const medicationName = document.getElementById('medication').options[document.getElementById('medication').selectedIndex].text;
            const dosage = document.getElementById('dosage').value;
            const frequency = document.getElementById('frequency').value;
            const duration = document.getElementById('duration').value;

            if (!medicationId || !dosage || !frequency || !duration) {
                showMessage('يرجى ملء جميع حقول الدواء قبل الإضافة', true);
                return;
            }

            const medication = {
                medicationId,
                medicationName,
                dosage,
                frequency,
                duration
            };

            // التحقق من عدم تكرار الدواء
            if (selectedMedications.some(m => m.medicationId === medicationId)) {
                showMessage('هذا الدواء مضاف مسبقاً إلى الوصفة', true);
                return;
            }

            selectedMedications.push(medication);

            const listItem = document.createElement('li');
            listItem.className = 'd-flex justify-content-between align-items-center';

            const medInfo = document.createElement('span');
            medInfo.textContent = `${medicationName} - جرعة: ${dosage}، ${frequency} مرات/يوم، لمدة ${duration}`;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> حذف';
            deleteButton.onclick = () => removeMedication(medication, listItem);

            listItem.appendChild(medInfo);
            listItem.appendChild(deleteButton);
            document.getElementById('medication-list').appendChild(listItem);

            // إعادة تعيين حقول الدواء
            document.getElementById('medication').value = '';
            document.getElementById('dosage').value = '';
            document.getElementById('frequency').value = '';
            document.getElementById('duration').value = '';
            document.getElementById('medication-search').value = '';
        });

        function removeMedication(medication, listItem) {
            selectedMedications = selectedMedications.filter(m => m.medicationId !== medication.medicationId);
            listItem.remove();
        }

        document.getElementById('prescription-form').addEventListener('submit', async(e) => {
            e.preventDefault();

            const doctorId = doctorData.id;
            const patientId = document.getElementById('patient').value;

            if (!doctorId || !patientId) {
                showMessage('يرجى اختيار الطبيب والمريض', true);
                return;
            }

            if (selectedMedications.length === 0) {
                showMessage('يرجى إضافة أدوية إلى الوصفة', true);
                return;
            }

            showLoading(true);

            try {
                // إنشاء الوصفة الطبية
                const prescriptionData = {
                    doctorId,
                    patientId,
                    issuedDate: new Date().toISOString(),
                    isDispensed: false
                };

                const prescriptionResponse = await fetch('https://localhost:7219/api/Prescription/CreatePrescription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify(prescriptionData)
                });

                if (!prescriptionResponse.ok) throw new Error('فشل في إنشاء الوصفة الطبية');

                const prescription = await prescriptionResponse.json();

                // إضافة أدوية الوصفة
                const addMedicationPromises = selectedMedications.map(async(medication) => {
                    const prescriptionItemData = {
                        prescriptionId: prescription.id,
                        medicationId: medication.medicationId,
                        dosage: medication.dosage,
                        frequency: medication.frequency,
                        duration: medication.duration
                    };

                    const response = await fetch('https://localhost:7219/api/PrescriptionItem/CreatePrescriptionItem', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify(prescriptionItemData)
                    });

                    if (!response.ok) throw new Error('فشل في إضافة دواء للوصفة');
                });

                await Promise.all(addMedicationPromises);

                showMessage('تم إضافة الوصفة الطبية بنجاح!', false);
                setTimeout(() => {
                    window.location.href = './Prescriptions.html';
                }, 1500);

            } catch (error) {
                showMessage(error.message, true);
            } finally {
                showLoading(false);
            }
        });

        function showLoading(isLoading) {
            document.getElementById('loading').style.display = isLoading ? 'flex' : 'none';
            document.getElementById('prescription-form').style.display = isLoading ? 'none' : 'block';
        }

        function showMessage(message, isError) {
            const messageBox = isError ?
                document.getElementById('error-message') :
                document.getElementById('success-message');

            messageBox.textContent = message;
            messageBox.style.display = 'block';

            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }

        async function GetPatientsById(patientId) {
            try {
                const prescriptionsResponse = await fetch(`https://localhost:7219/api/Prescription/GetByPatientId/${patientId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!prescriptionsResponse.ok) throw new Error('فشل في تحميل الوصفات الطبية');

                allPrescriptions = await prescriptionsResponse.json();

                if (allPrescriptions.length === 0) {
                    //  showMessage('لا توجد وصفات طبية لهذا المريض', false);
                    /*  document.getElementById('prescriptions-list').innerHTML = `
                        <div class="no-prescriptions">
                            <p>لا توجد وصفات طبية مسجلة لهذا المريض</p>
                        </div>
                    `;
                    document.getElementById('stats-section').classList.add('d-none');
                    document.getElementById('pagination').classList.add('d-none');*/

                    alert("المريض غير موجود!");
                    return;
                }

                const patient = allPrescriptions[0].patient;


                const patientSelect = document.getElementById('patient');
                patientSelect.innerHTML = '';

                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.user.fullName} - ${patient.user.email || ''} - ${patient.id }`;
                patientSelect.appendChild(option);



            } catch (error) {
                alert("المريض غير موجود!");

            }
        }
        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const patientId = urlParams.get('doctorId');

            if (doctorData) {
                document.getElementById('doctorId').value = doctorData.id;
            } //patient-search lblPatient

            if (patientId) {
                document.getElementById('patient-search').value = patientId;
                document.getElementById('lblPatient').textContent = "رقم المريض";
                let a = document.createAttribute("readonly");
                document.getElementById('patient-search').setAttributeNode(a);
                searchPatients();
                GetPatientsById(patientId);
                document.getElementById('lblPatient-list').textContent = "بيانات المريض";

            }
            loadPatients();
            loadMedications();
        };