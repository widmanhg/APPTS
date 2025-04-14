const chartCompletitud = document.getElementById('chartCompletitud').getContext('2d');
const chartCompletitudCategoria = document.getElementById('chartCompletitudCategoria').getContext('2d');

let completitudChart, completitudCategoriaChart;

function cargarCompletitud(selectedReport) {
    fetch(`/api/completitud?fileName=${selectedReport}`)
        .then(response => response.json())
        .then(data => {
            const margenTolerancia = 0.1;
            let registrosCompletos = 0, registrosIncompletos = 0;

            data.detalles.forEach(entry => {
                const completitud = parseFloat(entry.completitud);
                if (Math.abs(completitud - 100) < margenTolerancia) {
                    registrosCompletos++;
                } else {
                    registrosIncompletos++;
                }
            });

            document.getElementById('completitudPromedio').innerText = `${data.promedio_completitud}%`;
            document.getElementById('porcentajeCompletos').innerText = `${registrosCompletos}`;
            document.getElementById('porcentajeIncompletos').innerText = `${registrosIncompletos}`;

            if (completitudChart) completitudChart.destroy();
            if (completitudCategoriaChart) completitudCategoriaChart.destroy();

            completitudChart = new Chart(chartCompletitud, {
                type: 'doughnut',
                data: {
                    labels: ['Completitud', 'Faltante'],
                    datasets: [{
                        data: [data.promedio_completitud, 100 - data.promedio_completitud],
                        backgroundColor: ['#36a2eb', '#e0e0e0']
                    }]
                }
            });

            const categorias = data.completitud_por_categoria.map(entry => entry.categoria);
            const completitudes = data.completitud_por_categoria.map(entry => entry.completitud);

            completitudCategoriaChart = new Chart(chartCompletitudCategoria, {
                type: 'bar',
                data: { labels: categorias, datasets: [{ label: 'Completitud por Categoría', data: completitudes, backgroundColor: '#36a2eb' }] },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    scales: { x: { beginAtZero: true } },
                    plugins: {
                        datalabels: {
                            anchor: 'center',
                            align: 'center',
                            color: '#fff',
                            font: { weight: 'bold', size: 14 },
                            formatter: (value, context) => context.chart.data.labels[context.dataIndex]
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error al cargar completitud:', error));
}
