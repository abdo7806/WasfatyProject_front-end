class DynamicContentLoader {
    constructor() {
        this.contentContainer = document.getElementById('dynamic-content');
        this.initEvents();
        this.loadInitialContent();
    }

    initEvents() {
        // تحميل المحتوى عند النقر على روابط القائمة
        document.querySelectorAll('[data-load]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadContent(link.getAttribute('data-load'));
                history.pushState(null, null, link.getAttribute('href'));
            });
        });

        // التعامل مع زر الرجوع/التقدم في المتصفح
        window.addEventListener('popstate', () => {
            this.loadContentFromUrl();
        });
    }

    loadInitialContent() {
        this.loadContentFromUrl();
    }

    loadContentFromUrl() {
        const path = window.location.pathname;
        const page = path.substring(1) || 'dashboard';
        this.loadContent(page);
    }

    async loadContent(page) {
        try {
            // عرض مؤشر تحميل
            this.contentContainer.innerHTML = `
              <div class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                      <span class="sr-only">جاري التحميل...</span>
                  </div>
                  <p>جاري تحميل المحتوى...</p>
              </div>
          `;

            // جلب المحتوى من الملف الجزئي
            const response = await fetch(`partials/${page}.html`);

            if (!response.ok) {
                throw new Error('الصفحة غير موجودة');
            }

            const html = await response.text();

            // إضافة المحتوى إلى الصفحة
            this.contentContainer.innerHTML = html;

            // تحميل الـ JS الخاص بالصفحة إذا وجد
            this.loadPageScript(page);

            // تحديث عنوان الصفحة
            this.updatePageTitle(page);

            // تحديث القائمة النشطة
            this.updateActiveMenu(page);

        } catch (error) {
            console.error('Error loading content:', error);
            this.showErrorPage();
        }
    }

    loadPageScript(page) {
        // إزالة الـ script السابق إذا كان موجودًا
        const oldScript = document.getElementById('page-script');
        if (oldScript) {
            oldScript.remove();
        }

        // إنشاء script جديد
        const script = document.createElement('script');
        script.id = 'page-script';
        script.src = `js/pages/${page}.js`;
        script.onerror = () => {
            console.log(`No script found for ${page}`);
        };
        document.body.appendChild(script);
    }

    updatePageTitle(page) {
        const titles = {
            'dashboard': 'لوحة التحكم',
            'users': 'المستخدمون',
            'doctors': 'الأطباء'
                // أضف العناوين الأخرى هنا
        };

        const title = titles[page] || 'الصفحة غير موجودة';
        document.title = `نظام وصفتي | ${title}`;
        document.getElementById('page-title').textContent = title;
        document.getElementById('current-page').textContent = title;
    }

    updateActiveMenu(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-load') === page) {
                link.classList.add('active');
            }
        });
    }

    showErrorPage() {
        this.contentContainer.innerHTML = `
          <div class="alert alert-danger">
              <h4><i class="icon fas fa-ban"></i> خطأ!</h4>
              تعذر تحميل المحتوى المطلوب. الرجاء المحاولة لاحقاً.
          </div>
      `;
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new DynamicContentLoader();

    // تحديث سنة حقوق النشر
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // تهيئة AdminLTE
    if (typeof $.AdminLTE !== 'undefined') {
        $.AdminLTE.layout.activate();
    }
});