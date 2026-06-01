let users = [];
let currentPage = 1;
const usersPerPage = 5;
let searchColumn = 'fullName'; // العمود الافتراضي للبحث

$(document).ready(function() {
    fetchUsers();
});

// ✅ وظيفة لجلب بيانات المستخدمين من API باستخدام fetchWithAuth
async function fetchUsers() {
    try {
        
        const response = await fetchWithAuth('https://localhost:7219/api/User/All', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        
        users = await response.json();
        displayUsers();
        setupPagination();
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        showError('حدث خطأ أثناء جلب بيانات المستخدمين');
    }
}

// وظيفة لعرض بيانات المستخدمين في الجدول
function displayUsers() {
    const userTableBody = document.getElementById('userTableBody');
    if (!userTableBody) return;
    
    userTableBody.innerHTML = ''; // مسح المحتوى السابق

    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = users.slice(start, end);

    paginatedUsers.forEach(user => {
        let roleName = "";

        switch (user.role) {
            case 1:
                roleName = "مدير النظام";
                break;
            case 2:
                roleName = "طبيب";
                break;
            case 3: 
                roleName = "مريض";
                break;
            case 4: 
                roleName = "صيدلي";
                break;
            default:
                roleName = "غير معروف";
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${roleName}</td>
            <td>${user.createdAt}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deleteUser(${user.id})" title="حذف"><i class="fas fa-trash"></i></button>
                <a href="EditUser.html?id=${user.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    // عرض عدد المستخدمين
    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedUsers.length}</b> من <b>${users.length}</b> إدخالات`;
    }
}

// وظيفة لإعداد التقليب
function setupPagination(totalPages = null) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = ''; // مسح المحتوى السابق

    const pages = totalPages || Math.ceil(users.length / usersPerPage);

    for (let i = 1; i <= pages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="changePage(${i})">${i}</button>`;
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
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase();
    
    const filteredUsers = users.filter(user => {
        if (searchColumn == "role") {
            let roleName = "";
            switch (user.role) {
                case 1: roleName = "مدير النظام"; break;
                case 2: roleName = "طبيب"; break;
                case 3: roleName = "مريض"; break;
                case 4: roleName = "صيدلي"; break;
                default: roleName = "";
            }
            return roleName.toLowerCase().includes(searchValue);
        }
        return user[searchColumn] && user[searchColumn].toLowerCase().includes(searchValue);
    });
    
    const userTableBody = document.getElementById('userTableBody');
    if (!userTableBody) return;
    
    userTableBody.innerHTML = '';
    currentPage = 1;
    
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    paginatedUsers.forEach(user => {
        let roleName = "";
        switch (user.role) {
            case 1: roleName = "مدير النظام"; break;
            case 2: roleName = "طبيب"; break;
            case 3: roleName = "مريض"; break;
            case 4: roleName = "صيدلي"; break;
            default: roleName = "";
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${roleName}</td>
            <td>${user.createdAt}</td>
            <td>
                <button class="btn btn-danger btn-action" onclick="deleteUser(${user.id})" title="حذف"><i class="fas fa-trash"></i></button>
                <a href="EditUser.html?id=${user.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    // عرض عدد المستخدمين المتطابقين
    const hintText = document.getElementById('hintText');
    if (hintText) {
        hintText.innerHTML = `عرض <b>${paginatedUsers.length}</b> من <b>${filteredUsers.length}</b> إدخالات`;
    }

    // إعداد التقليب الجديد
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    setupPagination(totalPages);
}

// وظيفة لتحديد العمود الذي سيتم البحث فيه
function changeSearchColumn() {
    const columnSelect = document.getElementById('columnSelect');
    if (columnSelect) {
        searchColumn = columnSelect.value;
        searchUsers();
    }
}

// ✅ وظيفة لحذف المستخدم (معدلة)
async function deleteUser(userId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟");
    if (confirmDelete) {
        try {
            const response = await fetchWithAuth(`https://localhost:7219/api/User/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // تحديث القائمة بعد الحذف
                users = users.filter(user => user.id !== userId);
                displayUsers();
                setupPagination();
                showSuccess('تم حذف المستخدم بنجاح');
            } else {
                throw new Error('فشل الحذف');
            }
        } catch (error) {
            console.error('خطأ في حذف المستخدم:', error);
            showError('حدث خطأ أثناء حذف المستخدم');
        }
    }
}

// ✅ وظيفة تحديث المستخدم (معدلة)
async function updateUser() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const role = document.getElementById('role')?.value;

    if (!validateForm()) {
        return;
    }

    const userData = {
        fullName,
        email,
        role: parseInt(role)
    };

    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/User/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('فشل التحديث');
        }

        // تحديث ناجح: إعادة توجيه إلى صفحة المستخدمين
        window.location.href = 'User.html';
    } catch (error) {
        console.error('خطأ في التحديث:', error);
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.style.display = "block";
            errorMsg.textContent = error.message;
        }
    }
}

// ✅ وظيفة إضافة مستخدم (معدلة)
async function addUser() {
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const role = document.getElementById('role')?.value;

    if (!validateForm()) {
        return;
    }

    if (password !== confirmPassword) {
        showError('كلمة المرور غير متطابقة');
        return;
    }

    const roleNumber = parseInt(role);

    try {
        const response = await fetchWithAuth('https://localhost:7219/api/User', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                role: roleNumber
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'فشل التسجيل');
        }

        window.location.href = 'User.html';
    } catch (error) {
        console.error('خطأ في الإضافة:', error);
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.style.display = "block";
            errorMsg.textContent = error.message;
        }
    }
}

// ✅ وظيفة تحميل بيانات المستخدم للتعديل
async function loadUserData(userId) {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/User/${userId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب بيانات المستخدم');
        }
        
        const user = await response.json();
        
        const userIdField = document.getElementById('userId');
        const fullNameField = document.getElementById('fullName');
        const emailField = document.getElementById('email');
        const roleField = document.getElementById('role');
        
        if (userIdField) userIdField.value = userId;
        if (fullNameField) fullNameField.value = user.fullName || '';
        if (emailField) emailField.value = user.email || '';
        if (roleField) roleField.value = user.role || '';
        
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        showError('حدث خطأ أثناء تحميل بيانات المستخدم');
    }
}

// ✅ دوال مساعدة
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

function showLoading(show) {
    const btn = document.getElementById('updateBtn') || document.getElementById('addBtn');
    if (btn) {
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '<div class="loading-spinner"></div> جاري المعالجة...';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.id === 'updateBtn' ? '<i class="fas fa-save me-2"></i>تحديث' : '<i class="fas fa-plus me-2"></i>إضافة';
        }
    }
}