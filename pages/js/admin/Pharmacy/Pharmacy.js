let pharmacies = [];
let currentPage = 1;
const pharmaciesPerPage = 5;
let searchColumn = 'name';



async function fetchPharmacies() {
    try {
        const response = await fetch('https://localhost:7219/api/Pharmacy/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        pharmacies = await response.json();
        displayPharmacies();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب بيانات الصيدليات:', error);
    }
}

function displayPharmacies() {
    const body = document.getElementById('pharmacyTableBody');
    body.innerHTML = '';

    const start = (currentPage - 1) * pharmaciesPerPage;
    const end = start + pharmaciesPerPage;
    const paginated = pharmacies.slice(start, end);

    paginated.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${p.address}</td>
                    <td>${p.phone || ''}</td>
                    <td>

                  <a href="DetailsPharmacy.html?id=${p.id}" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <button href="#" class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePharmacy(${p.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="CreateAndUpdatePharmacy.html?id=${p.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>



                    </td>
                `;
        body.appendChild(row);
    });

    document.getElementById('hintText').innerHTML =
        `عرض <b>${paginated.length}</b> من <b>${pharmacies.length}</b> إدخالات`;
}

function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(pharmacies.length / pharmaciesPerPage);
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button  class="page-link" onclick="changePage(${i})">${i}</button>`;
        pagination.appendChild(pageItem);
    }
}

function changePage(page) {
    currentPage = page;
    displayPharmacies();
    setupPagination();
}

function searchPharmacies() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filtered = pharmacies.filter(p => p[searchColumn].toLowerCase().includes(searchInput));

    const body = document.getElementById('pharmacyTableBody');
    body.innerHTML = '';
    currentPage = 1;

    const start = (currentPage - 1) * pharmaciesPerPage;
    const end = start + pharmaciesPerPage;
    const paginated = filtered.slice(start, end);

    paginated.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${p.address}</td>
                    <td>${p.phone || ''}</td>
                    <td>
                  
                  <a href="DetailsPharmacy.html?id=${p.id}" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <button href="#" class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePharmacy(${p.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="CreateAndUpdatePharmacy.html?id=${p.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>


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
    searchPharmacies();
}

async function deletePharmacy(id) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذه الصيدلية؟");
    if (confirmDelete) {
        try {
            const response = await fetch(`https://localhost:7219/api/Pharmacy/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (response.ok) {
                pharmacies = pharmacies.filter(p => p.id !== id);
                displayPharmacies();
                setupPagination();
            }
        } catch (error) {
            console.error('خطأ في الحذف:', error);
        }
    }
}




//------------------------------------------------




function validatePharmacyForm() {
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    document.getElementById('nameError').textContent = '';
    document.getElementById('addressError').textContent = '';
    document.getElementById('phoneNumberError').textContent = '';
    document.getElementById('error-message').style.display = 'none';

    let isValid = true;

    if (!name) {
        document.getElementById('nameError').textContent = 'اسم الصيدلية مطلوب!';
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


function buildPharmacyModel() {
    return {
        name: document.getElementById('name').value.trim(),
        address: document.getElementById('address').value.trim(),
        phone: document.getElementById('phoneNumber').value.trim()
    };
}
async function addPharmacy() {
    if (!validatePharmacyForm()) return;

    const pharmacy = buildPharmacyModel();

    try {
        const response = await fetch('https://localhost:7219/api/Pharmacy/CreatePharmacy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(pharmacy)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في إضافة الصيدلية.');
        }

        window.location.href = 'Pharmacys.html';

    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
    }
}



async function UpdatePharmacy() {
    const urlParams = new URLSearchParams(window.location.search);
    const PharmacyId = urlParams.get('id'); // الحصول على القيمة المرتبطة بمفتاح 'id'


    if (!validatePharmacyForm()) return;

    const pharmacy = buildPharmacyModel();
    try {
        const response = await fetch(`https://localhost:7219/api/Pharmacy/${PharmacyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(pharmacy)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في تعديل الصيدلية.');
        }

        window.location.href = 'Pharmacys.html';

    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
    }
}
