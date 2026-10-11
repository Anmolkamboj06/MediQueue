
require("dotenv").config();
const db = require("./src/db");

async function checkIndexes() {
  try {
    const result = await db.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("Database error:", error.message);
  } finally {
    await db.end();
  }
}

checkIndexes();
