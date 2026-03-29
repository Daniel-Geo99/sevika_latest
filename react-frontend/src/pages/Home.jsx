import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Intro from "./Intro";

function CountUp({ end, duration = 2, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }
  })
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

export default function Home() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showIntro, setShowIntro] = useState(() => sessionStorage.getItem("introPlayed") !== "true");
  const navigate = useNavigate();
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (showIntro) {
    return (
      <Intro onFinish={() => {
        sessionStorage.setItem("introPlayed", "true");
        setShowIntro(false);
      }} />
    );
  }

  const s = {
    wrapper: {
      minHeight: "100vh",
      fontFamily: "'Playfair Display', Georgia, serif",
      background: isDark
        ? "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)"
        : "linear-gradient(135deg, #fdf8f0 0%, #fff9f2 50%, #fef6ea 100%)",
      color: isDark ? "#e8dcc8" : "#1a1208",
      overflowX: "hidden",
    },
    nav: {
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 1.5rem",
      backdropFilter: "blur(20px)",
      background: isDark ? "rgba(10,15,30,0.9)" : "rgba(253,248,240,0.9)",
      borderBottom: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.15)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "64px", gap: "1rem",
    },
    logo: {
      fontSize: "1.4rem", fontWeight: "700",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      flexShrink: 0,
    },
    navLinks: {
      display: "flex", gap: "1.2rem", listStyle: "none",
      margin: 0, padding: 0,
    },
    navLink: {
      fontSize: "0.75rem", fontFamily: "'Lato', sans-serif",
      fontWeight: "600", letterSpacing: "0.05em",
      color: isDark ? "#c8b89a" : "#5a3e28",
      cursor: "pointer", textDecoration: "none",
      textTransform: "uppercase", whiteSpace: "nowrap",
      transition: "color 0.2s",
    },
    themeBtn: {
      padding: "0.35rem 0.9rem", borderRadius: "20px", border: "none",
      background: isDark ? "rgba(232,146,58,0.15)" : "rgba(196,98,26,0.1)",
      color: isDark ? "#e8923a" : "#c4621a",
      cursor: "pointer", fontSize: "0.75rem",
      fontFamily: "'Lato', sans-serif", fontWeight: "600",
      whiteSpace: "nowrap", flexShrink: 0,
    },
    hero: {
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: "7rem 2rem 4rem", position: "relative",
    },
    heroTag: {
      display: "inline-block", padding: "0.4rem 1.2rem", borderRadius: "30px",
      background: isDark ? "rgba(232,146,58,0.15)" : "rgba(196,98,26,0.1)",
      border: isDark ? "1px solid rgba(232,146,58,0.3)" : "1px solid rgba(196,98,26,0.2)",
      color: isDark ? "#e8923a" : "#c4621a",
      fontSize: "0.8rem", fontFamily: "'Lato', sans-serif",
      letterSpacing: "0.1em", textTransform: "uppercase",
      fontWeight: "700", marginBottom: "1.5rem",
    },
    heroTitle: {
      fontSize: "clamp(2.8rem, 7vw, 6.5rem)",
      fontWeight: "700", lineHeight: "1.05",
      letterSpacing: "-0.03em", marginBottom: "1.5rem",
      color: isDark ? "#f5e6cc" : "#1a0e05",
    },
    heroTitleAccent: {
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    heroSub: {
      fontSize: "clamp(0.95rem, 2vw, 1.2rem)",
      fontFamily: "'Lato', sans-serif", fontWeight: "300",
      color: isDark ? "#9e8a6e" : "#7a5c3a",
      maxWidth: "580px", margin: "0 auto 2.5rem", lineHeight: "1.8",
    },
    heroBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
    btnPrimary: {
      padding: "0.9rem 2.2rem", borderRadius: "50px",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      color: "white", border: "none", cursor: "pointer",
      fontFamily: "'Lato', sans-serif", fontWeight: "700",
      fontSize: "0.95rem", boxShadow: "0 8px 30px rgba(196,98,26,0.35)", transition: "all 0.3s",
    },
    btnSecondary: {
      padding: "0.9rem 2.2rem", borderRadius: "50px", background: "transparent",
      color: isDark ? "#e8923a" : "#c4621a",
      border: isDark ? "1.5px solid rgba(232,146,58,0.5)" : "1.5px solid rgba(196,98,26,0.4)",
      cursor: "pointer", fontFamily: "'Lato', sans-serif", fontWeight: "600",
      fontSize: "0.95rem", transition: "all 0.3s",
    },
    statsSection: {
      padding: "4rem 2rem",
      background: isDark ? "rgba(232,146,58,0.04)" : "rgba(196,98,26,0.03)",
      borderTop: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.1)",
      borderBottom: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.1)",
    },
    statsGrid: {
      maxWidth: "900px", margin: "0 auto",
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "2rem", textAlign: "center",
    },
    statNum: {
      fontSize: "2.8rem", fontWeight: "700",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: "1",
    },
    statLabel: {
      fontSize: "0.8rem", fontFamily: "'Lato', sans-serif",
      color: isDark ? "#9e8a6e" : "#7a5c3a",
      textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.5rem",
    },
    section: { padding: "6rem 2rem", maxWidth: "1100px", margin: "0 auto" },
    sectionTag: {
      fontSize: "0.75rem", fontFamily: "'Lato', sans-serif", fontWeight: "700",
      letterSpacing: "0.15em", textTransform: "uppercase",
      color: isDark ? "#e8923a" : "#c4621a", marginBottom: "1rem",
    },
    sectionTitle: {
      fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: "700",
      letterSpacing: "-0.02em", marginBottom: "1.5rem",
      color: isDark ? "#f5e6cc" : "#1a0e05",
    },
    sectionBody: {
      fontSize: "1rem", fontFamily: "'Lato', sans-serif",
      lineHeight: "1.9", color: isDark ? "#9e8a6e" : "#6b4e35", maxWidth: "650px",
    },
    cardsGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1.5rem", marginTop: "3rem",
    },
    card: {
      padding: "1.8rem",
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)",
      border: isDark ? "1px solid rgba(232,146,58,0.12)" : "1px solid rgba(196,98,26,0.12)",
      borderRadius: "16px", transition: "all 0.3s",
    },
    cardTitle: {
      fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.6rem",
      color: isDark ? "#f5e6cc" : "#1a0e05",
    },
    cardBody: {
      fontSize: "0.9rem", fontFamily: "'Lato', sans-serif",
      lineHeight: "1.7", color: isDark ? "#9e8a6e" : "#6b4e35",
    },
    stepsGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "2rem", marginTop: "3rem",
    },
    step: { textAlign: "center", padding: "1.5rem 1rem" },
    stepNum: {
      width: "52px", height: "52px", borderRadius: "50%",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 1.2rem", fontSize: "1.2rem", fontWeight: "700", color: "white",
      boxShadow: "0 8px 24px rgba(196,98,26,0.3)",
    },
    mvGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "2rem", marginTop: "3rem",
    },
    mvCard: {
      padding: "2.2rem",
      background: isDark
        ? "linear-gradient(135deg, rgba(232,146,58,0.08), rgba(196,98,26,0.04))"
        : "linear-gradient(135deg, rgba(255,240,220,0.9), rgba(255,250,240,0.8))",
      border: isDark ? "1px solid rgba(232,146,58,0.2)" : "1px solid rgba(196,98,26,0.15)",
      borderRadius: "20px",
    },
    cta: {
      margin: "4rem 2rem", padding: "5rem 3rem",
      background: "linear-gradient(135deg, #c4621a 0%, #e8923a 50%, #f0a84e 100%)",
      borderRadius: "24px", textAlign: "center", position: "relative", overflow: "hidden",
    },
    ctaTitle: {
      fontSize: "clamp(1.6rem, 4vw, 2.8rem)", fontWeight: "700", color: "white", marginBottom: "1rem",
    },
    ctaBody: {
      fontSize: "1rem", fontFamily: "'Lato', sans-serif",
      color: "rgba(255,255,255,0.85)", marginBottom: "2rem",
    },
    ctaBtn: {
      padding: "1rem 2.8rem", borderRadius: "50px", background: "white", color: "#c4621a",
      border: "none", cursor: "pointer", fontFamily: "'Lato', sans-serif", fontWeight: "700",
      fontSize: "1rem", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", transition: "all 0.3s",
    },
    footer: {
      textAlign: "center", padding: "3rem 2rem",
      fontFamily: "'Lato', sans-serif", fontSize: "0.85rem",
      color: isDark ? "#6a5a48" : "#a08060",
      borderTop: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.1)",
    },
    blob: { position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.12, pointerEvents: "none" },
  };

  const categories = [
    { icon: "👕", title: "Clothes", desc: "Donate surplus clothing for men, women, and children of all ages." },
    { icon: "🍱", title: "Food", desc: "Share cooked meals, packed foods, or raw ingredients before they go to waste." },
    { icon: "💊", title: "Medicine", desc: "Safely donate unexpired medicines to those who need them most." },
    { icon: "🧴", title: "Essentials", desc: "Toiletries, stationery, electrical items — every item makes a difference." },
  ];

  const steps = [
    { num: "1", title: "Register", desc: "Create your account as a donor, organisation, or admin in minutes." },
    { num: "2", title: "Donate", desc: "List your surplus items with category, quantity, and pickup preference." },
    { num: "3", title: "Verify", desc: "Our team verifies donations to ensure quality, safety, and trust." },
    { num: "4", title: "Distribute", desc: "Verified items are matched and delivered to nearby charities in need." },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <div style={s.wrapper}>

        {/* NAV */}
        <nav style={s.nav}>
          <div style={s.logo}>Sevika</div>
          <ul style={s.navLinks}>
            {[["Home", "/"], ["Register", "/register"], ["Forum", "/ForumPage"], ["Login", "/login"]].map(([label, path]) => (
              <li key={label}>
                <a href={path} style={s.navLink}
                  onMouseEnter={e => e.target.style.color = "#e8923a"}
                  onMouseLeave={e => e.target.style.color = isDark ? "#c8b89a" : "#5a3e28"}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <button style={s.themeBtn} onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? "☀ Light" : "🌙 Dark"}
          </button>
        </nav>

        {/* HERO */}
        <section style={s.hero}>
          <div style={{ ...s.blob, width: "500px", height: "500px", background: "#e8923a", top: "5%", right: "-15%" }} />
          <div style={{ ...s.blob, width: "350px", height: "350px", background: "#c4621a", bottom: "10%", left: "-10%" }} />
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ position: "relative", zIndex: 1 }}>
            <motion.div variants={fadeUp} custom={0}>
              <div style={s.heroTag}>🤝 Community Powered Giving</div>
            </motion.div>
            <motion.h1 style={s.heroTitle} variants={fadeUp} custom={1}>
              Connecting <span style={s.heroTitleAccent}>Hearts,</span><br />
              Sharing Resources
            </motion.h1>
            <motion.p style={s.heroSub} variants={fadeUp} custom={2}>
              Sevika bridges the gap between surplus and need — helping donors share clothes, food, medicine, and essentials with local charities in real time.
            </motion.p>
            <motion.div style={s.heroBtns} variants={fadeUp} custom={3}>
              <button style={s.btnPrimary} onClick={() => navigate("/register")}
                onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 14px 40px rgba(196,98,26,0.5)"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 30px rgba(196,98,26,0.35)"; }}>
                Start Donating →
              </button>
              <button style={s.btnSecondary} onClick={() => navigate("/ForumPage")}
                onMouseEnter={e => e.target.style.background = isDark ? "rgba(232,146,58,0.1)" : "rgba(196,98,26,0.06)"}
                onMouseLeave={e => e.target.style.background = "transparent"}>
                Visit Forum
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* STATS */}
        <motion.section style={s.statsSection} variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div style={s.statsGrid}>
            {[
              { end: 1200, suffix: "+", label: "Donations Made" },
              { end: 48, suffix: "", label: "Partner Organisations" },
              { end: 3500, suffix: "+", label: "Lives Impacted" },
              { end: 6, suffix: "", label: "Active Cities" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <div style={s.statNum}><CountUp end={stat.end} suffix={stat.suffix} /></div>
                <div style={s.statLabel}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ABOUT */}
        <motion.section style={s.section} variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div style={s.sectionTag} variants={fadeUp}>About Us</motion.div>
          <motion.h2 style={s.sectionTitle} variants={fadeUp}>What is Sevika?</motion.h2>
          <motion.p style={s.sectionBody} variants={fadeUp}>
            Sevika is a hyper-local charity platform empowering individuals and organisations to donate surplus items to nearby charities. Every donation is verified before distribution — ensuring your generosity reaches exactly where it's needed.
          </motion.p>
          <motion.div style={s.cardsGrid} variants={stagger}>
            {categories.map((c, i) => (
              <motion.div key={i} style={s.card} variants={fadeUp} custom={i}
                whileHover={{ y: -6, boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(196,98,26,0.15)" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: "0.8rem" }}>{c.icon}</div>
                <div style={s.cardTitle}>{c.title}</div>
                <div style={s.cardBody}>{c.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* HOW IT WORKS */}
        <motion.section style={{ padding: "6rem 2rem", background: isDark ? "rgba(232,146,58,0.03)" : "rgba(196,98,26,0.02)" }}
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.div style={s.sectionTag} variants={fadeUp}>Process</motion.div>
            <motion.h2 style={s.sectionTitle} variants={fadeUp}>How It Works</motion.h2>
            <div style={s.stepsGrid}>
              {steps.map((step, i) => (
                <motion.div key={i} style={s.step} variants={fadeUp} custom={i}>
                  <div style={s.stepNum}>{step.num}</div>
                  <div style={s.cardTitle}>{step.title}</div>
                  <div style={s.cardBody}>{step.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* MISSION & VISION */}
        <motion.section style={s.section} variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.div style={s.sectionTag} variants={fadeUp}>Our Purpose</motion.div>
          <motion.h2 style={s.sectionTitle} variants={fadeUp}>Mission & Vision</motion.h2>
          <div style={s.mvGrid}>
            {[
              { icon: "🎯", title: "Our Mission", body: "To reduce wastage of surplus essential items by providing a reliable platform connecting donors with people in need." },
              { icon: "🌟", title: "Our Vision", body: "To create a sustainable, technology-driven ecosystem that efficiently redistributes resources across India." },
            ].map((m, i) => (
              <motion.div key={i} style={s.mvCard} variants={fadeUp} custom={i} whileHover={{ y: -4 }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>{m.icon}</div>
                <div style={s.cardTitle}>{m.title}</div>
                <div style={s.cardBody}>{m.body}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div style={s.cta} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <h2 style={s.ctaTitle}>Make a Difference Today</h2>
          <p style={s.ctaBody}>Join thousands of donors and organisations already changing lives across India.</p>
          <button style={s.ctaBtn} onClick={() => navigate("/register")}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)"; }}>
            Get Started — It's Free
          </button>
        </motion.div>

        {/* FOOTER */}
        <footer style={s.footer}>
          <div style={{ marginBottom: "0.5rem", fontSize: "1.2rem", fontWeight: "700", background: "linear-gradient(135deg, #e8923a, #c4621a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sevika</div>
          Connecting surplus resources with local needs · © 2026 Sevika. All rights reserved.
        </footer>

      </div>
    </>
  );
}