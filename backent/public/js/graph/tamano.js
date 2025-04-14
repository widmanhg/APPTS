const chartSectorTamano = document.getElementById('chartSectorTamano').getContext('2d');
let sectorTamanoChart;

function cargarTamano(selectedReport) {
    fetch(`/api/categoria-tamano?fileName=${selectedReport}`)
        .then(response => response.json())
        .then(data => {
            const sectores = Object.keys(data.detalles); // Ahora sectores son las claves del objeto "detalles"
            const tamanosLabels = new Set(); // Para los tamaños que serán las claves de cada sector
            const tamanosPorSector = {};
            let sectorMayorPromedio = "-", sectorMenorPromedio = "-";
            let mayorPromedio = 0, menorPromedio = Infinity, tamanoMasComun = "-";
            let maxFrecuencia = 0, frecuenciaTamanos = {};

            function encontrarCategoriaMasCercana(tamano) {
                return tamano;
            }

            sectores.forEach(sector => {
                const sectorData = data.detalles[sector]; // Accede a los datos del sector
                let tamanoTotalSector = 0, cantidadEmpresas = 0;

                Object.entries(sectorData).forEach(([tamano, cantidad]) => {
                    const categoriaNormalizada = encontrarCategoriaMasCercana(tamano);
                    if (categoriaNormalizada) {
                        tamanosLabels.add(categoriaNormalizada);
                        if (!tamanosPorSector[categoriaNormalizada]) {
                            tamanosPorSector[categoriaNormalizada] = new Array(sectores.length).fill(0);
                        }
                        tamanosPorSector[categoriaNormalizada][sectores.indexOf(sector)] = cantidad; // Asigna la cantidad a la posición correcta
                        tamanoTotalSector += parseInt(tamano.split(' ')[0]) * cantidad; // Considerando solo la cantidad de empleados
                        cantidadEmpresas += cantidad;
                        frecuenciaTamanos[categoriaNormalizada] = (frecuenciaTamanos[categoriaNormalizada] || 0) + cantidad;
                        if (frecuenciaTamanos[categoriaNormalizada] > maxFrecuencia) {
                            maxFrecuencia = frecuenciaTamanos[categoriaNormalizada];
                            tamanoMasComun = categoriaNormalizada;
                        }
                    }
                });

                if (cantidadEmpresas > 0) {
                    const promedioSector = tamanoTotalSector / cantidadEmpresas;
                    if (promedioSector > mayorPromedio) {
                        mayorPromedio = promedioSector;
                        sectorMayorPromedio = sector;
                    }
                    if (promedioSector < menorPromedio) {
                        menorPromedio = promedioSector;
                        sectorMenorPromedio = sector;
                    }
                }
            });

            document.getElementById('sectorMayorPromedio').innerText = sectorMayorPromedio;
            document.getElementById('sectorMenorPromedio').innerText = sectorMenorPromedio;
            document.getElementById('tamanoMasComun').innerText = tamanoMasComun;

            if (sectorTamanoChart) sectorTamanoChart.destroy();
            sectorTamanoChart = new Chart(chartSectorTamano, {
                type: 'bar',
                data: { 
                    labels: sectores, 
                    datasets: Array.from(tamanosLabels).map((tamano, index) => ({
                        label: tamano, 
                        data: tamanosPorSector[tamano], 
                        backgroundColor: ['#FFD700', '#800080', '#FF4500', '#32CD32', '#1E90FF'][index % 5]
                    }))
                },
                options: {
                    responsive: true, 
                    scales: { 
                        x: { stacked: true, ticks: { display: false } },
                        y: { stacked: true, beginAtZero: true }
                    }
                }
            });
        })
        .catch(error => console.error('Error al cargar tamaño:', error));
}
