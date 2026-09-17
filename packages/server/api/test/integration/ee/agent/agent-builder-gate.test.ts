import { AgentRunSource, ErrorCode } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const AGENT_TOOL = 'ap_add_agent_tool'
const OTHER_AGENTS_TOOL = 'ap_create_agent'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function refusalFor({ source, toolName = AGENT_TOOL }: { source: AgentRunSource, toolName?: string }): Promise<string> {
    const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
    try {
        await agentRpcHandlers(app.log).executeAgentTool({
            toolName,
            toolInput: {},
            source,
            conversationId: 'does-not-exist',
            platformId: ctx.platform.id,
            userId: ctx.user.id,
        })
        return ''
    }
    catch (error) {
        const params = (error as { error?: { code?: string, params?: { message?: string } } }).error
        return `${params?.code ?? ''} ${params?.params?.message ?? ''}`
    }
}

describe('which surfaces the server will run an agent tool for', () => {
    // The worker lists these tools for the builder, so the server refusing them is the mistake this
    // feature has made four times: a surface handed tools its own backend then rejects.
    it('does not turn the builder away from the tools its policy lists', async () => {
        const refusal = await refusalFor({ source: AgentRunSource.AGENT_BUILDER })

        expect(refusal).not.toContain('only available to chat runs')
    })

    it('does not turn an agent away from rewriting itself', async () => {
        const refusal = await refusalFor({ source: AgentRunSource.AGENT })

        expect(refusal).not.toContain('only available to chat runs')
    })

    it('still turns a surface away from the tools that reach other agents', async () => {
        const refusal = await refusalFor({ source: AgentRunSource.AGENT, toolName: OTHER_AGENTS_TOOL })

        expect(refusal).toContain(ErrorCode.AUTHORIZATION)
        expect(refusal).toContain('only available to chat runs')
    })

    it('still turns an unattended run away from every one of them', async () => {
        const refusal = await refusalFor({ source: AgentRunSource.FLOW_STEP })

        expect(refusal).toContain(ErrorCode.AUTHORIZATION)
        expect(refusal).toContain('only available to chat runs')
    })
})
