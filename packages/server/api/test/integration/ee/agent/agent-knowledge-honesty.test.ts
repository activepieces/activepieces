import { AgentRunSource, apId, FileCompression, FileType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'
import { db } from '../../../helpers/db'
import { createMockFile } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function conversationWithFile(ctx: TestContext): Promise<{ conversationId: string, knowledgeBaseFileId: string }> {
    const conversationId = apId()
    await db.save('agent_conversation', {
        id: conversationId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        userId: ctx.user.id,
        source: AgentRunSource.AGENT,
        status: 'STREAMING',
        messages: [],
        uiMessages: [],
    })
    const file = createMockFile({
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        data: Buffer.from('The office closes at six.'),
        type: FileType.KNOWLEDGE_BASE,
        compression: FileCompression.NONE,
        fileName: 'handbook.txt',
    })
    await db.save('file', file)
    const fileId = file.id
    const kbFile = await knowledgeBaseService(app.log).createFile({
        projectId: ctx.project.id,
        fileId,
        displayName: 'Employee Handbook',
    })
    return { conversationId, knowledgeBaseFileId: kbFile.id }
}

async function search({ conversationId, knowledgeBaseFileId }: { conversationId: string, knowledgeBaseFileId: string }) {
    return agentRpcHandlers(app.log).executeKnowledgeBaseTool({
        conversationId,
        toolName: 'knowledge-employee-handbook',
        knowledgeBaseFileId,
        query: 'when does the office close',
    })
}

describe('an agent asked about a file it cannot search says so', () => {
    // The old answer was "No relevant information found", which the agent passed on as the document
    // not mentioning the thing. It had not read a word of it.
    it('says the file is not indexed rather than reporting the answer is absent', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const target = await conversationWithFile(ctx)

        const { result } = await search(target)

        expect(String(result)).toContain('never been indexed')
        expect(String(result)).toContain('Employee Handbook')
        expect(String(result)).not.toContain('No relevant information found')
    })

    it('does not send the person off to re-upload, which would not index it either', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const target = await conversationWithFile(ctx)

        const { result } = await search(target)

        expect(String(result)).toContain('will not index it either')
    })

    it('does not read a file belonging to another project', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const other = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const mine = await conversationWithFile(ctx)
        const theirs = await conversationWithFile(other)

        await expect(search({ conversationId: mine.conversationId, knowledgeBaseFileId: theirs.knowledgeBaseFileId })).rejects.toThrow()
    })
})
