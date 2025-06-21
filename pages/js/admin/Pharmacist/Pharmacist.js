let pharmacists = [];
let currentPage = 1;
const pharmacistsPerPage = 5;
let searchColumn = 'fullName'; // العمود الافتراضي للبحث



// وظيفة لجلب بيانات الصيادلة من API
async function fetchPharmacists() {
    try {
        const response = await fetch('https://localhost:7219/api/Pharmacist/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        pharmacists = await response.json();
        displayPharmacists();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

// وظيفة لعرض بيانات الصيادلة في الجدول
function displayPharmacists(url = 'EditPharmacist.html') {
    const pharmacistsTableBody = document.getElementById('pharmacistsTableBody');
    pharmacistsTableBody.innerHTML = ''; // مسح المحتوى السابق

    const start = (currentPage - 1) * pharmacistsPerPage;
    const end = start + pharmacistsPerPage;
    const paginatedPharmacists = pharmacists.slice(start, end);

    paginatedPharmacists.forEach(pharmacist => {
        const row = document.createElement('tr');
        row.innerHTML = `
						<td>${pharmacist.id}</td>
						<td>${pharmacist.licenseNumber}</td>
						<td>${pharmacist.user.fullName}</td>
						<td>${pharmacist.user.email}</td>
						<td>${pharmacist.pharmacy.name}</td>
						<td>${pharmacist.pharmacy.address}</td>
						<td>${new Date(pharmacist.user.createdAt).toLocaleDateString('ar-EG')}</td>
						<td>
                <button class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePharmacist(${pharmacist.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="${url}?id=${pharmacist.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
						
                                </td>
				`;
        pharmacistsTableBody.appendChild(row);
    });

    // عرض عدد الصيادلة
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedPharmacists.length}</b> من <b>${pharmacists.length}</b> إدخالات`;
}

// وظيفة لإعداد التقليب
function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // مسح المحتوى السابق

    const totalPages = Math.ceil(pharmacists.length / pharmacistsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button  class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

// وظيفة لتغيير الصفحة
function changePage(page) {
    currentPage = page;
    displayPharmacists();
    setupPagination();
}

// وظيفة للبحث عن الصيادلة حسب العمود المحدد
function searchPharmacists() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    let filteredPharmacists = [];
    if(searchColumn === "address" || searchColumn === "name"){
      filteredPharmacists = pharmacists.filter(pharmacist => {
        return pharmacist.pharmacy[searchColumn].toLowerCase().includes(searchInput);
    });
    }
    else if(searchColumn === "licenseNumber"){
        filteredPharmacists = pharmacists.filter(pharmacist => {
        return pharmacist[searchColumn].toLowerCase().includes(searchInput);
    });
    }
    else{

     filteredPharmacists = pharmacists.filter(pharmacist => {
        return pharmacist.user[searchColumn].toLowerCase().includes(searchInput);
    });
}
console.log("filter", filteredPharmacists)
    const pharmacistsTableBody = document.getElementById('pharmacistsTableBody');
    pharmacistsTableBody.innerHTML = '';

    const start = (currentPage - 1) * pharmacistsPerPage;
    const end = start + pharmacistsPerPage;
    const paginatedPharmacists = filteredPharmacists.slice(start, end);

    paginatedPharmacists.forEach(pharmacist => {
        const row = document.createElement('tr');
        row.innerHTML = `
						<td>${pharmacist.id}</td>
						<td>${pharmacist.licenseNumber}</td>
						<td>${pharmacist.user.fullName}</td>
						<td>${pharmacist.user.email}</td>
						<td>${pharmacist.pharmacy.name}</td>
						<td>${pharmacist.pharmacy.address}</td>
						<td>${new Date(pharmacist.user.createdAt).toLocaleDateString('ar-EG')}</td>
						<td>
                <button class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePharmacist(${pharmacist.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="EditPharmacist.html?id=${pharmacist.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
						 
						</td>
				`;
        pharmacistsTableBody.appendChild(row);
    });

    // عرض عدد الصيادلة المتطابقين
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedPharmacists.length}</b> من <b>${filteredPharmacists.length}</b> إدخالات`;

    // إعداد التقليب الجديد
    setupPagination(filteredPharmacists.length);
}

// وظيفة لتحديد العمود الذي سيتم البحث فيه
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    searchColumn = columnSelect.value;
    searchPharmacists(); // إعادة البحث عند تغيير العمود
}

// وظيفة لحذف الصيدلي
async function deletePharmacist(pharmacistId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا الصيدلي؟");
    if (confirmDelete) {
        try {
            // جلب بيانات الصيدلي قبل الحذف
          /*  const response2 = await fetch(`https://localhost:7219/api/Pharmacist/${pharmacistId}`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (!response2.ok) {
                throw new Error('فشل في جلب بيانات الصيدلي');
            }
            const pharmacist = await response2.json();*/

            // حذف الصيدلي من API
            const response = await fetch(`https://localhost:7219/api/Pharmacist/${pharmacistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });

            if (response.ok) {
                // تحديث القائمة بعد الحذف
                pharmacists = pharmacists.filter(pharmacist => pharmacist.id !== pharmacistId);
                displayPharmacists();
                setupPagination();

                // حذف المستخدم من API
               /* const responseUser = await fetch(`https://localhost:7219/api/User/${pharmacist.userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!responseUser.ok) {
                    throw new Error('فشل في حذف بيانات المستخدم');
                }*/

                alert('تم حذف الصيدلي بنجاح.');
            } else {
                throw new Error('فشل في حذف الصيدلي');
            }
        } catch (error) {
            console.error('خطأ في حذف الصيدلي:', error);
            alert('حدث خطأ أثناء حذف الصيدلي: ' + error.message);
        }
    }
}




//---------------------------------------------------------



async function addUser() {
    if (!validateForm()) {
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const pharmacyId = document.getElementById('Pharmacy').value;
    const licenseNumber = document.getElementById('licenseNumber').value;
    const role = 4;

    try {
        const response = await fetch('https://localhost:7219/api/User', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                role: role

            })
        });

        if (!response.ok) {

            throw new Error('فشل التسجيل');
        }

        const createdUser = await response.json();
        await addPharmacist(createdUser.id, pharmacyId, licenseNumber);
        //  window.location.href = './Pharmacists.html';
        window.history.back();

    } catch (error) {
        document.getElementById('error-message').style.display = "block ";
        document.getElementById('error-message').textContent = error.message;
    }
}

async function addPharmacist(userId, pharmacyId, licenseNumber) {
    try {
        const response = await fetch('https://localhost:7219/api/Pharmacist/CreatePharmacist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                userId,
                pharmacyId,
                licenseNumber
            })
        });

        if (!response.ok) {
            throw new Error('فشل إضافة صيدلي');
        }
    } catch (error) {
        document.getElementById('error-message').style.display = "block ";
        document.getElementById('error-message').textContent = error.message;
    }
}

async function fetchPharmacies() {
    try {
        const response = await fetch('https://localhost:7219/api/Pharmacy/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
        });
        const pharmacies = await response.json();
        const body = document.getElementById('Pharmacy');
        body.innerHTML = '<option value=" ">اختر صيدلية</option>'; // إعادة تعيين الخيارات

        pharmacies.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            body.appendChild(option);
        });
    } catch (error) {
        console.error('خطأ في جلب بيانات الصيدليات:', error);
    }
}


//--------------------------------------------








async function fetchPharmacistDetails(id) {
    try {
        const response = await fetch(`https://localhost:7219/api/Pharmacist/${id}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
        });
        if (!response.ok) throw new Error("فشل في جلب بيانات الصيدلي");

        const pharmacist = await response.json();
        document.getElementById('fullName').value = pharmacist.user.fullName;
        document.getElementById('email').value = pharmacist.user.email;
        document.getElementById('licenseNumber').value = pharmacist.licenseNumber;
        document.getElementById('Pharmacy').value = pharmacist.pharmacyId;
    } catch (error) {
        showError(error.message);
    }
}

async function updateUser(userId, fullName, email, role = 4) {
    const userData = {
        fullName,
        email,
        role: parseInt(role)
    };

    try {
        const response = await fetch(`https://localhost:7219/api/User/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('فشل تحديث بيانات المستخدم.');
        }

        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

async function updatePharmacist() {
    pharmacistId = new URLSearchParams(window.location.search).get('id');
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;

    if (!validateForm()) {
        submitBtn.disabled = false;
        return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const pharmacyId = document.getElementById('Pharmacy').value;
    const licenseNumber = document.getElementById('licenseNumber').value.trim();

    try {
        const response = await fetch(`https://localhost:7219/api/Pharmacist/${pharmacistId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                licenseNumber,
                pharmacyId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "فشل تعديل بيانات الصيدلي.");
        }

        const updatedPharmacist = await response.json();
        const userUpdated = await updateUser(updatedPharmacist.userId, fullName, email, 4);

        if (userUpdated) {
            // window.location.href = './Pharmacists.html';
            window.history.back();

        }

    } catch (error) {
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
    }
}

async function fetchPharmacies() {
    try {
        const response = await fetch('https://localhost:7219/api/Pharmacy/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
        });
        if (!response.ok) throw new Error("فشل جلب قائمة الصيدليات.");

        const pharmacies = await response.json();
        const select = document.getElementById('Pharmacy');
        select.innerHTML = '<option value="">اختر صيدلية</option>';

        pharmacies.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            select.appendChild(option);
        });
    } catch (error) {
        showError(error.message);
    }
}


//-------------------------





async function GetPharmacistsByPharmacyId(PharmacyId) {
    try {
        const response = await fetch(`https://localhost:7219/api/Pharmacist/GetByPharmacyIdAsync/${PharmacyId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        pharmacists = await response.json();
        displayPharmacists();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}
