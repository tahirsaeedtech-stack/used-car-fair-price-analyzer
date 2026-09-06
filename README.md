# 🚗 Used Car Fair Price Analyzer

A production-deployed machine learning application for estimating the **fair listing price of used cars in Pakistan**.

The system uses a **CatBoost regression model** trained on approximately **61,000 Pakistani used-car listings** and provides:

- 💰 ML-based fair price estimation
- 📊 Validation-calibrated 90% estimated price range
- 🔍 SHAP-based prediction explanations
- 🏷️ Asking-price assessment
- 🗄️ PostgreSQL prediction persistence
- ☁️ Production deployment using Google Cloud Run, Cloud SQL, and Vercel

## 🌐 Live Application

**Live Demo:**  
https://used-car-fair-price-analyzer.vercel.app/

**Backend API:**  
https://used-car-price-backend-720530335077.asia-south1.run.app

---

## 🎯 Problem

Used-car asking prices can vary considerably depending on vehicle age, mileage, engine size, brand, model, transmission, assembly type, registration location, and other characteristics.

This project builds an end-to-end ML system that estimates a reasonable listing price and helps users determine whether an asking price falls within the model's estimated fair-price range.

---

## ✨ Key Features

### Machine Learning Price Prediction

A CatBoost regression model predicts used-car prices using vehicle characteristics such as:

- Brand and model
- Vehicle age
- Mileage
- Mileage per year
- Engine capacity
- Fuel type
- Transmission
- Assembly type
- Body type
- Registration location
- Vehicle feature count

### 90% Estimated Price Range

Instead of displaying only a single point prediction, the application also provides an uncertainty-aware price range.

The interval is calibrated using the **90th percentile of absolute prediction residuals on the validation set in log-price space**.

This provides users with a more realistic range around the model estimate rather than presenting the prediction as an exact market value.

### Asking Price Assessment

When a seller's asking price is provided, the application compares it with the estimated range and classifies it as:

- **UNDERPRICED** — below the estimated range
- **FAIR_PRICE** — inside the estimated range
- **OVERPRICED** — above the estimated range

### SHAP Explainability

The API calculates local **SHAP feature contributions** for each prediction.

The interface displays the most influential factors affecting the predicted price, helping users understand why the model produced a particular estimate.

### Prediction Persistence

Production predictions are stored in **PostgreSQL on Google Cloud SQL**, including:

- Vehicle information
- Predicted price
- Lower and upper estimated price bounds
- Asking price
- Price assessment
- Prediction timestamp

---

## 📊 Production Model Performance

The final CatBoost model was evaluated on an **untouched test set**.

| Metric | Test Result |
|---|---:|
| MAE | ~PKR 436,497 |
| RMSE | ~PKR 2.26M |
| R² | **0.8593** |
| MAPE | **9.93%** |

### Why CatBoost?

The dataset contains several important categorical variables including brand, model, fuel type, transmission, assembly, body type, and registration location.

CatBoost was selected because it can model nonlinear relationships while handling categorical features effectively.

The target price was transformed using:

```python
log_price = np.log1p(price_pkr)
```

Predictions are converted back to PKR using:

```python
predicted_price_pkr = np.expm1(predicted_log_price)
```

This substantially reduces the effect of the highly right-skewed vehicle-price distribution during training.

---

## 🏗️ Production Architecture

```text
                     User
                      │
                      ▼
              React + Vite Frontend
                      │
                   Vercel
                      │
                      ▼
                FastAPI REST API
                      │
              Google Cloud Run
                ┌─────┴─────┐
                │           │
                ▼           ▼
        CatBoost + SHAP   PostgreSQL
        Price Prediction   Cloud SQL
                │           │
                └─────┬─────┘
                      ▼
              Prediction Response
```

The application supports separate database configurations for:

- **Local development:** PostgreSQL through `DATABASE_URL`
- **Production:** Google Cloud SQL through a Cloud Run Unix socket

---

## 🧠 ML Workflow

```text
Raw PakWheels Dataset
        ↓
Data Audit
        ↓
Data Cleaning
        ↓
Exploratory Data Analysis
        ↓
Feature Engineering
        ↓
Train / Validation / Test Split
        ↓
CatBoost Regression
        ↓
Untouched Test Evaluation
        ↓
Validation Residual Calibration
        ↓
Model Serialization
        ↓
FastAPI Inference API
        ↓
React Application
        ↓
Docker
        ↓
Cloud Deployment
```

---

## 🛠️ Tech Stack

### Machine Learning

- Python
- Pandas
- NumPy
- CatBoost
- SHAP-style CatBoost feature contributions
- Scikit-learn

### Backend

- FastAPI
- Uvicorn
- Pydantic
- Psycopg

### Database

- PostgreSQL
- Google Cloud SQL

### Frontend

- React
- Vite
- CSS

### Deployment & Engineering

- Docker
- Google Cloud Run
- Google Cloud Build
- Vercel
- Git
- GitHub
- Pytest

---

## 📁 Project Structure

```text
used-car-fair-price-analyzer/
│
├── backend/
│   ├── __init__.py
│   ├── main.py
│   └── schemas.py
│
├── data/
│   ├── raw/
│   └── processed/
│       └── used_cars_cleaned.csv
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── index.css
│
├── models/
│   ├── used_car_catboost_model.cbm
│   └── used_car_interval_calibration.json
│
├── notebooks/
│   ├── 01_data_audit.ipynb
│   ├── 02_data_cleaning.ipynb
│   ├── 03_eda.ipynb
│   ├── 04_feature_engineering.ipynb
│   └── model_training.ipynb
│
├── tests/
│   └── test_api.py
│
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## 🔌 API

### Health Check

```http
GET /health
```

Verifies that the API, CatBoost model, and interval calibration artifact are available.

### Metadata

```http
GET /metadata
```

Provides valid vehicle values for the frontend.

Brand-specific models can be retrieved using:

```http
GET /metadata?brand=Toyota
```

### Price Prediction

```http
POST /predict
```

Example request:

```json
{
  "year": 2020,
  "mileage_km": 60000,
  "engine_cc": 1800,
  "feature_count": 8,
  "fuel": "Petrol",
  "transmission": "Automatic",
  "assembly": "Local",
  "body_type": "Sedan",
  "brand": "Toyota",
  "model": "Corolla",
  "registration_location": "Lahore",
  "asking_price_pkr": 6500000
}
```

The response includes:

- Predicted price
- Estimated price range
- Model version
- Important price drivers
- Asking-price difference
- Asking-price assessment

---

## 🧪 Automated API Testing

The project includes Pytest coverage for key API functionality including:

- Root endpoint
- Health endpoint
- Metadata endpoint
- Brand-specific metadata
- Prediction endpoint
- Input validation

Run the tests with:

```bash
python -m pytest tests/test_api.py -v
```

---

## 💻 Run Locally

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure PostgreSQL

Create a local `.env` file:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/used_car_analyzer
```

> `.env` is excluded from Git and must never be committed.

### 3. Start FastAPI

From the project root:

```bash
uvicorn backend.main:app --reload
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### 4. Start React

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## ☁️ Deployment

### Backend

The FastAPI application is containerized with Docker and deployed to **Google Cloud Run**.

### Database

Production inference records are persisted in **PostgreSQL using Google Cloud SQL**.

Cloud Run communicates with Cloud SQL using a Unix socket and environment-based database configuration.

### Frontend

The React/Vite application is deployed independently on **Vercel** and communicates with the Cloud Run REST API.

---

## ⚠️ Limitations

- Predictions represent estimated **listing prices**, not confirmed transaction prices.
- The model is trained on Pakistani used-car listings and should not be assumed to generalize to other markets.
- Rare vehicle models or unusual configurations may have higher prediction uncertainty.
- Market prices can change after the training data was collected.
- The displayed 90% range is an **empirical validation-residual interval** and should not be interpreted as a formal financial guarantee.
- Model explanations represent feature contributions to the prediction and should not be interpreted as causal effects.

---

## 🚀 What This Project Demonstrates

This project demonstrates a complete ML engineering lifecycle:

**data cleaning → EDA → feature engineering → model training → test evaluation → uncertainty estimation → explainability → API development → automated testing → containerization → cloud deployment → database persistence → frontend integration**

It was built as a portfolio project to demonstrate practical **Machine Learning Engineering and Applied AI development skills** through a complete production-style system.