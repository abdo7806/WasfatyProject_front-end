
        let patientId;
        let doctorData = JSON.parse(localStorage.getItem("doctorData"));
        let allPrescriptions = [];
        let currentPage = 1;
        const prescriptionsPerPage = 5;

        async function loadPatientData(id) {
            showLoading(true);
            try {
                const prescriptionsResponse = await fetch(`https://localhost:7219/api/Prescription/GetByPatientId/${id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!prescriptionsResponse.ok) throw new Error('فشل في تحميل الوصفات الطبية');

                allPrescriptions = await prescriptionsResponse.json();

                if (allPrescriptions.length === 0) {
                    showMessage('لا توجد وصفات طبية لهذا المريض', false);
                    document.getElementById('prescriptions-list').innerHTML = `
                        <div class="no-prescriptions">
                            <p>لا توجد وصفات طبية مسجلة لهذا المريض</p>
                        </div>
                    `;
                    document.getElementById('stats-section').classList.add('d-none');
                    document.getElementById('pagination').classList.add('d-none');
                    return;
                }

                const patient = allPrescriptions[0].patient;
                displayPatientInfo(patient); // عرض بيانات المريض

                updateStats(allPrescriptions); // عرض عدد الوصفات والوصفات الذي تم صرفها والوصفات الذي لم يتم صرفها



                setupEventListeners();
                displayPrescriptions(allPrescriptions);

            } catch (error) {
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

        // عرض عدد الوصفات والوصفات الذي تم صرفها والوصفات الذي لم يتم صرفها
        function updateStats(prescriptions) {
            const total = prescriptions.length;
            const dispensed = prescriptions.filter(p => p.isDispensed).length;

            document.getElementById('total-prescriptions').textContent = total;
            document.getElementById('dispensed-prescriptions').textContent = dispensed;
            document.getElementById('pending-prescriptions').textContent = total - dispensed;
        }

        function setupEventListeners() {
            // البحث والتصفية
            document.getElementById('search-input').addEventListener('input', applyFilters);
            document.getElementById('status-filter').addEventListener('change', applyFilters);
            document.getElementById('date-filter').addEventListener('change', applyFilters);

            // التصفح بين الصفحات
            document.getElementById('prev-page').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    applyFilters();
                }
            });

            document.getElementById('next-page').addEventListener('click', () => {
                const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    applyFilters();
                }
            });
        }

        let filteredPrescriptions = [];

        function applyFilters() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const dateOrder = document.getElementById('date-filter').value;

            // التصفية حسب البحث وحالة الصرف
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

            // الترتيب حسب التاريخ
            filteredPrescriptions.sort((a, b) => {
                return dateOrder === 'newest' ?
                    new Date(b.issuedDate) - new Date(a.issuedDate) :
                    new Date(a.issuedDate) - new Date(b.issuedDate);
            });

            updateStats(filteredPrescriptions);
            updatePagination();
            displayPrescriptions(filteredPrescriptions);
        }

        function updatePagination() {
            const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);
            const pagination = document.getElementById('pagination');
            const prevPage = document.getElementById('prev-page');
            const nextPage = document.getElementById('next-page');

            if (filteredPrescriptions.length <= prescriptionsPerPage) {
                pagination.classList.add('d-none');
                return;
            }

            pagination.classList.remove('d-none');

            // تحديث أزرار الصفحات
            prevPage.classList.toggle('disabled', currentPage === 1);
            nextPage.classList.toggle('disabled', currentPage === totalPages);

            // تحديث أرقام الصفحات
            const pageNumbers = document.querySelectorAll('.page-item:not(#prev-page):not(#next-page)');
            pageNumbers.forEach(el => el.remove());

            const pageList = document.createElement('li');
            pageList.className = 'page-item active';
            pageList.innerHTML = `<a class="page-link" href="#">${currentPage}</a>`;
            prevPage.insertAdjacentElement('afterend', pageList);
        }

        // عر جميع الوصفات الطبية مع تقسيمها الى صفحات
        async function displayPrescriptions(prescriptions) {
            const startIndex = (currentPage - 1) * prescriptionsPerPage;
            const endIndex = startIndex + prescriptionsPerPage;
            const displayedPrescriptions = prescriptions.slice(startIndex, endIndex);

            const prescriptionsList = document.getElementById('prescriptions-list');

            if (displayedPrescriptions.length === 0) {
                prescriptionsList.innerHTML = `
                    <div class="no-prescriptions">
                        <p>لا توجد وصفات تطابق معايير البحث</p>
                    </div>
                `;
                return;
            }

            let html = '';
            const medicationIds = [];

            // جمع جميع IDs للأدوية
            displayedPrescriptions.forEach(p => {
                p.prescriptionItems.forEach(item => {
                    if (item.medicationId && !medicationIds.includes(item.medicationId)) {
                        medicationIds.push(item.medicationId);
                    }
                });
            });

            // جلب جميع الأدوية المطلوبة في طلب واحد
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

            for (const prescription of displayedPrescriptions) {
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

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>المركز الطبي:</strong> ${prescription.doctor.medicalCenter.name || 'غير محدد'}
                            </div>
                            <div class="col-md-6">
                                <strong>ترخيص الطبيب:</strong> ${prescription.doctor.licenseNumber || 'غير محدد'}
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
                const medication = medicationsCache[item.medicationId];

                if (medication) {
                    html += `
                        <div class="medication-item">
                            <i class="bi bi-capsule me-2"></i>
                            <div style="flex-grow: 1;">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>${medication.name || 'دواء غير معروف'}</strong>
                                        <small class="text-muted ms-2">${medication.strength || ''}</small>
                                    </div>
                                    <span>${medication.dosageForm || item.dosageForm || ''}</span>
                                </div>
                                <div class="text-muted">
                                    ${item.frequency ? item.frequency + ' مرات/يوم' : ''}
                                    ${item.duration ? 'لمدة ' + item.duration : ''}
                                </div>
                                ${medication.description ? `<div class="text-muted small mt-1">${medication.description}</div>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="medication-item text-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <div>
                                <strong>دواء غير متوفر (رقم ${item.medicationId})</strong>
                                <div class="text-muted">
                                    ${item.frequency ? item.frequency + ' مرات/يوم' : ''}
                                    ${item.duration ? 'لمدة ' + item.duration : ''}
                                </div>
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
            if (loadingElement) {
                loadingElement.style.display = isLoading ? 'flex' : 'none';
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
        };