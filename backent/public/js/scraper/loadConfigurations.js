const configModal = document.getElementById("configModal");
const closeConfigModal = document.getElementById("closeConfigModal");
const jsonModal = document.getElementById("jsonModal");
const configFileList = document.getElementById("configFileList");
const jsonTableContainer = document.getElementById("jsonTableContainer");
const executeButton = document.getElementById("executeButton");
const deleteButton = document.getElementById("deleteButton");

let currentFile = "";
let originalJson = {};

async function fetchApiData() {
  try {
    const [industriesRes, sizeRes, locationRes] = await Promise.all([
      fetch("/api/industry"),
      fetch("/api/size"),
      fetch("/api/location")
    ]);
    return {
      industries: await industriesRes.json(),
      size: await sizeRes.json(),
      location: await locationRes.json()
    };
  } catch (err) {
    console.error("Error cargando datos:", err);
    return { industries: {}, size: {}, location: {} };
  }
}

function mapValue(key, value, dataMaps) {
  if (!Array.isArray(value)) return value;

  if (key === "location") {
    return value.map(id => dataMaps.location[id] || id).join(", ");
  } else if (key === "industries") {
    return value.map(id => dataMaps.industries[id] || id).join(", ");
  } else if (key === "company_sizes") {
    return value.map(val => {
      switch (val) {
        case "B": return "De 2 a 10 empleados";
        case "C": return "De 11 a 50 empleados";
        case "D": return "De 51 a 200 empleados";
        case "E": return "De 201 a 500 empleados";
        case "F": return "De 501 a 1000 empleados";
        default: return val;
      }
    }).join(", ");
  }

  return value;
}

async function loadConfigurations() {
  configModal.style.display = "block";
  configFileList.innerHTML = "";

  const dataMaps = await fetchApiData();

  try {
    const res = await fetch("/api/configurations");
    const files = await res.json();

    if (files.length === 0) {
      configFileList.innerHTML = "<li>No hay archivos disponibles</li>";
      return;
    }

    files.forEach(file => {
      const item = document.createElement("li");
      item.textContent = file;
      item.classList.add("config-item");

      item.addEventListener("click", async () => {
        currentFile = file;
        try {
          const fileRes = await fetch(`/api/configurations/${file}`);
          originalJson = await fileRes.json();

          const table = document.createElement("table");
          table.innerHTML = `
            <thead><tr><th>Clave</th><th>Valor</th></tr></thead>
            <tbody>
              ${Object.entries(originalJson).map(([key, val]) => `
                <tr>
                  <td>${key}</td>
                  <td>${mapValue(key, val, dataMaps)}</td>
                </tr>`).join("")}
            </tbody>`;

          jsonTableContainer.innerHTML = "";
          jsonTableContainer.appendChild(table);

          configModal.style.display = "none";
          jsonModal.style.display = "block";
        } catch (err) {
          console.error("Error al leer archivo:", err);
        }
      });

      configFileList.appendChild(item);
    });
  } catch (err) {
    console.error("Error al cargar archivos:", err);
    configFileList.innerHTML = "<li>Error al cargar archivos</li>";
  }
}

closeConfigModal.onclick = () => configModal.style.display = "none";

executeButton.onclick = async () => {
  const jsonToSend = JSON.parse(JSON.stringify(originalJson));

  if (jsonToSend.company_sizes) {
    jsonToSend.company_sizes = jsonToSend.company_sizes.map(text => {
      switch (text) {
        case "De 11 a 50 empleados": return "C";
        case "De 51 a 200 empleados": return "D";
        case "De 201 a 500 empleados": return "E";
        case "De 501 a 1000 empleados": return "F";
        default: return text;
      }
    });
  }

  // Imprime el JSON final en la consola
  console.log("JSON a enviar:", JSON.stringify(jsonToSend, null, 2));

  // Oculta el modal si quieres cerrar después de ejecutar
  jsonModal.style.display = "none";

  try {
    const res = await fetch("/api/get-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonToSend)
    });

    const result = await res.json();
    console.log("Respuesta del servidor:", result);

    alert("Solicitud enviada correctamente.");
  } catch (err) {
    console.error("Error al enviar configuración:", err);
    alert("Ocurrió un error al enviar la configuración.");
  }
};




deleteButton.onclick = async () => {
  if (!currentFile) return;
  if (!confirm(`¿Eliminar archivo ${currentFile}?`)) return;

  try {
    const res = await fetch(`/api/configurations/${currentFile}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("Archivo eliminado");
      jsonModal.style.display = "none";
      loadConfigurations(); // recargar lista
    } else {
      alert("No se pudo eliminar el archivo");
    }
  } catch (err) {
    console.error("Error al eliminar:", err);
  }
};

window.onclick = (e) => {
  if (e.target === configModal) configModal.style.display = "none";
  if (e.target === jsonModal) jsonModal.style.display = "none";
};
