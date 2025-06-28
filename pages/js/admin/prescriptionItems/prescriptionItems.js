let prescriptionItems = [];
let currentPage = 1;
const itemsPerPage = 5;


async function fetchPrescriptionItems() {

    try {
        const response = await fetch('https://localhost:7219/api/PrescriptionItem/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        prescriptionItems = await response.json();

        /*   // تحضير أسماء المساعدة للبحث
        prescriptionItems.forEach(item => {
        		item.medicationName = item.medication.name;
        });*/

        displayPrescriptionItems(prescriptionItems);
        setupPagination(prescriptionItems);
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

function displayPrescriptionItems(data) {
    const tableBody = document.getElementById('prescriptionItemTableBody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = data.slice(start, end);
    //<td>${item.medication?.name || '—'}</td>
    paginated.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
						<td>${item.id}</td>
						<td>${item.prescriptionId}</td>
						<td>${item.medicationId}</td>
						<td>${item.medication == null ? item.customMedicationName: item.medication.name}</td>

						<td>${item.dosage}</td>
						<td>${item.frequency}</td>
						<td>${item.duration}</td>
						<td>

                            <a href="DetailsPrescriptionItem.html?id=${item.id}" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <button class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deletePrescriptionItem(${item.id})" title="حذف"><i class="fas fa-trash"></i></button>
								<a href="EditPrescriptionItem.html?id=${item.id}"  class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>

						</td>
				`;
        tableBody.appendChild(row);
    });

    document.getElementById('hintText').innerHTML = `عرض <b>${paginated.length}</b> من <b>${data.length}</b> إدخالات`;
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
    const filtered = searchInput ? filterPrescriptionItems(searchInput) : prescriptionItems;
    displayPrescriptionItems(filtered);
    setupPagination(filtered);
}

async function deletePrescriptionItem(id) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا السجل؟");
    if (confirmDelete) {
        try {
            const response = await fetch(`https://localhost:7219/api/PrescriptionItem/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (response.ok) {
                prescriptionItems = prescriptionItems.filter(r => r.id !== id);
                const searchInput = document.getElementById('searchInput').value.trim();
                const filtered = searchInput ? filterPrescriptionItems(searchInput) : prescriptionItems;
                displayPrescriptionItems(filtered);
                setupPagination(filtered);
            }
        } catch (error) {
            console.error('خطأ في حذف السجل:', error);
        }
    }
}

function searchPrescriptionItems() {
    currentPage = 1;
    const searchInput = document.getElementById('searchInput').value.trim();
    const filtered = searchInput ? filterPrescriptionItems(searchInput) : prescriptionItems;
    displayPrescriptionItems(filtered);
    setupPagination(filtered);
}

function filterPrescriptionItems(searchInput) {
    const lowerInput = searchInput.toLowerCase();
    const column = document.getElementById('searchColumn').value;

    return prescriptionItems.filter(item => {
        switch (column) {
            case 'id':
                return item.id.toString().includes(lowerInput);
            case 'prescriptionId':
                return item.prescriptionId.toString().includes(lowerInput);
            case 'medicationName':
                return item.medicationName.toLowerCase().includes(lowerInput);
            case 'dosage':
                return item.dosage.toLowerCase().includes(lowerInput);
            case 'quantity':
                return item.quantity.toString().includes(lowerInput);
            case 'all':
            default:
                return (
                    item.id.toString().includes(lowerInput) ||
                    item.prescriptionId.toString().includes(lowerInput) ||
                    item.medicationName.toLowerCase().includes(lowerInput) ||
                    item.dosage.toLowerCase().includes(lowerInput) ||
                    item.quantity.toString().includes(lowerInput)
                );
        }
    });
}