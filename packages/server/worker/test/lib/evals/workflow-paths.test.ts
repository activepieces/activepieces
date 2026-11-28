import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
const workflowPath = join(repoRoot, '.github/workflows/agent-evals.yml')

describe('the chat evals workflow runs on the code it measures', () => {
    it('finds the workflow it is asserting about', () => {
        expect(existsSync(workflowPath), workflowPath).toBe(true)
    })

    it('names only paths that still exist, so a rename cannot quietly stop the baseline', () => {
        const declared = pushPathFilters()
        expect(declared.length).toBeGreaterThan(0)
        for (const filter of declared) {
            const target = join(repoRoot, filter.replace(/\/\*\*$/, ''))
            expect(existsSync(target), `${filter} no longer exists; update agent-evals.yml`).toBe(true)
        }
    })

    it('runs for the eval CLI and the agent code', () => {
        const declared = pushPathFilters()
        for (const filter of REQUIRED_FILTERS) {
            expect(declared, `agent-evals.yml does not run for changes matching ${filter}`).toContain(filter)
        }
    })
})

function pushPathFilters(): string[] {
    const lines = readFileSync(workflowPath, 'utf8').split('\n')
    const start = lines.findIndex((line) => line.trim() === 'push:')
    const pathsAt = lines.findIndex((line, index) => index > start && line.trim() === 'paths:')
    expect(start, 'agent-evals.yml has no push trigger').toBeGreaterThan(-1)
    expect(pathsAt, 'the push trigger declares no paths').toBeGreaterThan(start)
    const entries: string[] = []
    for (const line of lines.slice(pathsAt + 1)) {
        const entry = line.match(/^\s+-\s+(\S+)\s*$/)
        if (entry === null) {
            break
        }
        entries.push(entry[1])
    }
    return entries
}

const REQUIRED_FILTERS = [
    'packages/server/worker/src/lib/execute/jobs/ee/agent/**',
    'packages/server/worker/test/lib/evals/**',
    'packages/server/api/src/app/ee/agent/**',
    'packages/server/api/src/app/mcp/**',
    'packages/server/api/src/assets/prompts/**',
]
