from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from info import DatabaseManager, WebScraper
from url import LinkedInScraper
import time
import threading
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Solo permite el frontend
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (POST incluido)
    allow_headers=["*"],  # Permitir todos los headers
)

@app.get("/")
def home():
    return {"message": "API de Scraping en ejecución."}

# Modelo para scraping de URLs


# Mecanismo de cancelación usando threading.Event
cancel_event = threading.Event()

# Endpoint para cancelar el proceso
@app.post("/cancel-process")
def cancel_scrape():
    cancel_event.set()
    return {"message": "El proceso de scraping se ha cancelado."}


# Definir el modelo de solicitud
class ScraperRequest(BaseModel):
    email: str
    password: str
    pages_per_size: int
    tabla: str
    location: list
    industries: list
    company_sizes: list
    ban: list  # Palabras bloqueadas en las URLs

# Inicializar la app FastAPI
app = FastAPI()

@app.post("/url")
async def run_linkedin_scraper(scraper_request: ScraperRequest):
    # Convertir las ubicaciones a una lista si están en formato diferente
    try:
        # Leer el archivo de ubicaciones
        locations_file = "locations.json"
        with open(locations_file, 'r', encoding='utf-8') as file:
            locations_map = json.load(file)

        # Configuración de base de datos y credenciales de LinkedIn
        db_config = {
            'dbname': os.getenv("DB_NAME"),
            'user': os.getenv("DB_USER"),
            'password': os.getenv("DB_PASSWORD"),
            'host': os.getenv("DB_HOST"),
            'port': os.getenv("DB_PORT")}

        
        linkedin_credentials = {
            'email': scraper_request.email,
            'password': scraper_request.password
        }

        # Crear una instancia del scraper
        scraper = LinkedInScraper(
            db_config=db_config,
            linkedin_credentials=linkedin_credentials,
            locations_file=locations_file,
            pages_per_size=scraper_request.pages_per_size,
            ban=scraper_request.ban
        )

        # Ejecutar el scraping
        scraper.scrape_all_companies(
            locations=scraper_request.location,
            industries=scraper_request.industries,
            company_sizes=scraper_request.company_sizes,
            base_url_template="https://www.linkedin.com/search/results/companies/?companyHqGeo=%5B%22{location}%22%5D&industryCompanyVertical=%5B%22{industry}%22%5D&companySize=%5B%22{company_size}%22%5D&keywords=&origin=FACETED_SEARCH&page=1",
            tabla=scraper_request.tabla
        )

        # Cerrar el driver de Chrome
        scraper.close_driver()

        return {"message": "Scraping completado exitosamente."}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al ejecutar el scraper: {str(e)}")




# Configuración de la base de datos para el scraping de información (asumiendo implementación)
db = DatabaseManager()

class ScrapeinfoRequest(BaseModel):
    tabla_origen: str
    tabla_destino: str

@app.post("/scrape")
async def scrape_info(request: ScrapeinfoRequest):
    try:
        db = DatabaseManager()
        urls = db.get_urls(request.tabla_origen)

        # Maxima cantidad de trabajadores (threads) simultáneos
        max_workers = 5
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(WebScraper().scrape, url, ciudad, db, request.tabla_destino): url
                for url, ciudad in urls
            }

            for future in as_completed(futures):
                try:
                    future.result()  # Capturar errores si ocurren
                except Exception as e:
                    print(f"❌ Error en una de las tareas: {e}")
        
        return {"message": "Scraping completado correctamente"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al ejecutar el scraping: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
