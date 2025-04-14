# Usa Node con soporte para TypeScript
FROM node:18

# Crea el directorio de trabajo
WORKDIR /app

# Copia package files e instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Compila TypeScript
RUN npm run build

# Expón el puerto que usará tu servidor
EXPOSE 3000

# Comando para arrancar el server (ya compilado)
CMD ["npm", "start"]
