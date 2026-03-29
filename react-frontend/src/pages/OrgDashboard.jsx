import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Orgdash.css";

// Shared medicine subcategories — must match DonorDashboard exactly
const MEDICINE_SUBCATEGORIES = [
  { group: "Children (0–12 years)", options: ["Children's Fever & Pain Relief", "Children's Cough & Cold", "Children's Vitamins & Supplements", "Children's Allergy Medicine", "Children's Digestive Care"] },
  { group: "Teenagers (13–17 years)", options: ["Teenage Acne & Skin Care", "Teenage Vitamins & Supplements", "Teenage Pain Relief"] },
  { group: "Adults (18–59 years)", options: ["Adult Allergy Medicine", "Adult Blood Pressure Medicine", "Adult Cough & Cold", "Adult Diabetes Medicine", "Adult Digestive Care", "Adult Eye & Ear Care", "Adult Fever & Pain Relief", "Adult First Aid Supplies", "Adult Skin Care", "Adult Vitamins & Supplements"] },
  { group: "Elderly (60+ years)", options: ["Elderly Blood Pressure Medicine", "Elderly Bone & Joint Care", "Elderly Diabetes Medicine", "Elderly Digestive Care", "Elderly Eye Care", "Elderly Heart Medicine", "Elderly Pain Relief", "Elderly Vitamins & Supplements"] },
  { group: "General / Any Age", options: ["Antiseptic & Wound Care", "Bandages & Dressings", "Masks & Sanitizers", "ORS & Hydration Salts", "Thermometers & Medical Devices"] },
];

function OrgDashboard() {
  const navigate = useNavigate();
  const orgId = localStorage.getItem("userId");
  const orgName = localStorage.getItem("name") || "Organization";

  const [items, setItems] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [requestQuantities, setRequestQuantities] = useState({});
  const [formData, setFormData] = useState({ category: "", subcategory: "", gender: "", age_group: "", quantity: 1, urgency: "Medium" });

  const getToken = () => localStorage.getItem("token");

  const handleAuthError = (res) => {
    if (res.status === 401 || res.status === 403) { localStorage.clear(); navigate("/login"); return true; }
    return false;
  };

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (!token || role !== "organisation") navigate("/login");
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/donations/available", {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error loading items:", err); }
  };

  const requestItem = async (donationId) => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/request-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + getToken() },
        body: JSON.stringify({ donation_id: donationId, org_id: orgId, quantity: requestQuantities[donationId] || 1 }),
      });
      const result = await res.json();
      if (handleAuthError(res)) return;
      if (res.ok) { alert("Donation requested successfully"); fetchItems(); }
      else alert(result.message || "Request failed");
    } catch (err) { alert("Failed to request donation"); }
  };

  const fetchMyNeeds = async () => {
    try {
      const res = await fetch(`https://sevikalatest-production.up.railway.app/org-requests/${orgId}`, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setNeeds(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error loading needs:", err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) { alert("Please select a category"); return; }
    if (formData.category === "clothes" && (!formData.gender || !formData.age_group)) { alert("Please provide gender and age group for clothes"); return; }
    if (formData.category !== "clothes" && !formData.subcategory) { alert("Please select a subcategory"); return; }
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/add-org-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + getToken() },
        body: JSON.stringify({
          category: formData.category,
          subcategory: formData.subcategory || null,
          gender: formData.gender || null,
          age_group: formData.age_group || null,
          quantity: formData.quantity || 1,
          urgency: formData.urgency || "Medium",
          org_id: orgId,
        }),
      });
      const result = await res.json();
      alert(result.message);
      setFormData({ category: "", subcategory: "", gender: "", age_group: "", quantity: 1, urgency: "Medium" });
      fetchMyNeeds();
    } catch (err) { alert("Failed to add need"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (token && orgId && role === "organisation") { fetchItems(); fetchMyNeeds(); }
  }, []);

  return (
    <div className="org-container">
      <div className="org-sidebar">
        <h2>Org Dashboard</h2>
        <button onClick={() => navigate("/")}>🏠 Home</button>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Dashboard</button>
        <button onClick={() => document.querySelector("#items-available")?.scrollIntoView({ behavior: "smooth" })}>Items Available</button>
        <button onClick={() => document.querySelector("#my-needs")?.scrollIntoView({ behavior: "smooth" })}>My Needs</button>
        <button onClick={() => document.querySelector("#add-need")?.scrollIntoView({ behavior: "smooth" })}>Add Need</button>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="org-main">
        <div className="card">
          <h3>Welcome, {orgName} 👋</h3>
        </div>

        {/* ITEMS AVAILABLE */}
        <div className="card" id="items-available">
          <h3>Items Available</h3>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Category</th>
                <th>Details</th>
                <th>Available</th>
                <th>Qty to Request</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="6">No items available</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.donation_id}>
                    <td>D{item.user_id}</td>
                    <td>{item.category}</td>
                    <td style={{ fontSize: "0.85em", color: "#666" }}>
                      {item.category === "medicine" && item.medicine_name}
                      {["toiletries","electricals","stationary"].includes(item.category) && item.item_name}
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      <input type="number" min="1" max={item.quantity}
                        value={requestQuantities[item.donation_id] || ""}
                        onChange={(e) => setRequestQuantities({ ...requestQuantities, [item.donation_id]: parseInt(e.target.value) })}
                        placeholder="Qty" style={{ width: "60px", padding: "4px" }}
                      />
                    </td>
                    <td>
                      <button onClick={() => requestItem(item.donation_id)}>Request</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MY NEEDS */}
        <div className="card" id="my-needs">
          <h3>My Needs</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Subcategory / Details</th>
                <th>Qty</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {needs.length === 0 ? (
                <tr><td colSpan="6">No needs posted yet</td></tr>
              ) : (
                needs.map((n, index) => (
                  <tr key={index}>
                    <td>{n.category || "-"}</td>
                    <td>
                      {n.category === "clothes"
                        ? `${n.gender || "Any"} - ${n.age_group || "Any"}`
                        : (n.subcategory || "-")}
                    </td>
                    <td>{n.quantity || "-"}</td>
                    <td style={{ color: n.urgency === "High" ? "#e74c3c" : n.urgency === "Medium" ? "#f39c12" : "#27ae60", fontWeight: "600" }}>
                      {n.urgency}
                    </td>
                    <td>{n.status}</td>
                    <td>{new Date(n.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ADD NEED */}
        <div className="card" id="add-need">
          <h3>Add New Need</h3>
          <form onSubmit={handleSubmit}>

            <select value={formData.category || ""} onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: "" })} required>
              <option value="">Select Category</option>
              <option value="clothes">Clothes</option>
              <option value="food">Food</option>
              <option value="medicine">Medicine</option>
              <option value="toiletries">Toiletries</option>
              <option value="electricals">Electrical Essentials</option>
              <option value="stationary">Stationary</option>
            </select>

            {/* CLOTHES */}
            {formData.category === "clothes" && (
              <>
                <select value={formData.gender || ""} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required>
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Unisex</option>
                </select>
                <select value={formData.age_group || ""} onChange={(e) => setFormData({ ...formData, age_group: e.target.value })} required>
                  <option value="">Select Age Group</option>
                  <option>Kids</option>
                  <option>Teens</option>
                  <option>Adults</option>
                </select>
              </>
            )}

            {/* FOOD */}
            {formData.category === "food" && (
              <select value={formData.subcategory || ""} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} required>
                <option value="">Select Food Type</option>
                <option>Cooked</option>
                <option>Packed</option>
                <option>Raw</option>
              </select>
            )}

            {/* MEDICINE — same subcategories as donor */}
            {formData.category === "medicine" && (
              <>
                <p style={{ fontSize: "0.85em", color: "#e67e22", background: "#fef9e7", padding: "8px 12px", borderRadius: "6px", border: "1px solid #f0c040", marginBottom: "8px" }}>
                  ℹ️ <strong>Note:</strong> 1 quantity = 1 standard pack/strip/bottle of the selected medicine category. Select the category that best matches what your beneficiaries need.
                </p>
                <select value={formData.subcategory || ""} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} required>
                  <option value="">Select Medicine Category</option>
                  {MEDICINE_SUBCATEGORIES.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </optgroup>
                  ))}
                </select>
              </>
            )}

            {/* TOILETRIES */}
            {formData.category === "toiletries" && (
              <select value={formData.subcategory || ""} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} required>
                <option value="">Select Type</option>
                <option>Soaps</option>
                <option>Shampoo</option>
                <option>Sanitary Napkins</option>
              </select>
            )}

            {/* ELECTRICALS */}
            {formData.category === "electricals" && (
              <select value={formData.subcategory || ""} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} required>
                <option value="">Select Type</option>
                <option>Tubelight</option>
                <option>Bulb</option>
                <option>Battery</option>
              </select>
            )}

            {/* STATIONARY */}
            {formData.category === "stationary" && (
              <select value={formData.subcategory || ""} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} required>
                <option value="">Select Type</option>
                <option>Pen</option>
                <option>Pencils</option>
                <option>Scale</option>
              </select>
            )}

            <input type="number" min="1" value={formData.quantity || 1}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              placeholder="Quantity"
            />

            <select value={formData.urgency || "Medium"} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <button type="submit">Add Need</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default OrgDashboard;