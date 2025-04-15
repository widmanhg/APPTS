-- Crear tabla url_prueba
CREATE TABLE IF NOT EXISTS url_prueba (
    id SERIAL PRIMARY KEY,
    url TEXT,
    city TEXT
);

-- Crear tabla empresas_prueba (estructura igual a empresas_final)
CREATE TABLE IF NOT EXISTS empresas_prueba (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    resumen TEXT,
    telefono VARCHAR(50),
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
