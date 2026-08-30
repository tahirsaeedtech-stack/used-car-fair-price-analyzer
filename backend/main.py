from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import joblib
import os


app = FastAPI(
    title="Used Car Fair Price API",
    version="1.0"
)

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

# --------------------------------------------------
# Load trained ML pipeline
# --------------------------------------------------

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "used_car_price_model.joblib"
)

model = joblib.load(MODEL_PATH)


# Dataset reference year
REFERENCE_YEAR = 2025


# --------------------------------------------------
# Request schema
# --------------------------------------------------

class CarInput(BaseModel):
    year: int
    mileage_km: Optional[float] = None

    fuel: str
    transmission: str
    registration_location: str
    color: str
    assembly: str
    body_type: str

    engine_cc: Optional[float] = None
    battery_kwh: Optional[float] = None

    feature_count: int = 0

    brand: str
    model: str

    asking_price: Optional[float] = None


# --------------------------------------------------
# Home endpoint
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Used Car Fair Price API is running"
    }


# --------------------------------------------------
# Prediction endpoint
# --------------------------------------------------
@app.post("/predict")
def predict_price(car: CarInput):
    vehicle_age = REFERENCE_YEAR - car.year
    safe_age = max(vehicle_age, 1)

    if car.mileage_km is not None:
        mileage_per_year = car.mileage_km / safe_age
        mileage_missing = 0
    else:
        mileage_per_year = None
        mileage_missing = 1

    is_electric = 1 if car.fuel.lower() == "electric" else 0

    engine_cc_missing = (
        1
        if car.engine_cc is None and is_electric == 0
        else 0
    )

    input_data = pd.DataFrame([{
        "vehicle_age": vehicle_age,
        "mileage_km": car.mileage_km,
        "mileage_per_year": mileage_per_year,
        "fuel": car.fuel,
        "transmission": car.transmission,
        "registration_location": car.registration_location,
        "color": car.color,
        "assembly": car.assembly,
        "body_type": car.body_type,
        "engine_cc": car.engine_cc,
        "battery_kwh": car.battery_kwh,
        "feature_count": car.feature_count,
        "brand": car.brand,
        "model": car.model,
        "is_electric": is_electric,
        "mileage_missing": mileage_missing,
        "engine_cc_missing": engine_cc_missing
    }])

    predicted_price = model.predict(input_data)[0]

    response = {
        "predicted_fair_price": round(float(predicted_price), 0)
    }

    if car.asking_price is not None:
        difference = car.asking_price - predicted_price
        difference_percent = (
            difference / predicted_price
        ) * 100

        FAIR_PRICE_THRESHOLD = 12.5

        if difference_percent < -FAIR_PRICE_THRESHOLD:
            verdict = "Good Deal"

        elif difference_percent > FAIR_PRICE_THRESHOLD:
            verdict = "Overpriced"

        else:
            verdict = "Fair Price"

        response["asking_price"] = car.asking_price
        response["difference_pkr"] = round(float(difference), 0)
        response["difference_percent"] = round(
            float(difference_percent), 2
        )
        response["verdict"] = verdict

    return response
