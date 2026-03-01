document.getElementById("btnSignin").addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("EmailInput").value.trim();
    const password = document.getElementById("PasswordInput").value;

    const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();

    if (response.ok) {
        setToken(data.apiToken);

        const roles = data.roles || ['ROLE_USER'];
        let highestRole = 'ROLE_USER';

        if (roles.includes('ROLE_ADMIN')) {
            highestRole = 'ROLE_ADMIN';
        } else if (roles.includes('ROLE_EMPLOYEE')) {
            highestRole = 'ROLE_EMPLOYEE';
        }

        setCookie("role", highestRole, 7, "/");

        localStorage.setItem('token', data.apiToken);
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('email', data.user);

        window.location.href = "/EcoRide/Front/";
    } else {
        alert("Erreur de connexion : " + (data.message ?? response.status));
    }
});
