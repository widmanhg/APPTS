// Seleccionar todas las celdas de la tabla
const table = document.getElementById('results');
const formulaInput = document.getElementById('formula-input');
let selectedCell = null;

// Evento para seleccionar una celda y mostrar su contenido en la barra de fórmulas
table.addEventListener('click', function(event) {
    // Solo si se hace clic en una celda
    if (event.target.tagName === 'TD') {
        selectedCell = event.target;  // Guardar la celda seleccionada
        formulaInput.value = selectedCell.innerText;  // Mostrar contenido en la barra de fórmulas
        formulaInput.focus();  // Poner foco en el campo de la barra de fórmulas
    }
});

// Evento para actualizar el contenido de la celda mientras escribes
formulaInput.addEventListener('input', function() {
    if (selectedCell) {
        selectedCell.innerText = formulaInput.value;  // Actualizar la celda en tiempo real
    }
});

let currentPage = 1;
const itemsPerPage = 16; // Número de elementos por página
let totalItems = 0;  // Total de elementos, que se actualizará desde el servidor

function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    
    // Limpiar paginación actual
    paginationContainer.innerHTML = '';

    // Función para crear botones
    function createButton(text, isDisabled, onClick, isActive = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = isDisabled;
        if (isActive) {
            button.classList.add('active');
        }
        button.addEventListener('click', onClick);
        return button;
    }

    // Botón << (Ir al principio)
    paginationContainer.appendChild(createButton('<<', currentPage === 1, () => {
        currentPage = 1;
        loadData();  // Cambiar a loadData() para obtener los datos correctos
    }));

    // Botón < (Página anterior)
    paginationContainer.appendChild(createButton('<', currentPage === 1, () => {
        currentPage--;
        loadData();
    }));

    // Lógica para mostrar páginas
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);

    if (currentPage === totalPages) {
        startPage = Math.max(1, totalPages - 2);
        endPage = totalPages;
    } else if (currentPage === 1) {
        endPage = Math.min(3, totalPages);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createButton(i, i === currentPage, () => {
            currentPage = i;
            loadData();
        }, i === currentPage));
    }

    // Si hay más páginas, agregar "..." y último botón
    if (totalPages > 3 && endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        paginationContainer.appendChild(ellipsis);
        
        paginationContainer.appendChild(createButton(totalPages, currentPage === totalPages, () => {
            currentPage = totalPages;
            loadData();
        }));
    }

    // Botón > (Página siguiente)
    paginationContainer.appendChild(createButton('>', currentPage === totalPages, () => {
        currentPage++;
        loadData();
    }));

    // Botón >> (Ir al final)
    paginationContainer.appendChild(createButton('>>', currentPage === totalPages, () => {
        currentPage = totalPages;
        loadData();
    }));

    // Campo para ingresar el número de página
    const pageInputContainer = document.createElement('div');
    
    const pageInput = document.createElement('input');
    pageInput.type = 'number';
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.value = currentPage;
    pageInput.placeholder = `Página (${currentPage}/${totalPages})`;

    const goButton = document.createElement('button');
    goButton.textContent = 'Ir';
    goButton.addEventListener('click', () => {
        const newPage = parseInt(pageInput.value);
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            loadData();
        }
    });

    pageInputContainer.appendChild(pageInput);
    pageInputContainer.appendChild(goButton);
    paginationContainer.appendChild(pageInputContainer);
}

function loadData() {
    const tableName = document.getElementById("table-select").value;
    if (!tableName) {
        console.error("Error: No se ha seleccionado una tabla.");
        return;
    }

    // Mostrar el JSON enviado a la API para depuración
    const requestData = {
        tableName,
        filters: selectedFilters,  // Pasar los filtros seleccionados
        page: currentPage,
        limit: itemsPerPage
    };
    console.log("Datos enviados a la API:", JSON.stringify(requestData, null, 2));  // Muestra el JSON en consola

    fetch('/api/data', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        const { items, totalItems: total } = data;
        totalItems = total;  // Actualizar totalItems
        loadTableData(items);
        updatePagination();  // Actualizar la paginación después de cargar los datos
    })
    .catch(err => console.error("Error al cargar datos:", err));
}


// Inicialización
window.onload = function() {
    loadData();  // Cargar datos al iniciar
};
