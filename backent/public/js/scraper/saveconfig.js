function saveconfig() {
    const configName = document.getElementById("configName").value.trim();
  
    if (!configName) {
        alert("Por favor, ingrese un nombre para la configuración.");
        return;
    }
  
    // Realizar una solicitud GET al endpoint /obtener-json
    fetch("/obtener-json")  // Ajusta la URL si es necesario
        .then(response => response.json())
        .then(data => {
            // Verifica que los datos se hayan obtenido correctamente
            console.log("Datos obtenidos:", data);
  
            // Asignar valor predeterminado de " " si está vacío
            const email = data.email || " ";
            const password = data.password || " ";
            const ubicaciones = document.getElementById("selectedValues")?.value.trim() || " ";
            const tablaOrigen = document.getElementById("select-tabla-origen")?.value || " ";
            const industrias = window.getSelectedIndustries ? window.getSelectedIndustries() : [" "]; // Si está vacío, asigna un array con " "
            const paginas = document.getElementById("input-paginas")?.value || " ";
            const numeroEmpleados = window.getEmpresaSizeCodes ? window.getEmpresaSizeCodes() : [" "]; // Si está vacío, asigna un array con " "
  
            // Obtener las empresas bloqueadas
            const inputEmpresasBloqueadas = document.getElementById("blocked-companies");
            let empresasBloqueadas = [];
  
            if (inputEmpresasBloqueadas && inputEmpresasBloqueadas.value.trim() !== "") {
                empresasBloqueadas = inputEmpresasBloqueadas.value
                    .split(",") // Separar por comas
                    .map(e => e.trim()) // Eliminar espacios extra
                    .filter(e => e !== ""); // Filtrar valores vacíos
            } else {
                empresasBloqueadas = [" "]; // Asignar valor predeterminado si está vacío
            }
  
            // Para 'ubicaciones', dividir por comas y quitar los espacios extras
            const locationsArray = ubicaciones
                .split(",")  // Separar por comas
                .map(location => location.trim())  // Eliminar espacios extra
                .filter(location => location !== ""); // Eliminar valores vacíos
  
            // Crear el objeto con los datos del formulario
            const jsonData = {
                email: email,
                password: password,
                pages_per_size: paginas,
                tabla: tablaOrigen,
                location: locationsArray.length > 0 ? locationsArray : [" "], // Si está vacío, asigna un array con " "
                industries: industrias.length > 0 ? industrias : [" "], // Si está vacío, asigna un array con " "
                company_sizes: numeroEmpleados.length > 0 ? numeroEmpleados : [" "], // Si está vacío, asigna un array con " "
                ban: empresasBloqueadas.length > 0 ? empresasBloqueadas : [" "] // Si está vacío, asigna un array con " "
            };
  
            // Guardar los datos usando el endpoint para guardarlos
            fetch('/api/save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: configName,  // El nombre del archivo será lo que el usuario ingrese
                    configData: jsonData   // Los datos del formulario
                })
            })
            .then(response => response.json())
            .then(responseData => {
                if (responseData.message === "Configuración guardada exitosamente.") {
                    alert("Configuración guardada correctamente.");
                    closeSaveModal();  // Cerrar el modal después de guardar
                } else {
                    alert("Hubo un error al guardar la configuración.");
                }
            })
            .catch(error => {
                console.error("Error al guardar configuración:", error);
                alert("Hubo un error al guardar la configuración.");
            });
        })
        .catch(error => {
            console.error("Error al obtener los datos:", error);
        });
  }
  
  // Función para cerrar el modal
  function closeSaveModal() {
    document.getElementById("guardarModal").style.display = "none";
  }
  
  // Función para cancelar la acción
  function cancelarAccion() {
    closeSaveModal();
  }
  

// Función para cerrar el modal
function closeSaveModal() {
  document.getElementById("guardarModal").style.display = "none";
}

// Función para cancelar la acción
function cancelarAccion() {
  closeSaveModal();
}
