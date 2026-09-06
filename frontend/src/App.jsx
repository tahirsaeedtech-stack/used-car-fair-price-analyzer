import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

const initialForm = {
  year: 2020,
  mileage_km: 65000,
  engine_cc: 1800,
  feature_count: 10,
  fuel: "",
  transmission: "",
  assembly: "",
  body_type: "",
  brand: "",
  model: "",
  registration_location: "",
  asking_price_pkr: 6500000,
};

function App() {
  const [form, setForm] = useState(initialForm);

  const [metadata, setMetadata] = useState({
    brands: [],
    models: [],
    fuel_types: [],
    transmissions: [],
    assemblies: [],
    body_types: [],
    registration_locations: [],
  });

  const [result, setResult] = useState(null);

  const [loadingMetadata, setLoadingMetadata] =
    useState(true);

  const [loadingPrediction, setLoadingPrediction] =
    useState(false);

  const [loadingModels, setLoadingModels] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (!form.brand) {
      setMetadata((prev) => ({
        ...prev,
        models: [],
      }));

      return;
    }

    loadModels(form.brand);
  }, [form.brand]);

  const loadMetadata = async () => {
    try {
      setLoadingMetadata(true);
      setError("");

      const response = await fetch(
        `${API_URL}/metadata`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load vehicle metadata."
        );
      }

      const data = await response.json();

      setMetadata((prev) => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const loadModels = async (brand) => {
    try {
      setLoadingModels(true);
      setError("");

      const response = await fetch(
        `${API_URL}/metadata?brand=${encodeURIComponent(
          brand
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load models."
        );
      }

      const data = await response.json();

      setMetadata((prev) => ({
        ...prev,
        models: data.models || [],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "brand"
        ? { model: "" }
        : {}),
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoadingPrediction(true);

    try {
      const payload = {
        ...form,

        year: Number(form.year),

        mileage_km: Number(
          form.mileage_km
        ),

        engine_cc:
          form.engine_cc === ""
            ? null
            : Number(form.engine_cc),

        feature_count: Number(
          form.feature_count
        ),

        asking_price_pkr:
          form.asking_price_pkr === ""
            ? null
            : Number(
              form.asking_price_pkr
            ),
      };

      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const detail =
          Array.isArray(data?.detail) &&
            data.detail.length > 0
            ? data.detail[0]?.msg
            : data?.detail;

        throw new Error(
          detail ||
          "Prediction request failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const assessmentClass = useMemo(() => {
    const assessment =
      result?.asking_price_analysis
        ?.assessment;

    if (assessment === "UNDERPRICED") {
      return "status-good";
    }

    if (assessment === "OVERPRICED") {
      return "status-danger";
    }

    if (assessment === "FAIR_PRICE") {
      return "status-fair";
    }

    return "";
  }, [result]);

  const formatPKR = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    return new Intl.NumberFormat(
      "en-PK",
      {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-badge">
          AI-Powered Vehicle Pricing
        </div>

        <h1>
          Used Car Fair Price Analyzer
        </h1>

        <p>
          Estimate a vehicle's market
          value using a machine-learning
          model trained on Pakistani
          used-car listings.
        </p>
      </header>

      <main className="main-grid">
        <section className="card form-card">
          <div className="section-heading">
            <div>
              <span className="section-label">
                Vehicle Input
              </span>

              <h2>
                Enter car details
              </h2>
            </div>
          </div>

          {loadingMetadata && (
            <p className="info-message">
              Loading vehicle data...
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Field
                label="Brand"
                name="brand"
                type="select"
                value={form.brand}
                options={metadata.brands}
                onChange={handleChange}
                disabled={loadingMetadata}
                required
              />

              <Field
                label="Model"
                name="model"
                type="select"
                value={form.model}
                options={metadata.models}
                onChange={handleChange}
                disabled={
                  !form.brand ||
                  loadingModels
                }
                placeholder={
                  loadingModels
                    ? "Loading models..."
                    : "Select Model"
                }
                required
              />

              <Field
                label="Year"
                name="year"
                type="number"
                value={form.year}
                onChange={handleChange}
                min="1950"
                max="2025"
                required
              />

              <Field
                label="Mileage (KM)"
                name="mileage_km"
                type="number"
                value={form.mileage_km}
                onChange={handleChange}
                min="0"
                required
              />

              <Field
                label="Engine Capacity (CC)"
                name="engine_cc"
                type="number"
                value={form.engine_cc}
                onChange={handleChange}
                min="0"
              />

              <Field
                label="Feature Count"
                name="feature_count"
                type="number"
                value={form.feature_count}
                onChange={handleChange}
                min="0"
                required
              />

              <Field
                label="Fuel"
                name="fuel"
                type="select"
                value={form.fuel}
                options={
                  metadata.fuel_types
                }
                onChange={handleChange}
                required
              />

              <Field
                label="Transmission"
                name="transmission"
                type="select"
                value={form.transmission}
                options={
                  metadata.transmissions
                }
                onChange={handleChange}
                required
              />

              <Field
                label="Assembly"
                name="assembly"
                type="select"
                value={form.assembly}
                options={
                  metadata.assemblies
                }
                onChange={handleChange}
                required
              />

              <Field
                label="Body Type"
                name="body_type"
                type="select"
                value={form.body_type}
                options={
                  metadata.body_types
                }
                onChange={handleChange}
                required
              />

              <Field
                label="Registration Location"
                name="registration_location"
                type="select"
                value={
                  form.registration_location
                }
                options={
                  metadata.registration_locations
                }
                onChange={handleChange}
                required
              />

              <Field
                label="Seller Asking Price (PKR)"
                name="asking_price_pkr"
                type="number"
                value={
                  form.asking_price_pkr
                }
                onChange={handleChange}
                min="1"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="analyze-button"
              disabled={
                loadingPrediction ||
                loadingMetadata
              }
            >
              {loadingPrediction
                ? "Analyzing..."
                : "Analyze Fair Price"}
            </button>
          </form>
        </section>

        <section className="card result-card">
          <span className="section-label">
            AI Assessment
          </span>

          <h2>
            Price Analysis
          </h2>

          {!result && (
            <div className="empty-state">
              <div className="empty-icon">
                AI
              </div>

              <h3>
                Ready to analyze
              </h3>

              <p>
                Enter the vehicle
                information and run the
                model to receive a
                fair-price estimate.
              </p>
            </div>
          )}

          {result && (
            <div className="results">
              <div className="primary-result">
                <span>
                  Estimated Fair Price
                </span>

                <strong>
                  {formatPKR(
                    result
                      .predicted_price_pkr
                  )}
                </strong>

                <small>
                  PKR{" "}
                  {
                    result
                      .predicted_price_million
                  }
                  M
                </small>
              </div>

              <div className="range-box">
                <span>
                  90% Estimated Price Range
                </span>

                <strong>
                  {formatPKR(
                    result
                      .fair_price_range
                      .min_pkr
                  )}
                </strong>

                <span className="range-divider">
                  to
                </span>

                <strong>
                  {formatPKR(
                    result
                      .fair_price_range
                      .max_pkr
                  )}
                </strong>
              </div>

              {result.interval_method && (
                <p className="interval-note">
                  Range calibrated from
                  validation-set prediction
                  errors.
                </p>
              )}

              {result.price_drivers
                ?.length > 0 && (
                  <div className="drivers-section">
                    <div className="drivers-heading">
                      <div>
                        <span className="section-label">
                          Model Explainability
                        </span>

                        <h3>
                          Why this price?
                        </h3>
                      </div>

                      <span className="shap-badge">
                        SHAP
                      </span>
                    </div>

                    <p className="drivers-description">
                      These are the
                      strongest factors
                      influencing this
                      prediction relative
                      to the model's
                      baseline.
                    </p>

                    <div className="drivers-list">
                      {result.price_drivers.map(
                        (
                          driver,
                          index
                        ) => {
                          const increases =
                            driver.direction ===
                            "INCREASES_PRICE";

                          const decreases =
                            driver.direction ===
                            "DECREASES_PRICE";

                          return (
                            <div
                              className="driver"
                              key={`${driver.feature}-${index}`}
                            >
                              <div className="driver-info">
                                <strong>
                                  {formatFeatureName(
                                    driver.feature
                                  )}
                                </strong>

                                <span>
                                  {formatFeatureValue(
                                    driver.feature,
                                    driver.value
                                  )}
                                </span>
                              </div>

                              <div
                                className={
                                  increases
                                    ? "driver-impact increase"
                                    : decreases
                                      ? "driver-impact decrease"
                                      : "driver-impact neutral"
                                }
                              >
                                <span>
                                  {increases
                                    ? "↑"
                                    : decreases
                                      ? "↓"
                                      : "—"}
                                </span>

                                {increases
                                  ? "Raises estimate"
                                  : decreases
                                    ? "Lowers estimate"
                                    : "Neutral"}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <p className="explanation-note">
                      SHAP values explain
                      the model's prediction
                      relative to its learned
                      baseline and should not
                      be interpreted as causal
                      effects.
                    </p>
                  </div>
                )}

              {result
                .asking_price_analysis && (
                  <>
                    <div
                      className={`assessment ${assessmentClass}`}
                    >
                      {
                        result
                          .asking_price_analysis
                          .assessment
                      }
                    </div>

                    <div className="metric-grid">
                      <Metric
                        label="Seller Asking"
                        value={formatPKR(
                          result
                            .asking_price_analysis
                            .asking_price_pkr
                        )}
                      />

                      <Metric
                        label="Price Difference"
                        value={formatPKR(
                          result
                            .asking_price_analysis
                            .difference_pkr
                        )}
                      />

                      <Metric
                        label="Difference"
                        value={`${result.asking_price_analysis.difference_percent}%`}
                      />

                      <Metric
                        label="Model"
                        value={
                          result.model_version
                        }
                      />
                    </div>
                  </>
                )}
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>
          Machine Learning model:
          CatBoost Regression • SHAP
          explainability • Validation-
          calibrated uncertainty •
          Predictions are estimates and
          not financial guarantees.
        </p>
      </footer>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  value,
  options = [],
  onChange,
  placeholder,
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          {...props}
        >
          <option value="">
            {placeholder ||
              `Select ${label}`}
          </option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          {...props}
        />
      )}
    </label>
  );
}

function Metric({
  label,
  value,
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatFeatureName(
  feature
) {
  const names = {
    vehicle_age:
      "Vehicle Age",

    mileage_km:
      "Mileage",

    mileage_per_year:
      "Mileage / Year",

    engine_cc:
      "Engine Capacity",

    feature_count:
      "Features",

    fuel:
      "Fuel Type",

    transmission:
      "Transmission",

    assembly:
      "Assembly",

    body_type:
      "Body Type",

    brand:
      "Brand",

    model:
      "Model",

    registration_location:
      "Registration Location",
  };

  return (
    names[feature] ||
    feature
  );
}

function formatFeatureValue(
  feature,
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not available";
  }

  if (
    feature ===
    "vehicle_age"
  ) {
    return `${value} ${Number(value) === 1
      ? "year"
      : "years"
      }`;
  }

  if (
    feature ===
    "mileage_km"
  ) {
    return `${Number(
      value
    ).toLocaleString()} km`;
  }

  if (
    feature ===
    "mileage_per_year"
  ) {
    return `${Math.round(
      Number(value)
    ).toLocaleString()} km/year`;
  }

  if (
    feature ===
    "engine_cc"
  ) {
    return `${Number(
      value
    ).toLocaleString()} cc`;
  }

  if (
    feature ===
    "feature_count"
  ) {
    return `${value} features`;
  }

  return String(value);
}

export default App;