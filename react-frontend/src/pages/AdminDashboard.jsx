import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Admindash.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  const [recent, setRecent] = useState([]);
  const [available, setAvailable] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [orgNeeds, setOrgNeeds] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]);
  const [foodDonations, setFoodDonations] = useState([]);
  const [selectedOrgs, setSelectedOrgs] = useState({});
  const [selectedMatches, setSelectedMatches] = useState({});

  const getToken = () => localStorage.getItem("token");

  const handleAuthError = (res) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      navigate("/login");
      return true;
    }
    return false;
  };

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") navigate("/login");
  }, []);

  const loadRecent = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/recent-donations", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setRecent(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const loadAvailable = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/available-items", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setAvailable(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const loadOrganisations = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/organisations", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setOrganisations(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const loadOrgNeeds = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/org-needs", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setOrgNeeds(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const loadDonationRequests = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/donation-requests", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setDonationRequests(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const loadFoodDonations = async () => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/food-donations", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setFoodDonations(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (token && role === "admin") {
      loadRecent();
      loadAvailable();
      loadOrganisations();
      loadOrgNeeds();
      loadDonationRequests();
      loadFoodDonations();
    }
  }, []);

  const settleDonation = async (donationId, organisation_id) => {
    if (!organisation_id) { alert("Please select organisation"); return; }
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/settle-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify({ donation_id: donationId, organisation_id }),
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      alert(data.message);
      loadAvailable();
      loadRecent();
    } catch { alert("Server error"); }
  };

  const settleNeed = async (id) => {
    const donationId = selectedMatches[id];
    if (!donationId) { alert("Please select a matching donation from the dropdown first."); return; }
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/settle-need", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify({ id, donation_id: donationId }),
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Need settled successfully");
        loadOrgNeeds();
        loadAvailable();
        loadRecent();
        setSelectedMatches(prev => { const n = { ...prev }; delete n[id]; return n; });
      } else {
        alert(data.message || "Failed to settle need");
      }
    } catch { alert("Server error"); }
  };

  const settleDonationRequest = async (id) => {
    try {
      const res = await fetch("https://sevikalatest-production.up.railway.app/admin/settledonation", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify({ id }),
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (data.success) {
        alert("Donation request settled successfully");
        loadDonationRequests();
        loadAvailable();
      } else {
        alert("Failed to settle donation request");
      }
    } catch { alert("Server error"); }
  };

  const logout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="admin-container">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <button onClick={() => navigate("/")}>🏠 Home</button>
        <button onClick={() => navigate("/ForumPage")}>📢 Forum</button>
        <button>Dashboard</button>
        <button>Recent Donations</button>
        <button>Available Items</button>
        <button>Organization Needs</button>
        <button>Donation Requests</button>
        <button onClick={logout}>Logout</button>
      </div>

      {/* Main */}
      <div className="main">

        {/* Welcome */}
        <div className="card">
          <h3>Welcome Admin 👋</h3>
        </div>

        {/* Recent Donations */}
        <div className="card">
          <h3>Recent Donation History</h3>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Organisation</th>
                <th>Settled On</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan="5">No settled donations yet</td></tr>
              ) : (
                recent.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <Link to={`/admin/donor/${d.user_id}`} style={{ color: "#3498db", textDecoration: "none", fontWeight: "600" }}>
                        {d.donor_name}
                      </Link>
                    </td>
                    <td>
                      {d.category === "medicine"
                        ? `medicine (${d.medicine_name || "N/A"})`
                        : ["toiletries","electricals","stationary"].includes(d.category)
                        ? `${d.category} (${d.item_name || "N/A"})`
                        : d.category}
                    </td>
                    <td>{d.quantity}</td>
                    <td>{d.organisation_name || "-"}</td>
                    <td>{d.settled_date ? new Date(d.settled_date).toLocaleDateString() : "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Available Items */}
        <div className="card">
          <h3>Available Items</h3>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Category</th>
                <th>Details</th>
                <th>Available Qty</th>
              </tr>
            </thead>
            <tbody>
              {available.length === 0 ? (
                <tr><td colSpan="4">No pending donations</td></tr>
              ) : (
                available.map((d) => (
                  <tr key={d.donation_id}>
                    <td>
                      <Link to={`/admin/donor/${d.user_id}`} style={{ color: "#3498db", textDecoration: "none", fontWeight: "600" }}>
                        {d.donor_name}
                      </Link>
                    </td>
                    <td>{d.category}</td>
                    <td style={{ fontSize: "0.85em", color: "#666" }}>
                      {d.category === "medicine" && d.medicine_name}
                      {d.category === "clothes" && `${d.gender || ""} ${d.age_group || ""}`}
                      {["toiletries","electricals","stationary"].includes(d.category) && d.item_name}
                    </td>
                    <td>{d.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Organization Needs */}
        <div className="card">
          <h3>Organization Needs (Posted by Organizations)</h3>
          <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "10px" }}>
            💡 Admin can only settle a need if a matching donation exists in Available Items
          </p>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>What They Need</th>
                <th>Qty Needed</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Posted On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orgNeeds.length === 0 ? (
                <tr><td colSpan="7">No organization needs posted</td></tr>
              ) : (
                orgNeeds.map((need) => {
                  // Match only by category — admin manually picks the donation
                  const matches = available.filter(item =>
                    item.category === need.category
                  );

                  return (
                    <tr key={need.id}>
                      <td>{need.organisation_name}</td>
                      <td>
                        <strong>{need.category}</strong>
                        {need.subcategory && (
                          <><br /><span style={{ fontSize: "0.85em", color: "#666" }}>{need.subcategory}</span></>
                        )}
                      </td>
                      <td>{need.quantity}</td>
                      <td>
                        <span style={{
                          color: need.urgency === "High" ? "#e74c3c" : need.urgency === "Medium" ? "#f39c12" : "#27ae60",
                          fontWeight: "600"
                        }}>
                          {need.urgency}
                        </span>
                      </td>
                      <td>{need.status}</td>
                      <td>{need.created_at ? new Date(need.created_at).toLocaleDateString() : "N/A"}</td>
                      <td>
                        {need.status === "Fulfilled" ? (
                          <span style={{ color: "green" }}>✅ Settled</span>
                        ) : matches.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <select
                              style={{ fontSize: "0.85em", padding: "4px" }}
                              value={selectedMatches[need.id] || ""}
                              onChange={(e) => setSelectedMatches({ ...selectedMatches, [need.id]: e.target.value })}
                            >
                              <option value="">— Select Donation to Use —</option>
                              {matches.map(m => (
                                <option key={m.donation_id} value={m.donation_id}>
                                  {m.donor_name} · {m.category}
                                  {m.medicine_name ? ` (${m.medicine_name})` : ""}
                                  {m.item_name ? ` (${m.item_name})` : ""}
                                  {m.gender ? ` · ${m.gender}` : ""}
                                  {m.age_group ? ` ${m.age_group}` : ""}
                                  · Qty: {m.quantity}
                                </option>
                              ))}
                            </select>
                            {selectedMatches[need.id] && (
                              <div style={{ fontSize: "0.8em", color: "#555" }}>
                                Donor:{" "}
                                <Link
                                  to={`/admin/donor/${matches.find(m => m.donation_id == selectedMatches[need.id])?.user_id}`}
                                  style={{ color: "#3498db", textDecoration: "none", fontWeight: "600" }}
                                >
                                  {matches.find(m => m.donation_id == selectedMatches[need.id])?.donor_name}
                                </Link>
                              </div>
                            )}
                            <button
                              onClick={() => settleNeed(need.id)}
                              style={{
                                background: selectedMatches[need.id] ? "#27ae60" : "#bdc3c7",
                                color: "white", border: "none", padding: "6px 12px",
                                borderRadius: "4px", cursor: selectedMatches[need.id] ? "pointer" : "not-allowed",
                                fontSize: "0.85em"
                              }}
                              disabled={!selectedMatches[need.id]}
                            >
                              ✅ Settle Need
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.82em", color: "#e74c3c" }}>
                            ❌ No {need.category} donations available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Donation Requests from Organizations */}
        <div className="card">
          <h3>Donation Requests from Organizations</h3>
          <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "10px" }}>
            Specific donation requests made by organizations
          </p>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Donor</th>
                <th>Item Category</th>
                <th>Qty Requested</th>
                <th>Available</th>
                <th>Donation Status</th>
                <th>Posted On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donationRequests.length === 0 ? (
                <tr><td colSpan="8">No donation requests</td></tr>
              ) : (
                donationRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.organisation_name}</td>
                    <td>
                      <Link to={`/admin/donor/${req.donor_id}`} style={{ color: "#3498db", textDecoration: "none", fontWeight: "600" }}>
                        {req.donor_name}
                      </Link>
                    </td>
                    <td>
                      {["toiletries","electricals","stationary"].includes(req.category)
                        ? `${req.category} (${req.title || "N/A"})`
                        : req.category}
                    </td>
                    <td>{req.requested_quantity}</td>
                    <td>
                      <span style={{ color: req.requested_quantity <= req.available_quantity ? "green" : "orange" }}>
                        {req.available_quantity}
                      </span>
                    </td>
                    <td>{req.donation_status}</td>
                    <td>{req.created_at ? new Date(req.created_at).toLocaleDateString() : "N/A"}</td>
                    <td>
                      {req.donation_status === "Settled" || req.donation_status === "Fulfilled" ? (
                        <span style={{ color: "green" }}>✅ Settled</span>
                      ) : (
                        <button onClick={() => settleDonationRequest(req.id)}>Settle</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Food Donations */}
        <div className="card">
          <h3>Food Donations</h3>
          <table>
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Quantity</th>
                <th>Donating To</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {foodDonations.length === 0 ? (
                <tr><td colSpan="4">No food donations tracked yet</td></tr>
              ) : (
                foodDonations.map((fd) => (
                  <tr key={fd.donation_id}>
                    <td>
                      <Link to={`/admin/donor/${fd.user_id}`} style={{ color: "#3498db", textDecoration: "none", fontWeight: "600" }}>
                        {fd.donor_name}
                      </Link>
                    </td>
                    <td>{fd.quantity}</td>
                    <td>{fd.organisation_name || "Not Specified"}</td>
                    <td>{fd.created_at ? new Date(fd.created_at).toLocaleDateString() : "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;