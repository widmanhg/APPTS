// Obtener referencias al modal y botones de descarga
const downloadModal = document.getElementById('download-modal');
const cancelDownloadBtn = document.getElementById('cancel-download');
const confirmDownloadBtn = document.getElementById('confirm-download');

// Mostrar el modal
function openDownloadModal() {
    downloadModal.style.display = 'flex';
}

// Cerrar el modal
function closeDownloadModal() {
    downloadModal.style.display = 'none';
}

// Cancelar la descarga
cancelDownloadBtn.addEventListener('click', () => {
    closeDownloadModal();
});

// También cerrar si clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target === downloadModal) {
        closeDownloadModal();
    }
});

// Confirmar descarga de CSV
confirmDownloadBtn.addEventListener('click', () => {
    fetch('/get-employees')
        .then(response => response.json())
        .then(data => {
            const headers = ['Nombre', 'Cargo', 'Empresa', 'Sector', 'Perfil'];
            const rows = data.map(d => [
                d.empleado.Nombre,
                d.empleado.Cargo,
                d.empresa,
                d.sector,
                d.empleado.Perfil
            ]);

            let csvContent = 'data:text/csv;charset=utf-8,' + 
                headers.join(',') + '\n' +
                rows.map(r => r.map(val => `"${val}"`).join(',')).join('\n');

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'empleados.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => console.error('Error al descargar empleados:', error))
        .finally(() => {
            closeDownloadModal();
        });
});
