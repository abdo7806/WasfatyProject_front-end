document.addEventListener('DOMContentLoaded', () => {
    
    // ✅ دالة لجلب البيانات باستخدام fetchWithAuth
    async function fetchDashboardData() {
        try {
            // إظهار مؤشر التحميل
            $('#loading-indicator').removeClass('d-none');
            
            // ✅ استخدام fetchWithAuth بدلاً من $.ajax
            const response = await fetchWithAuth('https://localhost:7219/api/Admin/dashboard', {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);
            
            // التحقق من وجود العناصر قبل تعبئتها
            const elements = {
                'totalDoctors': data.totalDoctors,
                'totalPharmacists': data.totalPharmacists,
                'totalPatients': data.totalPatients,
                'totalPrescriptions': data.totalPrescriptions,
                'totalPharmacies': data.totalPharmacies,
                'totalDispensedPrescriptions': data.totalDispensedPrescriptions,
                'totalPendingPrescriptions': data.totalPendingPrescriptions || 0,
                'totalMedications': data.totalMedications,
                'totalUsers': data.totalUsers
            };

            Object.keys(elements).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = elements[id];
                } else {
                    console.error(`Element with ID ${id} not found`);
                }
            });

            createChart();
            
        } catch (error) {
            console.error('API Error:', error);
            $('#error-alert').removeClass('d-none').text('حدث خطأ أثناء جلب البيانات');
        } finally {
            $('#loading-indicator').addClass('d-none');
        }
    }

    // دالة لإنشاء الرسم البياني
    function createChart() {
        const ctx = document.getElementById('prescriptionsChart');
        if (!ctx) {
            console.error('Canvas element not found');
            return;
        }

        try {
            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'],
                    datasets: [{
                        label: 'الوصفات الطبية',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch (error) {
            console.error('Chart initialization error:', error);
        }
    }

    // ✅ بدء جلب البيانات
    fetchDashboardData();
});