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

// ✅ 1. تحميل الأطباء
async function loadDoctors() {
    showLoading(true);
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Doctor/All', {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('فشل في تحميل قائمة الأطباء');
        
        doctors = await response.json();
        const doctorSelect = document.getElementById('doctor');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">-- اختر الطبيب --</option>';
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = doctor.user?.fullName || 'بدون اسم';
                doctorSelect.appendChild(option);
            });
        }
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        showLoading(false);
    }
}

// ✅ 2. تحميل المرضى
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

// ✅ 3. تحميل الأدوية
async function loadMedications() {
    showLoading(true);
    try {
        const response = await fetchWithAuth('https://localhost:7219/api/Medication/All', {
            method: 'GET'
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

// عرض قائمة المرضى
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

// عرض قائمة الأدوية
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

// البحث في المرضى
function searchPatients() {
    const searchTerm = document.getElementById('patient-search')?.value.toLowerCase() || '';
    const filteredPatients = patients.filter(patient =>
        patient.user?.fullName?.toLowerCase().includes(searchTerm) ||
        patient.user?.email?.toLowerCase().includes(searchTerm) ||
        patient.id?.toString().includes(searchTerm)
    );
    populatePatientSelect(filteredPatients.length ? filteredPatients : patients);
}

// البحث في الأدوية
function searchMedications() {
    const searchTerm = document.getElementById('medication-search')?.value.toLowerCase() || '';
    const filteredMedications = medications.filter(medication =>
        medication.name.toLowerCase().includes(searchTerm)
    );
    populateMedicationSelect(filteredMedications.length ? filteredMedications : medications);
}

// ✅ دالة التحقق من صحة الوصفة
function validatePrescriptionForm() {
    document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');
    document.getElementById('error-message').style.display = 'none';
    
    const doctorId = document.getElementById('doctor')?.value;
    const patientId = document.getElementById('patient')?.value;
    const medicationsCount = selectedMedications.length;
    
    let isValid = true;
    
    if (!doctorId) {
        const errorEl = document.getElementById('doctorError');
        if (errorEl) errorEl.textContent = 'يجب اختيار الطبيب';
        isValid = false;
    }
    
    if (!patientId) {
        const errorEl = document.getElementById('patientError');
        if (errorEl) errorEl.textContent = 'يجب اختيار المريض';
        isValid = false;
    }
    
    if (medicationsCount === 0) {
        const errorEl = document.getElementById('medicationError');
        if (errorEl) errorEl.textContent = 'يجب إضافة دواء واحد على الأقل';
        isValid = false;
    }
    
    if (!isValid) {
        showMessage('يوجد أخطاء في البيانات المدخلة. يرجى مراجعة الحقول المطلوبة', true);
    }
    
    return isValid;
}

// ✅ دالة التحقق من صحة الدواء قبل الإضافة
function validateMedicationBeforeAdd() {
    document.getElementById('dosageError')?.setAttribute?.('textContent', '');
    document.getElementById('frequencyError')?.setAttribute?.('textContent', '');
    document.getElementById('durationError')?.setAttribute?.('textContent', '');
    
    const isCustomMed = document.getElementById('custom-medication-toggle')?.checked || false;
    const medicationSelect = document.getElementById('medication');
    const medicationId = medicationSelect?.value;
    const dosage = document.getElementById('dosage')?.value.trim();
    const frequency = document.getElementById('frequency')?.value.trim();
    const duration = document.getElementById('duration')?.value.trim();
    
    let isValid = true;
    
    if (!isCustomMed && !medicationId) {
        const errorEl = document.getElementById('medicationError');
        if (errorEl) errorEl.textContent = 'يجب اختيار الدواء';
        isValid = false;
    }
    
    if (!dosage) {
        const errorEl = document.getElementById('dosageError');
        if (errorEl) errorEl.textContent = 'حقل الجرعة مطلوب';
        isValid = false;
    }
    
    if (!frequency) {
        const errorEl = document.getElementById('frequencyError');
        if (errorEl) errorEl.textContent = 'حقل عدد المرات مطلوب';
        isValid = false;
    } else if (isNaN(frequency) || parseInt(frequency) <= 0) {
        const errorEl = document.getElementById('frequencyError');
        if (errorEl) errorEl.textContent = 'يجب إدخال رقم صحيح موجب';
        isValid = false;
    }
    
    if (!duration) {
        const errorEl = document.getElementById('durationError');
        if (errorEl) errorEl.textContent = 'حقل المدة مطلوب';
        isValid = false;
    }
    
    if (isCustomMed) {
        const customName = document.getElementById('custom-medication-name')?.value.trim();
        const customDesc = document.getElementById('custom-medication-description')?.value.trim();
        
        if (!customName) {
            const errorEl = document.getElementById('customMedicationError');
            if (errorEl) errorEl.textContent = 'اسم الدواء المخصص مطلوب';
            isValid = false;
        }
        
        if (!customDesc) {
            const errorEl = document.getElementById('customMedicationError');
            if (errorEl) errorEl.textContent = 'وصف الدواء المخصص مطلوب';
            isValid = false;
        }
    }
    
    return isValid;
}

// ✅ إضافة دواء إلى القائمة
document.getElementById('add-medication')?.addEventListener('click', () => {
    if (validateMedicationBeforeAdd()) {
        const isCustomMed = document.getElementById('custom-medication-toggle')?.checked || false;
        let medicationName, medicationId;
        
        if (isCustomMed) {
            medicationName = document.getElementById('custom-medication-name')?.value;
            medicationId = null;
        } else {
            medicationId = parseInt(document.getElementById('medication')?.value);
            medicationName = document.getElementById('medication')?.options[document.getElementById('medication').selectedIndex]?.text;
        }
        
        const dosage = document.getElementById('dosage')?.value;
        const frequency = document.getElementById('frequency')?.value;
        const duration = document.getElementById('duration')?.value;
        
        // التحقق من عدم تكرار الدواء
        if (!isCustomMed && selectedMedications.some(m => !m.isCustom && m.medicationId === medicationId)) {
            showMessage('هذا الدواء مضاف مسبقاً إلى الوصفة', true);
            return;
        }
        
        const medication = {
            medicationId: medicationId,
            medicationName: medicationName,
            isCustom: isCustomMed,
            customName: isCustomMed ? document.getElementById('custom-medication-name')?.value : null,
            customDescription: isCustomMed ? document.getElementById('custom-medication-description')?.value : null,
            customDosageForm: isCustomMed ? document.getElementById('custom-dosage-form')?.value : null,
            customStrength: isCustomMed ? document.getElementById('custom-strength')?.value : null,
            dosage: dosage,
            frequency: frequency,
            duration: duration
        };
        
        selectedMedications.push(medication);
        updateMedicationList();
        resetMedicationFields();
    }
});

// ✅ تحديث قائمة الأدوية المختارة
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
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.onclick = () => {
            selectedMedications.splice(index, 1);
            updateMedicationList();
        };
        
        listItem.appendChild(medInfo);
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);
    });
}

// ✅ إعادة تعيين حقول الدواء
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

// ✅ 5. إنشاء وصفة جديدة (بطلب واحد)
document.getElementById('prescription-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validatePrescriptionForm()) {
        return;
    }

    const doctorId = document.getElementById('doctor')?.value;
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
        // بناء البيانات بنفس هيكل CreatePrescriptionDto
        const prescriptionData = {
            doctorId: parseInt(doctorId),
            patientId: parseInt(patientId),
            issuedDate: new Date().toISOString(),
            isDispensed: false,
            prescriptionItems: selectedMedications.map(med => ({
                medicationId: med.isCustom ? null : med.medicationId,
                customMedicationName: med.isCustom ? med.customName : null,
                customMedicationDescription: med.isCustom ? med.customDescription : null,
                customDosageForm: med.isCustom ? med.customDosageForm : null,
                customStrength: med.isCustom ? med.customStrength : null,
                dosage: med.dosage,
                frequency: med.frequency.toString(),
                duration: med.duration.toString()
            }))
        };

        console.log('Sending create data:', prescriptionData);

        const response = await fetchWithAuth('https://localhost:7219/api/Prescription/CreatePrescription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescriptionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل في إنشاء الوصفة الطبية');
        }

        showMessage('تم إضافة الوصفة الطبية بنجاح!', false);
        setTimeout(() => {
            window.location.href = './Prescriptions.html';
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message, true);
    } finally {
        showLoading(false);
    }
});

// دوال مساعدة
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
    } else {
        alert(message);
    }
}

// ✅ بدء التحميل عند فتح الصفحة
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
    
    loadDoctors();
    loadPatients();
    loadMedications();
};