def generate_recommendations(
    disease_risk,
    risk_level,
    biosecurity_result
):
    recommendations = []

    breakdown = biosecurity_result["breakdown"]

    # -----------------------------------------
    # 1. Disease Risk
    # -----------------------------------------

    if disease_risk >= 66:
        recommendations.append({
            "priority": "High",
            "message": (
                "High disease risk detected. "
                "Isolate potentially affected animals and "
                "contact a veterinarian."
            )
        })

    elif disease_risk >= 33:
        recommendations.append({
            "priority": "Medium",
            "message": (
                "Moderate disease risk detected. "
                "Increase monitoring of animal health."
            )
        })


    # -----------------------------------------
    # 2. Vaccination
    # -----------------------------------------

    if breakdown["vaccination"] < 80:
        recommendations.append({
            "priority": "High",
            "message": (
                "Vaccination compliance is below the target. "
                "Review the vaccination schedule."
            )
        })


    # -----------------------------------------
    # 3. Cleaning
    # -----------------------------------------

    if breakdown["cleaning"] < 70:
        recommendations.append({
            "priority": "Medium",
            "message": (
                "Cleaning and disinfection frequency is low. "
                "Increase cleaning frequency."
            )
        })


    # -----------------------------------------
    # 4. PPE Compliance
    # -----------------------------------------

    if breakdown["ppe"] < 80:
        recommendations.append({
            "priority": "Medium",
            "message": (
                "PPE compliance is below the target. "
                "Ensure workers use appropriate protective equipment."
            )
        })


    # -----------------------------------------
    # 5. Visitor Control
    # -----------------------------------------

    if breakdown["visitor_control"] < 70:
        recommendations.append({
            "priority": "High",
            "message": (
                "Visitor control is weak. "
                "Restrict unnecessary visitors and maintain visitor records."
            )
        })


    # -----------------------------------------
    # 6. Mortality / Health Management
    # -----------------------------------------

    if breakdown["health_management"] < 70:
        recommendations.append({
            "priority": "High",
            "message": (
                "Mortality is above the farm's normal baseline. "
                "Investigate the cause and monitor affected animals closely."
            )
        })


    # -----------------------------------------
    # 7. Good Biosecurity
    # -----------------------------------------

    if biosecurity_result["score"] >= 80 and disease_risk < 33:
        recommendations.append({
            "priority": "Low",
            "message": (
                "Biosecurity practices are performing well. "
                "Continue current monitoring and preventive measures."
            )
        })


    # -----------------------------------------
    # 8. Return Recommendations
    # -----------------------------------------

    return recommendations


# -----------------------------------------
# Test the Recommendation Engine
# -----------------------------------------

if __name__ == "__main__":

    test_result = {
        "score": 64.5,
        "category": "Moderate",
        "breakdown": {
            "vaccination": 82,
            "cleaning": 70,
            "ppe": 75,
            "visitor_control": 60,
            "health_management": 30
        }
    }

    recommendations = generate_recommendations(
        disease_risk=41.65,
        risk_level="Medium",
        biosecurity_result=test_result
    )

    print("\nRecommendations:\n")

    for recommendation in recommendations:
        print(
            f"[{recommendation['priority']}] "
            f"{recommendation['message']}"
        )