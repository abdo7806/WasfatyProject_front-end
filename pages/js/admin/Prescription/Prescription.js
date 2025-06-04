 // تخزين الوصفات في المتغير لتصفية البحث لاحقاً
 let prescriptions = [];
let currentPage = 1;
const prescriptionsPerPage = 5;

 async function loadPrescriptions() {
     try {
         // استبدل الرابط هنا برابط الـ API الخاص بك
         const response = await fetch('https://localhost:7219/api/Prescription/All', {
             headers: {
                 'Authorization': 'Bearer ' + localStorage.getItem('token')
             }
         });
         prescriptions = await response.json(); // تخزين البيانات في المتغير

         displayPrescriptions(prescriptions); // عرض الوصفات
         setupPagination(); // إعداد التقليب
     } catch (error) {
         console.error('حدث خطأ أثناء جلب البيانات:', error);
     }
 }

 // عرض الوصفات في الجدول
 function displayPrescriptions(data) {
     const tableBody = document.getElementById('prescription-table-body');
     tableBody.innerHTML = ''; // مسح الجدول قبل إضافة البيانات الجديدة


         const start = (currentPage - 1) * prescriptionsPerPage;
    const end = start + prescriptionsPerPage;
    const paginatedprescriptions = data.slice(start, end);


     paginatedprescriptions.forEach(prescription => {
         const row = document.createElement('tr');

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
                <button class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePrescription(${prescription.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="./EditPrescription.html?id=${prescription.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>

                
				
		         </td>
				 `;
         tableBody.appendChild(row);
     });

         // عرض عدد الوصفات
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedprescriptions.length}</b> من <b>${prescriptions.length}</b> إدخالات`;
 }

 // وظيفة لحذف المستخدم
async function deletePrescription(prescriptionId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟");
    if (confirmDelete) {
        try {
            // حذف المستخدم من API
            const response = await fetch(`https://localhost:7219/api/Prescription/${prescriptionId}`, {
                method: 'DELETE',

                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }

            });



            if (response.ok) {
                // تحديث القائمة بعد الحذف
                prescriptions = prescriptions.filter(prescription => prescription.id !== prescriptionId);
                displayPrescriptions(prescriptions);
                setupPagination();
            }
        } catch (error) {
            console.error('خطأ في حذف المستخدم:', error);
        }
    }
}

// وظيفة لإعداد التقليب
function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // مسح المحتوى السابق

    const totalPages = Math.ceil(prescriptions.length / prescriptionsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button  class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}


// وظيفة لتغيير الصفحة
function changePage(page) {
    //alert(page)
    currentPage = page;
    displayPrescriptions(prescriptions);
    setupPagination();
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



 //--------------------------------------------------


