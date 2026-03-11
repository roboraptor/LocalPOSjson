import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Funkce pro otevření databáze
export async function openDb() {
  return open({
    filename: './receipts.db',
    driver: sqlite3.Database
  });
}
