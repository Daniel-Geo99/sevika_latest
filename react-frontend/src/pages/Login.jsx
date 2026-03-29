import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import "../index.css";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
};

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("https://sevikalatest-production.up.railway.app/login", formData);
      if (res.data.success) {
        const { role, token, id, name } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("userId", id);
        localStorage.setItem("role", role);
        localStorage.setItem("name", name);
        if (role === "admin") navigate("/admin");
        else if (role === "donor") navigate("/donor");
        else if (role === "organisation") navigate("/org");
        else navigate("/");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    field: { marginBottom: "0.1rem" },
    link: {
      color: isDark ? "#e8923a" : "#c4621a",
      fontWeight: "700",
      textDecoration: "none",
      fontSize: "0.88rem",
      transition: "opacity 0.2s",
    },
    divider: {
      display: "flex", alignItems: "center", gap: "0.8rem",
      margin: "1.4rem 0",
      color: isDark ? "#6a5a48" : "#c8b098",
      fontSize: "0.78rem",
    },
    dividerLine: {
      flex: 1, height: "1px",
      background: isDark ? "rgba(232,146,58,0.12)" : "rgba(196,98,26,0.12)",
    },
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* Theme toggle */}
      <button className="theme-toggle" onClick={() => setTheme(isDark ? "light" : "dark")}>
        {isDark ? "☀ Light" : "🌙 Dark"}
      </button>

      {/* Back to home */}
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
              Welcome back
            </div>
            <h2 style={{ marginBottom: "0.4rem" }}>Sign in to Sevika</h2>
            <p style={{ fontSize: "0.88rem", color: isDark ? "#9e8a6e" : "#7a5c3a" }}>
              Continue your giving journey
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label>Email address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div style={s.field}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
              <Link to="/forgot-password" style={s.link}>
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              className="submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </motion.button>
          </form>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span>or</span>
            <div style={s.dividerLine} />
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.88rem", color: isDark ? "#9e8a6e" : "#7a5c3a" }}>
              Don't have an account?{" "}
            </span>
            <Link to="/register" style={s.link}>Create one</Link>
          </div>

          <div style={{ textAlign: "center", marginTop: "0.8rem" }}>
            <Link to="/" style={{ ...s.link, fontSize: "0.8rem", opacity: 0.7 }}>
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default Login;