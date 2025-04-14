document.addEventListener("DOMContentLoaded", () => {
    loadReportsList();
    document.getElementById("fechaDesde").addEventListener("change", filterReports);
    document.getElementById("fechaHasta").addEventListener("change", filterReports);
});

let reportsData = [];

function loadReportsList() {
    fetch('http://localhost:3000/api/list-reports')
        .then(response => response.json())
        .then(files => {
            const tableBody = document.querySelector("#history-table tbody");
            tableBody.innerHTML = '';

            if (files.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">No hay reportes disponibles.</td></tr>';
                return;
            }

            let promises = files.map(fileName =>
                fetch(`http://localhost:3000/api/report-details/${encodeURIComponent(fileName)}`)
                    .then(response => response.json())
                    .then(details => ({
                        fileName: details.fileName,
                        date: formatDate(details.fileName),
                        name: cleanFileName(details.fileName),
                        columns: cleanHeaders(details.headers),
                        rowCount: details.rowCount,
                        downloadUrl: `http://localhost:3000/api/download/${encodeURIComponent(details.fileName)}`
                    }))
                    .catch(error => {
                        console.error(`Error al cargar detalles del reporte ${fileName}:`, error);
                        return null;
                    })
            );

            Promise.all(promises).then(results => {
                reportsData = results.filter(Boolean);
                renderTable(reportsData);
            });
        })
        .catch(error => console.error('Error al cargar reportes:', error));
}

function renderTable(data) {
    const tableBody = document.querySelector("#history-table tbody");
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No hay reportes disponibles.</td></tr>';
        return;
    }

    data.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="report-select" data-filename="${report.fileName}"></td>
            <td>${report.date}</td>
            <td>${report.name}</td>
            <td>${report.columns}</td>
            <td>${report.rowCount}</td>
            <td class="actions-cell">
                <a href="${report.downloadUrl}" download class="download-btn">
                    <i class="fas fa-arrow-down"></i>
                </a>
                <button class="delete-btn" data-filename="${report.fileName}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteReport);
    });
}

function formatDate(fileName) {
    const match = fileName.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    if (!match) return 'Fecha no disponible';
    const dateParts = match[0].split('T')[0].split('-');
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
}

function cleanFileName(fileName) {
    return fileName.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*\.csv$/, '');
}

function cleanHeaders(headers) {
    return headers.map(header => header.replace(/ ×$/, '')).join(', ');
}

function filterReports() {
    const fechaDesde = document.getElementById("fechaDesde").value;
    const fechaHasta = document.getElementById("fechaHasta").value;

    const startDate = fechaDesde ? new Date(fechaDesde) : null;
    const endDate = fechaHasta ? new Date(fechaHasta) : null;

    const filteredReports = reportsData.filter(report => {
        const reportDate = new Date(report.date.split("/").reverse().join("-"));

        const isAfterStartDate = startDate ? reportDate >= startDate : true;
        const isBeforeEndDate = endDate ? reportDate <= endDate : true;

        return isAfterStartDate && isBeforeEndDate;
    });

    renderTable(filteredReports);
}

function deleteReport(event) {
    const button = event.currentTarget;
    const fileName = button.getAttribute('data-filename');
    showDeleteModal(fileName);
}

function showDeleteModal(fileName) {
    const modal = document.getElementById("delete-modal");
    const confirmButton = document.getElementById("confirm-delete");
    const cancelButton = document.getElementById("cancel-delete");

    modal.style.display = 'flex';

    confirmButton.onclick = () => {
        deleteFile(fileName);
        closeModal();
    };

    cancelButton.onclick = closeModal;
}

function closeModal() {
    document.getElementById("delete-modal").style.display = 'none';
}

function deleteFile(fileName) {
    fetch(`http://localhost:3000/api/delete-report/${encodeURIComponent(fileName)}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                loadReportsList();
            } else {
                alert('Error al eliminar el reporte');
            }
        })
        .catch(error => console.error('Error al eliminar el archivo:', error));
}
