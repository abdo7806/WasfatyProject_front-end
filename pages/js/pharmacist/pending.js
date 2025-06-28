
        // إعدادات التطبيق
        const APP_CONFIG = {
            API_BASE_URL: 'https://localhost:7219/api',
            ITEMS_PER_PAGE: 6,
            SESSION_TIMEOUT: 30 // دقائق
        };

   
               function logout() {
            Swal.fire({
                title: 'تأكيد تسجيل الخروج',
                text: 'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'نعم، سجل خروج',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6'
            }).then((result) => {
                if (result.isConfirmed) {
			localStorage.removeItem('token');
            localStorage.removeItem('userData');
            localStorage.removeItem('PharmacistData');
            window.location.href = '../../auth/login.html';
                }
            });
        }
   

        // حساب العمر بدقة
        function calculateAge(birthDate) {
            const diff = Date.now() - new Date(birthDate).getTime();
            const ageDate = new Date(diff);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        }

        // تنسيق التاريخ
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('ar-EG', options);
        }

        // إدارة الجلسة
        function setupSessionTimeout() {
            let timeout;
            
            function resetTimer() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    Swal.fire({
                        title: 'انتهت الجلسة',
                        text: 'لقد تم تسجيل خروجك تلقائياً بسبب عدم النشاط',
                        icon: 'warning',
                        confirmButtonText: 'حسناً'
                    }).then(() => logout());
                }, APP_CONFIG.SESSION_TIMEOUT * 60 * 1000);
            }
            
            window.onload = resetTimer;
            window.onmousemove = resetTimer;
            window.onmousedown = resetTimer;
            window.ontouchstart = resetTimer;
            window.onclick = resetTimer;
            window.onkeypress = resetTimer;
        }

        document.addEventListener('DOMContentLoaded', async () => {
            // التحقق من المصادقة
        //    if (!checkAuth()) return;
            checkAccess(['Pharmacist'], '../../../shared/unauthorized.html');
            
            // إعداد مهلة الجلسة
            setupSessionTimeout();
            
            // العناصر الرئيسية
            const elements = {
                loading: document.getElementById('loading-indicator'),
                error: document.getElementById('error-alert'),
                container: document.getElementById('prescriptions-container'),
                noPrescriptions: document.getElementById('no-prescriptions'),
                searchInput: document.getElementById('search-input'),
                searchBtn: document.getElementById('search-btn'),
                filterDate: document.getElementById('filter-date'),
                filterStatus: document.getElementById('filter-status'),
                refreshBtn: document.getElementById('refresh-btn'),
                tryAgainBtn: document.getElementById('try-again-btn'),
                pagination: document.getElementById('pagination'),
                newPrescriptionsBadge: document.getElementById('new-prescriptions-badge')
            };

            // حالة التطبيق
            const state = {
                prescriptions: [],
                filteredPrescriptions: [],
                currentPage: 1,
                lastPrescriptionId: null,
                newPrescriptionsCount: 0
            };

            // تهيئة التطبيق
            async function init() {
                await fetchPendingPrescriptions();
                setupEventListeners();
                
                // التحقق من وصفات جديدة كل 30 ثانية
                setInterval(checkForNewPrescriptions, 30000);
            }

            // إعداد مستمعي الأحداث
            function setupEventListeners() {
                elements.searchBtn.addEventListener('click', applyFilters);
                elements.filterDate.addEventListener('change', applyFilters);
                elements.filterStatus.addEventListener('change', applyFilters);
                elements.refreshBtn.addEventListener('click', refreshData);
                elements.tryAgainBtn.addEventListener('click', refreshData);
               // document.getElementById('logout-btn').addEventListener('click', logout);
                document.getElementById('print-btn').addEventListener('click', printPrescription);
            }

            // جلب الوصفات المعلقة
            async function fetchPendingPrescriptions() {
                try {
                    showLoading();
                    
                    const response = await axios.get(`${APP_CONFIG.API_BASE_URL}/Prescription/Pending`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    state.prescriptions = response.data;
                    state.lastPrescriptionId = state.prescriptions.length > 0 ? 
                        Math.max(...state.prescriptions.map(p => p.id)) : 0;
                    
                    applyFilters();
                    
                } catch (error) {
                    showError(error.response?.data?.message || error.message || 'حدث خطأ أثناء جلب البيانات');
                } finally {
                    hideLoading();
                }
            }

            // تطبيق الفلاتر والبحث
            function applyFilters() {
                const searchTerm = elements.searchInput.value.toLowerCase();
                const dateFilter = elements.filterDate.value;
                const statusFilter = elements.filterStatus.value;
                
                state.filteredPrescriptions = state.prescriptions.filter(prescription => {
                    // تطبيق بحث
                    const matchesSearch = 
                        prescription.id.toString().includes(searchTerm) ||
                        prescription.patient.user.fullName.toLowerCase().includes(searchTerm) ||
                        prescription.doctor.user.fullName.toLowerCase().includes(searchTerm) ||
                        prescription.patientId.toString().includes(searchTerm);
                    
                    // تطبيق فلتر التاريخ
                    const prescriptionDate = new Date(prescription.issuedDate);
                    const now = new Date();
                    const matchesDate = 
                        dateFilter === 'all' ||
                        (dateFilter === 'today' && isSameDay(prescriptionDate, now)) ||
                        (dateFilter === 'week' && isSameWeek(prescriptionDate, now)) ||
                        (dateFilter === 'month' && isSameMonth(prescriptionDate, now));
                    
                    // تطبيق فلتر الحالة
                    const matchesStatus = 
                        statusFilter === 'all' ||
                        (statusFilter === 'urgent' && prescription.isUrgent) ||
                        (statusFilter === 'normal' && !prescription.isUrgent);
                    
                    return matchesSearch && matchesDate && matchesStatus;
                });
                
                renderPrescriptions();
            }

            // التحقق من وصفات جديدة
            async function checkForNewPrescriptions() {
                try {
                    const response = await axios.get(
                        `${APP_CONFIG.API_BASE_URL}/Prescription/New/${state.lastPrescriptionId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    if (response.data.length > 0) {
                        state.newPrescriptionsCount = response.data.length;
                        elements.newPrescriptionsBadge.classList.remove('d-none');
                        elements.newPrescriptionsBadge.textContent = 
                            ` ${state.newPrescriptionsCount} وصفات جديدة`;
                        
                        // تنبيه للمستخدم
                        if (document.hidden) {
                            new Notification('وصفات جديدة', {
                                body: `لديك ${state.newPrescriptionsCount} وصفة جديدة تحتاج معالجة`,
                                icon: '/assets/images/notification-icon.png'
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error checking for new prescriptions:', error);
                }
            }

            // عرض الوصفات
            function renderPrescriptions() {
                elements.container.innerHTML = '';
                
                if (state.filteredPrescriptions.length === 0) {
                    elements.noPrescriptions.classList.remove('d-none');
                    elements.pagination.classList.add('d-none');
                    return;
                }
                
                elements.noPrescriptions.classList.add('d-none');
                elements.pagination.classList.remove('d-none');
                
                // التقسيم إلى صفحات
                const totalPages = Math.ceil(state.filteredPrescriptions.length / APP_CONFIG.ITEMS_PER_PAGE);
                const startIndex = (state.currentPage - 1) * APP_CONFIG.ITEMS_PER_PAGE;
                const endIndex = startIndex + APP_CONFIG.ITEMS_PER_PAGE;
                const currentPrescriptions = state.filteredPrescriptions.slice(startIndex, endIndex);
                
                currentPrescriptions.forEach(prescription => {
                    const prescriptionDate = new Date(prescription.issuedDate);
                    const cardClass = prescription.isUrgent ? 
                        'prescription-card urgent-prescription' : 'prescription-card';
                    
                    const card = document.createElement('div');
                    card.className = 'col-md-6 col-lg-4';
                    card.innerHTML = `
                        <div class="card ${cardClass} h-100">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <span class="badge ${prescription.isUrgent ? 'bg-danger' : 'bg-warning'}">
                                    ${prescription.isUrgent ? 'عاجل' : 'بانتظار الصرف'}
                                </span>
                                <strong>#${prescription.id}</strong>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${prescription.patient.user.fullName}</h5>
                                <p class="card-text">
                                    <i class="fas fa-user-md"></i> ${prescription.doctor.user.fullName}
                                </p>
                                <p class="card-text"><i class="fas fa-hospital"></i> ${prescription.doctor.medicalCenter.name}</p>
                                <p class="card-text">
                                    <i class="fas fa-calendar-alt"></i> ${formatDate(prescription.issuedDate)}
                                </p>
                                <p class="card-text"><i class="fas fa-pills"></i> ${prescription.prescriptionItems.length} دواء</p>
                                ${prescription.notes ? `<p class="card-text text-muted"><small>${prescription.notes.substring(0, 50)}...</small></p>` : ''}
                            </div>
                            <div class="card-footer bg-transparent d-flex justify-content-between">
                                <button class="btn btn-primary btn-sm action-btn view-details-btn" 
                                    data-id="${prescription.id}">
                                    <i class="fas fa-eye"></i> عرض
                                </button>
                                <button class="btn btn-success btn-sm action-btn dispense-btn" 
                                    data-id="${prescription.id}">
                                    <i class="fas fa-check-circle"></i> صرف
                                </button>
                            </div>
                        </div>
                    `;
                    elements.container.appendChild(card);
                });

                // إضافة مستمعين للأزرار
                document.querySelectorAll('.view-details-btn').forEach(btn => {
                    btn.addEventListener('click', () => showPrescriptionDetails(btn.dataset.id));
                });
                
                document.querySelectorAll('.dispense-btn').forEach(btn => {
                    btn.addEventListener('click', () => dispensePrescription(btn.dataset.id));
                });

                // عرض ترقيم الصفحات
                renderPagination(totalPages);
            }

            // عرض ترقيم الصفحات
            function renderPagination(totalPages) {
                elements.pagination.innerHTML = '';
                
                if (totalPages <= 1) return;
                
                // زر الصفحة السابقة
                const prevLi = document.createElement('li');
                prevLi.className = `page-item ${state.currentPage === 1 ? 'disabled' : ''}`;
                prevLi.innerHTML = `
                    <a class="page-link" href="#" aria-label="السابق">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                `;
                prevLi.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (state.currentPage > 1) {
                        state.currentPage--;
                        renderPrescriptions();
                    }
                });
                elements.pagination.appendChild(prevLi);
                
                // أرقام الصفحات
                for (let i = 1; i <= totalPages; i++) {
                    const pageLi = document.createElement('li');
                    pageLi.className = `page-item ${state.currentPage === i ? 'active' : ''}`;
                    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
                    pageLi.addEventListener('click', (e) => {
                        e.preventDefault();
                        state.currentPage = i;
                        renderPrescriptions();
                    });
                    elements.pagination.appendChild(pageLi);
                }
                
                // زر الصفحة التالية
                const nextLi = document.createElement('li');
                nextLi.className = `page-item ${state.currentPage === totalPages ? 'disabled' : ''}`;
                nextLi.innerHTML = `
                    <a class="page-link" href="#" aria-label="التالي">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                `;
                nextLi.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (state.currentPage < totalPages) {
                        state.currentPage++;
                        renderPrescriptions();
                    }
                });
                elements.pagination.appendChild(nextLi);
            }

            // عرض تفاصيل الوصفة
            async function showPrescriptionDetails(prescriptionId) {
                try {
                    showLoading();
									
                    
                    const response = await axios.get(`${APP_CONFIG.API_BASE_URL}/Prescription/${prescriptionId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
								
                    
                    const prescription = response.data;
                    const modal = new bootstrap.Modal(document.getElementById('prescriptionDetailsModal'));
								
                    // تعبئة بيانات المريض
                    document.getElementById('patient-name').textContent = prescription.patient.user.fullName;
                    document.getElementById('patient-id').textContent = prescription.patientId;
                    document.getElementById('patient-age').textContent = calculateAge(prescription.patient.dateOfBirth);
                    document.getElementById('patient-gender').textContent = prescription.patient.gender === 'Male' ? 'ذكر' : 'أنثى';
                    
                    // تعبئة بيانات الطبيب
                    document.getElementById('doctor-name').textContent = prescription.doctor.user.fullName;
                    document.getElementById('doctor-specialty').textContent = prescription.doctor.specialization || '--';
                    document.getElementById('doctor-license').textContent = prescription.doctor.licenseNumber || '--';
                    document.getElementById('prescription-date').textContent = formatDate(prescription.issuedDate);
                    document.getElementById('prescription-id').textContent = prescription.id;
                    
                    // تعبئة بيانات المركز الطبي
                    document.getElementById('medical-center-name').textContent =  prescription.doctor.medicalCenter.name;
                    document.getElementById('medical-center-address').textContent = prescription.doctor.medicalCenter.address;
                    document.getElementById('medical-center-phone').textContent = prescription.doctor.medicalCenter.phone;
                    
                    // ملاحظات الطبيب
                    document.getElementById('doctor-notes').textContent = prescription.notes || 'لا توجد ملاحظات';
                    
                    // تعبئة الأدوية
                    const medicationsList = document.getElementById('medications-list');
                    medicationsList.innerHTML = '';
                    
                    prescription.prescriptionItems.forEach(async  item => {
    if(item.medicationId == null) {

                        const medItem = document.createElement('div');
                        medItem.className = 'medication-item';
                        medItem.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center">
                              <small class="badge bg-info ms-2">مخصص</small>
                                <h6 class="mb-0">${item.medicationName || 'غير معروف'}</h6>
                            </div>
                            <div class="row mt-2">
                                <div class="col-md-4"><strong>الجرعة:</strong> ${item.dosage}</div>
                                <div class="col-md-4"><strong>التكرار:</strong> ${item.frequency} مرات يومياً</div>
                                <div class="col-md-4"><strong>المدة:</strong> ${item.duration} يوم</div>
                            </div>
                            ${item.notes ? `<div class="mt-2"><strong>ملاحظات:</strong> ${item.notes}</div>` : ''}
                        `;
                        medicationsList.appendChild(medItem);

                    }
                    else{

                    console.log("iteme", item)
				const res =  await fetch(`https://localhost:7219/api/Medication/${item.medicationId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                    });
                    const medication = await res.json();
                        const medItem = document.createElement('div');
                        medItem.className = 'medication-item';
                        medItem.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">${medication.name || 'غير معروف'}</h6>
                            </div>
                            <div class="row mt-2">
                                <div class="col-md-4"><strong>الجرعة:</strong> ${item.dosage}</div>
                                <div class="col-md-4"><strong>التكرار:</strong> ${item.frequency} مرات يومياً</div>
                                <div class="col-md-4"><strong>المدة:</strong> ${item.duration} يوم</div>
                            </div>
                            ${item.notes ? `<div class="mt-2"><strong>ملاحظات:</strong> ${item.notes}</div>` : ''}
                        `;
                        medicationsList.appendChild(medItem);

                }
                    });
									
                    
                    document.getElementById('medications-count').textContent = 
                        `${prescription.prescriptionItems.length} أدوية`;
                    
                    // إدارة زر الصرف
                    document.getElementById('dispense-btn').onclick = () => dispensePrescription(prescriptionId);
                    
                    modal.show();
                    
                } catch (error) {
                    showError(error.response?.data?.message || error.message || 'حدث خطأ أثناء جلب التفاصيل');
                } finally {
                    hideLoading();
                }
            }






// صرف الوصفة - النسخة المحسنة
async function dispensePrescription(prescriptionId) {
    try {
        // 1. تأكيد الصرف من المستخدم
        const { isConfirmed } = await Swal.fire({
            title: 'تأكيد الصرف',
            text: 'هل أنت متأكد من صرف هذه الوصفة؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، صرف',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#2ecc71',
            cancelButtonColor: '#e74c3c'
        });

        if (!isConfirmed) return;

        // 2. بدء عملية الصرف
        showLoading();
        
        // 3. التحقق من بيانات الصيدلي
        const pharmacistData = JSON.parse(localStorage.getItem("PharmacistData"));
        if (!pharmacistData || !pharmacistData.pharmacyId || !pharmacistData.id) {
            throw new Error('بيانات الصيدلي غير مكتملة');
        }

        // 4. تحضير بيانات الصرف
        const dispenseData = {
            prescriptionId: parseInt(prescriptionId),
            pharmacyId: pharmacistData.pharmacyId,
            pharmacistId: pharmacistData.id,
            dispensedDate: new Date().toISOString()
        };

				console.log(dispenseData)
        // 5. إنشاء سجل الصرف
        const dispenseResponse = await fetch('https://localhost:7219/api/DispenseRecord/CreateDispenseRecord', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dispenseData)
        });

        if (!dispenseResponse.ok) {
            const errorData = await dispenseResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل في إنشاء سجل الصرف');
        }



        // 7. إظهار رسالة النجاح
        await Swal.fire({
            icon: 'success',
            title: 'تم الصرف بنجاح',
            showConfirmButton: false,
            timer: 1500
        });

        // 8. إغلاق المودال وتحديث القائمة
        const modal = bootstrap.Modal.getInstance(document.getElementById('prescriptionDetailsModal'));
        if (modal) modal.hide();
        
        await fetchPendingPrescriptions();

    } catch (error) {
        console.error('Error in dispensePrescription:', error);
        
        // عرض رسالة الخطأ بشكل واضح
        await Swal.fire({
            icon: 'error',
            title: 'خطأ في الصرف',
            text: error.message || 'حدث خطأ أثناء عملية الصرف',
            confirmButtonText: 'حسناً'
        });
    } finally {
        hideLoading();
    }
}
            // طباعة الوصفة
   // طباعة الوصفة - النسخة المحسنة
async function printPrescription() {
    try {
        // 1. تحضير بيانات الوصفة
        const prescriptionData = await preparePrescriptionData();
        
        // 2. إنشاء محتوى الطباعة
        const printContent = generatePrintContent(prescriptionData);
        
        // 3. عرض معاينة قبل الطباعة
        const { isConfirmed } = await Swal.fire({
            title: 'معاينة الطباعة',
            html: `
                <div style="max-height: 60vh; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
                    ${printContent}
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'طباعة',
            cancelButtonText: 'إلغاء',
            customClass: {
                popup: 'print-preview-popup'
            },
            didOpen: () => {
                // تطبيق أنماط المعاينة
                const popup = document.querySelector('.print-preview-popup');
                if (popup) {
                    popup.querySelector('.swal2-html-container').style.margin = '0';
                    popup.querySelector('.swal2-content').style.padding = '0';
                }
            }
        });

        if (!isConfirmed) return;

        // 4. إنشاء نافذة/iframe للطباعة
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        printFrame.contentDocument.open();
        printFrame.contentDocument.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>وصفة طبية #${prescriptionData.id}</title>
                ${getPrintStyles()}
            </head>
            <body onload="window.print()">
                ${printContent}
                <script>
                    window.onafterprint = function() {
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        printFrame.contentDocument.close();

        // 5. تنظيف بعد الطباعة
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);

    } catch (error) {
        console.error('فشل في الطباعة:', error);
        showError('حدث خطأ أثناء تجهيز الوصفة للطباعة');
    }
}

// دالة مساعدة لجمع بيانات الوصفة
async function preparePrescriptionData() {
    const pharmacistData = JSON.parse(localStorage.getItem("PharmacistData")) || {};
    
    return {
        id: document.getElementById('prescription-id').textContent,
        patient: {
            name: document.getElementById('patient-name').textContent,
            id: document.getElementById('patient-id').textContent,
            age: document.getElementById('patient-age').textContent,
            gender: document.getElementById('patient-gender').textContent
        },
        doctor: {
            name: document.getElementById('doctor-name').textContent,
            specialty: document.getElementById('doctor-specialty').textContent,
            license: document.getElementById('doctor-license').textContent
        },
        medicalCenter: {
            name: document.getElementById('medical-center-name').textContent,
            address: document.getElementById('medical-center-address').textContent,
            phone: document.getElementById('medical-center-phone').textContent
        },
        date: document.getElementById('prescription-date').textContent,
        notes: document.getElementById('doctor-notes').textContent,
        medications: Array.from(document.querySelectorAll('.medication-item')).map(item => ({
            html: item.outerHTML,
            name: item.querySelector('h6')?.textContent || '',
            dosage: item.querySelector('[data-dosage]')?.textContent || '',
            frequency: item.querySelector('[data-frequency]')?.textContent || '',
            duration: item.querySelector('[data-duration]')?.textContent || ''
        })),
        pharmacist: {
            name: pharmacistData.fullName || 'غير معروف',
            id: pharmacistData.id || ''
        },
        dispenseDate: new Date().toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };
}

// دالة مساعدة لأنماط الطباعة
function getPrintStyles() {
    return `
        <style>
            @page {
                size: A4;
                margin: 15mm;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }
            .prescription-title {
                color: #2c3e50;
                font-size: 24px;
                margin: 10px 0;
            }
            .section {
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 5px;
                page-break-inside: avoid;
            }
            .patient-info {
                background-color: #f8f9fa;
                border-right: 4px solid #3498db;
            }
            .medications-list {
                margin-top: 20px;
                page-break-inside: avoid;
            }
            .medication-item {
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
                page-break-inside: avoid;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
                color: #7f8c8d;
                border-top: 1px dashed #ccc;
                padding-top: 10px;
            }
            .signature-area {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
            }
            .watermark {
                position: fixed;
                bottom: 50px;
                right: 50px;
                opacity: 0.1;
                font-size: 120px;
                z-index: -1;
                color: #3498db;
                transform: rotate(-15deg);
            }
            @media print {
                body {
                    padding: 0 !important;
                }
                .no-print {
                    display: none !important;
                }
                .watermark {
                    opacity: 0.05;
                }
            }
        </style>
    `;
}

// دالة مساعدة لإنشاء محتوى الطباعة
function generatePrintContent(data) {
    return `
        <div class="header">
            <div class="prescription-title">وصفة طبية</div>
            <div>رقم الوصفة: #${data.id}</div>
            <div>تاريخ الصرف: ${data.dispenseDate}</div>
        </div>
        
        <div class="section patient-info">
            <h3>معلومات المريض:</h3>
            <p><strong>الاسم:</strong> ${data.patient.name}</p>
            <p><strong>رقم الهوية:</strong> ${data.patient.id}</p>
            <p><strong>العمر:</strong> ${data.patient.age} سنة</p>
            <p><strong>الجنس:</strong> ${data.patient.gender}</p>
        </div>
        
        <div class="section">
            <h3>معلومات الطبيب:</h3>
            <p><strong>الاسم:</strong> د. ${data.doctor.name}</p>
            <p><strong>التخصص:</strong> ${data.doctor.specialty}</p>
            <p><strong>رقم الرخصة:</strong> ${data.doctor.license}</p>
            <p><strong>المركز الطبي:</strong> ${data.medicalCenter.name}</p>
            <p><strong>تاريخ الوصفة:</strong> ${data.date}</p>
        </div>
        
        <div class="section">
            <h3>ملاحظات الطبيب:</h3>
            <p>${data.notes || "لا توجد ملاحظات"}</p>
        </div>
        
        <div class="section medications-list">
            <h3>الأدوية الموصوفة:</h3>
            ${data.medications.map(m => m.html).join('')}
        </div>
        
        <div class="signature-area">
            <div>
                <p>توقيع الطبيب: ___________________</p>
                <p>الاسم: د. ${data.doctor.name}</p>
                <p>التاريخ: ${data.date}</p>
            </div>
            <div>
                <p>توقيع الصيدلي: ___________________</p>
                <p>الاسم: ${data.pharmacist.name}</p>
                <p>التاريخ: ${data.dispenseDate}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>هذه الوصفة صالحة لمدة 14 يوماً من تاريخها</p>
            <p>${data.medicalCenter.name} - ${data.medicalCenter.address}</p>
            <p>هاتف: ${data.medicalCenter.phone}</p>
        </div>
        
        <div class="watermark">${data.medicalCenter.name}</div>
    `;
}




            // تجديد البيانات
            async function refreshData() {
                state.currentPage = 1;
                await fetchPendingPrescriptions();
            }

            // وظائف مساعدة
            function showLoading() {
                elements.loading.classList.remove('d-none');
                elements.error.classList.add('d-none');
            }

            function hideLoading() {
                elements.loading.classList.add('d-none');
            }

            function showError(message) {
                elements.error.classList.remove('d-none');
                elements.error.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i> 
                    ${message}
                `;
            }

            function isSameDay(date1, date2) {
                return date1.getFullYear() === date2.getFullYear() &&
                       date1.getMonth() === date2.getMonth() &&
                       date1.getDate() === date2.getDate();
            }

            function isSameWeek(date1, date2) {
                const oneDay = 24 * 60 * 60 * 1000;
                const diffDays = Math.abs((date1 - date2) / oneDay);
                return diffDays < 7;
            }

            function isSameMonth(date1, date2) {
                return date1.getFullYear() === date2.getFullYear() &&
                       date1.getMonth() === date2.getMonth();
            }

            // بدء التطبيق
            init();
        });
