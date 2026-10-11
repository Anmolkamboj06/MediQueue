
require("dotenv").config();
const db = require("./src/db");

async function checkColumns() {
  try {
    const result = await db.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("Database error:", error.message);
  } finally {
    await db.end();
  }
}

checkColumns();
