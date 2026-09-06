from pathlib import Path
import json
import numpy as np
import pandas as pd
import os
import psycopg
from dotenv import load_dotenv
from catboost import CatBoostRegressor, Pool
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
INSTANCE_UNIX_SOCKET = os.getenv("INSTANCE_UNIX_SOCKET")


def get_db_connection():
    # Production: Google Cloud Run -> Cloud SQL Unix socket
    if all([DB_USER, DB_PASS, DB_NAME, INSTANCE_UNIX_SOCKET]):
        return psycopg.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=INSTANCE_UNIX_SOCKET,
        )

    # Local development: use DATABASE_URL from .env
    if DATABASE_URL:
        return psycopg.connect(DATABASE_URL)

    raise RuntimeError("Database configuration is missing.")


app = FastAPI(
    title="Used Car Fair Price Analyzer API",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://used-car-fair-price-analyzer.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "used_car_catboost_model.cbm"
)

CALIBRATION_PATH = (
    BASE_DIR
    / "models"
    / "used_car_interval_calibration.json"
)

DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "used_cars_cleaned.csv"
)


model = CatBoostRegressor()
model.load_model(str(MODEL_PATH))


with open(
    CALIBRATION_PATH,
    "r",
    encoding="utf-8"
) as file:
    calibration_data = json.load(file)

INTERVAL_QUANTILE = calibration_data[
    "absolute_log_residual_quantile"
]


REFERENCE_YEAR = 2025

MODEL_FEATURES = [
    "vehicle_age",
    "mileage_km",
    "mileage_per_year",
    "engine_cc",
    "feature_count",
    "fuel",
    "transmission",
    "assembly",
    "body_type",
    "brand",
    "model",
    "registration_location",
]

CATEGORICAL_FEATURES = [
    "fuel",
    "transmission",
    "assembly",
    "body_type",
    "brand",
    "model",
    "registration_location",
]


class CarInput(BaseModel):
    year: int = Field(
        ...,
        ge=1950,
        le=2025
    )

    mileage_km: float = Field(
        ...,
        ge=0
    )

    engine_cc: float | None = Field(
        default=None,
        ge=0
    )

    feature_count: int = Field(
        ...,
        ge=0
    )

    fuel: str
    transmission: str
    assembly: str
    body_type: str
    brand: str
    model: str
    registration_location: str

    asking_price_pkr: float | None = Field(
        default=None,
        gt=0
    )


@app.get("/")
def root():
    return {
        "message": "Used Car Fair Price Analyzer API is running."
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "calibration_loaded": True
    }


@app.get("/metadata")
def get_metadata(
    brand: str | None = None
):
    df = pd.read_csv(
        DATA_PATH,
        usecols=[
            "brand",
            "model",
            "fuel",
            "transmission",
            "assembly",
            "body_type",
            "registration_location",
        ]
    )

    response = {
        "brands": sorted(
            df["brand"]
            .dropna()
            .unique()
            .tolist()
        ),

        "fuel_types": sorted(
            df["fuel"]
            .dropna()
            .unique()
            .tolist()
        ),

        "transmissions": sorted(
            df["transmission"]
            .dropna()
            .unique()
            .tolist()
        ),

        "assemblies": sorted(
            df["assembly"]
            .dropna()
            .unique()
            .tolist()
        ),

        "body_types": sorted(
            df["body_type"]
            .dropna()
            .unique()
            .tolist()
        ),

        "registration_locations": sorted(
            df["registration_location"]
            .dropna()
            .unique()
            .tolist()
        ),
    }

    if brand:
        brand_df = df[
            df["brand"].str.lower()
            == brand.lower()
        ]

        response["models"] = sorted(
            brand_df["model"]
            .dropna()
            .unique()
            .tolist()
        )
    else:
        response["models"] = []

    return response


@app.post("/predict")
def predict_price(car: CarInput):
    vehicle_age = REFERENCE_YEAR - car.year

    if vehicle_age > 0:
        mileage_per_year = car.mileage_km / vehicle_age
    else:
        mileage_per_year = car.mileage_km

    input_data = pd.DataFrame(
        [
            {
                "vehicle_age": vehicle_age,
                "mileage_km": car.mileage_km,
                "mileage_per_year": mileage_per_year,
                "engine_cc": car.engine_cc,
                "feature_count": car.feature_count,
                "fuel": car.fuel,
                "transmission": car.transmission,
                "assembly": car.assembly,
                "body_type": car.body_type,
                "brand": car.brand,
                "model": car.model,
                "registration_location": car.registration_location,
            }
        ],
        columns=MODEL_FEATURES,
    )

    # -----------------------------
    # PRICE PREDICTION
    # -----------------------------

    predicted_log_price = model.predict(input_data)[0]

    predicted_price_pkr = float(
        np.expm1(predicted_log_price)
    )

    predicted_price_pkr = max(
        predicted_price_pkr,
        0,
    )

    # -----------------------------
    # CALIBRATED PRICE RANGE
    # -----------------------------

    lower_log = (
        predicted_log_price
        - INTERVAL_QUANTILE
    )

    upper_log = (
        predicted_log_price
        + INTERVAL_QUANTILE
    )

    lower_bound = float(
        np.expm1(lower_log)
    )

    upper_bound = float(
        np.expm1(upper_log)
    )

    lower_bound = max(
        lower_bound,
        0,
    )

    upper_bound = max(
        upper_bound,
        0,
    )

    # -----------------------------
    # SHAP EXPLAINABILITY
    # -----------------------------

    prediction_pool = Pool(
        input_data,
        cat_features=CATEGORICAL_FEATURES,
    )

    shap_values = model.get_feature_importance(
        prediction_pool,
        type="ShapValues",
    )

    feature_shap_values = (
        shap_values[0][:-1]
    )

    explanations = []

    for feature_name, shap_value in zip(
        MODEL_FEATURES,
        feature_shap_values,
    ):
        raw_value = input_data.iloc[0][
            feature_name
        ]

        if pd.isna(raw_value):
            display_value = None

        elif isinstance(
            raw_value,
            np.generic,
        ):
            display_value = (
                raw_value.item()
            )

        else:
            display_value = raw_value

        if shap_value > 0:
            direction = (
                "INCREASES_PRICE"
            )

        elif shap_value < 0:
            direction = (
                "DECREASES_PRICE"
            )

        else:
            direction = "NEUTRAL"

        explanations.append(
            {
                "feature": feature_name,
                "value": display_value,
                "impact": round(
                    float(shap_value),
                    4,
                ),
                "direction": direction,
            }
        )

    explanations = sorted(
        explanations,
        key=lambda item: abs(
            item["impact"]
        ),
        reverse=True,
    )[:5]

    # -----------------------------
    # ASKING PRICE ANALYSIS
    # -----------------------------

    assessment = None

    if car.asking_price_pkr is not None:
        difference_pkr = (
            car.asking_price_pkr
            - predicted_price_pkr
        )

        difference_percent = (
            difference_pkr
            / predicted_price_pkr
        ) * 100

        if (
            car.asking_price_pkr
            > upper_bound
        ):
            assessment = "OVERPRICED"

        elif (
            car.asking_price_pkr
            < lower_bound
        ):
            assessment = "UNDERPRICED"

        else:
            assessment = "FAIR_PRICE"

    # -----------------------------
    # SAVE PREDICTION TO POSTGRESQL
    # -----------------------------

    if DATABASE_URL or all(
        [DB_USER, DB_PASS, DB_NAME, INSTANCE_UNIX_SOCKET]
    ):
        try:
            with get_db_connection() as conn:

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO predictions (
                            brand,
                            model,
                            year,
                            mileage_km,
                            predicted_price_pkr,
                            lower_bound_pkr,
                            upper_bound_pkr,
                            asking_price_pkr,
                            assessment
                        )
                        VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s
                        )
                        """,
                        (
                            car.brand,
                            car.model,
                            car.year,
                            car.mileage_km,
                            predicted_price_pkr,
                            lower_bound,
                            upper_bound,
                            car.asking_price_pkr,
                            assessment,
                        ),
                    )

        except Exception as exc:
            print(
                "Database insert failed:",
                exc,
            )

    # -----------------------------
    # API RESPONSE
    # -----------------------------

    response = {
        "predicted_price_pkr": round(
            predicted_price_pkr
        ),

        "predicted_price_million": round(
            predicted_price_pkr
            / 1_000_000,
            2,
        ),

        "fair_price_range": {
            "min_pkr": round(
                lower_bound
            ),
            "max_pkr": round(
                upper_bound
            ),
        },

        "interval_method":
            "validation_residual_90_percent",

        "model_version":
            "catboost-v1",

        "price_drivers":
            explanations,
    }

    if car.asking_price_pkr is not None:
        response[
            "asking_price_analysis"
        ] = {
            "asking_price_pkr": round(
                car.asking_price_pkr
            ),

            "difference_pkr": round(
                difference_pkr
            ),

            "difference_percent": round(
                difference_percent,
                2,
            ),

            "assessment": assessment,
        }

    return response
