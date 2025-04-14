// Función para abrir el modal
function openModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'flex'; // Muestra el modal
}

// Función para cerrar el modal
function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none'; // Oculta el modal
}

// Función que se ejecuta cuando se hace clic en "Aceptar" en el modal
function createTableFromModal() {
    const tableName = document.getElementById('table-name-input').value; // Obtenemos el valor del input

    if (!tableName) {
        alert("Por favor, ingresa un nombre de tabla.");
        return;
    }

    createNewTable('urls', tableName); // Llamamos a la función de crear tabla con el nombre ingresado
}

// Función para crear la nueva tabla
async function createNewTable(type, tableName) {
    try {
        let response;
        const apiUrl = '/api/create-url-table'; // Definir correctamente la URL de la API

        console.log(`Enviando solicitud a ${apiUrl} con el nombre de tabla: ${tableName}`);

        // Llamada a la API para crear la tabla
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableName: tableName }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error detallado desde el servidor:", data); // Muestra más detalles en la consola
            alert(data.message || "Error al crear la tabla.");
            return;
        }

        console.log("Respuesta exitosa:", data); // Ver los detalles de la respuesta exitosa
        alert(data.message || "Tabla creada exitosamente.");
    } catch (error) {
        console.error("Error al crear la tabla:", error);
        alert("Hubo un error al crear la tabla.");
    }
}

// Función para abrir el modal
function openModalInfo() {
    const modal = document.getElementById('modal-create-table-info');
    modal.style.display = 'flex'; // Muestra el modal
}

// Función para cerrar el modal
function closeModalInfo() {
    const modal = document.getElementById('modal-create-table-info');
    modal.style.display = 'none'; // Oculta el modal
}

// Función que se ejecuta cuando se hace clic en "Aceptar" en el modal
function createTableFromModalInfo() {
    const tableName = document.getElementById('table-name-input-info').value; // Obtenemos el valor del input

    if (!tableName) {
        alert("Por favor, ingresa un nombre de tabla.");
        return;
    }

    createNewTableInfo(tableName); // Llamamos a la función de crear tabla con el nombre ingresado
}

// Función para crear la nueva tabla de información
async function createNewTableInfo(tableName) {
    try {
        let response;
        const apiUrl = '/api/create-table'; // URL de la API para crear la tabla

        console.log(`Enviando solicitud a ${apiUrl} con el nombre de tabla: ${tableName}`);

        // Llamada a la API para crear la tabla
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableName: tableName }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error detallado desde el servidor:", data); // Muestra más detalles en la consola
            alert(data.message || "Error al crear la tabla.");
            return;
        }

        console.log("Respuesta exitosa:", data); // Ver los detalles de la respuesta exitosa
        alert(data.message || "Tabla creada exitosamente.");
    } catch (error) {
        console.error("Error al crear la tabla:", error);
        alert("Hubo un error al crear la tabla.");
    }
}
