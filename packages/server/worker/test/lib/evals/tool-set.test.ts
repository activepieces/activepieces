import { describe, expect, it } from 'vitest'
import { replay } from './replay'
import { evalToolSet } from './tool-set'

describe('evalToolSet.build', () => {
    it('offers ap_set_build_plan to the agent', () => {
        const tools = evalToolSet.build({
            mcp: { toolSet: {}, close: async () => {}, projectName: 'Eval project', conversationId: 'eval-conversation' },
            caseReplay: replay.create({ recordedToolCalls: [] }),
            auth: {},
            mode: 'replay',
            user: null,
        })
        expect(tools['ap_set_build_plan']?.execute).toBeDefined()
        expect(tools).not.toHaveProperty('onFlowToolResult')
    })
})
