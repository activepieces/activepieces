import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { isNil } from '@activepieces/core-utils'
import { ExecutionMode } from '@activepieces/shared'
import { DatabaseSync, StatementSync } from 'node:sqlite'

type PreparedStatements = {
    put: StatementSync
    select: StatementSync
    materialize: StatementSync
    getAtPath: StatementSync
    allRows: StatementSync
}

let db: DatabaseSync | null = null
let dbPath: string | null = null
let statements: PreparedStatements | null = null

export const runStateStore = {
    init({ runId, flowVersionId }: { runId: string, flowVersionId: string }): void {
        const base = getBasePath(flowVersionId)
        try {
            fs.mkdirSync(base, { recursive: true })
            dbPath = path.join(base, `${runId}.sqlite`)
            db = new DatabaseSync(dbPath)
        }
        catch {
            return
        }
        db.exec(`
            CREATE TABLE steps (
                name TEXT    NOT NULL,
                path TEXT    NOT NULL,
                output BLOB  NOT NULL,
                PRIMARY KEY (name, path)
            )
        `)
        statements = {
            put: db.prepare('INSERT OR REPLACE INTO steps (name, path, output) VALUES (?, ?, jsonb(?))'),
            select: db.prepare('SELECT output ->> ? FROM steps WHERE name = ? AND path = ?'),
            materialize: db.prepare('SELECT json(output) AS output FROM steps WHERE name = ? AND path = ?'),
            getAtPath: db.prepare('SELECT name, json(output) AS output FROM steps WHERE path = ?'),
            allRows: db.prepare('SELECT name, path, json(output) AS output FROM steps ORDER BY rowid'),
        }
    },

    put({ name, stepPath, scopeEntry }: { name: string, stepPath: string, scopeEntry: unknown }): void {
        if (isNil(statements)) {
            return
        }
        statements.put.run(name, stepPath, JSON.stringify(scopeEntry))
    },

    select({ name, stepPath, jsonPath }: { name: string, stepPath: string, jsonPath: string }): unknown {
        if (isNil(statements)) {
            return undefined
        }
        const row = statements.select.get(jsonPath, name, stepPath) as Record<string, unknown> | undefined
        return row ? Object.values(row)[0] : undefined
    },

    materialize({ name, stepPath }: { name: string, stepPath: string }): unknown {
        if (isNil(statements)) {
            return undefined
        }
        const row = statements.materialize.get(name, stepPath) as { output: string } | undefined
        return row ? JSON.parse(row.output) : undefined
    },

    getAtPath({ stepPath }: { stepPath: string }): Record<string, unknown> {
        if (isNil(statements)) {
            return {}
        }
        const rows = statements.getAtPath.all(stepPath) as Array<{ name: string, output: string }>
        const result: Record<string, unknown> = {}
        for (const row of rows) {
            result[row.name] = JSON.parse(row.output)
        }
        return result
    },

    allRows(): Array<{ name: string, stepPath: string, output: unknown }> {
        if (isNil(statements)) {
            return []
        }
        const rows = statements.allRows.all() as Array<{ name: string, path: string, output: string }>
        return rows.map(r => ({
            name: r.name,
            stepPath: r.path,
            output: JSON.parse(r.output),
        }))
    },

    isInitialized(): boolean {
        return !isNil(db) && !isNil(statements)
    },

    dispose(): void {
        if (isNil(db) || isNil(dbPath)) {
            return
        }
        try {
            db.close()
        }
        catch {
            // ignore close errors
        }
        db = null
        statements = null
        try {
            fs.unlinkSync(dbPath)
        }
        catch {
            // ignore — file may already be gone
        }
        dbPath = null
    },
}

function getBasePath(flowVersionId: string): string {
    const executionMode = process.env.AP_EXECUTION_MODE as ExecutionMode | undefined
    const isSandboxed = executionMode === ExecutionMode.SANDBOX_PROCESS || executionMode === ExecutionMode.SANDBOX_CODE_AND_PROCESS
    const base = isSandboxed ? os.tmpdir() : process.env.AP_FLOWS_CACHE_PATH!
    return path.join(base, flowVersionId)
}
