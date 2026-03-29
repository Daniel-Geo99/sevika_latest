import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../index.css";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
};

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: "", email: "", phone: "",
    password: "", confirmPassword: "",
    role: "", latitude: "", longitude: ""
  });
  const [locationStatus, setLocationStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("Geolocation not supported"); return; }
    setLocationStatus("Detecting…");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setFormData(prev => ({ ...prev, latitude, longitude }));
        setLocationStatus("✅ Location detected");
      },
      () => setLocationStatus("❌ Unable to retrieve location")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { alert("Passwords do not match"); return; }
    setLoading(true);
    try {
      await axios.post("https://sevikalatest-production.up.railway.app/register", formData);
      alert("Registration successful!");
      window.location.href = "/login";
    } catch (error) {
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" },
    locationRow: {
      display: "flex", alignItems: "center", gap: "0.6rem",
      marginTop: "0.4rem",
    },
    locationStatus: {
      fontSize: "0.78rem",
      color: locationStatus.startsWith("✅") ? "#27ae60"
           : locationStatus.startsWith("❌") ? "#e74c3c"
           : isDark ? "#9e8a6e" : "#7a5c3a",
      marginTop: "0.3rem",
    },
    divider: {
      display: "flex", alignItems: "center", gap: "0.8rem",
      margin: "1.4rem 0 1rem",
      color: isDark ? "#6a5a48" : "#c8b098",
      fontSize: "0.78rem",
    },
    dividerLine: {
      flex: 1, height: "1px",
      background: isDark ? "rgba(232,146,58,0.12)" : "rgba(196,98,26,0.12)",
    },
    link: {
      color: isDark ? "#e8923a" : "#c4621a",
      fontWeight: "700", textDecoration: "none", fontSize: "0.88rem",
    },
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <button className="theme-toggle" onClick={() => setTheme(isDark ? "light" : "dark")}>
        {isDark ? "☀ Light" : "🌙 Dark"}
      </button>

      <div style={{ position: "fixed", top: "1.2rem", left: "1.5rem", zIndex: 200 }}>
        <Link to="/" style={{
          fontFamily: "'Lato', sans-serif", fontWeight: "700", fontSize: "1.1rem",
          background: "linear-gradient(135deg, #e8923a, #c4621a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textDecoration: "none",
        }}>
          Sevika
        </Link>
      </div>

      <motion.div
        className="register-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="form-container"
          style={{ maxWidth: "500px" }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              display: "inline-block", padding: "0.35rem 1rem", borderRadius: "30px",
              background: isDark ? "rgba(232,146,58,0.12)" : "rgba(196,98,26,0.08)",
              border: isDark ? "1px solid rgba(232,146,58,0.25)" : "1px solid rgba(196,98,26,0.18)",
              color: isDark ? "#e8923a" : "#c4621a",
              fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: "0.9rem",
            }}>
              Join Sevika
            </div>
            <h2 style={{ marginBottom: "0.4rem" }}>Create your account</h2>
            <p style={{ fontSize: "0.88rem", color: isDark ? "#9e8a6e" : "#7a5c3a" }}>
              Start making a difference today
            </p>
          </div>

          <motion.form onSubmit={handleSubmit} variants={stagger} initial="hidden" animate="visible">

            {/* Name + Phone */}
            <motion.div variants={fadeUp} style={s.row}>
              <div>
                <label>Full Name</label>
                <input type="text" name="full_name" required placeholder="Your full name"
                  value={formData.full_name} onChange={handleChange} />
              </div>
              <div>
                <label>Phone</label>
                <input type="text" name="phone" required placeholder="+91 XXXXX XXXXX"
                  value={formData.phone} onChange={handleChange} />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeUp}>
              <label>Email Address</label>
              <input type="email" name="email" required placeholder="you@example.com"
                value={formData.email} onChange={handleChange} autoComplete="email" />
            </motion.div>

            {/* Location */}
            <motion.div variants={fadeUp}>
              <label>Location</label>
              <div style={s.locationRow}>
                <motion.button
                  type="button"
                  className="location-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={detectLocation}
                  style={{ flex: 1, marginTop: 0 }}
                >
                  📍 Detect My Location
                </motion.button>
              </div>
              {locationStatus && <p style={s.locationStatus}>{locationStatus}</p>}
            </motion.div>

            {/* Passwords */}
            <motion.div variants={fadeUp} style={s.row}>
              <div>
                <label>Password</label>
                <input type="password" name="password" required placeholder="••••••••"
                  value={formData.password} onChange={handleChange} />
              </div>
              <div>
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" required placeholder="••••••••"
                  value={formData.confirmPassword} onChange={handleChange} />
              </div>
            </motion.div>

            {/* Role */}
            <motion.div variants={fadeUp}>
              <label>Register As</label>
              <select name="role" required value={formData.role} onChange={handleChange}>
                <option value="">Select your role</option>
                <option value="donor">Donor — I want to donate</option>
                <option value="organisation">Organisation — We receive donations</option>
              </select>
            </motion.div>

            <motion.button
              type="submit"
              className="submit-btn"
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating account…" : "Create Account →"}
            </motion.button>
          </motion.form>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span>already have an account?</span>
            <div style={s.dividerLine} />
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/login" style={s.link}>Sign in instead</Link>
            <span style={{ color: isDark ? "#6a5a48" : "#c8b098", margin: "0 0.6rem" }}>·</span>
            <Link to="/" style={{ ...s.link, fontSize: "0.8rem", opacity: 0.7 }}>Back to home</Link>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Register;