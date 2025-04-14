async function sendInChunks(data, tableName, chunkSize = 50) {
    let isFirstChunk = true; // La primera llamada debe truncar la tabla

    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        try {
            const response = await fetch('http://localhost:3000/api/update-table', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tableName, data: chunk, isFirstChunk })
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }

            isFirstChunk = false; // Solo la primera tanda debe truncar la tabla
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error en la conexión o en el servidor.');
            return;
        }
    }
}


async function saveChanges() {
    const tableBody = document.getElementById('table-body');
    const rows = tableBody.getElementsByTagName('tr');
    const tableName = document.getElementById('table-select').value;

    if (!tableName) {
        alert("Debes seleccionar una tabla antes de guardar.");
        return;
    }

    const data = [];
    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        const rowData = {
            id: cells[0].innerText.trim(),
            nombre: cells[1].innerText.trim(),
            resumen: cells[2].innerText.trim(),
            telefono: cells[3].innerText.trim(),
            tamano: cells[4].innerText.trim(),
            ubicaciones: cells[5].innerText.trim(),
            sector: parseArray(cells[6].innerText),
            sede: parseArray(cells[7].innerText),
            codigo_postal: cells[8].innerText.trim(),
            ciudad: cells[9].innerText.trim()
        };
        data.push(rowData);
    }

    try {
        await sendInChunks(data, tableName);
        alert("Cambios guardados correctamente.");
        document.getElementById("save-changes-btn").disabled = true; // Desactivar botón tras guardar
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error en la conexión o en el servidor.');
    }
}

// Convierte texto en array si es necesario
function parseArray(text) {
    const trimmed = text.trim();
    return trimmed.includes(',') ? trimmed.split(',').map(t => t.trim()) : [trimmed];
}

// Detectar cambios en la tabla
function detectChanges() {
    document.getElementById("save-changes-btn").disabled = false;
}

// Hacer la tabla editable y detectar cambios
function makeTableEditable() {
    const tableBody = document.getElementById("table-body");
    tableBody.addEventListener("focusout", detectChanges); // Detectar cambios al salir de una celda

    const cells = tableBody.getElementsByTagName("td");
    for (let cell of cells) {
        cell.contentEditable = true;
    }
}

// Esperar a que el DOM cargue antes de hacer la tabla editable
document.addEventListener("DOMContentLoaded", makeTableEditable);
