


        $(document).ready(function() {
            // إغلاق القائمة الجانبية تلقائياً على الهواتف
            if ($(window).width() < 768) {
                $('body').addClass('sidebar-collapse');
            }

            // إعادة حساب الأبعاد عند تغيير حجم النافذة
            $(window).resize(function() {
                if ($(window).width() < 768) {
                    $('body').addClass('sidebar-collapse');
                } else {
                    $('body').removeClass('sidebar-collapse');
                }
            });

            // زر إنشاء وصفة جديدة
            $('.new-prescription-btn').click(function() {
                window.location.href = './Doctor/Doctors.html';
            });
        });


        // تخزين الوصفات في المتغير لتصفية البحث لاحقاً
        let prescriptions = [];

        async function loadPrescriptions() {

            let doctorData = JSON.parse(localStorage.getItem("doctorData"));
            const doctorId = doctorData.id;


            try {
                // استبدل الرابط هنا برابط الـ API الخاص بك
                const response = await fetch(`https://localhost:7219/api/Prescription/GetByDoctorId/${doctorId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                prescriptions = await response.json(); // تخزين البيانات في المتغير


                displayPrescriptions(prescriptions); // عرض الوصفات
            } catch (error) {
                console.error('حدث خطأ أثناء جلب البيانات:', error);
            }
        }

        // عرض الوصفات في الجدول
        function displayPrescriptions(data) {
            const tableBody = document.getElementById('prescription-table-body');
            tableBody.innerHTML = ''; // مسح الجدول قبل إضافة البيانات الجديدة

            data.forEach(prescription => {
                const row = document.createElement('tr');

                // إضافة بيانات الوصفة
                // إضافة بيانات الوصفة
                row.innerHTML = `
						 <td>${prescription.id}</td>
						 <td>${prescription.patient.user.fullName}</td>
						 <td>${prescription.doctor.user.fullName}</td>
						 <td>${prescription.prescriptionItems.length}</td>
						 <td>${new Date(prescription.issuedDate).toLocaleDateString()}</td>
						 <td>${prescription.isDispensed ? 'نعم' : 'لا'}</td>
						 <td>


                       <a href="./DetailsPrescription.html?id=${prescription.id}" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <a href="#" class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePrescription(${prescription.id})" title="حذف"><i class="fas fa-trash"></i></a>
								<a href="./EditPrescription.html?id=${prescription.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>



						 </td>
				 `;
                tableBody.appendChild(row);
            });
        }



        // تصفية الوصفات بناءً على البحث
        function searchPrescriptions() {
            const searchInput = document.getElementById('searchInput').value.toLowerCase();
            const filteredPrescriptions = prescriptions.filter(prescription => {
                return (
                    prescription.id.toString().includes(searchInput) ||
                    prescription.patient.user.fullName.toLowerCase().includes(searchInput) ||
                    prescription.doctor.user.fullName.toLowerCase().includes(searchInput) ||
                    prescription.prescriptionItems.length.toString().includes(searchInput)
                );
            });

            displayPrescriptions(filteredPrescriptions); // عرض النتائج بعد التصفية
        }

        // تحميل الوصفات عند تحميل الصفحة
        window.onload = loadPrescriptions;