let selectedMedications = [];
let doctors = [];
let patients = [];
let medications = [];
let doctorData = JSON.parse(localStorage.getItem("doctorData"));

// تبديل حالة حقول الدواء المخصص
document.getElementById('custom-medication-toggle')?.addEventListener('change', function() {
    const customFields = document.getElementById('custom-medication-fields');
    const medicationSelect = document.getElementById('medication');
    
    if (this.checked) {
        if (customFields) customFields.style.display = 'block';
        if (medicationSelect) {
            medicationSelect.disabled = true;
            medicationSelect.value = '';
        }
    } else {
        if (customFields) customFields.style.display = 'none';
        if (medicationSelect) medicationSelect.disabled = false;
    }
});






function validateForm() {
    let isValid = true;
    
    // مسح رسائل الخطأ السابقة
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    
    // التحقق من اختيار المريض
    const patientSelect = document.getElementById('patient');
    if (!patientSelect?.value) {
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
    const isCustom = document.getElementById('custom-medication-toggle')?.checked || false;
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
        
        if (!customName?.value.trim()) {
            showFieldError(customName, 'اسم الدواء المخصص مطلوب');
            isValid = false;
        }
        
        if (!customDesc?.value.trim()) {
            showFieldError(customDesc, 'وصف الدواء المخصص مطلوب');
            isValid = false;
        }
        
        if (!dosage?.value.trim()) {
            showFieldError(dosage, 'حقل الجرعة مطلوب');
            isValid = false;
        }
        
        if (!frequency?.value.trim()) {
            showFieldError(frequency, 'حقل عدد المرات مطلوب');
            isValid = false;
        } else if (isNaN(frequency.value) || parseInt(frequency.value) <= 0) {
            showFieldError(frequency, 'يجب أن يكون عدد المرات رقم صحيح موجب');
            isValid = false;
        }
        
        if (!duration?.value.trim()) {
            showFieldError(duration, 'حقل المدة مطلوب');
            isValid = false;
        }
        
        if (customName && customName.value.length > 100) {
            showFieldError(customName, 'اسم الدواء يجب أن لا يتجاوز 100 حرف');
            isValid = false;
        }
        
        if (selectedMedications.some(m => m.isCustom && m.customName === customName?.value)) {
            showFieldError(customName, 'هذا الدواء المخصص مضاف مسبقاً');
            isValid = false;
        }
    } else {
        // التحقق من حقول الدواء الموجود
        const medicationSelect = document.getElementById('medication');
        const dosage = document.getElementById('dosage');
        const frequency = document.getElementById('frequency');
        const duration = document.getElementById('duration');
        
        if (!medicationSelect?.value) {
            showFieldError(medicationSelect, 'يجب اختيار الدواء');
            isValid = false;
        }
        
        if (!dosage?.value.trim()) {
            showFieldError(dosage, 'حقل الجرعة مطلوب');
            isValid = false;
        }
        
        if (!frequency?.value.trim()) {
            showFieldError(frequency, 'حقل عدد المرات مطلوب');
            isValid = false;
        } else if (isNaN(frequency.value) || parseInt(frequency.value) <= 0) {
            showFieldError(frequency, 'يجب أن يكون عدد المرات رقم صحيح موجب');
            isValid = false;
        }
        
        if (!duration?.value.trim()) {
            showFieldError(duration, 'حقل المدة مطلوب');
            isValid = false;
        }
    }
    
    return isValid;
}

function showFieldError(field, message) {
    if (!field) return;
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode?.appendChild(errorDiv);
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ✅ 1. تحميل المرضى (معدل)
async function loadPatients() {
    showLoading(true);
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/PatientController/All', {
            method: 'GET'
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

// ✅ 2. تحميل الأدوية (معدل)
async function loadMedications() {
    showLoading(true);
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Medication/All', {
            method: 'GET'
        });

        if (!response.ok) throw new Error('فشل في تحميل قائمة الأدوية');

        medications = await response.json();
        populateMedicationSelect(medications);
        
        // إظهار/إخفاء حقول الدواء المخصص
        const toggle = document.getElementById('custom-medication-toggle');
        if (toggle) {
            toggle.addEventListener('change', function() {
                const customFields = document.getElementById('custom-medication-fields');
                const medicationSelect = document.getElementById('medication');
                
                if (this.checked) {
                    if (customFields) customFields.style.display = 'block';
                    if (medicationSelect) {
                        medicationSelect.disabled = true;
                        medicationSelect.value = '';
                    }
                } else {
                    if (customFields) customFields.style.display = 'none';
                    if (medicationSelect) medicationSelect.disabled = false;
                }
            });
        }
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        showLoading(false);
    }
}

function populatePatientSelect(patientsList) {
    const patientSelect = document.getElementById('patient');
    if (!patientSelect) return;
    
    patientSelect.innerHTML = '<option value="">-- اختر المريض --</option>';
    patientsList.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.user?.fullName || ''} - ${patient.user?.email || ''} - ${patient.id}`;
        patientSelect.appendChild(option);
    });
}

function populateMedicationSelect(medicationsList) {
    const medicationSelect = document.getElementById('medication');
    if (!medicationSelect) return;
    
    medicationSelect.innerHTML = '<option value="">-- اختر الدواء --</option>';

    medicationsList.forEach(medication => {
        const option = document.createElement('option');
        option.value = medication.id;
        option.textContent = medication.name;
        medicationSelect.appendChild(option);
    });
}

function searchPatients() {
    const searchTerm = document.getElementById('patient-search')?.value.toLowerCase() || '';
    const filteredPatients = patients.filter(patient =>
        patient.user?.fullName?.toLowerCase().includes(searchTerm) ||
        (patient.user?.email?.toLowerCase().includes(searchTerm)) ||
        (patient.id?.toString().includes(searchTerm))
    );
    populatePatientSelect(filteredPatients.length ? filteredPatients : patients);
}

function searchLocalPatients(searchTerm) {
    return patients.filter(patient => {
        return (
            patient.user?.fullName?.toLowerCase().includes(searchTerm) ||
            (patient.user?.email && patient.user.email.toLowerCase().includes(searchTerm)) ||
            (patient.id?.toString().includes(searchTerm))
        );
    });
}

function searchMedications() {
    const searchTerm = document.getElementById('medication-search')?.value.toLowerCase() || '';
    const filteredMedications = medications.filter(medication =>
        medication.name.toLowerCase().includes(searchTerm)
    );
    populateMedicationSelect(filteredMedications.length ? filteredMedications : medications);
}

// إضافة دواء إلى القائمة
document.getElementById('add-medication')?.addEventListener('click', () => {
    if (validateMedicationBeforeAdd()) {
        const isCustom = document.getElementById('custom-medication-toggle')?.checked || false;
        
        if (isCustom) {
            // إضافة دواء مخصص
            const customName = document.getElementById('custom-medication-name')?.value.trim();
            const customDesc = document.getElementById('custom-medication-description')?.value.trim();
            const dosage = document.getElementById('dosage')?.value.trim();
            const frequency = document.getElementById('frequency')?.value.trim();
            const duration = document.getElementById('duration')?.value.trim();
            
            if (!customName || !dosage || !frequency || !duration) {
                showMessage('يرجى ملء جميع الحقول المطلوبة للدواء المخصص', true);
                return;
            }
            
            const medication = {
                isCustom: true,
                customName: customName,
                customDescription: customDesc,
                customDosageForm: document.getElementById('custom-dosage-form')?.value.trim() || '',
                customStrength: document.getElementById('custom-strength')?.value.trim() || '',
                dosage: dosage,
                frequency: frequency,
                duration: duration
            };
            
            selectedMedications.push(medication);
        } else {
            // إضافة دواء موجود
            const medicationSelect = document.getElementById('medication');
            const medicationId = medicationSelect?.value;
            const medicationName = medicationSelect?.options[medicationSelect.selectedIndex]?.text;
            const dosage = document.getElementById('dosage')?.value.trim();
            const frequency = document.getElementById('frequency')?.value.trim();
            const duration = document.getElementById('duration')?.value.trim();

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
                medicationId: parseInt(medicationId),
                medicationName: medicationName,
                dosage: dosage,
                frequency: frequency,
                duration: duration
            };

            selectedMedications.push(medication);
        }
        
        updateMedicationList();
        resetMedicationFields();
    }
});

function updateMedicationList() {
    const list = document.getElementById('medication-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    selectedMedications.forEach((med, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded';
        
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
    const medicationSelect = document.getElementById('medication');
    const dosage = document.getElementById('dosage');
    const frequency = document.getElementById('frequency');
    const duration = document.getElementById('duration');
    const customName = document.getElementById('custom-medication-name');
    const customDesc = document.getElementById('custom-medication-description');
    const customDosageForm = document.getElementById('custom-dosage-form');
    const customStrength = document.getElementById('custom-strength');
    const customToggle = document.getElementById('custom-medication-toggle');
    const customFields = document.getElementById('custom-medication-fields');
    const medicationSearch = document.getElementById('medication-search');
    
    if (medicationSelect) medicationSelect.value = '';
    if (dosage) dosage.value = '';
    if (frequency) frequency.value = '';
    if (duration) duration.value = '';
    if (customName) customName.value = '';
    if (customDesc) customDesc.value = '';
    if (customDosageForm) customDosageForm.value = '';
    if (customStrength) customStrength.value = '';
    if (customToggle) customToggle.checked = false;
    if (customFields) customFields.style.display = 'none';
    if (medicationSelect) medicationSelect.disabled = false;
    if (medicationSearch) medicationSearch.value = '';
}

//  3. إنشاء وصفة جديدة (معدل)

document.getElementById('prescription-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (validateForm()) {

        const doctorId = doctorData?.id;
        const patientId = document.getElementById('patient')?.value;

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

            const prescriptionData = {
                doctorId: parseInt(doctorId),
                patientId: parseInt(patientId),
                issuedDate: new Date().toISOString(),
                isDispensed: false,

                prescriptionItems: selectedMedications.map(medication => ({

                    medicationId:
                        medication.isCustom
                            ? null
                            : medication.medicationId,

                    customMedicationName:
                        medication.isCustom
                            ? medication.customName
                            : null,

                    customMedicationDescription:
                        medication.isCustom
                            ? medication.customDescription
                            : null,

                    customDosageForm:
                        medication.isCustom
                            ? medication.customDosageForm
                            : null,

                    customStrength:
                        medication.isCustom
                            ? medication.customStrength
                            : null,

                    dosage: medication.dosage,

                    frequency: medication.frequency.toString(),

                    duration: medication.duration.toString()

                }))
            };

            const prescriptionResponse = await fetchWithAuth(
                'https://localhost:7219/api/Prescription/CreatePrescription',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(prescriptionData)
                }
            );

            if (!prescriptionResponse.ok) {
                throw new Error('فشل في إنشاء الوصفة الطبية');
            }

            const prescription = await prescriptionResponse.json();

            showMessage('تم إضافة الوصفة الطبية بنجاح!', false);

            setTimeout(() => {
                window.location.href = './Prescriptions.html';
            }, 1500);

        }
        catch (error) {

            console.error(error);

            showMessage(error.message, true);
        }
        finally {
            showLoading(false);
        }
    }
});

function showLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    const formDiv = document.getElementById('prescription-form');
    
    if (loadingDiv) loadingDiv.style.display = isLoading ? 'flex' : 'none';
    if (formDiv) formDiv.style.display = isLoading ? 'none' : 'block';
}

function showMessage(message, isError) {
    const messageBox = isError ?
        document.getElementById('error-message') :
        document.getElementById('success-message');

    if (messageBox) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
}

// ✅ 4. الحصول على وصفات المريض (معدل)
async function GetPatientsById(patientId) {
    try {
        const prescriptionsResponse = await fetchWithAuth('https://localhost:7219/api/Prescription/MyPrescriptions', {
            method: 'GET'
        });

        if (!prescriptionsResponse.ok) throw new Error('فشل في تحميل الوصفات الطبية');

        const allPrescriptions = await prescriptionsResponse.json();

        if (allPrescriptions.length === 0) {
            alert("المريض غير موجود!");
            return;
        }

        const patient = allPrescriptions[0].patient;
        const patientSelect = document.getElementById('patient');
        
        if (patientSelect) {
            patientSelect.innerHTML = '';
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.user?.fullName || ''} - ${patient.user?.email || ''} - ${patient.id}`;
            patientSelect.appendChild(option);
        }

    } catch (error) {
        alert("المريض غير موجود!");
    }
}

// بدء التحميل عند فتح الصفحة
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    
    const doctorIdField = document.getElementById('doctorId');
    if (doctorIdField && doctorData) {
        doctorIdField.value = doctorData.id;
    }
    
    const patientSearch = document.getElementById('patient-search');
    const lblPatient = document.getElementById('lblPatient');
    const lblPatientList = document.getElementById('lblPatient-list');
    
    if (patientId) {
        if (patientSearch) {
            patientSearch.value = patientId;
            const a = document.createAttribute("readonly");
            patientSearch.setAttributeNode(a);
        }
        if (lblPatient) lblPatient.textContent = "رقم المريض";
        searchPatients();
        GetPatientsById(patientId);
        if (lblPatientList) lblPatientList.textContent = "بيانات المريض";
    }
    
    loadPatients();
    loadMedications();
};