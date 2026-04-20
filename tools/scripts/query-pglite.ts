import { PGlite } from '@electric-sql/pglite'
import path from 'path'
import os from 'os'

const configPath = process.env.AP_CONFIG_PATH || path.join('./dev/config')
const dataDir = path.join(configPath, 'pglite')

console.log('PGLite data dir:', dataDir)

const pg = new PGlite(dataDir)

const query = process.argv[2] || `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`

try {
    const result = await pg.query(query)
    console.log(JSON.stringify(result.rows, null, 2))
} catch (e: unknown) {
    console.error('Query failed:', (e as Error).message)
}

await pg.close()
