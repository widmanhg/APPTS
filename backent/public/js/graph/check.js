const reportSelect = document.getElementById('reportSelector');
const chartsContainer = document.getElementById('chartsContainer');

fetch("/api/list-reports")
    .then(response => response.json())
    .then(reports => {
        reports.forEach(report => {
            const option = document.createElement("option");
            option.value = report;
            option.textContent = report;
            reportSelect.appendChild(option);
        });
    });

reportSelect.addEventListener('change', (event) => {
    const selectedReport = event.target.value;
    if (!selectedReport) return;

    chartsContainer.style.display = "block";

    cargarSectores(selectedReport);
    cargarCompletitud(selectedReport);
    cargarTamano(selectedReport);

    showChart(currentPage);
});
