import { AddressInfo } from 'net'
import { ContextVersion } from '@activepieces/pieces-framework'
import {
    apId,
    AppConnectionStatus,
    AppConnectionType,
    ConnectionExpiredError,
    ConnectionNotFoundError,
    FetchError,
    FlowStatus,
    FlowVersionState,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockConnection,
    createMockFlow,
    createMockFlowVersion,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { createFlowsContext } from '../../../../../engine/src/lib/piece-context/flows'
import { createConnectionResolver } from '../../../../../engine/src/lib/piece-context/connection-resolver'
import { createContextStore } from '../../../../../engine/src/lib/piece-context/store'
import { createFileUploader } from '../../../../../engine/src/lib/piece-context/file-uploader'
import { StoreScope } from '@activepieces/pieces-framework'

let app: FastifyInstance | null = null
let apiUrl: string

beforeAll(async () => {
    app = await setupTestEnvironment()
    if (!app.server.listening) {
        await app.listen({ port: 0, host: '127.0.0.1' })
    }
    const port = (app.server.address() as AddressInfo).port
    apiUrl = `http://127.0.0.1:${port}/api/`
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Engine Services Integration', () => {
    let engineToken: string
    let projectId: string
    let platformId: string
    let ownerId: string

    beforeEach(async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup()
        projectId = mockProject.id
        platformId = mockPlatform.id
        ownerId = mockOwner.id

        engineToken = await generateMockToken({
            type: PrincipalType.ENGINE,
            id: apId(),
            projectId,
            platform: { id: platformId },
        })
    })

    describe('flows.service — createFlowsContext().list()', () => {
        it('should return SeekPage<PopulatedFlow> with correct shape', async () => {
            const flowId = apId()
            const flowVersionId = apId()
            const mockFlow = createMockFlow({
                id: flowId,
                projectId,
                status: FlowStatus.ENABLED,
                externalId: 'ext-flow-1',
            })
            const mockVersion = createMockFlowVersion({
                id: flowVersionId,
                flowId,
                state: FlowVersionState.LOCKED,
            })
            await db.save('flow', mockFlow)
            await db.save('flow_version', mockVersion)

            const flowsContext = createFlowsContext({
                engineToken,
                internalApiUrl: apiUrl,
                flowId,
                flowVersionId,
            })

            const result = await flowsContext.list({})

            expect(result).toHaveProperty('data')
            expect(result).toHaveProperty('next')
            expect(result).toHaveProperty('previous')
            expect(Array.isArray(result.data)).toBe(true)
            expect(result.data.length).toBeGreaterThanOrEqual(1)

            const populatedFlow = result.data.find(f => f.id === flowId)
            expect(populatedFlow).toBeDefined()
            expect(populatedFlow!.id).toBe(flowId)
            expect(populatedFlow!.projectId).toBe(projectId)
            expect(populatedFlow!.externalId).toBe('ext-flow-1')
            expect(populatedFlow!.status).toBe(FlowStatus.ENABLED)
            expect(populatedFlow!.version).toBeDefined()
            expect(populatedFlow!.version.id).toBe(flowVersionId)
            expect(populatedFlow!.version.flowId).toBe(flowId)
            expect(populatedFlow!.version.trigger).toBeDefined()
            expect(populatedFlow!.version.trigger.type).toBeDefined()
            expect(populatedFlow!.version.trigger.name).toBeDefined()
            expect(populatedFlow!.version.trigger.settings).toBeDefined()
            expect(populatedFlow!.version.trigger.displayName).toBeDefined()
            expect(populatedFlow!.version.displayName).toBeDefined()
            expect(populatedFlow!.version.state).toBe(FlowVersionState.LOCKED)
        })

        it('should filter by externalIds', async () => {
            const flow1Id = apId()
            const flow2Id = apId()
            const ext1 = apId()
            const ext2 = apId()

            const flow1 = createMockFlow({ id: flow1Id, projectId, externalId: ext1 })
            const flow2 = createMockFlow({ id: flow2Id, projectId, externalId: ext2 })
            const version1 = createMockFlowVersion({ flowId: flow1Id })
            const version2 = createMockFlowVersion({ flowId: flow2Id })

            await db.save('flow', flow1)
            await db.save('flow', flow2)
            await db.save('flow_version', version1)
            await db.save('flow_version', version2)

            const flowsContext = createFlowsContext({
                engineToken,
                internalApiUrl: apiUrl,
                flowId: flow1Id,
                flowVersionId: version1.id,
            })

            const result = await flowsContext.list({ externalIds: [ext1] })

            expect(result.data.length).toBe(1)
            expect(result.data[0].externalId).toBe(ext1)
        })

        it('should throw FetchError with invalid token', async () => {
            const flowsContext = createFlowsContext({
                engineToken: 'invalid-token',
                internalApiUrl: apiUrl,
                flowId: apId(),
                flowVersionId: apId(),
            })

            await expect(flowsContext.list({})).rejects.toThrow(FetchError)
        })
    })

    describe('connections.service — createConnectionResolver().obtain()', () => {
        it('should obtain connection value with V1 context', async () => {
            const externalId = apId()
            const secretText = 'my-super-secret'
            const connectionValue = {
                type: AppConnectionType.SECRET_TEXT,
                secret_text: secretText,
            }
            const encryptedValue = await encryptUtils.encryptObject(connectionValue)

            const mockConn = createMockConnection({
                platformId,
                projectIds: [projectId],
                externalId,
                status: AppConnectionStatus.ACTIVE,
            }, ownerId)

            await db.save('app_connection', {
                ...mockConn,
                value: encryptedValue,
            })

            const connectionService = createConnectionResolver({
                projectId,
                engineToken,
                apiUrl,
                contextVersion: ContextVersion.V1,
            })

            const result = await connectionService.obtain(externalId)

            expect(result).toEqual({
                type: AppConnectionType.SECRET_TEXT,
                secret_text: secretText,
            })
        })

        it('should return raw secret_text for V0 context (undefined)', async () => {
            const externalId = apId()
            const secretText = 'v0-secret-value'
            const connectionValue = {
                type: AppConnectionType.SECRET_TEXT,
                secret_text: secretText,
            }
            const encryptedValue = await encryptUtils.encryptObject(connectionValue)

            const mockConn = createMockConnection({
                platformId,
                projectIds: [projectId],
                externalId,
                status: AppConnectionStatus.ACTIVE,
            }, ownerId)

            await db.save('app_connection', {
                ...mockConn,
                value: encryptedValue,
            })

            const connectionService = createConnectionResolver({
                projectId,
                engineToken,
                apiUrl,
                contextVersion: undefined,
            })

            const result = await connectionService.obtain(externalId)

            expect(result).toBe(secretText)
        })

        it('should throw ConnectionNotFoundError for missing connection', async () => {
            const connectionService = createConnectionResolver({
                projectId,
                engineToken,
                apiUrl,
                contextVersion: ContextVersion.V1,
            })

            await expect(connectionService.obtain('non-existent-id')).rejects.toThrow(ConnectionNotFoundError)
        })

        it('should throw ConnectionExpiredError when connection status is ERROR', async () => {
            const externalId = apId()
            const connectionValue = {
                type: AppConnectionType.SECRET_TEXT,
                secret_text: 'expired-secret',
            }
            const encryptedValue = await encryptUtils.encryptObject(connectionValue)

            const mockConn = createMockConnection({
                platformId,
                projectIds: [projectId],
                externalId,
            }, ownerId)

            await db.save('app_connection', {
                ...mockConn,
                status: AppConnectionStatus.ERROR,
                value: encryptedValue,
            })

            const connectionService = createConnectionResolver({
                projectId,
                engineToken,
                apiUrl,
                contextVersion: ContextVersion.V1,
            })

            await expect(connectionService.obtain(externalId)).rejects.toThrow(ConnectionExpiredError)
        })
    })

    describe('storage.service — createContextStore().put/get/delete()', () => {
        it('should put and get a value', async () => {
            const store = createContextStore({
                apiUrl,
                prefix: '',
                flowId: apId(),
                engineToken,
            })

            const putResult = await store.put('myKey', { hello: 'world' })
            expect(putResult).toEqual({ hello: 'world' })

            const getResult = await store.get('myKey')
            expect(getResult).toEqual({ hello: 'world' })
        })

        it('should return null for non-existent key', async () => {
            const store = createContextStore({
                apiUrl,
                prefix: '',
                flowId: apId(),
                engineToken,
            })

            const result = await store.get('non-existent-key')
            expect(result).toBeNull()
        })

        it('should delete a value', async () => {
            const store = createContextStore({
                apiUrl,
                prefix: '',
                flowId: apId(),
                engineToken,
            })

            await store.put('deleteMe', { data: 'value' })
            await store.delete('deleteMe')
            const result = await store.get('deleteMe')
            expect(result).toBeNull()
        })

        it('should isolate flow-scoped vs project-scoped keys', async () => {
            const flowId = apId()
            const store = createContextStore({
                apiUrl,
                prefix: 'test_',
                flowId,
                engineToken,
            })

            await store.put('sharedKey', { scope: 'flow' }, StoreScope.FLOW)
            await store.put('sharedKey', { scope: 'project' }, StoreScope.PROJECT)

            const flowValue = await store.get('sharedKey', StoreScope.FLOW)
            expect(flowValue).toEqual({ scope: 'flow' })

            const projectValue = await store.get('sharedKey', StoreScope.PROJECT)
            expect(projectValue).toEqual({ scope: 'project' })
        })
    })

    describe('step-files.service — createFileUploader().write()', () => {
        it('should upload a file and return a URL', async () => {
            const originalMaxFileSize = process.env.AP_MAX_FILE_SIZE_MB
            process.env.AP_MAX_FILE_SIZE_MB = '10'

            try {
                const uploader = createFileUploader({
                    apiUrl,
                    engineToken,
                })

                const result = await uploader.write({
                    fileName: 'test.txt',
                    data: Buffer.from('hello world'),
                })

                expect(typeof result).toBe('string')
                expect(result).toContain('/v1/files/')
            }
            finally {
                if (originalMaxFileSize === undefined) {
                    delete process.env.AP_MAX_FILE_SIZE_MB
                }
                else {
                    process.env.AP_MAX_FILE_SIZE_MB = originalMaxFileSize
                }
            }
        })

        it('should throw FileSizeError when data exceeds max size', async () => {
            const originalMaxFileSize = process.env.AP_MAX_FILE_SIZE_MB
            process.env.AP_MAX_FILE_SIZE_MB = '0.000001'

            try {
                const uploader = createFileUploader({
                    apiUrl,
                    engineToken,
                })

                await expect(
                    uploader.write({
                        fileName: 'large.txt',
                        data: Buffer.from('this data is too large for the limit'),
                    }),
                ).rejects.toThrow()
            }
            finally {
                if (originalMaxFileSize === undefined) {
                    delete process.env.AP_MAX_FILE_SIZE_MB
                }
                else {
                    process.env.AP_MAX_FILE_SIZE_MB = originalMaxFileSize
                }
            }
        })
    })
})
