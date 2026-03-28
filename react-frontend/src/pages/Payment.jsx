import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Payment() {
  const [organisations, setOrganisations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form"); // form | processing | success
  const [transactionId, setTransactionId] = useState("");
  const [history, setHistory] = useState([]);
  const [cardDetails, setCardDetails] = useState({
    name: "", number: "", expiry: "", cvv: ""
  });

  const token = localStorage.getItem("sevika_token");

  useEffect(() => {
    fetchOrgs();
    fetchHistory();
  }, []);

  const fetchOrgs = async () => {
  try {
    const res = await axios.get(`${API}/api/organisations/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOrganisations(res.data);
  } catch (err) {
    console.error(err);
  }
};
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/payment/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrg || !amount || !cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
      alert("Please fill all fields");
      return;
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setStep("processing");

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const res = await axios.post(`${API}/api/payment/create`,
        { organisation_id: selectedOrg, amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactionId(res.data.transaction_id);
      setStep("success");
      fetchHistory();
    } catch {
      alert("Payment failed. Please try again.");
      setStep("form");
    }
  };

  const resetForm = () => {
    setStep("form");
    setAmount("");
    setSelectedOrg("");
    setCardDetails({ name: "", number: "", expiry: "", cvv: "" });
    setTransactionId("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e3a5f", marginBottom: "8px" }}>
          💝 Donate to an Organisation
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "32px" }}>
          Support local charities with a monetary donation
        </p>

        {/* FORM */}
        {step === "form" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>

            {/* Organisation select */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Select Organisation
              </label>
              <select
                value={selectedOrg}
                onChange={e => setSelectedOrg(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", background: "#f9fafb" }}
              >
                <option value="">Choose an organisation...</option>
                {organisations.map(org => (
                  <option key={org.id} value={org.id}>{org.full_name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Amount (₹)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "600" }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: "100%", padding: "12px 12px 12px 32px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", background: "#f9fafb", boxSizing: "border-box" }}
                />
              </div>
              {/* Quick amounts */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                {[100, 500, 1000, 5000].map(a => (
                  <button key={a} onClick={() => setAmount(a)}
                    style={{ padding: "6px 12px", borderRadius: "20px", border: "1px solid #d1d5db", background: amount == a ? "#1e3a5f" : "white", color: amount == a ? "white" : "#374151", cursor: "pointer", fontSize: "12px" }}>
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />
            <p style={{ fontWeight: "600", color: "#374151", marginBottom: "16px" }}>💳 Card Details</p>

            {/* Card name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Name on Card</label>
              <input
                value={cardDetails.name}
                onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                placeholder="John Doe"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {/* Card number */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Card Number</label>
              <input
                value={cardDetails.number}
                onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box", fontFamily: "monospace" }}
              />
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Expiry Date</label>
                <input
                  value={cardDetails.expiry}
                  onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  placeholder="MM/YY"
                  maxLength={5}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>CVV</label>
                <input
                  value={cardDetails.cvv}
                  onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  placeholder="•••"
                  maxLength={3}
                  type="password"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button onClick={handlePayment}
              style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)", color: "white", border: "none", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>
              Pay ₹{amount || "0"} Now
            </button>

            <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "12px" }}>
              🔒 Secured simulation — no real money charged
            </p>
          </div>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "60px 32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>⏳</div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e3a5f", marginBottom: "8px" }}>Processing Payment...</h2>
            <p style={{ color: "#6b7280" }}>Please wait while we process your donation</p>
            <div style={{ marginTop: "24px", height: "4px", background: "#e5e7eb", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#1e3a5f", borderRadius: "2px", animation: "progress 2.5s linear forwards" }} />
            </div>
            <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "48px 32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#059669", marginBottom: "8px" }}>Payment Successful!</h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>Thank you for your generous donation</p>
            <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "20px", marginBottom: "24px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>Amount</span>
                <span style={{ fontWeight: "700", color: "#059669" }}>₹{amount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>Transaction ID</span>
                <span style={{ fontWeight: "600", fontSize: "12px", color: "#374151", fontFamily: "monospace" }}>{transactionId}</span>
              </div>
            </div>
            <button onClick={resetForm}
              style={{ padding: "12px 32px", borderRadius: "8px", background: "#1e3a5f", color: "white", border: "none", fontWeight: "600", cursor: "pointer" }}>
              Make Another Donation
            </button>
          </div>
        )}

        {/* Payment History */}
        {history.length > 0 && step === "form" && (
          <div style={{ marginTop: "32px", background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e3a5f", marginBottom: "16px" }}>📋 Payment History</h2>
            {history.map(p => (
              <div key={p.payment_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: "#374151" }}>{p.organisation_name}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "monospace" }}>{p.transaction_id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "700", color: "#059669" }}>₹{p.amount}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}