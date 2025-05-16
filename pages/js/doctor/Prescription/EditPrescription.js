 let selectedMedications = [];
        let existingPrescriptionItemIds = [];
        let doctors = [];
        let patients = [];
        let medications = [];
        let prescriptionId;
        let doctorData = JSON.parse(localStorage.getItem("doctorData"));


        /*    async function loadPatients() {
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
            }*/

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

        async function loadPrescriptionData(id) {
            showLoading(true);
            try {
                // جلب بيانات الوصفة
                const prescriptionResponse = await fetch(`https://localhost:7219/api/Prescription/${id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!prescriptionResponse.ok) throw new Error('فشل في تحميل بيانات الوصفة');

                const prescription = await prescriptionResponse.json();


                // جلب بيانات المريض فقط
                const patientResponse = await fetch(`https://localhost:7219/api/PatientController/${prescription.patientId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!patientResponse.ok) throw new Error('فشل في تحميل بيانات المريض');


                const patient = await patientResponse.json();
                document.getElementById('patient').value = `${patient.user.fullName} - ${patient.user.email || ''}`;
                document.getElementById('patientId').value = patient.id;

                prescriptionId = prescription.id;


                selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
                    const medResponse = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    const medication = await medResponse.json();
                    return {
                        id: item.id,
                        medicationId: item.medicationId,
                        medicationName: medication.name,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration
                    };
                }));

                existingPrescriptionItemIds = prescription.prescriptionItems.map(item => item.id);
                updateMedicationList();

                // باقي الكود...
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                showLoading(false);
            }
        }
        /*async function loadPrescriptionData(id) {
            showLoading(true);
            try {
                const response = await fetch(`https://localhost:7219/api/Prescription/${id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!response.ok) throw new Error('فشل في تحميل بيانات الوصفة');

                const prescription = await response.json();

                if (prescription) {
                    prescriptionId = prescription.id;
                    // document.getElementById('doctor').value = prescription.doctorId;
                    document.getElementById('patient').value = prescription.patientId;

                    selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
                        const medResponse = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('token')
                            }
                        });
                        const medication = await medResponse.json();
                        return {
                            id: item.id,
                            medicationId: item.medicationId,
                            medicationName: medication.name,
                            dosage: item.dosage,
                            frequency: item.frequency,
                            duration: item.duration
                        };
                    }));

                    existingPrescriptionItemIds = prescription.prescriptionItems.map(item => item.id);
                    updateMedicationList();
                } else {
                    showMessage('لم يتم العثور على الوصفة الطبية', true);
                }
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                showLoading(false);
            }
        }*/


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


        function searchMedications() {
            const searchTerm = document.getElementById('medication-search').value.toLowerCase();
            const filteredMedications = medications.filter(medication =>
                medication.name.toLowerCase().includes(searchTerm)
            );
            populateMedicationSelect(filteredMedications.length ? filteredMedications : medications);
        }

        function updateMedicationList() {
            const medicationList = document.getElementById('medication-list');
            medicationList.innerHTML = '';
            selectedMedications.forEach((medication, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'd-flex justify-content-between align-items-center';

                const medInfo = document.createElement('span');
                medInfo.textContent = `${medication.medicationName} - جرعة: ${medication.dosage}، ${medication.frequency} مرات/يوم، لمدة ${medication.duration}`;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-danger btn-sm';
                deleteButton.innerHTML = '<i class="bi bi-trash"></i> حذف';
                deleteButton.onclick = () => removeMedication(medication, listItem);

                listItem.appendChild(medInfo);
                listItem.appendChild(deleteButton);
                medicationList.appendChild(listItem);
            });
        }

        function removeMedication(medication, listItem) {
            if (existingPrescriptionItemIds.includes(medication.id)) {
                if (confirm('هل أنت متأكد من حذف هذا الدواء؟')) {
                    showLoading(true);
                    fetch(`https://localhost:7219/api/PrescriptionItem/${medication.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('token')
                            }
                        })
                        .then(response => {
                            if (!response.ok) throw new Error('فشل في حذف الدواء');
                            selectedMedications = selectedMedications.filter(m => m.id !== medication.id);
                            existingPrescriptionItemIds = existingPrescriptionItemIds.filter(id => id !== medication.id);
                            listItem.remove();
                            showMessage('تم حذف الدواء بنجاح', false);
                        })
                        .catch(error => showMessage(error.message, true))
                        .finally(() => showLoading(false));
                }
            } else {
                selectedMedications = selectedMedications.filter(m => m.medicationId !== medication.medicationId);
                listItem.remove();
            }
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

            if (selectedMedications.some(m => m.medicationId === medicationId)) {
                showMessage('هذا الدواء مضاف مسبقاً إلى الوصفة', true);
                return;
            }

            selectedMedications.push(medication);
            updateMedicationList();

            document.getElementById('medication').value = '';
            document.getElementById('dosage').value = '';
            document.getElementById('frequency').value = '';
            document.getElementById('duration').value = '';
            document.getElementById('medication-search').value = '';
        });

        document.getElementById('prescription-form').addEventListener('submit', async(e) => {
            e.preventDefault();

            const doctorId = doctorData.id;
            const patientId = document.getElementById('patientId').value;

            if (!doctorId || !patientId) {
                showMessage('يرجى اختيار الطبيب والمريض', true);
                return;
            }

            showLoading(true);

            try {
                // تحديث بيانات الوصفة الأساسية
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

                if (!prescriptionResponse.ok) throw new Error('فشل في تحديث الوصفة الطبية');

                // إضافة الأدوية الجديدة
                const addMedicationPromises = selectedMedications
                    .filter(med => !existingPrescriptionItemIds.includes(med.id))
                    .map(async(medication) => {
                        const prescriptionItemData = {
                            prescriptionId: prescriptionId,
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

                showMessage('تم تعديل الوصفة الطبية بنجاح!', false);
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

        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
                // loadDoctors();
                // loadPatients();
                loadMedications();
                loadPrescriptionData(id);
            }
        };