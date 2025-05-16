let patients = [];
let currentPage = 1;
const patientsPerPage = 5;
let searchColumn = 'fullName'; // العمود الافتراضي للبحث


// وظيفة لجلب بيانات المرضى من API
async function fetchPatients() {
    try {
        const response = await fetch('https://localhost:7219/api/PatientController/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
        });
        patients = await response.json();
        displayPatients();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

// وظيفة لعرض بيانات المرضى في الجدول
function displayPatients() {
    const patientsTableBody = document.getElementById('patientsTableBody');
    patientsTableBody.innerHTML = ''; // مسح المحتوى السابق

    const start = (currentPage - 1) * patientsPerPage;
    const end = start + patientsPerPage;
    const paginatedPatients = patients.slice(start, end);

    paginatedPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
						<td>${patient.id}</td>
						<td>${patient.userId}</td>
						<td>${patient.user.fullName}</td>
						<td>${patient.user.email}</td>
						<td>${patient.gender}</td>
						<td>${patient.bloodType}</td>
						<td>${new Date(patient.user.createdAt).toLocaleDateString('ar-EG')}</td>
						<td>

                                       <a href="#" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <a href="#" class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePatient(${patient.id})" title="حذف"><i class="fas fa-trash"></i></a>
								<a href="EditePatient.html?id=${patient.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>

                
						</td>
				`;
        patientsTableBody.appendChild(row);
    });

    // عرض عدد المرضى
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedPatients.length}</b> من <b>${patients.length}</b> إدخالات`;
}

// وظيفة لإعداد التقليب
function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // مسح المحتوى السابق

    const totalPages = Math.ceil(patients.length / patientsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a href="#" class="page-link" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
}

// وظيفة لتغيير الصفحة
function changePage(page) {
    currentPage = page;
    displayPatients();
    setupPagination();
}

// وظيفة للبحث عن المرضى حسب العمود المحدد
function searchPatients() {

    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredPatients = patients.filter(patient => {
        return patient.user[searchColumn].toLowerCase().includes(searchInput);
    });

    const patientsTableBody = document.getElementById('patientsTableBody');
    patientsTableBody.innerHTML = '';

    const start = (currentPage - 1) * patientsPerPage;
    const end = start + patientsPerPage;
    const paginatedPatients = filteredPatients.slice(start, end);

    paginatedPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
								<td>${patient.id}</td>
						<td>${patient.userId}</td>
						<td>${patient.user.fullName}</td>
						<td>${patient.user.email}</td>
						<td>${patient.gender}</td>
						<td>${patient.bloodType}</td>
						<td>${new Date(patient.user.createdAt).toLocaleDateString('ar-EG')}</td>
						<td>
								<a href="EditePatient.html?id=${patient.id}" class="edit" title="تعديل" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>
								<a href="#" class="delete" title="حذف" data-toggle="tooltip" onclick="deletePatient(${patient.id})"><i class="material-icons">&#xE872;</i></a>
						</td>
				`;
        patientsTableBody.appendChild(row);
    });

    // عرض عدد المرضى المتطابقين
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedPatients.length}</b> من <b>${filteredPatients.length}</b> إدخالات`;

    // إعداد التقليب الجديد
    setupPagination(filteredPatients.length);
}

// وظيفة لتحديد العمود الذي سيتم البحث فيه
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    searchColumn = columnSelect.value;
    searchPatients(); // إعادة البحث عند تغيير العمود
}

// وظيفة لحذف المريض
async function deletePatient(patientId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا المريض؟");
    if (confirmDelete) {
        try {
            // حذف المريض من API
            const response = await fetch(`https://localhost:7219/api/PatientController/${patientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
            });

            if (response.ok) {
                // تحديث القائمة بعد الحذف
                patients = patients.filter(patient => patient.id !== patientId);
                displayPatients();
                setupPagination();
            }
        } catch (error) {
            console.error('خطأ في حذف المريض:', error);
            // console.log('خطأ في حذف المريض:');
        }
    }
}




//----------------------------------------
/*
function validateForm() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const dateOfBirth = document.getElementById('DateOfBirth').value;
    const gender = document.getElementById('gender').value;
    const bloodType = document.getElementById('bloodType').value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // إعادة تعيين رسائل الخطأ
    document.getElementById('fullNameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('confirmPasswordError').textContent = '';
    document.getElementById('DateOfBirthError').textContent = '';
    document.getElementById('error-message').style.display = "none";

    let isValid = true;

    if (!fullName) {
        document.getElementById('fullNameError').textContent = 'الاسم الكامل مطلوب!';
        isValid = false;
    }

    if (!email) {
        document.getElementById('emailError').textContent = 'البريد الإلكتروني مطلوب!';
        isValid = false;
    } else if (!emailPattern.test(email)) {
        document.getElementById('emailError').textContent = 'يرجى إدخال بريد إلكتروني صحيح.';
        isValid = false;
    }

    if (!password) {
        document.getElementById('passwordError').textContent = 'كلمة المرور مطلوبة!';
        isValid = false;
    }

    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'كلمات المرور غير متطابقة!';
        isValid = false;
    }

    if (!dateOfBirth) {
        document.getElementById('DateOfBirthError').textContent = 'تاريخ الميلاد مطلوب!';
        isValid = false;
    }

    if (!gender) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = 'يرجى اختيار الجنس.';
        isValid = false;
    }

    if (!bloodType) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = 'يرجى اختيار فصيلة الدم.';
        isValid = false;
    }

    return isValid;
}

async function addUser() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const dateOfBirth = document.getElementById('DateOfBirth').value;
    const gender = document.getElementById('gender').value;
    const bloodType = document.getElementById('bloodType').value;
    const role = 3;


    try {
        const response = await fetch('https://localhost:7219/api/Auth/register', {
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
        await addPatient(createdUser.id, dateOfBirth, gender, bloodType);
        window.location.href = './Patient.html';
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}

async function addPatient(userId, dateOfBirth, gender, bloodType) {
    try {
        const response = await fetch('https://localhost:7219/api/PatientController', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                userId,
                dateOfBirth,
                gender,
                bloodType
            })
        });

        if (!response.ok) {
            throw new Error('فشل إضافة المريض');
        }

        await response.json();
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}
*/






        function showLoading(isLoading) {
            document.getElementById('loading').style.display = isLoading ? 'flex' : 'none';
            document.getElementById('submitBtn').disabled = isLoading;
        }

        function showMessage(message, isError = true) {
            const messageBox = isError ?
                document.getElementById('error-message') :
                document.getElementById('success-message');

            messageBox.textContent = message;
            messageBox.style.display = 'block';

            if (!isError) {
                setTimeout(() => {
                    messageBox.style.display = 'none';
                }, 3000);
            }
        }

        function resetErrors() {
            document.querySelectorAll('.text-danger').forEach(el => {
                el.textContent = '';
            });
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
        }

        function validateForm() {
            resetErrors();

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const dateOfBirth = document.getElementById('DateOfBirth').value;
            const gender = document.getElementById('gender').value;
            const bloodType = document.getElementById('bloodType').value;
            const phoneNumber = document.getElementById('phoneNumber').value.trim();

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phonePattern = /^\d{9}$/;

            let isValid = true;

            if (!fullName) {
                document.getElementById('fullNameError').textContent = 'الاسم الكامل مطلوب';
                isValid = false;
            }

            if (!email) {
                document.getElementById('emailError').textContent = 'البريد الإلكتروني مطلوب';
                isValid = false;
            } else if (!emailPattern.test(email)) {
                document.getElementById('emailError').textContent = 'بريد إلكتروني غير صالح';
                isValid = false;
            }

            if (!password) {
                document.getElementById('passwordError').textContent = 'كلمة المرور مطلوبة';
                isValid = false;
            } else if (password.length < 6) {
                document.getElementById('passwordError').textContent = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
                isValid = false;
            }

            if (password !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'كلمة المرور غير متطابقة';
                isValid = false;
            }

            if (!dateOfBirth) {
                document.getElementById('DateOfBirthError').textContent = 'تاريخ الميلاد مطلوب';
                isValid = false;
            } else {
                const birthDate = new Date(dateOfBirth);
                const today = new Date();
                if (birthDate >= today) {
                    document.getElementById('DateOfBirthError').textContent = 'تاريخ الميلاد يجب أن يكون في الماضي';
                    isValid = false;
                }
            }

            if (!gender) {
                document.getElementById('genderError').textContent = 'الجنس مطلوب';
                isValid = false;
            }

            if (!bloodType) {
                document.getElementById('bloodTypeError').textContent = 'فصيلة الدم مطلوبة';
                isValid = false;
            }

            if (phoneNumber && !phonePattern.test(phoneNumber)) {
                document.getElementById('phoneError').textContent = 'رقم الهاتف يجب أن يبدأ بـ  ويتكون من 9 أرقام';
                isValid = false;
            }

            return isValid;
        }

        async function addUser() {
            if (!validateForm()) return;

            showLoading(true);

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const dateOfBirth = document.getElementById('DateOfBirth').value;
            const gender = document.getElementById('gender').value;
            const bloodType = document.getElementById('bloodType').value;
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            const role = 3; // Patient Role

            try {
                // 1. تسجيل المستخدم
                const userResponse = await fetch('https://localhost:7219/api/Auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        password,
                        role,
                        phoneNumber
                    })
                });

                if (!userResponse.ok) {
                    const errorData = await userResponse.json();
                    throw new Error(errorData.message || 'فشل في تسجيل المستخدم');
                }

                const userData = await userResponse.json();

                // 2. إضافة بيانات المريض
                const patientResponse = await fetch('https://localhost:7219/api/PatientController', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        userId: userData.id,
                        dateOfBirth,
                        gender,
                        bloodType
                    })
                });

                if (!patientResponse.ok) {
                    throw new Error('فشل في إضافة بيانات المريض');
                }

                showMessage('تم إضافة المريض بنجاح', false);
                setTimeout(() => {
                    window.location.href = './Patient.html';
                }, 1500);

            } catch (error) {
                showMessage(error.message);
                console.error('Error:', error);
            } finally {
                showLoading(false);
            }
        }
    



//----------------------------------------



async function loadUserData(patientId) {
    try {
        const response = await fetch(`https://localhost:7219/api/PatientController/${patientId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        if (!response.ok) throw new Error("فشل تحميل البيانات");

        const data = await response.json();
        if (!data.user) throw new Error("بيانات المستخدم غير موجودة");

        document.getElementById("fullName").value = data.user.fullName;
        document.getElementById("email").value = data.user.email;
        document.getElementById("DateOfBirth").value = data.dateOfBirth.split("T")[0];
        document.getElementById("gender").value = data.gender;
        document.getElementById("bloodType").value = data.bloodType;
    } catch (error) {
        showError(error.message);
    }
}

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
            const errorText = await response.text();
            throw new Error(errorText || 'فشل تحديث المستخدم');
        }

        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

async function updatePatient() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const dateOfBirth = document.getElementById('DateOfBirth').value;
    const gender = document.getElementById('gender').value;
    const bloodType = document.getElementById('bloodType').value;



    try {
        const response = await fetch(`https://localhost:7219/api/PatientController/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                dateOfBirth,
                gender,
                bloodType
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "فشل تعديل بيانات المريض");
        }

        const updatedPatient = await response.json();
        const userUpdated = await updateUser(updatedPatient.userId, fullName, email, 2);

        if (userUpdated) {
            alert("تم تعديل البيانات بنجاح");
            window.location.href = './Patient.html';
        }

    } catch (error) {
        showError(error.message);
    }
}
