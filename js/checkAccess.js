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
