        // DOM Elements
        const elements = {
            loading: document.getElementById('loading-indicator'),
            error: document.getElementById('error-alert'),
            dashboard: document.getElementById('dashboard-content'),
            logoutBtn: document.getElementById('logout-btn'),
            pendingPrescriptions: document.getElementById('pending-prescriptions'),
            dispensedPrescriptions: document.getElementById('dispensed-prescriptions'),
            monthlyMedications: document.getElementById('monthly-medications'),
            newPrescriptionsBadge: document.getElementById('new-prescriptions-badge')
        };

        // App State
        const state = {
            lastPrescriptionId: 0,
            newPrescriptionsCount: 0
        };

        // Show Loading
        function showLoading() {
            elements.loading.classList.remove('d-none');
            elements.error.classList.add('d-none');
            elements.dashboard.classList.add('d-none');
        }

        // Hide Loading
        function hideLoading() {
            elements.loading.classList.add('d-none');
            elements.dashboard.classList.remove('d-none');
        }

        // Show Error
        function showError(message) {
            elements.error.classList.remove('d-none');
            elements.error.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
        }

        // Fetch Dashboard Data
        async function fetchDashboardData() {
            try {
                showLoading();
                        const pharmacistData = JSON.parse(localStorage.getItem("PharmacistData"));

                const response = await axios.get(`https://localhost:7219/api/Pharmacist/stats/${pharmacistData.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                const data = response.data;
                
                // Update Stats Cards
                elements.pendingPrescriptions.textContent = data.pendingPrescriptions;
                elements.dispensedPrescriptions.textContent = data.dispensedPrescriptionsByPharmcist;
                elements.monthlyMedications.textContent = data.monthlyMedications;
                
                // Update last prescription ID
                if (data.lastPrescriptionId) {
                    state.lastPrescriptionId = data.lastPrescriptionId;
                }
                
                // Render Chart
                renderTopMedicationsChart(data.topMedications);
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showError(error.response?.data?.message || 'حدث خطأ أثناء جلب البيانات');
            } finally {
                hideLoading();
            }
        }

        // Check for new prescriptions
        async function checkForNewPrescriptions() {
            try {
            

                const response = await axios.get(
                    `https://localhost:7219/api/Prescription/New/${state.lastPrescriptionId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
           
                if (response.data.length > 0) {
                    state.newPrescriptionsCount = response.data.length;
                    elements.newPrescriptionsBadge.classList.remove('d-none');
                    elements.newPrescriptionsBadge.textContent = 
                        `${state.newPrescriptionsCount} وصفات جديدة`;
                    
                    // Show browser notification if tab is not active
                    if (document.hidden && Notification.permission === 'granted') {
                        new Notification('وصفات جديدة', {
                            body: `لديك ${state.newPrescriptionsCount} وصفة جديدة تحتاج معالجة`,
                          //  icon: '/assets/images/notification-icon.png'
                        });
                    }
                }
            } catch (error) {
                console.error('Error checking for new prescriptions:', error);
            }
        }

        // Render Medications Chart
        function renderTopMedicationsChart(medicationsData) {
            const ctx = document.getElementById('topMedicationsChart').getContext('2d');
            
            // Sort medications by count (descending)
            const sortedData = [...medicationsData].sort((a, b) => b.count - a.count);
            const top5 = sortedData.slice(0, 5);
            
            const labels = top5.map(m => m.medicationName);
            const data = top5.map(m => m.count);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'عدد مرات الصرف',
                        data: data,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `عدد مرات الصرف: ${context.raw}`;
                                }
                            },
                            bodyFont: {
                                family: 'Tajawal'
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Logout Function
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
            window.location.href = '../auth/login.html';
                
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
   
            
               // التحقق من الصلاحية وإدارة الجلسة
       await getPharmacistByUserId();
            
            // Load initial data
            await fetchDashboardData();
            
            // Check for new prescriptions every 30 seconds
         //   setInterval(checkForNewPrescriptions, 30000);
            
            // Event listeners
            elements.logoutBtn.addEventListener('click', logout);
            
            // Refresh data every minute
           // setInterval(fetchDashboardData, 60000);
        });
    