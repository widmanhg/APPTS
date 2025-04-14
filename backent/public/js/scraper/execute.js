    // Función para abrir el modal
    function abrirModal() {
      const modal = document.getElementById('unique-modal');
      modal.style.display = 'flex';
  }

  // Función para cerrar el modal (Cancelar)
  function cancelarModal() {
      const modal = document.getElementById('unique-modal');
      modal.style.display = 'none';
  }

  // Función para capturar los datos, mostrar en consola y enviar el JSON
  function confirmarDatos() {
      const selectTablaOrigen = document.getElementById('select-tabla-origen2');
      const selectTablaDestino = document.getElementById('select-tabla-destino');
      
      const tablaOrigen = selectTablaOrigen.value;
      const tablaDestino = selectTablaDestino.value;

      const jsonData = {
          "tabla_origen": tablaOrigen,
          "tabla_destino": tablaDestino
      };

      console.log(JSON.stringify(jsonData));

      // Llamar a la función para enviar el JSON al servidor
      postData(jsonData);

      // Cerrar el modal
      cancelarModal();
  }

  // Función para enviar el JSON al servidor utilizando axios
  function postData(data) {
      axios.post('/api/scrape', data)
          .then(response => {
              console.log('Respuesta del servidor:', response.data);
          })
          .catch(error => {
              console.error('Error al enviar datos al servidor:', error);
          });
  }