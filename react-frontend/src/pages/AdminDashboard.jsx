import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admindash.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const name = localStorage.getItem("name");

  const [recent, setRecent] = useState([]);
  const [available, setAvailable] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [orgNeeds, setOrgNeeds] = useState([]);
  const [donationRequests, setDonationRequests] = useState([]);
  const [selectedOrgs, setSelectedOrgs] = useState({});
  const [selectedMatches, setSelectedMatches] = useState({});

  /* ================= HELPER: get fresh token ================= */
  const getToken = () => localStorage.getItem("token");

  /* ================= HELPER: handle auth errors ================= */
  const handleAuthError = (res) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      navigate("/login");
      return true;
    }
    return false;
  };

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") {
      navigate("/login");
    }
  }, []);

  /* ================= LOAD DATA ================= */

  const loadRecent = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/recent-donations", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setRecent(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load recent donations:", err);
    }
  };

  const loadAvailable = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/available-items", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setAvailable(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load available items:", err);
    }
  };

  const loadOrganisations = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/organisations", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setOrganisations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load organisations:", err);
    }
  };

  const loadOrgNeeds = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/org-needs", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setOrgNeeds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load org needs:", err);
    }
  };

  const loadDonationRequests = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/donation-requests", {
        headers: { "Authorization": "Bearer " + getToken() }
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      setDonationRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load donation requests:", err);
    }
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
    }
  }, []);

  /* ================= ADMIN ACTIONS ================= */

  const settleDonation = async (donationId, organisation_id) => {
    if (!organisation_id) {
      alert("Please select organisation");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:3000/admin/settle-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken()
        },
        body: JSON.stringify({ donation_id: donationId, organisation_id }),
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      alert(data.message);
      loadAvailable();
      loadRecent();
    } catch {
      alert("Server error");
    }
  };

  const settleNeed = async (id) => {
    const donationId = selectedMatches[id];
    
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/settle-need", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken()
        },
        body: JSON.stringify({ id, donation_id: donationId }),
      });
      if (handleAuthError(res)) return;
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Need settled successfully");
        loadOrgNeeds();
        loadAvailable();
        loadRecent();
      } else {
        alert(data.message || "Failed to settle need");
      }
    } catch {
      alert("Server error");
    }
  };

  const settleDonationRequest = async (id) => {
    try {
      const res = await fetch("http://127.0.0.1:3000/admin/settledonation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken()
        },
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
    } catch {
      alert("Server error");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="admin-container">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
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
                    <td>{d.donor_name}</td>
                    <td>{["toiletries","electricals","stationary"].includes(d.category) ? `${d.category} (${d.item_name || "N/A"})` : d.category}</td>
                    <td>{d.quantity}</td>
                    <td>{d.organisation_name || "-"}</td>
                    <td>{new Date(d.settled_date).toLocaleDateString()}</td>
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
                <th>Available Qty</th>
                <th>Donor's Chosen Org</th>
              </tr>
            </thead>
            <tbody>
              {available.length === 0 ? (
                <tr><td colSpan="4">No pending donations</td></tr>
              ) : (
                available.map((d) => (
                  <tr key={d.donation_id}>
                    <td>{d.donor_name}</td>
                    <td>{["toiletries","electricals","stationary"].includes(d.category) ? `${d.category} (${d.item_name || "N/A"})` : d.category}</td>
                    <td>{d.quantity}</td>
                    <td>
                      {d.chosen_org_name
                        ? <strong style={{ color: "#2e7d32" }}>✅ {d.chosen_org_name}</strong>
                        : <span style={{ color: "#999" }}>Not selected</span>
                      }
                    </td>
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
            💡 Tip: Match these needs with available donations above to settle them
          </p>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>What They Need</th>
                <th>Description</th>
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
                  const matches = available.filter(item => 
                    item.category === need.category && 
                    item.quantity >= (need.quantity || 1) && 
                    (need.category === 'clothes' 
                      ? (item.gender === need.gender && item.age_group === need.age_group)
                      : (item.item_name === (need.item_name || null)))
                  );

                  const displayCategoryDetails = () => {
                    if (need.category === 'clothes') {
                      const g = need.gender || "Any";
                      const a = need.age_group || "Any";
                      return `${g} - ${a}`;
                    }
                    return need.item_name || "-";
                  };

                  return (
                    <tr key={need.id}>
                      <td>{need.organisation_name}</td>
                      <td>
                        <strong>{need.category}</strong>
                        <br/>
                        <span style={{fontSize: '0.85em', color: '#666'}}>
                          {displayCategoryDetails()}
                        </span>
                      </td>
                      <td>Qty: {need.quantity}</td>
                      <td>{need.urgency}</td>
                      <td>{need.status}</td>
                      <td>{new Date(need.created_at).toLocaleDateString()}</td>
                      <td>
                        {need.status === "Fulfilled" ? (
                          <span style={{ color: "green" }}>✅ Settled</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {matches.length > 0 ? (
                              <>
                                <select 
                                  style={{ fontSize: '0.85em' }}
                                  onChange={(e) => setSelectedMatches({...selectedMatches, [need.id]: e.target.value})}
                                  value={selectedMatches[need.id] || ""}
                                >
                                  <option value="">-- Match with Item --</option>
                                  {matches.map(m => (
                                    <option key={m.donation_id} value={m.donation_id}>
                                      {m.donor_name}'s {m.item_name || m.category} (Avail: {m.quantity})
                                    </option>
                                  ))}
                                </select>
                                <button onClick={() => settleNeed(need.id)}>
                                  Settle with Donation
                                </button>
                              </>
                            ) : (
                              <>
                                <span style={{fontSize: '0.8em', color: '#888'}}>No matching items (needs {need.quantity})</span>
                                <button onClick={() => settleNeed(need.id)}>
                                  Mark as Fulfilled
                                </button>
                              </>
                            )}
                          </div>
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
            This section shows specific donation requests made by organizations
          </p>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
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
                <tr><td colSpan="7">No donation requests</td></tr>
              ) : (
                donationRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.organisation_name}</td>
                    <td>{["toiletries","electricals","stationary"].includes(req.category) ? `${req.category} (${req.title || "N/A"})` : req.category}</td>
                    <td>{req.requested_quantity}</td>
                    <td>
                      <span style={{
                        color: req.requested_quantity <= req.available_quantity ? "green" : "orange"
                      }}>
                        {req.available_quantity}
                      </span>
                    </td>
                    <td>{req.donation_status}</td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      {req.donation_status === "Settled" || req.donation_status === "Fulfilled" ? (
                        <span style={{ color: "green" }}>✅ Settled</span>
                      ) : (
                        <button onClick={() => settleDonationRequest(req.id)}>
                          Settle
                        </button>
                      )}
                    </td>
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
