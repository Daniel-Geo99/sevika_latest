import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Donordash.css";

const DonorDashboard = () => {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const name = localStorage.getItem("name");

  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({});
  const [history, setHistory] = useState([]);
  const [nearbyOrgs, setNearbyOrgs] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const handleAuthError = (res) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      navigate("/login");
      return true;
    }
    return false;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const loadHistory = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `https://sevikalatest-production.up.railway.app/donor/history`,
        { headers: { "Authorization": "Bearer " + getToken() } }
      );
      if (handleAuthError(res)) return;
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History load error:", error);
    }
  };

  const loadNearbyOrgs = async () => {
    if (!userId) return;
    try {
      setLoadingOrgs(true);
      const res = await fetch(
        `https://sevikalatest-production.up.railway.app/food/nearby-orgs`,
        { headers: { "Authorization": "Bearer " + getToken() } }
      );
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error("Failed to fetch organisations");
      const orgs = await res.json();
      setNearbyOrgs(Array.isArray(orgs) ? orgs : []);
    } catch (error) {
      console.error("Nearby orgs error:", error);
      setNearbyOrgs([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { setSubmitStatus("❌ User not logged in."); return; }

    if (category === "food") {
      const { prepared_date, best_before, expected_datetime } = formData;
      if (prepared_date && expected_datetime) {
        const prepared = new Date(prepared_date).setHours(0, 0, 0, 0);
        const expected = new Date(expected_datetime).getTime();
        if (expected < prepared) {
          setSubmitStatus("❌ Expected date must be after or on prepared date.");
          return;
        }
      }
      if (best_before && expected_datetime) {
        const best = new Date(best_before).setHours(23, 59, 59, 999);
        const expected = new Date(expected_datetime).getTime();
        if (expected > best) {
          setSubmitStatus("❌ Expected date must be on or before best before date.");
          return;
        }
      }
    }

    try {
      setSubmitStatus("Submitting donation...");
      const data = { ...formData, category };
      const res = await fetch("https://sevikalatest-production.up.railway.app/add-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken()
        },
        body: JSON.stringify(data),
      });
      if (handleAuthError(res)) return;
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Donation failed");
      setSubmitStatus("✅ Donation submitted successfully!");
      setFormData({});
      setCategory("");
      setNearbyOrgs([]);
      loadHistory();
    } catch (error) {
      setSubmitStatus("❌ " + error.message);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/"); };

  const getMinDateTime = () => {
    const now = new Date();
    return new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const getMinDate = () => {
    const now = new Date();
    return new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };

  const getExpectedMin = () => {
    const todayMin = getMinDateTime();
    if (category === "food" && formData.prepared_date) {
      const preparedMin = formData.prepared_date + "T00:00";
      return preparedMin > todayMin ? preparedMin : todayMin;
    }
    return todayMin;
  };

  const getExpectedMax = () => {
    if (category === "food" && formData.best_before) return formData.best_before + "T23:59";
    return undefined;
  };

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (!token || !userId || role !== "donor") {
      navigate("/login");
    } else {
      loadHistory();
    }
  }, []);

  return (
    <div className="donor-container">
      <div className="sidebar">
        <h2>Donor Panel</h2>
        <button>Dashboard</button>
        <button>Add Donation</button>
        <button>History</button>
        <button onClick={() => navigate("/payment")}>💝 Donate Money</button>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="main">

        {/* WELCOME CARD */}
        <div className="card">
          <h3>Welcome, {name} 👋</h3>
          <p>Donor ID: D{userId}</p>
        </div>

        {/* MONETARY DONATION CARD */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ marginBottom: "4px" }}>💝 Monetary Donations</h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Support organisations with a direct monetary donation</p>
          </div>
          <button
            onClick={() => navigate("/payment")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
              color: "white",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              whiteSpace: "nowrap"
            }}
          >
            💝 Make a Donation
          </button>
        </div>

        {/* ADD DONATION CARD */}
        <div className="card">
          <h3>Add Donation</h3>
          <form onSubmit={handleSubmit}>
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setFormData({});
                setNearbyOrgs([]);
                if (e.target.value === "food") setTimeout(() => loadNearbyOrgs(), 0);
              }}
              required
            >
              <option value="">Select</option>
              <option value="clothes">Clothes</option>
              <option value="food">Food</option>
              <option value="medicine">Medicine</option>
              <option value="toiletries">Toiletries</option>
              <option value="electricals">Electrical Essentials</option>
              <option value="stationary">Stationary</option>
            </select>

            {category === "clothes" && (
              <>
                <label>Gender</label>
                <select name="gender" onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Unisex</option>
                </select>
                <label>Age Group</label>
                <select name="age_group" onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Kids</option>
                  <option>Teens</option>
                  <option>Adults</option>
                </select>
              </>
            )}

            {category === "food" && (
              <>
                <label>Food Type</label>
                <select name="food_type" onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Cooked</option>
                  <option>Packed</option>
                  <option>Raw</option>
                </select>
                <label>Prepared Date</label>
                <input type="date" name="prepared_date" onChange={handleChange} />
                <label>Best Before</label>
                <input type="date" name="best_before" min={getMinDate()} onChange={handleChange} />
                <label>Pickup Urgency</label>
                <select name="pickup_urgency" onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Immediate</option>
                  <option>Within 2 hours</option>
                  <option>Today</option>
                </select>
              </>
            )}

            {category === "medicine" && (
              <>
                <label>Medicine Name</label>
                <input type="text" name="medicine_name" onChange={handleChange} required />
                <label>Expiry Date</label>
                <input type="date" name="expiry_date" onChange={handleChange} required />
              </>
            )}

            {category === "toiletries" && (
              <>
                <label>Type</label>
                <select name="item_name" onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Soaps</option>
                  <option>Shampoo</option>
                  <option>Sanitary Napkins</option>
                </select>
              </>
            )}

            {category === "electricals" && (
              <>
                <label>Type</label>
                <select name="item_name" onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Tubelight</option>
                  <option>Bulb</option>
                  <option>Battery</option>
                </select>
              </>
            )}

            {category === "stationary" && (
              <>
                <label>Type</label>
                <select name="item_name" onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Pen</option>
                  <option>Pencils</option>
                  <option>Scale</option>
                </select>
              </>
            )}

            {category && (
              <>
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  required
                  placeholder="e.g. 10"
                  onChange={handleChange}
                  value={formData.quantity || ""}
                  style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "5px", border: "1px solid #ddd" }}
                />
              </>
            )}

            {category && (
              <>
                {category === "food" && (
                  <>
                    <label>Select Organisation (optional)</label>
                    {loadingOrgs ? (
                      <p>Loading organisations...</p>
                    ) : (
                      <>
                        <select name="organisation_id" onChange={handleChange}>
                          <option value="">No preference — let admin assign</option>
                          {nearbyOrgs.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}{o.distance !== null ? ` (${o.distance.toFixed(2)} km)` : ""}
                            </option>
                          ))}
                        </select>
                        {nearbyOrgs.length === 0 && (
                          <button type="button" className="small-btn" onClick={loadNearbyOrgs}>
                            📍 Reload Organisations
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}

                <label>Pickup Preference</label>
                <select name="pickup_preference" onChange={handleChange} required>
                  <option value="Pickup">Pickup</option>
                  <option value="Delivery">Delivery</option>
                </select>

                <label>Expected Date & Time</label>
                <input
                  type="datetime-local"
                  name="expected_datetime"
                  min={getExpectedMin()}
                  max={getExpectedMax()}
                  onChange={handleChange}
                />

                <button type="submit" className="submit">Submit Donation</button>
              </>
            )}

            {submitStatus && <p className="submit-message">{submitStatus}</p>}
          </form>
        </div>

        {/* HISTORY CARD */}
        <div className="card">
          <h3>Donation History</h3>
          {history.length === 0 ? (
            <p>No donations yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Charity Given To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((d) => (
                  <tr key={d.donation_id}>
                    <td>{new Date(d.created_at).toLocaleString()}</td>
                    <td>{["toiletries", "electricals", "stationary"].includes(d.category) ? `${d.category} (${d.item_name || "N/A"})` : d.category} ({d.quantity})</td>
                    <td>{d.organisation_name || (d.status === "Settled" ? "—" : "Not yet assigned")}</td>
                    <td className={`status-${d.status}`}>{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default DonorDashboard;