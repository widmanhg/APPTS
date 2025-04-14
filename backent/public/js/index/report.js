document.getElementById('saveReportButton').addEventListener('click', showReportModal);

function showReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function saveReport() {
    const reportName = document.getElementById('reportName').value.trim();
    if (reportName === "") {
        alert("Por favor, ingrese un nombre para el reporte.");
        return;
    }
    alert("Reporte guardado como: " + reportName);
    closeReportModal();
}