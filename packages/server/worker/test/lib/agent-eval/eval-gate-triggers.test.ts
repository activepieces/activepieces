import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
const workflowPath = join(repoRoot, '.github/workflows/agent-evals.yml')

const GATED_FILTERS = [
    'packages/server/worker/src/lib/execute/jobs/ee/agent/**',
    'packages/server/worker/test/lib/agent-eval/**',
    'packages/server/api/src/app/ee/agent/**',
    'packages/server/api/src/assets/prompts/**',
    'packages/core/shared/src/lib/ee/agent/**',
    'packages/server/utils/src/agent-ai-utils.ts',
    'packages/server/utils/src/agent-provider-options.ts',
    'packages/core/piece-types/src/lib/ai-providers.ts',
]

const PACKAGES_UNDER_GATE = [
    '@activepieces/server-utils',
    '@activepieces/core-piece-types',
]

describe('the agent eval gate is wired to the code it gates', () => {
    it('finds the workflow it is asserting about', () => {
        expect(existsSync(workflowPath), workflowPath).toBe(true)
    })

    it('names only paths that still exist, so a rename cannot quietly disable the gate', () => {
        for (const filter of GATED_FILTERS) {
            const target = join(repoRoot, filter.replace(/\/\*\*$/, ''))
            expect(existsSync(target), `${filter} no longer exists; update it here and in agent-evals.yml`).toBe(true)
        }
    })

    it('declares each filter exactly, so narrowing one cannot slip past this test', () => {
        const declared = pullRequestPathFilters()
        for (const filter of GATED_FILTERS) {
            expect(declared, `agent-evals.yml does not run for changes matching ${filter}`).toContain(filter)
        }
    })

    it('runs the tests for every package it gates, so a gated file is not merely a trigger', () => {
        const commands = pullRequestGateCommands()
        for (const pkg of PACKAGES_UNDER_GATE) {
            expect(commands, `the pull-request gate triggers on ${pkg} but never runs its tests`).toContain(`--filter=${pkg}`)
        }
    })
})

function pullRequestPathFilters(): string[] {
    const lines = readFileSync(workflowPath, 'utf8').split('\n')
    const start = lines.findIndex((line) => line.trim() === 'pull_request:')
    const pathsAt = lines.findIndex((line, index) => index > start && line.trim() === 'paths:')
    expect(start, 'agent-evals.yml has no pull_request trigger').toBeGreaterThan(-1)
    expect(pathsAt, 'the pull_request trigger declares no paths').toBeGreaterThan(start)
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

function pullRequestGateCommands(): string {
    const lines = readFileSync(workflowPath, 'utf8').split('\n')
    const gateAt = lines.findIndex((line) => /^ {2}gate:\s*$/.test(line))
    expect(gateAt, 'agent-evals.yml has no gate job').toBeGreaterThan(-1)
    const nextJobAt = lines.findIndex((line, index) => index > gateAt && /^ {2}\S+:\s*$/.test(line))
    const gate = lines.slice(gateAt, nextJobAt === -1 ? lines.length : nextJobAt)
    return gate.filter((line) => !line.trim().startsWith('#')).join('\n')
}
