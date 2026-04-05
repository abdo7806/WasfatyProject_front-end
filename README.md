
-----

````markdown
<div align="center">

# 🏥 Wasfaty System | نظام وصفتي الإلكتروني
### المنصة الرقمية المتكاملة لإدارة الوصفات الطبية (Web & Mobile)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)

</div>

---

## 📖 نظرة عامة عن المشروع
**نظام وصفتي** هو حل تقني متطور يهدف إلى أتمتة دورة حياة الوصفة الطبية بالكامل. يربط النظام بين المؤسسات الصحية (مراكز طبية وصيدليات) وبين الكادر الطبي والمرضى، لضمان صرف الأدوية بدقة وتتبع التاريخ المرضي بشكل آمن وموثوق.

---

## 🛠 التقنيات المستخدمة (Tech Stack)

### **واجهة الويب (Front-End Web)**
* **اللغات الأساسية:** HTML5, CSS3, JavaScript (ES6+).
* **إطار التصميم:** **Bootstrap 5** لضمان واجهات متجاوبة (Responsive) وجذابة.
* **الربط البرمجي:** **Fetch API** للتواصل اللحظي مع الـ Back-End.
* **الحماية:** نظام صلاحيات محكم يعتمد على **JWT (JSON Web Tokens)**.

### **تطبيق الموبايل (Mobile App)**
* تم تطوير تطبيق خاص **للمرضى** باستخدام **Flutter** لتسهيل الوصول للوصفات في أي وقت.

---

## 🔐 جدول الصلاحيات (User Roles & Permissions)

| الإجراء | 👑 مدير (Admin) | 👨‍⚕️ طبيب (Doctor) | 💊 صيدلي (Pharmacist) | 👤 مريض (Patient) |
| :--- | :---: | :---: | :---: | :---: |
| إدارة المستخدمين والمراكز والصيدليات | ✅ | ❌ | ❌ | ❌ |
| إنشاء وصفات طبية جديدة | ✅ | ✅ | ❌ | ❌ |
| مراجعة وصرف الأدوية | ✅ | ❌ | ✅ | ❌ |
| استعراض الوصفات الخاصة فقط | ❌ | ✅ | ✅ | ✅ |
| تعديل الملف الشخصي وكلمة المرور | ✅ | ✅ | ✅ | ✅ |
| الوصول للإحصائيات والتقارير | ✅ | ❌ | ❌ | ❌ |

---

## 📂 هيكل تنظيم الملفات (Project Structure)

```text
Wasfaty-FrontEnd/
├── pages/
│   ├── auth/            # تسجيل الدخول وإنشاء حساب (للمريض)
│   ├── admin/           # لوحة التحكم وإدارة (المستخدمين، الأدوية، المراكز، الصيدليات)
│   ├── doctor/          # واجهات الأطباء، قائمة المرضى، وإنشاء الوصفات
│   ├── pharmacist/      # واجهات الصيدليات، الوصفات المعلقة، وتأكيد الصرف
│   └── patient/         # عرض الوصفات، الملف الشخصي، وتصدير PDF
├── js/                  # منطق العمل (auth.js, admin.js, doctor.js, pharmacist.js, patient.js)
├── css/                 # ملفات التنسيق المخصصة
└── images/
    └── screenshots/     # صور توضيحية لواجهات النظام
````

-----

## 📸 واجهات النظام (System Screenshots)

### 1️⃣ الواجهات العامة (General Screens)

| واجهة تسجيل الدخول | إنشاء حساب مريض | رفض الوصول (صلاحيات) |
| :---: | :---: | :---: |
|  |  |  |

### 2️⃣ لوحات التحكم (Dashboards)

| لوحة تحكم المدير (Admin) | لوحة تحكم الطبيب | لوحة تحكم الصيدلي |
| :---: | :---: | :---: |
|  |  |  |

### 3️⃣ العمليات الأساسية (Core Operations)

| إدارة المستخدمين (Admin) | إنشاء وصفة طبية (Doctor) | تفاصيل الوصفة والصرف (Pharmacist) |
| :---: | :---: | :---: |
|  |  |  |

### 4️⃣ واجهات المريض (Patient Experience)

| قائمة الوصفات الشخصية | تحميل الوصفة PDF | تعديل الملف الشخصي |
| :---: | :---: | :---: |
|  |  |  |

-----

## 🚀 كيفية التشغيل (Installation & Setup)

1.  **استنساخ المشروع:**
    ```bash
    git clone [https://github.com/abdo7806/Wasfaty-FrontEnd.git](https://github.com/abdo7806/Wasfaty-FrontEnd.git)
    ```
2.  **ضبط الـ API:**
    قم بتعديل رابط الـ API في ملفات الـ Javascript الموجودة في مجلد `js/`:
    ```javascript
    const API_BASE_URL = "[https://your-api-domain.com/api](https://your-api-domain.com/api)";
    ```
3.  **التشغيل:**
    افتح المشروع باستخدام **Live Server** في VS Code وابدأ من صفحة `pages/auth/login.html`.

-----

## 🔗 المشاريع المرتبطة

  * **Back-End API (ASP.NET Core):** [رابط المستودع](https://github.com/abdo7806/Wasti-Mobile-Project)
  * **Mobile App (Flutter):** [رابط المستودع](https://github.com/abdo7806/Wasfaty-Mobile)

-----

## 👨‍💻 المطور

  * **عبد السلام الذهبي**
  * **البريد الإلكتروني:** balzhaby26@gmail.com
  * **LinkedIn:** [Abdulsalam Dhahabi](https://linkedin.com/in/abdulsalam-al-dhahabi-218887312)

-----

\<div align="center"\>
تم تطوير هذا المشروع كجزء من رحلة التعلم مع "أبو هدهود" 🚀
\</div\>

````

-----

### 💡 ماذا تفعل الآن؟

1.  **انسخ الكود أعلاه** وضعه في ملف `README.md` داخل مشروعك.
2.  **تأكد من تسمية الصور** في مجلد `images/screenshots/` بنفس الأسماء الموجودة في الكود (مثل `login.png`, `admin-dashboard.png` وغيرها).
3.  **ارفع الملف لـ GitHub**:
    ```bash
    git add README.md
    git commit -m "Update full professional README"
    git push
    ```

