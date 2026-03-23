/**
 * This file exists solely for TypeORM CLI migration generation.
 * It exports a DataSource instance that the CLI can use.
 * 
 * Usage: nx db-migration server-api --name=<MIGRATION_NAME>
 * 
 * DO NOT import this file in application code - use databaseConnection() instead.
 * Importing this file triggers immediate DataSource initialization at module load time,
 * bypassing the lazy initialization that the app relies on for proper startup sequencing.
 */
import { databaseConnection } from './database-connection'

export default databaseConnection()

