function openModalWithEmployees(sector, data, empresa) {
    const modal = document.getElementById("modal-employee"); // Modal de empleados
    const modalTitle = document.getElementById("modal-title-employee"); // Título del modal
    const modalList = document.getElementById("modal-list-employee"); // Lista de empleados
    const closeButton = document.querySelector(".close-empleados");

    // Verificar que el modal y los elementos existan
    if (!modal || !modalTitle || !modalList || !closeButton) {
        console.error('Elementos del modal no encontrados.');
        return;
    }

    // Asignar el título con el sector seleccionado
    modalTitle.textContent = `${empresa}`;

    // Limpiar contenido previo de la lista de empleados
    modalList.innerHTML = "";

    // Verificar si la respuesta contiene empleados y convertirlos si es necesario
    if (data && Array.isArray(data.empleados)) {
        // Si los empleados vienen como un string JSON, parsearlo
        if (typeof data.empleados === 'string') {
            try {
                data.empleados = JSON.parse(data.empleados); // Parsear el string JSON
            } catch (error) {
                console.error('Error al parsear empleados:', error);
                modalList.innerHTML = "<li>Error al procesar los empleados</li>";
                return;
            }
        }

        // Procesar cada empleado
        data.empleados.forEach(item => {
            const li = document.createElement("li");

            // Crear el elemento para el nombre del empleado
            const nameSpan = document.createElement("span");
            nameSpan.classList.add("employee-name");
            nameSpan.textContent = item.Nombre;

            // Crear el elemento para el cargo del empleado
            const positionSpan = document.createElement("span");
            positionSpan.classList.add("employee-position");
            positionSpan.textContent = item.Cargo;

            // Crear el contenedor de la foto
            const photoImg = document.createElement("img");
            photoImg.src = item.Foto;
            photoImg.alt = `${item.Nombre}'s photo`;
            photoImg.classList.add("employee-photo");

            // Crear el enlace al perfil
            const profileLink = document.createElement("a");
            profileLink.href = item.Perfil;
            profileLink.target = "_blank";
            profileLink.textContent = "Perfil";

            // Crear el botón de estrella (activar y desactivar)
            const starButton = document.createElement("button");
            starButton.classList.add("star-button");
            starButton.innerHTML = "⭐"; // Estrella

            starButton.addEventListener("click", function () {
                // Alternar el estado de la estrella
                const isActive = starButton.classList.toggle("active");
                starButton.innerHTML = isActive ? "🌟" : "⭐";
            
                // Crear objeto combinado con todos los datos
                const fullData = {
                    empleado: item,
                    empresa: empresa,
                    sector: sector
                };
            
                // Enviar datos al servidor
                fetch("/save-favorite", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(fullData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message); // Maneja la respuesta
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            });
            

            
            // Agregar elementos al contenedor del empleado
            li.appendChild(photoImg);
            li.appendChild(nameSpan);
            li.appendChild(positionSpan);
            li.appendChild(profileLink);
            li.appendChild(starButton);

            // Agregar el contenedor del empleado a la lista
            modalList.appendChild(li);
        });
    } else {
        modalList.innerHTML = "<li>Error: No se encontraron empleados</li>";
    }

    // Mostrar el modal
    modal.style.display = "flex";

    // Cerrar modal al hacer clic en la "X"
    closeButton.onclick = function () {
        modal.style.display = "none";
    };

    // Cerrar modal si se hace clic fuera de él
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}
