let medicalCenters = [];
let currentPage = 1;
const centersPerPage = 5;
let searchColumn = 'name';




async function fetchMedicalCenters() {
    try {
        const response = await fetch('https://localhost:7219/api/MedicalCenter/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        medicalCenters = await response.json();
        displayMedicalCenters();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب بيانات المراكز الطبية:', error);
    }
}

function displayMedicalCenters() {
    const body = document.getElementById('medicalCenterTableBody');
    body.innerHTML = '';

    const start = (currentPage - 1) * centersPerPage;
    const end = start + centersPerPage;
    const paginated = medicalCenters.slice(start, end);

    paginated.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
					<td>${c.id}</td>
					<td>${c.name}</td>
					<td>${c.address}</td>
					<td>${c.phone || ''}</td>
					<td>

                <a href="#" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <button  class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deleteMedicalCenter(${c.id}) "title="حذف"><i class="fas fa-trash"></i></button>
								<a href="CreateAndUpdateMedicalCenters.html?id=${c.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
                           
						
					</td>
			`;
        body.appendChild(row);
    });

    document.getElementById('hintText').innerHTML =
        `عرض <b>${paginated.length}</b> من <b>${medicalCenters.length}</b> إدخالات`;
}

function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(medicalCenters.length / centersPerPage);
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

function changePage(page) {
    currentPage = page;
    displayMedicalCenters();
    setupPagination();
}

function searchMedicalCenters() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filtered = medicalCenters.filter(c => c[searchColumn].toLowerCase().includes(searchInput));

    const body = document.getElementById('medicalCenterTableBody');
    body.innerHTML = '';

    const start = (currentPage - 1) * centersPerPage;
    const end = start + centersPerPage;
    const paginated = filtered.slice(start, end);

    paginated.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
					<td>${c.id}</td>
					<td>${c.name}</td>
					<td>${c.address}</td>
					<td>${c.phone || ''}</td>
					<td>
						
                <a href="#" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <button  class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deleteMedicalCenter(${c.id}) "title="حذف"><i class="fas fa-trash"></i></button>
								<a href="CreateAndUpdateMedicalCenters.html?id=${c.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
                           
						
                            </td>
			`;
        body.appendChild(row);
    });

    document.getElementById('hintText').innerHTML =
        `عرض <b>${paginated.length}</b> من <b>${filtered.length}</b> إدخالات`;

    setupPagination();
}

function changeSearchColumn() {
    
    searchColumn = document.getElementById('columnSelect').value;
    searchMedicalCenters();
}

async function deleteMedicalCenter(id) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا المركز الطبي؟");
    if (confirmDelete) {
        try {
            const response = await fetch(`https://localhost:7219/api/MedicalCenter/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (response.ok) {
                medicalCenters = medicalCenters.filter(c => c.id !== id);
                displayMedicalCenters();
                setupPagination();
            }
        } catch (error) {
            console.error('خطأ في الحذف:', error);
        }
    }
}





//-----------------------------------


async function addMedicalCenter() {
    if (!validateMedicalCenterForm()) return;

    const medicalCenter = buildMedicalCenterModel();

    try {
        const response = await fetch('https://localhost:7219/api/MedicalCenter/CreateMedicalCenter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(medicalCenter)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في إضافة المركز الطبي.');
        }

        alert('تمت إضافة المركز الطبي بنجاح!');
        window.location.href = 'MedicalCenters.html';

    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
    }
}

async function updateMedicalCenter() {
    const urlParams = new URLSearchParams(window.location.search);
    const centerId = urlParams.get('id'); // الحصول على القيمة المرتبطة بمفتاح 'id'

    if (!validateMedicalCenterForm()) return;

    const medicalCenter = buildMedicalCenterModel();
    try {
        const response = await fetch(`https://localhost:7219/api/MedicalCenter/${centerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(medicalCenter)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في تعديل المركز الطبي.');
        }

        alert('تمت تعديل المركز الطبي بنجاح!');
        window.location.href = 'MedicalCenters.html';

    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
    }
}


function validateMedicalCenterForm() {
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    document.getElementById('nameError').textContent = '';
    document.getElementById('addressError').textContent = '';
    document.getElementById('phoneNumberError').textContent = '';
    document.getElementById('error-message').style.display = 'none';

    let isValid = true;

    if (!name) {
        document.getElementById('nameError').textContent = 'اسم المركز الطبي مطلوب!';
        isValid = false;
    }

    if (!address) {
        document.getElementById('addressError').textContent = 'العنوان مطلوب!';
        isValid = false;
    }

    if (!phoneNumber) {
        document.getElementById('phoneNumberError').textContent = 'رقم الهاتف مطلوب!';
        isValid = false;
    } else if (!/^\d{8,15}$/.test(phoneNumber)) {
        document.getElementById('phoneNumberError').textContent = 'رقم الهاتف غير صالح!';
        isValid = false;
    }

    return isValid;
}

function buildMedicalCenterModel() {
    return {
        name: document.getElementById('name').value.trim(),
        address: document.getElementById('address').value.trim(),
        phone: document.getElementById('phoneNumber').value.trim()
    };
}
