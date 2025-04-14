// Funciones para mostrar/ocultar el modal
function showModal() {
  document.getElementById("confirmationModal").style.display = "block";
}

function hideModal() {
  document.getElementById("confirmationModal").style.display = "none";
}

// Función para obtener los datos del formulario
function getFormData() {
  return {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    location: document.getElementById("selectedValues").value.split(","),  // Asegúrate de que sea un array
    industries: document.getElementById("selectedIndustries").value.split(","),  // Asegúrate de que sea un array
    company_sizes: document.getElementById("selectedSizes").value.split(","),  // Asegúrate de que sea un array
    tabla: document.getElementById("tabla").value,  // "tabla" tal como lo quieres en el JSON
    pages_per_size: document.getElementById("pages_per_size").value
  };
}

// Función para ejecutar la acción "Ejecutar"
function ejecutarAccion(formData) {
  console.log("Datos enviados al servidor:", formData); // Para verificar los datos antes de enviarlos

  fetch("http://localhost:3000/api/scraper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData) // Aquí ya estás enviando el JSON correcto
  })
  .then(response => response.json())
  .then(data => {
    console.log("Respuesta del servidor:", data);
    // Aquí puedes agregar notificaciones o redirecciones según convenga
  })
  .catch(error => {
    console.error("Error:", error);
    alert("Hubo un error al intentar enviar los datos al backend.");
  });
}

// Función para guardar la configuración
function guardarConfiguracion(formData) {
  fetch("http://localhost:3000/api/save-config", { // Cambia el endpoint según tu backend
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    console.log("Configuración guardada:", data);
    // Notificar al usuario si es necesario
  })
  .catch(error => console.error("Error:", error));
}

// Intercepta el submit del formulario para mostrar el modal
document.getElementById("urlsForm").addEventListener("submit", function (event) {
  event.preventDefault();
  showModal();
});

// Eventos para los botones del modal
document.getElementById("btnEjecutar").addEventListener("click", function () {
  const formData = getFormData();
  hideModal();
  ejecutarAccion(formData);
});

document.getElementById("btnGuardar").addEventListener("click", function () {
  const formData = getFormData();
  hideModal();
  guardarConfiguracion(formData);
});

// Evento para cerrar el modal al hacer clic en la tachita
document.getElementById("modalClose").addEventListener("click", function () {
  hideModal();
});
