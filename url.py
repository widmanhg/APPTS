import psycopg2
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import os
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

class LinkedInScraper:
    company_size_map = {
        '1-10': 'B', '11-50': 'C', '51-200': 'D',
        '201-500': 'E', '501-1000': 'F', '1001-5000': 'G',
        '5001-10000': 'H', '10000+': 'I'
    }

    def __init__(self, db_config, linkedin_credentials, locations_file, pages_per_size=None, ban=None):
        self.db_config = db_config
        self.linkedin_credentials = linkedin_credentials
        self.pages_per_size = pages_per_size
        self.ban = ban
        self.driver = None
        self.last_login_time = 0

        with open(locations_file, 'r', encoding='utf-8') as file:
            self.locations_map = json.load(file)

    def init_driver(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_argument('--headless')  # Ejecutar en modo sin cabeza

        # Ruta a tu archivo chromedriver.exe
        chromedriver_path = "/usr/bin/chromedriver"

        # Usar Service para indicar la ruta del chromedriver
        service = Service(executable_path=chromedriver_path)

        # Inicializar el driver con el servicio y opciones
        self.driver = webdriver.Chrome(service=service, options=options)

    def login(self):
        self.init_driver()
        self.driver.get('https://www.linkedin.com/login')

        try:
            WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.ID, 'username'))).send_keys(self.linkedin_credentials['email'])
            self.driver.find_element(By.ID, 'password').send_keys(self.linkedin_credentials['password'])
            self.driver.find_element(By.XPATH, '//button[@type="submit"]').click()
            time.sleep(10)

            if "login" in self.driver.current_url:
                print("⚠️ No se pudo iniciar sesión.")
                return False

            self.last_login_time = time.time()
            print("✅ Login exitoso.")
            return True

        except Exception as e:
            print(f"❌ Error en login: {e}")
            return False

    def insert_url(self, url, location_code, tabla):
        try:
            company_identifier = url.split("linkedin.com/company/")[-1]

            if any(banned_word in company_identifier for banned_word in self.ban):
                print(f"🚫 URL bloqueada: {url}")
                return

            location_name = self.locations_map.get(str(location_code), "Desconocido")

            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
            cursor.execute(f"INSERT INTO {tabla} (url, city) VALUES (%s, %s)", (url, location_name))
            conn.commit()
            print(f"✅ URL {url} insertada en {tabla}.")
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"❌ Error insertando URL: {e}")

    def scrape_companies(self, base_url, industry, company_size, location_code, tabla):
        page = 1
        found_any = False
        company_size_code = self.company_size_map.get(company_size, '')

        while self.pages_per_size is None or page <= self.pages_per_size:
            if time.time() - self.last_login_time > 10800:
                print("🔄 Reautenticando sesión...")
                self.close_driver()
                if not self.login():
                    print("🚨 Error en reautenticación. Saliendo.")
                    return False

            url = base_url.replace("page=1", f"page={page}").replace("{company_size}", company_size_code)
            self.driver.get(url)
            time.sleep(5)

            try:
                company_links = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_all_elements_located((By.XPATH, '//a[contains(@href, "linkedin.com/company/")]'))
                )
                
                if not company_links:
                    print(f"🚫 No hay más empresas en la página {page}. Terminando.")
                    break

                found_urls = [link.get_attribute('href') for link in company_links]

                # Si solo se encuentra la URL de setup, pasar al siguiente tamaño
                if all(url == "https://www.linkedin.com/company/setup/new/" for url in found_urls):
                    print(f"🚫 Solo se encontró la URL de setup en tamaño {company_size}. Saltando al siguiente tamaño.")
                    return False  

                found_any = True
                print(f"📄 Página {page}: {len(found_urls)} empresas encontradas.")

                for index, company_url in enumerate(found_urls, start=1):
                    print(f"{index}. {company_url}")
                    self.insert_url(company_url, location_code, tabla)

                page += 1

            except Exception as e:
                print(f"⚠️ Error en página {page}: {e}, pasando a la siguiente.")
                break

        return found_any

    def scrape_all_companies(self, locations, industries, company_sizes, base_url_template, tabla):
        for loc in locations:
            location_name = self.locations_map.get(loc, "Desconocido")
            print(f"\n🌍 Scrapeando en {location_name} (ID: {loc})\n")

            for industry in industries:
                for size in company_sizes:
                    base_url = base_url_template.format(location=loc, industry=industry, company_size=size)
                    print(f"🔄 Industria {industry}, tamaño {size} en {location_name}")

                    found = self.scrape_companies(base_url, industry, size, loc, tabla)
                    if not found:
                        print(f"⏭️ Sin empresas en industria {industry} tamaño {size}, saltando.")

    def close_driver(self):
        if self.driver:
            self.driver.quit()
            self.driver = None

def run_scraper():
    # Obtener las credenciales de la base de datos del archivo .env
    db_config = {
        'dbname': os.getenv('DB_NAME'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'host': os.getenv('DB_HOST'),
        'port': os.getenv('DB_PORT')
    }

    # Credenciales de LinkedIn (no deben ir al .env)
    linkedin_credentials = {
        'email': 'sesopedrizo@gmail.com',
        'password': 'mondongo11'
    }

    locations_file = "locations.json"
    pages_per_size = None
    table_name = "url_tabla_end"
    locations = [105919308, 107838565, 106507840, 104030198]
    industries = [" "]
    company_sizes = ["D", "E", "F"]
    base_url_template = "https://www.linkedin.com/search/results/companies/?companyHqGeo=%5B%22{location}%22%5D&industryCompanyVertical=%5B%22{industry}%22%5D&companySize=%5B%22{company_size}%22%5D&keywords=&origin=FACETED_SEARCH&page=1"
    ban = ["modelo", "santander"]

    scraper = LinkedInScraper(db_config, linkedin_credentials, locations_file, pages_per_size, ban)
    if scraper.login():
        scraper.scrape_all_companies(locations, industries, company_sizes, base_url_template, table_name)
    scraper.close_driver()

if __name__ == "__main__":
    run_scraper()