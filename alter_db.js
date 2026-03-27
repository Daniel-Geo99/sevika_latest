const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "a1c2h3u4",
    database: "sevika_db"
});

const alterQuery = `
ALTER TABLE org_needs
ADD COLUMN subcategory VARCHAR(255) AFTER category,
DROP COLUMN food_type,
DROP COLUMN prepared_date,
DROP COLUMN best_before,
DROP COLUMN pickup_urgency,
DROP COLUMN medicine_name,
DROP COLUMN expiry_date,
DROP COLUMN item_name,
DROP COLUMN pickup_preference,
DROP COLUMN expected_datetime,
DROP COLUMN title,
DROP COLUMN description;
`;

db.connect(err => {
    if (err) throw err;
    db.query(alterQuery, (err, res) => {
        if (err) {
            console.error("Error altering table:", err);
            // Ignore error if columns already dropped or column already exists
            if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && err.code !== 'ER_DUP_FIELDNAME') {
                process.exit(1);
            }
        }
        console.log("Table altered successfully", res);
        process.exit(0);
    });
});
