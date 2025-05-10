// shared/loadComponents.js
// shared-components.js
const sidebarHTML = `

<nav class="pc-sidebar">
<div class="navbar-wrapper">
		<div class="m-header">
				<a href="dashboard/index.html" class="b-brand text-primary">
						<img src="assets/images/logo-dark.svg" class="img-fluid logo-lg" alt="شعار">
				</a>
		</div>
		<div class="navbar-content">
				<ul class="pc-navbar">
						<li class="pc-item">
								<a href="./Users/User.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-tachometer-alt"></i></span>
										<span class="pc-mtext">المستخدمون</span>
								</a>
						</li>

						<li class="pc-item pc-caption">
								<label>مكونات واجهة المستخدم</label>
						</li>

						<li class="pc-item">
								<a href=".//Doctor/Doctors.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-user-md"></i></span>
										<!-- أيقونة الأطباء -->
										<span class="pc-mtext">الأطباء</span>
								</a>
						</li>
						<li class="pc-item">
								<a href=".//Patients/Patient.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-procedures"></i></span>
										<!-- أيقونة المرضى -->
										<span class="pc-mtext">المرضى</span>
								</a>
						</li>

						<li class="pc-item">
								<a href=".//Pharmacy/Pharmacys.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-medkit"></i></span>
										<!-- أيقونة الصيدليات -->
										<span class="pc-mtext">الصيدليات</span>
								</a>
						</li>

						<li class="pc-item">
								<a href=".//MedicalCenter/MedicalCenters.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-hospital"></i></span>
										<!-- أيقونة المراكز الطبية -->
										<span class="pc-mtext">المراكز الطبية</span>
								</a>
						</li>
						<li class="pc-item">
								<a href=".//Pharmacist/Pharmacists.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-user"></i></span>
										<!-- أيقونة الصيادلة -->
										<span class="pc-mtext">الصيادلة</span>
								</a>
						</li>

						<li class="pc-item">
								<a href=".//Medication/Medications.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-pills"></i></span>
										<!-- أيقونة الأدوية -->
										<span class="pc-mtext">الأدوية</span>
								</a>
						</li>

						<li class="pc-item">
								<a href=".//Prescription/Prescriptions.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-file-medical"></i></span>
										<!-- أيقونة الوصفات الطبية -->
										<span class="pc-mtext">الوصفات الطبية</span>
								</a>
						</li>

						<li class="pc-item">
								<a href=".//PrescriptionItem/PrescriptionItems.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-list"></i></span>
										<!-- أيقونة عناصر الوصفة -->
										<span class="pc-mtext">عناصر الوصفة</span>
								</a>
						</li>

						<li class="pc-item">
								<a href=".//DispenseRecord/DispenseRecords.html" class="pc-link">
										<span class="pc-micon"><i class="fas fa-clipboard-list"></i></span>
										<!-- أيقونة سجلات الصرف -->
										<span class="pc-mtext">سجلات الصرف</span>
								</a>
						</li>

				</ul>

		</div>
</div>
</nav>
`;

function loadSidebar() {
    const sidebarContainer = document.getElementById('nav');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarHTML;
        // highlightCurrentPage();
    }
}

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.pc-link').forEach(link => {
        if (link.getAttribute('href').includes(currentPage)) {
            link.parentElement.classList.add('active');
        }
    });
}

// تحميل تلقائي عند استيراد الملف
document.addEventListener('DOMContentLoaded', loadSidebar);
// استخدامها في كل صفحة
document.addEventListener('DOMContentLoaded', () => {
    //loadComponent('header', 'header-container');
    // loadComponent('footer', 'footer-container');

    loadSidebar();
});