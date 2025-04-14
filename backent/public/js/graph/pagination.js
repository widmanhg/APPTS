const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumbersContainer = document.getElementById('pageNumbersContainer');

let currentPage = 0;
let totalPages = 3;

function showChart(page) {
    // Ocultar todos los gráficos
    document.getElementById('chartSectoresContainer').style.display = 'none';
    document.getElementById('chartCompletitudContainer').style.display = 'none';
    document.getElementById('chartSectorTamanoContainer').style.display = 'none';

    // Mostrar el gráfico correspondiente a la página
    const charts = ['chartSectoresContainer', 'chartCompletitudContainer', 'chartSectorTamanoContainer'];
    document.getElementById(charts[page]).style.display = 'block';

    // Controlar la visibilidad de los botones de navegación
    prevPageBtn.style.display = page > 0 ? 'inline-block' : 'none';
    nextPageBtn.style.display = page < totalPages - 1 ? 'inline-block' : 'none';

    // Actualizar los números de página
    updatePageNumbers(page);
}

function updatePageNumbers(currentPage) {
    pageNumbersContainer.innerHTML = ''; // Limpiar los números de la página
    for (let i = 0; i < totalPages; i++) {
        const pageNumberBtn = document.createElement('button');
        pageNumberBtn.textContent = i + 1;
        pageNumberBtn.classList.add('pageNumberBtn');
        pageNumberBtn.style.margin = '0 5px';

        // Desactivar el botón de la página actual
        pageNumberBtn.disabled = i === currentPage;
        
        // Agregar la clase 'active' al botón de la página actual
        if (i === currentPage) {
            pageNumberBtn.classList.add('active');
        } else {
            pageNumberBtn.classList.remove('active');
        }

        pageNumberBtn.addEventListener('click', () => showChart(i));
        pageNumbersContainer.appendChild(pageNumberBtn);
    }
}

prevPageBtn.addEventListener('click', () => { 
    currentPage--; 
    showChart(currentPage); 
});

nextPageBtn.addEventListener('click', () => { 
    currentPage++; 
    showChart(currentPage); 
});

// Inicializar la paginación
showChart(currentPage);
