function checkAccess(allowedRoles, url) {


    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = url;
        return;
    }


    const payload = parseJwt(token);

    const role = payload.role;

    if (!allowedRoles.includes(role)) {
        window.location.href = url;
    }
}

function parseJwt(token) {
    try {
        if (!token) throw new Error('No token provided');

        const base64Url = token.split('.')[1];
        if (!base64Url) throw new Error('Invalid token format');

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedData = atob(base64);

        const jsonPayload = decodeURIComponent(
            decodedData.split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return null;
    }
}


function getUserName() {


    const userData = JSON.parse(localStorage.getItem("userData"));
    let email = document.getElementsByClassName("EmailUser");
    email[0].textContent = userData.email;
    email[1].textContent = userData.email;

    let role = document.getElementsByClassName("RoleUser");
    role[0].textContent = userData.role;
    role[1].textContent = userData.role;

}


async function getDactorByUserId() {

    const userData = JSON.parse(localStorage.getItem("userData"));

    let userId = userData.userId;

    const response = await fetch(`https://localhost:7219/api/Doctor/GetDoctorByUserId/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }

    });

    // إخفاء مؤشر تحميل


    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');

    }

    const data = await response.json();

    console.log(data);
    localStorage.setItem('doctorData', JSON.stringify({
        id: data.id,
        medicalCenter: data.medicalCenter,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,

    }));
}




async function getPatientByUserId() {

    const userData = JSON.parse(localStorage.getItem("userData"));

    let userId = userData.userId;
    const response = await fetch(`https://localhost:7219/api/PatientController/GetPatientByUserId/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }

    });

    // إخفاء مؤشر تحميل


    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');

    }

    const data = await response.json();

    console.log(data);
    localStorage.setItem('patientData', JSON.stringify(data));
}



async function getPharmacistByUserId() {

    const userData = JSON.parse(localStorage.getItem("userData"));

    let userId = userData.userId;

    const response = await fetch(`https://localhost:7219/api/Pharmacist/GetPharmacistByUserId/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }

    });

    // إخفاء مؤشر تحميل


    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');

    }

    const data = await response.json();

    console.log(data);
    localStorage.setItem('PharmacistData', JSON.stringify(data));
}