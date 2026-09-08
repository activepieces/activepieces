import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
const workflowPath = join(repoRoot, '.github/workflows/agent-evals.yml')

const GATED_SURFACES = [
    'packages/server/worker/src/lib/execute/jobs/ee/agent',
    'packages/server/worker/test/lib/agent-eval',
    'packages/server/api/src/app/ee/agent',
    'packages/server/api/src/assets/prompts',
    'packages/core/shared/src/lib/ee/agent',
    'packages/server/utils/src/agent-ai-utils.ts',
    'packages/server/utils/src/agent-provider-options.ts',
    'packages/core/piece-types/src/lib/ai-providers.ts',
]

describe('the agent eval gate covers the code it is meant to guard', () => {
    it('finds the workflow it is asserting about', () => {
        expect(existsSync(workflowPath), workflowPath).toBe(true)
    })

    it('names only paths that still exist, so a rename cannot quietly disable the gate', () => {
        for (const surface of GATED_SURFACES) {
            expect(existsSync(join(repoRoot, surface)), `${surface} no longer exists; update it here and in agent-evals.yml`).toBe(true)
        }
    })

    it('triggers on every one of them', () => {
        const workflow = readFileSync(workflowPath, 'utf8')
        const triggers = workflow.slice(workflow.indexOf('pull_request:'), workflow.indexOf('schedule:'))
        for (const surface of GATED_SURFACES) {
            expect(triggers, `agent-evals.yml does not run for changes under ${surface}`).toContain(surface)
        }
    })
})
