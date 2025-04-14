

document.addEventListener("DOMContentLoaded", () => {
    const inputIndustries = document.getElementById("Industries");
    const industrySuggestionsBox = document.getElementById("industrySuggestions");
    const selectedIndustriesValues = document.getElementById("selectedIndustries");
    const selectAllIndustriesButton = document.createElement("div");
    selectAllIndustriesButton.textContent = "Seleccionar todos";
    selectAllIndustriesButton.style.padding = "10px";
    let selectedIndustries = {}; // Almacena industrias seleccionadas
    let industries = {}; // Almacena las industrias obtenidas del servidor

    // 🔍 Cargar industrias desde el servidor
    function cargarIndustrias() {
        fetch("http://localhost:3000/api/industry")
            .then(response => response.json())
            .then(data => {
                console.log("Industrias recibidas:", data);
                industries = data;
                renderIndustries(); // Renderizar industrias
            })
            .catch(error => console.error("Error al cargar industrias:", error));
    }

    // 🖥️ Renderizar industrias (filtro opcional)
    function renderIndustries(query = "") {
        industrySuggestionsBox.innerHTML = "";  // Limpiar la lista

        // Agregar el botón "Seleccionar todos" si hay industrias
        if (Object.keys(industries).length > 0) {
            industrySuggestionsBox.appendChild(selectAllIndustriesButton);
        }

        Object.entries(industries).forEach(([id, name]) => {
            if (!query || name.toLowerCase().includes(query.toLowerCase())) {
                const div = document.createElement("div");
                div.textContent = name;
                div.dataset.id = id;
                div.classList.add("industry-item");

                // Marcar como seleccionado si ya está en la lista
                if (selectedIndustries[id]) {
                    div.classList.add("selected");
                }

                div.addEventListener("click", () => toggleIndustrySelection(id, div));
                industrySuggestionsBox.appendChild(div);
            }
        });

        // Mostrar las sugerencias si hay más de una opción
        industrySuggestionsBox.style.display = industrySuggestionsBox.children.length > 1 ? "block" : "none";
    }

    // 📌 Buscar industrias al escribir
    inputIndustries.addEventListener("input", () => {
        renderIndustries(inputIndustries.value.trim());
    });

    // 🔲 Mostrar sugerencias al enfocar
    inputIndustries.addEventListener("focus", () => {
        industrySuggestionsBox.style.display = "block";  // Muestra el contenedor de sugerencias al enfocar
    });

    // ❌ Ocultar sugerencias si se hace clic fuera
    document.addEventListener("click", (event) => {
        if (!inputIndustries.contains(event.target) && !industrySuggestionsBox.contains(event.target)) {
            industrySuggestionsBox.style.display = "none";  // Oculta las sugerencias si se hace clic fuera
        }
    });

    // ✅ Alternar selección de industria
    function toggleIndustrySelection(id, element) {
        if (selectedIndustries[id]) {
            delete selectedIndustries[id];
            element.classList.remove("selected");
        } else {
            selectedIndustries[id] = industries[id];
            element.classList.add("selected");
        }
        updateHiddenIndustryInput();
    }

    // 🔄 Actualizar input oculto con los IDs seleccionados
    function updateHiddenIndustryInput() {
        selectedIndustriesValues.value = Object.keys(selectedIndustries).join(",");
        console.log("Industrias seleccionadas:", selectedIndustriesValues.value);
    }

    // 🔘 Seleccionar/deseleccionar todas las industrias
    selectAllIndustriesButton.addEventListener("click", () => {
        if (Object.keys(selectedIndustries).length === Object.keys(industries).length) {
            selectedIndustries = {};
            document.querySelectorAll(".industry-item").forEach(item => item.classList.remove("selected"));
            selectAllIndustriesButton.classList.remove("selected");
        } else {
            selectedIndustries = { ...industries };
            document.querySelectorAll(".industry-item").forEach(item => item.classList.add("selected"));
            selectAllIndustriesButton.classList.add("selected");
        }
        updateHiddenIndustryInput();
    });

    // 🚀 Cargar industrias al iniciar la página
    cargarIndustrias();

    // Mantener el contenedor de sugerencias cerrado por defecto
    industrySuggestionsBox.style.display = "none";

    // Limpia el campo de texto al seleccionarse una industria
    inputIndustries.addEventListener("blur", () => {
        inputIndustries.value = ""; // Limpiar el texto al perder el foco
    });

    // **Función para obtener los valores seleccionados correctamente**
    window.getSelectedIndustries = function() {
        return Object.keys(selectedIndustries); // Retorna solo los IDs seleccionados
    };
});
