document.addEventListener("DOMContentLoaded", function () {
    const btnObtener = document.getElementById("btn-obtener-urls");
    const urlModal = document.getElementById("urlModal");

    // Función para abrir el modal
    function openUrlModal() {
        urlModal.style.display = "flex";
    }

    // Función para cerrar el modal
    function closeUrlModal() {
        urlModal.style.display = "none";
    }

    // Función para obtener las URLs y cerrar el modal
    function getUrlsAndClose() {
        fetch("/obtener-json")
            .then(response => response.json())
            .then(data => {
                console.log("Datos obtenidos:", data);

                const email = data.email || "";
                const password = data.password || "";
                const used = data.used || false;

                const ubicaciones = document.getElementById("selectedValues")?.value || "";
                const tablaOrigen = document.getElementById("select-tabla-origen")?.value || "";
                const industrias = window.getSelectedIndustries ? window.getSelectedIndustries() : [];
                const paginas = document.getElementById("input-paginas")?.value || "";
                const numeroEmpleados = window.getEmpresaSizeCodes ? window.getEmpresaSizeCodes() : [];

                const inputEmpresasBloqueadas = document.getElementById("blocked-companies");
                let empresasBloqueadas = [];

                if (inputEmpresasBloqueadas && inputEmpresasBloqueadas.value.trim() !== "") {
                    empresasBloqueadas = inputEmpresasBloqueadas.value
                        .split(",")
                        .map(e => e.trim())
                        .filter(e => e !== "");
                }

                const locationsArray = ubicaciones
                    .split(",")
                    .map(location => location.trim())
                    .filter(location => location !== "");

                const jsonData = {
                    email: email || " ",
                    password: password || " ",
                    used: used, //
                    pages_per_size: paginas || " ",
                    tabla: tablaOrigen || " ",
                    location: locationsArray.length > 0 ? locationsArray : [" "],
                    industries: industrias.length > 0 ? industrias : [" "],
                    company_sizes: numeroEmpleados.length > 0 ? numeroEmpleados : [" "],
                    ban: empresasBloqueadas.length > 0 ? empresasBloqueadas : [" "]
                };

                console.log("📦 Formulario completo:", JSON.stringify(jsonData, null, 2));

                // Enviar jsonData al backend en /api/get-urls
                fetch("/api/get-urls", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(jsonData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Error en la solicitud al backend");
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("✅ Respuesta del backend (FastAPI):", data);
                    // Aquí puedes manejar las URLs recibidas
                })
                .catch(error => {
                    console.error("❌ Error al enviar JSON al backend:", error);
                });
            })
            .catch(error => {
                console.error("Error al obtener los datos:", error);
            });

        closeUrlModal();
    }

    window.openUrlModal = openUrlModal;
    window.closeUrlModal = closeUrlModal;
    window.getUrlsAndClose = getUrlsAndClose;
});

document.addEventListener("DOMContentLoaded", function () {
    const btnCrearUsuario = document.getElementById("btn-crear-usuario");
    const modal = document.getElementById("usuarioModal");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    window.openModalusuario = function () {
        modal.style.display = "flex";
    }

    window.closeModalusuario = function () {
        modal.style.display = "none";
    }

    window.submitForm = function () {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (email && password) {
            fetch("/crear-json", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                closeModalusuario();
            })
            .catch(error => {
                console.error("Error al crear el JSON:", error);
            });
        } else {
            alert("Por favor, ingresa un correo y una contraseña.");
        }
    }
});
