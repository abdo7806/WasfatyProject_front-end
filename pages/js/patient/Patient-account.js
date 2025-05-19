  // عناصر DOM
        const DOM = {
            patientName: document.getElementById('patient-name'),
            patientEmail: document.getElementById('patient-email'),
            patientBloodType: document.getElementById('patient-blood-type'),
            patientDob: document.getElementById('patient-dob'),
            fullName: document.getElementById('full-name'),
            email: document.getElementById('email'),
            dob: document.getElementById('dob'),
            bloodType: document.getElementById('blood-type'),
            maleRadio: document.getElementById('male'),
            femaleRadio: document.getElementById('female'),
            allergies: document.getElementById('allergies'),
            chronicDiseases: document.getElementById('chronic-diseases'),
            regularMedications: document.getElementById('regular-medications'),
            prescriptionsList: document.getElementById('prescriptions-list'),
            prescriptionsLoading: document.getElementById('prescriptions-loading'),
            prescriptionsTable: document.getElementById('prescriptions-table'),
            noPrescriptions: document.getElementById('no-prescriptions'),
            loadingIndicator: document.getElementById('loading-indicator')
        };

        // تحميل البيانات عند فتح الصفحة
        document.addEventListener('DOMContentLoaded', async function() {
            await loadPatientData();
            await loadPrescriptions();
            setupEventListeners();
        });

        // تحميل بيانات المريض
        async function loadPatientData() {
            try {
                showLoading(true);
                const patient = JSON.parse(localStorage.getItem("patientData"));
                if (!patient?.id) throw new Error("بيانات المريض غير صالحة");

                const response = await fetch(`https://localhost:7219/api/PatientController/${patient.id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                
                if (!response.ok) throw new Error("فشل تحميل بيانات المريض");
                const patientData = await response.json();

                if (!patientData.user) throw new Error("بيانات المستخدم غير موجودة");

                // تعبئة البيانات
                DOM.patientName.textContent = patientData.user.fullName;
                DOM.patientEmail.textContent = patientData.user.email;
                DOM.patientBloodType.textContent = patientData.bloodType?.toUpperCase() || 'غير محدد';
                DOM.patientDob.textContent = formatDate(patientData.dateOfBirth);
                
                DOM.fullName.value = patientData.user.fullName;
                DOM.email.value = patientData.user.email;
                DOM.dob.value = patientData.dateOfBirth;
                DOM.bloodType.value = patientData.bloodType?.toUpperCase() || '';
                
                // تحديد الجنس
                const gender = patientData.gender === 'F' ? 'F' : 'M';
                if (gender === 'M') {
                    DOM.maleRadio.checked = true;
                } else {
                    DOM.femaleRadio.checked = true;
                }

            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        // تحميل الوصفات الطبية
        async function loadPrescriptions() {
            try {
                DOM.prescriptionsLoading.classList.remove('d-none');
                DOM.prescriptionsTable.classList.add('d-none');
                DOM.noPrescriptions.classList.add('d-none');
                
                const patientData = JSON.parse(localStorage.getItem("patientData"));
                if (!patientData?.id) throw new Error("بيانات المريض غير صالحة");

                const response = await fetch(`https://localhost:7219/api/Prescription/GetByPatientId/${patientData.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('فشل في جلب الوصفات الطبية');

                const prescriptions = await response.json();
                renderPrescriptions(prescriptions);

            } catch (error) {
                console.error('Error:', error);
                DOM.prescriptionsList.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i> حدث خطأ أثناء جلب الوصفات الطبية
                        </td>
                    </tr>
                `;
                DOM.prescriptionsTable.classList.remove('d-none');
            } finally {
                DOM.prescriptionsLoading.classList.add('d-none');
            }
        }

        // عرض الوصفات
        function renderPrescriptions(prescriptions) {
            DOM.prescriptionsList.innerHTML = '';
            
            if (!prescriptions || prescriptions.length === 0) {
                DOM.prescriptionsTable.classList.add('d-none');
                DOM.noPrescriptions.classList.remove('d-none');
                return;
            }
            
            prescriptions.forEach(prescription => {
                const row = document.createElement('tr');
                row.className = 'prescription-item';
                
                const doctorName = prescription.doctor?.user?.fullName || 'غير معروف';
                const medicalCenterName = prescription.doctor?.medicalCenter?.name || 'غير معروف';
                
                row.innerHTML = `
                    <td>${prescription.id}</td>
                    <td>${formatDate(prescription.issuedDate)}</td>
                    <td>${doctorName}</td>
                    <td>${medicalCenterName}</td>
                    <td>${prescription.prescriptionItems?.length || 0}</td>
                    <td><span class="badge ${prescription.isDispensed ? 'bg-success' : 'bg-warning'}">${prescription.isDispensed ? 'منتهية' : 'نشطة'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-prescription-btn" data-id="${prescription.id}">
                            <i class="bi bi-eye"></i> عرض
                        </button>
                    </td>
                `;
                
                DOM.prescriptionsList.appendChild(row);
            });
            
            DOM.prescriptionsTable.classList.remove('d-none');
            DOM.noPrescriptions.classList.add('d-none');
            
            // إضافة مستمعي الأحداث لأزرار العرض
            document.querySelectorAll('.view-prescription-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const prescriptionId = parseInt(this.getAttribute('data-id'));
                    viewPrescription(prescriptionId);
                });
            });
        }

        // عرض تفاصيل الوصفة
        async function viewPrescription(prescriptionId) {
            try {
                showLoading(true);
                const response = await fetch(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                });
                
                if (!response.ok) throw new Error('فشل تحميل بيانات الوصفة');
                const prescription = await response.json();
            
                const doctorName = prescription.doctor?.user?.fullName || 'غير معروف';
                const specialization = prescription.doctor?.specialization || 'غير معروف';
                const licenseNumber = prescription.doctor?.licenseNumber || 'غير معروف';
                const medicalCenterName = prescription.doctor?.medicalCenter?.name || 'غير معروف';
                const medicalCenterAddress = prescription.doctor?.medicalCenter?.address || 'غير معروف';
                const medicalCenterPhone = prescription.doctor?.medicalCenter?.phone || 'غير معروف';
                
                const modalBody = document.getElementById('prescription-details');
                modalBody.innerHTML = `
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="doctor-info">
                                <h6><i class="bi bi-person-badge"></i> معلومات الطبيب</h6>
                                <p><strong>الاسم:</strong> ${doctorName}</p>
                                <p><strong>التخصص:</strong> ${specialization}</p>
                                <p><strong>رقم الرخصة:</strong> ${licenseNumber}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="medical-center-info">
                                <h6><i class="bi bi-hospital"></i> معلومات المركز الطبي</h6>
                                <p><strong>الاسم:</strong> ${medicalCenterName}</p>
                                <p><strong>العنوان:</strong> ${medicalCenterAddress}</p>
                                <p><strong>الهاتف:</strong> ${medicalCenterPhone}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <p><strong>رقم الوصفة:</strong> ${prescription.id}</p>
                            <p><strong>التاريخ:</strong> ${formatDate(prescription.issuedDate)}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>الحالة:</strong> <span class="badge ${prescription.isDispensed ? 'bg-success' : 'bg-warning'}">${prescription.isDispensed ? 'منتهية' : 'نشطة'}</span></p>
                        </div>
                    </div>
                    
                    <h5 class="mb-3"><i class="bi bi-capsule"></i> الأدوية:</h5>
                    ${prescription.prescriptionItems && prescription.prescriptionItems.length > 0 ? 
                        `<ul class="list-group">
                            ${prescription.prescriptionItems.map(item => `
                                <li class="list-group-item">
                                    <strong>${item.medicationName || 'غير معروف'}</strong><br>
                                    الجرعة: ${item.dosage || 'غير محدد'}، ${item.frequency || 'غير محدد'}، لمدة ${item.duration || 'غير محدد'}
                                </li>
                            `).join('')}
                        </ul>` : 
                        '<div class="alert alert-info">لا توجد أدوية مسجلة في هذه الوصفة</div>'}
                `;
                
                const modal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
                modal.show();
                
            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                showLoading(false);
            }
        }







      



        // إعداد مستمعي الأحداث
        function setupEventListeners() {
            // تعديل المعلومات الشخصية
            document.getElementById('edit-personal-btn').addEventListener('click', function() {
                enableFormEditing('personal-info-form', 'personal-actions');
            });
            
            document.getElementById('cancel-personal-btn').addEventListener('click', function() {
                disableFormEditing('personal-info-form', 'personal-actions');
                loadPatientData();
            });
            
            document.getElementById('save-personal-btn').addEventListener('click', async function() {
                   // هنا سيتم إرسال البيانات إلى API
                disableFormEditing('personal-info-form', 'personal-actions');
                await updatePatientData();
                
            });
            
            // تعديل المعلومات الطبية
            document.getElementById('edit-medical-btn').addEventListener('click', function() {
                enableFormEditing('medical-info-form', 'medical-actions');
            });
            
            document.getElementById('cancel-medical-btn').addEventListener('click', function() {
                disableFormEditing('medical-info-form', 'medical-actions');
                loadPatientData();
            });
            
            document.getElementById('save-medical-btn').addEventListener('click', async function() {
                await updateMedicalData();
            });
            
            // تغيير كلمة المرور
            document.getElementById('change-password-btn').addEventListener('click', async function() {
                await changePassword();
            });
            
            // زر طباعة الوصفة
            document.getElementById('print-prescription-btn').addEventListener('click', function() {
                window.print();
            });
            
            // تغيير صورة الملف الشخصي
            document.getElementById('profile-upload').addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        document.getElementById('profile-pic').src = event.target.result;
                        // هنا سيتم رفع الصورة إلى الخادم
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }

        // تمكين تعديل النموذج
        function enableFormEditing(formId, actionsId) {
            const form = document.getElementById(formId);
            const inputs = form.querySelectorAll('input, select, textarea, input[type="radio"]');
            
            inputs.forEach(input => {
                if (input.id !== 'email') {
                    input.readOnly = false;
                    input.disabled = false;
                }
            });
            
            document.getElementById(actionsId).classList.remove('d-none');
        }

        // تعطيل تعديل النموذج
        function disableFormEditing(formId, actionsId) {
            const form = document.getElementById(formId);
            const inputs = form.querySelectorAll('input, select, textarea, input[type="radio"]');
            
            inputs.forEach(input => {
                input.readOnly = true;
                if (input.tagName === 'SELECT' || input.tagName === 'TEXTAREA' || input.type === 'radio') {
                    input.disabled = true;
                }
            });
            
            document.getElementById(actionsId).classList.add('d-none');
        }

        // تحديث بيانات المريض
        async function updatePatientData() {
            try {
                const patient = JSON.parse(localStorage.getItem("patientData"));
                if (!patient?.id) throw new Error("بيانات المريض غير صالحة");

                const fullName = DOM.fullName.value.trim();
                const email = DOM.email.value.trim();
                const dateOfBirth = DOM.dob.value;
                const bloodType = DOM.bloodType.value;
                const gender = document.querySelector('input[name="gender"]:checked')?.value || 'M';

                // التحقق من البيانات المطلوبة
                if (!fullName || !email || !dateOfBirth || !bloodType) {
                    throw new Error("الرجاء ملء جميع الحقول المطلوبة");
                }

                showLoading(true);

                // تحديث بيانات المريض
                const patientResponse = await fetch(`https://localhost:7219/api/PatientController/${patient.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        dateOfBirth,
                        gender,
                        bloodType
                    })
                });

                if (!patientResponse.ok) {
                    const errorText = await patientResponse.text();
                    throw new Error(errorText || "فشل تعديل بيانات المريض");
                }

                // تحديث بيانات المستخدم
                const userResponse = await fetch(`https://localhost:7219/api/User/${patient.userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        role: 3 // دور المريض
                    })
                });

                if (!userResponse.ok) {
                    const errorText = await userResponse.text();
                    throw new Error(errorText || 'فشل تحديث المستخدم');
                }

                showAlert('تم تحديث المعلومات الشخصية بنجاح', 'success');
                loadPatientData();

            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        // تحديث المعلومات الطبية
        async function updateMedicalData() {
            try {
                const patient = JSON.parse(localStorage.getItem("patientData"));
                if (!patient?.id) throw new Error("بيانات المريض غير صالحة");

                const allergies = DOM.allergies.value.trim();
                const chronicDiseases = DOM.chronicDiseases.value.trim();
                const regularMedications = DOM.regularMedications.value.trim();

                showLoading(true);

                // هنا سيتم إرسال البيانات إلى API لتحديث المعلومات الطبية
                const response = await fetch(`https://localhost:7219/api/PatientController/UpdateMedicalInfo/${patient.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        allergies,
                        chronicDiseases,
                        regularMedications
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "فشل تحديث المعلومات الطبية");
                }

                showAlert('تم تحديث المعلومات الطبية بنجاح', 'success');
                loadPatientData();

            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        // تغيير كلمة المرور
        async function changePassword() {
            try {
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                if (!currentPassword || !newPassword || !confirmPassword) {
                    throw new Error("يرجى ملء جميع الحقول");
                }
                
                if (newPassword !== confirmPassword) {
                    throw new Error("كلمة المرور الجديدة غير متطابقة");
                }
                
                if (newPassword.length < 6) {
                    throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                }

                const patient = JSON.parse(localStorage.getItem("patientData"));
                if (!patient?.userId) throw new Error("بيانات المريض غير صالحة");

                showLoading(true);

                const changePasswordData = {
                    userId: patient.userId,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                };

                const response = await fetch(`https://localhost:7219/api/Auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify(changePasswordData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'فشل تغيير كلمة المرور');
                }

                // مسح الحقول
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                
                showAlert('تم تغيير كلمة المرور بنجاح', 'success');

            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        // عرض تنبيه
        function showAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
            alertDiv.role = 'alert';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            const container = document.querySelector('.container');
            container.prepend(alertDiv);
            
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }

        // تنسيق التاريخ
        function formatDate(dateString) {
            if (!dateString) return 'غير محدد';
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // عرض/إخفاء مؤشر التحميل
        function showLoading(show) {
            if (show) {
                DOM.loadingIndicator.style.display = 'flex';
                document.querySelectorAll('button').forEach(btn => btn.disabled = true);
            } else {
                DOM.loadingIndicator.style.display = 'none';
                document.querySelectorAll('button').forEach(btn => btn.disabled = false);
            }
        }