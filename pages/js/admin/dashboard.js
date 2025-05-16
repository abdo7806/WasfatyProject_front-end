document.addEventListener('DOMContentLoaded', async () => {
  

    // عناصر DOM
    const doctorsCount = document.getElementById('doctors-count');
    const pharmacistsCount = document.getElementById('pharmacists-count');
    const patientsCount = document.getElementById('patients-count');
    const prescriptionsCount = document.getElementById('prescriptions-count');
    
      const loadingIndicator = document.getElementById('loading-indicator');
    const errorAlert = document.getElementById('error-alert');
    const dashboardContent = document.getElementById('dashboard-content');

    try {
        // إظهار مؤشر التحميل
        loadingIndicator.classList.remove('d-none');
        dashboardContent.classList.add('d-none');
        errorAlert.classList.add('d-none');

        // جلب بيانات لوحة التحكم مع إدارة الوقت الزمني
        const response = await Promise.race([
            fetch(`https://localhost:7219/api/Prescription/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
     new Promise((_, reject) => 
                setTimeout(() => reject(new Error('تجاوز وقت الانتظار')), 10000)
            )
        ]);

        if (!response.ok) {
            throw new Error(response.status === 401 ? 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' : 'فشل في جلب البيانات');
        }

        const data = await response.json();
        console.log(data);
     

        // عرض البيانات مع التحقق من القيم

				doctorsCount.textContent = data.doctorCount;
				pharmacistsCount.textContent = data.pharmacistCount;
				patientsCount.textContent = data.patientCount;
				prescriptionsCount.textContent = data.prescriptiontCount;

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
    
   

	});