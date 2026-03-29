const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const db = require("./db");
const fs = require("fs");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();

const forumLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({ message: "Too many complaints submitted. Please wait before trying again." });
  }
});

app.use(cors({
  origin: function (origin, callback) {
    console.log("CORS Origin Header:", origin);
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or Expired Token" });
    req.user = user;
    next();
  });
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access not allowed" });
    }
    next();
  };
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

/* =====================================================
   FORUM ROUTES
===================================================== */
app.post("/api/forum/create-post", forumLimiter, authenticateToken, authorizeRole("donor", "admin"), async (req, res) => {
  const { content, type, action, organization } = req.body;
  if (!content || !organization) return res.status(400).json({ message: "Content and organization required" });
  try {
    const mlResponse = await axios.post("https://lucid-curiosity-production-bcbf.up.railway.app/analyze", { message: content });
    const { spam, urgency } = mlResponse.data;
    if (spam) return res.status(400).json({ message: "Post detected as spam and rejected." });
    const sql = `INSERT INTO posts (type, requested_action, content, organization, urgency) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [type, action, content, organization, urgency], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Post created successfully", postId: result.insertId, urgency });
    });
  } catch (error) {
    return res.status(500).json({ message: "Spam detection service unavailable." });
  }
});

app.post("/api/forum/vote/:postId/:voteType", authenticateToken, authorizeRole("donor", "admin"), (req, res) => {
  const { postId, voteType } = req.params;
  const userId = req.user.id;
  const sql = `INSERT INTO votes (post_id, user_identifier, vote_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE vote_type = ?`;
  db.query(sql, [postId, userId, voteType, voteType], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Vote recorded" });
  });
});

app.get("/api/forum/posts", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const postsSql = `SELECT p.*, COUNT(CASE WHEN v.vote_type = 'up' THEN 1 END) AS upvotes, COUNT(CASE WHEN v.vote_type = 'down' THEN 1 END) AS downvotes FROM posts p LEFT JOIN votes v ON p.id = v.post_id GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  db.query(postsSql, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    db.query(`SELECT COUNT(*) AS total FROM posts`, (err2, countResult) => {
      if (err2) return res.status(500).json({ message: "Count error" });
      res.json({ posts: rows, totalPages: Math.ceil(countResult[0].total / limit) });
    });
  });
});

/* =====================================================
   REGISTER
===================================================== */
app.post("/register", async (req, res) => {
  const { full_name, email, phone, password, role, latitude, longitude } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO user_sev (full_name, email, phone, latitude, longitude, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [full_name, email, phone, latitude || null, longitude || null, hashed, role],
      (err, result) => {
        if (err) { console.log(err); return res.send("Registration failed"); }
        res.json({ success: true, role, id: result.insertId, name: full_name });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   LOGIN
===================================================== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("LOGIN ATTEMPT:", email);
  fs.appendFileSync("server_debug.log", `[${new Date().toISOString()}] LOGIN ATTEMPT: ${email}\n`);
  db.query("SELECT * FROM user_sev WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("LOGIN DB ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { id: user.id, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    console.log("LOGIN SUCCESS:", email, "Role:", user.role);
    res.json({ success: true, token, role: user.role, id: user.id, name: user.full_name });
  });
});

app.get("/donor/dashboard", authenticateToken, authorizeRole("donor"), (req, res) => {
  res.json({ message: `Welcome Donor ${req.user.full_name}` });
});
app.get("/organisation/dashboard", authenticateToken, authorizeRole("organisation"), (req, res) => {
  res.json({ message: `Welcome Organisation ${req.user.full_name}` });
});
app.get("/admin/dashboard", authenticateToken, authorizeRole("admin"), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.full_name}` });
});

/* =====================================================
   ADD DONATION
===================================================== */
app.post("/add-donation", authenticateToken, authorizeRole("donor"), (req, res) => {
  const user_id = req.user.id;
  const { category, gender, age_group, food_type, prepared_date, best_before, pickup_urgency, medicine_name, expiry_date, item_name, organisation_id, pickup_preference, expected_datetime, quantity } = req.body;
  console.log("PAYLOAD RECEIVED (/add-donation):", JSON.stringify(req.body, null, 2));

  // FIX: Validate quantity is a positive integer
  const finalQuantity = parseInt(quantity, 10);
  if (!finalQuantity || finalQuantity < 1) {
    return res.status(400).json({ message: "Quantity must be a positive number" });
  }

  let data = { gender: null, age_group: null, food_type: null, prepared_date: null, best_before: null, pickup_urgency: null, medicine_name: null, expiry_date: null, item_name: null };
  fs.appendFileSync("server_debug.log", `[${new Date().toISOString()}] /add-donation body: ${JSON.stringify(req.body)}\n`);

  if (category === "clothes") { data.gender = gender || null; data.age_group = age_group || null; }
  if (category === "food") {
    data.food_type = food_type || null;
    data.prepared_date = prepared_date || null;
    data.best_before = best_before || null;
    data.pickup_urgency = pickup_urgency || null;
  } else {
    req.body.organisation_id = null;
  }
  if (category === "medicine") { data.medicine_name = medicine_name || null; data.expiry_date = expiry_date || null; }
  if (["toiletries", "electricals", "stationary", "others"].includes(category)) { data.item_name = item_name || null; }

  const organisation_id_to_use = (category === "food") ? organisation_id : null;

  const sql = `INSERT INTO donations (user_id, category, gender, age_group, food_type, prepared_date, best_before, pickup_urgency, medicine_name, expiry_date, item_name, organisation_id, pickup_preference, expected_datetime, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`;
  db.query(sql, [user_id, category, data.gender, data.age_group, data.food_type, data.prepared_date, data.best_before, data.pickup_urgency, data.medicine_name, data.expiry_date, data.item_name, organisation_id_to_use || null, pickup_preference || "pickup", expected_datetime, finalQuantity], (err) => {
    if (err) { console.log(err); return res.status(500).json({ message: "Donation failed" }); }
    res.json({ message: "Donation added successfully" });
  });
});

/* =====================================================
   DONOR HISTORY
===================================================== */
app.get("/donor/history", authenticateToken, authorizeRole("donor"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT d.donation_id, d.category, d.item_name, d.medicine_name, d.status, d.created_at, d.quantity,
             u.full_name AS organisation_name
      FROM donations d
      LEFT JOIN user_sev u ON d.organisation_id = u.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   ADD ORGANIZATION NEED
===================================================== */
app.post("/add-org-request", authenticateToken, authorizeRole("organisation"), (req, res) => {
  const org_id = req.user.id;
  const { category, gender, age_group, subcategory, quantity, urgency } = req.body;
  console.log("PAYLOAD RECEIVED (/add-org-request):", JSON.stringify(req.body, null, 2));
  if (!org_id || !category) return res.status(400).json({ message: "Org ID and category required" });

  // FIX: Validate quantity is a positive integer
  const finalQuantity = parseInt(quantity, 10);
  if (!finalQuantity || finalQuantity < 1) {
    return res.status(400).json({ message: "Quantity must be a positive number" });
  }

  const sql = `INSERT INTO org_needs (org_id, category, subcategory, gender, age_group, quantity, urgency) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [org_id, category, subcategory || null, gender || null, age_group || null, finalQuantity, urgency || "Medium"], (err) => {
    if (err) { console.log("add-org-request error", err); return res.status(500).json({ message: "Failed to post request" }); }
    res.json({ message: "Request posted successfully" });
  });
});

/* =====================================================
   ORGANISATION DONATION REQUESTS
===================================================== */
app.post("/request-donation", authenticateToken, authorizeRole("organisation"), async (req, res) => {
  const org_id = req.user.id;
  const { donation_id, quantity } = req.body;

  // FIX: Validate quantity is a positive integer
  const requestedQty = parseInt(quantity, 10);
  if (!requestedQty || requestedQty < 1) {
    return res.json({ success: false, message: "Requested quantity must be a positive number" });
  }

  try {
    // FIX: Check if already requested
    const [existing] = await db.promise().query(
      "SELECT * FROM donation_requests WHERE donation_id=? AND org_id=?",
      [donation_id, org_id]
    );
    if (existing.length > 0) return res.json({ success: false, message: "Already requested" });

    // FIX: Check that requested quantity does not exceed available quantity
    const [donRows] = await db.promise().query(
      "SELECT quantity, status FROM donations WHERE donation_id=?",
      [donation_id]
    );
    if (donRows.length === 0) return res.json({ success: false, message: "Donation not found" });

    const availableQty = Number(donRows[0].quantity || 0);
    if (requestedQty > availableQty) {
      return res.json({
        success: false,
        message: `Requested quantity (${requestedQty}) exceeds available quantity (${availableQty}). Please request ${availableQty} or fewer.`
      });
    }

    await db.promise().query(
      "INSERT INTO donation_requests (donation_id, org_id, requested_quantity, requested_at) VALUES (?,?,?, NOW())",
      [donation_id, org_id, requestedQty]
    );
    await db.promise().query(
      "UPDATE donations SET status='Requested' WHERE donation_id=?",
      [donation_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("request-donation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =====================================================
   ORG REQUESTS
===================================================== */
app.get("/org-requests/:orgId", authenticateToken, authorizeRole("organisation"), async (req, res) => {
  const orgId = req.user.id;
  try {
    const [rows] = await db.promise().query(`
      SELECT n.need_id AS id, 'need' AS type, n.category, n.gender, n.age_group,
             n.subcategory, n.quantity, n.urgency, n.status, n.created_at
      FROM org_needs n WHERE n.org_id = ? ORDER BY created_at DESC
    `, [orgId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

/* =====================================================
   ADMIN ALL REQUESTS
===================================================== */
app.get("/admin/all-requests", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT n.need_id AS id, u.full_name AS requester, n.category AS title, n.subcategory AS description,
             NULL AS requested_quantity, n.urgency, n.status, n.created_at, 'need' AS type
      FROM org_needs n JOIN user_sev u ON n.org_id = u.id
      UNION ALL
      SELECT dr.request_id AS id, u.full_name AS requester, d.category AS title, d.item_name AS description,
             dr.requested_quantity, 'Medium' AS urgency, d.status, dr.requested_at AS created_at, 'donation' AS type
      FROM donation_requests dr
      JOIN user_sev u ON dr.org_id = u.id
      JOIN donations d ON dr.donation_id = d.donation_id
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* =====================================================
   ADMIN FULFILL NEED
   FIX: Block settlement if available qty < needed qty.
        Do NOT mark as Fulfilled until after qty check passes.
===================================================== */
app.post("/admin/settle-need", authenticateToken, authorizeRole("admin"), async (req, res) => {
  const { id, donation_id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "Need ID required" });
  if (!donation_id) return res.status(400).json({ success: false, message: "A matching donation is strictly required to settle this need." });

  console.log(`SETTLE-NEED START: need_id=${id}, donation_id=${donation_id}`);

  try {
    const [nRows] = await db.promise().query("SELECT * FROM org_needs WHERE need_id = ?", [id]);
    if (nRows.length === 0) return res.status(404).json({ success: false, message: "Need not found" });
    const need = nRows[0];
    const org_id = need.org_id;

    // Verify the donation actually matches the need category
    const [dCheck] = await db.promise().query(
      "SELECT * FROM donations WHERE donation_id = ? AND category = ?",
      [donation_id, need.category]
    );
    if (dCheck.length === 0) {
      return res.status(400).json({ success: false, message: "Selected donation does not match the need category." });
    }

    const [dRows] = await db.promise().query("SELECT * FROM donations WHERE donation_id=?", [donation_id]);
    if (dRows.length === 0) return res.status(500).json({ success: false, message: "Donation not found" });

    const donation = dRows[0];
    const need_qty = Number(need.quantity || 1);
    const don_qty = Number(donation.quantity || 0);

    // FIX: Block settlement if available quantity is less than needed quantity
    if (don_qty < need_qty) {
      return res.status(400).json({
        success: false,
        message: `Cannot settle: this donation only has ${don_qty} item(s) available, but ${need_qty} are needed. Please find a donation with sufficient quantity.`
      });
    }

    // Only mark as Fulfilled after all checks pass
    await db.promise().query("UPDATE org_needs SET status='Fulfilled' WHERE need_id=?", [id]);

    if (don_qty > need_qty) {
      // Partial: deduct need_qty from donation, create a settled record for need_qty
      await db.promise().query(
        "UPDATE donations SET quantity = quantity - ?, status = 'Pending' WHERE donation_id = ?",
        [need_qty, donation_id]
      );
      const insertSql = `INSERT INTO donations (user_id, category, gender, age_group, food_type, prepared_date, best_before, pickup_urgency, medicine_name, expiry_date, item_name, organisation_id, pickup_preference, expected_datetime, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Settled')`;
      await db.promise().query(insertSql, [
        donation.user_id, donation.category, donation.gender, donation.age_group,
        donation.food_type, donation.prepared_date, donation.best_before, donation.pickup_urgency,
        donation.medicine_name, donation.expiry_date, donation.item_name, org_id,
        donation.pickup_preference, donation.expected_datetime, need_qty
      ]);
      res.json({
        success: true,
        message: `Need fulfilled. ${need_qty} item(s) settled. ${don_qty - need_qty} item(s) remain in inventory.`
      });
    } else {
      // Exact match: mark the whole donation as settled
      await db.promise().query(
        "UPDATE donations SET status='Settled', organisation_id=? WHERE donation_id=?",
        [org_id, donation_id]
      );
      res.json({ success: true, message: "Need fulfilled and donation fully settled." });
    }
  } catch (err) {
    console.error("SETTLE-NEED ERROR:", err);
    res.status(500).json({ success: false, message: "Internal server error during settlement" });
  }
});

/* =====================================================
   ADMIN FULFILL DONATION REQUEST
   FIX: Block settlement if available qty < requested qty.
        Use >= for partial vs full branching (was strict <).
===================================================== */
app.post("/admin/settledonation", authenticateToken, authorizeRole("admin"), async (req, res) => {
  const { id } = req.body;
  try {
    const [reqRows] = await db.promise().query("SELECT * FROM donation_requests WHERE request_id=?", [id]);
    if (reqRows.length === 0) return res.json({ success: false, message: "Request not found" });

    const { donation_id, org_id, requested_quantity } = reqRows[0];

    const [donRows] = await db.promise().query("SELECT * FROM donations WHERE donation_id=?", [donation_id]);
    if (donRows.length === 0) return res.json({ success: false, message: "Donation not found" });

    const donation = donRows[0];
    const available_quantity = Number(donation.quantity || 0);
    const req_qty = Number(requested_quantity || 0);

    // FIX: Block settlement if available quantity is less than requested quantity
    if (available_quantity < req_qty) {
      return res.json({
        success: false,
        message: `Cannot settle: only ${available_quantity} item(s) available, but ${req_qty} were requested. The organisation should update their request or wait for more donations.`
      });
    }

    if (available_quantity > req_qty) {
      // Partial: fulfil exactly req_qty, leave the rest in inventory
      const insertSql = `INSERT INTO donations (user_id, category, gender, age_group, food_type, prepared_date, best_before, pickup_urgency, medicine_name, expiry_date, item_name, organisation_id, pickup_preference, expected_datetime, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Settled')`;
      await db.promise().query(insertSql, [
        donation.user_id, donation.category, donation.gender, donation.age_group,
        donation.food_type, donation.prepared_date, donation.best_before, donation.pickup_urgency,
        donation.medicine_name, donation.expiry_date, donation.item_name, org_id,
        donation.pickup_preference, donation.expected_datetime, req_qty
      ]);
      await db.promise().query(
        "UPDATE donations SET quantity = quantity - ?, status = 'Pending' WHERE donation_id=?",
        [req_qty, donation_id]
      );
      await db.promise().query("DELETE FROM donation_requests WHERE request_id=?", [id]);
      res.json({ success: true, message: `Partially settled. ${req_qty} item(s) sent to organisation. ${available_quantity - req_qty} item(s) remain in inventory.` });
    } else {
      // Exact match: settle the whole donation
      await db.promise().query(
        "UPDATE donations SET status='Settled', organisation_id=? WHERE donation_id=?",
        [org_id, donation_id]
      );
      await db.promise().query("DELETE FROM donation_requests WHERE request_id=?", [id]);
      res.json({ success: true, message: "Fully settled." });
    }
  } catch (err) {
    console.error("SETTLE-DONATION ERROR:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* =====================================================
   ADMIN: RECENT (SETTLED) DONATIONS
===================================================== */
app.get("/admin/recent-donations", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT d.donation_id, d.user_id, d.category, d.item_name, d.medicine_name,
             d.status, d.created_at AS settled_date, d.quantity,
             donor.full_name AS donor_name,
             org.full_name AS organisation_name
      FROM donations d
      JOIN user_sev donor ON d.user_id = donor.id
      LEFT JOIN user_sev org ON d.organisation_id = org.id
      WHERE d.status = 'Settled'
      ORDER BY d.created_at DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   ADMIN: AVAILABLE ITEMS
===================================================== */
app.get("/admin/available-items", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT d.donation_id, d.user_id, d.category, d.item_name, d.medicine_name,
             d.status, d.organisation_id, d.quantity, d.gender, d.age_group,
             donor.full_name AS donor_name,
             org.full_name AS chosen_org_name
      FROM donations d
      JOIN user_sev donor ON d.user_id = donor.id
      LEFT JOIN user_sev org ON d.organisation_id = org.id
      WHERE d.status IN ('Pending', 'Requested')
      ORDER BY d.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   ADMIN: LIST ALL ORGANISATIONS
===================================================== */
app.get("/admin/organisations", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT id, full_name, email, phone FROM user_sev WHERE role = 'organisation'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   ADMIN: ORG NEEDS
===================================================== */
app.get("/admin/org-needs", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT
        n.need_id AS id,
        u.full_name AS organisation_name,
        u.id AS org_id,
        n.category,
        n.gender,
        n.age_group,
        n.subcategory,
        n.quantity,
        n.urgency,
        n.status,
        n.created_at
      FROM org_needs n
      JOIN user_sev u ON n.org_id = u.id
      WHERE n.status = 'Open'
      ORDER BY n.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* =====================================================
   ADMIN: DONATION REQUESTS
===================================================== */
app.get("/admin/donation-requests", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT dr.request_id AS id, u.full_name AS organisation_name, u.id AS org_id,
             d.category, d.item_name AS title, dr.requested_quantity,
             d.quantity AS available_quantity, dr.requested_at AS created_at,
             d.donation_id, d.status AS donation_status,
             donor.full_name AS donor_name, donor.id AS donor_id
      FROM donation_requests dr
      JOIN user_sev u ON dr.org_id = u.id
      JOIN donations d ON dr.donation_id = d.donation_id
      JOIN user_sev donor ON d.user_id = donor.id
      WHERE d.status = 'Requested'
      ORDER BY dr.requested_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

/* =====================================================
   ADMIN: FOOD DONATIONS
===================================================== */
app.get("/admin/food-donations", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT d.donation_id, d.user_id, d.quantity, d.created_at,
             donor.full_name AS donor_name, org.full_name AS organisation_name
      FROM donations d
      JOIN user_sev donor ON d.user_id = donor.id
      LEFT JOIN user_sev org ON d.organisation_id = org.id
      WHERE d.category = 'food'
      ORDER BY d.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   ADMIN: DONOR DETAILS
===================================================== */
app.get("/admin/donor/:id", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT id, full_name, email, phone, latitude, longitude FROM user_sev WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Donor not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});

/* =====================================================
   ADMIN: SETTLE DONATION
===================================================== */
app.post("/admin/settle-donation", authenticateToken, authorizeRole("admin"), (req, res) => {
  const { donation_id, organisation_id } = req.body;
  if (!donation_id) return res.status(400).json({ success: false, message: "Donation ID required" });
  if (!organisation_id) return res.status(400).json({ success: false, message: "Please select an organisation" });
  db.query("SELECT organisation_id FROM donations WHERE donation_id = ?", [donation_id], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ success: false, message: "DB error" }); }
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Donation not found" });
    db.query(`UPDATE donations SET status='Settled', organisation_id=?, proposed_org_id=NULL, original_org_id=NULL WHERE donation_id=?`, [organisation_id, donation_id], (err2) => {
      if (err2) { console.error(err2); return res.status(500).json({ success: false, message: "DB error" }); }
      res.json({ success: true, message: "Donation settled successfully" });
    });
  });
});

/* =====================================================
   DONOR: NOTIFICATIONS
===================================================== */
app.get("/donor/notifications", authenticateToken, authorizeRole("donor"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT d.donation_id, d.category, d.created_at,
             orig.full_name AS original_org_name, prop.full_name AS proposed_org_name
      FROM donations d
      LEFT JOIN user_sev orig ON d.original_org_id = orig.id
      LEFT JOIN user_sev prop ON d.proposed_org_id = prop.id
      WHERE d.user_id = ? AND d.status = 'OrgChangeProposed'
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   DONOR: RESPOND TO ORG CHANGE
===================================================== */
app.post("/donor/respond-org-change", authenticateToken, authorizeRole("donor"), (req, res) => {
  const { donation_id, action } = req.body;
  if (!donation_id || !action) return res.status(400).json({ success: false, message: "donation_id and action required" });
  db.query("SELECT * FROM donations WHERE donation_id = ? AND user_id = ? AND status = 'OrgChangeProposed'", [donation_id, req.user.id], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ success: false, message: "DB error" }); }
    if (rows.length === 0) return res.status(404).json({ success: false, message: "No pending proposal found" });
    const donation = rows[0];
    if (action === "accept") {
      db.query(`UPDATE donations SET status='Settled', organisation_id=?, proposed_org_id=NULL, original_org_id=NULL WHERE donation_id=?`, [donation.proposed_org_id, donation_id], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "DB error" });
        res.json({ success: true, message: "Accepted. Donation settled with the new organisation." });
      });
    } else if (action === "reject") {
      db.query(`UPDATE donations SET status='Pending', organisation_id=?, proposed_org_id=NULL, original_org_id=NULL WHERE donation_id=?`, [donation.original_org_id, donation_id], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "DB error" });
        res.json({ success: true, message: "Rejected. Donation reverted to your original organisation." });
      });
    } else if (action === "withdraw") {
      db.query(`UPDATE donations SET status='Withdrawn', proposed_org_id=NULL, original_org_id=NULL WHERE donation_id=?`, [donation_id], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "DB error" });
        res.json({ success: true, message: "Donation withdrawn successfully." });
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid action." });
    }
  });
});

/* =====================================================
   ORG: AVAILABLE DONATIONS
===================================================== */
app.get("/donations/available", authenticateToken, authorizeRole("organisation"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT d.donation_id, d.category, d.item_name, d.medicine_name, d.user_id, d.quantity,
             donor.full_name AS donor_name
      FROM donations d
      JOIN user_sev donor ON d.user_id = donor.id
      WHERE d.status = 'Pending'
      ORDER BY d.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   DONOR: NEARBY ORGANISATIONS
===================================================== */
app.get("/food/nearby-orgs", authenticateToken, authorizeRole("donor"), async (req, res) => {
  try {
    const [donorRows] = await db.promise().query("SELECT latitude, longitude FROM user_sev WHERE id = ?", [req.user.id]);
    const donor = donorRows[0];
    const donorLat = donor && donor.latitude ? parseFloat(donor.latitude) : null;
    const donorLng = donor && donor.longitude ? parseFloat(donor.longitude) : null;
    const [orgs] = await db.promise().query("SELECT id, full_name AS name, latitude, longitude FROM user_sev WHERE role = 'organisation'");
    const result = orgs.map(org => {
      const orgLat = org.latitude ? parseFloat(org.latitude) : null;
      const orgLng = org.longitude ? parseFloat(org.longitude) : null;
      let distance = null;
      if (donorLat !== null && donorLng !== null && orgLat !== null && orgLng !== null) {
        const R = 6371;
        const dLat = (orgLat - donorLat) * Math.PI / 180;
        const dLon = (orgLng - donorLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(donorLat * Math.PI / 180) * Math.cos(orgLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return { id: org.id, name: org.name, distance };
    });
    result.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   RAG CHATBOT
===================================================== */
app.post("/api/chat", async (req, res) => {
  const { message, userId, role } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });
  try {
    let context = "";
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("donation") || lowerMsg.includes("history") || lowerMsg.includes("my donat")) {
      if (userId) {
        const [rows] = await db.promise().query(`SELECT category, status, quantity, created_at FROM donations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, [userId]);
        if (rows.length > 0) context += `\nUser's donation history:\n${JSON.stringify(rows, null, 2)}`;
      }
    }
    if (lowerMsg.includes("org") || lowerMsg.includes("need") || lowerMsg.includes("organisation") || lowerMsg.includes("require")) {
      const [rows] = await db.promise().query(`SELECT u.full_name AS organisation, n.category, n.subcategory, n.quantity, n.urgency FROM org_needs n JOIN user_sev u ON n.org_id = u.id WHERE n.status = 'Open' ORDER BY n.urgency DESC LIMIT 10`);
      if (rows.length > 0) context += `\nCurrent organisation needs:\n${JSON.stringify(rows, null, 2)}`;
    }
    if (lowerMsg.includes("available") || lowerMsg.includes("pending") || lowerMsg.includes("near")) {
      const [rows] = await db.promise().query(`SELECT d.category, d.item_name, d.medicine_name, d.quantity, u.full_name AS donor FROM donations d JOIN user_sev u ON d.user_id = u.id WHERE d.status = 'Pending' LIMIT 10`);
      if (rows.length > 0) context += `\nCurrently available donations:\n${JSON.stringify(rows, null, 2)}`;
    }
    if (lowerMsg.includes("forum") || lowerMsg.includes("complaint") || lowerMsg.includes("post") || lowerMsg.includes("issue")) {
      const [rows] = await db.promise().query(`SELECT type, content, urgency, created_at FROM posts ORDER BY created_at DESC LIMIT 5`);
      if (rows.length > 0) context += `\nRecent forum complaints:\n${JSON.stringify(rows, null, 2)}`;
    }
    const platformGuide = `Sevika is a hyper-local charity platform. Donors donate clothes, food, medicine, and essentials. Organisations browse and request donations. Admins match donors with organisations. The forum allows anonymous complaints. Food donations are matched by location. Donors can make monetary donations. Medicine is categorised by age group (Children, Teenagers, Adults, Elderly, General). 1 quantity of medicine = 1 standard pack/strip/bottle of that medicine category.`;
    const systemPrompt = `You are Sevika Assistant. Answer based on real data provided. Be concise and friendly. Platform guide: ${platformGuide}`;
    const userPrompt = context ? `User question: ${message}\n\nReal data:\n${context}` : `User question: ${message}`;
    const groqResponse = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      max_tokens: 500, temperature: 0.7
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } });
    res.json({ answer: groqResponse.data.choices[0].message.content });
  } catch (error) {
    console.error("CHAT ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Chatbot unavailable" });
  }
});

/* =====================================================
   PAYMENTS
===================================================== */
app.post("/api/payment/create", authenticateToken, authorizeRole("donor"), async (req, res) => {
  const { organisation_id, amount } = req.body;
  const donor_id = req.user.id;
  if (!organisation_id || !amount) return res.status(400).json({ success: false, message: "Organisation and amount required" });

  // FIX: Validate amount is a positive number
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be a positive number" });
  }

  try {
    const transaction_id = "TXN" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    await db.promise().query(
      `INSERT INTO payments (donor_id, organisation_id, amount, transaction_id, status) VALUES (?, ?, ?, ?, 'Success')`,
      [donor_id, organisation_id, parsedAmount, transaction_id]
    );
    res.json({ success: true, transaction_id, amount: parsedAmount, message: "Payment successful" });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: "Payment failed" });
  }
});

app.get("/api/payment/history", authenticateToken, authorizeRole("donor"), async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT p.payment_id, p.amount, p.transaction_id, p.status, p.created_at, u.full_name AS organisation_name
      FROM payments p JOIN user_sev u ON p.organisation_id = u.id
      WHERE p.donor_id = ? ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.get("/api/organisations/list", authenticateToken, authorizeRole("donor"), async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT id, full_name FROM user_sev WHERE role = 'organisation'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* =====================================================
   SERVER
===================================================== */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});