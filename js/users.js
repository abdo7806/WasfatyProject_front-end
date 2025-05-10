let users = [];
let currentPage = 1;
const usersPerPage = 5;
let searchColumn = 'fullName'; // العمود الافتراضي للبحث

$(document).ready(function() {
    fetchUsers();
});

// وظيفة لجلب بيانات المستخدمين من API
async function fetchUsers() {
    try {
        const response = await fetch('https://localhost:7219/api/User/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        users = await response.json();
        displayUsers();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

// وظيفة لعرض بيانات المستخدمين في الجدول
function displayUsers() {
    const userTableBody = document.getElementById('userTableBody');
    userTableBody.innerHTML = ''; // مسح المحتوى السابق

    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = users.slice(start, end);

    paginatedUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
						<td>${user.id}</td>
						<td>${user.fullName}</td>
						<td>${user.email}</td>
						<td>${user.role}</td>
						<td>${user.createdAt}</td>
						<td>

                                              
                <a href="#" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <a href="#" class="btn btn-danger btn-action" onclick="deleteUser(${user.id})" title="حذف"><i class="fas fa-trash"></i></a>
								<a href="EditeUser.html?id=${user.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
                                                    
                </td>

				`;
        userTableBody.appendChild(row);
    });

    // عرض عدد المستخدمين
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedUsers.length}</b> من <b>${users.length}</b> إدخالات`;
}

// وظيفة لإعداد التقليب
function setupPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // مسح المحتوى السابق

    const totalPages = Math.ceil(users.length / usersPerPage);

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
    displayUsers();
    setupPagination();
}

// وظيفة للبحث عن المستخدمين حسب العمود المحدد
function searchUsers() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredUsers = users.filter(user => {
        return user[searchColumn].toLowerCase().includes(searchInput);
    });

    const userTableBody = document.getElementById('userTableBody');
    userTableBody.innerHTML = '';

    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);


    paginatedUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
						<td>${user.id}</td>
						<td>${user.fullName}</td>
						<td>${user.email}</td>
						<td>${user.role}</td>
						<td>${user.createdAt}</td>
						<td>
								<a href="EditeUser.html?id=${user.id}" class="edit" title="تعديل" data-toggle="tooltip"><i class="material-icons">&#xE254;</i></a>
								<a href="#" class="delete" title="حذف" data-toggle="tooltip" onclick="deleteUser(${user.id})"><i class="material-icons">&#xE872;</i></a>                    </td>
						</td>
				`;
        userTableBody.appendChild(row);
    });

    // عرض عدد المستخدمين المتطابقين
    const hintText = document.getElementById('hintText');
    hintText.innerHTML = `عرض <b>${paginatedUsers.length}</b> من <b>${filteredUsers.length}</b> إدخالات`;

    // إعداد التقليب الجديد
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    setupPagination(totalPages);
}

// وظيفة لتحديد العمود الذي سيتم البحث فيه
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    searchColumn = columnSelect.value;
    searchUsers(); // إعادة البحث عند تغيير العمود
}

// وظيفة لحذف المستخدم
async function deleteUser(userId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟");
    if (confirmDelete) {
        try {
            // حذف المستخدم من API
            const response = await fetch(`https://localhost:7219/api/User/${userId}`, {
                method: 'DELETE',

                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }

            });



            if (response.ok) {
                // تحديث القائمة بعد الحذف
                users = users.filter(user => user.id !== userId);
                displayUsers();
                setupPagination();
            }
        } catch (error) {
            console.error('خطأ في حذف المستخدم:', error);
        }
    }
}



async function updateUser() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id'); // الحصول على القيمة المرتبطة بمفتاح 'id'
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;

    if (!validateForm()) {
        return;
    }

    // بناء جسم الطلب
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
            throw new Error('فشل التحديث');
        }

        // تحديث ناجح: إعادة توجيه إلى صفحة المستخدمين
        window.location.href = 'User.html';
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}



async function addUser() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    if (!validateForm()) {
        return;
    }


    // تحويل role إلى رقم
    const roleNumber = parseInt(role);

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
                role: roleNumber // استخدام الرقم هنا
            })
        });

        if (!response.ok) {
            throw new Error('فشل التسجيل');
        }






        // تسجيل ناجح: إعادة توجيه إلى صفحة تسجيل الدخول
        window.location.href = 'User.html';
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}