import psycopg2
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import shutil
from dotenv import load_dotenv

# -----------------------
# 🔧 VARIABLES DE CONFIG
# -----------------------

load_dotenv()

locations_file = "locations.json"
pages_per_size = None
table_name = "url_tabla_end"
locations = [105919308, 107838565, 106507840, 104030198]
industries = [" "]
company_sizes = ["D", "E", "F"]
ban = ["modelo", "santander"]
used = True  # ✅ Si ya hiciste login antes, cambia esto a True

linkedin_credentials = {
    'email': 'seljuan60@gmail.com',
    'password': 'seljuan60'
}

base_url_template = (
    "https://www.linkedin.com/search/results/companies/?companyHqGeo=%5B%22{location}%22%5D"
    "&industryCompanyVertical=%5B%22{industry}%22%5D"
    "&companySize=%5B%22{company_size}%22%5D"
    "&keywords=&origin=FACETED_SEARCH&page=1"
)

USER_PROFILE_PATH = os.path.join(os.getcwd(), "linkedin_user_profile")

# -------------------------
# 🚀 CLASE SCRAPER
# -------------------------

class LinkedInScraper:
    company_size_map = {
        '1-10': 'B', '11-50': 'C', '51-200': 'D',
        '201-500': 'E', '501-1000': 'F', '1001-5000': 'G',
        '5001-10000': 'H', '10000+': 'I'
    }

    def __init__(self, db_config, linkedin_credentials, locations_file, pages_per_size=None, ban=None, used=False):
        self.db_config = db_config
        self.linkedin_credentials = linkedin_credentials
        self.pages_per_size = pages_per_size
        self.ban = ban
        self.driver = None
        self.last_login_time = 0
        self.used = used

        with open(locations_file, 'r', encoding='utf-8') as file:
            self.locations_map = json.load(file)

    def init_driver(self):
        if not self.used and os.path.exists(USER_PROFILE_PATH):
            print("🧹 Borrando perfil de usuario y reiniciando sesión...")
            shutil.rmtree(USER_PROFILE_PATH)
        elif self.used:
            print("📂 Usando perfil de usuario existente.")
        
        options = webdriver.ChromeOptions()
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_argument('--display=host.docker.internal:0.0')
        options.add_argument(f'--user-data-dir={USER_PROFILE_PATH}')

        chromedriver_path = "/usr/bin/chromedriver"
        service = Service(executable_path=chromedriver_path)

        self.driver = webdriver.Chrome(service=service, options=options)

    def login(self):
        if self.driver is None:
            self.init_driver()

        if self.used:
            print("🔐 Ya se usó la cuenta. Saltando login.")
            self.last_login_time = time.time()
            return True

        self.driver.get('https://www.linkedin.com/login')

        try:
            WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.ID, 'username'))).send_keys(self.linkedin_credentials['email'])
            self.driver.find_element(By.ID, 'password').send_keys(self.linkedin_credentials['password'])
            self.driver.find_element(By.XPATH, '//button[@type="submit"]').click()
            time.sleep(5)

            max_wait = 300
            start_time = time.time()

            while True:
                current_url = self.driver.current_url
                if "checkpoint/challenge" not in current_url and "login" not in current_url:
                    break

                if time.time() - start_time > max_wait:
                    print("⏳ Tiempo de espera excedido para resolver el checkpoint o salir del login.")
                    return False

                if "checkpoint/challenge" in current_url:
                    print("🛑 Esperando que se resuelva el checkpoint de seguridad...")
                elif "login" in current_url:
                    print("⚠️ Esperando que se complete el login...")

                time.sleep(5)

            WebDriverWait(self.driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
            self.last_login_time = time.time()
            self.used = True
            print("✅ Login exitoso.")
            return True

        except Exception as e:
            print(f"❌ Error en login: {e}")
            return False

    def scrape_companies(self, base_url, industry, company_size, location_code, tabla):
        page = 1
        found_any = False
        company_size_code = self.company_size_map.get(company_size, '')

        while self.pages_per_size is None or page <= self.pages_per_size:
            if time.time() - self.last_login_time > 10800:
                print("🔄 Reautenticando sesión...")
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

    def scrape_all_companies(self, locations, industries, company_sizes, base_url_template, tabla):
        for loc in locations:
            location_name = self.locations_map.get(str(loc), "Desconocido")
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

# -------------------------
# 🔁 EJECUCIÓN PRINCIPAL
# -------------------------

def run_scraper():
    db_config = {
        'dbname': os.getenv('DB_NAME'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'host': os.getenv('DB_HOST'),
        'port': os.getenv('DB_PORT')
    }

    scraper = LinkedInScraper(
        db_config,
        linkedin_credentials,
        locations_file,
        pages_per_size,
        ban,
        used
    )

    if not used:
        if scraper.login():
            scraper.scrape_all_companies(locations, industries, company_sizes, base_url_template, table_name)
    else:
        scraper.init_driver()
        scraper.scrape_all_companies(locations, industries, company_sizes, base_url_template, table_name)

    scraper.close_driver()

if __name__ == "__main__":
    run_scraper()
