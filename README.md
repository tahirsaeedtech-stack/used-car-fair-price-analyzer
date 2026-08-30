# 🚗 Used Car Fair Price Analyzer

An end-to-end machine learning application that estimates the **fair listing price of used cars in Pakistan** and compares the prediction with a seller's asking price.

The application classifies each listing as:

- 🟢 **Good Deal**
- 🔵 **Fair Price**
- 🔴 **Overpriced**

## Project Overview

The project uses approximately **61K PakWheels used-car listings** and demonstrates a complete ML workflow from raw data processing to a user-facing prediction application.

### ML Pipeline

- Data cleaning and validation
- Exploratory data analysis
- Feature engineering
- Missing-value handling
- One-hot encoding of categorical features
- Regression model comparison
- Holdout evaluation and cross-validation
- Model serialization with Joblib
- REST API deployment with FastAPI
- React-based prediction interface

Engineered features include vehicle age, mileage per year, electric-vehicle indicator, engine/battery information, feature count, brand, model, transmission, assembly, registration location, and body type.

## Model Evaluation

| Model | Test MAE | RMSE | R² |
|---|---:|---:|---:|
| Ridge Regression | ~PKR 1.98M | ~PKR 4.59M | 0.420 |
| Random Forest | ~PKR 403K | ~PKR 1.92M | **0.898** |
| **Extra Trees** | **~PKR 376K** | ~PKR 2.03M | 0.886 |

### Selected Model — Extra Trees Regressor

Extra Trees was selected as the production candidate because **MAE is the primary business metric** for this application: it directly represents the average absolute pricing error in PKR.

3-fold cross-validation:

- **Mean CV MAE:** ~PKR 400,702
- **CV MAE Std:** ~PKR 80,319
- **Test MAE:** ~PKR 375,647
- **Test R²:** 0.886

The complete preprocessing and regression pipeline is serialized and loaded directly by the prediction API.

## Fair Price Classification

Validation residuals were used to define the deal-classification tolerance:

- Median absolute percentage error: **6.17%**
- 75th percentile absolute percentage error: **12.39%**

A rounded **±12.5% tolerance** is used:

| Asking Price vs. ML Estimate | Classification |
|---|---|
| More than 12.5% below estimate | 🟢 Good Deal |
| Within ±12.5% | 🔵 Fair Price |
| More than 12.5% above estimate | 🔴 Overpriced |

This threshold is derived from observed model error rather than using an arbitrary business rule.

## Architecture

```text
React Frontend
      ↓
FastAPI REST API
      ↓
Feature Engineering
      ↓
Scikit-learn Pipeline
      ↓
Extra Trees Regressor
      ↓
Fair Price Estimate
      ↓
Deal Classification
```

## Tech Stack

**Machine Learning:** Python, Pandas, NumPy, Scikit-learn  
**Backend:** FastAPI, Uvicorn, Joblib  
**Frontend:** React, Vite, CSS  
**Development:** Jupyter Notebook, Git, GitHub

## Project Structure

```text
used-car-fair-price-analyzer/
├── backend/
│   └── main.py
├── data/
│   ├── raw/
│   └── processed/
├── frontend/
│   └── src/
├── models/
│   └── used_car_price_model.joblib
├── notebooks/
│   ├── 01_data_audit.ipynb
│   ├── 02_data_cleaning.ipynb
│   ├── 03_eda.ipynb
│   └── 04_feature_engineering.ipynb
├── docs/
│   └── images/
├── requirements.txt
└── README.md
```

## Run Locally

### Backend

Create/activate a Python environment and install dependencies:

```bash
pip install -r requirements.txt
```

Start the API from the project root:

```bash
python -m uvicorn backend.main:app --reload
```

FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Limitations

- Predictions represent **listing-price estimates**, not confirmed transaction prices.
- The model is trained on Pakistani used-car listings and should not be assumed to generalize to other markets.
- Predictions for rare models or vehicle configurations may have higher uncertainty.
- Unseen categorical values are handled by the preprocessing pipeline but may reduce prediction quality.

## Key Takeaway

This project demonstrates an end-to-end ML engineering workflow: **data validation → feature engineering → model evaluation → uncertainty-informed business logic → model serving → full-stack integration**.