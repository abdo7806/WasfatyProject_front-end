
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
                        // const urlParams = new URLSearchParams(window.location.search);
                        // patientId = urlParams.get('id');
                    const response = await fetch(`https://localhost:7219/api/Prescription/GetByPatientId/${patientData.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

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

            // عرض تفاصيل الوصفة في المودال
            async function showPrescriptionDetails(prescriptionId) {
                const prescription = prescriptions.find(p => p.id == prescriptionId);
                if (!prescription) return;

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

              
         

                prescription.prescriptionItems.forEach( async item => {
                      const res =  await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                    });
                    const medication = await res.json();
                    const medItem = document.createElement('div');
                    medItem.className = 'medication-item';
                    medItem.innerHTML = `
                <div class="d-flex justify-content-between">
                    <h6>الدواء #${medication.name || 'غير معروف'}</h6>
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

            // مستمع لزر الطباعة
            document.getElementById('print-prescription-btn').addEventListener('click', () => {
                window.print();
            });

            // جلب البيانات عند تحميل الصفحة
            fetchPrescriptions();
        });






