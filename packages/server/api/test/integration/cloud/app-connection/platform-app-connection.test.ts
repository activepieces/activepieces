import { AppConnection, AppConnectionScope, AppConnectionStatus, AppConnectionType, AppConnectionWithoutSensitiveData, DefaultProjectRole, FlowOperationStatus, FlowVersionState, MAX_APP_CONNECTION_FLOW_IDS, MAX_PLATFORM_APP_CONNECTION_FLOWS_LISTED, PlatformAppConnectionOwnersResponse, PlatformAppConnectionsListItem, PlatformAppConnectionsSummary, PlatformRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import {
    createMockConnection,
    createMockFlow,
    createMockFlowVersion,
    createMockProject,
    mockBasicUser,
} from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function saveConnection({ ctx, connection }: { ctx: TestContext, connection: Partial<AppConnection> }): Promise<AppConnection> {
    const mock = {
        ...createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], ...connection }, connection.ownerId ?? ctx.user.id),
        scope: connection.scope ?? AppConnectionScope.PROJECT,
        status: connection.status ?? AppConnectionStatus.ACTIVE,
    }
    await db.save('app_connection', {
        ...mock,
        value: await encryptUtils.encryptObject({ type: AppConnectionType.SECRET_TEXT, secret_text: 'secret' }),
    })
    return mock
}

async function saveFlowUsing({ projectId, externalId, displayName }: { projectId: string, externalId: string, displayName: string }): Promise<string> {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)
    await db.save('flow_version', createMockFlowVersion({
        flowId: flow.id,
        displayName,
        state: FlowVersionState.DRAFT,
        connectionIds: [externalId],
    }))
    return flow.id
}

describe('Platform AppConnections API', () => {
    describe('List endpoint', () => {
        it('names the flows using each connection, only from its own projects', async () => {
            const ctx = await createTestContext(app!)
            const otherProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id })
            await db.save('project', otherProject)

            const sharedExternalId = 'shared-external-id'
            const here = await saveConnection({ ctx, connection: { externalId: sharedExternalId } })
            const there = await saveConnection({ ctx, connection: { externalId: sharedExternalId, projectIds: [otherProject.id] } })
            const flowId = await saveFlowUsing({ projectId: ctx.project.id, externalId: sharedExternalId, displayName: 'Sync leads' })

            const response = await ctx.get('/v1/platform-app-connections')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const rows: PlatformAppConnectionsListItem[] = response?.json().data
            const hereRow = rows.find((row) => row.id === here.id)
            const thereRow = rows.find((row) => row.id === there.id)
            expect(hereRow?.flows).toEqual([{ id: flowId, displayName: 'Sync leads', projectId: ctx.project.id }])
            expect(hereRow?.flowIds).toEqual([flowId])
            expect(thereRow?.flows).toEqual([])
            expect(thereRow?.flowIds).toEqual([])
        })

        it('credits a global connection with flows from every project it is granted to', async () => {
            const ctx = await createTestContext(app!)
            const otherProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id })
            await db.save('project', otherProject)

            const global = await saveConnection({
                ctx,
                connection: { scope: AppConnectionScope.PLATFORM, projectIds: [ctx.project.id, otherProject.id] },
            })
            const first = await saveFlowUsing({ projectId: ctx.project.id, externalId: global.externalId, displayName: 'First' })
            const second = await saveFlowUsing({ projectId: otherProject.id, externalId: global.externalId, displayName: 'Second' })

            const response = await ctx.get('/v1/platform-app-connections', { scope: AppConnectionScope.PLATFORM })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const [row]: PlatformAppConnectionsListItem[] = response?.json().data
            expect(row.flows.map((flow) => flow.id).sort()).toEqual([first, second].sort())
            expect(row.flowCount).toBe(2)
        })

        it('names the first flows by name, up to the cap, and counts every flow', async () => {
            const ctx = await createTestContext(app!)
            const connection = await saveConnection({ ctx, connection: {} })
            const total = MAX_PLATFORM_APP_CONNECTION_FLOWS_LISTED + 2
            const names = Array.from({ length: total }, (_, index) => `Flow ${String(index + 1).padStart(2, '0')}`)
            for (const displayName of [...names].reverse()) {
                await saveFlowUsing({ projectId: ctx.project.id, externalId: connection.externalId, displayName })
            }

            const response = await ctx.get('/v1/platform-app-connections')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const [row]: PlatformAppConnectionsListItem[] = response?.json().data
            expect(row.flowCount).toBe(total)
            expect(row.flows.map((flow) => flow.displayName)).toEqual(names.slice(0, MAX_PLATFORM_APP_CONNECTION_FLOWS_LISTED))
            expect(row.flowIds).toHaveLength(total)
        })

        it('lists flow ids up to the cap on every route, while flowCount counts them all', async () => {
            const ctx = await createTestContext(app!)
            const connection = await saveConnection({ ctx, connection: {} })
            const total = MAX_APP_CONNECTION_FLOW_IDS + 1
            const flows = Array.from({ length: total }, () => createMockFlow({ projectId: ctx.project.id }))
            await db.save('flow', flows)
            await db.save('flow_version', flows.map((flow, index) => createMockFlowVersion({
                flowId: flow.id,
                displayName: `Flow ${String(index).padStart(3, '0')}`,
                state: FlowVersionState.DRAFT,
                connectionIds: [connection.externalId],
            })))

            const platformList = await ctx.get('/v1/platform-app-connections')
            const projectList = await ctx.get('/v1/app-connections', { projectId: ctx.project.id })
            const one = await ctx.get(`/v1/app-connections/${connection.id}`)

            const [row]: PlatformAppConnectionsListItem[] = platformList?.json().data
            expect(row.flowCount).toBe(total)
            expect(row.flowIds).toHaveLength(MAX_APP_CONNECTION_FLOW_IDS)
            const projectRows: AppConnectionWithoutSensitiveData[] = projectList?.json().data
            expect(projectRows.find((projectRow) => projectRow.id === connection.id)?.flowIds).toHaveLength(MAX_APP_CONNECTION_FLOW_IDS)
            expect(one?.json().flowIds).toHaveLength(MAX_APP_CONNECTION_FLOW_IDS)
        })

        it('leaves out project connections of a deleted project, but not global ones', async () => {
            const ctx = await createTestContext(app!)
            const deletedProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, deleted: '2026-03-01T00:00:00.000Z' })
            await db.save('project', deletedProject)
            const live = await saveConnection({ ctx, connection: {} })
            await saveConnection({ ctx, connection: { projectIds: [deletedProject.id] } })
            const global = await saveConnection({ ctx, connection: { scope: AppConnectionScope.PLATFORM, projectIds: [deletedProject.id] } })

            const response = await ctx.get('/v1/platform-app-connections')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const rows: PlatformAppConnectionsListItem[] = response?.json().data
            expect(rows.map((row) => row.id).sort()).toEqual([live.id, global.id].sort())
        })

        it('leaves owners whose only connections are in a deleted project out of the owner filter', async () => {
            const ctx = await createTestContext(app!)
            const deletedProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, deleted: '2026-03-01T00:00:00.000Z' })
            await db.save('project', deletedProject)
            const { mockUser: gone } = await mockBasicUser({ user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER } })
            await saveConnection({ ctx, connection: {} })
            await saveConnection({ ctx, connection: { projectIds: [deletedProject.id], ownerId: gone.id } })

            const response = await ctx.get('/v1/platform-app-connections/owners')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const owners: PlatformAppConnectionOwnersResponse = response?.json()
            expect(owners.data.map((owner) => owner.id)).toEqual([ctx.user.id])
        })
    })

    describe('Project routes', () => {
        it('count the flows of every project a global connection is granted to, whichever project asks', async () => {
            const ctx = await createTestContext(app!)
            const otherProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id })
            await db.save('project', otherProject)
            const global = await saveConnection({
                ctx,
                connection: { scope: AppConnectionScope.PLATFORM, projectIds: [ctx.project.id, otherProject.id] },
            })
            const here = await saveFlowUsing({ projectId: ctx.project.id, externalId: global.externalId, displayName: 'Here' })
            const there = await saveFlowUsing({ projectId: otherProject.id, externalId: global.externalId, displayName: 'There' })

            const list = await ctx.get('/v1/app-connections', { projectId: otherProject.id })
            const one = await ctx.get(`/v1/app-connections/${global.id}`)

            expect(list?.statusCode).toBe(StatusCodes.OK)
            const rows: AppConnectionWithoutSensitiveData[] = list?.json().data
            expect([...(rows.find((row) => row.id === global.id)?.flowIds ?? [])].sort()).toEqual([here, there].sort())
            expect(one?.statusCode).toBe(StatusCodes.OK)
            expect([...one?.json().flowIds].sort()).toEqual([here, there].sort())
        })
    })

    describe('Deleting a project connection', () => {
        it('lets a platform admin delete one in a project they are not a member of', async () => {
            const ctx = await createTestContext(app!)
            const { mockUser: owner } = await mockBasicUser({ user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER } })
            const theirProject = createMockProject({ platformId: ctx.platform.id, ownerId: owner.id })
            await db.save('project', theirProject)
            const connection = await saveConnection({ ctx, connection: { projectIds: [theirProject.id] } })

            const response = await ctx.delete(`/v1/app-connections/${connection.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(await db.findOneBy('app_connection', { id: connection.id })).toBeNull()
        })
    })

    describe('List endpoint published versions', () => {
        it('counts a published flow whose newer draft moved to another connection', async () => {
            const ctx = await createTestContext(app!)
            const live = await saveConnection({ ctx, connection: { displayName: 'live-connection' } })
            const replacement = await saveConnection({ ctx, connection: { displayName: 'replacement-connection' } })
            const flow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', flow)
            const published = createMockFlowVersion({
                flowId: flow.id,
                displayName: 'Invoice chaser',
                state: FlowVersionState.LOCKED,
                connectionIds: [live.externalId],
                created: '2026-01-01T00:00:00.000Z',
            })
            const draft = createMockFlowVersion({
                flowId: flow.id,
                displayName: 'Invoice chaser v2',
                state: FlowVersionState.DRAFT,
                connectionIds: [replacement.externalId],
                created: '2026-02-01T00:00:00.000Z',
            })
            await db.save('flow_version', [published, draft])
            await db.save('flow', { ...flow, publishedVersionId: published.id })

            const response = await ctx.get('/v1/platform-app-connections')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const rows: PlatformAppConnectionsListItem[] = response?.json().data
            const expected = [{ id: flow.id, displayName: 'Invoice chaser v2', projectId: ctx.project.id }]
            expect(rows.find((row) => row.id === live.id)?.flows).toEqual(expected)
            expect(rows.find((row) => row.id === replacement.id)?.flows).toEqual(expected)

            const liveOnly = await ctx.get('/v1/platform-app-connections', { displayName: 'live-connection' })
            const [liveRow]: PlatformAppConnectionsListItem[] = liveOnly?.json().data
            expect(liveRow.flows).toEqual(expected)
            expect(liveRow.flowCount).toBe(1)
            expect(liveRow.flowIds).toEqual([])

            const projectList = await ctx.get('/v1/app-connections', { projectId: ctx.project.id })
            expect(projectList?.statusCode).toBe(StatusCodes.OK)
            const projectRows: AppConnectionWithoutSensitiveData[] = projectList?.json().data
            expect(projectRows.find((row) => row.id === live.id)?.flowIds).toEqual([])
            expect(projectRows.find((row) => row.id === replacement.id)?.flowIds).toEqual([flow.id])
        })

        it('leaves out flows being deleted and flows in deleted projects', async () => {
            const ctx = await createTestContext(app!)
            const deletedProject = createMockProject({
                platformId: ctx.platform.id,
                ownerId: ctx.user.id,
                deleted: '2026-03-01T00:00:00.000Z',
            })
            await db.save('project', deletedProject)
            const global = await saveConnection({
                ctx,
                connection: { scope: AppConnectionScope.PLATFORM, projectIds: [ctx.project.id, deletedProject.id] },
            })
            const deleting = createMockFlow({ projectId: ctx.project.id, operationStatus: FlowOperationStatus.DELETING })
            await db.save('flow', deleting)
            await db.save('flow_version', createMockFlowVersion({
                flowId: deleting.id,
                state: FlowVersionState.DRAFT,
                connectionIds: [global.externalId],
            }))
            await saveFlowUsing({ projectId: deletedProject.id, externalId: global.externalId, displayName: 'Gone' })

            const response = await ctx.get('/v1/platform-app-connections', { scope: AppConnectionScope.PLATFORM })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const [row]: PlatformAppConnectionsListItem[] = response?.json().data
            expect(row.flows).toEqual([])
            expect(row.flowIds).toEqual([])
        })

        it('ignores versions that are neither the latest nor the published one', async () => {
            const ctx = await createTestContext(app!)
            const retired = await saveConnection({ ctx, connection: {} })
            const flow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', flow)
            await db.save('flow_version', [
                createMockFlowVersion({
                    flowId: flow.id,
                    state: FlowVersionState.LOCKED,
                    connectionIds: [retired.externalId],
                    created: '2026-01-01T00:00:00.000Z',
                }),
                createMockFlowVersion({
                    flowId: flow.id,
                    state: FlowVersionState.DRAFT,
                    connectionIds: [],
                    created: '2026-02-01T00:00:00.000Z',
                }),
            ])

            const response = await ctx.get('/v1/platform-app-connections')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const rows: PlatformAppConnectionsListItem[] = response?.json().data
            expect(rows.find((row) => row.id === retired.id)?.flows).toEqual([])
        })
    })

    describe('List endpoint piece filter', () => {
        it('matches any of several pieces', async () => {
            const ctx = await createTestContext(app!)
            const slack = await saveConnection({ ctx, connection: { pieceName: '@activepieces/piece-slack' } })
            const gmail = await saveConnection({ ctx, connection: { pieceName: '@activepieces/piece-gmail' } })
            await saveConnection({ ctx, connection: { pieceName: '@activepieces/piece-notion' } })

            const response = await ctx.inject({
                method: 'GET',
                url: '/api/v1/platform-app-connections?pieceName=@activepieces/piece-slack&pieceName=@activepieces/piece-gmail',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const ids = response?.json().data.map((row: PlatformAppConnectionsListItem) => row.id).sort()
            expect(ids).toEqual([slack.id, gmail.id].sort())
        })

        it('still accepts a single piece', async () => {
            const ctx = await createTestContext(app!)
            const slack = await saveConnection({ ctx, connection: { pieceName: '@activepieces/piece-slack' } })
            await saveConnection({ ctx, connection: { pieceName: '@activepieces/piece-gmail' } })

            const response = await ctx.get('/v1/platform-app-connections', { pieceName: '@activepieces/piece-slack' })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().data.map((row: PlatformAppConnectionsListItem) => row.id)).toEqual([slack.id])
        })
    })

    describe('Summary endpoint', () => {
        it('counts connections on this platform by status and by scope', async () => {
            const ctx = await createTestContext(app!)
            await saveConnection({ ctx, connection: { status: AppConnectionStatus.ACTIVE } })
            await saveConnection({ ctx, connection: { status: AppConnectionStatus.ERROR } })
            await saveConnection({ ctx, connection: { status: AppConnectionStatus.MISSING } })
            await saveConnection({ ctx, connection: { status: AppConnectionStatus.ACTIVE, scope: AppConnectionScope.PLATFORM } })

            const otherPlatform = await createTestContext(app!)
            await saveConnection({ ctx: otherPlatform, connection: { status: AppConnectionStatus.ERROR } })

            const response = await ctx.get('/v1/platform-app-connections/summary')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const summary: PlatformAppConnectionsSummary = response?.json()
            expect(summary).toEqual({
                total: 4,
                byStatus: {
                    [AppConnectionStatus.ACTIVE]: 2,
                    [AppConnectionStatus.ERROR]: 1,
                    [AppConnectionStatus.MISSING]: 1,
                },
                byScope: {
                    [AppConnectionScope.PROJECT]: 3,
                    [AppConnectionScope.PLATFORM]: 1,
                },
            })
        })

        it('returns zeros for a platform with no connections', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/platform-app-connections/summary')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().total).toBe(0)
        })

        it('leaves out project connections of a deleted project, as the list does', async () => {
            const ctx = await createTestContext(app!)
            const deletedProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, deleted: '2026-03-01T00:00:00.000Z' })
            await db.save('project', deletedProject)
            await saveConnection({ ctx, connection: { status: AppConnectionStatus.ERROR } })
            await saveConnection({ ctx, connection: { status: AppConnectionStatus.ERROR, projectIds: [deletedProject.id] } })

            const response = await ctx.get('/v1/platform-app-connections/summary')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const summary: PlatformAppConnectionsSummary = response?.json()
            expect(summary.total).toBe(1)
            expect(summary.byStatus[AppConnectionStatus.ERROR]).toBe(1)
        })

        it('is forbidden to a project member who is not a platform admin', async () => {
            const ctx = await createTestContext(app!)
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })

            const response = await member.get('/v1/platform-app-connections/summary')

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Revalidate endpoint', () => {
        it('tests a global connection that is granted to no project', async () => {
            const ctx = await createTestContext(app!)
            const global = await saveConnection({ ctx, connection: { scope: AppConnectionScope.PLATFORM, projectIds: [] } })

            const response = await ctx.post(`/v1/platform-app-connections/${global.id}/revalidate`, {})

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().id).toBe(global.id)
            expect(response?.json().value).toBeUndefined()
        })

        it('tests a project connection', async () => {
            const ctx = await createTestContext(app!)
            const connection = await saveConnection({ ctx, connection: {} })

            const response = await ctx.post(`/v1/platform-app-connections/${connection.id}/revalidate`, {})

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().id).toBe(connection.id)
        })

        it('does not reach a connection on another platform', async () => {
            const ctx = await createTestContext(app!)
            const otherPlatform = await createTestContext(app!)
            const foreign = await saveConnection({ ctx: otherPlatform, connection: {} })

            const response = await ctx.post(`/v1/platform-app-connections/${foreign.id}/revalidate`, {})

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('is forbidden to a project member who is not a platform admin', async () => {
            const ctx = await createTestContext(app!)
            const connection = await saveConnection({ ctx, connection: {} })
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })

            const response = await member.post(`/v1/platform-app-connections/${connection.id}/revalidate`, {})

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
