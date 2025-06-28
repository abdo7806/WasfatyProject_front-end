

document.addEventListener('DOMContentLoaded', async () => {
       await getDactorByUserId();

    // جلب البيانات من الخادم
    function fetchDashboardData() {

        const doctorId = JSON.parse(localStorage.getItem('doctorData')).id;
        if (!doctorId) {
            return console.error('Doctor ID not found in localStorage');
        }
        $.ajax({
            url: 'https://localhost:7219/api/Doctor/dashboard/'+doctorId,
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            method: 'GET',
            dataType: 'json',
            beforeSend: function() {
                $('#loading-indicator').removeClass('d-none');
            },
            success: function(data) {
                console.log('API Response:', data);
                
                // التحقق من وجود العناصر قبل تعبئتها
                const elements = {
                    'totalPrescriptions': data.totalPrescriptions,
                    'dispensedPrescriptions': data.dispensedPrescriptions,
                    'pendingPrescriptions': data.pendingPrescriptions,
                    'uniquePatients': data.uniquePatients,
                    
                };

                Object.keys(elements).forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = elements[id];
                    } else {
                        console.error(`Element with ID ${id} not found`);
                    }
                });

                createChart(data);
                $('#loading-indicator').addClass('d-none');
            },
            error: function(xhr, status, error) {
                console.error('API Error:', error);
                $('#loading-indicator').addClass('d-none');
                $('#error-alert').removeClass('d-none').text('حدث خطأ أثناء جلب البيانات: ' + error);
                
                if (xhr.status === 401) {
                    $('#error-alert').append('<button class="btn btn-sm btn-danger ms-2" id="login-redirect">تسجيل الدخول</button>');
                    $('#login-redirect').click(() => window.location.href = '/login.html');
                }
            }
        });
    }

    // دالة لإنشاء الرسم البياني
    function createChart(data) {
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
       // الرسم البياني الدائري
            const pieCtx = document.getElementById('prescriptionsPieChart').getContext('2d');
            new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: [ 'اجمالي الوصفات', 'الوصفات المستلمة','مكالوصفات المستلمةملة', 'الوصفات المنتظرة', 'المرضى المسجلين'],
                    datasets: [{
                        data: [ data.totalPrescriptions, data.dispensedPrescriptions,data.pendingPrescriptions, data.uniquePatients],
                        backgroundColor: [
                            '#2ecc71',
                            '#f39c12',
                            '#e74c3c',
                            '#3498db'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'left'
                        }
                    }
                }
            });
        
            
        } catch (error) {
            console.error('Chart initialization error:', error);
        }
    }
    fetchDashboardData();
});