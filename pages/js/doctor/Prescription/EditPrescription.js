let selectedMedications = [];
let existingPrescriptionItemIds = [];
let doctors = [];
let patients = [];
let medications = [];
let prescriptionId;
let doctorData = JSON.parse(localStorage.getItem("doctorData"));
let originalPatientId = null;

// ✅ 1. تحميل الأدوية
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

// ✅ 2. تحميل بيانات الوصفة
async function loadPrescriptionData(id) {
    showLoading(true);
    try {
        // جلب بيانات الوصفة
        const prescriptionResponse = await fetchWithAuth(`https://localhost:7219/api/Prescription/${id}`, {
            method: 'GET'
        });

        if (!prescriptionResponse.ok) throw new Error('فشل في تحميل بيانات الوصفة');

        const prescription = await prescriptionResponse.json();

        // حفظ patientId الأصلي
        originalPatientId = prescription.patientId;
        prescriptionId = prescription.id;

        // جلب بيانات المريض
        const patientResponse = await fetchWithAuth(`https://localhost:7219/api/PatientController/${prescription.patientId}`, {
            method: 'GET'
        });

        if (!patientResponse.ok) throw new Error('فشل في تحميل بيانات المريض');

        const patient = await patientResponse.json();
        
        const patientField = document.getElementById('patient');
        const patientIdField = document.getElementById('patientId');
        
        if (patientField) patientField.value = `${patient.user?.fullName || ''} - ${patient.user?.email || ''}`;
        if (patientIdField) patientIdField.value = patient.id;

        // تحويل الأدوية إلى نفس هيكل CreatePrescriptionDto
        selectedMedications = await Promise.all(prescription.prescriptionItems.map(async item => {
            if (!item.medicationId) {
                return {
                    medicationId: null,
                    customMedicationName: item.customMedicationName || '',
                    customMedicationDescription: item.customMedicationDescription || '',
                    customDosageForm: item.customDosageForm || '',
                    customStrength: item.customStrength || '',
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration
                };
            }

            const medResponse = await fetchWithAuth(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                method: 'GET'
            });

            const medication = await medResponse.json();
            return {
                medicationId: item.medicationId,
                customMedicationName: null,
                customMedicationDescription: null,
                customDosageForm: null,
                customStrength: null,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration
            };
        }));

        updateMedicationList();

    } catch (error) {
        showMessage(error.message, true);
    } finally {
        showLoading(false);
    }
}

// عرض قائمة الأدوية في الـ Select
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

// البحث في الأدوية
function searchMedications() {
    const searchTerm = document.getElementById('medication-search')?.value.toLowerCase() || '';
    const filteredMedications = medications.filter(medication =>
        medication.name.toLowerCase().includes(searchTerm)
    );
    populateMedicationSelect(filteredMedications.length ? filteredMedications : medications);
}

// تحديث قائمة الأدوية المختارة
function updateMedicationList() {
    const medicationList = document.getElementById('medication-list');
    if (!medicationList) return;
    
    medicationList.innerHTML = '';
    
    selectedMedications.forEach((medication, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded';

        const medicationName = medication.medicationId 
            ? (medications.find(m => m.id == medication.medicationId)?.name || 'دواء')
            : (medication.customMedicationName || 'دواء مخصص');
            
        const medInfo = document.createElement('span');
        medInfo.textContent = `${medicationName} - جرعة: ${medication.dosage || '-'}، ${medication.frequency || '-'} مرات/يوم، لمدة ${medication.duration || '-'}`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i> حذف';
        deleteButton.onclick = () => {
            selectedMedications.splice(index, 1);
            updateMedicationList();
        };

        listItem.appendChild(medInfo);
        listItem.appendChild(deleteButton);
        medicationList.appendChild(listItem);
    });
}

// إضافة دواء جديد إلى الوصفة
document.getElementById('add-medication')?.addEventListener('click', () => {
    const medicationSelect = document.getElementById('medication');
    const dosageInput = document.getElementById('dosage');
    const frequencyInput = document.getElementById('frequency');
    const durationInput = document.getElementById('duration');
    const searchInput = document.getElementById('medication-search');
    
    const medicationId = medicationSelect?.value;
    const medicationName = medicationSelect?.options[medicationSelect.selectedIndex]?.text;
    const dosage = dosageInput?.value;
    const frequency = frequencyInput?.value;
    const duration = durationInput?.value;

    if (!dosage || !frequency || !duration) {
        showMessage('يرجى ملء جميع حقول الدواء قبل الإضافة', true);
        return;
    }

    let medication;
    
    if (medicationId) {
        // دواء موجود
        medication = {
            medicationId: parseInt(medicationId),
            customMedicationName: null,
            customMedicationDescription: null,
            customDosageForm: null,
            customStrength: null,
            dosage: dosage,
            frequency: frequency,
            duration: duration
        };
        
        if (selectedMedications.some(m => m.medicationId === medicationId)) {
            showMessage('هذا الدواء مضاف مسبقاً إلى الوصفة', true);
            return;
        }
    } else {
        // دواء مخصص - سيتم فتح popup أو حقول إضافية حسب تصميمك
        showMessage('يرجى اختيار دواء من القائمة أو استخدام الدواء المخصص', true);
        return;
    }

    selectedMedications.push(medication);
    updateMedicationList();

    if (medicationSelect) medicationSelect.value = '';
    if (dosageInput) dosageInput.value = '';
    if (frequencyInput) frequencyInput.value = '';
    if (durationInput) durationInput.value = '';
    if (searchInput) searchInput.value = '';
});

// ✅ 3. تحديث الوصفة (بطلب واحد - الكل في نفس الوقت)
document.getElementById('prescription-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const doctorId = doctorData?.id;
    const patientId = document.getElementById('patientId')?.value;

    if (!doctorId || !patientId) {
        showMessage('يرجى اختيار الطبيب والمريض', true);
        return;
    }

    if (selectedMedications.length === 0) {
        showMessage('يرجى إضافة دواء واحد على الأقل إلى الوصفة', true);
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
                medicationId: med.medicationId || null,
                customMedicationName: med.customMedicationName || null,
                customMedicationDescription: med.customMedicationDescription || null,
                customDosageForm: med.customDosageForm || null,
                customStrength: med.customStrength || null,
                dosage: med.dosage,
                frequency: med.frequency.toString(),
                duration: med.duration.toString()
            }))
        };

        console.log('Sending update data:', prescriptionData);

        //  طلب واحد فقط لتحديث كل شيء
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescriptionData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل في تحديث الوصفة الطبية');
        }

        showMessage('تم تعديل الوصفة الطبية بنجاح!', false);
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

// عرض مؤشر التحميل
function showLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    const formDiv = document.getElementById('prescription-form');
    
    if (loadingDiv) loadingDiv.style.display = isLoading ? 'flex' : 'none';
    if (formDiv) formDiv.style.display = isLoading ? 'none' : 'block';
}

// عرض الرسائل
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

// بدء التحميل عند فتح الصفحة
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        loadMedications();
        loadPrescriptionData(id);
    } else {
        showMessage('لم يتم تحديد معرف الوصفة', true);
    }
};