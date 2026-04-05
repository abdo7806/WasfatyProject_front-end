<div align="center">

# 🏥 Wasfaty System | نظام وصفتي الإلكتروني
### Integrated Digital Platform for Prescription Management (Web & Mobile)
### المنصة الرقمية المتكاملة لإدارة الوصفات الطبية (الويب والموبايل)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)

</div>

---

## 📖 Overview | نظرة عامة
| English | العربية |
| :--- | :--- |
| **Wasfaty System** is a sophisticated technical solution aimed at automating the entire prescription lifecycle. Built with **Clean Architecture** principles to ensure scalability and security across Web and Mobile platforms. | **نظام وصفتي** هو حل تقني متطور يهدف إلى أتمتة دورة حياة الوصفة الطبية بالكامل. تم بناؤه باستخدام مبادئ **Clean Architecture** لضمان قابلية التوسع والأمان عبر منصات الويب والموبايل. |

---

## ✨ Key Features | المميزات الرئيسية
| Feature | الميزة |
| :--- | :--- |
| 🛡️ **Role-Based Security:** Strict access control via JWT for Admins, Doctors, Pharmacists, and Patients. | 🛡️ **صلاحيات محكمة:** تحكم دقيق في الوصول عبر JWT للمدراء، الأطباء، الصيادلة، والمرضى. |
| 📄 **Automated PDF:** One-click professional prescription generation with QR support. | 📄 **تقارير PDF:** إنشاء وصفات طبية احترافية بضغطة زر مع دعم رموز QR. |
| 📱 **Cross-Platform:** Seamless experience between Bootstrap web interface and Flutter mobile app. | 📱 **متعدد المنصات:** تجربة متكاملة بين واجهة الويب وتطبيق الموبايل. |
| ⚡ **Optimization:** Fast data fetching and efficient state management. | ⚡ **السرعة:** استجابة سريعة للبيانات وإدارة فعالة لحالة النظام. |

---

## 🛠 Tech Stack | التقنيات المستخدمة

| Category | Tools / التقنيات |
| :--- | :--- |
| **Front-End (Web)** | HTML5, CSS3, JavaScript (ES6+), **Bootstrap 5** |
| **Mobile App** | **Flutter**, Dart |
| **Back-End API** | **ASP.NET Core**, Entity Framework |
| **Database** | SQL Server |
| **Security** | JWT (JSON Web Tokens) |

---

## 🔐 Permissions Matrix | مصفوفة الصلاحيات

| Action / الإجراء | 👑 Admin | 👨‍⚕️ Doctor | 💊 Pharmacist | 👤 Patient |
| :--- | :---: | :---: | :---: | :---: |
| Manage Users & Entities / إدارة النظام | ✅ | ❌ | ❌ | ❌ |
| Issue New Prescriptions / إنشاء وصفة | ✅ | ✅ | ❌ | ❌ |
| Dispense Medications / صرف الأدوية | ✅ | ❌ | ✅ | ❌ |
| View Medical History / عرض السجل | ❌ | ✅ | ✅ | ✅ |

---

## 📂 Project Structure | هيكل المشروع

```text
Wasfaty-FrontEnd/
├── pages/
│   ├── auth/         # Login & Register System
│   ├── admin/        # Dashboard, Users & Medications Manage
│   ├── doctor/       # Patient Lists & Prescription Creation
│   ├── pharmacist/   # Pending Prescriptions & Dispensing logic
│   └── patient/      # Personal Profile & PDF Export
├── js/               # Core Logic (Auth, API Helpers, Role Handlers)
├── css/              # Custom Styles & Theme Overrides
└── images/           # Assets & UI Screenshots
```
-----
## 📸 System Screenshots | واجهات النظام

---

### 1️⃣ Essential Screens | الصور العامة

| Login Screen | Register Screen | Access Denied (403) |
| :---: | :---: | :---: |
| ![Login](images/screenshots/Login.png) | ![Register](images/screenshots/Register.png) | ![403 Error](images/screenshots/AccessDenied.png) |
| *Login interface with fields and responsive design* | *New patient registration form* | *Permission protection system* |
| *واجهة تسجيل الدخول مع الحقول والتصميم المتجاوب* | *إنشاء حساب جديد للمريض* | *نظام حماية الصلاحيات* |

---

### 2️⃣ Admin Dashboard | واجهات المدير

| Main Dashboard | Users List | Add New User |
| :---: | :---: | :---: |
| ![Admin Dashboard](images/screenshots/admin-dashboard.png) | ![Users List](images/screenshots/users-list.png) | ![Add User](images/screenshots/add-user.png) |
| *Statistics and charts overview* | *Users table with edit/delete buttons* | *Add user form with role selection* |
| *الإحصائيات والرسوم البيانية* | *جدول المستخدمين + أزرار التعديل والحذف* | *نموذج إضافة مستخدم وتحديد دوره* |

| Medications Management | Pharmacy Details |
| :---: | :---: |
| ![Medications Manage](images/screenshots/medications-manage.png) | ![Pharmacy Details](images/screenshots/pharmacy-details.png) |
| *Medications CRUD screen* | *Pharmacy details with pharmacists list* |
| *شاشة إدارة الأدوية (CRUD)* | *تفاصيل الصيدلية + قائمة الصيادلة* |

---

### 3️⃣ Doctor Dashboard | واجهات الطبيب

| Doctor Dashboard | Patients List | Create Prescription |
| :---: | :---: | :---: |
| ![Doctor Dashboard](images/screenshots/doctor-dashboard.png) | ![Patients List](images/screenshots/patients-list.png) | ![Create Prescription](images/screenshots/create-prescription.png) |
| *Patients and prescriptions summary* | *List of patients under the doctor* | *Select medication and dosage for patient* |
| *ملخص عدد المرضى والوصفات* | *قائمة المرضى التابعين للطبيب* | *اختيار الدواء والجرعة للمريض* |

| Prescription View |
| :---: |
| ![Prescription View](images/screenshots/prescription-view.png) |
| *Prescription details before dispensing* |
| *الوصفة بعد إنشائها وقبل صرفها* |

---

### 4️⃣ Pharmacist Dashboard | واجهات الصيدلي

| Pending Prescriptions | Dispense Confirmation | Dispense Success |
| :---: | :---: | :---: |
| ![Pending Prescriptions](images/screenshots/pending-prescriptions.png) | ![Dispense Confirm](images/screenshots/dispense-confirm.png) | ![Dispense Success](images/screenshots/dispense-success.png) |
| *List of prescriptions waiting to be dispensed* | *Dispense confirmation dialog/page* | *Success message after dispensing* |
| *قائمة الوصفات التي تنتظر الصرف* | *نافذة تأكيد عملية الصرف* | *رسالة نجاح بعد الصرف* |

---

### 5️⃣ Patient Dashboard | واجهات المريض

| Patient Dashboard | My Prescriptions | Download Prescription PDF |
| :---: | :---: | :---: |
| ![Patient Dashboard](images/screenshots/patient-dashboard.png) | ![My Prescriptions](images/screenshots/my-prescriptions.png) | ![Prescription PDF](images/screenshots/prescription-pdf.png) |
| *Recent medications and prescriptions* | *Prescriptions list (dispensed/pending)* | *Generated PDF file preview* |
| *آخر الأدوية والوصفات* | *الوصفات (مصروفة/معلقة)* | *ملف PDF الناتج عن التحميل* |

| Edit Profile |
| :---: |
| ![Edit Profile](images/screenshots/edit-profile.png) |
| *Personal information and blood type update* |
| *تحديث البيانات الشخصية وفصيلة الدم* |



-----

## 🚀 Installation & Setup | كيفية التشغيل

| Step | Action / الإجراء |
| :--- | :--- |
| 1️⃣ **Clone** | `git clone https://github.com/abdo7806/WasfatyProject_front-end.git` |
| 2️⃣ **Configure** | Update **API_BASE_URL** in `js/config.js` |
| 3️⃣ **Launch** | Open `pages/auth/login.html` with **Live Server** |
-----


## 🔗 Connected Repositories | المشاريع المرتبطة
* **⚙️ Back-End API:** [View Repo](https://github.com/abdo7806/WasfatyProject.git)
* **📱 Mobile App:** [View Repo](https://github.com/abdo7806/Wasti-Mobile-Project.git)

---
## 👨‍💻 Developer | المطور

<table align="center">
  <tr>
    <td align="center" width="150">
      <img src="https://github.com/abdo7806.png" width="120" style="border-radius: 50%; border: 2px solid #512BD4;" alt="Abdulsalam AL-Dhahabi"/>
      <br />
      <b>Abdulsalam AL-Dhahabi</b>
    </td>
    <td>
      <p><b>Software Engineer / Full-Stack Developer</b></p>
      <p>Passionate about building scalable digital solutions with a focus on Clean Code. <br> مطور شغوف ببناء حلول برمجية متكاملة وقابلة للتوسع مع التركيز على جودة الكود.</p>
      <p>
        <a href="mailto:balzhaby26@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white" /></a>
        <a href="https://linkedin.com/in/abdulsalam-al-dhahabi-218887312"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white" /></a>
        <a href="https://github.com/abdo7806"><img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white" /></a>
      </p>
    </td>
  </tr>
</table>

<div align="center">
  ⭐ <b>Don't forget to star the repo if you find it helpful!</b> ⭐
</div>
