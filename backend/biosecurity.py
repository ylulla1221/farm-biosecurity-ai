def calculate_biosecurity_score(
    vaccination_compliance,
    cleaning_frequency,
    ppe_compliance,
    visitor_count,
    mortality_today,
    normal_mortality
):
    # -----------------------------------------
    # 1. Vaccination Score
    # -----------------------------------------

    vaccination_score = vaccination_compliance

    # -----------------------------------------
    # 2. Cleaning Score
    # -----------------------------------------

    if cleaning_frequency >= 7:
        cleaning_score = 100
    elif cleaning_frequency == 6:
        cleaning_score = 90
    elif cleaning_frequency == 5:
        cleaning_score = 80
    elif cleaning_frequency == 4:
        cleaning_score = 70
    elif cleaning_frequency == 3:
        cleaning_score = 55
    elif cleaning_frequency == 2:
        cleaning_score = 40
    elif cleaning_frequency == 1:
        cleaning_score = 20
    else:
        cleaning_score = 0

    # -----------------------------------------
    # 3. PPE Compliance Score
    # -----------------------------------------

    ppe_score = ppe_compliance

    # -----------------------------------------
    # 4. Visitor Control Score
    # -----------------------------------------

    if visitor_count <= 2:
        visitor_score = 100
    elif visitor_count <= 5:
        visitor_score = 90
    elif visitor_count <= 10:
        visitor_score = 75
    elif visitor_count <= 15:
        visitor_score = 60
    elif visitor_count <= 20:
        visitor_score = 40
    else:
        visitor_score = 20

    # -----------------------------------------
    # 5. Health Management Score
    # -----------------------------------------

    if normal_mortality <= 0:
        health_score = 100
    else:
        mortality_ratio = mortality_today / normal_mortality

        if mortality_ratio <= 1:
            health_score = 100
        elif mortality_ratio <= 1.5:
            health_score = 85
        elif mortality_ratio <= 2:
            health_score = 70
        elif mortality_ratio <= 3:
            health_score = 50
        elif mortality_ratio <= 5:
            health_score = 30
        else:
            health_score = 10

    # -----------------------------------------
    # 6. Apply weights
    # -----------------------------------------

    final_score = (
        vaccination_score * 0.25
        + cleaning_score * 0.20
        + ppe_score * 0.20
        + visitor_score * 0.15
        + health_score * 0.20
    )

    # -----------------------------------------
    # 7. Determine category
    # -----------------------------------------

    if final_score >= 80:
        category = "Good"
    elif final_score >= 60:
        category = "Moderate"
    else:
        category = "Poor"

    # -----------------------------------------
    # 8. Return complete result
    # -----------------------------------------

    return {
        "score": round(final_score, 2),
        "category": category,
        "breakdown": {
            "vaccination": round(vaccination_score, 2),
            "cleaning": round(cleaning_score, 2),
            "ppe": round(ppe_score, 2),
            "visitor_control": round(visitor_score, 2),
            "health_management": round(health_score, 2)
        }
    }


# -----------------------------------------
# Test the function
# -----------------------------------------

if __name__ == "__main__":

    result = calculate_biosecurity_score(
        vaccination_compliance=82,
        cleaning_frequency=4,
        ppe_compliance=75,
        visitor_count=14,
        mortality_today=12,
        normal_mortality=3
    )

    print(result)