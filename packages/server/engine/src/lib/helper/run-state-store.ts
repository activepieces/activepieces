import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { isNil } from '@activepieces/core-utils'
import { ExecutionMode, StepOutput } from '@activepieces/shared'
import { DatabaseSync, StatementSync } from 'node:sqlite'

type PreparedStatements = {
    put: StatementSync
    getStepOutput: StatementSync
    getStepSize: StatementSync
}

let db: DatabaseSync | null = null
let dbPath: string | null = null
let statements: PreparedStatements | null = null

export const runStateStore = {
    init({ runId, flowVersionId }: { runId: string, flowVersionId: string }): void {
        runStateStore.dispose()
        try {
            const base = getBasePath(flowVersionId)
            fs.mkdirSync(base, { recursive: true })
            const filePath = path.join(base, `${runId}.sqlite`)
            fs.rmSync(filePath, { force: true })
            db = new DatabaseSync(filePath)
            db.exec(`
                CREATE TABLE steps (
                    name       TEXT    NOT NULL,
                    path       TEXT    NOT NULL,
                    output     BLOB    NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    PRIMARY KEY (name, path)
                )
            `)
            statements = {
                put: db.prepare('INSERT OR REPLACE INTO steps (name, path, output, size_bytes) VALUES (?, ?, jsonb(?), ?)'),
                getStepOutput: db.prepare('SELECT json(output) AS output FROM steps WHERE name = ? AND path = ?'),
                getStepSize: db.prepare('SELECT size_bytes FROM steps WHERE name = ? AND path = ?'),
            }
            dbPath = filePath
        }
        catch {
            try {
                db?.close()
            }
            catch {
                // ignore close errors
            }
            db = null
            statements = null
            dbPath = null
        }
    },

    put({ name, stepPath, stepOutput, sizeBytes }: { name: string, stepPath: string, stepOutput: unknown, sizeBytes: number }): void {
        if (isNil(statements)) {
            return
        }
        statements.put.run(name, stepPath, JSON.stringify(stepOutput), sizeBytes)
    },

    getStepOutput({ name, stepPath }: { name: string, stepPath: string }): StepOutput | undefined {
        if (isNil(statements)) {
            return undefined
        }
        const row = statements.getStepOutput.get(name, stepPath) as { output: string } | undefined
        return row ? JSON.parse(row.output) : undefined
    },

    getStepSize({ name, stepPath }: { name: string, stepPath: string }): number | undefined {
        if (isNil(statements)) {
            return undefined
        }
        const row = statements.getStepSize.get(name, stepPath) as { size_bytes: number } | undefined
        return row?.size_bytes
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
