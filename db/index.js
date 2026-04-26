import pg from "pg";

const db = new pg.Pool({
  user: process.env.DB_USER,
  host: "localhost",
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

export const query = (text, params) => db.query(text, params);
export const end = () => db.end();
