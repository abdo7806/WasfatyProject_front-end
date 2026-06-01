// DOM Elements
const elements = {
    loading: document.getElementById('loading-indicator'),
    error: document.getElementById('error-alert'),
    dashboard: document.getElementById('dashboard-content'),
    pendingPrescriptions: document.getElementById('pending-prescriptions'),
    dispensedPrescriptions: document.getElementById('dispensed-prescriptions'),
    monthlyMedications: document.getElementById('monthly-medications'),
    newPrescriptionsBadge: document.getElementById('new-prescriptions-badge')
};

// App State
const state = {
    lastPrescriptionId: 0,
    newPrescriptionsCount: 0
};

// Show Loading
function showLoading() {
    if (elements.loading) elements.loading.classList.remove('d-none');
    if (elements.error) elements.error.classList.add('d-none');
    if (elements.dashboard) elements.dashboard.classList.add('d-none');
}

// Hide Loading
function hideLoading() {
    if (elements.loading) elements.loading.classList.add('d-none');
    if (elements.dashboard) elements.dashboard.classList.remove('d-none');
}

// Show Error
function showError(message) {
    if (elements.error) {
        elements.error.classList.remove('d-none');
        elements.error.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
    }
}

// ✅ Fetch Dashboard Data (معدل لاستخدام fetchWithAuth)
async function fetchDashboardData() {
    try {
        showLoading();
        const pharmacistData = JSON.parse(localStorage.getItem("PharmacistData"));
        
        if (!pharmacistData?.id) {
            throw new Error('بيانات الصيدلي غير موجودة');
        }

        const response = await fetchWithAuth(`https://localhost:7219/api/Pharmacist/stats/${pharmacistData.id}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        
        const data = await response.json();
        
        // Update Stats Cards
        if (elements.pendingPrescriptions) elements.pendingPrescriptions.textContent = data.pendingPrescriptions || 0;
        if (elements.dispensedPrescriptions) elements.dispensedPrescriptions.textContent = data.dispensedPrescriptionsByPharmcist || 0;
        if (elements.monthlyMedications) elements.monthlyMedications.textContent = data.monthlyMedications || 0;
        
        // Update last prescription ID
        if (data.lastPrescriptionId) {
            state.lastPrescriptionId = data.lastPrescriptionId;
        }
        
        // Render Chart
        if (data.topMedications && data.topMedications.length > 0) {
            renderTopMedicationsChart(data.topMedications);
        }
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError(error.message || 'حدث خطأ أثناء جلب البيانات');
    } finally {
        hideLoading();
    }
}

// ✅ Check for new prescriptions (معدل لاستخدام fetchWithAuth)
async function checkForNewPrescriptions() {
    try {
        const response = await fetchWithAuth(`https://localhost:7219/api/Prescription/New/${state.lastPrescriptionId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('فشل في التحقق من الوصفات الجديدة');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            state.newPrescriptionsCount = data.length;
            if (elements.newPrescriptionsBadge) {
                elements.newPrescriptionsBadge.classList.remove('d-none');
                elements.newPrescriptionsBadge.textContent = `${state.newPrescriptionsCount} وصفات جديدة`;
            }
            
            // Show browser notification if tab is not active
            if (document.hidden && Notification.permission === 'granted') {
                new Notification('وصفات جديدة', {
                    body: `لديك ${state.newPrescriptionsCount} وصفة جديدة تحتاج معالجة`,
                });
            }
        }
    } catch (error) {
        console.error('Error checking for new prescriptions:', error);
    }
}

// Render Medications Chart
function renderTopMedicationsChart(medicationsData) {
    const canvas = document.getElementById('topMedicationsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Sort medications by count (descending)
    const sortedData = [...medicationsData].sort((a, b) => b.count - a.count);
    const top5 = sortedData.slice(0, 5);
    
    const labels = top5.map(m => m.medicationName);
    const data = top5.map(m => m.count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد مرات الصرف',
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `عدد مرات الصرف: ${context.raw}`;
                        }
                    },
                    bodyFont: {
                        family: 'Tajawal'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من الصلاحية وإدارة الجلسة
    await getPharmacistByUserId();
    
    // Load initial data
    await fetchDashboardData();
    
    // Check for new prescriptions every 30 seconds (اختياري)
    // setInterval(checkForNewPrescriptions, 30000);
    
 
    
    // Refresh data every minute (اختياري)
    // setInterval(fetchDashboardData, 60000);
});