import { AppConnection, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockProject } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const WORKSPACE_URL = '/api/v1/agents/eval/workspace'

let app: FastifyInstance
let previousEnvironment: string | undefined
let contextsCreated = 0

beforeAll(async () => {
    app = await setupTestEnvironment()
})

beforeEach(() => {
    previousEnvironment = process.env['AP_ENVIRONMENT']
    process.env['AP_ENVIRONMENT'] = 'dev'
})

afterEach(() => {
    if (previousEnvironment === undefined) {
        delete process.env['AP_ENVIRONMENT']
    }
    else {
        process.env['AP_ENVIRONMENT'] = previousEnvironment
    }
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('eval workspace', () => {
    it('creates an isolated project that shares the base connections, then deletes it', async () => {
        const ctx = await context()
        const connection = await saveConnection({ ctx })

        const created = await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })
        expect(created.statusCode).toBe(StatusCodes.OK)
        const body = created.json()
        expect(body.mcpServerUrl).toEqual(expect.any(String))
        expect(body.mcpToken).toEqual(expect.any(String))
        expect(body.conversationId).toEqual(expect.any(String))
        expect(body.projectId).not.toBe(ctx.project.id)
        expect(body.projectName).toMatch(/^eval-/)

        const project = await findProject(body.projectId)
        expect(project?.platformId).toBe(ctx.platform.id)
        expect(project?.metadata?.['sharedConnectionIds']).toEqual([connection.id])
        expect(await connectionProjectIds(connection.id)).toEqual([ctx.project.id, body.projectId])

        const deleted = await evalRequest({ method: 'DELETE', url: `${WORKSPACE_URL}/${body.projectId}` })
        expect(deleted.statusCode).toBe(StatusCodes.NO_CONTENT)

        const gone = await findProject(body.projectId)
        expect(gone?.deleted).not.toBeNull()
        expect(await connectionProjectIds(connection.id)).toEqual([ctx.project.id])
    })

    it('records only the connections it shared', async () => {
        const ctx = await context()
        const unrelated = await saveConnection({ ctx, projectIds: ['other-project-id'] })
        const shared = await saveConnection({ ctx })

        const created = await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })
        const { projectId } = created.json()
        const project = await findProject(projectId)

        expect(project?.metadata?.['sharedConnectionIds']).toEqual([shared.id])
        expect(await connectionProjectIds(unrelated.id)).toEqual(['other-project-id'])
    })

    it('sweeps stale eval workspaces when creating a new one', async () => {
        const ctx = await context()
        const connection = await saveConnection({ ctx })
        const first = (await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })).json()
        await db.update('project', first.projectId, { created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() })

        const second = (await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })).json()

        expect((await findProject(first.projectId))?.deleted).not.toBeNull()
        expect((await findProject(second.projectId))?.deleted).toBeNull()
        expect(await connectionProjectIds(connection.id)).toEqual([ctx.project.id, second.projectId])
    })

    it('sweeps at most a bounded batch of the oldest stale workspaces per create', async () => {
        const ctx = await context()
        const stale = Array.from({ length: 21 }, (_, index) => createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            displayName: `eval-stale${index}`,
            metadata: { evalWorkspace: true, sharedConnectionIds: [] },
            created: new Date(Date.now() - (3 * 60 * 60 * 1000) + index * 1000).toISOString(),
        }))
        await db.save('project', stale)

        const created = await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })
        expect(created.statusCode).toBe(StatusCodes.OK)

        const remaining = await Promise.all(stale.map((project) => findProject(project.id)))
        expect(remaining.slice(0, 20).every((project) => project?.deleted !== null)).toBe(true)
        expect(remaining[20]?.deleted).toBeNull()
    })

    it('leaves nothing behind when creating a workspace fails midway', async () => {
        const ctx = await context()
        const connection = await saveConnection({ ctx })
        await withFailingUpdates({ table: 'app_connection' }, async () => {
            const response = await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })
            expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        })

        const evalProjects = await databaseConnection().getRepository<Project>('project').createQueryBuilder('project')
            .where('project."platformId" = :platformId', { platformId: ctx.platform.id })
            .andWhere('project."displayName" LIKE \'eval-%\'')
            .withDeleted()
            .getCount()
        expect(evalProjects).toBe(0)
        expect(await connectionProjectIds(connection.id)).toEqual([ctx.project.id])
    })

    it('keeps the connections shared when deleting a workspace fails midway', async () => {
        const ctx = await context()
        const connection = await saveConnection({ ctx })
        const { projectId } = (await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })).json()

        await withFailingUpdates({ table: 'project' }, async () => {
            const response = await evalRequest({ method: 'DELETE', url: `${WORKSPACE_URL}/${projectId}` })
            expect(response.statusCode).toBeGreaterThanOrEqual(StatusCodes.INTERNAL_SERVER_ERROR)
        })

        expect((await findProject(projectId))?.deleted).toBeNull()
        expect(await connectionProjectIds(connection.id)).toEqual([ctx.project.id, projectId])
    })

    it('refuses to delete a project the eval workspace endpoint did not create', async () => {
        const ctx = await context()

        const response = await evalRequest({ method: 'DELETE', url: `${WORKSPACE_URL}/${ctx.project.id}` })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect((await findProject(ctx.project.id))?.deleted).toBeNull()
    })

    it('rejects a base project outside the eval platform', async () => {
        await context()

        const response = await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: 'missing-project-id' } })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('answers 404 outside the dev environment', async () => {
        const ctx = await context()
        process.env['AP_ENVIRONMENT'] = 'prod'

        const created = await evalRequest({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })
        const deleted = await evalRequest({ method: 'DELETE', url: `${WORKSPACE_URL}/${ctx.project.id}` })

        expect(created.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(deleted.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('forbids calls without the api key', async () => {
        const ctx = await context()

        const created = await app.inject({ method: 'POST', url: WORKSPACE_URL, body: { baseProjectId: ctx.project.id } })
        const deleted = await app.inject({ method: 'DELETE', url: `${WORKSPACE_URL}/${ctx.project.id}`, headers: { 'api-key': 'wrong-key' } })

        expect(created.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(deleted.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

async function context(): Promise<TestContext> {
    const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
    contextsCreated += 1
    await db.update('platform', ctx.platform.id, { created: new Date(Date.UTC(2000, 0, 1) - contextsCreated * 24 * 60 * 60 * 1000).toISOString() })
    return ctx
}

async function saveConnection({ ctx, projectIds }: { ctx: TestContext, projectIds?: string[] }): Promise<AppConnection> {
    const connection = createMockConnection({ platformId: ctx.platform.id, projectIds: projectIds ?? [ctx.project.id] }, ctx.user.id)
    await db.save('app_connection', { ...connection, value: await encryptUtils.encryptObject(connection.value) })
    return connection
}

async function findProject(id: string): Promise<Project | null> {
    return databaseConnection().getRepository<Project>('project').findOne({ where: { id }, withDeleted: true })
}

async function connectionProjectIds(id: string): Promise<string[]> {
    const connection = await db.findOneByOrFail<AppConnection>('app_connection', { id })
    return connection.projectIds
}

async function withFailingUpdates({ table }: { table: string }, run: () => Promise<void>): Promise<void> {
    const ds = databaseConnection()
    await ds.query('CREATE OR REPLACE FUNCTION eval_test_fail_update() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION \'forced failure\'; END; $$ LANGUAGE plpgsql')
    await ds.query(`CREATE TRIGGER eval_test_fail_update BEFORE UPDATE ON "${table}" FOR EACH ROW EXECUTE FUNCTION eval_test_fail_update()`)
    try {
        await run()
    }
    finally {
        await ds.query(`DROP TRIGGER eval_test_fail_update ON "${table}"`)
    }
}

function evalRequest({ method, url, body }: { method: 'POST' | 'DELETE', url: string, body?: Record<string, unknown> }): ReturnType<FastifyInstance['inject']> {
    return app.inject({
        method,
        url,
        headers: { 'api-key': process.env['AP_API_KEY'] ?? '' },
        ...(body ? { body } : {}),
    })
}
