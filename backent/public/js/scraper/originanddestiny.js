async function fetchTables(endpoint, selectId) { 
    try {
        console.log(`Enviando solicitud a ${endpoint}...`);
        const response = await fetch(endpoint, { method: 'POST' });
        
        // Verificar si la respuesta es válida
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Tablas obtenidas desde ${endpoint}:`, data);

        // Limpiar el select y agregar opción por defecto
        const selectElement = document.getElementById(selectId);
        selectElement.innerHTML = '<option value="">Seleccione una tabla</option>';

        // Llenar el select con las tablas obtenidas
        data.forEach(table => {
            const option = document.createElement('option');
            option.value = table.table_name; // Asegúrate de que 'table_name' esté presente en la respuesta de la API
            option.textContent = table.table_name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al obtener las tablas:', error);
    }
}

// Llamar a la función para llenar los selects de los formularios
document.addEventListener('DOMContentLoaded', function () {
    // Llamada para el select de "Tabla destino"
    fetchTables('/api/tables', 'select-tabla-destino'); // Asegúrate de que el endpoint sea correcto

    // Llamada para el select de "Tabla origen"
    fetchTables('/api/tablesurl', 'select-tabla-origen');

    // Llamada para el select de "Tabla origen2"
    fetchTables('/api/tablesurl', 'select-tabla-origen2'); // Puedes usar el mismo endpoint si es necesario
});


  const guardarBtn = document.getElementById("btn-guardar");
  const modal = document.getElementById("guardarModal");
  const cancelar = document.getElementById("cancel-create");
  const confirmar = document.getElementById("confirm-create");

  // Mostrar el modal
  guardarBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Ocultar el modal al cancelar
  cancelar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Guardar configuración
  confirmar.addEventListener("click", () => {
    const nombre = document.getElementById("configName").value;
    if (nombre.trim() !== "") {
      alert(`Configuración "${nombre}" guardada correctamente.`);
      modal.style.display = "none";
      // Aquí puedes agregar tu lógica para guardar realmente la configuración
    } else {
      alert("Por favor ingresa un nombre para la configuración.");
    }
  });

  // Ocultar el modal si se hace clic fuera del contenido
  window.addEventListener("click", (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  });   function closeModalInfo() {
    const modalInfo = document.getElementById("modal-create-table-info");
    modalInfo.style.display = "none";
  }



