import psycopg2
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        # Leer las variables de entorno
        self.dbname = os.getenv("DB_NAME")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.host = os.getenv("DB_HOST")
        self.port = os.getenv("DB_PORT")

    def get_urls(self, tabla_origen):
        conn = psycopg2.connect(
            dbname=self.dbname,
            user=self.user,
            password=self.password,
            host=self.host,
            port=self.port
        )
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {tabla_origen};")
        rows = cur.fetchall()
        urls = [(row[1].strip(), row[2]) for i, row in enumerate(rows) if (i + 1) % 2 != 0]
        cur.close()
        conn.close()
        return urls
    
    def insert_data(self, data, tabla_destino, ciudad, url):
        """Inserta los datos extraídos en la base de datos."""
        try:
            conn = psycopg2.connect(
                dbname=self.dbname,
                user=self.user,
                password=self.password,
                host=self.host,
                port=self.port
            )
            cur = conn.cursor()
            from psycopg2 import sql

            # Asegúrate de que `url` no sea None ni vacío
            if not url:
                print("❌ URL no válida. No se insertará el registro.")
                return
            
            print("📦 JSON que será insertado:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            query = sql.SQL(""" 
                INSERT INTO {tabla} (nombre, resumen, telefono, tamano, ubicaciones, fundacion, sector, sitio_web, sede, especialidades, codigo_postal, ciudad, empleados, url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """).format(tabla=sql.Identifier(tabla_destino))

            cur.execute(query, (
                data.get("Nombre de la empresa", None),
                data.get("Resumen", None),
                data.get("Teléfono", None),
                data.get("Company size", None),
                json.dumps(data.get("Ubicaciones"), ensure_ascii=False),
                data.get("Founded"),
                data.get("Industry", "").split(",") if data.get("Industry") else [],
                [data.get("Website")] if data.get("Website") else [],
                [data.get("Headquarters")] if data.get("Headquarters") else [],
                data.get("Specialties", "").split(",") if data.get("Specialties") else [],
                json.dumps(data.get("Código Postal"), ensure_ascii=False),
                ciudad,
                json.dumps(data.get("Empleados"), ensure_ascii=False),
                url  # Aquí pasas la URL directamente
            ))

            conn.commit()
            cur.close()
            conn.close()
            print(f"✅ Datos insertados para {data.get('Nombre de la empresa')} en la base de datos.")
        except Exception as e:
            print(f"❌ Error al insertar datos en la base de datos: {e}")


class WebScraper:
    def __init__(self):
        self.options = Options()

        # Crear un directorio temporal único para el perfil de usuario
        temp_profile = tempfile.mkdtemp()

        # Quitar headless para poder ver el navegador
        #self.options.add_argument("--headless=new") 
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--disable-blink-features=AutomationControlled")
        self.options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        # Mostrar GUI a través de VcXsrv
        self.options.add_argument("--display=host.docker.internal:0.0")

        # Usar perfil temporal (así no se guarda sesión anterior)
        self.options.add_argument(f"--user-data-dir={temp_profile}")

    def start_driver(self):
        chromedriver_path = "/usr/bin/chromedriver"# Usando webdriver-manager para instalar y gestionar el driver
        return webdriver.Chrome(service=Service(chromedriver_path), options=self.options)

    def scrape(self, url, ciudad, db, tabla_destino, intento=1, max_intentos=3):
        if intento > max_intentos:
            print(f"❌ Máximo de intentos alcanzado para: {url}")
            return

        driver = self.start_driver()
        try:
            print(f"Scrapeando (intento {intento}): {url}")
            driver.get(url)
            time.sleep(3)

            current_url = driver.current_url
            if "login" in current_url or "authwall" in current_url:
                print(f"URL bloqueada por autenticación: {current_url}. Reintentando...")
                driver.quit()
                return self.scrape(url, ciudad, db, tabla_destino, intento + 1, max_intentos)

            sections = {}

            try:
                sections['Nombre de la empresa'] = driver.find_element(By.XPATH, '//*[@id="main-content"]/section[1]/section/div/div[2]/div[1]/h1').text.strip()
            except Exception:
                print("No se pudo obtener el nombre de la empresa.")

            try:
                sections['Resumen'] = driver.find_element(By.XPATH, '//*[@id="main-content"]/section[1]/div/section[1]/div/p').text.strip()
            except Exception:
                print("No se pudo obtener el resumen de la empresa.")

            # Extraer detalles de la empresa
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, '//*[@id="main-content"]/section[1]/div/section[1]/div/dl'))
                )
                section = driver.find_element(By.XPATH, '//*[@id="main-content"]/section[1]/div/section[1]/div/dl')
                section_html = section.get_attribute("outerHTML").strip()
                soup = BeautifulSoup(section_html, "html.parser")
                details = {dt.text.strip(): dd.text.strip() for dt, dd in zip(soup.find_all('dt'), soup.find_all('dd'))}
                sections.update(details)
            except Exception:
                print("No se pudieron extraer detalles adicionales.")

            # Extraer ubicaciones
            try:
                section = driver.find_element(By.XPATH, '//*[@id="main-content"]/section[1]/div/section[2]/div')
                html_content = section.get_attribute("outerHTML")
                soup = BeautifulSoup(html_content, "html.parser")
                list_of_uls = soup.find_all('ul')

                locations_dict = {}
                postal_codes_dict = {}
                address_counter = 1

                for ul in list_of_uls:
                    for li in ul.find_all('li'):
                        paragraphs = li.find_all('p')
                        address = [p.get_text(strip=True) for p in paragraphs]

                        if address:
                            cp = [re.findall(r'\b\d{5}\b', addr) for addr in address]
                            cp = [item for sublist in cp for item in sublist]
                            locations_dict[f"{address_counter}"] = {"Direccion": ", ".join(address)}
                            if cp:
                                postal_codes_dict[f"{address_counter}"] = cp[0]
                            address_counter += 1

                sections['Ubicaciones'] = locations_dict
                sections['Código Postal'] = postal_codes_dict

            except Exception as e:
                print(f"Error al extraer ubicaciones: {e}")

            # Scraping de empleados de LinkedIn
            empleados = []
            try:
                section = driver.find_element(By.XPATH, '//*[@id="main-content"]/section[1]/div/section[3]/div/ul')
                html_content = section.get_attribute("outerHTML")
                soup = BeautifulSoup(html_content, 'html.parser')

                for index, li in enumerate(soup.find_all('li'), start=1):
                    empleado = {}
                    try:
                        empleado['Nombre'] = li.find('h3', class_='base-main-card__title').text.strip()
                    except AttributeError:
                        empleado['Nombre'] = "Nombre no encontrado"

                    try:
                        empleado['Cargo'] = li.find('h4', class_='base-main-card__subtitle').text.strip()
                    except AttributeError:
                        empleado['Cargo'] = "Cargo no encontrado"

                    try:
                        empleado['Foto'] = li.find('img')['data-delayed-url'].strip()
                    except (AttributeError, TypeError, KeyError):
                        empleado['Foto'] = "Foto no encontrada"

                    try:
                        empleado['Perfil'] = li.find('a')['href'].strip()
                    except (AttributeError, TypeError, KeyError):
                        empleado['Perfil'] = "Link no encontrado"

                    empleados.append(empleado)

                sections['Empleados'] = empleados

            except Exception as e:
                print(f"Error al extraer empleados: {e}")

            # Insertar en la base de datos inmediatamente
            if sections:
                db.insert_data(sections, tabla_destino, ciudad, url)

        except Exception as e:
            print(f"Error en el scraping: {e}")
        finally:
            driver.quit()

def main():
    db = DatabaseManager()
    tabla_origen = 'url_tabla_end'
    tabla_destino = 'empresas_copia'
    urls = db.get_urls(tabla_origen)

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for url, ciudad in urls:
            futures.append(executor.submit(WebScraper().scrape, url, ciudad, db, tabla_destino))

        for future in as_completed(futures):
            future.result()  # Recoger el resultado y manejar excepciones

if __name__ == "__main__":
    main()
