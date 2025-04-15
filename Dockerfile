# Imagen base de Python
FROM python:3.11-slim

# Instala dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    gnupg \
    libnss3 \
    libgconf-2-4 \
    libxi6 \
    libxcursor1 \
    libxcomposite1 \
    libxdamage1 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libxss1 \
    fonts-liberation \
    xdg-utils \
    chromium \
    chromium-driver

# Setea el directorio de trabajo
WORKDIR /app

# Copia los archivos
COPY . .

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Ejecuta el servidor
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
