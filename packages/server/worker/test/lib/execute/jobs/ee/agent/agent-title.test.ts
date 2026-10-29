import { describe, expect, it } from 'vitest'
import { agentTitle } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-title'

describe('agentTitle.finalize', () => {
    it('strips markdown and quotes from a generated title', () => {
        expect(agentTitle.finalize('"**Failing Flow Audit**"')).toBe('Failing Flow Audit')
    })

    it('caps the title at 100 characters', () => {
        expect(agentTitle.finalize('x'.repeat(150))).toHaveLength(100)
    })
})
