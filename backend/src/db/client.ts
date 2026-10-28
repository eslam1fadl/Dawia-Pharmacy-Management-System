import path from "node:path";
import fs from 'node:fs';
import Database from "better-sqlite3";



const dbPath=path.resolve('data','pharmacy.db')
fs.mkdirSync(path.dirname(dbPath),{recursive: true})
export const db=new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');