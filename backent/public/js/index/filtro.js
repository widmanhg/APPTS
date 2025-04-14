
let selectedFilters = {
    tamano: [],
    ciudad: [],
    sector: [],
    nombre: [],
    codigo_postal: []
};

let filterOptions = {
    tamano: [],
    ciudad: [],
    sector: []
};

function loadFilters() {
    const tableName = document.getElementById("table-select").value;
    if (!tableName) return;

    fetch('/api/filters', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName })
    })
    .then(response => response.json())
    .then(data => {
        filterOptions.tamano = data.tamano || [];
        filterOptions.ciudad = data.ciudad || [];
        filterOptions.sector = data.sector || [];
    
        populateCustomFilter("tamano", data.tamano);
        populateCustomFilter("ciudad", data.ciudad);
        populateCustomFilter("sector", data.sector);
        
        selectedFilters = {
            tamano: [],
            ciudad: [],
            sector: [],
            nombre: [],
            codigo_postal: []
        };
    })
    .catch(err => console.error("Error al cargar filtros:", err));
}

function populateCustomFilter(filterType, options) {
    const container = document.getElementById(`${filterType}-options`);
    container.innerHTML = '';
    const uniqueOptions = [...new Set(options)].filter(option => option);
    uniqueOptions.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.textContent = option;
        optionDiv.dataset.value = option;
        optionDiv.onclick = function() {
            toggleOption(filterType, option, this);
        };
        container.appendChild(optionDiv);
    });
}

function toggleOption(filterType, value, element) {
    const index = selectedFilters[filterType].indexOf(value);
    if (index === -1) {
        selectedFilters[filterType].push(value);
        element.classList.add('option-selected');
    } else {
        selectedFilters[filterType].splice(index, 1);
        element.classList.remove('option-selected');
    }
    updateSelectAllState(filterType);
}

function toggleSelectAll(filterType) {
    const allOptionsSelected = selectedFilters[filterType].length === filterOptions[filterType].length;
    const optionsContainer = document.getElementById(`${filterType}-options`);
    const allOptionItems = optionsContainer.querySelectorAll('.option-item');
    
    if (allOptionsSelected) {
        selectedFilters[filterType] = [];
        allOptionItems.forEach(item => item.classList.remove('option-selected'));
    } else {
        selectedFilters[filterType] = [...filterOptions[filterType]];
        allOptionItems.forEach(item => item.classList.add('option-selected'));
    }
    updateSelectAllState(filterType);
}

function updateSelectAllState(filterType) {
    const selectAllOption = document.querySelector(`#${filterType}-container .select-all-option`);
    const allSelected = selectedFilters[filterType].length === filterOptions[filterType].length && filterOptions[filterType].length > 0;
    selectAllOption.classList.toggle('option-selected', allSelected);
}

function processTextFilters() {
    const nombreInput = document.getElementById("nombre-input").value;
    const codigo_postalInput = document.getElementById("codigo-postal-input").value;
    
    selectedFilters.nombre = nombreInput ? nombreInput.split(',').map(val => val.trim()) : [];
    selectedFilters.codigo_postal = codigo_postalInput ? codigo_postalInput.split(',').map(val => val.trim()) : [];

    // Verifica los filtros procesados
    console.log("Selected Filters:", selectedFilters);
}

document.getElementById("apply-filters").addEventListener("click", function () {
    processTextFilters();  // Asegurar que los filtros de texto sean procesados antes de enviarlos

    const filters = Object.fromEntries(
        Object.entries({
            tamano: selectedFilters.tamano,
            ciudad: selectedFilters.ciudad,
            sector: selectedFilters.sector,
            nombre: selectedFilters.nombre,
            codigo_postal: selectedFilters.codigo_postal
        }).filter(([_, value]) => value.length > 0) // Elimina claves con arrays vacíos
    );

    const tableName = document.getElementById("table-select").value;
    if (!tableName) {
        console.error("Error: No se ha seleccionado una tabla.");
        return;
    }

    fetch('/api/data', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tableName,
            filters,
            page: 1,
            limit: 16
        })
    })
    .then(response => response.json())
    .then(data => {
        const { items, totalItems } = data;
        loadTableData(items);
        updatePagination(totalItems, 16);
    })
    .catch(err => console.error("Error al aplicar filtros:", err));
});

function loadTableData(items) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = '';
    
    items.forEach(item => {
        console.log("Item Data:", item); // Verifica los datos que se están cargando
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nombre}</td>
            <td>${item.resumen}</td>
            <td>${item.tamano}</td>
            <td>${item.ubicaciones || "N/A"}</td> <!-- Muestra N/A si no está definido -->
            <td>${item.sector}</td>
            <td>${item.sede}</td>
            <td>${item.codigo_postal || "N/A"}</td> <!-- Muestra N/A si no está definido -->
            <td>${item.ciudad}</td>
            <td>${item.empleados}</td>
        `;
        tableBody.appendChild(row);
    });
}
function updatePagination(totalItems, limit) {
    const paginationContainer = document.getElementById("pagination-container");
    const totalPages = Math.ceil(totalItems / limit);
    paginationContainer.innerHTML = `Total Pages: ${totalPages}`;
}

window.onload = function() {
    const tableSelect = document.getElementById("table-select");
    if (tableSelect.value) {
        loadFilters();
    }
};

function getCurrentFiltersJSON() {
    const tableName = document.getElementById("table-select").value;  // Obtener la tabla seleccionada
    const jsonData = {
        "tableName": tableName,  // Agregar el nombre de la tabla al JSON
        "filters": {
            "tamano": selectedFilters.tamano,
            "ciudad": selectedFilters.ciudad,
            "sector": selectedFilters.sector.flat(),
            "nombre": selectedFilters.nombre,
            "codigo_postal": selectedFilters.codigo_postal
        }
    };
    
    console.log(JSON.stringify(jsonData, null, 2));  // Imprimir en consola con formato
    return jsonData;
}
// Esta función descarga el JSON actual en un archivo .json
function downloadCSV() {
    fetch('/api/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getCurrentFiltersJSON()),  // Asegúrate de que esta función obtenga los filtros correctos
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    })
    .catch(error => console.error('Error descargando CSV:', error));
}



// Abre el modal cuando se hace clic en el botón "CSV"
function openCSVModal() {
    document.getElementById('csvModal').style.display = 'flex';
}

// Cierra el modal
function closeCSVModal() {
    document.getElementById('csvModal').style.display = 'none';
}

function showReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function saveHistoricalReport() {
    const reportName = document.getElementById('reportName').value.trim();
    if (!reportName) {
        alert('Por favor, ingrese un nombre para el reporte');
        return;
    }

    // Get the current filters
    const filtersData = getCurrentFiltersJSON();
    
    // Generate the CSV based on the selected filters
    fetch("/api/full", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(filtersData), // Send filters as JSON in the body
    })
    .then(response => response.blob())
    .then(csvBlob => {
        // Create FormData to send the file along with the report name
        const formData = new FormData();
        formData.append('csvFile', csvBlob, `${reportName}.csv`);
        formData.append('fileName', reportName);

        // Send the CSV file to the server for saving
        fetch("/api/save-historical-report", {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            closeReportModal();
        })
        .catch(error => {
            console.error('Error al guardar el reporte histórico:', error);
            alert('Hubo un error al guardar el reporte histórico.');
        });
    })
    .catch(error => {
        console.error('Error al obtener el reporte histórico:', error);
        alert('Hubo un error al generar el reporte histórico.');
    });
}
