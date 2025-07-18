
        document.addEventListener('DOMContentLoaded', async() => {
            // checkAccess(['Patient']);
            // عناصر DOM
            const prescriptionsContainer = document.getElementById('prescriptions-container');
            const searchInput = document.getElementById('search-input');
            const statusFilter = document.getElementById('status-filter');
            const dateFilter = document.getElementById('date-filter');
            // متغير لتخزين الوصفات
            let prescriptions = [];
            // جلب الوصفات من API
            async function fetchPrescriptions() {
                try {
                    let patientData = JSON.parse(localStorage.getItem("patientData"));
                    console.log(patientData)
                        
                    const response = await fetch(`https://localhost:7219/api/Prescription/GetByPatientId/${patientData.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if(response.status == 404){
                prescriptionsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>  لا يوجد وصفات طبيه بعد 
                </div>
            `;
            return;
                    }
                    if (!response.ok) {
                        throw new Error('فشل في جلب الوصفات الطبية');
                    }
                    prescriptions = await response.json();
                    renderPrescriptions(prescriptions);
                } catch (error) {
                    console.error('Error:', error);
                    prescriptionsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> حدث خطأ أثناء جلب الوصفات الطبية
                </div>
            `;
                }
            }

            // عرض الوصفات
            function renderPrescriptions(prescriptionsToRender) {
                if (prescriptionsToRender.length === 0) {
                    prescriptionsContainer.innerHTML = `
                <div class="no-prescriptions">
                    <i class="fas fa-file-medical" style="font-size: 3rem; color: var(--primary-color);"></i>
                    <h4 class="mt-3">لا توجد وصفات طبية</h4>
                    <p class="text-muted">ليس لديك أي وصفات طبية مسجلة حالياً</p>
                </div>
            `;
                    return;
                }

                let html = '<div class="row">';

                prescriptionsToRender.forEach(prescription => {
                    const issuedDate = new Date(prescription.issuedDate);
                    const formattedDate = issuedDate.toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    const doctorName = prescription.doctor.user.fullName;
                    const medicalCenterName = prescription.doctor.medicalCenter.name;

                    html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card prescription-card ${prescription.isDispensed ? 'dispensed-card' : 'not-dispensed-card'}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title">الوصفة #${prescription.id}</h5>
                                <span class="badge ${prescription.isDispensed ? 'badge-dispensed' : 'badge-not-dispensed'}">
                                    ${prescription.isDispensed ? 'تم الصرف' : 'لم يصرف'}
                                </span>
                            </div>
                            <p class="card-text"><i class="fas fa-user-md"></i> الطبيب: ${doctorName}</p>
                            <p class="card-text"><i class="fas fa-hospital"></i> المركز: ${medicalCenterName}</p>
                            <p class="card-text"><i class="fas fa-calendar-alt"></i> التاريخ: ${formattedDate}</p>
                            <p class="card-text"><i class="fas fa-pills"></i> عدد الأدوية: ${prescription.prescriptionItems.length}</p>
                            <button class="btn btn-outline-primary btn-sm view-details-btn" 
                                data-id="${prescription.id}"
                                data-bs-toggle="modal" 
                                data-bs-target="#prescriptionDetailsModal">
                                <i class="fas fa-eye"></i> عرض التفاصيل
                            </button>
                        </div>
                    </div>
                </div>
            `;
                });

                html += '</div>';
                prescriptionsContainer.innerHTML = html;

                // إضافة مستمعين لأزرار عرض التفاصيل
                document.querySelectorAll('.view-details-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const prescriptionId = btn.getAttribute('data-id');
                        showPrescriptionDetails(prescriptionId);
                    });
                });
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
            // عرض تفاصيل الوصفة في المودال
            // عرض تفاصيل الوصفة في المودال
async function showPrescriptionDetails(prescriptionId) {
    try {
        // البحث عن الوصفة في المصفوفة
        const prescription = prescriptions.find(p => p.id == prescriptionId);
        if (!prescription) {
            alert('الوصفة غير موجودة');
            return;
        }

        // تنسيق التاريخ
        const issuedDate = new Date(prescription.issuedDate);
        const formattedDate = issuedDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // تعبئة بيانات الطبيب والمركز الطبي
        document.getElementById('prescription-id').textContent = prescription.id;
        document.getElementById('doctor-name').textContent = prescription.doctor.user.fullName;
        document.getElementById('doctor-specialization').textContent = prescription.doctor.specialization;
        document.getElementById('doctor-license').textContent = prescription.doctor.licenseNumber;

        document.getElementById('medical-center-name').textContent = prescription.doctor.medicalCenter.name;
        document.getElementById('medical-center-address').textContent = prescription.doctor.medicalCenter.address;
        document.getElementById('medical-center-phone').textContent = prescription.doctor.medicalCenter.phone;

        document.getElementById('issued-date').textContent = formattedDate;

        // حالة الصرف
        const dispensedStatus = document.getElementById('dispensed-status');
        dispensedStatus.textContent = prescription.isDispensed ? 'تم الصرف' : 'لم يصرف';
        dispensedStatus.className = 'badge ' + (prescription.isDispensed ? 'badge-dispensed' : 'badge-not-dispensed');

        // تعبئة قائمة الأدوية
        const medicationsList = document.getElementById('medications-list');
        medicationsList.innerHTML = '';

        if (prescription.prescriptionItems.length === 0) {
            medicationsList.innerHTML = '<p class="text-muted">لا توجد أدوية في هذه الوصفة</p>';
            return;
        }

        // جلب تفاصيل الأدوية
        const enrichedItems = await enrichPrescriptionItems(prescription.prescriptionItems);
        
        // عرض الأدوية
        enrichedItems.forEach(item => {
            const medItem = document.createElement('div');
            medItem.className = 'medication-item';
            
            medItem.innerHTML = `
                <div class="d-flex justify-content-between">
                    <h6>${item.name || 'دواء غير معروف'}</h6>
                    ${item.isCustom ? '<small class="badge bg-info ms-2">مخصص</small>' : ''}
                </div>
                <div class="row mt-2">
                    <div class="col-md-4"><strong>الجرعة:</strong> ${item.dosage || '--'}</div>
                    <div class="col-md-4"><strong>التكرار:</strong> ${item.frequency || '--'} مرات يومياً</div>
                    <div class="col-md-4"><strong>المدة:</strong> ${item.duration || '--'} يوم</div>
                </div>
                ${item.notes ? `<div class="mt-2"><strong>ملاحظات:</strong> ${item.notes}</div>` : ''}
            `;
            
            medicationsList.appendChild(medItem);
        });

        // تعيين دالة الطباعة مع البيانات الكاملة
        document.getElementById('print-prescription-btn').onclick = () => {
            printPrescription({
                prescription: prescription,
                enrichedItems: enrichedItems
            });
        };

    } catch (error) {
        console.error('حدث خطأ في عرض تفاصيل الوصفة:', error);
        alert('حدث خطأ في عرض تفاصيل الوصفة');
    }
}

// دالة مساعدة لجلب تفاصيل الأدوية
async function enrichPrescriptionItems(items) {
    const enrichedItems = [];
    
    for (const item of items) {
        if (!item.medicationId) {
            // دواء مخصص
            enrichedItems.push({
                ...item,
                name: item.customMedicationName,
                isCustom: true
            });
        } else {
            try {
                // جلب بيانات الدواء من API
                const res = await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                });
                
                if (!res.ok) throw new Error('فشل في جلب بيانات الدواء');
                
                const medication = await res.json();
                enrichedItems.push({
                    ...item,
                    ...medication,
                    isCustom: false
                });
            } catch (error) {
                console.error('خطأ في جلب بيانات الدواء:', error);
                enrichedItems.push({
                    ...item,
                    name: 'دواء غير معروف',
                    isCustom: false
                });
            }
        }
    }
    
    return enrichedItems;
}


            
            // تصفية الوصفات
            function filterPrescriptions() {
                const searchTerm = searchInput.value.toLowerCase();
                const status = statusFilter.value;
                const dateOrder = dateFilter.value;

                let filtered = prescriptions.filter(p => {
                    const matchesSearch =
                        p.id.toString().includes(searchTerm) ||
                        p.doctor.user.fullName.toLowerCase().includes(searchTerm);

                    const matchesStatus =
                        status === 'all' ||
                        (status === 'dispensed' && p.isDispensed) ||
                        (status === 'not-dispensed' && !p.isDispensed);

                    return matchesSearch && matchesStatus;
                });

                // ترتيب حسب التاريخ
                filtered.sort((a, b) => {
                    const dateA = new Date(a.issuedDate);
                    const dateB = new Date(b.issuedDate);
                    return dateOrder === 'newest' ? dateB - dateA : dateA - dateB;
                });

                renderPrescriptions(filtered);
            }

            // مستمعين لأحداث التصفية
            searchInput.addEventListener('input', filterPrescriptions);
            statusFilter.addEventListener('change', filterPrescriptions);
            dateFilter.addEventListener('change', filterPrescriptions);

            // مستمع لزر تسجيل الخروج
           //  document.getElementById('logout-btn').addEventListener('click', logout2);

       
            // جلب البيانات عند تحميل الصفحة
            fetchPrescriptions();
        });






