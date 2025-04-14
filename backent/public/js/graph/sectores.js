const chartSectores = document.getElementById('chartSectores').getContext('2d');
let sectoresChart;

// Función para mostrar el modal con los datos recibidos
function showModal(data, sector, selectedReport) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalList = document.getElementById("modal-list");
    const closeButton = document.querySelector(".close");

    // Establecer el título del modal
    modalTitle.textContent = `${sector}`;

    // Limpiar contenido anterior
    modalList.innerHTML = "";

    // Validar que existan empresas
    if (data && Array.isArray(data.empresas)) {
        data.empresas.forEach(item => {
            const li = document.createElement("li");

            const textSpan = document.createElement("span");
            textSpan.classList.add("text");
            textSpan.textContent = item;

            const iconSpan = document.createElement("span");
            iconSpan.classList.add("icon");
            iconSpan.innerHTML = "👤";

            iconSpan.addEventListener("click", function () {
                const jsonResponse = {
                    fileName: selectedReport,
                    company: item
                };

                console.log("Enviando solicitud con JSON:", JSON.stringify(jsonResponse));

                fetch("/api/empleadosporempresa", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonResponse)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Datos recibidos:', data);

                    if (data && typeof data.empleados === "string") {
                        data.empleados = JSON.parse(data.empleados);
                    }

                    // Llamar a la función de modal de empleados con sector, datos de empleados y nombre de la empresa
                    openModalWithEmployees(sector, data, item);
                })
                .catch(error => {
                    console.error('Error en la solicitud:', error);
                });
            });

            li.appendChild(textSpan);
            li.appendChild(iconSpan);
            modalList.appendChild(li);
        });
    } else {
        modalList.innerHTML = "<li>Error: No se encontraron empresas</li>";
    }

    // Mostrar y configurar cierre del modal
    modal.style.display = "flex";

    closeButton.onclick = () => modal.style.display = "none";

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}


// Función para reintentar la solicitud fetch en caso de fallos
function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        const attemptFetch = (remainingRetries) => {
            fetch(url, options)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => resolve(data))
                .catch(error => {
                    if (remainingRetries > 0) {
                        console.warn(`Fallo en la solicitud. Reintentando... (${remainingRetries} intentos restantes)`);
                        setTimeout(() => attemptFetch(remainingRetries - 1), delay);
                    } else {
                        reject(error);
                    }
                });
        };

        attemptFetch(retries);
    });
}



// Función para reintentar la solicitud fetch en caso de fallos
function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        const attemptFetch = (remainingRetries) => {
            fetch(url, options)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => resolve(data))
                .catch(error => {
                    if (remainingRetries > 0) {
                        console.warn(`Fallo en la solicitud. Reintentando... (${remainingRetries} intentos restantes)`);
                        setTimeout(() => attemptFetch(remainingRetries - 1), delay);
                    } else {
                        reject(error);
                    }
                });
        };

        attemptFetch(retries);
    });
}

// Función para cargar los sectores y configurar el gráfico
function cargarSectores(selectedReport) {
    fetch(`/api/sectores?fileName=${selectedReport}`)
        .then(response => response.json())
        .then(data => {
            const categorias = Object.entries(data.categoriasCount);

            const treemapData = categorias.flatMap(([categoria, info]) =>
                Object.entries(info.desglose).map(([subcategoria, value]) => ({
                    category: categoria,
                    subcategory: subcategoria,
                    value: value
                }))
            );

            if (sectoresChart) sectoresChart.destroy();

            sectoresChart = new Chart(chartSectores, {
                type: 'treemap',
                data: {
                    datasets: [{
                        tree: treemapData,
                        key: 'value',
                        groups: ['category', 'subcategory'],
                        captions: {
                            display: true,
                            captions: {
                                display: true,
                                formatter(ctx) {
                                    return ctx.raw && ctx.raw.category && ctx.raw.subcategory
                                        ? `${ctx.raw.category} > ${ctx.raw.subcategory}: ${ctx.raw.value}`
                                        : '';
                                }
                            }
                        },
                        backgroundColor: '#a3e6a3',
                        borderColor: 'rgba(0, 0, 0, 0.2)',
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            // Añadir un evento de clic sobre cada sector
            chartSectores.canvas.addEventListener('click', function (event) {
                const activePoints = sectoresChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                if (activePoints.length > 0) {
                    const clickedData = activePoints[0].element.$context.raw;
                    const subcategoria = clickedData._data ? clickedData._data.subcategory : undefined;

                    if (subcategoria) {
                        const jsonResponse = {
                            fileName: selectedReport,  // El archivo CSV que se está utilizando
                            sector: subcategoria      // La subcategoría como sector
                        };

                        // Hacer la petición POST al endpoint con reintentos
                        fetchWithRetry("/api/companiasporsector", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(jsonResponse)
                        })
                        .then(data => {
                            console.log('Respuesta del servidor:', data);
                            showModal(data, subcategoria, selectedReport);
                        })
                        .catch(error => {
                            console.error('Error al hacer la solicitud:', error);
                        });
                    }
                }
            });
        })
        .catch(error => console.error('Error al cargar sectores:', error));
}

