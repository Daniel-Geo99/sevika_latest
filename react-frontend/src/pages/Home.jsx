import { useState, useEffect, useRef } from "react";
import { motion, useInView, useCountUp, animate } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

export default function Home() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  const styles = {
    wrapper: {
      minHeight: "100vh",
      fontFamily: "'Playfair Display', 'Georgia', serif",
      background: isDark
        ? "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)"
        : "linear-gradient(135deg, #fdf8f0 0%, #fff9f2 50%, #fef6ea 100%)",
      color: isDark ? "#e8dcc8" : "#1a1208",
      overflowX: "hidden",
    },
    nav: {
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 2rem",
      backdropFilter: "blur(20px)",
      background: isDark ? "rgba(10,15,30,0.85)" : "rgba(253,248,240,0.85)",
      borderBottom: isDark ? "1px solid rgba(255,200,100,0.1)" : "1px solid rgba(180,120,40,0.15)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "70px",
    },
    logo: {
      fontSize: "1.6rem", fontWeight: "700",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      letterSpacing: "-0.02em",
    },
    navLinks: {
      display: "flex", gap: "2rem", listStyle: "none",
      margin: 0, padding: 0,
    },
    navLink: {
      fontSize: "0.9rem", fontFamily: "'Lato', sans-serif",
      fontWeight: "500", letterSpacing: "0.05em",
      color: isDark ? "#c8b89a" : "#5a3e28",
      cursor: "pointer", textDecoration: "none",
      textTransform: "uppercase", fontSize: "0.8rem",
      transition: "color 0.2s",
    },
    themeBtn: {
      padding: "0.4rem 1rem", borderRadius: "20px", border: "none",
      background: isDark ? "rgba(232,146,58,0.15)" : "rgba(196,98,26,0.1)",
      color: isDark ? "#e8923a" : "#c4621a",
      cursor: "pointer", fontSize: "0.8rem",
      fontFamily: "'Lato', sans-serif", fontWeight: "600",
      transition: "all 0.2s",
    },

    // HERO
    hero: {
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: "6rem 2rem 4rem",
      position: "relative",
    },
    heroTag: {
      display: "inline-block",
      padding: "0.4rem 1.2rem",
      borderRadius: "30px",
      background: isDark ? "rgba(232,146,58,0.15)" : "rgba(196,98,26,0.1)",
      border: isDark ? "1px solid rgba(232,146,58,0.3)" : "1px solid rgba(196,98,26,0.2)",
      color: isDark ? "#e8923a" : "#c4621a",
      fontSize: "0.8rem", fontFamily: "'Lato', sans-serif",
      letterSpacing: "0.1em", textTransform: "uppercase",
      fontWeight: "700", marginBottom: "1.5rem",
    },
    heroTitle: {
      fontSize: "clamp(3rem, 8vw, 7rem)",
      fontWeight: "700", lineHeight: "1.05",
      letterSpacing: "-0.03em", marginBottom: "1.5rem",
      background: isDark
        ? "linear-gradient(135deg, #f5e6cc 0%, #e8923a 50%, #c4621a 100%)"
        : "linear-gradient(135deg, #1a0e05 0%, #c4621a 60%, #8b3a10 100%)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    heroSub: {
      fontSize: "clamp(1rem, 2vw, 1.3rem)",
      fontFamily: "'Lato', sans-serif", fontWeight: "300",
      color: isDark ? "#9e8a6e" : "#7a5c3a",
      maxWidth: "600px", margin: "0 auto 2.5rem",
      lineHeight: "1.8",
    },
    heroBtns: {
      display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap",
    },
    btnPrimary: {
      padding: "0.9rem 2.5rem", borderRadius: "50px",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      color: "white", border: "none", cursor: "pointer",
      fontFamily: "'Lato', sans-serif", fontWeight: "700",
      fontSize: "0.95rem", letterSpacing: "0.05em",
      boxShadow: "0 8px 30px rgba(196,98,26,0.35)",
      transition: "all 0.3s",
    },
    btnSecondary: {
      padding: "0.9rem 2.5rem", borderRadius: "50px",
      background: "transparent",
      color: isDark ? "#e8923a" : "#c4621a",
      border: isDark ? "1.5px solid rgba(232,146,58,0.5)" : "1.5px solid rgba(196,98,26,0.4)",
      cursor: "pointer",
      fontFamily: "'Lato', sans-serif", fontWeight: "600",
      fontSize: "0.95rem", letterSpacing: "0.05em",
      transition: "all 0.3s",
    },

    // STATS
    statsSection: {
      padding: "4rem 2rem",
      background: isDark
        ? "rgba(232,146,58,0.05)"
        : "rgba(196,98,26,0.04)",
      borderTop: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.1)",
      borderBottom: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.1)",
    },
    statsGrid: {
      maxWidth: "900px", margin: "0 auto",
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "2rem", textAlign: "center",
    },
    statNum: {
      fontSize: "3rem", fontWeight: "700",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      lineHeight: "1",
    },
    statLabel: {
      fontSize: "0.85rem", fontFamily: "'Lato', sans-serif",
      color: isDark ? "#9e8a6e" : "#7a5c3a",
      textTransform: "uppercase", letterSpacing: "0.1em",
      marginTop: "0.5rem",
    },

    // SECTION
    section: {
      padding: "6rem 2rem", maxWidth: "1100px", margin: "0 auto",
    },
    sectionTag: {
      fontSize: "0.75rem", fontFamily: "'Lato', sans-serif",
      fontWeight: "700", letterSpacing: "0.15em",
      textTransform: "uppercase",
      color: isDark ? "#e8923a" : "#c4621a",
      marginBottom: "1rem",
    },
    sectionTitle: {
      fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "700",
      letterSpacing: "-0.02em", marginBottom: "1.5rem",
      color: isDark ? "#f5e6cc" : "#1a0e05",
    },
    sectionBody: {
      fontSize: "1.05rem", fontFamily: "'Lato', sans-serif",
      lineHeight: "1.9", color: isDark ? "#9e8a6e" : "#6b4e35",
      maxWidth: "650px",
    },

    // CARDS
    cardsGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "1.5rem", marginTop: "3rem",
    },
    card: {
      padding: "2rem",
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
      border: isDark ? "1px solid rgba(232,146,58,0.12)" : "1px solid rgba(196,98,26,0.12)",
      borderRadius: "16px",
      backdropFilter: "blur(10px)",
      transition: "all 0.3s",
    },
    cardIcon: {
      fontSize: "2.5rem", marginBottom: "1rem",
    },
    cardTitle: {
      fontSize: "1.2rem", fontWeight: "700",
      marginBottom: "0.75rem",
      color: isDark ? "#f5e6cc" : "#1a0e05",
    },
    cardBody: {
      fontSize: "0.95rem", fontFamily: "'Lato', sans-serif",
      lineHeight: "1.7", color: isDark ? "#9e8a6e" : "#6b4e35",
    },

    // HOW IT WORKS
    stepsGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "2rem", marginTop: "3rem",
    },
    step: {
      textAlign: "center", padding: "2rem 1.5rem",
    },
    stepNum: {
      width: "56px", height: "56px", borderRadius: "50%",
      background: "linear-gradient(135deg, #e8923a, #c4621a)",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 1.5rem",
      fontSize: "1.3rem", fontWeight: "700", color: "white",
      boxShadow: "0 8px 24px rgba(196,98,26,0.3)",
    },

    // MV
    mvGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "2rem", marginTop: "3rem",
    },
    mvCard: {
      padding: "2.5rem",
      background: isDark
        ? "linear-gradient(135deg, rgba(232,146,58,0.08), rgba(196,98,26,0.04))"
        : "linear-gradient(135deg, rgba(232,146,58,0.08), rgba(255,240,220,0.8))",
      border: isDark ? "1px solid rgba(232,146,58,0.2)" : "1px solid rgba(196,98,26,0.15)",
      borderRadius: "20px",
    },

    // CTA
    cta: {
      margin: "4rem 2rem",
      padding: "5rem 3rem",
      background: "linear-gradient(135deg, #c4621a 0%, #e8923a 50%, #f0a84e 100%)",
      borderRadius: "24px",
      textAlign: "center",
      position: "relative", overflow: "hidden",
    },
    ctaTitle: {
      fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: "700",
      color: "white", marginBottom: "1rem",
    },
    ctaBody: {
      fontSize: "1.1rem", fontFamily: "'Lato', sans-serif",
      color: "rgba(255,255,255,0.85)", marginBottom: "2rem",
    },
    ctaBtn: {
      padding: "1rem 3rem", borderRadius: "50px",
      background: "white", color: "#c4621a",
      border: "none", cursor: "pointer",
      fontFamily: "'Lato', sans-serif", fontWeight: "700",
      fontSize: "1rem", letterSpacing: "0.05em",
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      transition: "all 0.3s",
    },

    footer: {
      textAlign: "center", padding: "3rem 2rem",
      fontFamily: "'Lato', sans-serif", fontSize: "0.85rem",
      color: isDark ? "#6a5a48" : "#a08060",
      borderTop: isDark ? "1px solid rgba(232,146,58,0.1)" : "1px solid rgba(196,98,26,0.1)",
    },

    // Decorative blob
    blob: {
      position: "absolute", borderRadius: "50%",
      filter: "blur(80px)", opacity: 0.15, pointerEvents: "none",
    },
  };

  const categories = [
    { icon: "👕", title: "Clothes", desc: "Donate surplus clothing — from everyday wear to seasonal items for men, women, and children." },
    { icon: "🍱", title: "Food", desc: "Share cooked meals, packed foods, or raw ingredients with nearby organisations before they go to waste." },
    { icon: "💊", title: "Medicine", desc: "Safely donate unexpired medicines and medical supplies to those who need them most." },
    { icon: "🧴", title: "Essentials", desc: "Toiletries, stationery, electrical essentials — every item makes a difference in someone's daily life." },
  ];

  const steps = [
    { num: "1", title: "Register", desc: "Create your account as a donor, organisation, or admin in minutes." },
    { num: "2", title: "Donate", desc: "List your surplus items with details — category, quantity, and pickup preference." },
    { num: "3", title: "Verify", desc: "Our team verifies donations to ensure quality, safety, and trust." },
    { num: "4", title: "Distribute", desc: "Verified items are matched and delivered to nearby charities and families in need." },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <div style={styles.wrapper}>

        {/* NAV */}
        <nav style={styles.nav}>
          <div style={styles.logo}>Sevika</div>
          <ul style={styles.navLinks}>
            {["Home", "Register", "Forum", "Login"].map((item) => (
              <li key={item}>
                <a
                  href={item === "Home" ? "/" : item === "Forum" ? "/ForumPage" : `/${item.toLowerCase()}`}
                  style={styles.navLink}
                  onMouseEnter={e => e.target.style.color = isDark ? "#e8923a" : "#c4621a"}
                  onMouseLeave={e => e.target.style.color = isDark ? "#c8b89a" : "#5a3e28"}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <button style={styles.themeBtn} onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? "☀ Light" : "🌙 Dark"}
          </button>
        </nav>

        {/* HERO */}
        <section style={styles.hero}>
          {/* Decorative blobs */}
          <div style={{ ...styles.blob, width: "500px", height: "500px", background: "#e8923a", top: "10%", right: "-10%" }} />
          <div style={{ ...styles.blob, width: "400px", height: "400px", background: "#c4621a", bottom: "10%", left: "-8%" }} />

          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <div style={styles.heroTag}>🤝 Community Powered Giving</div>
            </motion.div>
            <motion.h1 style={styles.heroTitle} variants={fadeUp} custom={1}>
              Connecting Hearts,<br />Sharing Resources
            </motion.h1>
            <motion.p style={styles.heroSub} variants={fadeUp} custom={2}>
              Sevika bridges the gap between surplus and need — helping donors share clothes, food, medicine, and essentials with local charities in real time.
            </motion.p>
            <motion.div style={styles.heroBtns} variants={fadeUp} custom={3}>
              <button
                style={styles.btnPrimary}
                onClick={() => navigate("/register")}
                onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 40px rgba(196,98,26,0.5)"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 30px rgba(196,98,26,0.35)"; }}
              >
                Start Donating →
              </button>
              <button
                style={styles.btnSecondary}
                onClick={() => navigate("/ForumPage")}
                onMouseEnter={e => { e.target.style.background = isDark ? "rgba(232,146,58,0.1)" : "rgba(196,98,26,0.06)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                Visit Forum
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* STATS */}
        <motion.section
          style={styles.statsSection}
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <div style={styles.statsGrid}>
            {[
              { end: 1200, suffix: "+", label: "Donations Made" },
              { end: 48, suffix: "", label: "Partner Organisations" },
              { end: 3500, suffix: "+", label: "Lives Impacted" },
              { end: 6, suffix: " Cities", label: "Active Regions" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <div style={styles.statNum}><CountUp end={s.end} suffix={s.suffix} /></div>
                <div style={styles.statLabel}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ABOUT */}
        <motion.section
          style={styles.section}
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <motion.div style={styles.sectionTag} variants={fadeUp}>About Us</motion.div>
          <motion.h2 style={styles.sectionTitle} variants={fadeUp}>What is Sevika?</motion.h2>
          <motion.p style={styles.sectionBody} variants={fadeUp}>
            Sevika is a hyper-local charity platform that empowers individuals and organisations to donate surplus clothes, food, medicines, and essential items to nearby charities and collection centres. Every donation is verified before distribution to maintain safety, quality, and trust — ensuring your generosity reaches exactly where it's needed.
          </motion.p>

          <motion.div style={styles.cardsGrid} variants={stagger}>
            {categories.map((c, i) => (
              <motion.div
                key={i} style={styles.card} variants={fadeUp} custom={i}
                whileHover={{ y: -6, boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.3)" : "0 20px 40px rgba(196,98,26,0.12)" }}
              >
                <div style={styles.cardIcon}>{c.icon}</div>
                <div style={styles.cardTitle}>{c.title}</div>
                <div style={styles.cardBody}>{c.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* HOW IT WORKS */}
        <motion.section
          style={{ ...styles.section, background: isDark ? "rgba(232,146,58,0.03)" : "rgba(196,98,26,0.02)", maxWidth: "100%", borderRadius: 0 }}
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <motion.div style={styles.sectionTag} variants={fadeUp}>Process</motion.div>
            <motion.h2 style={styles.sectionTitle} variants={fadeUp}>How It Works</motion.h2>
            <div style={styles.stepsGrid}>
              {steps.map((s, i) => (
                <motion.div key={i} style={styles.step} variants={fadeUp} custom={i}>
                  <div style={styles.stepNum}>{s.num}</div>
                  <div style={styles.cardTitle}>{s.title}</div>
                  <div style={styles.cardBody}>{s.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* MISSION & VISION */}
        <motion.section
          style={styles.section}
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <motion.div style={styles.sectionTag} variants={fadeUp}>Our Purpose</motion.div>
          <motion.h2 style={styles.sectionTitle} variants={fadeUp}>Mission & Vision</motion.h2>
          <div style={styles.mvGrid}>
            {[
              { icon: "🎯", title: "Our Mission", body: "To reduce wastage of surplus essential items by providing a reliable platform connecting donors with people in need — making generosity simple, safe, and impactful." },
              { icon: "🌟", title: "Our Vision", body: "To create a sustainable, technology-driven ecosystem that efficiently redistributes resources and strengthens community welfare across every city in India." },
            ].map((m, i) => (
              <motion.div key={i} style={styles.mvCard} variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{m.icon}</div>
                <div style={styles.cardTitle}>{m.title}</div>
                <div style={styles.cardBody}>{m.body}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          style={styles.cta}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-80px", left: "-40px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(0,0,0,0.08)", pointerEvents: "none" }} />
          <h2 style={styles.ctaTitle}>Make a Difference Today</h2>
          <p style={styles.ctaBody}>Join thousands of donors and organisations already changing lives across India.</p>
          <button
            style={styles.ctaBtn}
            onClick={() => navigate("/register")}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)"; }}
          >
            Get Started — It's Free
          </button>
        </motion.div>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <div style={{ marginBottom: "0.5rem", fontSize: "1.2rem", fontWeight: "700", background: "linear-gradient(135deg, #e8923a, #c4621a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sevika</div>
          Connecting surplus resources with local needs · © 2026 Sevika. All rights reserved.
        </footer>

      </div>
    </>
  );
}