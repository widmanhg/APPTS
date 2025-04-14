(function () {
  const empresaSizeMap = {
    " ": "No especificar",
    "B": "Entre 1 y 10 empleados",
    "C": "De 11 a 50 empleados",
    "D": "De 51 a 200 empleados",
    "E": "De 201 a 500 empleados",
    "F": "De 501 a 1000 empleados",
    "G": "De 1001 a 5000 empleados",
    "H": "De 5001 a 10000 empleados",
    "I": "Más de 10001 empleados"
  };

  const inputEmpresaSize = document.getElementById('input-tamano');
  const dropdownEmpresaSize = document.getElementById('dropdown-tamano');
  const empresaSizeSelectorValues = new Set();

  // Llenar el dropdown con opciones
  for (const [code, label] of Object.entries(empresaSizeMap)) {
    const option = document.createElement('label');
    option.innerHTML = `<input type="checkbox" value="${code}"> ${label}`;
    dropdownEmpresaSize.appendChild(option);
  }

  // Mostrar u ocultar el dropdown
  inputEmpresaSize.addEventListener('click', (e) => {
    e.stopPropagation(); // evita que se cierre al abrir
    dropdownEmpresaSize.style.display =
      dropdownEmpresaSize.style.display === 'block' ? 'none' : 'block';
  });

  // Actualizar input cuando cambia la selección
  dropdownEmpresaSize.addEventListener('change', () => {
    const checkboxes = dropdownEmpresaSize.querySelectorAll('input[type="checkbox"]');
    const selectedLabels = [];

    empresaSizeSelectorValues.clear();
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        empresaSizeSelectorValues.add(checkbox.value);
        selectedLabels.push(empresaSizeMap[checkbox.value]);
      }
    });

    inputEmpresaSize.value = selectedLabels.join(', ');
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', function (e) {
    if (!dropdownEmpresaSize.contains(e.target) && e.target !== inputEmpresaSize) {
      dropdownEmpresaSize.style.display = 'none';
    }
  });

  // Solo si quieres acceso externo:
  window.getEmpresaSizeCodes = () => Array.from(empresaSizeSelectorValues);
})();