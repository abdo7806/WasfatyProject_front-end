document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من الصلاحية وإدارة الجلسة
       await getPatientByUserId();

    // عناصر DOM
    const totalPrescriptionsEl = document.getElementById('total-prescriptions');
    const dispensedMedsEl = document.getElementById('dispensed-meds');
    const latestPrescriptionEl = document.getElementById('latest-prescription');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorAlert = document.getElementById('error-alert');
    const dashboardContent = document.getElementById('dashboard-content');

    try {
        // إظهار مؤشر التحميل
        loadingIndicator.classList.remove('d-none');
        dashboardContent.classList.add('d-none');
        errorAlert.classList.add('d-none');
                    let patientData = JSON.parse(localStorage.getItem("patientData"));

        // جلب بيانات لوحة التحكم مع إدارة الوقت الزمني
        const response = await Promise.race([
            fetch(`https://localhost:7219/api/PatientController/dashboard/${patientData.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
           /* new Promise((_, reject) => 
                setTimeout(() => reject(new Error('تجاوز وقت الانتظار')), 20000)
            )*/
        ]);

        if (!response.ok) {
            throw new Error(response.status === 401 ? 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' : 'فشل في جلب البيانات');
        }

        const data = await response.json();
        console.log(data);
				//alert(data);
        // عرض البيانات مع التحقق من القيم
        totalPrescriptionsEl.textContent = data.totalPrescriptions ?? '0';
        dispensedMedsEl.textContent = data.dispensedMeds ?? '0';

				//alert(data.latestPrescription.isDispensed);
				//alert(data.latestPrescription.id);
				//alert(data.latestPrescription.doctor.user.fullName);
        // عرض أحدث وصفة مع تنسيق متقدم
        if (data.latestPrescription) {
            const prescriptionDate = new Date(data.latestPrescription.issuedDate);
					//	alert(prescriptionDate.toLocaleDateString('ar-EG'))
            latestPrescriptionEl.innerHTML = `
                <div class="prescription-card">
                    <div class="card-header">
                        <span class="badge ${data.latestPrescription.isDispensed ? 'bg-success' : 'bg-warning'}">
                            ${data.latestPrescription.isDispensed ? 'تم الصرف' : 'بانتظار الصرف'}
                        </span>
                        <strong>الوصفة #${data.latestPrescription.id}</strong>
                    </div>
                    <div class="card-body">
                        <p><i class="fas fa-user-md"></i> <strong>الطبيب:</strong> ${data.latestPrescription.doctor.user.fullName}</p>
                        <p><i class="fas fa-calendar-alt"></i> <strong>التاريخ:</strong> ${prescriptionDate.toLocaleDateString('ar-EG')}</p>
                        <button class="btn btn-sm btn-outline-primary view-details-btn" 
                            data-id="${data.latestPrescription.id}">
                            <i class="fas fa-eye"></i> عرض التفاصيل
                        </button>
                    </div>
                </div>
            `;

            // إضافة حدث لعرض التفاصيل
            document.querySelector('.view-details-btn').addEventListener('click', () => {
                showPrescriptionDetails(data.latestPrescription.id);
            });
        } else {
            latestPrescriptionEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> لا توجد وصفات طبية مسجلة
                </div>
            `;
        }

        // إخفاء مؤشر التحميل وإظهار المحتوى
        loadingIndicator.classList.add('d-none');
        dashboardContent.classList.remove('d-none');

    } catch (error) {
        console.error('Error:', error);
        loadingIndicator.classList.add('d-none');
        errorAlert.classList.remove('d-none');
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> 
            ${error.message || 'حدث خطأ غير متوقع'}
            ${error.message === 'انتهت الجلسة' ? '<button class="btn btn-sm btn-danger ms-2" id="login-redirect">تسجيل الدخول</button>' : ''}
        `;

        if (error.message === 'انتهت الجلسة') {
            document.getElementById('login-redirect').addEventListener('click', () => {
                window.location.href = '/login.html';
            });
        }
    }
    
    // إدارة الأحداث
    document.getElementById('logout-btn').addEventListener('click', logout);

		       // عرض تفاصيل الوصفة في المودال
      async function showPrescriptionDetails(prescriptionId) {
    try {
        // إظهار مؤشر تحميل
        Swal.fire({
            title: 'جاري تحميل البيانات',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب تفاصيل الوصفة');
        }
        
        const prescription = await response.json();
        if (!prescription) {
            throw new Error('الوصفة غير موجودة');
        }

        // إغلاق مؤشر التحميل
        Swal.close();

        // تعبئة بيانات النموذج
        const issuedDate = new Date(prescription.issuedDate);
        const formattedDate = issuedDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // تعبئة بيانات الطبيب
        document.getElementById('prescription-id').textContent = prescription.id;
        document.getElementById('doctor-name').textContent = prescription.doctor?.user?.fullName || 'غير معروف';
        document.getElementById('doctor-specialization').textContent = prescription.doctor?.specialization || 'غير معروف';
        document.getElementById('doctor-license').textContent = prescription.doctor?.licenseNumber || 'غير معروف';

        // تعبئة بيانات المركز الطبي
        document.getElementById('medical-center-name').textContent = prescription.doctor?.medicalCenter?.name || 'غير معروف';
        document.getElementById('medical-center-address').textContent = prescription.doctor?.medicalCenter?.address || 'غير معروف';
        document.getElementById('medical-center-phone').textContent = prescription.doctor?.medicalCenter?.phone || 'غير معروف';

        // تعبئة معلومات الوصفة
        document.getElementById('issued-date').textContent = formattedDate;
        
        const dispensedStatus = document.getElementById('dispensed-status');
        dispensedStatus.textContent = prescription.isDispensed ? 'تم الصرف' : 'لم يصرف';
        dispensedStatus.className = 'badge ' + (prescription.isDispensed ? 'bg-success' : 'bg-warning');

        // تعبئة قائمة الأدوية
        const medicationsList = document.getElementById('medications-list');
        medicationsList.innerHTML = '';

        if (!prescription.prescriptionItems || prescription.prescriptionItems.length === 0) {
            medicationsList.innerHTML = '<p class="text-muted">لا توجد أدوية في هذه الوصفة</p>';
        } else {
            // جلب بيانات الأدوية بشكل متوازي
            const medicationRequests = prescription.prescriptionItems.map(async item => {
                try {
                    const res = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    return res.ok ? await res.json() : null;
                } catch {
                    return null;
                }
            });

            const medications = await Promise.all(medicationRequests);

            prescription.prescriptionItems.forEach((item, index) => {
                const medication = medications[index];
                const medItem = document.createElement('div');
                medItem.className = 'medication-item p-3 mb-2 bg-light rounded';
                medItem.innerHTML = `
                    <div class="d-flex justify-content-between">
                    <h6>الدواء #${medication?.name  || 'غير معروف'}</h6>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-4"><strong>الجرعة:</strong> ${item.dosage}</div>
                        <div class="col-md-4"><strong>التكرار:</strong> ${item.frequency} مرات يومياً</div>
                        <div class="col-md-4"><strong>المدة:</strong> ${item.duration} يوم</div>
                    </div>
                `;
                medicationsList.appendChild(medItem);
            });
        }

        // عرض النموذج
        const modal = new bootstrap.Modal(document.getElementById('prescriptionDetailsModal'));
        modal.show();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire('خطأ', error.message || 'حدث خطأ أثناء جلب تفاصيل الوصفة', 'error');
    }
}
    
   

	});//SG.TB8eT4vfQhG7naD4_cSk-w.STY677hY09kZC89av20a2XwYpY_4LCQ420QX7xEsL-E