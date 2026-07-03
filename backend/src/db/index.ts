import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

let sqliteDb: any = null;
let pgPool: Pool | null = null;
let isPostgres = false;
let dbFilePath = path.join(process.cwd(), 'vayu_vigil.db');

export async function initDb(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || 'sqlite://./vayu_vigil.db';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    isPostgres = true;
    pgPool = new Pool({ connectionString: dbUrl });
    console.log('Connected to PostgreSQL database');
  } else {
    isPostgres = false;
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    if (dbUrl.startsWith('sqlite://')) {
      const relPath = dbUrl.replace('sqlite://', '');
      dbFilePath = path.resolve(process.cwd(), relPath);
      if (dbFilePath) {
        fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
      }
    }
    if (fs.existsSync(dbFilePath)) {
      const fileBuffer = fs.readFileSync(dbFilePath);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log(`Loaded SQLite database from ${dbFilePath}`);
    } else {
      sqliteDb = new SQL.Database();
      console.log(`Created new SQLite database in memory (will save to ${dbFilePath})`);
    }
  }

  await createTables();
}

function saveSqlite(): void {
  if (!isPostgres && sqliteDb && dbFilePath) {
    try {
      fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
      const data = sqliteDb.export();
      fs.writeFileSync(dbFilePath, Buffer.from(data));
    } catch (err) {
      console.error('Failed to save SQLite DB to disk:', err);
    }
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    const res = await pgPool.query(sql, params);
    return res.rows;
  } else if (sqliteDb) {
    // Convert $1, $2, $3 to ?, ?, ? for SQLite
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const stmt = sqliteDb.prepare(sqliteSql);
    stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows as T[];
  }
  throw new Error('Database not initialized');
}

export async function execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
  if (isPostgres && pgPool) {
    const res = await pgPool.query(sql, params);
    return { changes: res.rowCount || 0 };
  } else if (sqliteDb) {
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    sqliteDb.run(sqliteSql, params);
    const changes = sqliteDb.getRowsModified();
    saveSqlite();
    return { changes };
  }
  throw new Error('Database not initialized');
}

async function createTables(): Promise<void> {
  const tableQueries = [
    `CREATE TABLE IF NOT EXISTS city (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS ward (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      name TEXT NOT NULL,
      boundary TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS app_user (
      id TEXT PRIMARY KEY,
      phone TEXT,
      email TEXT,
      password_hash TEXT,
      role TEXT NOT NULL,
      preferred_language TEXT DEFAULT 'en',
      ward_id TEXT,
      city_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS report (
      id TEXT PRIMARY KEY,
      tracking_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      language TEXT DEFAULT 'en',
      photo_url TEXT,
      voice_url TEXT,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      ai_predicted_category TEXT,
      ai_confidence REAL,
      status TEXT DEFAULT 'new',
      action_taken TEXT,
      assigned_officer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sensor (
      id TEXT PRIMARY KEY,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sensor_reading (
      id TEXT PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      pm25 REAL NOT NULL,
      pm10 REAL NOT NULL,
      no2 REAL,
      co REAL,
      temp REAL,
      humidity REAL,
      is_spike INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS grid_cell (
      id TEXT PRIMARY KEY,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      name TEXT NOT NULL,
      centroid_lat REAL NOT NULL,
      centroid_lon REAL NOT NULL,
      bbox_min_lat REAL NOT NULL,
      bbox_min_lon REAL NOT NULL,
      bbox_max_lat REAL NOT NULL,
      bbox_max_lon REAL NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS hotspot_score (
      id TEXT PRIMARY KEY,
      grid_cell_id TEXT NOT NULL,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      risk_score REAL NOT NULL,
      pm25_component REAL NOT NULL,
      complaint_component REAL NOT NULL,
      severity_component REAL NOT NULL,
      satellite_component REAL NOT NULL,
      dominant_category TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS hotspot_forecast (
      id TEXT PRIMARY KEY,
      grid_cell_id TEXT NOT NULL,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      forecast_24h_series TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS alert (
      id TEXT PRIMARY KEY,
      grid_cell_id TEXT NOT NULL,
      ward_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      risk_score REAL NOT NULL,
      threshold_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const q of tableQueries) {
    if (isPostgres && pgPool) {
      await pgPool.query(q);
    } else if (sqliteDb) {
      sqliteDb.run(q);
    }
  }
  saveSqlite();
}

export async function closeDb(): Promise<void> {
  if (isPostgres && pgPool) {
    await pgPool.end();
  } else if (sqliteDb) {
    saveSqlite();
    sqliteDb.close();
  }
}
