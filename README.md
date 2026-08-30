# 🚗 Used Car Fair Price Analyzer

A full-stack machine learning application that estimates the fair listing
price of used cars in Pakistan and compares it with a seller's asking price.

The application classifies a listing as:

- ✅ Good Deal
- 🔵 Fair Price
- 🔴 Overpriced

## Project Overview

The project was built using used-car listings from PakWheels.

The workflow includes:

- Data cleaning and validation
- Exploratory data analysis
- Feature engineering
- Machine learning model comparison
- Cross-validation
- FastAPI prediction API
- React frontend
- Deal classification based on model uncertainty

## Machine Learning

Models evaluated:

| Model | Test MAE | R² |
|---|---:|---:|
| Ridge Regression | ~PKR 1.98M | 0.420 |
| Random Forest | ~PKR 403K | 0.898 |
| Extra Trees | ~PKR 376K | 0.886 |

### Selected Model

**Extra Trees Regressor**

3-fold cross-validation:

- Mean CV MAE: ~PKR 400,702
- CV standard deviation: ~PKR 80,319

Extra Trees was selected because it achieved the lowest test MAE and
lower cross-validation MAE than Random Forest.

## Fair Price Logic

Model validation showed:

- Median percentage error: 6.17%
- 75th percentile percentage error: 12.39%

A ±12.5% tolerance is therefore used for deal classification.

- Below -12.5% → Good Deal
- Within ±12.5% → Fair Price
- Above +12.5% → Overpriced

## Tech Stack

**Machine Learning**
- Python
- Pandas
- NumPy
- Scikit-learn

**Backend**
- FastAPI
- Uvicorn
- Joblib

**Frontend**
- React
- Vite
- CSS

## Run Locally

### Backend

