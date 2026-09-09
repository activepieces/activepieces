import { describe, expect, it } from 'vitest'
import { LONG_RUNNING_RPC_METHODS } from '../../src/lib/workers/worker-contract'

describe('which RPC methods are given the long deadline', () => {
    it.each(['executePieceTool', 'executeFlowTool', 'executeKnowledgeBaseTool', 'executeAgentTool'])('gives %s the long deadline', (method) => {
        expect(LONG_RUNNING_RPC_METHODS).toContain(method)
    })
})
