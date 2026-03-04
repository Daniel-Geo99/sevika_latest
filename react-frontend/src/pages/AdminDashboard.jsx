import { useEffect, useState } from "react";
import "./Admindash.css";

const AdminDashboard = () => {

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");

  const [recent, setRecent] = useState([]);
  const [available, setAvailable] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedOrgs, setSelectedOrgs] = useState({});

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  /* ================= LOAD DATA ================= */

  const loadRecent = () => {
    fetch("http://localhost:3000/admin/recent-donations", {
      headers: {
        "Authorization": "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(setRecent)
      .catch(err => console.error("Failed to load recent donations:", err));
  };

  const loadAvailable = () => {
    fetch("http://localhost:3000/admin/available-items", {
      headers: {
        "Authorization": "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(setAvailable);
  };

  const loadOrganisations = () => {
    fetch("http://localhost:3000/admin/organisations", {
      headers: {
        "Authorization": "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(setOrganisations);
  };

  const loadRequests = () => {
    fetch("http://localhost:3000/admin/all-requests", {
      headers: {
        "Authorization": "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(setRequests);
  };

  useEffect(() => {
    if (token) {
      loadRecent();
      loadAvailable();
      loadOrganisations();
      loadRequests();
    }
  }, [token]);

  /* ================= ADMIN ACTIONS ================= */

  const settleDonation = (donationId, organisation_id) => {
    if (!organisation_id) {
      alert("Please select organisation");
      return;
    }

    fetch("http://localhost:3000/admin/settle-donation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ donation_id: donationId, organisation_id }),
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        loadAvailable();
        loadRecent();
      })
      .catch(() => alert("Server error"));
  };

  const settleNeed = (id) => {
    fetch("http://localhost:3000/admin/settle-need", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.success);
          loadRequests();
        } else {
          alert("Failed to settle request");
        }
      })
      .catch(() => alert("Server error"));
  };

  const settleDonationRequest = (id) => {
    fetch("http://localhost:3000/admin/settledonation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Donation request settled successfully");
          loadRequests();
        } else {
          alert("Failed to settle donation request");
        }
      })
      .catch(() => alert("Server error"));
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="admin-container">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <button>Dashboard</button>
        <button>Recent Donations</button>
        <button>Available Items</button>
        <button>Organization Requests</button>
        <button onClick={logout}>Logout</button>
      </div>

      {/* Main */}
      <div className="main">

        {/* Welcome */}
        <div className="card">
          <h3>Welcome Admin {name ? `, ${name}` : ""} 👋</h3>
        </div>

        {/* Recent Donations */}
        <div className="card">
          <h3>Recent Donation History</h3>
          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Category</th>
                <th>Organisation</th>
                <th>Settled On</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan="4">No settled donations yet</td></tr>
              ) : (
                recent.map((d, i) => (
                  <tr key={i}>
                    <td>{d.donor_name}</td>
                    <td>{d.category}</td>
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
                <th>Organisation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {available.length === 0 ? (
                <tr><td colSpan="4">No pending donations</td></tr>
              ) : (
                available.map((d) => (
                  <tr key={d.donation_id}>
                    <td>{d.donor_name}</td>
                    <td>{d.category}</td>
                    <td>
                      <select
                        value={selectedOrgs[d.donation_id] || ""}
                        onChange={(e) =>
                          setSelectedOrgs({
                            ...selectedOrgs,
                            [d.donation_id]: Number(e.target.value)
                          })
                        }
                      >
                        <option value="">Select organisation</option>
                        {organisations.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          settleDonation(
                            d.donation_id,
                            selectedOrgs[d.donation_id]
                          )
                        }
                      >
                        Settle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Organization Requests */}
        <div className="card">
          <h3>Requests Posted by Organizations</h3>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Title</th>
                <th>Description</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Posted On</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.requester}</td>
                  <td>{r.title}</td>
                  <td>{r.description || "-"}</td>
                  <td>{r.urgency}</td>
                  <td>
                    {r.status === "Fulfilled" || r.status === "Settled" ? (
                      "✅ Settled"
                    ) : r.type === "need" ? (
                      <button onClick={() => settleNeed(r.id)}>Settle</button>
                    ) : (
                      <button onClick={() => settleDonationRequest(r.id)}>
                        Settle
                      </button>
                    )}
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;