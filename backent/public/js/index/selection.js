

// Función para obtener las tablas de la base de datos
async function fetchTables() {
    try {
        console.log('Enviando solicitud a /api/tables...');
        const response = await fetch('http://localhost:3000/api/tables', { method: 'POST' });
        const data = await response.json();
        console.log('Tablas obtenidas:', data);
        tablesList = data;
        const tableSelect = document.getElementById('table-select');
        tableSelect.innerHTML = '<option value="">Selecciona una tabla</option>'; // Limpiar las opciones anteriores
        data.forEach(table => {
            const option = document.createElement('option');
            option.value = table.table_name;
            option.textContent = table.table_name;
            tableSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al obtener las tablas:', error);
    }
}



document.addEventListener("DOMContentLoaded", () => {
    const tableSelect = document.getElementById('table-select');
    const importButton = document.querySelector('#database-selection button');
    const tableBody = document.getElementById('table-body');
  
    fetch('http://localhost:3000/api/tables', { method: 'POST' })
    .then(response => response.json())
    .then(tables => {
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table.table_name;
            option.textContent = table.table_name;
            tableSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error al obtener las tablas:', error);
    });

    importButton.addEventListener('click', () => {
        const selectedTable = tableSelect.value;
        
        if (!selectedTable) {
            alert('Por favor selecciona una tabla');
            return;
        }
        
        console.log('Enviando solicitud a /api/data con la tabla:', selectedTable);

        fetch('http://localhost:3000/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tableName: selectedTable })
        })
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = '';
            
            const columnOrder = ["id", "nombre", "resumen", "tamano", "ubicaciones", "sector", "sede", "codigo_postal", "ciudad","empleados"];
            
            data.forEach(row => {
                const tr = document.createElement('tr');

                // Insertar las celdas en el orden correcto
                columnOrder.forEach(columnName => {
                    const td = document.createElement('td');
                    td.textContent = row[columnName] || '';
                    td.contentEditable = true;
                    td.addEventListener('input', () => {
                        row[columnName] = td.textContent;
                    });
                    tr.appendChild(td);
                });

                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error al obtener los datos:', error);
        });
    });

    function toggleDatabaseSelection() {
        const databaseSelection = document.getElementById('database-selection');
        const isVisible = databaseSelection.style.display !== 'none';
        databaseSelection.style.display = isVisible ? 'none' : 'block';
    }
});



        // Abre el modal de filtros
        function toggleDatabaseSelection() {
            const modal = document.getElementById('modal');
            modal.style.display = 'flex';
        }

        // Cierra el modal de filtros
        function closeModal() {
            const modal = document.getElementById('modal');
            modal.style.display = 'none';
        }

        // Lógica para guardar el reporte (puedes personalizar esta función)
        function saveReport() {
            const reportName = document.getElementById('reportName').value;
            console.log(`Report saved with name: ${reportName}`);
            closeModal();
        }