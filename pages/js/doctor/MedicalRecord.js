
        let patientId;
        let doctorData = JSON.parse(localStorage.getItem("doctorData"));
        let allPrescriptions = [];
        let filteredPrescriptions = [];

        async function loadPatientData(id) {
            try {
                console.log('بدء تحميل البيانات...');
                showLoading(true);

                console.log('جاري جلب الوصفات الطبية...');
                const prescriptionsResponse = await fetch(`https://localhost:7219/api/Prescription/GetByPatientId/${id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                console.log('تم جلب الوصفات الطبية');

                if (!prescriptionsResponse.ok) {
                    throw new Error('فشل في تحميل الوصفات الطبية');
                }

                allPrescriptions = await prescriptionsResponse.json();
                filteredPrescriptions = [...allPrescriptions];

                if (allPrescriptions.length === 0) {
                    showMessage('لا توجد وصفات طبية لهذا المريض', false);
                    document.getElementById('prescriptions-list').innerHTML = `
                        <div class="no-prescriptions">
                            <p>لا توجد وصفات طبية مسجلة لهذا المريض</p>
                        </div>
                    `;
                    document.getElementById('stats-section').classList.add('d-none');
                    return;
                }

                const patient = allPrescriptions[0].patient;
                displayPatientInfo(patient);
                updateStats(allPrescriptions);
                setupEventListeners();
                displayAllPrescriptions();
                
            } catch (error) {
                console.error('Error loading patient data:', error);
                showMessage(error.message, true);
                document.getElementById('prescriptions-list').innerHTML = `
                    <div class="no-prescriptions">
                        <p>حدث خطأ أثناء تحميل البيانات</p>
                    </div>
                `;
            } finally {
                showLoading(false);
            }
        }

        function displayPatientInfo(patient) {
            document.getElementById('patient-name').textContent = patient.user.fullName;
            document.getElementById('patient-email').textContent = patient.user.email || 'غير متوفر';
            document.getElementById('patient-blood').textContent = patient.bloodType || 'غير محدد';
            document.getElementById('patient-dob').textContent = patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'غير متوفر';
            document.getElementById('patient-gender').textContent =
                patient.gender === 'Male' ? 'ذكر' :
                patient.gender === 'Female' ? 'أنثى' : 'غير محدد';
            document.getElementById('patient-id').textContent = patient.id;
        }

        function updateStats(prescriptions) {
            const total = prescriptions.length;
            const dispensed = prescriptions.filter(p => p.isDispensed).length;

            document.getElementById('total-prescriptions').textContent = total;
            document.getElementById('dispensed-prescriptions').textContent = dispensed;
            document.getElementById('pending-prescriptions').textContent = total - dispensed;
        }

        function setupEventListeners() {
            document.getElementById('search-input').addEventListener('input', applyFilters);
            document.getElementById('status-filter').addEventListener('change', applyFilters);
            document.getElementById('date-filter').addEventListener('change', applyFilters);
            applyFilters();
        }

        function applyFilters() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const dateOrder = document.getElementById('date-filter').value;
            filteredPrescriptions = allPrescriptions.filter(p => {
                const matchesSearch =
                    p.doctor.user.fullName.toLowerCase().includes(searchTerm) ||
                    formatDateTime(p.issuedDate).includes(searchTerm);

                const matchesStatus =
                    statusFilter === 'all' ||
                    (statusFilter === 'dispensed' && p.isDispensed) ||
                    (statusFilter === 'pending' && !p.isDispensed);

                return matchesSearch && matchesStatus;
            });

            filteredPrescriptions.sort((a, b) => {
                return dateOrder === 'newest' ?
                    new Date(b.issuedDate) - new Date(a.issuedDate) :
                    new Date(a.issuedDate) - new Date(b.issuedDate);
            });

            updateStats(filteredPrescriptions);
            displayAllPrescriptions();
        }

        async function displayAllPrescriptions() {
            const prescriptionsList = document.getElementById('prescriptions-list');

            if (filteredPrescriptions.length === 0) {
                prescriptionsList.innerHTML = `
                    <div class="no-prescriptions">
                        <p>لا توجد وصفات تطابق معايير البحث</p>
                    </div>
                `;
                return;
            }

            let html = '';
            const medicationIds = [];

            for (const prescription of filteredPrescriptions) {
                prescription.prescriptionItems.forEach(item => {
                    if (item.medicationId && !medicationIds.includes(item.medicationId)) {
                        medicationIds.push(item.medicationId);
                    }
                });
            }

            let medications = {};
            if (medicationIds.length > 0) {
                try {
                    const response = await fetch(`https://localhost:7219/api/Medication/GetMultipleByIds?ids=${medicationIds.join(',')}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });

                    if (response.ok) {
                        const meds = await response.json();
                        meds.forEach(m => medications[m.id] = m);
                    }
                } catch (error) {
                    console.error('Error fetching medications:', error);
                }
            }

            for (const prescription of filteredPrescriptions) {
                html += `
                    <div class="prescription-card">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5>وصفة طبية #${prescription.id}</h5>
                            <div>
                                <span class="badge ${prescription.isDispensed ? 'bg-success' : 'bg-warning text-dark'} me-2">
                                    ${prescription.isDispensed ? 'تم صرفها' : 'قيد الانتظار'}
                                </span>
                                <span class="text-muted">${formatDateTime(prescription.issuedDate)}</span>
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>الطبيب:</strong> ${prescription.doctor.user.fullName}
                            </div>
                            <div class="col-md-6">
                                <strong>التخصص:</strong> ${prescription.doctor.specialization || 'غير محدد'}
                            </div>
                        </div>

                        <div class="mt-3">
                            <h6>الأدوية الموصوفة:</h6>
                            <div class="mt-2">
                                ${await generateMedicationsList(prescription.prescriptionItems, medications)}
                            </div>
                        </div>
                    </div>
                `;
            }

            prescriptionsList.innerHTML = html;
        }

        async function generateMedicationsList(items, medicationsCache = {}) {
            if (!items || items.length === 0) {
                return '<p class="text-muted">لا توجد أدوية في هذه الوصفة</p>';
            }

            let html = '';

            for (const item of items) {
                if (item.medicationId) {
                    const medication = medicationsCache[item.medicationId];
                    html += `
                        <div class="medication-item">
                            <i class="bi bi-capsule me-2"></i>
                            <div style="flex-grow: 1;">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>${medication?.name || 'دواء غير معروف'}</strong>
                                        <small class="text-muted ms-2">${medication?.strength || ''}</small>
                                    </div>
                                    <span>${medication?.dosageForm || ''}</span>
                                </div>
                                <div class="text-muted">
                                    ${item.frequency ? item.frequency + ' مرات/يوم' : ''}
                                    ${item.duration ? 'لمدة ' + item.duration : ''}
                                </div>
                                ${medication?.description ? `<div class="text-muted small mt-1">${medication.description}</div>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="medication-item">
                            <i class="bi bi-pencil-square me-2 text-primary"></i>
                            <div style="flex-grow: 1;">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>${item.customMedicationName || 'دواء مخصص'}</strong>
                                        <small class="badge bg-info ms-2">مخصص</small>
                                    </div>
                                    <span>${item.customDosageForm || ''}</span>
                                </div>
                                <div class="text-muted">
                                    ${item.customStrength ? 'تركيز: ' + item.customStrength : ''}
                                </div>
                                <div class="text-muted">
                                    ${item.frequency ? item.frequency + ' مرات/يوم' : ''}
                                    ${item.duration ? 'لمدة ' + item.duration : ''}
                                </div>
                                ${item.customMedicationDescription ? `<div class="text-muted small mt-1">${item.customMedicationDescription}</div>` : ''}
                            </div>
                        </div>
                    `;
                }
            }

            return html;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG');
        }

        function formatDateTime(dateTimeString) {
            const date = new Date(dateTimeString);
            return date.toLocaleString('ar-EG');
        }

        function showLoading(isLoading) {
            const loadingElement = document.getElementById('loading');
            const contentElement = document.getElementById('prescriptions-list');
            
            if (loadingElement && contentElement) {
                if (isLoading) {
                    loadingElement.style.display = 'flex';
                    contentElement.style.opacity = '0.5';
                } else {
                    loadingElement.style.display = 'none';
                    contentElement.style.opacity = '1';
                }
            }
        }

        function showMessage(message, isError) {
            const messageBox = document.getElementById('error-message');
            if (messageBox) {
                messageBox.textContent = message;
                messageBox.style.display = 'block';
                messageBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
                setTimeout(() => {
                    messageBox.style.display = 'none';
                }, 5000);
            }
        }

        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            patientId = urlParams.get('id');

            if (patientId) {
                loadPatientData(patientId);
            } else {
                showMessage('لم يتم تحديد مريض', true);
                document.getElementById('prescriptions-list').innerHTML = `
                    <div class="no-prescriptions">
                        <p>لم يتم تحديد مريض</p>
                    </div>
                `;
            }
        }