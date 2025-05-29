let medications = [];
let currentPage = 1;
const itemsPerPage = 5;



async function fetchMedications() {
    try {
        const response = await fetch('https://localhost:7219/api/Medication/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        medications = await response.json();
        displayMedications(medications);
        setupPagination(medications);
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

function displayMedications(data) {
    const medicationTableBody = document.getElementById('medicationTableBody');
    medicationTableBody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedMedications = data.slice(start, end);

    paginatedMedications.forEach(medication => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${medication.id}</td>
                    <td>${medication.name}</td>
                    <td>${medication.description}</td>
                    <td>${medication.dosageForm}</td>
                    <td>${medication.strength}</td>
                    <td>${medication.prescriptionItems.length}</td>
                    <td>
                   
                                        <a href="#" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <button class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deleteMedication(${medication.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="EditMedication.html?id=${medication.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>

                
                    </td>
                `;
        medicationTableBody.appendChild(row);
    });

    document.getElementById('hintText').innerHTML = `عرض <b>${paginatedMedications.length}</b> من <b>${data.length}</b> إدخالات`;
}

function setupPagination(data) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(data.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a href="#" class="page-link" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageItem);
    }
}

function changePage(page) {
    currentPage = page;
    const searchInput = document.getElementById('searchInput').value.trim();
    const filteredData = searchInput ? filterMedications(searchInput) : medications;
    displayMedications(filteredData);
    setupPagination(filteredData);
}

async function deleteMedication(medicationId) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا الدواء؟");
    if (confirmDelete) {
        try {
            const response = await fetch(`https://localhost:7219/api/Medication/${medicationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (response.ok) {
                medications = medications.filter(med => med.id !== medicationId);
                const searchInput = document.getElementById('searchInput').value.trim();
                const filteredData = searchInput ? filterMedications(searchInput) : medications;
                displayMedications(filteredData);
                setupPagination(filteredData);
            }
        } catch (error) {
            console.error('خطأ في حذف الدواء:', error);
        }
    }
}

function searchMedications() {
    currentPage = 1;
    const searchInput = document.getElementById('searchInput').value.trim();
    const filteredData = searchInput ? filterMedications(searchInput) : medications;
    displayMedications(filteredData);
    setupPagination(filteredData);
}

function filterMedications(searchInput) {
    const lowerInput = searchInput.toLowerCase();
    const column = document.getElementById('searchColumn').value;

    return medications.filter(medication => {
        switch (column) {
            case 'id':
                return medication.id.toString().toLowerCase().includes(lowerInput);
            case 'name':
                return medication.name.toLowerCase().includes(lowerInput);
            case 'description':
                return medication.description.toLowerCase().includes(lowerInput);
            case 'dosageForm':
                return medication.dosageForm.toLowerCase().includes(lowerInput);
            case 'strength':
                return medication.strength.toLowerCase().includes(lowerInput);
            case 'prescriptionItems':
                return medication.prescriptionItems.length.toString().toLowerCase().includes(lowerInput);
            case 'all':
            default:
                return (
                    medication.id.toString().toLowerCase().includes(lowerInput) ||
                    medication.name.toLowerCase().includes(lowerInput) ||
                    medication.description.toLowerCase().includes(lowerInput) ||
                    medication.dosageForm.toLowerCase().includes(lowerInput) ||
                    medication.strength.toLowerCase().includes(lowerInput) ||
                    medication.prescriptionItems.length.toString().toLowerCase().includes(lowerInput)
                );
        }
    });
}


//-------------------------------------




async function addMedication() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const dosageForm = document.getElementById('dosageForm').value;
    const strength = document.getElementById('strength').value;

    if (!validateForm()) {
        return;
    }

    try {
        const response = await fetch('https://localhost:7219/api/Medication/CreateMedication', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                name,
                description,
                dosageForm,
                strength
            })
        });

        if (!response.ok) {
            throw new Error('فشل في إضافة الدواء');
        }

        alert('تمت إضافة الدواء بنجاح!');
        window.location.href = 'Medications.html';
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}

//-------------------------------------


async function updateMedication() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const dosageForm = document.getElementById('dosageForm').value;
    const strength = document.getElementById('strength').value;

    if (!validateForm()) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7219/api/Medication/${medicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                id: medicationId,
                name,
                description,
                dosageForm,
                strength
            })
        });

        if (!response.ok) {
            throw new Error('فشل في تعديل الدواء');
        }

        alert('تم تعديل الدواء بنجاح!');
        window.location.href = 'Medications.html';
    } catch (error) {
        document.getElementById('error-message').style.display = "block";
        document.getElementById('error-message').textContent = error.message;
    }
}
