import { AIProviderName, apId } from '@activepieces/core-utils'
import { AIProviderModelType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProject, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const AI_MODELS_TOOL = 'ap_list_ai_models'
const SCOPED_PROVIDER = AIProviderName.VERTEX

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function connectAs({ ctx }: { ctx: TestContext }): Promise<McpClient> {
    return mcpClientHelpers.connect({
        app,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
    })
}

function call({ mcpClient, name, args }: { mcpClient: McpClient, name: string, args?: Record<string, unknown> }): Promise<string> {
    return mcpClientHelpers.callTool({ app, mcpClient, name, args })
}

function selectProject({ mcpClient, projectId }: { mcpClient: McpClient, projectId: string }): Promise<string> {
    return call({ mcpClient, name: 'ap_set_project_context', args: { projectId } })
}

async function saveScopedProvider({ platformId, projectScope, projectIds }: {
    platformId: string
    projectScope: 'all' | 'selected' | 'except'
    projectIds: string[]
}): Promise<void> {
    await mockAndSaveAIProvider({
        platformId,
        displayName: `vertex-${apId()}`,
        provider: SCOPED_PROVIDER,
        config: {
            project: 'test-project',
            region: 'us-central1',
            models: [{ modelId: 'gemini-test', modelName: 'Gemini Test', modelType: AIProviderModelType.TEXT }],
        },
        projectScope,
        projectIds,
    })
}

describe('ap_list_ai_models on the platform MCP server', () => {
    it('asks for a project instead of answering against the platform id', async () => {
        const ctx = await createTestContext(app)
        await saveScopedProvider({ platformId: ctx.platform.id, projectScope: 'all', projectIds: [] })
        const mcpClient = await connectAs({ ctx })

        const answer = await call({ mcpClient, name: AI_MODELS_TOOL })

        expect(answer).toContain('No project selected')
        expect(answer).not.toContain(SCOPED_PROVIDER)
    })

    it('stays in the tool list, because the project is chosen after connecting', async () => {
        const ctx = await createTestContext(app)
        const mcpClient = await connectAs({ ctx })

        const toolNames = await mcpClientHelpers.listToolNames({ app, mcpClient })

        expect(toolNames).toContain(AI_MODELS_TOOL)
    })

    it('hides a provider the selected project is excluded from', async () => {
        const ctx = await createTestContext(app)
        await saveScopedProvider({ platformId: ctx.platform.id, projectScope: 'except', projectIds: [ctx.project.id] })
        const mcpClient = await connectAs({ ctx })
        await selectProject({ mcpClient, projectId: ctx.project.id })

        const answer = await call({ mcpClient, name: AI_MODELS_TOOL })

        expect(answer).not.toContain(SCOPED_PROVIDER)
    })

    it('shows a provider scoped to the selected project alone', async () => {
        const ctx = await createTestContext(app)
        await saveScopedProvider({ platformId: ctx.platform.id, projectScope: 'selected', projectIds: [ctx.project.id] })
        const mcpClient = await connectAs({ ctx })
        await selectProject({ mcpClient, projectId: ctx.project.id })

        const answer = await call({ mcpClient, name: AI_MODELS_TOOL })

        expect(answer).toContain(SCOPED_PROVIDER)
    })

    it('follows the selection when it moves to a project the provider excludes', async () => {
        const ctx = await createTestContext(app)
        const sibling = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            displayName: `project-${apId()}`,
        })
        await db.save('project', sibling)
        await saveScopedProvider({ platformId: ctx.platform.id, projectScope: 'selected', projectIds: [sibling.id] })
        const mcpClient = await connectAs({ ctx })

        await selectProject({ mcpClient, projectId: sibling.id })
        expect(await call({ mcpClient, name: AI_MODELS_TOOL })).toContain(SCOPED_PROVIDER)

        await selectProject({ mcpClient, projectId: ctx.project.id })
        expect(await call({ mcpClient, name: AI_MODELS_TOOL })).not.toContain(SCOPED_PROVIDER)
    })
})
