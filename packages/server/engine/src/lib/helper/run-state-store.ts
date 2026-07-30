import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

type DatabaseSync = import('node:sqlite').DatabaseSync
type StatementSync = ReturnType<DatabaseSync['prepare']>

type Stmts = {
    put: StatementSync
    select: StatementSync
    materialize: StatementSync
    getAtPath: StatementSync
    allRows: StatementSync
}

let db: DatabaseSync | null = null
let dbPath: string | null = null
let stmts: Stmts | null = null

export const runStateStore = {
    init({ runId }: { runId: string }): void {
        let DatabaseSync: typeof import('node:sqlite').DatabaseSync
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            DatabaseSync = (require('node:sqlite') as typeof import('node:sqlite')).DatabaseSync
        }
        catch {
            return
        }
        dbPath = path.join(os.tmpdir(), `${runId}.sqlite`)
        db = new DatabaseSync(dbPath)
        db.exec(`
            CREATE TABLE steps (
                name TEXT    NOT NULL,
                path TEXT    NOT NULL,
                output BLOB  NOT NULL,
                PRIMARY KEY (name, path)
            )
        `)
        stmts = {
            put: db.prepare('INSERT OR REPLACE INTO steps (name, path, output) VALUES (?, ?, jsonb(?))'),
            select: db.prepare('SELECT output ->> ? FROM steps WHERE name = ? AND path = ?'),
            materialize: db.prepare('SELECT json(output) AS output FROM steps WHERE name = ? AND path = ?'),
            getAtPath: db.prepare('SELECT name, json(output) AS output FROM steps WHERE path = ?'),
            allRows: db.prepare('SELECT name, path, json(output) AS output FROM steps ORDER BY rowid'),
        }
    },

    put({ name, stepPath, scopeEntry }: { name: string, stepPath: string, scopeEntry: unknown }): void {
        if (!stmts) {
            return
        }
        stmts.put.run(name, stepPath, JSON.stringify(scopeEntry))
    },

    select({ name, stepPath, jsonPath }: { name: string, stepPath: string, jsonPath: string }): unknown {
        if (!stmts) {
            return undefined
        }
        const row = stmts.select.get(jsonPath, name, stepPath) as Record<string, unknown> | undefined
        return row ? Object.values(row)[0] : undefined
    },

    materialize({ name, stepPath }: { name: string, stepPath: string }): unknown {
        if (!stmts) {
            return undefined
        }
        const row = stmts.materialize.get(name, stepPath) as { output: string } | undefined
        return row ? JSON.parse(row.output) : undefined
    },

    getAtPath({ stepPath }: { stepPath: string }): Record<string, unknown> {
        if (!stmts) {
            return {}
        }
        const rows = stmts.getAtPath.all(stepPath) as Array<{ name: string, output: string }>
        const result: Record<string, unknown> = {}
        for (const row of rows) {
            result[row.name] = JSON.parse(row.output)
        }
        return result
    },

    allRows(): Array<{ name: string, stepPath: string, output: unknown }> {
        if (!stmts) {
            return []
        }
        const rows = stmts.allRows.all() as Array<{ name: string, path: string, output: string }>
        return rows.map(r => ({
            name: r.name,
            stepPath: r.path,
            output: JSON.parse(r.output),
        }))
    },

    isInitialized(): boolean {
        return !!(db && stmts)
    },

    dispose(): void {
        if (!db || !dbPath) {
            return
        }
        try {
            db.close()
        }
        catch {
            // ignore close errors
        }
        db = null
        stmts = null
        try {
            fs.unlinkSync(dbPath)
        }
        catch {
            // ignore unlink errors — file may already be gone
        }
        dbPath = null
    },
}
