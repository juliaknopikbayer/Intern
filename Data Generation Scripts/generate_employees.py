#!/usr/bin/env python3
"""
Synthetic Employee Data Generator — International Company Edition
Uses only: numpy, pandas
Generates diverse employees across multiple countries with:
  - Country-specific names (Polish, English, German, French, Spanish, Italian,
    Dutch, American, Indian)
  - Country-specific national IDs (PESEL, NINO, Steuer-ID, INSEE, DNI,
    Codice Fiscale, SSN, BSN, Aadhaar)
  - Country-specific phone number formats
  - Country-specific currencies and salary ranges
  - Logical consistency: salary scales with level + tenure, manager hierarchy,
    hire date after 18th birthday, etc.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ============================================================
# 0. CONFIG
# ============================================================
N_EMPLOYEES = 500
TODAY = datetime(2025, 6, 30)
RNG = np.random.default_rng(seed=42)

# ============================================================
# 1. COUNTRY PROFILES
# ============================================================
# Each country has:
#   - weight: probability of an employee being from this country
#   - currency: local currency code
#   - currency_symbol: symbol for display
#   - salary_multiplier: adjusts base salary to local market
#   - male_names / female_names: typical first names
#   - surnames: typical last names (shared across genders unless noted)
#   - cities: major cities with weights
#   - id_generator: function (birth_date, gender, country) -> national_id
#   - phone_generator: function () -> phone string
#   - email_domain: company email domain for this locale

COUNTRIES = [
    "Poland", "Germany", "UK", "France", "Spain",
    "Italy", "Netherlands", "USA", "India",
]

COUNTRY_WEIGHTS = [0.25, 0.15, 0.12, 0.10, 0.08, 0.08, 0.07, 0.10, 0.05]

# ============================================================
# 2. NAME POOLS PER COUNTRY
# ============================================================

NAMES = {
    "Poland": {
        "male": [
            "Adam", "Adrian", "Aleksander", "Andrzej", "Antoni", "Artur",
            "Bartosz", "Cezary", "Damian", "Daniel", "Dariusz", "Dawid",
            "Dominik", "Emil", "Filip", "Franciszek", "Grzegorz", "Hubert",
            "Igor", "Jakub", "Jan", "Jacek", "Kacper", "Kamil", "Karol",
            "Krzysztof", "Lukasz", "Maciej", "Marek", "Mateusz", "Michal",
            "Mikolaj", "Patryk", "Pawel", "Piotr", "Przemyslaw", "Rafal",
            "Robert", "Sebastian", "Stanislaw", "Szymon", "Tomasz",
            "Wojciech", "Zbigniew", "Wiktor",
        ],
        "female": [
            "Agnieszka", "Aleksandra", "Alicja", "Amelia", "Anna", "Barbara",
            "Bianka", "Dagmara", "Daria", "Dorota", "Emilia", "Ewa",
            "Gabriela", "Hanna", "Iga", "Irena", "Joanna", "Julia",
            "Kamila", "Karolina", "Katarzyna", "Kinga", "Krystyna", "Laura",
            "Lena", "Magdalena", "Maja", "Malgorzata", "Marta", "Martyna",
            "Natalia", "Nina", "Oliwia", "Patrycja", "Paulina", "Pola",
            "Sandra", "Sara", "Sylwia", "Urszula", "Wanda", "Weronika",
            "Zofia", "Zuzanna",
        ],
        "surnames": [
            "Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kowalczyk",
            "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Wozniak",
            "Dabrowski", "Kozlowski", "Mazur", "Krawczyk", "Piotrowski",
            "Grabowski", "Pawlowski", "Michalski", "Nowicki", "Adamczyk",
            "Dudek", "Sikora", "Witkowski", "Jankowski", "Kwiatkowski",
            "Kaczmarek", "Kucharski", "Krol", "Stepien", "Tomczak",
            "Walczak", "Baran", "Wrobel", "Kruk", "Zajac", "Wilk",
            "Lis", "Borowski", "Malinowski", "Jaworski",
        ],
    },
    "Germany": {
        "male": [
            "Alexander", "Andreas", "Bernd", "Christian", "Daniel", "David",
            "Dieter", "Felix", "Florian", "Frank", "Hans", "Jan", "Jens",
            "Jonas", "Jürgen", "Klaus", "Lukas", "Manfred", "Markus",
            "Martin", "Max", "Michael", "Niklas", "Peter", "Philipp",
            "Sebastian", "Stefan", "Thomas", "Tobias", "Ulrich", "Wolfgang",
        ],
        "female": [
            "Andrea", "Anna", "Barbara", "Birgit", "Christina", "Claudia",
            "Diana", "Elisabeth", "Emma", "Eva", "Frauke", "Hanna", "Helga",
            "Ingrid", "Julia", "Karin", "Katrin", "Laura", "Lena", "Lisa",
            "Maria", "Marina", "Nina", "Petra", "Sabine", "Sophie", "Stefanie",
            "Susanne", "Ulrike", "Uta",
        ],
        "surnames": [
            "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer",
            "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch",
            "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann",
            "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann", "Hartmann",
            "Lange", "Schmitt", "Werner", "Krause", "Lehmann", "Endler",
        ],
    },
    "UK": {
        "male": [
            "Adam", "Alfie", "Arthur", "Callum", "Charlie", "Daniel", "David",
            "Edward", "George", "Harry", "Henry", "Jack", "Jacob", "James",
            "Jamie", "John", "Joseph", "Leo", "Lewis", "Liam", "Logan",
            "Lucas", "Mark", "Mason", "Michael", "Mohammed", "Noah", "Oliver",
            "Oscar", "Paul", "Peter", "Richard", "Robert", "Samuel", "Thomas",
            "William",
        ],
        "female": [
            "Amelia", "Ava", "Chloe", "Charlotte", "Eleanor", "Ella", "Ellie",
            "Emily", "Emma", "Evelyn", "Freya", "Grace", "Hannah", "Harper",
            "Holly", "Isabella", "Isla", "Ivy", "Jessica", "Lily", "Lucy",
            "Maisie", "Margaret", "Maya", "Mia", "Nora", "Olivia", "Phoebe",
            "Poppy", "Rose", "Ruby", "Sara", "Scarlett", "Sienna", "Sophia",
            "Zara",
        ],
        "surnames": [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
            "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
            "Taylor", "Anderson", "Thomas", "Moore", "Jackson", "Martin",
            "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez",
            "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen",
            "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson",
            "Hill", "Ramirez", "Campbell",
        ],
    },
    "France": {
        "male": [
            "Adrien", "Alexandre", "Antoine", "Arthur", "Augustin", "Baptiste",
            "Bastien", "Camille", "Charles", "Côme", "Damien", "Edouard",
            "Emmanuel", "Enzo", "Etienne", "Fabien", "Florian", "François",
            "Gabriel", "Guillaume", "Hugo", "Jean", "Julien", "Léon",
            "Louis", "Lucas", "Marc", "Martin", "Mathéo", "Matthieu",
            "Maxime", "Nicolas", "Noé", "Paul", "Pierre", "Raphaël",
            "Rémi", "Simon", "Théo", "Thomas",
        ],
        "female": [
            "Adèle", "Alice", "Ambre", "Amélie", "Anaïs", "Anna", "Camille",
            "Charlotte", "Chloé", "Clara", "Claire", "Clémence", "Elise",
            "Emma", "Émilie", "Estelle", "Eva", "Fanny", "Gabrielle", "Héloïse",
            "Inès", "Jeanne", "Julia", "Juliette", "Léa", "Lola", "Louise",
            "Lucie", "Manon", "Margaux", "Marie", "Mathilde", "Nina",
            "Olivia", "Pauline", "Romane", "Rose", "Sarah", "Sophie", "Zoé",
        ],
        "surnames": [
            "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard",
            "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent",
            "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux",
            "Vincent", "Fournier", "Morel", "Girard", "André", "Lefevre",
            "Mercier", "Dumont", "Boyer", "Garnier", "François", "Lopez",
        ],
    },
    "Spain": {
        "male": [
            "Adrián", "Alejandro", "Álvaro", "Antonio", "Bruno", "Carlos",
            "Daniel", "David", "Diego", "Eduardo", "Emilio", "Fernando",
            "Francisco", "Gabriel", "Hugo", "Iker", "Jaime", "Javier",
            "Jesús", "Joaquín", "Jorge", "José", "Juan", "Leonardo",
            "Lucas", "Manuel", "Marcos", "Mario", "Martín", "Mateo",
            "Miguel", "Nicolás", "Pablo", "Pedro", "Rafael", "Sergio",
            "Unai", "Víctor",
        ],
        "female": [
            "Adriana", "Alba", "Alejandra", "Andrea", "Beatriz", "Carmen",
            "Carla", "Clara", "Daniela", "Elena", "Emma", "Eva", "Gabriela",
            "Helena", "Inés", "Irene", "Jimena", "Julia", "Laura", "Leire",
            "Lola", "Lucía", "María", "Marta", "Nadia", "Noa", "Olivia",
            "Paula", "Sara", "Silvia", "Sofía", "Teresa", "Valentina", "Vera",
        ],
        "surnames": [
            "García", "Fernández", "González", "Rodríguez", "López",
            "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez",
            "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Muñoz",
            "Romero", "Alonso", "Gutiérrez", "Navarro", "Torres", "Domínguez",
            "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco",
            "Molina",
        ],
    },
    "Italy": {
        "male": [
            "Alessandro", "Andrea", "Antonio", "Davide", "Edoardo", "Emilio",
            "Enrico", "Federico", "Filippo", "Francesco", "Giacomo",
            "Giovanni", "Giulio", "Leonardo", "Lorenzo", "Luca", "Marco",
            "Mattia", "Matteo", "Niccolò", "Paolo", "Pietro", "Riccardo",
            "Salvatore", "Stefano", "Tommaso", "Valerio", "Vittorio",
        ],
        "female": [
            "Alessia", "Alice", "Aurora", "Beatrice", "Bianca", "Carlotta",
            "Chiara", "Elena", "Eleonora", "Elisa", "Emma", "Erica",
            "Giorgia", "Giulia", "Greta", "Irene", "Lisa", "Ludovica",
            "Margherita", "Marta", "Nicole", "Noemi", "Sara", "Sofia",
            "Valentina", "Virginia", "Vittoria",
        ],
        "surnames": [
            "Rossi", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo",
            "Russo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti",
            "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi",
            "Moretti", "Barbieri", "Fontana", "Santoro", "Mariani",
            "Rinaldi", "Caruso", "Ferrara", "Galli", "Martini", "Leone",
        ],
    },
    "Netherlands": {
        "male": [
            "Bas", "Bram", "Daan", "Dirk", "Erik", "Floris", "Gijs", "Hans",
            "Hendrik", "Jacob", "Jasper", "Jelle", "Joost", "Joris", "Koen",
            "Lucas", "Luuk", "Maarten", "Niels", "Olivier", "Pieter",
            "Pepijn", "Ruben", "Sem", "Sven", "Thijs", "Tijn", "Tom",
            "Wouter", "Xander",
        ],
        "female": [
            "Anna", "Anouk", "Bente", "Cato", "Charlotte", "Daan", "Eline",
            "Eva", "Fenna", "Feline", "Fleur", "Gwen", "Hailey", "Iris",
            "Jade", "Janna", "Jolie", "Julia", "Lara", "Lena", "Lily",
            "Lisa", "Liv", "Lotte", "Maud", "Noa", "Nora", "Roos", "Sara",
            "Sophie",
        ],
        "surnames": [
            "de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk",
            "Bakker", "Janssen", "Visser", "Smit", "Meijer", "de Boer",
            "Mulder", "de Groot", "Bos", "Peters", "Hendriks", "van Leeuwen",
            "Dekker", "Brouwer", "Dijkstra", "Smits", "de Ridder", "van der Meer",
            "van der Linden", "Kok", "Vos", "de Wit", "Kroon", "Wolters",
            "Postma",
        ],
    },
    "USA": {
        "male": [
            "Aaron", "Adam", "Andrew", "Anthony", "Benjamin", "Brandon",
            "Brian", "Caleb", "Charles", "Christopher", "Connor", "Daniel",
            "David", "Dylan", "Ethan", "Gabriel", "Henry", "Isaac", "Jack",
            "Jacob", "James", "John", "Joseph", "Joshua", "Justin", "Kevin",
            "Logan", "Lucas", "Matthew", "Michael", "Nathan", "Nicholas",
            "Noah", "Oliver", "Owen", "Ryan", "Samuel", "Sebastian", "Tyler",
            "William",
        ],
        "female": [
            "Abigail", "Alexis", "Amelia", "Aria", "Aubrey", "Audrey",
            "Ava", "Bella", "Brooklyn", "Camila", "Charlotte", "Chloe",
            "Claire", "Eleanor", "Eliana", "Elizabeth", "Ella", "Ellie",
            "Emily", "Emma", "Evelyn", "Grace", "Hannah", "Harper", "Hazel",
            "Isabella", "Jade", "Julia", "Layla", "Lily", "Luna", "Maya",
            "Mia", "Nora", "Olivia", "Penelope", "Riley", "Scarlett",
            "Sofia", "Zoe",
        ],
        "surnames": [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
            "Miller", "Davis", "Rodriguez", "Martinez", "Wilson", "Anderson",
            "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson",
            "White", "Harris", "Clark", "Lewis", "Robinson", "Walker",
            "Young", "Allen", "King", "Wright", "Lopez", "Hill", "Scott",
            "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell",
            "Perez", "Roberts",
        ],
    },
    "India": {
        "male": [
            "Aarav", "Abhay", "Abhinav", "Aditya", "Ajay", "Akash", "Amit",
            "Anand", "Arjun", "Arnav", "Aryan", "Atul", "Ayush", "Devansh",
            "Dhruv", "Gaurav", "Harsh", "Ishaan", "Kabir", "Karan", "Krishna",
            "Laksh", "Manish", "Mohan", "Nikhil", "Nitin", "Pranav", "Rahul",
            "Raj", "Rohan", "Sameer", "Sanjay", "Shivam", "Siddharth", "Tushar",
            "Varun", "Vikram", "Vivek", "Yash", "Yuvan",
        ],
        "female": [
            "Aanya", "Aditi", "Ananya", "Anika", "Anjali", "Anvi", "Diya",
            "Ira", "Ishita", "Kavya", "Kiara", "Lavanya", "Meera", "Myra",
            "Nisha", "Pari", "Pooja", "Priya", "Riya", "Saanvi", "Sakshi",
            "Sara", "Shreya", "Siya", "Tanvi", "Vanya", "Vihaan", "Zara",
            "Naina", "Bhavya",
        ],
        "surnames": [
            "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy",
            "Nair", "Iyer", "Joshi", "Mehta", "Shah", "Rao", "Desai",
            "Chopra", "Kapoor", "Malhotra", "Bose", "Banerjee", "Mukherjee",
            "Das", "Sengupta", "Chatterjee", "Naidu", "Pillai", "Menon",
            "Kulkarni", "Deshpande", "Agarwal", "Bhat",
        ],
    },
}

# ============================================================
# 3. CITY POOLS PER COUNTRY (city, weight)
# ============================================================

CITIES = {
    "Poland": [
        ("Warsaw", 0.25), ("Krakow", 0.15), ("Wroclaw", 0.12), ("Poznan", 0.10),
        ("Gdansk", 0.08), ("Lodz", 0.08), ("Katowice", 0.07), ("Lublin", 0.05),
        ("Bydgoszcz", 0.03), ("Szczecin", 0.03), ("Bialystok", 0.02),
        ("Torun", 0.02),
    ],
    "Germany": [
        ("Berlin", 0.20), ("Munich", 0.15), ("Hamburg", 0.12), ("Cologne", 0.10),
        ("Frankfurt", 0.10), ("Stuttgart", 0.08), ("Düsseldorf", 0.07),
        ("Leipzig", 0.06), ("Dortmund", 0.05), ("Essen", 0.04),
        ("Bremen", 0.02), ("Dresden", 0.01),
    ],
    "UK": [
        ("London", 0.30), ("Manchester", 0.12), ("Birmingham", 0.10),
        ("Leeds", 0.08), ("Glasgow", 0.07), ("Liverpool", 0.06),
        ("Newcastle", 0.05), ("Sheffield", 0.05), ("Bristol", 0.05),
        ("Edinburgh", 0.05), ("Cardiff", 0.04), ("Belfast", 0.03),
    ],
    "France": [
        ("Paris", 0.25), ("Marseille", 0.12), ("Lyon", 0.10), ("Toulouse", 0.08),
        ("Nice", 0.07), ("Nantes", 0.07), ("Strasbourg", 0.06), ("Montpellier", 0.06),
        ("Bordeaux", 0.06), ("Lille", 0.05), ("Rennes", 0.04), ("Le Havre", 0.04),
    ],
    "Spain": [
        ("Madrid", 0.25), ("Barcelona", 0.18), ("Valencia", 0.10),
        ("Seville", 0.08), ("Zaragoza", 0.06), ("Malaga", 0.06),
        ("Murcia", 0.05), ("Palma", 0.05), ("Bilbao", 0.05),
        ("Alicante", 0.04), ("Cordoba", 0.04), ("Granada", 0.04),
    ],
    "Italy": [
        ("Rome", 0.20), ("Milan", 0.15), ("Naples", 0.10), ("Turin", 0.08),
        ("Palermo", 0.07), ("Genoa", 0.06), ("Bologna", 0.06), ("Florence", 0.06),
        ("Bari", 0.05), ("Catania", 0.05), ("Venice", 0.06), ("Verona", 0.06),
    ],
    "Netherlands": [
        ("Amsterdam", 0.25), ("Rotterdam", 0.15), ("The Hague", 0.12),
        ("Utrecht", 0.10), ("Eindhoven", 0.08), ("Groningen", 0.07),
        ("Tilburg", 0.06), ("Almere", 0.05), ("Breda", 0.05),
        ("Nijmegen", 0.04), ("Apeldoorn", 0.03),
    ],
    "USA": [
        ("New York", 0.15), ("Los Angeles", 0.12), ("Chicago", 0.10),
        ("Houston", 0.08), ("Phoenix", 0.07), ("Philadelphia", 0.06),
        ("San Antonio", 0.06), ("San Diego", 0.05), ("Dallas", 0.05),
        ("Austin", 0.05), ("Seattle", 0.05), ("Denver", 0.04),
        ("Boston", 0.04), ("Atlanta", 0.04), ("Miami", 0.04),
    ],
    "India": [
        ("Mumbai", 0.18), ("Delhi", 0.15), ("Bangalore", 0.12), ("Hyderabad", 0.10),
        ("Chennai", 0.09), ("Kolkata", 0.08), ("Pune", 0.07), ("Ahmedabad", 0.06),
        ("Jaipur", 0.05), ("Surat", 0.04), ("Lucknow", 0.03), ("Nagpur", 0.03),
    ],
}

# ============================================================
# 4. CURRENCY & SALARY CONFIG PER COUNTRY
# ============================================================
# Base salary ranges are in local currency (monthly gross)
# These are rough market estimates

COUNTRY_CONFIG = {
    "Poland":       {"currency": "PLN", "symbol": "zł",   "fx_to_usd": 0.25},
    "Germany":      {"currency": "EUR", "symbol": "€",    "fx_to_usd": 1.08},
    "UK":           {"currency": "GBP", "symbol": "£",    "fx_to_usd": 1.27},
    "France":       {"currency": "EUR", "symbol": "€",    "fx_to_usd": 1.08},
    "Spain":        {"currency": "EUR", "symbol": "€",    "fx_to_usd": 1.08},
    "Italy":        {"currency": "EUR", "symbol": "€",    "fx_to_usd": 1.08},
    "Netherlands":  {"currency": "EUR", "symbol": "€",    "fx_to_usd": 1.08},
    "USA":          {"currency": "USD", "symbol": "$",    "fx_to_usd": 1.00},
    "India":        {"currency": "INR", "symbol": "₹",    "fx_to_usd": 0.012},
}

# Salary ranges per level — in LOCAL CURRENCY, monthly gross
# Values are approximate market rates per country
SALARY_RANGES = {
    "Poland": {
        "junior":  (3500, 5500),   "mid": (5500, 9000),
        "senior":  (9000, 15000),  "lead": (13000, 20000),
        "manager": (16000, 28000),
    },
    "Germany": {
        "junior":  (2800, 3800),   "mid": (3800, 5500),
        "senior":  (5500, 7500),   "lead": (7000, 9500),
        "manager": (9000, 14000),
    },
    "UK": {
        "junior":  (2200, 3200),   "mid": (3200, 4800),
        "senior":  (4800, 6800),   "lead": (6200, 8500),
        "manager": (8000, 12000),
    },
    "France": {
        "junior":  (2400, 3400),   "mid": (3400, 4900),
        "senior":  (4900, 6800),   "lead": (6300, 8800),
        "manager": (8200, 13000),
    },
    "Spain": {
        "junior":  (1800, 2600),   "mid": (2600, 3800),
        "senior":  (3800, 5200),   "lead": (4800, 6800),
        "manager": (6200, 10000),
    },
    "Italy": {
        "junior":  (1900, 2700),   "mid": (2700, 3900),
        "senior":  (3900, 5400),   "lead": (5000, 7000),
        "manager": (6500, 10500),
    },
    "Netherlands": {
        "junior":  (2600, 3600),   "mid": (3600, 5200),
        "senior":  (5200, 7200),   "lead": (6800, 9200),
        "manager": (8500, 13000),
    },
    "USA": {
        "junior":  (4000, 6000),   "mid": (6000, 9000),
        "senior":  (9000, 14000),  "lead": (13000, 18000),
        "manager": (17000, 28000),
    },
    "India": {
        "junior":  (25000, 50000),    "mid": (50000, 90000),
        "senior":  (90000, 160000),   "lead": (150000, 250000),
        "manager": (220000, 400000),
    },
}

# ============================================================
# 5. DEPARTMENTS & JOB TITLES
# ============================================================

DEPARTMENTS = {
    "IT": [
        "Junior Developer", "Mid Developer", "Senior Developer", "Tech Lead",
        "DevOps Engineer", "QA Specialist", "QA Engineer", "Data Analyst",
        "Data Scientist", "System Administrator", "IT Manager", "Scrum Master",
        "Solution Architect", "Frontend Developer", "Backend Developer",
    ],
    "HR": [
        "HR Specialist", "HR Business Partner", "Recruiter", "Payroll Specialist",
        "Training Coordinator", "HR Manager", "Talent Acquisition Specialist",
    ],
    "Sales": [
        "Sales Representative", "Account Manager", "Sales Manager",
        "Business Development Manager", "Key Account Manager",
        "Inside Sales Specialist", "Sales Director",
    ],
    "Finance": [
        "Accountant", "Financial Analyst", "Controller", "Finance Manager",
        "Treasury Specialist", "Bookkeeper", "CFO", "Audit Specialist",
    ],
    "Marketing": [
        "Marketing Specialist", "Content Manager", "SEO Specialist",
        "Social Media Manager", "Brand Manager", "Marketing Director",
        "Graphic Designer", "Copywriter",
    ],
    "Operations": [
        "Operations Analyst", "Operations Supervisor", "Quality Inspector",
        "Maintenance Technician", "Operations Manager", "Process Engineer",
        "Shift Leader", "Machine Operator",
    ],
    "Logistics": [
        "Warehouse Worker", "Logistics Coordinator", "Supply Chain Analyst",
        "Forklift Operator", "Logistics Manager", "Dispatcher",
    ],
    "Legal": [
        "Legal Counsel", "Compliance Officer", "Legal Assistant",
        "Contract Specialist", "Legal Director",
    ],
}

# Level keyword mapping for auto-assignment
LEVEL_KEYWORDS = {
    "junior":  ["Junior", "Trainee", "Intern", "Inside", "Worker", "Operator", "Assistant", "Bookkeeper", "Dispatcher"],
    "mid":     ["Mid", "Specialist", "Coordinator", "Analyst", "Developer", "Engineer", "Recruiter", "Inspector", "Copywriter", "Designer", "Technician", "Counsel"],
    "senior":  ["Senior", "Accountant", "Controller", "Partner", "Officer"],
    "lead":    ["Lead", "Supervisor", "Scrum", "Architect", "Leader", "Scientist"],
    "manager": ["Manager", "Director", "CFO"],
}

LEVEL_ORDER = {"junior": 0, "mid": 1, "senior": 2, "lead": 3, "manager": 4}
LEVEL_TO_GRADE = {"junior": "P1", "mid": "P2", "senior": "P3", "lead": "P4", "manager": "P5"}

# ============================================================
# 6. SHARED ENUMS & POOLS
# ============================================================

GENDERS = ["F", "M", "Other"]
GENDER_WEIGHTS = [0.48, 0.49, 0.03]

CONTRACT_TYPES = ["Permanent", "Fixed-term", "B2B", "Contractor", "Internship"]
CONTRACT_WEIGHTS = [0.55, 0.15, 0.15, 0.10, 0.05]

WORK_MODES = ["On-site", "Hybrid", "Remote"]
WORK_MODE_WEIGHTS = [0.20, 0.55, 0.25]

EMPLOYMENT_STATUSES = ["Active", "Terminated", "On Leave", "Probation"]
EMPLOYMENT_STATUS_WEIGHTS = [0.75, 0.15, 0.07, 0.03]

SALARY_PERIODS = ["Monthly", "Hourly", "Annual"]
SALARY_PERIOD_WEIGHTS = [0.85, 0.10, 0.05]

EDUCATION_LEVELS = ["High School", "Bachelor", "Master", "PhD", "MBA"]
EDUCATION_WEIGHTS = [0.12, 0.32, 0.42, 0.09, 0.05]

LANGUAGES_POOL = ["English", "German", "French", "Spanish", "Italian", "Dutch",
                  "Polish", "Portuguese", "Hindi", "Mandarin", "Japanese",
                  "Arabic", "Russian", "Korean"]

SKILLS_POOL = [
    "Excel", "SQL", "Python", "Power BI", "Tableau", "SAP", "AutoCAD",
    "Azure", "AWS", "Docker", "Kubernetes", "React", "Java", "Kotlin",
    "PMP", "PRINCE2", "ITIL", "Scrum", "Lean Six Sigma", "Accounting",
    "Financial Analysis", "Negotiation", "Project Management",
    "Salesforce", "Oracle", "Jira", "Figma", "Photoshop",
]

# ============================================================
# 7. NATIONAL ID GENERATORS (one per country)
# ============================================================

def strip_accents(text):
    """Remove diacritics from text for email generation."""
    import unicodedata
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def gen_pesel(birth_date, gender):
    """Polish PESEL: YYMMDDXXXZ (Z = checksum). 2000+ months add 20."""
    yy = birth_date.year % 100
    mm = birth_date.month + (20 if birth_date.year >= 2000 else 0)
    dd = birth_date.day
    serial = int(RNG.integers(100, 999))
    if gender == "F" and serial % 2 != 0:
        serial += 1
    elif gender == "M" and serial % 2 == 0:
        serial += 1
    tenth = int(RNG.integers(0, 10))
    digits = [yy // 10, yy % 10, mm // 10, mm % 10,
              dd // 10, dd % 10,
              serial // 100, (serial // 10) % 10, serial % 10, tenth]
    weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    checksum = (10 - sum(d * w for d, w in zip(digits, weights)) % 10) % 10
    digits.append(checksum)
    return "".join(str(d) for d in digits)


def gen_nino(birth_date, gender):
    """UK National Insurance Number: XX NN NN NN X (2 letters, 6 digits, 1 letter)."""
    prefix_letters = "ABCEGHJKLMNPRSTWXYZ"
    suffix_letters = "ABCD"
    p1 = RNG.choice(list(prefix_letters), size=2)
    nums = RNG.integers(0, 10, size=6)
    s1 = RNG.choice(list(suffix_letters))
    return f"{p1[0]}{p1[1]} {nums[0]}{nums[1]} {nums[2]}{nums[3]} {nums[4]}{nums[5]} {s1}"


def gen_steuer_id(birth_date, gender):
    """German Steuer-ID: 11 digits. Format: XX XXX XXX XXX."""
    digits = RNG.integers(0, 10, size=11)
    return f"{digits[0]}{digits[1]} {digits[2]}{digits[3]}{digits[4]} {digits[5]}{digits[6]}{digits[7]} {digits[8]}{digits[9]}{digits[10]}"


def gen_insee(birth_date, gender):
    """French INSEE / Social Security Number: S YY MM DD DDD CC.
    S = 1 (male) or 2 (female)."""
    s = 1 if gender == "M" else 2
    yy = birth_date.year % 100
    mm = birth_date.month
    dd = birth_date.day
    dept = int(RNG.integers(1, 96))
    serial = int(RNG.integers(100, 999))
    raw = f"{s}{yy:02d}{mm:02d}{dd:02d}{dept:02d}{serial:03d}"
    # Luhn checksum
    total = 0
    for i, ch in enumerate(raw):
        n = int(ch)
        if i % 2 == 0:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    key = (10 - total % 10) % 10
    return f"{s} {yy:02d} {mm:02d} {dd:02d} {dept:02d} {serial:03d} {key:01d}"


def gen_dni(birth_date, gender):
    """Spanish DNI: 8 digits + 1 control letter."""
    digits = RNG.integers(0, 10, size=8)
    num = int("".join(str(d) for d in digits))
    letters = "TRWAGMYFPDXBNJZSQVHLCKE"
    letter = letters[num % 23]
    return f"{num:08d}{letter}"


def gen_codice_fiscale(birth_date, gender, first_name, last_name):
    """Italian Codice Fiscale: simplified 16-char code.
    Format: CONSONANTS(3 surname) + CONSONANTS(3 name) + YY + month_letter + DD + code + control."""
    month_map = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "H",
                 7: "L", 8: "M", 9: "P", 10: "R", 11: "S", 12: "T"}

    def extract_consonants(s, n):
        cons = [c.upper() for c in s if c.upper() in "BCDFGHJKLMNPQRSTVWXYZ"]
        vows = [c.upper() for c in s if c.upper() in "AEIOU"]
        result = (cons + vows + ["X"] * n)[:n]
        return "".join(result)

    surname_part = extract_consonants(strip_accents(last_name), 3)
    name_part = extract_consonants(strip_accents(first_name), 3)
    yy = f"{birth_date.year % 100:02d}"
    mo = month_map.get(birth_date.month, "X")
    # For females, day has +40
    dd = birth_date.day + (40 if gender == "F" else 0)
    code = int(RNG.integers(100, 999))
    base = surname_part + name_part + yy + mo + f"{dd:02d}" + f"{code:03d}"
    # Control character
    ctrl_set = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    odd_vals = {c: i for i, c in enumerate("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")}
    even_vals = {c: v for c, v in zip("ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                                      [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25])}
    total = 0
    for i, ch in enumerate(base):
        if i % 2 == 0:
            v = odd_vals.get(ch, 0)
            if ch.isdigit():
                v = int(ch)
            else:
                # Odd-position values (checksum table)
                odd_table = {c: v for c, v in zip("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                                                   [1,0,5,7,9,13,15,17,19,21,1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23])}
                v = odd_table.get(ch, 0)
            total += v
        else:
            if ch.isdigit():
                total += int(ch)
            else:
                even_v = {c: i for i, c in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ")}
                total += even_v.get(ch, 0)
    ctrl = ctrl_set[total % 26]
    return base + ctrl


def gen_bsn(birth_date, gender):
    """Dutch BSN (Burgerservicenummer): 9 digits with 11-test checksum."""
    while True:
        digits = RNG.integers(0, 10, size=9)
        # First digit cannot be 0
        if digits[0] == 0:
            continue
        total = sum(int(digits[i]) * (9 - i) for i in range(8)) + int(digits[8]) * (-1)
        if total % 11 == 0:
            break
    return f"{digits[0]}{digits[1]}{digits[2]}.{digits[3]}{digits[4]}{digits[5]}.{digits[6]}{digits[7]}{digits[8]}"


def gen_ssn(birth_date, gender):
    """US Social Security Number: AAA-GG-SSSS (no leading zeros, no 666, no 900+ area)."""
    while True:
        area = int(RNG.integers(1, 900))
        if area == 666 or area >= 900:
            continue
        group = int(RNG.integers(1, 100))
        serial = int(RNG.integers(1, 10000))
        return f"{area:03d}-{group:02d}-{serial:04d}"


def gen_aadhaar(birth_date, gender):
    """Indian Aadhaar: 12 digits (XXXX XXXX XXXX)."""
    digits = RNG.integers(0, 10, size=12)
    # First digit cannot be 0 or 1
    if digits[0] < 2:
        digits[0] = int(RNG.integers(2, 10))
    return f"{digits[0]}{digits[1]}{digits[2]}{digits[3]} {digits[4]}{digits[5]}{digits[6]}{digits[7]} {digits[8]}{digits[9]}{digits[10]}{digits[11]}"


ID_GENERATORS = {
    "Poland":      lambda bd, g, fn, ln: gen_pesel(bd, g),
    "Germany":     lambda bd, g, fn, ln: gen_steuer_id(bd, g),
    "UK":          lambda bd, g, fn, ln: gen_nino(bd, g),
    "France":      lambda bd, g, fn, ln: gen_insee(bd, g),
    "Spain":       lambda bd, g, fn, ln: gen_dni(bd, g),
    "Italy":       lambda bd, g, fn, ln: gen_codice_fiscale(bd, g, fn, ln),
    "Netherlands": lambda bd, g, fn, ln: gen_bsn(bd, g),
    "USA":         lambda bd, g, fn, ln: gen_ssn(bd, g),
    "India":       lambda bd, g, fn, ln: gen_aadhaar(bd, g),
}

ID_LABELS = {
    "Poland": "PESEL", "Germany": "Steuer-ID", "UK": "NINO",
    "France": "INSEE", "Spain": "DNI", "Italy": "Codice Fiscale",
    "Netherlands": "BSN", "USA": "SSN", "India": "Aadhaar",
}

# ============================================================
# 8. PHONE GENERATORS PER COUNTRY
# ============================================================

def gen_phone_pl():
    p = RNG.choice(["512", "513", "514", "515", "516", "517", "518", "519",
                    "600", "601", "602", "604", "605", "606", "607", "608",
                    "661", "662", "663", "664", "665", "666", "667", "668",
                    "691", "692", "693", "694", "695", "696", "697",
                    "721", "722", "723", "724", "728", "729",
                    "730", "731", "732", "733", "790", "791"])
    rest = int(RNG.integers(100, 999))
    last = int(RNG.integers(100, 999))
    return f"+48 {p} {rest} {last}"


def gen_phone_de():
    p = RNG.choice(["151", "152", "157", "159", "160", "162", "163",
                    "170", "171", "172", "173", "175", "176", "177", "178",
                    "179", "201", "211", "221", "231", "241", "251", "261",
                    "271", "281", "291", "301", "331", "341", "351", "361",
                    "371", "381", "391", "40", "41", "42", "43", "44",
                    "89", "90", "91", "92", "93", "94", "95", "96", "97", "98"])
    rest = int(RNG.integers(1000000, 9999999))
    return f"+49 {p} {rest}"


def gen_phone_uk():
    p = RNG.choice(["7400", "7401", "7402", "7403", "7404", "7405",
                    "7450", "7451", "7452", "7453", "7454", "7455",
                    "7700", "7701", "7702", "7703", "7704", "7705",
                    "7800", "7801", "7802", "7803", "7804", "7805",
                    "7911", "7912", "7913", "7914", "7915", "7916",
                    "7917", "7918", "7919", "7920", "7921", "7922"])
    rest = int(RNG.integers(100000, 999999))
    return f"+44 {p} {rest}"


def gen_phone_fr():
    p1 = int(RNG.integers(6, 8))
    if p1 == 7:
        p1 = 7  # 07 is mobile
    rest = [int(RNG.integers(0, 10)) for _ in range(8)]
    return f"+33 {p1} {rest[0]}{rest[1]} {rest[2]}{rest[3]} {rest[4]}{rest[5]} {rest[6]}{rest[7]}"


def gen_phone_es():
    p = RNG.choice(["600", "601", "602", "603", "604", "605", "606",
                    "607", "608", "609", "610", "611", "612", "613",
                    "614", "615", "616", "617", "618", "619",
                    "622", "623", "624", "625", "626", "627", "628",
                    "629", "630", "631", "632", "633", "634", "635",
                    "636", "637", "638", "639", "640", "644", "645",
                    "646", "647", "648", "649",
                    "670", "671", "672", "673", "674", "675", "676",
                    "677", "678", "679", "680", "681", "682", "683",
                    "684", "685", "686", "687", "688", "689"])
    rest = int(RNG.integers(100000, 999999))
    return f"+34 {p} {rest}"


def gen_phone_it():
    p = RNG.choice(["320", "321", "322", "323", "324", "325", "326", "327",
                    "328", "329", "330", "331", "333", "334", "335", "336",
                    "337", "338", "339", "340", "341", "342", "343", "344",
                    "345", "346", "347", "348", "349",
                    "350", "351", "352", "353", "354", "355", "356",
                    "357", "358", "359", "360", "361", "362", "363",
                    "366", "368", "370", "371", "373", "375", "377",
                    "380", "381", "382", "383", "384", "385", "386",
                    "388", "389", "390", "391", "392", "393"])
    rest = int(RNG.integers(1000000, 9999999))
    return f"+39 {p} {rest}"


def gen_phone_nl():
    p = RNG.choice(["610", "611", "612", "613", "614", "615", "616",
                    "617", "618", "619", "620", "621", "622", "623",
                    "624", "625", "626", "627", "628", "629",
                    "630", "631", "632", "633", "634", "635", "636",
                    "637", "638", "639", "640", "641", "642", "643",
                    "644", "645", "646", "647", "648", "649",
                    "650", "651", "652", "653", "654", "655"])
    rest = int(RNG.integers(1000000, 9999999))
    return f"+31 6 {p[1]}{rest}"


def gen_phone_us():
    area = int(RNG.integers(200, 999))
    exchange = int(RNG.integers(200, 999))
    subscriber = int(RNG.integers(1000, 9999))
    return f"+1 ({area}) {exchange}-{subscriber}"


def gen_phone_in():
    # Indian mobile: +91 followed by 10 digits starting with 6-9
    first = int(RNG.integers(6, 10))
    rest = [int(RNG.integers(0, 10)) for _ in range(9)]
    digits_str = f"{first}" + "".join(str(d) for d in rest)
    return f"+91 {digits_str[:5]} {digits_str[5:]}"


PHONE_GENERATORS = {
    "Poland": gen_phone_pl,
    "Germany": gen_phone_de,
    "UK": gen_phone_uk,
    "France": gen_phone_fr,
    "Spain": gen_phone_es,
    "Italy": gen_phone_it,
    "Netherlands": gen_phone_nl,
    "USA": gen_phone_us,
    "India": gen_phone_in,
}

# ============================================================
# 9. HELPER FUNCTIONS
# ============================================================

def assign_level(job_title):
    """Assign job level based on keywords in the title."""
    title_lower = job_title.lower()
    for level, keywords in LEVEL_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in title_lower:
                return level
    return "mid"


def compute_salary(country, level, tenure_years, salary_period):
    """Compute salary based on country, level, tenure, and pay period."""
    lo, hi = SALARY_RANGES[country][level]
    base = RNG.uniform(lo, hi)
    # Tenure bonus: +2% per year, max +30%
    tenure_bonus = min(tenure_years * 0.02, 0.30)
    monthly = base * (1 + tenure_bonus)
    if salary_period == "Hourly":
        hourly = monthly / 168
        return round(hourly, 2)
    elif salary_period == "Annual":
        return round(monthly * 12, 2)
    return round(monthly, 2)


def compute_bonus(level, country):
    """Compute bonus — 35% have no bonus, rest gets level-based amount."""
    if RNG.random() < 0.35:
        return 0.0
    lo, hi = SALARY_RANGES[country][level]
    # Bonus is roughly 0.5–2 months of base salary
    bonus = RNG.uniform(lo * 0.5, hi * 2)
    return round(bonus, 2)


def random_birth_date():
    """Generate a birth date with normal distribution centered around 1985."""
    year = int(np.clip(RNG.normal(1985, 10), 1955, 2005))
    month = int(RNG.integers(1, 13))
    max_day = 28 if month == 2 else (30 if month in [4, 6, 9, 11] else 31)
    day = int(RNG.integers(1, max_day + 1))
    return datetime(year, month, day)


def generate_email(first_name, last_name, country, seen_emails):
    """Generate a unique email address."""
    fn = strip_accents(first_name.lower()).replace(" ", "")
    ln = strip_accents(last_name.lower()).replace(" ", "").replace("'", "")
    base = f"{fn}.{ln}"
    email = f"{base}@globalcorp.com"
    suffix = 2
    while email in seen_emails:
        email = f"{base}{suffix}@globalcorp.com"
        suffix += 1
    seen_emails.add(email)
    return email


# ============================================================
# 10. DATA GENERATION
# ============================================================

print(f"Generating {N_EMPLOYEES} employees for an international company...")

# --- Country assignment ---
countries_arr = RNG.choice(COUNTRIES, size=N_EMPLOYEES, p=COUNTRY_WEIGHTS)

# --- Gender ---
genders_arr = RNG.choice(GENDERS, size=N_EMPLOYEES, p=GENDER_WEIGHTS)

# --- Names ---
first_names = []
last_names = []
for i in range(N_EMPLOYEES):
    c = countries_arr[i]
    g = genders_arr[i]
    if g == "M":
        first_names.append(str(RNG.choice(NAMES[c]["male"])))
        last_names.append(str(RNG.choice(NAMES[c]["surnames"])))
    elif g == "F":
        first_names.append(str(RNG.choice(NAMES[c]["female"])))
        last_names.append(str(RNG.choice(NAMES[c]["surnames"])))
    else:  # "Other"
        if RNG.random() < 0.5:
            first_names.append(str(RNG.choice(NAMES[c]["male"])))
        else:
            first_names.append(str(RNG.choice(NAMES[c]["female"])))
        last_names.append(str(RNG.choice(NAMES[c]["surnames"])))

# --- Birth dates ---
birth_dates = [random_birth_date() for _ in range(N_EMPLOYEES)]

# --- National IDs ---
national_ids = []
for i in range(N_EMPLOYEES):
    gen = ID_GENERATORS[countries_arr[i]]
    national_ids.append(gen(birth_dates[i], genders_arr[i], first_names[i], last_names[i]))

# --- Emails ---
seen_emails = set()
emails = [generate_email(first_names[i], last_names[i], countries_arr[i], seen_emails)
          for i in range(N_EMPLOYEES)]

# --- Phone numbers ---
phones = [PHONE_GENERATORS[countries_arr[i]]() for i in range(N_EMPLOYEES)]

# --- National ID type (for clarity) ---
national_id_types = [ID_LABELS[countries_arr[i]] for i in range(N_EMPLOYEES)]

# --- Department & Job Title ---
departments = []
job_titles = []
for _ in range(N_EMPLOYEES):
    dept = str(RNG.choice(list(DEPARTMENTS.keys())))
    title = str(RNG.choice(DEPARTMENTS[dept]))
    departments.append(dept)
    job_titles.append(title)

# --- Job Level ---
job_levels = [assign_level(t) for t in job_titles]

# --- Hire dates (must be >= 18th birthday) ---
hire_dates = []
for i in range(N_EMPLOYEES):
    bd = birth_dates[i]
    min_hire = datetime(bd.year + 18, bd.month, min(bd.day, 28))
    if min_hire > TODAY:
        min_hire = TODAY - timedelta(days=365)
    delta_days = (TODAY - min_hire).days
    if delta_days <= 0:
        hire_dates.append(min_hire)
    else:
        offset = int(RNG.integers(0, delta_days))
        hire_dates.append(min_hire + timedelta(days=offset))

# --- Tenure ---
tenures = np.array([(TODAY - hd).days / 365.25 for hd in hire_dates])

# --- Employment status ---
employment_statuses = RNG.choice(EMPLOYMENT_STATUSES, size=N_EMPLOYEES, p=EMPLOYMENT_STATUS_WEIGHTS)

# --- Termination date ---
termination_dates = []
for i, status in enumerate(employment_statuses):
    if status == "Terminated":
        span = max(60, (TODAY - hire_dates[i]).days)
        td = hire_dates[i] + timedelta(days=int(RNG.integers(30, span)))
        if td > TODAY:
            td = TODAY - timedelta(days=int(RNG.integers(1, 30)))
        termination_dates.append(td)
    else:
        termination_dates.append(None)

# --- Contract type ---
contract_types = RNG.choice(CONTRACT_TYPES, size=N_EMPLOYEES, p=CONTRACT_WEIGHTS)

# --- FTE ---
ftes = RNG.choice([1.0, 0.8, 0.75, 0.5, 0.25], size=N_EMPLOYEES, p=[0.70, 0.12, 0.08, 0.08, 0.02])

# --- Currency (based on country) ---
currencies = [COUNTRY_CONFIG[countries_arr[i]]["currency"] for i in range(N_EMPLOYEES)]

# --- Salary period ---
salary_periods = RNG.choice(SALARY_PERIODS, size=N_EMPLOYEES, p=SALARY_PERIOD_WEIGHTS)

# --- Salary ---
salaries = []
for i in range(N_EMPLOYEES):
    sal = compute_salary(countries_arr[i], job_levels[i], tenures[i], salary_periods[i])
    salaries.append(sal)

# --- Bonus ---
bonuses = [compute_bonus(job_levels[i], countries_arr[i]) for i in range(N_EMPLOYEES)]

# --- Salary grade ---
salary_grades = [LEVEL_TO_GRADE[lvl] for lvl in job_levels]

# --- City & Country ---
cities = []
for i in range(N_EMPLOYEES):
    c = countries_arr[i]
    city_names = [ct[0] for ct in CITIES[c]]
    city_probs = np.array([ct[1] for ct in CITIES[c]])
    city_probs = city_probs / city_probs.sum()
    cities.append(str(RNG.choice(city_names, p=city_probs)))

countries_final = list(countries_arr)

# --- Work mode ---
work_modes = RNG.choice(WORK_MODES, size=N_EMPLOYEES, p=WORK_MODE_WEIGHTS)

# --- Office ID ---
all_cities = sorted(set(cities))
city_to_office = {c: idx + 1 for idx, c in enumerate(all_cities)}
office_ids = [city_to_office[c] for c in cities]

# --- Manager ID (hierarchy) ---
manager_ids = []
for i in range(N_EMPLOYEES):
    my_level = LEVEL_ORDER[job_levels[i]]
    if my_level == 4:  # Top-level managers have no manager
        manager_ids.append(None)
        continue
    candidates = [
        j for j in range(N_EMPLOYEES)
        if LEVEL_ORDER[job_levels[j]] > my_level
        and departments[j] == departments[i]
        and employment_statuses[j] == "Active"
    ]
    if not candidates:
        candidates = [
            j for j in range(N_EMPLOYEES)
            if LEVEL_ORDER[job_levels[j]] > my_level
            and employment_statuses[j] == "Active"
        ]
    if candidates:
        manager_ids.append(int(RNG.choice(candidates)) + 1)
    else:
        manager_ids.append(None)

# --- Education ---
education_levels = RNG.choice(EDUCATION_LEVELS, size=N_EMPLOYEES, p=EDUCATION_WEIGHTS)

# --- Languages (1–3 per person, first is usually the local language) ---
LOCAL_LANG_MAP = {
    "Poland": "Polish", "Germany": "German", "UK": "English",
    "France": "French", "Spain": "Spanish", "Italy": "Italian",
    "Netherlands": "Dutch", "USA": "English", "India": "Hindi",
}

languages = []
for i in range(N_EMPLOYEES):
    local_lang = LOCAL_LANG_MAP[countries_arr[i]]
    # Most people also speak English
    base_langs = [local_lang]
    if local_lang != "English" and RNG.random() < 0.85:
        base_langs.append("English")
    # Add 0-2 more random languages
    n_extra = int(RNG.choice([0, 1, 2], p=[0.50, 0.35, 0.15]))
    pool = [l for l in LANGUAGES_POOL if l not in base_langs]
    extra = list(RNG.choice(pool, size=min(n_extra, len(pool)), replace=False))
    languages.append(", ".join(base_langs + [str(e) for e in extra]))

# --- Skills / Certifications (2–5 per person) ---
skills = []
for _ in range(N_EMPLOYEES):
    n_skills = int(RNG.integers(2, 6))
    sks = RNG.choice(SKILLS_POOL, size=n_skills, replace=False)
    skills.append(", ".join(str(s) for s in sks))

# --- Performance rating (1–5) ---
performance_ratings = RNG.choice([1, 2, 3, 4, 5], size=N_EMPLOYEES, p=[0.05, 0.15, 0.45, 0.25, 0.10])

# --- Vacation days ---
vacation_total = np.where(tenures > 10, 26, np.where(tenures > 0, 20, 0)).astype(int)
vacation_used = []
for vt in vacation_total:
    if vt == 0:
        vacation_used.append(0)
    else:
        vacation_used.append(int(RNG.integers(0, vt + 1)))

# --- Last promotion date ---
last_promotion_dates = []
for i in range(N_EMPLOYEES):
    if tenures[i] < 1:
        last_promotion_dates.append(None)
    elif RNG.random() < 0.30:
        last_promotion_dates.append(None)
    else:
        earliest = hire_dates[i] + timedelta(days=365)
        if earliest > TODAY:
            last_promotion_dates.append(None)
        else:
            lp = earliest + timedelta(days=int(RNG.integers(0, max(1, (TODAY - earliest).days))))
            last_promotion_dates.append(lp)

# --- Projects count ---
projects_counts = RNG.poisson(lam=3, size=N_EMPLOYEES).astype(int)

# --- Emergency contact ---
emergency_contacts = []
for i in range(N_EMPLOYEES):
    c = countries_arr[i]
    en = str(RNG.choice(NAMES[c]["male"] + NAMES[c]["female"]))
    phone_gen = PHONE_GENERATORS[c]
    emergency_contacts.append(f"{en} {phone_gen()}")

# --- Remote eligible ---
is_remote_eligible = RNG.choice([True, False], size=N_EMPLOYEES, p=[0.65, 0.35])

# ============================================================
# 11. BUILD DATAFRAME
# ============================================================

df = pd.DataFrame({
    # 1. Identification
    "employee_id": np.arange(1, N_EMPLOYEES + 1),
    "first_name": first_names,
    "last_name": last_names,
    "gender": genders_arr,
    "date_of_birth": birth_dates,
    "national_id_type": national_id_types,
    "national_id": national_ids,
    "email": emails,
    "phone": phones,

    # 2. Employment & Position
    "hire_date": hire_dates,
    "termination_date": termination_dates,
    "employment_status": employment_statuses,
    "contract_type": contract_types,
    "fte": ftes,
    "job_title": job_titles,
    "job_level": job_levels,
    "department": departments,
    "manager_id": manager_ids,

    # 3. Compensation
    "salary": salaries,
    "currency": currencies,
    "salary_period": salary_periods,
    "bonus": bonuses,
    "salary_grade": salary_grades,

    # 4. Location & Organization
    "city": cities,
    "country": countries_final,
    "work_mode": work_modes,
    "office_id": office_ids,

    # Extra fields
    "performance_rating": performance_ratings,
    "vacation_days_total": vacation_total,
    "vacation_days_used": vacation_used,
    "education_level": education_levels,
    "skills": skills,
    "languages": languages,
    "last_promotion_date": last_promotion_dates,
    "projects_count": projects_counts,
    "emergency_contact": emergency_contacts,
    "is_remote_eligible": is_remote_eligible,
})

# --- Derived columns ---
df["tenure_years"] = df.apply(
    lambda r: round(((r["termination_date"] or TODAY) - r["hire_date"]).days / 365.25, 2),
    axis=1,
)
df["age"] = df["date_of_birth"].apply(
    lambda d: TODAY.year - d.year - ((TODAY.month, TODAY.day) < (d.month, d.day))
)
df["annual_salary"] = df.apply(
    lambda r: round(
        (r["salary"] * 12 if r["salary_period"] == "Monthly"
         else r["salary"] * 168 * 12 if r["salary_period"] == "Hourly"
         else r["salary"]) + r["bonus"],
        2,
    ),
    axis=1,
)
# Salary in USD for comparison across countries
df["annual_salary_usd"] = df.apply(
    lambda r: round(r["annual_salary"] * COUNTRY_CONFIG[r["country"]]["fx_to_usd"], 2),
    axis=1,
)

# ============================================================
# 12. SAVE TO CSV
# ============================================================

output_path = "employees_international.csv"
df.to_csv(output_path, index=False, encoding="utf-8-sig")
print(f"\nSaved {len(df)} records to: {output_path}")

# ============================================================
# 13. SUMMARY / VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("DATA SUMMARY — INTERNATIONAL COMPANY")
print("=" * 70)
print(f"Total employees:             {len(df)}")
print(f"Total columns:               {len(df.columns)}")
print(f"Active:                      {(df['employment_status']=='Active').sum()}")
print(f"Terminated:                  {(df['employment_status']=='Terminated').sum()}")
print(f"On Leave:                    {(df['employment_status']=='On Leave').sum()}")
print(f"Probation:                   {(df['employment_status']=='Probation').sum()}")

print(f"\nGender distribution:\n{df['gender'].value_counts().to_string()}")
print(f"\nCountry distribution:\n{df['country'].value_counts().to_string()}")
print(f"\nDepartment distribution:\n{df['department'].value_counts().to_string()}")
print(f"\nJob level distribution:\n{df['job_level'].value_counts().to_string()}")

print(f"\nNational ID types:\n{df['national_id_type'].value_counts().to_string()}")

print(f"\nCurrency distribution:\n{df['currency'].value_counts().to_string()}")

print(f"\nAnnual salary (USD) — global statistics:")
print(df['annual_salary_usd'].describe().to_string())

print(f"\nAnnual salary (USD) by country:")
for c in sorted(df['country'].unique()):
    subset = df[df['country'] == c]['annual_salary_usd']
    print(f"  {c:15s}: mean={subset.mean():>10,.0f}  median={subset.median():>10,.0f}  n={len(subset):>4d}")

print(f"\nAvg tenure (years):          {df['tenure_years'].mean():.2f}")
print(f"Avg age:                     {df['age'].mean():.1f}")
print(f"NULLs total:                 {df.isnull().sum().sum()}")

print(f"\nColumns ({len(df.columns)}):")
for i, col in enumerate(df.columns, 1):
    print(f"  {i:2d}. {col}")
print("=" * 70)
