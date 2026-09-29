import { useState } from "react";

import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Users,
  Sparkles,
  Thermometer,
  Droplets,
  Syringe,
  RefreshCw,
  Building2,
  History,
  Save,
  ArrowLeft,
  Search,
} from "lucide-react";

import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  // =========================================================
  // APPLICATION STATE
  // =========================================================

  const [activePage, setActivePage] = useState("dashboard");

  // Selected / connected farm
  const [farmId, setFarmId] = useState(null);

  // Farm ID entered in Dashboard
  const [farmIdInput, setFarmIdInput] = useState("");

  const [farm, setFarm] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FARM PROFILE
  // =========================================================

  const [farmForm, setFarmForm] = useState({
    farm_name: "Green Valley Farm",
    farm_type: "Poultry",
    animal_count: 5000,
    farm_area: 500,
    average_animal_age: 45,
    normal_mortality: 2,
    quarantine_compliance: 80,
    disinfection_frequency: 7,
    visitor_control: 75,
    animal_movement: 5,
    equipment_sharing: 20,
    pest_presence: 30,
    water_quality: 85,
  });

  // =========================================================
  // DAILY ASSESSMENT
  // =========================================================

  const [dailyForm, setDailyForm] = useState({
    temperature: 35,
    humidity: 80,
    sick_animals: 25,
    mortality_today: 5,
    vaccination_compliance: 60,
    cleaning_frequency: 3,
    ppe_compliance: 60,
    visitor_count: 25,
    nearby_outbreak: 1,
  });

  // =========================================================
  // AI ASSESSMENT
  // =========================================================

  const [assessment, setAssessment] = useState(null);

  // =========================================================
  // HISTORY
  // =========================================================

  const [history, setHistory] = useState([]);

  // =========================================================
  // FARM INPUT HANDLER
  // =========================================================

  const handleFarmChange = (event) => {
    const { name, value } = event.target;

    setFarmForm((previous) => ({
      ...previous,
      [name]:
        name === "farm_name" || name === "farm_type"
          ? value
          : Number(value),
    }));
  };

  // =========================================================
  // DAILY INPUT HANDLER
  // =========================================================

  const handleDailyChange = (event) => {
    const { name, value } = event.target;

    setDailyForm((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  };

  // =========================================================
  // LOAD FARM FROM API
  // =========================================================

  const loadFarm = async (id) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/farms/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Farm ID ${id} was not found.`);
        }

        throw new Error("Could not load farm.");
      }

      const result = await response.json();

      // Connect this farm
      setFarm(result);
      setFarmId(result.id);

      // Keep the entered ID visible
      setFarmIdInput(String(result.id));

      // Populate Farm Profile form
      setFarmForm({
        farm_name: result.farm_name,
        farm_type: result.farm_type,
        animal_count: result.animal_count,
        farm_area: result.farm_area,
        average_animal_age: result.average_animal_age,
        normal_mortality: result.normal_mortality,
        quarantine_compliance: result.quarantine_compliance,
        disinfection_frequency: result.disinfection_frequency,
        visitor_control: result.visitor_control,
        animal_movement: result.animal_movement,
        equipment_sharing: result.equipment_sharing,
        pest_presence: result.pest_presence,
        water_quality: result.water_quality,
      });

      // Clear previous assessment when switching farms
      setAssessment(null);

      // Load this farm's history
      await loadHistory(result.id);

      setError("");
    } catch (err) {
      console.error(err);

      setFarm(null);
      setFarmId(null);
      setHistory([]);
      setAssessment(null);

      setError(
        err.message ||
          "Could not load the farm. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FARM ID BUTTON
  // =========================================================

  const handleLoadFarm = () => {
    const id = Number(farmIdInput);

    if (!farmIdInput || !Number.isInteger(id) || id <= 0) {
      setError("Please enter a valid Farm ID.");
      return;
    }

    loadFarm(id);
  };

  // =========================================================
  // CREATE OR UPDATE FARM
  // =========================================================

  const saveFarm = async () => {
    setLoading(true);
    setError("");

    try {
      const isUpdating = Boolean(farmId);

      const response = await fetch(
        isUpdating
          ? `${API_URL}/farms/${farmId}`
          : `${API_URL}/farms`,
        {
          method: isUpdating ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(farmForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Could not save farm."
        );
      }

      const result = await response.json();

      const savedFarmId = isUpdating
        ? farmId
        : result.farm_id;

      // Automatically connect to newly created / updated farm
      setFarmIdInput(String(savedFarmId));

      await loadFarm(savedFarmId);

      setActivePage("dashboard");
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not save the farm. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RUN DAILY AI ASSESSMENT
  // =========================================================

  const runAssessment = async () => {
    if (!farmId) {
      setError("Please enter a Farm ID and load the farm first.");
      setActivePage("dashboard");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/farms/${farmId}/assessment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dailyForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Unable to get assessment from server."
        );
      }

      const result = await response.json();

      setAssessment(result);

      await loadHistory(farmId);

      setActivePage("dashboard");
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not connect to the AI server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD HISTORY
  // =========================================================

  const loadHistory = async (id = farmId) => {
    if (!id) {
      setHistory([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/farms/${id}/history`
      );

      if (!response.ok) {
        throw new Error("Could not load history.");
      }

      const result = await response.json();

      setHistory(result.history || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    }
  };

  // =========================================================
  // RISK CLASS
  // =========================================================

  const getRiskClass = (riskLevel) => {
    if (riskLevel === "High") {
      return "high";
    }

    if (riskLevel === "Moderate") {
      return "medium";
    }

    return "low";
  };

  // =========================================================
  // FARM ACCESS CARD
  // =========================================================

  const renderFarmAccess = () => {
    return (
      <section className="assessment-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">FARM ACCESS</span>

            <h3>
              {farm
                ? "Connected Farm"
                : "Enter Farm ID"}
            </h3>
          </div>

          <Search size={20} />
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "end",
            flexWrap: "wrap",
          }}
        >
          <div
            className="input-group"
            style={{ flex: 1, minWidth: "220px" }}
          >
            <label>Farm ID</label>

            <input
              type="number"
              min="1"
              placeholder="Enter Farm ID e.g. 1"
              value={farmIdInput}
              onChange={(event) => {
                setFarmIdInput(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleLoadFarm();
                }
              }}
            />
          </div>

          <button
            className="assess-button"
            onClick={handleLoadFarm}
            disabled={loading}
            style={{ marginBottom: "0" }}
          >
            {loading ? (
              <>
                <RefreshCw
                  size={17}
                  className="spin"
                />
                Loading...
              </>
            ) : (
              <>
                <Search size={17} />
                Load Farm
              </>
            )}
          </button>
        </div>

        {farm && (
          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "18px",
              }}
            >
              <div>
                <span className="eyebrow">FARM ID</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  #{farm.id}
                </strong>
              </div>

              <div>
                <span className="eyebrow">FARM NAME</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  {farm.farm_name}
                </strong>
              </div>

              <div>
                <span className="eyebrow">FARM TYPE</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  {farm.farm_type}
                </strong>
              </div>

              <div>
                <span className="eyebrow">ANIMALS</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  {farm.animal_count.toLocaleString()}
                </strong>
              </div>

              <div>
                <span className="eyebrow">AREA</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  {farm.farm_area}
                </strong>
              </div>
            </div>
          </div>
        )}

        {!farm && (
          <p
            style={{
              marginTop: "15px",
              opacity: 0.7,
            }}
          >
            Enter the Farm ID provided during farm registration
            to access its profile and assessment history.
          </p>
        )}
      </section>
    );
  };

  // =========================================================
  // FARM PROFILE PAGE
  // =========================================================

  const renderFarmSetup = () => {
    return (
      <section className="assessment-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">
              FARM PROFILE
            </span>

            <h3>
              {farm
                ? "Update Farm Information"
                : "Create Your Farm Profile"}
            </h3>
          </div>

          <Building2 size={20} />
        </div>

        <div className="form-grid">
          <div className="input-group">
            <label>Farm Name</label>

            <input
              type="text"
              name="farm_name"
              value={farmForm.farm_name}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Farm Type</label>

            <select
              name="farm_type"
              value={farmForm.farm_type}
              onChange={handleFarmChange}
            >
              <option value="Poultry">Poultry</option>
              <option value="Pig">Pig</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div className="input-group">
            <label>Animal Count</label>

            <input
              type="number"
              min="1"
              name="animal_count"
              value={farmForm.animal_count}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Farm Area</label>

            <input
              type="number"
              min="1"
              step="0.1"
              name="farm_area"
              value={farmForm.farm_area}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Average Animal Age (days)</label>

            <input
              type="number"
              min="1"
              name="average_animal_age"
              value={farmForm.average_animal_age}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Normal Mortality</label>

            <input
              type="number"
              min="0"
              step="0.1"
              name="normal_mortality"
              value={farmForm.normal_mortality}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>
              Quarantine Compliance (%)
            </label>

            <input
              type="number"
              min="0"
              max="100"
              name="quarantine_compliance"
              value={farmForm.quarantine_compliance}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Disinfection / Week</label>

            <input
              type="number"
              min="0"
              name="disinfection_frequency"
              value={farmForm.disinfection_frequency}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Visitor Control (%)</label>

            <input
              type="number"
              min="0"
              max="100"
              name="visitor_control"
              value={farmForm.visitor_control}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Animal Movement</label>

            <input
              type="number"
              min="0"
              name="animal_movement"
              value={farmForm.animal_movement}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Equipment Sharing (%)</label>

            <input
              type="number"
              min="0"
              max="100"
              name="equipment_sharing"
              value={farmForm.equipment_sharing}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Pest Presence (%)</label>

            <input
              type="number"
              min="0"
              max="100"
              name="pest_presence"
              value={farmForm.pest_presence}
              onChange={handleFarmChange}
            />
          </div>

          <div className="input-group">
            <label>Water Quality (%)</label>

            <input
              type="number"
              min="0"
              max="100"
              name="water_quality"
              value={farmForm.water_quality}
              onChange={handleFarmChange}
            />
          </div>
        </div>

        <button
          className="assess-button"
          onClick={saveFarm}
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw
                size={17}
                className="spin"
              />

              Saving Farm...
            </>
          ) : (
            <>
              <Save size={17} />

              {farm
                ? "Save Farm Profile"
                : "Create Farm"}
            </>
          )}
        </button>
      </section>
    );
  };

  // =========================================================
  // DAILY ASSESSMENT PAGE
  // =========================================================

  const renderDailyAssessment = () => {
    return (
      <section className="assessment-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">
              DAILY ASSESSMENT
            </span>

            <h3>
              Enter Current Farm Conditions
            </h3>
          </div>

          <Sparkles size={20} />
        </div>

        {!farm ? (
          <div className="error-message">
            Please enter and load a valid Farm ID from the
            Dashboard before running an assessment.
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 15px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <strong>
                Assessing: {farm.farm_name}
              </strong>

              <span
                style={{
                  marginLeft: "12px",
                  opacity: 0.7,
                }}
              >
                Farm ID #{farm.id}
              </span>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label>
                  <Thermometer size={15} />
                  Temperature (°C)
                </label>

                <input
                  type="number"
                  name="temperature"
                  value={dailyForm.temperature}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>
                  <Droplets size={15} />
                  Humidity (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  name="humidity"
                  value={dailyForm.humidity}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>Sick Animals</label>

                <input
                  type="number"
                  min="0"
                  name="sick_animals"
                  value={dailyForm.sick_animals}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>Mortality Today</label>

                <input
                  type="number"
                  min="0"
                  name="mortality_today"
                  value={dailyForm.mortality_today}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>
                  <Syringe size={15} />
                  Vaccination Compliance (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  name="vaccination_compliance"
                  value={
                    dailyForm.vaccination_compliance
                  }
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>Cleaning / Week</label>

                <input
                  type="number"
                  min="0"
                  name="cleaning_frequency"
                  value={dailyForm.cleaning_frequency}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>PPE Compliance (%)</label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  name="ppe_compliance"
                  value={dailyForm.ppe_compliance}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>
                  <Users size={15} />
                  Visitors Today
                </label>

                <input
                  type="number"
                  min="0"
                  name="visitor_count"
                  value={dailyForm.visitor_count}
                  onChange={handleDailyChange}
                />
              </div>

              <div className="input-group">
                <label>Nearby Outbreak</label>

                <select
                  name="nearby_outbreak"
                  value={dailyForm.nearby_outbreak}
                  onChange={handleDailyChange}
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>

            <button
              className="assess-button"
              onClick={runAssessment}
              disabled={loading || !farmId}
            >
              {loading ? (
                <>
                  <RefreshCw
                    size={17}
                    className="spin"
                  />

                  Analyzing Farm...
                </>
              ) : (
                <>
                  <Sparkles size={17} />

                  Run AI Assessment
                </>
              )}
            </button>
          </>
        )}
      </section>
    );
  };

  // =========================================================
  // RESULTS
  // =========================================================

  const renderResults = () => {
    if (!assessment) {
      return (
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                AI RESULTS
              </span>

              <h3>No Assessment Yet</h3>
            </div>

            <Sparkles size={20} />
          </div>

          <p>
            Run a daily assessment to see your
            AI-generated disease risk,
            biosecurity score and recommendations.
          </p>
        </section>
      );
    }

    return (
      <>
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span>Disease Risk</span>

              <AlertTriangle size={18} />
            </div>

            <div className="metric-value">
              {assessment.disease_risk}
              <span>%</span>
            </div>

            <div
              className={`metric-status ${getRiskClass(
                assessment.risk_level
              )}`}
            >
              {assessment.risk_level.toUpperCase()} RISK
            </div>

            <p className="metric-description">
              Model probability for the predicted
              risk category
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span>Biosecurity Score</span>

              <ShieldCheck size={18} />
            </div>

            <div className="metric-value">
              {assessment.biosecurity_score}
              <span>/100</span>
            </div>

            <div className="metric-status moderate">
              {assessment.biosecurity_category.toUpperCase()}
            </div>

            <p className="metric-description">
              Overall farm biosecurity performance
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span>Farm Health</span>

              <Activity size={18} />
            </div>

            <div className="metric-value">
              {assessment.risk_level === "Low"
                ? "Stable"
                : assessment.risk_level === "Moderate"
                ? "Monitor"
                : "Critical"}
            </div>

            <div
              className={`metric-status ${getRiskClass(
                assessment.risk_level
              )}`}
            >
              {assessment.risk_level === "Low"
                ? "HEALTHY"
                : assessment.risk_level === "Moderate"
                ? "MONITOR"
                : "URGENT"}
            </div>

            <p className="metric-description">
              Current overall farm health status
            </p>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  PERFORMANCE
                </span>

                <h3>
                  Biosecurity Breakdown
                </h3>
              </div>

              <ShieldCheck size={20} />
            </div>

            <div className="breakdown">
              {Object.entries(
                assessment.biosecurity_breakdown || {}
              ).map(([key, value]) => (
                <div
                  className="breakdown-item"
                  key={key}
                >
                  <div>
                    <span>
                      {key
                        .replaceAll("_", " ")
                        .replace(
                          /\b\w/g,
                          (letter) =>
                            letter.toUpperCase()
                        )}
                    </span>

                    <strong>{value}</strong>
                  </div>

                  <div className="progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${value}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  AI INSIGHTS
                </span>

                <h3>
                  Priority Actions
                </h3>
              </div>

              <Sparkles size={20} />
            </div>

            <div className="recommendations">
              {!assessment.recommendations ||
              assessment.recommendations.length === 0 ? (
                <div className="no-recommendations">
                  <ShieldCheck size={28} />

                  <strong>
                    No immediate actions required
                  </strong>

                  <p>
                    Current farm conditions are
                    within acceptable limits.
                  </p>
                </div>
              ) : (
                assessment.recommendations.map(
                  (recommendation, index) => (
                    <div
                      className={`recommendation ${recommendation.priority.toLowerCase()}`}
                      key={index}
                    >
                      <div className="recommendation-dot"></div>

                      <div>
                        <strong>
                          {recommendation.priority}
                          {" "}
                          Priority
                        </strong>

                        <p>
                          {recommendation.message}
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>
      </>
    );
  };

  // =========================================================
  // HISTORY
  // =========================================================

  const renderHistory = () => {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">
              ASSESSMENT HISTORY
            </span>

            <h3>
              {farm
                ? `${farm.farm_name} — Previous Assessments`
                : "Previous Farm Assessments"}
            </h3>
          </div>

          <History size={20} />
        </div>

        {!farm ? (
          <p>
            Enter a Farm ID on the Dashboard to view
            assessment history.
          </p>
        ) : history.length === 0 ? (
          <p>
            No assessments have been recorded for this
            farm yet.
          </p>
        ) : (
          <div className="breakdown">
            {history.map((item) => (
              <div
                className="breakdown-item"
                key={item.id}
              >
                <div>
                  <span>
                    {item.assessment_date}
                  </span>

                  <strong>
                    {item.disease_risk}%
                    {" — "}
                    {item.risk_level}
                  </strong>
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${item.biosecurity_score}%`,
                    }}
                  ></div>
                </div>

                <small>
                  Biosecurity Score:{" "}
                  {item.biosecurity_score}/100
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="app">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2>FarmOS</h2>
            <span>Biosecurity AI</span>
          </div>
        </div>

        <nav className="navigation">
          <button
            className={`nav-item ${
              activePage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            <Activity size={18} />

            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "farm"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("farm")
            }
          >
            <Building2 size={18} />

            Farm Profile
          </button>

          <button
            className={`nav-item ${
              activePage === "assessment"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("assessment")
            }
          >
            <ShieldCheck size={18} />

            Daily Assessment
          </button>

          <button
            className={`nav-item ${
              activePage === "history"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("history");

              if (farmId) {
                loadHistory(farmId);
              }
            }}
          >
            <History size={18} />

            History
          </button>
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"></span>

          AI System Online
        </div>
      </aside>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">
          <div>
            <span className="eyebrow">
              FARM OVERVIEW
            </span>

            <h1>
              {farm?.farm_name ||
                "Farm Intelligence"}
            </h1>
          </div>

          <div className="farm-status">
            <span className="status-dot"></span>

            {farm
              ? `Farm ID #${farm.id}`
              : "No Farm Connected"}
          </div>
        </header>

        {/* INTRO */}

        <section className="intro">
          <div>
            <h2>
              Farm Intelligence
            </h2>

            <p>
              AI-powered health and biosecurity
              monitoring for your farm.
            </p>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activePage === "dashboard" && (
          <>
            {renderFarmAccess()}

            {farm && renderResults()}

            {farm && (
              <div style={{ marginTop: "20px" }}>
                {renderDailyAssessment()}
              </div>
            )}
          </>
        )}

        {/* =================================================
            FARM PROFILE
        ================================================= */}

        {activePage === "farm" && (
          <>
            {farm && (
              <button
                className="assess-button"
                onClick={() =>
                  setActivePage("dashboard")
                }
                style={{
                  marginBottom: "20px",
                }}
              >
                <ArrowLeft size={17} />

                Back to Dashboard
              </button>
            )}

            {renderFarmSetup()}
          </>
        )}

        {/* =================================================
            DAILY ASSESSMENT
        ================================================= */}

        {activePage === "assessment" && (
          <>
            {renderDailyAssessment()}

            {assessment && renderResults()}
          </>
        )}

        {/* =================================================
            HISTORY
        ================================================= */}

        {activePage === "history" && (
          <>
            {renderHistory()}

            {assessment && (
              <div
                style={{
                  marginTop: "20px",
                }}
              >
                {renderResults()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;