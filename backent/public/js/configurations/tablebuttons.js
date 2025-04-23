


  async function loadTables(modalType) {
    const selectedType = document.querySelector('input[name="sourceType"]:checked').value;
    const endpoint = selectedType === "url" ? '/api/tablesurl' : '/api/tables';

    try {
        const response = await fetch(endpoint, { method: 'POST' });
        const data = await response.json();

        if (modalType === "concatenate") {
            const select1 = document.getElementById("concatTableSelect1");
            const select2 = document.getElementById("concatTableSelect2");

            select1.innerHTML = '';
            select2.innerHTML = '';

            data.forEach(table => {
                const option1 = document.createElement('option');
                option1.value = table.table_name;
                option1.textContent = table.table_name;

                const option2 = document.createElement('option');
                option2.value = table.table_name;
                option2.textContent = table.table_name;

                select1.appendChild(option1);
                select2.appendChild(option2);
            });
        } else {
            const selectId = modalType + "TableSelect";
            const tableSelect = document.getElementById(selectId);

            tableSelect.innerHTML = '';
            data.forEach(table => {
                const option = document.createElement('option');
                option.value = table.table_name;
                option.textContent = table.table_name;
                tableSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al obtener las tablas', error);
        alert('Hubo un problema al cargar las tablas');
    }
}





// Abrir el modal y cargar las tablas
function openModal(modalType) {
    document.getElementById('modal-' + modalType).style.display = 'flex';
    loadTables(modalType);
}

// Cerrar el modal
function closeModal(modalType) {
    document.getElementById('modal-' + modalType).style.display = 'none';
}

// Eliminar tabla seleccionada
async function deleteTable() {
    const tableName = document.getElementById('deleteTableSelect').value;
    if (!tableName) return alert('Selecciona una tabla');

    try {
        const response = await fetch(`/api/table/${tableName}`, { method: 'DELETE' });
        const message = await response.text();
        alert(message);
        closeModal('delete');
    } catch (error) {
        console.error('Error al eliminar la tabla', error);
        alert('Hubo un problema al eliminar la tabla');
    }
}

// Vaciar tabla seleccionada
async function clearTable() {
    const tableName = document.getElementById('clearTableSelect').value;
    if (!tableName) return alert('Selecciona una tabla');

    try {
        const response = await fetch(`/api/table/${tableName}/clear`, { method: 'POST' });
        const message = await response.text();
        alert(message);
        closeModal('clear');
    } catch (error) {
        console.error('Error al vaciar la tabla', error);
        alert('Hubo un problema al vaciar la tabla');
    }
}

// Renombrar tabla seleccionada
async function renameTable() {
    const tableName = document.getElementById('renameTableSelect').value;
    const userInput = document.getElementById('newTableName').value;
    if (!tableName || !userInput) return alert('Selecciona una tabla y proporciona un nuevo nombre');

    let newName = userInput.toLowerCase(); // ← Convertir a minúsculas

    // Mantener el prefijo de la tabla original
    if (tableName.startsWith('empresas_')) {
        newName = `empresas_${newName}`;
    } else if (tableName.startsWith('url_')) {
        newName = `url_${newName}`;
    }

    try {
        const response = await fetch('/api/table/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName: tableName, newName: newName })
        });
        const message = await response.text();
        alert(message);
        closeModal('rename');
    } catch (error) {
        console.error('Error al renombrar la tabla', error);
        alert('Hubo un problema al renombrar la tabla');
    }
}

async function copyTable() {
    const tableName = document.getElementById('copyTableSelect').value;
    const userInput = document.getElementById('newTableCopyName').value;
    if (!tableName || !userInput) return alert('Selecciona una tabla y proporciona un nombre para la nueva tabla');

    let newName = userInput.toLowerCase(); // ← Convertir a minúsculas

    if (tableName.startsWith('empresas_')) {
        newName = `empresas_${newName}`;
    } else if (tableName.startsWith('url_')) {
        newName = `url_${newName}`;
    }

    try {
        const response = await fetch('/api/table/copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceTable: tableName, newTable: newName })
        });
        const message = await response.text();
        alert(message);
        closeModal('copy');
    } catch (error) {
        console.error('Error al copiar la tabla', error);
        alert('Hubo un problema al copiar la tabla');
    }
}





// Cargar las tablas cuando la página cargue
window.onload = function() {
    loadTables('delete');
    loadTables('clear');
    loadTables('rename');
    loadTables('copy');
}
