from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
from datetime import date

from database import get_connection, create_tables
from biosecurity import calculate_biosecurity_score
from recommendations import generate_recommendations


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Farm Biosecurity AI",
    description="AI-powered disease risk prediction and biosecurity assessment",
    version="2.1.0"
)


# Create database tables when the application starts
create_tables()


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD MACHINE LEARNING MODEL
# ============================================================

model = joblib.load("disease_risk_model.pkl")
risk_encoder = joblib.load("risk_level_encoder.pkl")


# ============================================================
# DATA MODELS
# ============================================================

class FarmProfile(BaseModel):
    farm_name: str
    farm_type: str
    animal_count: int
    farm_area: float
    average_animal_age: int
    normal_mortality: float
    quarantine_compliance: float
    disinfection_frequency: int
    visitor_control: float
    animal_movement: int
    equipment_sharing: float
    pest_presence: float
    water_quality: float


class DailyAssessment(BaseModel):
    temperature: float
    humidity: float
    sick_animals: int
    mortality_today: int
    vaccination_compliance: float
    cleaning_frequency: int
    ppe_compliance: float
    visitor_count: int
    nearby_outbreak: int = 0


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Farm Biosecurity AI API is running",
        "version": "2.1.0",
        "model": "XGBoost",
        "features": 20
    }


# ============================================================
# CREATE FARM
# ============================================================

@app.post("/farms")
def create_farm(farm: FarmProfile):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO farms (
            farm_name,
            farm_type,
            animal_count,
            farm_area,
            average_animal_age,
            normal_mortality,
            quarantine_compliance,
            disinfection_frequency,
            visitor_control,
            animal_movement,
            equipment_sharing,
            pest_presence,
            water_quality
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            farm.farm_name,
            farm.farm_type,
            farm.animal_count,
            farm.farm_area,
            farm.average_animal_age,
            farm.normal_mortality,
            farm.quarantine_compliance,
            farm.disinfection_frequency,
            farm.visitor_control,
            farm.animal_movement,
            farm.equipment_sharing,
            farm.pest_presence,
            farm.water_quality
        )
    )

    connection.commit()

    farm_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Farm created successfully",
        "farm_id": farm_id
    }


# ============================================================
# GET FARM
# ============================================================

@app.get("/farms/{farm_id}")
def get_farm(farm_id: int):

    connection = get_connection()

    farm = connection.execute(
        """
        SELECT *
        FROM farms
        WHERE id = ?
        """,
        (farm_id,)
    ).fetchone()

    connection.close()

    if farm is None:
        raise HTTPException(
            status_code=404,
            detail="Farm not found"
        )

    return dict(farm)


# ============================================================
# UPDATE FARM
# ============================================================

@app.put("/farms/{farm_id}")
def update_farm(
    farm_id: int,
    farm: FarmProfile
):

    connection = get_connection()

    existing_farm = connection.execute(
        """
        SELECT id
        FROM farms
        WHERE id = ?
        """,
        (farm_id,)
    ).fetchone()

    if existing_farm is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Farm not found"
        )

    connection.execute(
        """
        UPDATE farms
        SET
            farm_name = ?,
            farm_type = ?,
            animal_count = ?,
            farm_area = ?,
            average_animal_age = ?,
            normal_mortality = ?,
            quarantine_compliance = ?,
            disinfection_frequency = ?,
            visitor_control = ?,
            animal_movement = ?,
            equipment_sharing = ?,
            pest_presence = ?,
            water_quality = ?
        WHERE id = ?
        """,
        (
            farm.farm_name,
            farm.farm_type,
            farm.animal_count,
            farm.farm_area,
            farm.average_animal_age,
            farm.normal_mortality,
            farm.quarantine_compliance,
            farm.disinfection_frequency,
            farm.visitor_control,
            farm.animal_movement,
            farm.equipment_sharing,
            farm.pest_presence,
            farm.water_quality,
            farm_id
        )
    )

    connection.commit()

    connection.close()

    return {
        "message": "Farm updated successfully",
        "farm_id": farm_id
    }


# ============================================================
# DAILY FARM ASSESSMENT
# ============================================================

@app.post("/farms/{farm_id}/assessment")
def assess_farm(
    farm_id: int,
    data: DailyAssessment
):

    # --------------------------------------------------------
    # Get Farm Profile
    # --------------------------------------------------------

    connection = get_connection()

    farm = connection.execute(
        """
        SELECT *
        FROM farms
        WHERE id = ?
        """,
        (farm_id,)
    ).fetchone()

    connection.close()

    if farm is None:

        raise HTTPException(
            status_code=404,
            detail="Farm not found"
        )


    # --------------------------------------------------------
    # Validate Farm Area
    # --------------------------------------------------------

    if farm["farm_area"] <= 0:

        raise HTTPException(
            status_code=400,
            detail="Farm area must be greater than zero"
        )


    # --------------------------------------------------------
    # Calculate Animal Density
    # --------------------------------------------------------

    animal_density = (
        farm["animal_count"] /
        farm["farm_area"]
    )


    # --------------------------------------------------------
    # Build 20-Feature ML Input
    # --------------------------------------------------------

    input_data = pd.DataFrame([
        {
            "temperature": data.temperature,

            "humidity": data.humidity,

            "animal_age": farm["average_animal_age"],

            "animal_count": farm["animal_count"],

            "animal_density": animal_density,

            "sick_animals": data.sick_animals,

            "mortality_today": data.mortality_today,

            "normal_mortality": farm["normal_mortality"],

            "vaccination_compliance":
                data.vaccination_compliance,

            "quarantine_compliance":
                farm["quarantine_compliance"],

            "cleaning_frequency":
                data.cleaning_frequency,

            "disinfection_frequency":
                farm["disinfection_frequency"],

            "ppe_compliance":
                data.ppe_compliance,

            "visitor_count":
                data.visitor_count,

            "visitor_control":
                farm["visitor_control"],

            "animal_movement":
                farm["animal_movement"],

            "equipment_sharing":
                farm["equipment_sharing"],

            "pest_presence":
                farm["pest_presence"],

            "water_quality":
                farm["water_quality"],

            "nearby_outbreak":
                data.nearby_outbreak
        }
    ])


    # --------------------------------------------------------
    # Exact Feature Order Used During Model Training
    # --------------------------------------------------------

    feature_order = [
        "temperature",
        "humidity",
        "animal_age",
        "animal_count",
        "animal_density",
        "sick_animals",
        "mortality_today",
        "normal_mortality",
        "vaccination_compliance",
        "quarantine_compliance",
        "cleaning_frequency",
        "disinfection_frequency",
        "ppe_compliance",
        "visitor_count",
        "visitor_control",
        "animal_movement",
        "equipment_sharing",
        "pest_presence",
        "water_quality",
        "nearby_outbreak"
    ]

    input_data = input_data[feature_order]


    # --------------------------------------------------------
    # XGBoost Prediction
    # --------------------------------------------------------

    prediction = model.predict(input_data)[0]


    # Convert encoded prediction back to:
    # High / Low / Moderate

    risk_level = risk_encoder.inverse_transform(
        [prediction]
    )[0]


    # --------------------------------------------------------
    # Prediction Probabilities
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        input_data
    )[0]


    probability_map = {}

    for class_index, class_name in enumerate(
        risk_encoder.classes_
    ):

        probability_map[class_name] = round(
            float(probabilities[class_index]) * 100,
            2
        )


    # Probability corresponding to predicted class

    predicted_probability = float(
        probabilities[prediction]
    )


    disease_risk = round(
        predicted_probability * 100,
        2
    )


    # --------------------------------------------------------
    # Biosecurity Score
    # --------------------------------------------------------

    biosecurity_result = calculate_biosecurity_score(

        vaccination_compliance=
            data.vaccination_compliance,

        cleaning_frequency=
            data.cleaning_frequency,

        ppe_compliance=
            data.ppe_compliance,

        visitor_count=
            data.visitor_count,

        mortality_today=
            data.mortality_today,

        normal_mortality=
            farm["normal_mortality"]
    )


    # --------------------------------------------------------
    # Generate Recommendations
    # --------------------------------------------------------

    recommendations = generate_recommendations(

        disease_risk=disease_risk,

        risk_level=risk_level,

        biosecurity_result=biosecurity_result
    )


    # --------------------------------------------------------
    # Save Assessment To SQLite
    # --------------------------------------------------------

    connection = get_connection()

    connection.execute(
        """
        INSERT INTO daily_assessments (
            farm_id,
            assessment_date,
            temperature,
            humidity,
            sick_animals,
            mortality_today,
            vaccination_compliance,
            cleaning_frequency,
            ppe_compliance,
            visitor_count,
            nearby_outbreak,
            disease_risk,
            risk_level,
            biosecurity_score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            farm_id,

            str(date.today()),

            data.temperature,

            data.humidity,

            data.sick_animals,

            data.mortality_today,

            data.vaccination_compliance,

            data.cleaning_frequency,

            data.ppe_compliance,

            data.visitor_count,

            data.nearby_outbreak,

            disease_risk,

            risk_level,

            biosecurity_result["score"]
        )
    )

    connection.commit()

    connection.close()


    # --------------------------------------------------------
    # Return Complete Assessment
    # --------------------------------------------------------

    return {

        "farm_id": farm_id,

        "assessment_date":
            str(date.today()),

        "disease_risk":
            disease_risk,

        "risk_level":
            risk_level,

        "prediction_probabilities":
            probability_map,

        "biosecurity_score":
            biosecurity_result["score"],

        "biosecurity_category":
            biosecurity_result["category"],

        "biosecurity_breakdown":
            biosecurity_result["breakdown"],

        "recommendations":
            recommendations
    }


# ============================================================
# ASSESSMENT HISTORY
# ============================================================

@app.get("/farms/{farm_id}/history")
def get_history(farm_id: int):

    connection = get_connection()


    # --------------------------------------------------------
    # Verify Farm
    # --------------------------------------------------------

    farm = connection.execute(
        """
        SELECT id
        FROM farms
        WHERE id = ?
        """,
        (farm_id,)
    ).fetchone()


    if farm is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Farm not found"
        )


    # --------------------------------------------------------
    # Get Assessment History
    # --------------------------------------------------------

    assessments = connection.execute(
        """
        SELECT
            id,
            assessment_date,
            temperature,
            humidity,
            sick_animals,
            mortality_today,
            vaccination_compliance,
            cleaning_frequency,
            ppe_compliance,
            visitor_count,
            disease_risk,
            risk_level,
            biosecurity_score
        FROM daily_assessments
        WHERE farm_id = ?
        ORDER BY assessment_date DESC, id DESC
        """,
        (farm_id,)
    ).fetchall()


    connection.close()


    return {

        "farm_id":
            farm_id,

        "assessment_count":
            len(assessments),

        "history": [
            dict(assessment)
            for assessment in assessments
        ]
    }