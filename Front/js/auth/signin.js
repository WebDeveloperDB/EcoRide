(() => {
    const formulaireConnexion = document.getElementById("signinForm");
    const boutonConnexion = document.getElementById("btnSignin");

    if (!formulaireConnexion || !boutonConnexion) {
        return;
    }

    formulaireConnexion.addEventListener("submit", soumettreConnexion);
    boutonConnexion.addEventListener("click", (event) => {
        event.preventDefault();
        formulaireConnexion.requestSubmit();
    });

    async function soumettreConnexion(event) {
        event.preventDefault();

        const email = document.getElementById("EmailInput")?.value.trim() ?? "";
        const motDePasse = document.getElementById("PasswordInput")?.value ?? "";

        if (!email || !motDePasse) {
            alert("Merci de renseigner l'email et le mot de passe.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password: motDePasse
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Connexion impossible.");
            }

            setToken(data.apiToken);

            const roles = data.roles || ["ROLE_USER"];
            let roleLePlusHaut = "ROLE_USER";

            if (roles.includes("ROLE_ADMIN")) {
                roleLePlusHaut = "ROLE_ADMIN";
            } else if (roles.includes("ROLE_EMPLOYEE")) {
                roleLePlusHaut = "ROLE_EMPLOYEE";
            }

            setCookie("role", roleLePlusHaut, 7, "/");

            localStorage.setItem("token", data.apiToken);
            localStorage.setItem("roles", JSON.stringify(roles));
            localStorage.setItem("email", data.user);

            window.location.href = "/EcoRide/Front/";
        } catch (error) {
            alert("Erreur de connexion : " + error.message);
        }
    }
})();
