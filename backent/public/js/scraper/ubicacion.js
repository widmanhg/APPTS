const inputField = document.getElementById("Locations");
const suggestionsBox = document.getElementById("suggestions");
const selectedValues = document.getElementById("selectedValues");
const selectAllButton = document.createElement("div");  // Botón de "Seleccionar todos"
selectAllButton.textContent = "Seleccionar todos";
selectAllButton.style.padding = "10px";
let selectedLocations = {}; // Objeto para almacenar los seleccionados
let locations = {}; // Aquí se almacenarán las ubicaciones desde el servidor

// Función para cargar las ubicaciones desde el servidor
function cargarUbicaciones() {
    fetch("/api/location")  // Aquí va tu endpoint
        .then(response => response.json())
        .then(data => {
            locations = data; // Asignamos el JSON obtenido al objeto locations
        })
        .catch(error => console.error("Error al cargar las ubicaciones:", error));
}

// Llamamos a la función para cargar las ubicaciones cuando se cargue la página
cargarUbicaciones();

// Mostrar las sugerencias al hacer clic en el campo de texto
inputField.onclick = () => {
    suggestionsBox.style.display = "block"; // Mostrar el menú
    searchLocations(); // Llamamos a la función para mostrar las ubicaciones
};

// Filtrar y mostrar las ubicaciones mientras se escribe
inputField.addEventListener("input", searchLocations);

function searchLocations() {
    const query = inputField.value.toLowerCase();
    suggestionsBox.innerHTML = "";  // Limpiar las sugerencias previas

    // Agregar el botón "Seleccionar todos" siempre al principio
    suggestionsBox.appendChild(selectAllButton);

    // Si la búsqueda está vacía, mostrar todas las ubicaciones
    if (query.trim() === "") {
        Object.entries(locations).forEach(([id, name]) => {
            const div = document.createElement("div");
            div.textContent = name;
            div.dataset.id = id;

            // Aplicar la clase "selected" si ya está marcado
            if (selectedLocations[id]) {
                div.classList.add("selected");
            }

            div.onclick = () => toggleSelection(id, div);
            suggestionsBox.appendChild(div);
        });
    } else {
        // Filtrar las ubicaciones que coincidan con la búsqueda
        Object.entries(locations).forEach(([id, name]) => {
            if (name.toLowerCase().includes(query)) {
                const div = document.createElement("div");
                div.textContent = name;
                div.dataset.id = id;

                // Aplicar la clase "selected" si ya está marcado
                if (selectedLocations[id]) {
                    div.classList.add("selected");
                }

                div.onclick = () => toggleSelection(id, div);
                suggestionsBox.appendChild(div);
            }
        });
    }

    if (suggestionsBox.children.length > 0) {
        suggestionsBox.style.display = "block"; // Asegura que se muestre solo si hay resultados
    } else {
        suggestionsBox.style.display = "none"; // Ocultar si no hay resultados
    }
}

// Función para marcar o desmarcar una ubicación
function toggleSelection(id, element) {
    if (selectedLocations[id]) {
        delete selectedLocations[id]; // Si ya está seleccionado, lo quitamos
        element.classList.remove("selected");
    } else {
        selectedLocations[id] = locations[id]; // Si no, lo añadimos
        element.classList.add("selected");
    }

    updateHiddenInput();

    // Si todos están seleccionados, resalta el botón de "Seleccionar todos"
    if (Object.keys(selectedLocations).length === Object.keys(locations).length) {
        selectAllButton.classList.add("selected");
    } else {
        selectAllButton.classList.remove("selected");
    }
}

// Actualizar input oculto con IDs seleccionados
function updateHiddenInput() {
    selectedValues.value = Object.keys(selectedLocations).join(",");
}

// Función para seleccionar o desmarcar todas las ubicaciones
selectAllButton.onclick = () => {
    const allItems = document.querySelectorAll("#suggestions div:not(:first-child)");

    if (Object.keys(selectedLocations).length === Object.keys(locations).length) {
        // Si todos están seleccionados, desmarcarlos
        selectedLocations = {};
        allItems.forEach(item => item.classList.remove("selected"));
        selectAllButton.classList.remove("selected");
    } else {
        // Si no todos están seleccionados, seleccionarlos
        selectedLocations = {...locations};
        allItems.forEach(item => item.classList.add("selected"));
        selectAllButton.classList.add("selected");
    }

    updateHiddenInput();
};

// Cerrar el menú de sugerencias si el usuario hace clic fuera del menú
document.addEventListener("click", (event) => {
    if (!suggestionsBox.contains(event.target) && event.target !== inputField) {
        suggestionsBox.style.display = "none";
    }
});
