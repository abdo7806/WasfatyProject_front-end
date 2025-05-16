let doctors = [];
let currentPage = 1;
const doctorsPerPage = 5;
let searchColumn = 'specialization';



async function fetchDoctors() {
    try {
        const response = await fetch('https://localhost:7219/api/Doctor/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        doctors = await response.json();
        displayDoctors();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

function displayDoctors() {
    const tableBody = document.getElementById('doctorsTableBody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * doctorsPerPage;
    const end = start + doctorsPerPage;
    const paginatedDoctors = doctors.slice(start, end);

    paginatedDoctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.licenseNumber}</td>
            <td>${doctor.specialization}</td>
            <td>${doctor.user?.fullName || ''}</td>
            <td>${doctor.user?.email || ''}</td>
            <td>${doctor.medicalCenter?.name || ''}</td>
            <td>${doctor.medicalCenter?.address || ''}</td>
            <td>


                <a href="#" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <a href="#" class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deleteDoctor(${doctor.id})" title="حذف"><i class="fas fa-trash"></i></a>
								<a href="EditDoctor.html?id=${doctor.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>


            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('hintText').innerHTML = `عرض <b>${paginatedDoctors.length}</b> من <b>${doctors.length}</b> إدخالات`;
}

function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(doctors.length / doctorsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a href="#" class="page-link" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
}

function changePage(page) {
    currentPage = page;
    displayDoctors();
    setupPagination();
}

function searchDoctors() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const filtered = doctors.filter(doctor => (doctor[searchColumn] || '').toLowerCase().includes(input));

    const tableBody = document.getElementById('doctorsTableBody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * doctorsPerPage;
    const end = start + doctorsPerPage;
    const paginatedDoctors = filtered.slice(start, end);

    paginatedDoctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.licenseNumber}</td>
            <td>${doctor.specialization}</td>
            <td>${doctor.user?.fullName || ''}</td>
            <td>${doctor.user?.email || ''}</td>
            <td>${doctor.medicalCenter?.name || ''}</td>
            <td>${doctor.medicalCenter?.address || ''}</td>
            <td>
                <a href="EditDoctor.html?id=${doctor.id}" class="edit" title="تعديل"><i class="material-icons">&#xE254;</i></a>
                <a href="#" class="delete" title="حذف" onclick="deleteDoctor(${doctor.id})"><i class="material-icons">&#xE872;</i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('hintText').innerHTML = `عرض <b>${paginatedDoctors.length}</b> من <b>${filtered.length}</b> إدخالات`;
    setupPagination(filtered.length);
}

function changeSearchColumn() {
    searchColumn = document.getElementById('columnSelect').value;
    searchDoctors();
}

async function deleteDoctor(doctorId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا الطبيب؟");
    if (confirmDelete) {


        try {
            // جلب بيانات الصيدلي قبل الحذف
            const response2 = await fetch(`https://localhost:7219/api/Doctor/${doctorId}`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (!response2.ok) {
                throw new Error('فشل في جلب بيانات الصيدلي');
            }
            const doctor = await response2.json();

            // حذف الصيدلي من API
            const response = await fetch(`https://localhost:7219/api/Doctor/${doctorId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });

            if (response.ok) {
                doctors = doctors.filter(d => d.id !== doctorId);
                // تحديث القائمة بعد الحذف
                displayDoctors();
                setupPagination();

                // حذف المستخدم من API
                const responseUser = await fetch(`https://localhost:7219/api/User/${doctor.userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!responseUser.ok) {
                    throw new Error('فشل في حذف بيانات المستخدم');
                }

                alert('تم حذف الطبيب بنجاح.');
            } else {
                throw new Error('فشل في حذف الطبيب');
            }
        } catch (error) {
            console.error('خطأ في حذف الطبيب:', error);
            alert('حدث خطأ أثناء حذف الطبيب: ' + error.message);
        }
    }
}



async function addDoctor() {
    if (!validateForm()) {
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const medicalCenterId = document.getElementById('MedicalCenter').value;
    const specialization = document.getElementById('specialization').value;
    const licenseNumber = document.getElementById('licenseNumber').value;
    const role = 2; // رقم الدور للطبيب حسب النظام عندك

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
                role
            })
        });

        if (!response.ok) {
            throw new Error('فشل التسجيل');
        }

        const createdUser = await response.json();
        await addDoctorDetails(createdUser.id, medicalCenterId, specialization, licenseNumber);
        window.location.href = './Doctors.html';
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}

async function addDoctorDetails(userId, medicalCenterId, specialization, licenseNumber) {
    try {
        const response = await fetch('https://localhost:7219/api/Doctor/CreateDoctor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')

            },
            body: JSON.stringify({
                userId,
                medicalCenterId,
                specialization,
                licenseNumber
            })
        });

        if (!response.ok) {
            throw new Error('فشل إضافة الطبيب');
        }
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}

async function fetchMedicalCenters() {
    try {
        const response = await fetch('https://localhost:7219/api/MedicalCenter/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        const centers = await response.json();
        const body = document.getElementById('MedicalCenter');
        body.innerHTML = '<option value="">اختر مركز طبي</option>';

        centers.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            body.appendChild(option);
        });
    } catch (error) {
        console.error('خطأ في جلب بيانات المراكز الطبية:', error);
    }
}



//----------------------------------------------




async function updateUser(userId, fullName, email, role = 2) {
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

async function updateDoctor() {
    doctorId = new URLSearchParams(window.location.search).get('id');
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;

    if (!validateForm()) {
        submitBtn.disabled = false;
        return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const medicalCenterId = document.getElementById('MedicalCenter').value;
    const licenseNumber = document.getElementById('licenseNumber').value.trim();
    const specialization = document.getElementById('specialization').value.trim();

    try {
        const response = await fetch(`https://localhost:7219/api/Doctor/${doctorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')

            },
            body: JSON.stringify({
                medicalCenterId,
                specialization,
                licenseNumber
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "فشل تعديل بيانات الطبيب.");
        }

        const updatedDoctor = await response.json();
        const userUpdated = await updateUser(updatedDoctor.userId, fullName, email, 3);

        if (userUpdated) {
            alert("تم تعديل البيانات بنجاح");
            window.location.href = './Doctors.html';
        }

    } catch (error) {
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
    }
}
