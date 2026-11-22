import { AppConnection, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createMockConnection } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let previousEnvironment: string | undefined

beforeAll(async () => {
    app = await setupTestEnvironment()
    previousEnvironment = process.env['AP_ENVIRONMENT']
    process.env['AP_ENVIRONMENT'] = 'dev'
})

afterAll(async () => {
    process.env['AP_ENVIRONMENT'] = previousEnvironment
    await teardownTestEnvironment()
})

describe('eval workspace', () => {
    it('creates an isolated project that shares the base connections, then deletes it', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
        const connection = await saveConnection({ ctx })

        const created = await evalRequest({ method: 'POST', url: '/api/v1/agents/eval/workspace', body: { baseProjectId: ctx.project.id } })
        expect(created.statusCode).toBe(StatusCodes.OK)
        const body = created.json()
        expect(body.mcpServerUrl).toEqual(expect.any(String))
        expect(body.mcpToken).toEqual(expect.any(String))
        expect(body.conversationId).toEqual(expect.any(String))
        expect(body.projectId).not.toBe(ctx.project.id)
        expect(body.projectName).toMatch(/^eval-/)

        const project = await db.findOneBy<Project>('project', { id: body.projectId })
        expect(project?.platformId).toBe(ctx.platform.id)
        const shared = await db.findOneByOrFail<AppConnection>('app_connection', { id: connection.id })
        expect(shared.projectIds).toEqual([ctx.project.id, body.projectId])

        const deleted = await evalRequest({ method: 'DELETE', url: `/api/v1/agents/eval/workspace/${body.projectId}` })
        expect(deleted.statusCode).toBe(StatusCodes.NO_CONTENT)

        const gone = await db.findOneBy<Project>('project', { id: body.projectId })
        expect(gone).toBeNull()
        const restored = await db.findOneByOrFail<AppConnection>('app_connection', { id: connection.id })
        expect(restored.projectIds).toEqual([ctx.project.id])
    })

    it('refuses to delete a project the eval workspace endpoint did not create', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })

        const response = await evalRequest({ method: 'DELETE', url: `/api/v1/agents/eval/workspace/${ctx.project.id}` })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        const project = await db.findOneBy<Project>('project', { id: ctx.project.id })
        expect(project?.deleted).toBeNull()
    })

    it('rejects a base project outside the eval platform', async () => {
        await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })

        const response = await evalRequest({ method: 'POST', url: '/api/v1/agents/eval/workspace', body: { baseProjectId: 'missing-project-id' } })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

async function saveConnection({ ctx }: { ctx: TestContext }): Promise<AppConnection> {
    const connection = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id] }, ctx.user.id)
    await db.save('app_connection', { ...connection, value: await encryptUtils.encryptObject(connection.value) })
    return connection
}

function evalRequest({ method, url, body }: { method: 'POST' | 'DELETE', url: string, body?: Record<string, unknown> }): ReturnType<FastifyInstance['inject']> {
    return app.inject({
        method,
        url,
        headers: { 'api-key': process.env['AP_API_KEY'] ?? '' },
        ...(body ? { body } : {}),
    })
}
