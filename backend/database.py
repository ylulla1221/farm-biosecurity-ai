import sqlite3

DATABASE = "farm_database.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    # Farm profile
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS farms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_name TEXT NOT NULL,
            farm_type TEXT NOT NULL,
            animal_count INTEGER NOT NULL,
            farm_area REAL NOT NULL,
            average_animal_age INTEGER NOT NULL,
            normal_mortality REAL NOT NULL,
            quarantine_compliance REAL NOT NULL,
            disinfection_frequency INTEGER NOT NULL,
            visitor_control REAL NOT NULL,
            animal_movement INTEGER NOT NULL,
            equipment_sharing REAL NOT NULL,
            pest_presence REAL NOT NULL,
            water_quality REAL NOT NULL
        )
    """)

    # Daily assessments
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id INTEGER NOT NULL,
            assessment_date TEXT NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            sick_animals INTEGER NOT NULL,
            mortality_today INTEGER NOT NULL,
            vaccination_compliance REAL NOT NULL,
            cleaning_frequency INTEGER NOT NULL,
            ppe_compliance REAL NOT NULL,
            visitor_count INTEGER NOT NULL,
            nearby_outbreak INTEGER NOT NULL DEFAULT 0,
            disease_risk REAL,
            risk_level TEXT,
            biosecurity_score REAL,
            FOREIGN KEY (farm_id) REFERENCES farms(id)
        )
    """)

    connection.commit()
    connection.close()