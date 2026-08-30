import { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    brand: "Toyota",
    model: "Corolla",
    year: 2020,
    mileage_km: 50000,
    fuel: "Petrol",
    transmission: "Automatic",
    registration_location: "Lahore",
    color: "White",
    assembly: "Local",
    body_type: "Sedan",
    engine_cc: 1300,
    battery_kwh: "",
    feature_count: 10,
    asking_price: 4500000,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = {
      ...formData,
      year: Number(formData.year),
      mileage_km:
        formData.mileage_km === ""
          ? null
          : Number(formData.mileage_km),

      engine_cc:
        formData.engine_cc === ""
          ? null
          : Number(formData.engine_cc),

      battery_kwh:
        formData.battery_kwh === ""
          ? null
          : Number(formData.battery_kwh),

      feature_count: Number(formData.feature_count),
      asking_price:
        formData.asking_price === ""
          ? null
          : Number(formData.asking_price),
    };
    console.log("Sending payload:", payload);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Prediction request failed.");
      }

      const data = await response.json();
      console.log("API response:", data);

      setResult(data);
    } catch (err) {
      setError(
        "Could not connect to the prediction API. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (value) => {
    if (value === undefined || value === null) return "-";

    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getVerdictClass = () => {
    if (!result?.verdict) return "";

    if (result.verdict === "Good Deal") {
      return "good-deal";
    }

    if (result.verdict === "Overpriced") {
      return "overpriced";
    }

    return "fair-price";
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Machine Learning Price Analysis</p>

          <h1>Used Car Fair Price Analyzer</h1>

          <p className="subtitle">
            Enter the vehicle details and seller's asking price.
            Our machine learning model estimates the fair listing
            price and tells you whether the car looks like a good
            deal, fairly priced, or overpriced.
          </p>
        </div>
      </header>

      <main className="dashboard">
        <section className="card form-card">
          <div className="section-heading">
            <div>
              <span className="step">Vehicle Details</span>
              <h2>Analyze a car</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              <div className="field">
                <label>Brand</label>
                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Model</label>
                <input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Mileage (km)</label>
                <input
                  type="number"
                  name="mileage_km"
                  value={formData.mileage_km}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Fuel</label>
                <select
                  name="fuel"
                  value={formData.fuel}
                  onChange={handleChange}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                  <option>CNG</option>
                  <option>LPG</option>
                </select>
              </div>

              <div className="field">
                <label>Transmission</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>

              <div className="field">
                <label>Registration</label>
                <input
                  name="registration_location"
                  value={formData.registration_location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Color</label>
                <input
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Assembly</label>
                <select
                  name="assembly"
                  value={formData.assembly}
                  onChange={handleChange}
                >
                  <option>Local</option>
                  <option>Imported</option>
                </select>
              </div>

              <div className="field">
                <label>Body Type</label>
                <input
                  name="body_type"
                  value={formData.body_type}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Engine CC</label>
                <input
                  type="number"
                  name="engine_cc"
                  value={formData.engine_cc}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Battery kWh</label>
                <input
                  type="number"
                  name="battery_kwh"
                  value={formData.battery_kwh}
                  onChange={handleChange}
                  placeholder="Electric cars only"
                />
              </div>

              <div className="field">
                <label>Feature Count</label>
                <input
                  type="number"
                  name="feature_count"
                  value={formData.feature_count}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="field asking-field">
                <label>Seller Asking Price (PKR)</label>
                <input
                  type="number"
                  name="asking_price"
                  value={formData.asking_price}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <button className="predict-button" disabled={loading}>
              {loading
                ? "Analyzing..."
                : "Analyze Fair Price"}
            </button>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </form>
        </section>

        <section className="card result-card">
          {!result ? (
            <div className="empty-result">
              <div className="car-icon">🚘</div>

              <h2>Price analysis</h2>

              <p>
                Enter the car details and click
                <strong> Analyze Fair Price </strong>
                to see the ML prediction.
              </p>
            </div>
          ) : (
            <>
              <span className="step">
                AI Price Analysis
              </span>

              <h2>Estimated Fair Price</h2>

              <div className="price">
                {formatPKR(
                  result.predicted_fair_price
                )}
              </div>

              <div
                className={`verdict ${getVerdictClass()}`}
              >
                {result.verdict}
              </div>

              <div className="result-details">

                <div className="result-row">
                  <span>Seller Asking Price</span>
                  <strong>
                    {formatPKR(result.asking_price)}
                  </strong>
                </div>

                <div className="result-row">
                  <span>Price Difference</span>
                  <strong>
                    {formatPKR(
                      result.difference_pkr
                    )}
                  </strong>
                </div>

                <div className="result-row">
                  <span>Difference</span>
                  <strong>
                    {result.difference_percent}%
                  </strong>
                </div>

              </div>

              <p className="threshold-note">
                Fair-price classification uses a ±12.5%
                tolerance derived from model validation
                errors.
              </p>
            </>
          )}
        </section>
      </main>

      <footer>
        Built with React, FastAPI and Machine Learning
      </footer>
    </div>
  );
}

export default App;