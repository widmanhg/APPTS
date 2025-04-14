"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express")); // Importación de express (con default import)
const pg_1 = require("pg"); // Importación de Pool de pg
const path = __importStar(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios")); // Asegúrate de tener axios instalado
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser")); // Instala: npm install csv-parse
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Habilita el parsing de JSON en Express
app.use(express_1.default.urlencoded({ extended: true }));
// Servir archivos estáticos desde la carpeta 'public'
app.use(express_1.default.static(path.join(__dirname, '../public')));
// Rutas para tus páginas HTML
app.get('/configuration', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'configuration.html'));
});
app.get('/coso', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});
app.get('/graficos', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'graph.html'));
});
app.get('/historico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'hist.html'));
});
app.get('/scraping', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'scrapper.html'));
});
app.get('/directorio', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'directorio.html'));
});
const favoriteDir = path.join(__dirname, '../Archives/favorites');
// Verificar si el directorio existe, si no, crearlo
if (!fs_1.default.existsSync(favoriteDir)) {
    fs_1.default.mkdirSync(favoriteDir, { recursive: true });
}
// Endpoint POST para guardar los favoritos
app.post('/save-favorite', (req, res) => {
    const { empleado, empresa, sector } = req.body;
    // Crear un nombre de archivo único basado en la empresa y el empleado
    const fileName = `${empleado.Nombre.replace(/\s+/g, '_')}_favorite.json`;
    const filePath = path.join(favoriteDir, fileName);
    // Crear el objeto de datos que se va a guardar
    const favoriteData = {
        empleado,
        empresa,
        sector,
        fecha: new Date().toISOString(),
        flag: 'green', // Añadir el campo flag con valor "green" por defecto
    };
    // Guardar el archivo JSON
    fs_1.default.writeFile(filePath, JSON.stringify(favoriteData, null, 2), (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
            return res.status(500).json({ message: 'Error al guardar el archivo' });
        }
        console.log(`Favorito guardado: ${filePath}`);
        res.status(200).json({ message: 'Favorito guardado exitosamente' });
    });
});
app.post('/update-flag', (req, res) => {
    const { nombre, newFlag } = req.body;
    if (!nombre || !newFlag) {
        return res.status(400).json({ success: false, error: 'Faltan datos: nombre o flag.' });
    }
    // Construir el nombre del archivo a partir del nombre del empleado
    const fileName = `${nombre.replace(/\s+/g, '_')}_favorite.json`;
    const filePath = path.join(favoriteDir, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Archivo no encontrado para el empleado.' });
    }
    try {
        const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
        data.flag = newFlag;
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return res.json({ success: true, updatedFlag: newFlag });
    }
    catch (error) {
        console.error('Error actualizando flag:', error);
        return res.status(500).json({ success: false, error: 'Error actualizando el archivo.' });
    }
});
app.delete('/delete-employee', (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ success: false, error: 'Falta el nombre del empleado.' });
    }
    const fileName = `${nombre.replace(/\s+/g, '_')}_favorite.json`;
    const filePath = path.join(favoriteDir, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    try {
        fs_1.default.unlinkSync(filePath);
        return res.json({ success: true, message: `Empleado ${nombre} eliminado correctamente.` });
    }
    catch (error) {
        console.error('Error al eliminar el archivo:', error);
        return res.status(500).json({ success: false, error: 'Error al eliminar el archivo.' });
    }
});
app.get('/get-employees', (req, res) => {
    fs_1.default.readdir(favoriteDir, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio:', err);
            return res.status(500).json({ message: 'Error al leer los empleados' });
        }
        // Filtrar solo archivos JSON
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        // Leer todos los archivos JSON y agregarlos a la lista de empleados
        const employees = []; // Usamos el tipo Employee[]
        jsonFiles.forEach(file => {
            const filePath = path.join(favoriteDir, file);
            const fileData = fs_1.default.readFileSync(filePath, 'utf8');
            const employeeData = JSON.parse(fileData); // Aseguramos que la data esté tipada
            employees.push(employeeData);
        });
        // Enviar los datos de los empleados al frontend
        res.json(employees);
    });
});
const reportsDir = path.join(__dirname, '../Archives/reports');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (!fs_1.default.existsSync(reportsDir)) {
            fs_1.default.mkdirSync(reportsDir, { recursive: true });
        }
        cb(null, reportsDir);
    },
    filename: (req, file, cb) => {
        // Extrae el nombre desde req.body. Si no llega, usa 'reporte_sin_nombre'
        const userFileName = req.body.fileName ? req.body.fileName.trim() : 'reporte_sin_nombre';
        const cleanFileName = userFileName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `${cleanFileName}_${timestamp}.csv`;
        cb(null, filename);
    }
});
// Usamos upload.fields para procesar tanto archivos como campos de texto
const upload = (0, multer_1.default)({ storage: storage });
app.post('/api/save-historical-report', upload.single('csvFile'), (req, res) => {
    console.log("Body recibido:", req.body); // Verifica si `fileName` llega correctamente
    console.log("Archivo recibido:", req.file); // Verifica si el archivo se sube correctamente
    if (!req.file) {
        return res.status(400).json({ message: "No se recibió el archivo CSV." });
    }
    // Leer el nombre del archivo desde req.body
    const userFileName = req.body.fileName ? req.body.fileName.trim() : 'reporte_sin_nombre';
    // Limpiar el nombre para evitar caracteres problemáticos
    const cleanFileName = userFileName.replace(/[^a-zA-Z0-9-_]/g, '_');
    // Agregar timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const finalFileName = `${cleanFileName}_${timestamp}.csv`;
    // Construir la ruta final del archivo
    const finalPath = path.join(reportsDir, finalFileName);
    try {
        // Verifica si el archivo existe antes de intentar renombrarlo
        if (req.file) {
            fs_1.default.renameSync(req.file.path, finalPath);
            res.status(200).json({
                message: `Reporte guardado como ${finalFileName}`,
                file: finalFileName
            });
        }
        else {
            res.status(400).json({ message: "Archivo no recibido correctamente." });
        }
    }
    catch (error) {
        console.error("Error al renombrar el archivo:", error);
        res.status(500).json({ message: "Error al guardar el archivo." });
    }
});
app.get('/api/list-reports', (req, res) => {
    fs_1.default.readdir(reportsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error al leer la carpeta de reportes.' });
        }
        // Filtrar solo archivos CSV
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        res.json(csvFiles);
    });
});
// Endpoint para obtener detalles de un reporte (por ejemplo, los encabezados)
app.get('/api/report-details/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ message: 'Reporte no encontrado.' });
    }
    const headers = [];
    let rowCount = 0;
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('headers', (csvHeaders) => {
        headers.push(...csvHeaders);
    })
        .on('data', (data) => {
        rowCount++; // Opcional, para contar filas
    })
        .on('end', () => {
        res.json({
            fileName,
            headers,
            rowCount
        });
    })
        .on('error', (error) => {
        res.status(500).json({ message: 'Error al procesar el reporte.', error });
    });
});
app.get('/api/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(reportsDir, fileName);
    if (fs_1.default.existsSync(filePath)) {
        res.download(filePath, fileName, err => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                res.status(500).send("Error al descargar el archivo.");
            }
        });
    }
    else {
        res.status(404).send("Archivo no encontrado.");
    }
});
app.delete('/api/delete-report/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ message: 'Reporte no encontrado.' });
    }
    fs_1.default.unlink(filePath, (err) => {
        if (err) {
            console.error("Error al eliminar el reporte:", err);
            return res.status(500).json({ message: 'Error al eliminar el reporte.' });
        }
        res.json({ message: 'Reporte eliminado correctamente.' });
    });
});
const configDir = path.join(__dirname, "../Archives/configurations");
app.post('/api/scraper', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Recibe el JSON del frontend
        const formData = req.body;
        // Reenvía la solicitud al endpoint de FastAPI
        const fastApiResponse = yield axios_1.default.post('http://fastapi_app:8000/url', formData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Devuelve la respuesta de FastAPI al cliente
        res.json(fastApiResponse.data);
    }
    catch (error) {
        console.error('Error al reenviar la solicitud a FastAPI:', error);
        res.status(500).json({ error: 'Error al reenviar la solicitud a FastAPI' });
    }
}));
// Endpoint para listar archivos JSON
app.get("/api/configurations", (req, res) => {
    fs_1.default.readdir(configDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Error al leer la carpeta" });
        }
        const jsonFiles = files.filter(file => file.endsWith(".json"));
        res.json(jsonFiles);
    });
});
// Endpoint para obtener el contenido de un archivo JSON
app.get("/api/configurations/:fileName", (req, res) => {
    const filePath = path.join(configDir, req.params.fileName);
    fs_1.default.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error al leer el archivo" });
        }
        res.json(JSON.parse(data));
    });
});
// Endpoint para eliminar un archivo JSON
app.delete("/api/configurations/:fileName", (req, res) => {
    const filePath = path.join(configDir, req.params.fileName);
    fs_1.default.unlink(filePath, err => {
        if (err) {
            return res.status(500).json({ error: "Error al eliminar el archivo" });
        }
        res.json({ message: "Archivo eliminado correctamente" });
    });
});
app.post('/api/save-config', (req, res) => {
    const { fileName, configData } = req.body;
    // Validar que el nombre de archivo sea válido
    if (!fileName || !configData) {
        return res.status(400).json({ message: "Faltan datos para guardar la configuración." });
    }
    const filePath = path.join(__dirname, 'configurations', `${fileName}.json`);
    // Crear la carpeta si no existe
    if (!fs_1.default.existsSync(path.dirname(filePath))) {
        fs_1.default.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    // Guardar el archivo JSON
    fs_1.default.writeFile(filePath, JSON.stringify(configData, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: "Error al guardar la configuración." });
        }
        res.status(200).json({ message: "Configuración guardada exitosamente." });
    });
});
let isCancelled = false;
app.post("/submit-info-form", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Aquí imprimes los datos que recibes en la consola
    console.log("Datos recibidos:", req.body);
    // Extraemos los datos del cuerpo de la solicitud
    const { email, password, tabla_origen, tabla_destino } = req.body;
    // Creamos el objeto para enviar a la otra API
    const dataToSend = {
        email,
        password,
        tabla_origen,
        tabla_destino,
    };
    // Manejamos la cancelación desde el cliente
    app.post("/cancel-process", (req, res) => {
        isCancelled = true;
        res.status(200).json({ message: "Proceso de scrape cancelado." });
    });
    try {
        // Verificamos si se ha cancelado el proceso
        if (isCancelled) {
            res.status(400).json({ message: "Proceso cancelado desde el cliente." });
            return;
        }
        // Enviamos los datos a la otra API usando Axios
        const response = yield axios_1.default.post('http://fastapi_app:8000/scrape', dataToSend);
        // Si la solicitud es exitosa, devolvemos la respuesta con los datos de la otra API
        res.status(200).json({
            message: "Datos enviados correctamente.",
            responseData: response.data, // Aquí puedes enviar la respuesta de la otra API
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Error al enviar los datos:', error.message);
            res.status(500).json({
                message: 'Error al enviar los datos',
                error: error.message,
            });
        }
        else {
            console.error('Error desconocido:', error);
            res.status(500).json({
                message: 'Error desconocido al enviar los datos',
                error: 'Error desconocido',
            });
        }
    }
    finally {
        // Resetear la bandera de cancelación después de la respuesta
        isCancelled = false;
    }
}));
const pool = new pg_1.Pool({
    user: 'postgres', // Cambia por tu usuario
    host: 'db', // Cambia por tu host
    database: 'prueba', // Cambia por tu base de datos
    password: '1234', // Cambia por tu contraseña
    port: 5432,
});
app.delete('/api/table/:tableName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tableName } = req.params;
    try {
        yield pool.query(`DROP TABLE IF EXISTS "${tableName}"`);
        res.send(`Tabla "${tableName}" eliminada correctamente.`);
    }
    catch (error) {
        console.error('Error al eliminar la tabla', error);
        res.status(500).send('Error al eliminar la tabla');
    }
}));
app.post('/api/table/:tableName/clear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tableName } = req.params;
    try {
        yield pool.query(`DELETE FROM "${tableName}"`);
        res.send(`Tabla "${tableName}" vaciada correctamente.`);
    }
    catch (error) {
        console.error('Error al vaciar la tabla', error);
        res.status(500).send('Error al vaciar la tabla');
    }
}));
app.post('/api/table/rename', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
        return res.status(400).send('oldName y newName son requeridos');
    }
    try {
        yield pool.query(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`);
        res.send(`Tabla renombrada de "${oldName}" a "${newName}".`);
    }
    catch (error) {
        console.error('Error al renombrar la tabla', error);
        res.status(500).send('Error al renombrar la tabla');
    }
}));
app.post('/api/table/copy', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sourceTable, newTable } = req.body;
    if (!sourceTable || !newTable) {
        return res.status(400).send('sourceTable y newTable son requeridos');
    }
    try {
        yield pool.query(`CREATE TABLE "${newTable}" AS TABLE "${sourceTable}"`);
        res.send(`Tabla "${sourceTable}" copiada a "${newTable}".`);
    }
    catch (error) {
        console.error('Error al copiar la tabla', error);
        res.status(500).send('Error al copiar la tabla');
    }
}));
const sizeMapping = {
    'Entre 1 y 10 empleados': 'B',
    'De 11 a 50 empleados': 'C',
    'De 51 a 200 empleados': 'D',
    'De 201 a 500 empleados': 'E',
    'De 501 a 1,000 empleados': 'F',
    'De 1,001 a 5,000 empleados': 'G',
    'De 5,001 a 10,000 empleados': 'H',
    'Más de 10,001 empleados': 'I'
};
app.post("/api/get-urls", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, tabla, location, industries, company_sizes, pages_per_size, ban } = req.body;
    // Verifica si los valores requeridos están presentes
    if (!email || !password || !tabla || !location || !industries || !company_sizes || !pages_per_size || !ban) {
        return res.status(400).json({ error: "Faltan parámetros en la solicitud" });
    }
    // No hay ningún tipo de limpieza, formateo o conversión de datos aquí
    const requestData = {
        email: email,
        password: password,
        tabla: tabla,
        location: location,
        industries: industries,
        company_sizes: company_sizes,
        pages_per_size: pages_per_size,
        ban: ban
    };
    console.log("Datos recibidos:", requestData);
    try {
        // Reenvía la solicitud al endpoint de FastAPI
        const fastApiResponse = yield axios_1.default.post('http://fastapi_app:8000/url', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Devuelve la respuesta de FastAPI al cliente
        res.json(fastApiResponse.data);
    }
    catch (error) {
        console.error('Error al reenviar la solicitud a FastAPI:', error);
        res.status(500).json({ error: 'Error al reenviar la solicitud a FastAPI' });
    }
}));
app.post("/api/scrape", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tabla_origen, tabla_destino } = req.body;
    // Asegurarse de que los parámetros necesarios están presentes
    if (!tabla_origen || !tabla_destino) {
        return res.status(400).json({ error: "Faltan parámetros en la solicitud" });
    }
    const requestData = {
        tabla_origen: tabla_origen,
        tabla_destino: tabla_destino,
    };
    console.log("Datos recibidos:", requestData);
    try {
        // Reenvía la solicitud al endpoint de scrape
        const scrapeApiResponse = yield axios_1.default.post("http://fastapi_app:8000/scrape", requestData, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        // Devuelve la respuesta de la API de scrape al cliente
        res.json(scrapeApiResponse.data);
    }
    catch (error) {
        console.error("Error al reenviar la solicitud a la API de scraping:", error);
        res.status(500).json({ error: "Error al reenviar la solicitud a la API de scraping" });
    }
}));
// Ruta para la raíz "/"
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente en http://localhost:3000');
});
app.post('/api/tables', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'empresa%';
      `);
        res.json(result.rows); // Enviar la lista de tablas como respuesta en formato JSON
    }
    catch (error) {
        console.error('Error al obtener las tablas', error);
        res.status(500).send('Error al obtener las tablas');
    }
}));
app.post('/api/filters', (req, res) => {
    const { tableName } = req.body;
    if (!tableName)
        return res.status(400).json({ error: "tableName es requerido" });
    const queries = {
        tamano: `SELECT DISTINCT tamano FROM ${tableName} ORDER BY tamano`,
        ciudad: `SELECT DISTINCT ciudad FROM ${tableName} ORDER BY ciudad`,
        sector: `SELECT DISTINCT sector FROM ${tableName} ORDER BY sector`
    };
    let results = {};
    let pending = Object.keys(queries).length;
    Object.keys(queries).forEach((key) => {
        pool.query(queries[key], (err, result) => {
            if (err)
                return res.status(500).json({ error: `Error al obtener ${key}` });
            results[key] = result.rows.map(row => {
                if (key === "ciudad") {
                    const partes = row.ciudad.split(',').map((p) => p.trim()); // Separar y limpiar
                    return partes.length > 1 ? partes[1] : row.ciudad; // Solo tomar el estado
                }
                return row[key]; // Para otros filtros, usar directamente el valor
            }).filter(value => value); // Eliminar valores vacíos o nulos
            if (key === "ciudad") {
                results[key] = [...new Set(results[key])]; // Eliminar duplicados en ciudad
            }
            pending--;
            if (pending === 0) {
                res.json(results); // Enviar respuesta con todos los resultados
            }
        });
    });
});
app.post('/api/data', (req, res) => {
    const { tableName, page = 1, limit = 16, filters = {} } = req.body;
    const offset = (page - 1) * limit;
    // Iniciar la consulta SQL
    let query = `SELECT * FROM ${tableName} WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) FROM ${tableName} WHERE 1=1`;
    // Función para agregar filtros en SQL con tipado correcto
    const addFilter = (column, values, useLike = true) => {
        if (values && values.length) {
            if (column === 'sector') {
                return ` AND '${values.join("' = ANY(" + column + ") OR '")}' = ANY(${column})`;
            }
            if (column === 'ciudad') {
                return ` AND TRANSLATE(LOWER(${column}), 'ÝÛ¾¼', 'íáéó') ILIKE '%${values.join("%' OR TRANSLATE(LOWER(" + column + "), 'ÝÛ¾¼', 'íáéó') ILIKE '%")}%'`;
            }
            return ` AND (${values.map(v => `${column} ILIKE '%${v}%'`).join(' OR ')})`;
        }
        return '';
    };
    // Función para agregar filtros a la consulta
    const addFilters = (filters) => {
        let filterQuery = '';
        Object.keys(filters).forEach((key) => {
            const filterValues = filters[key];
            if (filterValues && filterValues.length) {
                const useLike = key !== 'sector';
                filterQuery += addFilter(key, filterValues, useLike);
            }
        });
        return filterQuery;
    };
    // Aplicar los filtros a la consulta
    query += addFilters(filters);
    countQuery += addFilters(filters);
    // Añadir orden y paginación
    query += ` ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`;
    // Ejecutar las consultas
    pool.query(query, (err, result) => {
        if (err)
            return res.status(500).send('Error en la base de datos');
        pool.query(countQuery, (err, countResult) => {
            if (err)
                return res.status(500).send('Error al contar los elementos');
            res.json({
                items: result.rows,
                totalItems: parseInt(countResult.rows[0].count, 10)
            });
        });
    });
});
const { Parser } = require('json2csv');
app.post('/api/full', (req, res) => {
    const { tableName, filters = {} } = req.body;
    // Iniciar la consulta SQL sin paginación
    let query = `SELECT * FROM ${tableName} WHERE 1=1`;
    // Función para agregar filtros en SQL con tipado correcto
    const addFilter = (column, values, useLike = true) => {
        if (values && values.length) {
            if (column === 'sector') {
                return ` AND '${values.join("' = ANY(" + column + ") OR '")}' = ANY(${column})`;
            }
            if (column === 'ciudad') {
                return ` AND TRANSLATE(LOWER(${column}), 'ÝÛ¾¼', 'íáéó') ILIKE '%${values.join("%' OR TRANSLATE(LOWER(" + column + "), 'ÝÛ¾¼', 'íáéó') ILIKE '%")}%'`;
            }
            return ` AND (${values.map(v => `${column} ILIKE '%${v}%'`).join(' OR ')})`;
        }
        return '';
    };
    // Función para agregar filtros a la consulta
    const addFilters = (filters) => {
        let filterQuery = '';
        Object.keys(filters).forEach((key) => {
            const filterValues = filters[key];
            if (filterValues && filterValues.length) {
                const useLike = key !== 'sector';
                filterQuery += addFilter(key, filterValues, useLike);
            }
        });
        return filterQuery;
    };
    // Aplicar los filtros a la consulta
    query += addFilters(filters);
    // Añadir orden sin paginación
    query += ` ORDER BY id ASC`;
    // Ejecutar la consulta
    pool.query(query, (err, result) => {
        if (err)
            return res.status(500).send('Error en la base de datos');
        // Convertir los resultados a CSV
        const parser = new Parser();
        const csv = parser.parse(result.rows);
        // Enviar el CSV como respuesta
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="data.csv"');
        res.send(csv);
    });
});
app.post('/api/tablesurl', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'url%';
    `);
        res.json(result.rows); // Enviar la lista de tablas como respuesta en formato JSON
    }
    catch (error) {
        console.error('Error al obtener las tablas', error);
        res.status(500).send('Error al obtener las tablas');
    }
}));
app.post('/api/create-table', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tableName } = req.body;
        if (!tableName) {
            return res.status(400).json({ message: 'Debe proporcionar un nombre de tabla.' });
        }
        const tableNameWithPrefix = `empresas-${tableName}`;
        const createTableQuery = `
      CREATE TABLE "empresas_${tableName}" (
        id SERIAL,
        nombre VARCHAR(255),
        resumen TEXT,
        tamano VARCHAR(50),
        ubicaciones TEXT,
        fundacion VARCHAR(50),
        sector TEXT[],
        sitio_web TEXT[],
        sede TEXT[],
        especialidades TEXT[],
        codigo_postal VARCHAR(1000),
        ciudad VARCHAR(1000),
        empleados VARCHAR(3000), 
        url TEXT
      );
    `;
        yield pool.query(createTableQuery);
        res.status(201).json({ message: `Tabla 'empresas_${tableName}' creada exitosamente.` });
    }
    catch (error) {
        console.error('Error al crear la tabla:', error);
        // Aseguramos que error sea tratado como un objeto Error
        res.status(500).json({ message: 'Error al crear la tabla.', error: (error instanceof Error ? error.message : 'Unknown error') });
    }
}));
app.post('/api/create-url-table', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tableName } = req.body;
        if (!tableName) {
            return res.status(400).json({ message: 'Debe proporcionar un nombre de tabla.' });
        }
        const tableNameWithPrefix = `url-${tableName}`;
        const createTableQuery = `
      CREATE TABLE "url_${tableName}" (
        id SERIAL PRIMARY KEY,
        url TEXT,
        city TEXT
      );
    `;
        yield pool.query(createTableQuery);
        res.status(201).json({ message: `Tabla 'url-${tableName}' creada exitosamente.` });
    }
    catch (error) {
        console.error('Error al crear la tabla:', error);
        // Aseguramos que error sea tratado como un objeto Error
        res.status(500).json({ message: 'Error al crear la tabla.', error: (error instanceof Error ? error.message : 'Unknown error') });
    }
}));
// Ruta al archivo de mapeo de categorías
const DataCatalogPath = path.join(__dirname, "../Archives/data/categorias.csv");
function normalizeText(text) {
    return text
        .normalize("NFD") // Descompone caracteres con tildes
        .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos
        .replace(/ñ/g, "n") // Reemplaza ñ por n
        .replace(/Ñ/g, "N") // Reemplaza Ñ por N
        .replace(/^\[|\]$/g, '') // Elimina corchetes al inicio y final
        .replace(/^"+|"+$/g, '') // Elimina comillas dobles al inicio y final
        .replace(/\s*"\s*,\s*"\s*/g, ', ') // Corrige las comas mal formateadas
        .replace(/\s+/g, ' ') // Reemplaza múltiples espacios por uno solo
        .trim() // Elimina espacios en blanco al principio y al final
        .toLowerCase(); // Convierte todo a minúsculas
}
app.get('/api/sectores', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = req.query.fileName;
    if (!fileName) {
        return res.status(400).json({ message: 'Debe proporcionar un nombre de archivo.' });
    }
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath) || !fs_1.default.existsSync(DataCatalogPath)) {
        return res.status(404).json({ message: 'Uno de los archivos no existe.' });
    }
    // Diccionario para mapear sectores normalizados a categorías normalizadas
    const sectorToCategory = {};
    // Leer y procesar el archivo de mapeo (sector → categoría)
    yield new Promise((resolve, reject) => {
        fs_1.default.createReadStream(DataCatalogPath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            if (row.sector && row.categoria && row.nombre) {
                const normalizedSector = normalizeText(row.sector);
                const normalizedNombre = normalizeText(row.nombre);
                const normalizedCategoria = normalizeText(row.categoria);
                // Mapeamos tanto el sector como el nombre (en inglés) al mismo valor de categoría
                sectorToCategory[normalizedSector] = normalizedCategoria;
                sectorToCategory[normalizedNombre] = normalizedCategoria;
            }
        })
            .on('end', resolve)
            .on('error', reject);
    });
    const sectoresCount = {};
    const categoriasCount = {};
    const sectoresDesconocidos = {}; // Para los sectores sin categoría asignada
    // Leer el CSV original y contar sectores y categorías
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (row) => {
        const sectorColumn = Object.keys(row).find(key => key.toLowerCase().includes('sector'));
        if (sectorColumn && row[sectorColumn]) {
            const sector = normalizeText(row[sectorColumn]);
            if (sector) {
                // Contar el sector
                sectoresCount[sector] = (sectoresCount[sector] || 0) + 1;
                // Obtener la categoría correspondiente y contarla
                const categoria = sectorToCategory[sector];
                if (categoria) {
                    // Si la categoría no existe, inicializa su objeto
                    if (!categoriasCount[categoria]) {
                        categoriasCount[categoria] = { total: 0, desglose: {} };
                    }
                    // Aumentar el contador de la categoría
                    categoriasCount[categoria].total += 1;
                    // Desglose de sectores dentro de la categoría
                    categoriasCount[categoria].desglose[sector] = (categoriasCount[categoria].desglose[sector] || 0) + 1;
                }
                else {
                    // Si no tiene categoría, agregarlo a los desconocidos
                    sectoresDesconocidos[sector] = (sectoresDesconocidos[sector] || 0) + 1;
                }
            }
        }
    })
        .on('end', () => {
        if (Object.keys(sectoresCount).length === 0) {
            return res.status(400).json({ message: 'No se encontró una columna de sector en el archivo o está vacía.' });
        }
        // Responde con la información, incluyendo los sectores desconocidos
        res.json({
            categoriasCount,
            sectoresDesconocidos
        });
    })
        .on('error', (err) => {
        res.status(500).json({ message: 'Error al procesar el archivo CSV', error: err });
    });
}));
app.get('/api/completitud', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = req.query.fileName;
    if (!fileName) {
        return res.status(400).json({ message: 'Debe proporcionar un nombre de archivo.' });
    }
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath) || !fs_1.default.existsSync(DataCatalogPath)) {
        return res.status(404).json({ message: 'Uno de los archivos no existe.' });
    }
    // Diccionario para mapear sectores a categorías
    const sectorToCategory = {};
    const categoryCompletion = {};
    // Leer el archivo de mapeo y hacer la correspondencia
    yield new Promise((resolve, reject) => {
        fs_1.default.createReadStream(DataCatalogPath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            if (row.sector && row.categoria && row.nombre) {
                const normalizedSector = normalizeText(row.sector);
                const normalizedNombre = normalizeText(row.nombre); // Normaliza también el nombre
                const normalizedCategoria = normalizeText(row.categoria);
                // Mapea tanto el sector como el nombre a la misma categoría
                sectorToCategory[normalizedSector] = normalizedCategoria;
                sectorToCategory[normalizedNombre] = normalizedCategoria;
            }
        })
            .on('end', resolve)
            .on('error', reject);
    });
    const completionData = [];
    let totalCompletion = 0;
    let rowCount = 0;
    // Leer el archivo original y procesarlo
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (row) => {
        const totalColumns = Object.keys(row).length; // Número total de columnas
        const filledColumns = Object.values(row)
            .filter(value => typeof value === 'string' && value.trim() !== '').length; // Columnas llenas
        const completionPercentage = (filledColumns / totalColumns) * 100; // % de completitud
        totalCompletion += completionPercentage;
        rowCount++;
        const nombreColumn = Object.keys(row).find(key => key.toLowerCase().includes('nombre'));
        const nombre = nombreColumn ? row[nombreColumn] : 'Sin nombre';
        const sectorColumn = Object.keys(row).find(key => key.toLowerCase().includes('sector'));
        let categoria = 'Sin categoría';
        if (sectorColumn && row[sectorColumn]) {
            const sector = normalizeText(row[sectorColumn]);
            categoria = sectorToCategory[sector] || 'Sin categoría';
        }
        // Normaliza el nombre de la fila (también en inglés) y usa el mapeo
        const normalizedNombre = normalizeText(nombre);
        categoria = sectorToCategory[normalizedNombre] || categoria;
        completionData.push({
            nombre: nombre.trim() || 'Sin nombre',
            completitud: parseFloat(completionPercentage.toFixed(2)),
            categoria
        });
        if (categoria) {
            if (!categoryCompletion[categoria]) {
                categoryCompletion[categoria] = { totalCompletion: 0, rowCount: 0 };
            }
            categoryCompletion[categoria].totalCompletion += completionPercentage;
            categoryCompletion[categoria].rowCount++;
        }
    })
        .on('end', () => {
        if (rowCount === 0) {
            return res.status(404).json({ message: 'No se encontró información en el archivo.' });
        }
        const averageCompletion = totalCompletion / rowCount;
        // Calcular el porcentaje de completitud por categoría
        const categoryPercentages = Object.keys(categoryCompletion).map((category) => {
            const categoryAvg = categoryCompletion[category];
            const categoryCompletionPercentage = categoryAvg.totalCompletion / categoryAvg.rowCount;
            return {
                categoria: category,
                completitud: parseFloat(categoryCompletionPercentage.toFixed(2))
            };
        });
        res.json({
            promedio_completitud: parseFloat(averageCompletion.toFixed(2)),
            detalles: completionData,
            completitud_por_categoria: categoryPercentages
        });
    })
        .on('error', (err) => {
        res.status(500).json({ message: 'Error al procesar el archivo CSV', error: err });
    });
}));
app.get('/api/categoria-tamano', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = req.query.fileName;
    if (!fileName) {
        return res.status(400).json({ message: 'Debe proporcionar un nombre de archivo.' });
    }
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath) || !fs_1.default.existsSync(DataCatalogPath)) {
        return res.status(404).json({ message: 'Uno de los archivos no existe.' });
    }
    // Diccionario para mapear sectores normalizados a categorías normalizadas
    const sectorToCategory = {};
    // Leer y procesar el archivo de mapeo (sector → categoría)
    yield new Promise((resolve, reject) => {
        fs_1.default.createReadStream(DataCatalogPath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            if (row.sector && row.categoria && row.nombre) {
                const normalizedSector = normalizeText(row.sector);
                const normalizedNombre = normalizeText(row.nombre);
                const normalizedCategoria = normalizeText(row.categoria);
                // Mapeamos tanto el sector como el nombre (en inglés) al mismo valor de categoría
                sectorToCategory[normalizedSector] = normalizedCategoria;
                sectorToCategory[normalizedNombre] = normalizedCategoria;
            }
        })
            .on('end', resolve)
            .on('error', reject);
    });
    // Diccionario para almacenar los tamaños agrupados por categoría
    const categoriaTamanoMap = {};
    const sectoresDesconocidos = {}; // Para los sectores sin categoría asignada
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (row) => {
        var _a, _b;
        const sectorColumn = Object.keys(row).find(key => key.toLowerCase().includes('sector'));
        const tamanoColumn = Object.keys(row).find(key => key.toLowerCase().includes('tamano'));
        if (sectorColumn && tamanoColumn) {
            const sectorValue = normalizeText((_a = row[sectorColumn]) === null || _a === void 0 ? void 0 : _a.trim());
            const tamanoValue = (_b = row[tamanoColumn]) === null || _b === void 0 ? void 0 : _b.trim();
            if (sectorValue && tamanoValue) {
                // Obtener la categoría correspondiente
                const categoria = sectorToCategory[sectorValue];
                if (categoria) {
                    // Inicializar la categoría si no existe
                    if (!categoriaTamanoMap[categoria]) {
                        categoriaTamanoMap[categoria] = {};
                    }
                    // Contamos la cantidad de ocurrencias del tamaño para esta categoría
                    categoriaTamanoMap[categoria][tamanoValue] = (categoriaTamanoMap[categoria][tamanoValue] || 0) + 1;
                }
                else {
                    // Si no tiene categoría, agregarlo a los desconocidos
                    sectoresDesconocidos[sectorValue] = (sectoresDesconocidos[sectorValue] || 0) + 1;
                }
            }
        }
    })
        .on('end', () => {
        if (Object.keys(categoriaTamanoMap).length === 0) {
            return res.status(404).json({ message: 'No se encontró información en el archivo.' });
        }
        res.json({
            detalles: categoriaTamanoMap,
            sectoresDesconocidos
        });
    })
        .on('error', (err) => {
        res.status(500).json({ message: 'Error al procesar el archivo CSV', error: err });
    });
}));
app.post('/api/companiasporsector', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fileName, sector } = req.body; // Obtener 'fileName' y 'sector' desde el cuerpo de la solicitud
    if (!fileName) {
        return res.status(400).json({ message: 'Debe proporcionar un nombre de archivo.' });
    }
    if (!sector) {
        return res.status(400).json({ message: 'Debe proporcionar un sector.' });
    }
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ message: 'El archivo no existe.' });
    }
    // Diccionario para mapear sectores normalizados a categorías normalizadas
    const sectorToCategory = {};
    // Leer y procesar el archivo de mapeo (sector → categoría)
    yield new Promise((resolve, reject) => {
        fs_1.default.createReadStream(DataCatalogPath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            if (row.sector && row.categoria && row.nombre) {
                const normalizedSector = normalizeText(row.sector);
                const normalizedNombre = normalizeText(row.nombre);
                const normalizedCategoria = normalizeText(row.categoria);
                // Mapeamos tanto el sector como el nombre (en inglés) al mismo valor de categoría
                sectorToCategory[normalizedSector] = normalizedCategoria;
                sectorToCategory[normalizedNombre] = normalizedCategoria;
            }
        })
            .on('end', resolve)
            .on('error', reject);
    });
    const empresasEnSector = []; // Almacenará las empresas en el sector solicitado
    // Leer el CSV original y contar las empresas en el sector solicitado
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (row) => {
        const sectorColumn = Object.keys(row).find(key => key.toLowerCase().includes('sector'));
        if (sectorColumn && row[sectorColumn]) {
            const normalizedSector = normalizeText(row[sectorColumn]);
            if (normalizedSector === normalizeText(sector)) {
                const empresa = row['nombre']; // Suponiendo que el nombre de la empresa está en la columna 'nombre'
                if (empresa) {
                    empresasEnSector.push(empresa); // Agrega la empresa al array
                }
            }
        }
    })
        .on('end', () => {
        if (empresasEnSector.length === 0) {
            return res.status(404).json({ message: `No se encontraron empresas en el sector: ${sector}` });
        }
        // Responde con las empresas en el sector solicitado
        res.json({ empresas: empresasEnSector });
    })
        .on('error', (err) => {
        res.status(500).json({ message: 'Error al procesar el archivo CSV', error: err });
    });
}));
app.post('/api/empleadosporempresa', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fileName, company } = req.body; // Extraer datos desde el JSON
    if (!fileName) {
        return res.status(400).json({ message: 'Debe proporcionar un nombre de archivo.' });
    }
    if (!company) {
        return res.status(400).json({ message: 'Debe proporcionar el nombre de la empresa.' });
    }
    const filePath = path.join(reportsDir, fileName);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({ message: 'El archivo no existe.' });
    }
    let empleados = null;
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (row) => {
        const nombreEmpresa = row['nombre'];
        const empleadosValor = row['empleados'];
        if (normalizeText(nombreEmpresa) === normalizeText(company)) {
            empleados = empleadosValor;
        }
    })
        .on('end', () => {
        if (empleados === null) {
            return res.status(404).json({ message: `No se encontró la empresa: ${company}` });
        }
        res.json({ empresa: company, empleados });
    })
        .on('error', (err) => {
        res.status(500).json({ message: 'Error al procesar el archivo CSV', error: err });
    });
}));
app.post("/crear-json", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Faltan campos: email o password" });
    }
    // Crear el objeto con los datos recibidos
    const jsonData = {
        email,
        password
    };
    // Directorio donde se guardará el archivo
    const keyDir = path.join(__dirname, "../Archives/key");
    // Asegurarse de que el directorio exista, si no lo crea
    if (!fs_1.default.existsSync(keyDir)) {
        fs_1.default.mkdirSync(keyDir, { recursive: true });
    }
    // Ruta completa para guardar el archivo clave.json
    const filePath = path.join(keyDir, "clave.json");
    // Guardar el JSON en el archivo
    fs_1.default.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: "Error al guardar el archivo" });
        }
        res.status(200).json({ message: "Archivo clave.json creado exitosamente" });
    });
});
app.get("/obtener-json", (req, res) => {
    // Directorio donde se guarda el archivo clave.json
    const keyDir = path.join(__dirname, "../Archives/key");
    // Ruta completa al archivo clave.json
    const filePath = path.join(keyDir, "clave.json");
    // Verificar si el archivo existe
    if (fs_1.default.existsSync(filePath)) {
        // Leer el archivo y devolver su contenido
        fs_1.default.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al leer el archivo" });
            }
            // Convertir el contenido del archivo en un objeto JSON y enviarlo como respuesta
            try {
                const jsonData = JSON.parse(data);
                res.status(200).json(jsonData);
            }
            catch (error) {
                res.status(500).json({ error: "Error al parsear el contenido del archivo JSON" });
            }
        });
    }
    else {
        res.status(404).json({ error: "Archivo clave.json no encontrado" });
    }
});
const dataDir = path.join(__dirname, "../Archives/data");
// Función para leer un archivo JSON
const readJsonFile = (fileName) => {
    const filePath = path.join(dataDir, fileName);
    if (fs_1.default.existsSync(filePath)) {
        const data = fs_1.default.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    }
    return null;
};
// Endpoints para cada archivo JSON
app.get("/api/location", (req, res) => {
    const data = readJsonFile("location.json");
    if (data) {
        res.json(data);
    }
    else {
        res.status(404).json({ error: "Archivo no encontrado" });
    }
});
app.get("/api/industry", (req, res) => {
    const data = readJsonFile("industry.json");
    if (data) {
        res.json(data);
    }
    else {
        res.status(404).json({ error: "Archivo no encontrado" });
    }
});
app.get("/api/size", (req, res) => {
    const data = readJsonFile("size.json");
    if (data) {
        res.json(data);
    }
    else {
        res.status(404).json({ error: "Archivo no encontrado" });
    }
});
app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
