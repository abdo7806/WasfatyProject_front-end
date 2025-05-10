let dispenseRecords = [];
let currentPage = 1;
const itemsPerPage = 5;



async function fetchDispenseRecords() {
    try {
        const response = await fetch('https://localhost:7219/api/DispenseRecord/All', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        dispenseRecords = await response.json();
        displayDispenseRecords(dispenseRecords);
        setupPagination(dispenseRecords);
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
    }
}

function displayDispenseRecords(data) {
    const tableBody = document.getElementById('dispenseTableBody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = data.slice(start, end);

    paginated.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
<td>${record.id}</td>
<td>${record.prescriptionId}</td>
<td>${record.pharmacistId}</td>
<td>${record.pharmacist?.user?.fullName || '—'}</td>
<td>${record.pharmacyId}</td>
<td>${record.pharmacy?.name || '—'}</td>
<td>${record.prescription?.doctorId || '—'}</td>
<td>${record.prescription?.doctor?.user?.fullName || '—'}</td>
<td>${record.prescription?.patientId || '—'}</td>
<td>${record.prescription?.patient?.user?.fullName || '—'}</td>
<td>${new Date(record.dispensedDate).toLocaleString()}</td>
<td>


                <a href="DetailsDispenseRecord.html?id=${record.id}" class="btn btn-info btn-action" title="عرض"><i class="fas fa-eye"></i></a>
                <a href="#" class="btn btn-danger btn-action" data-toggle="tooltip" onclick="deleteDispenseRecord(${record.id})" title="حذف"><i class="fas fa-trash"></i></a>
								<a href="EditDispenseRecord.html?id=${record.id}" class="btn btn-primary btn-action" title="تعديل"><i class="fas fa-edit"></i></a>
                           

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
    const filtered = searchInput ? filterDispenseRecords(searchInput) : dispenseRecords;
    displayDispenseRecords(filtered);
    setupPagination(filtered);
}

async function deleteDispenseRecord(id) {
    const confirmDelete = confirm("هل أنت متأكد أنك تريد حذف هذا السجل؟");
    if (confirmDelete) {
        try {
            const response = await fetch(`https://localhost:7219/api/DispenseRecord/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            if (response.ok) {
                dispenseRecords = dispenseRecords.filter(r => r.id !== id);
                const searchInput = document.getElementById('searchInput').value.trim();
                const filtered = searchInput ? filterDispenseRecords(searchInput) : dispenseRecords;
                displayDispenseRecords(filtered);
                setupPagination(filtered);
            }
        } catch (error) {
            console.error('خطأ في حذف السجل:', error);
        }
    }
}

function searchDispenseRecords() {
    currentPage = 1;
    const searchInput = document.getElementById('searchInput').value.trim();
    const filtered = searchInput ? filterDispenseRecords(searchInput) : dispenseRecords;
    displayDispenseRecords(filtered);
    setupPagination(filtered);
}

function filterDispenseRecords(searchInput) {
    const lowerInput = searchInput.toLowerCase();
    const column = document.getElementById('searchColumn').value;

    return dispenseRecords.filter(record => {
        switch (column) {
            case 'id':
                return record.id.toString().includes(lowerInput);
            case 'prescriptionId':
                return record.prescriptionId.toString().includes(lowerInput);
            case 'pharmacistName':
                return record.pharmacistName.toLowerCase().includes(lowerInput);
            case 'pharmacyName':
                return record.pharmacyName.toLowerCase().includes(lowerInput);
            case 'dispensedDate':
                return new Date(record.dispensedDate).toLocaleDateString().includes(lowerInput);
            case 'totalItems':
                return record.totalItems.toString().includes(lowerInput);
            case 'all':
            default:
                return (
                    record.id.toString().includes(lowerInput) ||
                    record.prescriptionId.toString().includes(lowerInput) ||
                    record.pharmacistName.toLowerCase().includes(lowerInput) ||
                    record.pharmacyName.toLowerCase().includes(lowerInput) ||
                    new Date(record.dispensedDate).toLocaleDateString().includes(lowerInput) ||
                    record.totalItems.toString().includes(lowerInput)
                );
        }
    });
}