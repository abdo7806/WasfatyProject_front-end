 let selectedMedications = [];
        let doctors = [];
        let patients = [];
        let medications = [];
        let doctorData = JSON.parse(localStorage.getItem("doctorData"));


        // تبديل حالة حقول الدواء المخصص
document.getElementById('custom-medication-toggle').addEventListener('change', function() {
    const customFields = document.getElementById('custom-medication-fields');
    const medicationSelect = document.getElementById('medication');
    
    if (this.checked) {
        customFields.style.display = 'block';
        medicationSelect.disabled = true;
        medicationSelect.value = '';
    } else {
        customFields.style.display = 'none';
        medicationSelect.disabled = false;
    }
});

function validateForm() {
    let isValid = true;
    
    // مسح رسائل الخطأ السابقة
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    
    // التحقق من اختيار المريض
    const patientSelect = document.getElementById('patient');
    if (!patientSelect.value) {
        showFieldError(patientSelect, 'يجب اختيار المريض');
        isValid = false;
    }
    
    // التحقق من وجود أدوية مضافة
    if (selectedMedications.length === 0) {
        showMessage('يجب إضافة دواء واحد على الأقل', true);
        isValid = false;
    }
    
    return isValid;
}


function validateMedicationBeforeAdd() {
    const isCustom = document.getElementById('custom-medication-toggle').checked;
    let isValid = true;
    
    // مسح رسائل الخطأ السابقة
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    
    if (isCustom) {
        // التحقق من حقول الدواء المخصص
        const customName = document.getElementById('custom-medication-name');
        const customDesc = document.getElementById('custom-medication-description');
        const dosage = document.getElementById('dosage');
        const frequency = document.getElementById('frequency');
        const duration = document.getElementById('duration');
        
        if (!customName.value.trim()) {
            showFieldError(customName, 'اسم الدواء المخصص مطلوب');
            isValid = false;
        }
        
        if (!customDesc.value.trim()) {
            showFieldError(customDesc, 'وصف الدواء المخصص مطلوب');
            isValid = false;
        }
        
        if (!dosage.value.trim()) {
            showFieldError(dosage, 'حقل الجرعة مطلوب');
            isValid = false;
        }
        
        if (!frequency.value.trim()) {
            showFieldError(frequency, 'حقل عدد المرات مطلوب');
            isValid = false;
        } else if (isNaN(frequency.value) || parseInt(frequency.value) <= 0) {
            showFieldError(frequency, 'يجب أن يكون عدد المرات رقم صحيح موجب');
            isValid = false;
        }
        
        if (!duration.value.trim()) {
            showFieldError(duration, 'حقل المدة مطلوب');
            isValid = false;
        }
            if (customName.length > 100) {
        showFieldError(document.getElementById('custom-medication-name'), 'اسم الدواء يجب أن لا يتجاوز 100 حرف');
        isValid = false;
    }
           if (selectedMedications.some(m => m.isCustom && m.customName === customName)) {
        showFieldError(document.getElementById('custom-medication-name'), 'هذا الدواء المخصص مضاف مسبقاً');
        isValid = false;
    }
    } else {
        // التحقق من حقول الدواء الموجود
        const medicationSelect = document.getElementById('medication');
        const dosage = document.getElementById('dosage');
        const frequency = document.getElementById('frequency');
        const duration = document.getElementById('duration');
        
        if (!medicationSelect.value) {
            showFieldError(medicationSelect, 'يجب اختيار الدواء');
            isValid = false;
        }
        
        if (!dosage.value.trim()) {
            showFieldError(dosage, 'حقل الجرعة مطلوب');
            isValid = false;
        }
        
        if (!frequency.value.trim()) {
            showFieldError(frequency, 'حقل عدد المرات مطلوب');
            isValid = false;
        } else if (isNaN(frequency.value) || parseInt(frequency.value) <= 0) {
            showFieldError(frequency, 'يجب أن يكون عدد المرات رقم صحيح موجب');
            isValid = false;
        }
        
        if (!duration.value.trim()) {
            showFieldError(duration, 'حقل المدة مطلوب');
            isValid = false;
        }
    }
    
    return isValid;
}
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
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
        
        // إظهار/إخفاء حقول الدواء المخصص
        document.getElementById('custom-medication-toggle').addEventListener('change', function() {
            const customFields = document.getElementById('custom-medication-fields');
            const medicationSelect = document.getElementById('medication');
            
            if (this.checked) {
                customFields.style.display = 'block';
                medicationSelect.disabled = true;
                medicationSelect.value = '';
            } else {
                customFields.style.display = 'none';
                medicationSelect.disabled = false;
            }
        });
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
        if (validateMedicationBeforeAdd()) {

    const isCustom = document.getElementById('custom-medication-toggle').checked;
    
    if (isCustom) {
        // إضافة دواء مخصص
        const customName = document.getElementById('custom-medication-name').value.trim();
        const customDesc = document.getElementById('custom-medication-description').value.trim();
        const dosage = document.getElementById('dosage').value.trim();
        const frequency = document.getElementById('frequency').value.trim();
        const duration = document.getElementById('duration').value.trim();
        
        if (!customName || !dosage || !frequency || !duration) {
            showMessage('يرجى ملء جميع الحقول المطلوبة للدواء المخصص', true);
            return;
        }
        
        const medication = {
            isCustom: true,
            customName: customName,
            customDescription: customDesc,
            customDosageForm: document.getElementById('custom-dosage-form').value.trim(),
            customStrength: document.getElementById('custom-strength').value.trim(),
            dosage: dosage,
            frequency: frequency,
            duration: duration
        };
        
        selectedMedications.push(medication);
    } else {
        // إضافة دواء موجود
        const medicationId = document.getElementById('medication').value;
        const medicationName = document.getElementById('medication').options[document.getElementById('medication').selectedIndex].text;
        const dosage = document.getElementById('dosage').value.trim();
        const frequency = document.getElementById('frequency').value.trim();
        const duration = document.getElementById('duration').value.trim();

        if (!medicationId || !dosage || !frequency || !duration) {
            showMessage('يرجى ملء جميع حقول الدواء قبل الإضافة', true);
            return;
        }

        // التحقق من عدم تكرار الدواء (للأدوية الموجودة فقط)
        if (selectedMedications.some(m => !m.isCustom && m.medicationId === medicationId)) {
            showMessage('هذا الدواء مضاف مسبقاً إلى الوصفة', true);
            return;
        }

        const medication = {
            isCustom: false,
            medicationId,
            medicationName,
            dosage,
            frequency,
            duration
        };

        selectedMedications.push(medication);
    }
    
    updateMedicationList();
    resetMedicationFields();
}
});

function updateMedicationList() {
    const list = document.getElementById('medication-list');
    list.innerHTML = '';
    
    selectedMedications.forEach((med, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'd-flex justify-content-between align-items-center';
        
        const medInfo = document.createElement('span');
        if (med.isCustom) {
            medInfo.textContent = `${med.customName} (مخصص) - جرعة: ${med.dosage}، ${med.frequency} مرات/يوم، لمدة ${med.duration}`;
        } else {
            medInfo.textContent = `${med.medicationName} - جرعة: ${med.dosage}، ${med.frequency} مرات/يوم، لمدة ${med.duration}`;
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i> حذف';
        deleteButton.onclick = () => {
            selectedMedications.splice(index, 1);
            updateMedicationList();
        };
        
        listItem.appendChild(medInfo);
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);
    });
}

function resetMedicationFields() {
    document.getElementById('medication').value = '';
    document.getElementById('dosage').value = '';
    document.getElementById('frequency').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('custom-medication-name').value = '';
    document.getElementById('custom-medication-description').value = '';
    document.getElementById('custom-dosage-form').value = '';
    document.getElementById('custom-strength').value = '';
    document.getElementById('custom-medication-toggle').checked = false;
    document.getElementById('custom-medication-fields').style.display = 'none';
    document.getElementById('medication').disabled = false;
    document.getElementById('medication-search').value = '';
}

  document.getElementById('prescription-form').addEventListener('submit', async(e) => {
    e.preventDefault();
    if (validateForm()) {

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
                medicationId: medication.isCustom ? null : medication.medicationId,
                customMedicationName: medication.isCustom ? medication.customName : null,
                customMedicationDescription: medication.isCustom ? medication.customDescription : null,
                customDosageForm: medication.isCustom ? medication.customDosageForm : null,
                customStrength: medication.isCustom ? medication.customStrength : null,
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
            const patientId = urlParams.get('patientId');
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