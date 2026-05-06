import { memoryLock } from '@activepieces/server-utils'
import {
    FlowState,
    Folder,
    PieceType,
    PROJECT_REPLACE_SCHEMA_VERSION,
    ProjectReplaceErrorKind,
    ProjectReplaceRequest,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { db } from '../../../helpers/db'
import { flowGenerator } from '../../../helpers/flow-generator'
import {
    createMockApiKey,
    createMockConnection,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.mock('../../../../src/app/pieces/piece-install-service', () => ({
    pieceInstallService: () => ({
        installPiece: (_platformId: string, params: { pieceName: string, pieceVersion: string }) => {
            if (params.pieceName.includes('definitely-does-not-exist-on-npm')) {
                return Promise.reject(new Error('mocked: npm extract failed'))
            }
            return Promise.resolve({
                id: 'mocked-piece-id',
                name: params.pieceName,
                version: params.pieceVersion,
            })
        },
    }),
}))

let app: FastifyInstance | null = null

beforeAll(async () => {
    // fresh: true is required because we vi.mock piece-install-service above —
    // the shared server captures module references at first evaluation.
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Project Replace API', () => {
    describe('POST /v1/projects/:projectId/replace', () => {
        it('returns 200 with all-zero counts for an empty mirror against an empty project', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: emptyReplaceRequest(),
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.failed).toEqual([])
            expect(body.applied).toMatchObject({
                flowsCreated: 0,
                flowsUpdated: 0,
                flowsDeleted: 0,
                tablesCreated: 0,
                tablesUpdated: 0,
                tablesDeleted: 0,
                foldersCreated: 0,
                foldersUpdated: 0,
                foldersDeleted: 0,
            })
            expect(typeof body.durationMs).toBe('number')
        })

        it('rejects when environmentsEnabled is false (FEATURE_DISABLED → 402)', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: false })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: emptyReplaceRequest(),
            })

            expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })

        it('rejects an API key whose platform does not own the destination project', async () => {
            const { project } = await setupCtx({ environmentsEnabled: true })
            const otherSetup = await mockAndSaveBasicSetup({ plan: { environmentsEnabled: true } })
            const otherApiKey = createMockApiKey({ platformId: otherSetup.mockPlatform.id })
            await db.save('api_key', otherApiKey)

            const response = await postReplace({
                projectId: project.id,
                apiKey: otherApiKey.value,
                body: emptyReplaceRequest(),
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('returns 422 AP_VERSION_MISMATCH when source major exceeds dest', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: { ...emptyReplaceRequest(), sourceActivepiecesVersion: '99.0.0' },
            })

            expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
            const body = response.json()
            expect(Array.isArray(body.errors)).toBe(true)
            expect(body.errors[0].kind).toBe(ProjectReplaceErrorKind.AP_VERSION_MISMATCH)
        })

        it('returns 502 INSTALL_FAILED when a required piece cannot be installed on dest', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    requiredPieces: [{
                        name: '@activepieces/piece-definitely-does-not-exist-on-npm',
                        version: '1.2.3',
                        pieceType: PieceType.OFFICIAL,
                    }],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_GATEWAY)
            const body = response.json()
            expect(body.failures).toHaveLength(1)
            expect(body.failures[0]).toMatchObject({
                pieceName: '@activepieces/piece-definitely-does-not-exist-on-npm',
                version: '1.2.3',
                pieceType: PieceType.OFFICIAL,
            })
            expect(typeof body.failures[0].message).toBe('string')
        })

        it('auto-creates a placeholder connection on dest and surfaces it in connectionsAwaitingAuthorization', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    connections: [{
                        externalId: 'slack_main',
                        pieceName: '@activepieces/piece-slack',
                        displayName: 'Slack Main',
                    }],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.applied.connectionsCreated).toBe(1)
            expect(body.connectionsAwaitingAuthorization).toEqual([
                expect.objectContaining({
                    externalId: 'slack_main',
                    pieceName: '@activepieces/piece-slack',
                    displayName: 'Slack Main',
                }),
            ])
        })

        it('returns 422 CONNECTION_PIECE_MISMATCH when dest connection exists with a different pieceName', async () => {
            const { project, platform, apiKey, ownerId } = await setupCtx({ environmentsEnabled: true })

            const connection = createMockConnection({
                platformId: platform.id,
                projectIds: [project.id],
                externalId: 'shared_conn',
                pieceName: '@activepieces/piece-discord',
            }, ownerId)
            await db.save('app_connection', connection)

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    connections: [{
                        externalId: 'shared_conn',
                        pieceName: '@activepieces/piece-slack',
                        displayName: 'Slack Main',
                    }],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
            const body = response.json()
            const mismatch = body.errors.find((e: { kind: string }) => e.kind === ProjectReplaceErrorKind.CONNECTION_PIECE_MISMATCH)
            expect(mismatch).toMatchObject({
                kind: ProjectReplaceErrorKind.CONNECTION_PIECE_MISMATCH,
                externalId: 'shared_conn',
                expectedPieceName: '@activepieces/piece-slack',
                foundPieceName: '@activepieces/piece-discord',
            })
        })

        it('creates a new folder by externalId', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    folders: [{
                        externalId: 'folder_alpha',
                        displayName: 'Alpha',
                        displayOrder: 1,
                    }],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().applied.foldersCreated).toBe(1)

            const saved = await db.findOneByOrFail<Folder>('folder', { projectId: project.id, externalId: 'folder_alpha' })
            expect(saved.displayName).toBe('Alpha')
            expect(saved.displayOrder).toBe(1)
        })

        it('updates a folder when displayName/order change for an existing externalId', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            // First run: create
            await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    folders: [{ externalId: 'folder_beta', displayName: 'Beta', displayOrder: 1 }],
                },
            })

            // Second run: same externalId, new display values
            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    folders: [{ externalId: 'folder_beta', displayName: 'Beta Renamed', displayOrder: 5 }],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().applied.foldersUpdated).toBe(1)

            const saved = await db.findOneByOrFail<Folder>('folder', { projectId: project.id, externalId: 'folder_beta' })
            expect(saved.displayName).toBe('Beta Renamed')
            expect(saved.displayOrder).toBe(5)
        })

        it('deletes a folder that is no longer in the source state', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    folders: [{ externalId: 'folder_gamma', displayName: 'Gamma', displayOrder: 0 }],
                },
            })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: emptyReplaceRequest(),
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().applied.foldersDeleted).toBe(1)
            const remaining = await db.findOneBy<Folder>('folder', { projectId: project.id, externalId: 'folder_gamma' })
            expect(remaining).toBeNull()
        })

        it('reports unchanged on a second run with the same payload (idempotency)', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const folders = [
                { externalId: 'idemp_folder', displayName: 'Stable', displayOrder: 2 },
            ]

            await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: { ...emptyReplaceRequest(), folders },
            })

            const second = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: { ...emptyReplaceRequest(), folders },
            })

            expect(second.statusCode).toBe(StatusCodes.OK)
            const body = second.json()
            expect(body.applied.foldersCreated).toBe(0)
            expect(body.applied.foldersUpdated).toBe(0)
            expect(body.applied.foldersDeleted).toBe(0)
            expect(body.applied.foldersUnchanged).toBe(1)
        })

        it('returns 409 REPLACE_IN_PROGRESS when the per-project lock is already held', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const heldLock = await memoryLock.acquire(`project-replace:${project.id}`)
            try {
                const response = await postReplace({
                    projectId: project.id,
                    apiKey: apiKey.value,
                    body: emptyReplaceRequest(),
                })
                expect(response.statusCode).toBe(StatusCodes.CONFLICT)
                expect(response.json().error).toBe('REPLACE_IN_PROGRESS')
            }
            finally {
                await heldLock.release()
            }
        })

        it('lists installed pieces in piecesInstalled when install succeeds', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    requiredPieces: [{
                        name: 'mocked-piece-that-installs-fine',
                        version: '1.2.3',
                        pieceType: PieceType.CUSTOM,
                    }],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.piecesInstalled).toEqual([
                expect.objectContaining({
                    name: 'mocked-piece-that-installs-fine',
                    version: '1.2.3',
                    pieceType: PieceType.CUSTOM,
                }),
            ])
        })

        it('mirrors flows + tables + folders in a single request', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    folders: [{ externalId: 'multi_folder', displayName: 'Multi', displayOrder: 0 }],
                    tables: [{
                        id: 'src_table_id',
                        externalId: 'multi_table',
                        name: 'Events',
                        fields: [
                            { name: 'event', type: 'TEXT', externalId: 'multi_field_1', data: null },
                            { name: 'ts', type: 'DATE', externalId: 'multi_field_2', data: null },
                        ],
                        status: null,
                        trigger: null,
                    }],
                    flows: [buildSimpleFlow({ projectId: project.id, displayName: 'multi_flow' })],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.applied).toMatchObject({
                foldersCreated: 1,
                tablesCreated: 1,
                flowsCreated: 1,
            })
            expect(body.failed).toEqual([])
        })

        it('returns 207 with per-item failure when one folder violates a uniqueness constraint', async () => {
            const { project, apiKey } = await setupCtx({ environmentsEnabled: true })

            const response = await postReplace({
                projectId: project.id,
                apiKey: apiKey.value,
                body: {
                    ...emptyReplaceRequest(),
                    folders: [
                        { externalId: 'dup_a', displayName: 'duplicate', displayOrder: 1 },
                        { externalId: 'dup_b', displayName: 'duplicate', displayOrder: 2 },
                    ],
                },
            })

            expect(response.statusCode).toBe(StatusCodes.MULTI_STATUS)
            const body = response.json()
            expect(body.applied.foldersCreated).toBe(1)
            expect(body.failed).toHaveLength(1)
            expect(body.failed[0]).toMatchObject({
                kind: 'folder',
                op: 'CREATE',
            })
            expect(['dup_a', 'dup_b']).toContain(body.failed[0].externalId)
        })
    })
})

async function setupCtx(plan: { environmentsEnabled: boolean }): Promise<TestSetup> {
    const setup = await mockAndSaveBasicSetup({
        plan: { environmentsEnabled: plan.environmentsEnabled },
        project: { releasesEnabled: true },
    })
    const apiKey = createMockApiKey({ platformId: setup.mockPlatform.id })
    await db.save('api_key', apiKey)
    return {
        project: setup.mockProject,
        platform: setup.mockPlatform,
        apiKey,
        ownerId: setup.mockOwner.id,
    }
}

async function postReplace(params: { projectId: string, apiKey: string, body: ProjectReplaceRequest }) {
    return app!.inject({
        method: 'POST',
        url: `/api/v1/projects/${params.projectId}/replace`,
        headers: { authorization: `Bearer ${params.apiKey}` },
        body: params.body,
    })
}

function emptyReplaceRequest(): ProjectReplaceRequest {
    return {
        schemaVersion: PROJECT_REPLACE_SCHEMA_VERSION,
        sourceActivepiecesVersion: '0.0.1',
        flows: [],
        tables: [],
        folders: [],
        connections: [],
        requiredPieces: [],
    }
}

function buildSimpleFlow({ projectId, displayName }: { projectId: string, displayName: string }): FlowState {
    const flow = flowGenerator.simpleActionAndTrigger()
    flow.projectId = projectId
    flow.version.displayName = displayName
    // Trigger name must be 'trigger' — that's the default name on the freshly-created
    // flow on dest. UPDATE_TRIGGER looks up the trigger by name, so a random name
    // would throw "Step not found".
    flow.version.trigger.name = 'trigger'
    // Drop the nextAction chain — we test that flow CREATE/IMPORT works, not the
    // ADD_ACTION expansion which has its own quirks with sub-step name resolution.
    flow.version.trigger.nextAction = undefined
    return flow as FlowState
}

type TestSetup = {
    project: { id: string }
    platform: { id: string }
    apiKey: { value: string }
    ownerId: string
}
