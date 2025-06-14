
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

         const listItem = document.createElement('li');
         listItem.textContent = `${medicationName} - جرعة: ${dosage}, مرات يومية: ${frequency}, مدة: ${duration}`;

         // إضافة زر الحذف
         const deleteButton = document.createElement('button');
         deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2');
         deleteButton.textContent = 'حذف';
         deleteButton.onclick = () => removeMedication(medication, listItem);

         listItem.appendChild(deleteButton);
         document.getElementById('medication-list').appendChild(listItem);

         document.getElementById('dosage').value = '';
         document.getElementById('frequency').value = '';
         document.getElementById('duration').value = '';
     } else {
         showMessage('يرجى ملء جميع الحقول قبل إضافة الدواء', true);
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