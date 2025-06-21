
 let selectedMedications = [];
 let doctors = [];
 let patients = [];
 let medications = [];

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





 
        /**
 * دالة التحقق من صحة بيانات الوصفة الطبية
 * @returns {boolean} true إذا كانت البيانات صحيحة، false إذا كان هناك أخطاء
 */
function validatePrescriptionForm() {
    // مسح رسائل الخطأ السابقة
    document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');
    document.getElementById('error-message').style.display = 'none';
    
    // الحصول على قيم الحقول
    const doctorId = document.getElementById('doctor').value;
    const patientId = document.getElementById('patient').value;
    const medications = document.querySelectorAll('#medication-list li');
    
    // متغير لتتبع صحة البيانات
    let isValid = true;
    
    // التحقق من اختيار الطبيب
    if (!doctorId) {
        document.getElementById('doctorError').textContent = 'يجب اختيار الطبيب';
        isValid = false;
    }
    
    // التحقق من اختيار المريض
    if (!patientId) {
        document.getElementById('patientError').textContent = 'يجب اختيار المريض';
        isValid = false;
    }
    
    // التحقق من وجود أدوية مضافة
    if (medications.length === 0) {
        document.getElementById('medicationError').textContent = 'يجب إضافة دواء واحد على الأقل';
        isValid = false;
    }
    
    // إذا كانت هناك أخطاء، عرض رسالة عامة
    if (!isValid) {
        showError('يوجد أخطاء في البيانات المدخلة. يرجى مراجعة الحقول المطلوبة');
    }
    
    return isValid;
}

/**
 * دالة التحقق من صحة بيانات الدواء قبل إضافته للقائمة
 * @returns {boolean} true إذا كانت البيانات صحيحة، false إذا كان هناك أخطاء
 */
function validateMedicationBeforeAdd() {
    // مسح رسائل الخطأ السابقة
    document.getElementById('dosageError').textContent = '';
    document.getElementById('frequencyError').textContent = '';
    document.getElementById('durationError').textContent = '';
    
    // الحصول على قيم الحقول
    const medicationId = document.getElementById('medication').value;
    const dosage = document.getElementById('dosage').value.trim();
    const frequency = document.getElementById('frequency').value.trim();
    const duration = document.getElementById('duration').value.trim();
    
    // متغير لتتبع صحة البيانات
    let isValid = true;
    
    // التحقق من اختيار الدواء
    if (!medicationId) {
        document.getElementById('medicationError').textContent = 'يجب اختيار الدواء';
        isValid = false;
    }
    
    // التحقق من إدخال الجرعة
    if (!dosage) {
        document.getElementById('dosageError').textContent = 'حقل الجرعة مطلوب';
        isValid = false;
    }
    
    // التحقق من إدخال عدد المرات
    if (!frequency) {
        document.getElementById('frequencyError').textContent = 'حقل عدد المرات مطلوب';
        isValid = false;
    } else if (isNaN(frequency) || parseInt(frequency) <= 0) {
        document.getElementById('frequencyError').textContent = 'يجب إدخال رقم صحيح موجب';
        isValid = false;
    }
    
    // التحقق من إدخال المدة
    if (!duration) {
        document.getElementById('durationError').textContent = 'حقل المدة مطلوب';
        isValid = false;
    }
    
    return isValid;
}

// دالة لعرض رسالة الخطأ
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.style.display = 'block';
    errorElement.textContent = message;
    errorElement.classList.add('alert-danger');
    errorElement.classList.remove('alert-success');
    
    // التمرير لأعلى لعرض الرسالة
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// دالة لعرض رسالة النجاح
function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    successElement.style.display = 'block';
    successElement.textContent = message;
    successElement.classList.add('alert-success');
    successElement.classList.remove('alert-danger');
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}






// استخدام الدوال في الأحداث


 document.getElementById('add-medication').addEventListener('click', () => {
      if (validateMedicationBeforeAdd()) {
    
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

         const listItem = document.createElement('li');
         listItem.textContent = `${medicationName} - جرعة: ${dosage}, مرات يومية: ${frequency}, مدة: ${duration}`;

         // إضافة زر الحذف
         const deleteButton = document.createElement('button');
         deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2');
         deleteButton.textContent = 'حذف';
         deleteButton.onclick = () => removeMedication(medication, listItem);

         listItem.appendChild(deleteButton);
         listItem.classList = 'm-2'
         document.getElementById('medication-list').appendChild(listItem);

         document.getElementById('dosage').value = '';
         document.getElementById('frequency').value = '';
         document.getElementById('duration').value = '';
        }
      else {
         showMessage('يرجى ملء جميع الحقول قبل إضافة الدواء', true);
     }
      }
 });

 function removeMedication(medication, listItem) {
     // إزالة الدواء من قائمة الأدوية المضافة
     selectedMedications = selectedMedications.filter(m => m.medicationId !== medication.medicationId);

     // إزالة العنصر من واجهة المستخدم
     listItem.remove();
 }

 


 document.getElementById('prescription-form').addEventListener('submit', async(event) => {
     event.preventDefault();

         if (validatePrescriptionForm()) {

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

     const prescriptionResponse = await fetch('https://localhost:7219/api/Prescription/CreatePrescription', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
             'Authorization': 'Bearer ' + localStorage.getItem('token')
         },
         body: JSON.stringify(prescriptionData)
     });

     const prescription = await prescriptionResponse.json();

     for (let medication of selectedMedications) {
         const prescriptionItemData = {
             prescriptionId: prescription.id,
             medicationId: medication.medicationId,
             dosage: medication.dosage,
             frequency: medication.frequency,
             duration: medication.duration
         };

         await fetch('https://localhost:7219/api/PrescriptionItem/CreatePrescriptionItem', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + localStorage.getItem('token')

             },
             body: JSON.stringify(prescriptionItemData)
         });
     }

     showMessage('تم إضافة الوصفة الطبية بنجاح!', false);
     window.location.href = './Prescriptions.html';
    }
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