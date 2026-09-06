from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert "message" in data


def test_health():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["calibration_loaded"] is True


def test_metadata():
    response = client.get("/metadata")

    assert response.status_code == 200

    data = response.json()

    assert "brands" in data
    assert "models" in data
    assert "fuel_types" in data
    assert "transmissions" in data
    assert "assemblies" in data
    assert "body_types" in data
    assert "registration_locations" in data

    assert isinstance(data["brands"], list)


def test_metadata_brand_filter():
    response = client.get(
        "/metadata?brand=Toyota"
    )

    assert response.status_code == 200

    data = response.json()

    assert "models" in data
    assert isinstance(data["models"], list)
    assert len(data["models"]) > 0


def test_predict():
    payload = {
        "year": 2020,
        "mileage_km": 65000,
        "engine_cc": 1800,
        "feature_count": 10,
        "fuel": "Petrol",
        "transmission": "Automatic",
        "assembly": "Local",
        "body_type": "Sedan",
        "brand": "Toyota",
        "model": "Corolla",
        "registration_location": "Lahore",
        "asking_price_pkr": 6500000,
    }

    response = client.post(
        "/predict",
        json=payload
    )

    assert response.status_code == 200

    data = response.json()

    assert "predicted_price_pkr" in data
    assert "predicted_price_million" in data
    assert "fair_price_range" in data
    assert "price_drivers" in data
    assert "asking_price_analysis" in data

    assert data["predicted_price_pkr"] > 0

    assert (
        data["fair_price_range"]["min_pkr"]
        <
        data["predicted_price_pkr"]
        <
        data["fair_price_range"]["max_pkr"]
    )

    assert len(data["price_drivers"]) == 5

    assert (
        data["asking_price_analysis"]["assessment"]
        in [
            "UNDERPRICED",
            "FAIR_PRICE",
            "OVERPRICED",
        ]
    )


def test_invalid_year():
    payload = {
        "year": 2030,
        "mileage_km": 65000,
        "engine_cc": 1800,
        "feature_count": 10,
        "fuel": "Petrol",
        "transmission": "Automatic",
        "assembly": "Local",
        "body_type": "Sedan",
        "brand": "Toyota",
        "model": "Corolla",
        "registration_location": "Lahore",
        "asking_price_pkr": 6500000,
    }

    response = client.post(
        "/predict",
        json=payload
    )

    assert response.status_code == 422
