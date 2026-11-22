import { AgentRunSource, apId, SubagentTaskStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentTaskService } from '../../../../src/app/ee/agent/agent-task-service'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('agentTaskService', () => {
    it('starts a task, saves its result and resumes it with its history', async () => {
        const ctx = await createTestContext(app)
        const conversationId = await conversation(ctx)

        const started = await agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Build Save order' })
        await agentTaskService.finish({ platformId: ctx.platform.id, conversationId, taskId: started.taskId, claimId: started.claimId, status: SubagentTaskStatus.BLOCKED, messages: [{ role: 'user', content: 'build it' }], summary: 'Needs a Gmail connection.', artifacts: [{ type: 'flow', id: 'f1', name: 'Save order' }] })
        const resumed = await agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Build Save order', taskId: started.taskId })
        const tasks = await agentTaskService.list({ platformId: ctx.platform.id, conversationId })

        expect(started.messages).toEqual([])
        expect(resumed).toEqual({ taskId: started.taskId, claimId: expect.any(String), messages: [{ role: 'user', content: 'build it' }] })
        expect(resumed.claimId).not.toBe(started.claimId)
        expect(tasks).toEqual([{ id: started.taskId, title: 'Build Save order', status: SubagentTaskStatus.RUNNING, artifacts: [{ type: 'flow', id: 'f1', name: 'Save order' }] }])
    })

    it('refuses to resume a task that is still running', async () => {
        const ctx = await createTestContext(app)
        const conversationId = await conversation(ctx)
        const started = await agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Research' })

        await expect(agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Research', taskId: started.taskId })).rejects.toThrow()
    })

    it('never resumes or lists a task from another platform', async () => {
        const owner = await createTestContext(app)
        const other = await createTestContext(app)
        const conversationId = await conversation(owner)
        const started = await agentTaskService.begin({ platformId: owner.platform.id, conversationId, title: 'Private' })
        await agentTaskService.finish({ platformId: owner.platform.id, conversationId, taskId: started.taskId, claimId: started.claimId, status: SubagentTaskStatus.DONE, messages: [], summary: null, artifacts: [] })

        await expect(agentTaskService.begin({ platformId: other.platform.id, conversationId, title: 'Private', taskId: started.taskId })).rejects.toThrow()
        expect(await agentTaskService.list({ platformId: other.platform.id, conversationId })).toEqual([])
    })

    it('never lets an older run overwrite the run that claimed the task after it', async () => {
        const ctx = await createTestContext(app)
        const conversationId = await conversation(ctx)
        const first = await agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Research' })
        await db.update('agent_task', first.taskId, { updated: '2000-01-01T00:00:00.000Z' })
        const second = await agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Research', taskId: first.taskId })

        await agentTaskService.finish({ platformId: ctx.platform.id, conversationId, taskId: second.taskId, claimId: second.claimId, status: SubagentTaskStatus.DONE, messages: [{ role: 'user', content: 'new' }], summary: 'new result', artifacts: [] })
        await agentTaskService.finish({ platformId: ctx.platform.id, conversationId, taskId: first.taskId, claimId: first.claimId, status: SubagentTaskStatus.FAILED, messages: [{ role: 'user', content: 'old' }], summary: 'old result', artifacts: [] })
        const task = await db.findOneBy('agent_task', { id: first.taskId })

        expect(task).toMatchObject({ status: SubagentTaskStatus.DONE, summary: 'new result' })
    })

    it('deletes tasks with their conversation', async () => {
        const ctx = await createTestContext(app)
        const conversationId = await conversation(ctx)
        await agentTaskService.begin({ platformId: ctx.platform.id, conversationId, title: 'Doomed' })

        await db.delete('agent_conversation', conversationId)

        expect(await agentTaskService.list({ platformId: ctx.platform.id, conversationId })).toEqual([])
    })
})

async function conversation(ctx: TestContext): Promise<string> {
    const conversationId = apId()
    await db.save('agent_conversation', {
        id: conversationId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        source: AgentRunSource.CHAT,
        status: 'IDLE',
        messages: [],
        uiMessages: [],
    })
    return conversationId
}
