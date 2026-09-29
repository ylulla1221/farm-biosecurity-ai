import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from xgboost import XGBRegressor


# --------------------------------------------------
# 1. Load dataset
# --------------------------------------------------

data = pd.read_csv("../data/farm_disease_data.csv")

print("Dataset loaded!")
print("Shape:", data.shape)


# --------------------------------------------------
# 2. Define features and target
# --------------------------------------------------

features = [
    "temperature",
    "humidity",
    "animal_age",
    "vaccination_compliance",
    "sick_animals",
    "mortality_today",
    "normal_mortality",
    "visitor_count",
    "cleaning_frequency",
    "ppe_compliance"
]

X = data[features]
y = data["disease_risk"]


# --------------------------------------------------
# 3. Split dataset
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# --------------------------------------------------
# 4. Train Random Forest
# --------------------------------------------------

rf_model = RandomForestRegressor(
    n_estimators=200,
    random_state=42
)

rf_model.fit(X_train, y_train)

rf_predictions = rf_model.predict(X_test)

rf_mae = mean_absolute_error(
    y_test,
    rf_predictions
)

rf_r2 = r2_score(
    y_test,
    rf_predictions
)


# --------------------------------------------------
# 5. Train XGBoost
# --------------------------------------------------

xgb_model = XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

xgb_model.fit(X_train, y_train)

xgb_predictions = xgb_model.predict(X_test)

xgb_mae = mean_absolute_error(
    y_test,
    xgb_predictions
)

xgb_r2 = r2_score(
    y_test,
    xgb_predictions
)


# --------------------------------------------------
# 6. Compare models
# --------------------------------------------------

print("\n==============================")
print("MODEL PERFORMANCE")
print("==============================")

print("\nRandom Forest")
print("MAE:", round(rf_mae, 4))
print("R²:", round(rf_r2, 4))

print("\nXGBoost")
print("MAE:", round(xgb_mae, 4))
print("R²:", round(xgb_r2, 4))


# --------------------------------------------------
# 7. Select best model
# --------------------------------------------------

if xgb_r2 > rf_r2:
    best_model = xgb_model
    best_name = "XGBoost"
else:
    best_model = rf_model
    best_name = "Random Forest"


print("\nBest model:", best_name)


# --------------------------------------------------
# 8. Save model
# --------------------------------------------------

joblib.dump(
    best_model,
    "../backend/disease_risk_model.pkl"
)

print("\nModel saved successfully!")