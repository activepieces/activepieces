import {
    AppConnectionStatus,
    FlowState,
    FlowStatus,
    FlowTrigger,
    PopulatedFlow,
    PROJECT_REPLACE_SCHEMA_VERSION,
    ProjectReplaceRequest,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { db } from '../../../helpers/db'
import { flowGenerator } from '../../../helpers/flow-generator'
import {
    createMockApiKey,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const OLD_CONN = 'conn_old'
const NEW_CONN = 'conn_new'
const DISCORD_CONN = 'conn_discord'

function connRef(externalId: string): string {
    return `{{connections['${externalId}']}}`
}

function buildBaseFlow({ projectId, externalId }: { projectId: string, externalId: string }): FlowState {
    const flow = flowGenerator.simpleActionAndTrigger(externalId)
    flow.projectId = projectId
    flow.status = FlowStatus.DISABLED
    flow.version.displayName = 'connection reference flow'
    flow.version.trigger.name = 'trigger'
    flow.version.trigger.nextAction = undefined
    flow.version.trigger.settings.pieceName = '@activepieces/piece-slack'
    flow.version.trigger.settings.pieceVersion = '1.0.0'
    return flow as FlowState
}

function cloneWith(base: FlowState, mutate: (flow: FlowState) => void): FlowState {
    const clone = JSON.parse(JSON.stringify(base)) as FlowState
    mutate(clone)
    return clone
}

function replaceBody(overrides: Partial<ProjectReplaceRequest>): ProjectReplaceRequest {
    return {
        schemaVersion: PROJECT_REPLACE_SCHEMA_VERSION,
        sourceActivepiecesVersion: '0.0.1',
        flows: [],
        tables: [],
        folders: [],
        connections: [
            { externalId: OLD_CONN, pieceName: '@activepieces/piece-slack', displayName: 'Old Conn' },
            { externalId: NEW_CONN, pieceName: '@activepieces/piece-slack', displayName: 'New Conn' },
        ],
        requiredPieces: [],
        ...overrides,
    }
}

async function setupCtx(): Promise<{ projectId: string, platformId: string, apiKey: string }> {
    const setup = await mockAndSaveBasicSetup({
        plan: { environmentsEnabled: true },
        project: { releasesEnabled: true },
    })
    const apiKey = createMockApiKey({ platformId: setup.mockPlatform.id })
    await db.save('api_key', apiKey)
    return { projectId: setup.mockProject.id, platformId: setup.mockPlatform.id, apiKey: apiKey.value }
}

async function postReplace(params: { projectId: string, apiKey: string, body: ProjectReplaceRequest }) {
    return app!.inject({
        method: 'POST',
        url: `/api/v1/projects/${params.projectId}/replace`,
        headers: { authorization: `Bearer ${params.apiKey}` },
        body: params.body,
    })
}

async function persistedTrigger(params: { projectId: string, externalId: string }): Promise<FlowTrigger> {
    const flow = await db.findOneByOrFail<PopulatedFlow>('flow', {
        projectId: params.projectId,
        externalId: params.externalId,
    })
    const versions = await databaseConnection().getRepository('flow_version').find({
        where: { flowId: flow.id },
        order: { created: 'DESC' },
    })
    expect(versions.length).toBeGreaterThan(0)
    return versions[0].trigger as FlowTrigger
}

async function persistedTriggerAuth(params: { projectId: string, externalId: string }): Promise<string | undefined> {
    const trigger = await persistedTrigger(params)
    return trigger.settings?.input?.auth as string | undefined
}

async function seedFlowWithOldConnection(params: { projectId: string, apiKey: string, base: FlowState }): Promise<void> {
    const response = await postReplace({
        projectId: params.projectId,
        apiKey: params.apiKey,
        body: replaceBody({
            flows: [cloneWith(params.base, (f) => {
                f.version.trigger.settings.input = { auth: connRef(OLD_CONN) }
            })],
        }),
    })
    expect(response.statusCode).toBe(StatusCodes.OK)
    expect(response.json().applied.flowsCreated).toBe(1)
}

describe('Release apply / project-replace applies changed connection references (GIT-1764)', () => {
    it('a connection reference change on its own is seen by the diff and applied', async () => {
        const { projectId, platformId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_auth_only' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const second = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.trigger.settings.input = { auth: connRef(NEW_CONN) }
                })],
            }),
        })
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json().applied.flowsUpdated).toBe(1)
        expect(second.json().applied.flowsUnchanged).toBe(0)

        const auth = await persistedTriggerAuth({ projectId, externalId: 'flow_auth_only' })
        expect(auth).toBe(connRef(NEW_CONN))

        const placeholder = await db.findOneByOrFail<{ status: string }>('app_connection', {
            platformId,
            externalId: NEW_CONN,
        })
        expect(placeholder.status).toBe(AppConnectionStatus.MISSING)
    })

    it('a connection reference change alongside another edit is not reverted by the update path', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_auth_plus_rename' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const second = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.displayName = 'connection reference flow renamed'
                    f.version.trigger.settings.input = { auth: connRef(NEW_CONN) }
                })],
            }),
        })
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json().applied.flowsUpdated).toBe(1)

        const trigger = await persistedTrigger({ projectId, externalId: 'flow_auth_plus_rename' })
        expect(trigger.settings.input?.auth).toBe(connRef(NEW_CONN))
    })

    it('swapping a step to a different piece keeps that piece own connection instead of grafting the old one', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_piece_swap' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const second = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.trigger.settings.pieceName = '@activepieces/piece-discord'
                    f.version.trigger.settings.input = { auth: connRef(DISCORD_CONN) }
                })],
                connections: [
                    { externalId: OLD_CONN, pieceName: '@activepieces/piece-slack', displayName: 'Old Conn' },
                    { externalId: DISCORD_CONN, pieceName: '@activepieces/piece-discord', displayName: 'Discord Conn' },
                ],
            }),
        })
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json().applied.flowsUpdated).toBe(1)

        const trigger = await persistedTrigger({ projectId, externalId: 'flow_piece_swap' })
        expect(trigger.settings.pieceName).toBe('@activepieces/piece-discord')
        expect(trigger.settings.input?.auth).toBe(connRef(DISCORD_CONN))
    })

    it('swapping a step to a different piece never grafts the old connection when the incoming step has none', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_piece_swap_blank' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const second = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.trigger.settings.pieceName = '@activepieces/piece-discord'
                    f.version.trigger.settings.input = {}
                })],
                connections: [
                    { externalId: OLD_CONN, pieceName: '@activepieces/piece-slack', displayName: 'Old Conn' },
                ],
            }),
        })
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json().applied.flowsUpdated).toBe(1)

        const trigger = await persistedTrigger({ projectId, externalId: 'flow_piece_swap_blank' })
        expect(trigger.settings.pieceName).toBe('@activepieces/piece-discord')
        expect(trigger.settings.input?.auth).toBeUndefined()
    })

    it('an incoming step with no connection of its own still keeps the destination wiring', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_blank_auth' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const second = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.displayName = 'blank auth renamed'
                    f.version.trigger.settings.input = {}
                })],
            }),
        })
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json().applied.flowsUpdated).toBe(1)

        const auth = await persistedTriggerAuth({ projectId, externalId: 'flow_blank_auth' })
        expect(auth).toBe(connRef(OLD_CONN))
    })

    it('a step whose incoming connection is empty settles after one apply instead of reporting a change forever', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_blank_auth_settles' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const blankAuthState = replaceBody({
            flows: [cloneWith(base, (f) => {
                f.version.displayName = 'blank auth renamed'
                f.version.trigger.settings.input = {}
            })],
        })

        const second = await postReplace({ projectId, apiKey, body: blankAuthState })
        expect(second.json().applied.flowsUpdated).toBe(1)

        const third = await postReplace({ projectId, apiKey, body: blankAuthState })
        expect(third.statusCode).toBe(StatusCodes.OK)
        expect(third.json().applied.flowsUpdated).toBe(0)
        expect(third.json().applied.flowsUnchanged).toBe(1)

        const auth = await persistedTriggerAuth({ projectId, externalId: 'flow_blank_auth_settles' })
        expect(auth).toBe(connRef(OLD_CONN))
    })

    it('re-applying the same state twice reports no flow changes', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_idempotent' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const second = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.trigger.settings.input = { auth: connRef(OLD_CONN) }
                })],
            }),
        })
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json().applied.flowsUpdated).toBe(0)
        expect(second.json().applied.flowsUnchanged).toBe(1)

        const auth = await persistedTriggerAuth({ projectId, externalId: 'flow_idempotent' })
        expect(auth).toBe(connRef(OLD_CONN))
    })

    it('reverting a connection reference back to the previous one is applied too', async () => {
        const { projectId, apiKey } = await setupCtx()
        const base = buildBaseFlow({ projectId, externalId: 'flow_revert' })
        await seedFlowWithOldConnection({ projectId, apiKey, base })

        const forward = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.trigger.settings.input = { auth: connRef(NEW_CONN) }
                })],
            }),
        })
        expect(forward.json().applied.flowsUpdated).toBe(1)
        expect(await persistedTriggerAuth({ projectId, externalId: 'flow_revert' })).toBe(connRef(NEW_CONN))

        const backward = await postReplace({
            projectId,
            apiKey,
            body: replaceBody({
                flows: [cloneWith(base, (f) => {
                    f.version.trigger.settings.input = { auth: connRef(OLD_CONN) }
                })],
            }),
        })
        expect(backward.statusCode).toBe(StatusCodes.OK)
        expect(backward.json().applied.flowsUpdated).toBe(1)
        expect(await persistedTriggerAuth({ projectId, externalId: 'flow_revert' })).toBe(connRef(OLD_CONN))
    })
})
