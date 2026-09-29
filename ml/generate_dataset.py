import numpy as np
import pandas as pd

# Reproducibility
np.random.seed(42)

# Number of rows
n = 20000

# Generate 20 input features
df = pd.DataFrame({
    "temperature": np.random.uniform(18, 40, n),
    "humidity": np.random.uniform(35, 95, n),
    "animal_age": np.random.randint(1, 120, n),
    "animal_count": np.random.randint(100, 10000, n),
    "animal_density": np.random.uniform(2, 15, n),
    "sick_animals": np.random.randint(0, 50, n),
    "mortality_today": np.random.randint(0, 15, n),
    "normal_mortality": np.random.uniform(0.5, 6, n),
    "vaccination_compliance": np.random.uniform(40, 100, n),
    "quarantine_compliance": np.random.uniform(40, 100, n),
    "cleaning_frequency": np.random.randint(1, 14, n),
    "disinfection_frequency": np.random.randint(1, 14, n),
    "ppe_compliance": np.random.uniform(40, 100, n),
    "visitor_count": np.random.randint(0, 40, n),
    "visitor_control": np.random.uniform(40, 100, n),
    "animal_movement": np.random.randint(0, 20, n),
    "equipment_sharing": np.random.uniform(0, 100, n),
    "pest_presence": np.random.uniform(0, 100, n),
    "water_quality": np.random.uniform(40, 100, n),
    "nearby_outbreak": np.random.randint(0, 2, n)
})

# Calculate disease risk
risk_score = (
    (df["temperature"] > 32) * 10 +
    (df["humidity"] > 75) * 10 +
    (df["animal_density"] > 10) * 10 +
    (df["sick_animals"] > 20) * 15 +
    (df["mortality_today"] > df["normal_mortality"]) * 15 +
    (df["vaccination_compliance"] < 70) * 10 +
    (df["quarantine_compliance"] < 70) * 5 +
    (df["cleaning_frequency"] < 5) * 5 +
    (df["disinfection_frequency"] < 5) * 5 +
    (df["ppe_compliance"] < 70) * 5 +
    (df["visitor_count"] > 20) * 5 +
    (df["visitor_control"] < 70) * 5 +
    (df["pest_presence"] > 60) * 5 +
    (df["water_quality"] < 60) * 5 +
    (df["nearby_outbreak"] == 1) * 10
)

# Add random noise
noise = np.random.normal(0, 5, n)

# Final disease risk: 0–100
df["disease_risk"] = np.clip(
    risk_score + noise,
    0,
    100
)

# Balanced risk categories
df["risk_level"] = pd.qcut(
    df["disease_risk"],
    q=[0, 0.30, 0.70, 1.0],
    labels=["Low", "Moderate", "High"]
)

# Save dataset
output_path = "../data/farm_disease_data_20000.csv"

df.to_csv(output_path, index=False)

print("Dataset generated successfully!")
print("Rows:", len(df))
print("Columns:", len(df.columns))
print("Saved to:", output_path)

print("\nRisk level distribution:")
print(df["risk_level"].value_counts())

print("\nDataset shape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())