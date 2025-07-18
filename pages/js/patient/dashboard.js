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


        // عرض أحدث وصفة مع تنسيق متقدم
        if (data.latestPrescription) {
            const prescriptionDate = new Date(data.latestPrescription.issuedDate);
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
let medications = [];
        if (!prescription.prescriptionItems || prescription.prescriptionItems.length === 0) {
            medicationsList.innerHTML = '<p class="text-muted">لا توجد أدوية في هذه الوصفة</p>';
        } else {
            // جلب بيانات الأدوية بشكل متوازي
            const medicationRequests = prescription.prescriptionItems.map(async item => {
                if(!item.medicationId) {
                    return {
                        id: item.id,
                        medicationId: item.medicationId,
                        name: item.customMedicationName,
                        dosage: item.customDosageForm,
                        frequency: item.frequency,
                        duration: item.customStrength,
                        isCustom: true
                    };
                    }
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

             medications = await Promise.all(medicationRequests);

            prescription.prescriptionItems.forEach((item, index) => {
                const medication = medications[index];
                const medItem = document.createElement('div');
                medItem.className = 'medication-item p-3 mb-2 bg-light rounded';
                medItem.innerHTML = `
                    <div class="d-flex justify-content-between">
                    <h6>الدواء #${medication?.name  || 'غير معروف'}</h6>
                    ${medication?.isCustom ? '<small class="badge bg-info ms-2">مخصص</small>' : ''}
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

                // تعيين دالة الطباعة مع البيانات الكاملة
        document.getElementById('print-prescription-btn').onclick = () => {
            printPrescription({
                prescription: prescription,
                enrichedItems:  medications
            });
        };

    } catch (error) {
        console.error('Error:', error);
        Swal.fire('خطأ', error.message || 'حدث خطأ أثناء جلب تفاصيل الوصفة', 'error');
    }
}
    
   // دالة طباعة الوصفة
function printPrescription(data) {
    try {
        const { prescription, enrichedItems } = data;
        const patient = prescription.patient || {};
        const doctor = prescription.doctor || {};
        const medicalCenter = prescription.doctor.medicalCenter || {};
        
        // تنسيق التاريخ
        const issuedDate = new Date(prescription.issuedDate);
        const formattedDate = issuedDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // إنشاء نافذة الطباعة
        const printWindow = window.open('', '_blank');
        
        // بناء محتوى الطباعة
        let itemsHtml = '';
        if (enrichedItems && enrichedItems.length > 0) {
            itemsHtml = enrichedItems.map(item => `
                <div class="medication-item">
                    <p><strong>${item.name || 'دواء غير معروف'}</strong></p>
                    <p>الجرعة: ${item.dosage || '--'} | التكرار: ${item.frequency || '--'} | المدة: ${item.duration || '--'} يوم</p>
                    ${item.notes ? `<p><small>ملاحظات: ${item.notes}</small></p>` : ''}
                </div>
            `).join('');
        } else {
            itemsHtml = '<div class="text-muted">لا توجد أدوية</div>';
        }

        // HTML كامل للطباعة
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <title>وصفة طبية #${prescription.id || '--'}</title>
                <style>
                    body {
                        font-family: 'Tajawal', Arial, sans-serif;
                        line-height: 1.6;
                        padding: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    .info-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }
                    .info-box {
                        flex: 1;
                        padding: 10px;
                    }
                    .medication-item {
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                        margin-bottom: 5px;
                    }
                    .signature-area {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                    }
                    @media print {
                        body {
                            padding: 0 !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>وصفة طبية</h2>
                    <p>${medicalCenter.name || 'مركز طبي'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>معلومات المريض</h4>
                        <p><strong>الاسم:</strong> ${patient.user ? patient.user.fullName : '--'}</p>
                        <p><strong>رقم الهوية:</strong> ${patient.id || '--'}</p>
                    </div>
                    <div class="info-box">
                        <h4>معلومات الوصفة</h4>
                        <p><strong>رقم الوصفة:</strong> #${prescription.id || '--'}</p>
                        <p><strong>التاريخ:</strong> ${formattedDate}</p>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <h4>الطبيب المعالج</h4>
                        <p><strong>الاسم:</strong> د. ${doctor.user ? doctor.user.fullName : '--'}</p>
                        <p><strong>التخصص:</strong> ${doctor.specialization || '--'}</p>
                    </div>
                    <div class="info-box">
                        <h4>المركز الطبي</h4>
                        <p><strong>الاسم:</strong> ${medicalCenter.name || '--'}</p>
                        <p><strong>العنوان:</strong> ${medicalCenter.address || '--'}</p>
                    </div>
                </div>
                
                <div>
                    <h3>الأدوية الموصوفة</h3>
                    ${itemsHtml}
                </div>
                
                <div class="signature-area">
                    <div>
                        <p>توقيع الطبيب: ___________________</p>
                        <p>الاسم: د. ${doctor.user ? doctor.user.fullName : '--'}</p>
                    </div>
                    <div>
                        <p>توقيع الصيدلي: ___________________</p>
                        <p>الاسم: ___________________</p>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 200);
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    } catch (error) {
        console.error('حدث خطأ أثناء الطباعة:', error);
        alert('حدث خطأ أثناء محاولة الطباعة');
    }
}

	});