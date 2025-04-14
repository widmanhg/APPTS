// Variables globales para el modal
let employeeToDelete = null;
let cardToDelete = null;

// Obtener referencias al modal y botones
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// Mostrar el modal
function openDeleteModal(employee, card) {
    employeeToDelete = employee;
    cardToDelete = card;
    deleteModal.style.display = 'flex';
}

// Cerrar el modal
function closeDeleteModal() {
    deleteModal.style.display = 'none';
    employeeToDelete = null;
    cardToDelete = null;
}

// Confirmar eliminación
confirmDeleteBtn.addEventListener('click', () => {
    if (!employeeToDelete) return;

    fetch('/delete-employee', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: employeeToDelete.Nombre })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            console.log(`Empleado ${employeeToDelete.Nombre} eliminado.`);
            if (cardToDelete) cardToDelete.remove();
        } else {
            console.error('Error al eliminar al empleado:', result.error);
        }
    })
    .catch(error => {
        console.error('Error al eliminar al empleado:', error);
    })
    .finally(() => {
        closeDeleteModal();
    });
});

// Cancelar eliminación
cancelDeleteBtn.addEventListener('click', () => {
    closeDeleteModal();
});

// También cerrar el modal si se hace clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Obtener los empleados desde el backend
fetch('/get-employees')
    .then(response => response.json())
    .then(data => {
        const container = document.querySelector('.employee-cards-container');

        const nextFlag = {
            green: 'yellow',
            yellow: 'red',
            red: 'green'
        };

        data.forEach(employeeData => {
            const employee = employeeData.empleado;
            const card = document.createElement('div');
            card.classList.add('employee-card');

            // Foto de empleado
            const photo = document.createElement('img');
            photo.src = employee.Foto;
            photo.alt = employee.Nombre;
            photo.classList.add('employee-photo');

            // Información del empleado
            const info = document.createElement('div');
            info.classList.add('employee-info');

            const name = document.createElement('div');
            name.classList.add('employee-name');
            name.textContent = employee.Nombre;

            const position = document.createElement('div');
            position.classList.add('employee-position');
            position.textContent = employee.Cargo;

            const company = document.createElement('div');
            company.classList.add('employee-company');
            company.textContent = employeeData.empresa;

            const sector = document.createElement('div');
            sector.classList.add('employee-sector');
            sector.textContent = employeeData.sector;

            info.appendChild(name);
            info.appendChild(position);
            info.appendChild(company);
            info.appendChild(sector);

            // Pie de la tarjeta con bandera, LinkedIn e ícono de basura
            const footer = document.createElement('div');
            footer.classList.add('employee-footer');

            const flag = document.createElement('div');
            flag.classList.add('flag', employeeData.flag);

            // Evento para cambiar bandera
            flag.addEventListener('click', () => {
                const currentFlag = employeeData.flag;
                const newFlag = nextFlag[currentFlag];

                flag.classList.remove(currentFlag);
                flag.classList.add(newFlag);
                employeeData.flag = newFlag;

                fetch("/update-flag", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre: employee.Nombre,
                        newFlag: newFlag
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        console.log(`Flag actualizado a ${newFlag} para ${employee.Nombre}`);
                    } else {
                        console.error('Error al actualizar el flag:', result.error);
                    }
                })
                .catch(error => {
                    console.error('Error en la solicitud de actualización:', error);
                });
            });

            const linkedinIcon = document.createElement('a');
            linkedinIcon.href = employee.Perfil;
            linkedinIcon.target = '_blank';
            linkedinIcon.innerHTML = `<i class="fab fa-linkedin"></i>`;

            const trashIcon = document.createElement('span');
            trashIcon.classList.add('trash');
            trashIcon.innerHTML = "🗑️";

            // Evento para mostrar el modal de confirmación
            trashIcon.addEventListener('click', () => {
                openDeleteModal(employee, card);
            });

            footer.appendChild(flag);
            footer.appendChild(linkedinIcon);
            footer.appendChild(trashIcon);

            card.appendChild(photo);
            card.appendChild(info);
            card.appendChild(footer);

            container.appendChild(card);
        });
    })
    .catch(error => console.error('Error al cargar los empleados:', error));
