import { promisify } from 'node:util'
import { zstdCompress as zstdCompressCallback, zstdDecompress as zstdDecompressCallback } from 'node:zlib'
import {
    apId,
    ErrorCode,
    ExecutioOutputFile,
    FileCompression,
    FileLocation,
    FileType,
    FlowRetryStrategy,
    FlowRun,
    FlowRunStatus,
    FlowVersionState,
    PrincipalType,
    RunEnvironment,
    UploadLogsBehavior,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as s3HelperModule from '../../../../../src/app/file/s3-helper'
import { flowRunLogsService } from '../../../../../src/app/flows/flow-run/logs/flow-run-logs-service'
import { jwtUtils, JwtSignAlgorithm } from '../../../../../src/app/helper/jwt-utils'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../../helpers/auth'
import { db } from '../../../../helpers/db'
import {
    createMockFile,
    createMockFlow,
    createMockFlowRun,
    createMockFlowVersion,
    mockAndSaveBasicSetup,
} from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

const zstdCompress = promisify(zstdCompressCallback)
const zstdDecompress = promisify(zstdDecompressCallback)

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const MOCK_EXECUTION_OUTPUT = {
    executionState: {
        steps: { trigger: { output: { key: 'value' } } },
        tags: ['tag1'],
    },
} as unknown as ExecutioOutputFile

async function generateLogsToken(params: {
    logsFileId: string
    projectId: string
    flowRunId: string
    behavior: UploadLogsBehavior
}): Promise<string> {
    return jwtUtils.sign({
        payload: params,
        key: await jwtUtils.getJwtSecret(),
        algorithm: JwtSignAlgorithm.HS256,
        expiresInSeconds: 3600,
    })
}

describe('Flow Run Logs API', () => {
    describe('Upload directly (no S3 signed URLs)', () => {
        it('should upload zstd-compressed logs and read them back via HTTP with correct Content-Encoding', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )

            // Upload
            const uploadResponse = await app!.inject({
                method: 'PUT',
                url: '/api/v1/flow-runs/logs',
                query: { token },
                body: compressedData,
                headers: {
                    'content-type': 'application/octet-stream',
                },
            })
            expect(uploadResponse.statusCode).toBe(StatusCodes.OK)

            // Download via HTTP
            const downloadResponse = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(downloadResponse.statusCode).toBe(StatusCodes.OK)
            expect(downloadResponse.headers['content-encoding']).toBe('zstd')
            expect(downloadResponse.headers['content-type']).toContain('application/octet-stream')

            // Decompress and verify content matches original
            const decompressed = await zstdDecompress(downloadResponse.rawPayload)
            const parsed = JSON.parse(decompressed.toString('utf-8'))
            expect(parsed).toEqual(MOCK_EXECUTION_OUTPUT)
        })

        it('should upload zstd-compressed logs and read them back via service getLogs (internal decompression)', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )

            // Upload
            const uploadResponse = await app!.inject({
                method: 'PUT',
                url: '/api/v1/flow-runs/logs',
                query: { token },
                body: compressedData,
                headers: {
                    'content-type': 'application/octet-stream',
                },
            })
            expect(uploadResponse.statusCode).toBe(StatusCodes.OK)

            // Read via service (same path the frontend uses via getOnePopulatedOrThrow)
            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId,
                projectId: mockProject.id,
            })

            expect(logs).toEqual(MOCK_EXECUTION_OUTPUT)
        })

        it('should overwrite logs on re-upload and return updated content', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            // First upload
            const firstOutput = {
                executionState: { steps: { trigger: { output: { version: 1 } } }, tags: [] },
            } as unknown as ExecutioOutputFile

            await app!.inject({
                method: 'PUT',
                url: '/api/v1/flow-runs/logs',
                query: { token },
                body: await zstdCompress(Buffer.from(JSON.stringify(firstOutput))),
                headers: { 'content-type': 'application/octet-stream' },
            })

            // Second upload (overwrites)
            const secondOutput = {
                executionState: { steps: { trigger: { output: { version: 2 } } }, tags: ['updated'] },
            } as unknown as ExecutioOutputFile

            await app!.inject({
                method: 'PUT',
                url: '/api/v1/flow-runs/logs',
                query: { token },
                body: await zstdCompress(Buffer.from(JSON.stringify(secondOutput))),
                headers: { 'content-type': 'application/octet-stream' },
            })

            // Verify the latest upload wins
            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId,
                projectId: mockProject.id,
            })
            expect(logs).toEqual(secondOutput)
        })
    })

    describe('Pre-existing DB files (backward compatibility)', () => {
        it('should serve uncompressed logs without Content-Encoding header', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const rawJson = Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT))
            const mockFile = createMockFile({
                id: logsFileId,
                projectId: mockProject.id,
                type: FileType.FLOW_RUN_LOG,
                compression: FileCompression.NONE,
                location: FileLocation.DB,
                data: rawJson,
            })
            await db.save('file', mockFile)

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.headers['content-encoding']).toBeUndefined()
            expect(response.headers['content-type']).toContain('application/octet-stream')

            const body = JSON.parse(response.body)
            expect(body).toEqual(MOCK_EXECUTION_OUTPUT)
        })

        it('should decompress uncompressed logs via service getLogs', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()

            const rawJson = Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT))
            const mockFile = createMockFile({
                id: logsFileId,
                projectId: mockProject.id,
                type: FileType.FLOW_RUN_LOG,
                compression: FileCompression.NONE,
                location: FileLocation.DB,
                data: rawJson,
            })
            await db.save('file', mockFile)

            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId,
                projectId: mockProject.id,
            })
            expect(logs).toEqual(MOCK_EXECUTION_OUTPUT)
        })

        it('should serve pre-existing zstd-compressed DB file with Content-Encoding header', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )
            const mockFile = createMockFile({
                id: logsFileId,
                projectId: mockProject.id,
                type: FileType.FLOW_RUN_LOG,
                compression: FileCompression.ZSTD,
                location: FileLocation.DB,
                data: compressedData,
            })
            await db.save('file', mockFile)

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.headers['content-encoding']).toBe('zstd')
            expect(response.rawPayload).toEqual(compressedData)

            // Verify decompressed content
            const decompressed = await zstdDecompress(response.rawPayload)
            expect(JSON.parse(decompressed.toString('utf-8'))).toEqual(MOCK_EXECUTION_OUTPUT)
        })

        it('should detect and decompress zstd data even when compression metadata is NONE', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            // Simulate a mismatch: zstd-compressed data stored with compression: NONE
            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )
            const mockFile = createMockFile({
                id: logsFileId,
                projectId: mockProject.id,
                type: FileType.FLOW_RUN_LOG,
                compression: FileCompression.NONE,
                location: FileLocation.DB,
                data: compressedData,
            })
            await db.save('file', mockFile)

            // Service getLogs should detect zstd magic bytes and decompress
            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId,
                projectId: mockProject.id,
            })
            expect(logs).toEqual(MOCK_EXECUTION_OUTPUT)

            // HTTP GET should also detect and set Content-Encoding header
            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.headers['content-encoding']).toBe('zstd')

            const decompressed = await zstdDecompress(response.rawPayload)
            expect(JSON.parse(decompressed.toString('utf-8'))).toEqual(MOCK_EXECUTION_OUTPUT)
        })
    })

    describe('S3 redirect behavior (signed URLs)', () => {
        const mockS3Helper = (overrides: Record<string, unknown> = {}) => {
            return vi.spyOn(s3HelperModule, 's3Helper').mockReturnValue({
                putS3SignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/fake-signed-url'),
                getS3SignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/fake-signed-url'),
                getFile: vi.fn(),
                uploadFile: vi.fn().mockResolvedValue('fake-key'),
                deleteFiles: vi.fn(),
                constructS3Key: vi.fn().mockResolvedValue('fake-s3-key'),
                validateS3Configuration: vi.fn(),
                ...overrides,
            })
        }

        it('should redirect PUT to S3 signed URL with zstd content-encoding when behavior is REDIRECT_TO_S3', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const fakeSignedUrl = 'https://s3.example.com/fake-signed-put-url'
            const s3HelperSpy = mockS3Helper({
                putS3SignedUrl: vi.fn().mockResolvedValue(fakeSignedUrl),
            })

            // fileService.save needs S3 location to accept null data (metadata-only)
            const originalLocation = process.env.AP_FILE_STORAGE_LOCATION
            process.env.AP_FILE_STORAGE_LOCATION = 'S3'

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.REDIRECT_TO_S3,
            })

            const response = await app!.inject({
                method: 'PUT',
                url: '/api/v1/flow-runs/logs',
                query: { token },
                body: Buffer.from('test'),
                headers: {
                    'content-type': 'application/octet-stream',
                },
            })

            process.env.AP_FILE_STORAGE_LOCATION = originalLocation

            expect(response.statusCode).toBe(StatusCodes.MOVED_TEMPORARILY)
            expect(response.headers.location).toBe(fakeSignedUrl)

            // Verify putS3SignedUrl was called with zstd content encoding
            const mockInstance = s3HelperSpy.mock.results[0].value
            expect(mockInstance.putS3SignedUrl).toHaveBeenCalledWith({
                s3Key: expect.any(String),
                contentEncoding: 'zstd',
            })

            s3HelperSpy.mockRestore()
        })

        it('should redirect GET to S3 signed URL when behavior is REDIRECT_TO_S3', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()
            const s3Key = `project/${mockProject.id}/${FileType.FLOW_RUN_LOG}/${logsFileId}`

            const fakeSignedUrl = 'https://s3.example.com/fake-signed-get-url'
            const s3HelperSpy = mockS3Helper({
                getS3SignedUrl: vi.fn().mockResolvedValue(fakeSignedUrl),
            })

            await db.save('file', {
                ...createMockFile({
                    id: logsFileId,
                    projectId: mockProject.id,
                    type: FileType.FLOW_RUN_LOG,
                    compression: FileCompression.ZSTD,
                    location: FileLocation.S3,
                }),
                s3Key,
            })

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.REDIRECT_TO_S3,
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(response.statusCode).toBe(StatusCodes.MOVED_TEMPORARILY)
            expect(response.headers.location).toBe(fakeSignedUrl)
            expect(s3HelperSpy.mock.results[0].value.getS3SignedUrl).toHaveBeenCalledWith(
                s3Key,
                expect.any(String),
            )

            s3HelperSpy.mockRestore()
        })

        it('should read zstd-compressed logs from S3 via service getLogs', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const s3Key = `project/${mockProject.id}/${FileType.FLOW_RUN_LOG}/${logsFileId}`

            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )

            const s3HelperSpy = mockS3Helper({
                getFile: vi.fn().mockResolvedValue(compressedData),
            })

            // Seed file metadata pointing to S3
            await db.save('file', {
                ...createMockFile({
                    id: logsFileId,
                    projectId: mockProject.id,
                    type: FileType.FLOW_RUN_LOG,
                    compression: FileCompression.ZSTD,
                    location: FileLocation.S3,
                }),
                s3Key,
            })

            // Read via service (same path the frontend uses via getOnePopulatedOrThrow)
            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId,
                projectId: mockProject.id,
            })

            expect(logs).toEqual(MOCK_EXECUTION_OUTPUT)
            expect(s3HelperSpy.mock.results[0].value.getFile).toHaveBeenCalledWith(s3Key)

            s3HelperSpy.mockRestore()
        })

        it('should serve zstd-compressed logs from S3 via HTTP GET with Content-Encoding header', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()
            const s3Key = `project/${mockProject.id}/${FileType.FLOW_RUN_LOG}/${logsFileId}`

            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )

            const s3HelperSpy = mockS3Helper({
                getFile: vi.fn().mockResolvedValue(compressedData),
            })

            // Seed file metadata pointing to S3
            await db.save('file', {
                ...createMockFile({
                    id: logsFileId,
                    projectId: mockProject.id,
                    type: FileType.FLOW_RUN_LOG,
                    compression: FileCompression.ZSTD,
                    location: FileLocation.S3,
                }),
                s3Key,
            })

            // Use UPLOAD_DIRECTLY behavior so GET goes through getRawLogs (not redirect)
            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.headers['content-encoding']).toBe('zstd')
            expect(response.headers['content-type']).toContain('application/octet-stream')

            // Verify decompressed content matches
            const decompressed = await zstdDecompress(response.rawPayload)
            expect(JSON.parse(decompressed.toString('utf-8'))).toEqual(MOCK_EXECUTION_OUTPUT)

            s3HelperSpy.mockRestore()
        })
    })

    describe('Error cases', () => {
        it('should return 404 when logs file does not exist', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token },
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should return null from getLogs when file does not exist', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()

            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId: apId(),
                projectId: mockProject.id,
            })

            expect(logs).toBeNull()
        })

        it('should not return logs for a different project', async () => {
            const { mockProject } = await mockAndSaveBasicSetup()
            const { mockProject: otherProject } = await mockAndSaveBasicSetup()
            const logsFileId = apId()
            const flowRunId = apId()

            // Upload logs under mockProject
            const token = await generateLogsToken({
                logsFileId,
                projectId: mockProject.id,
                flowRunId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
            })

            const compressedData = await zstdCompress(
                Buffer.from(JSON.stringify(MOCK_EXECUTION_OUTPUT)),
            )

            await app!.inject({
                method: 'PUT',
                url: '/api/v1/flow-runs/logs',
                query: { token },
                body: compressedData,
                headers: { 'content-type': 'application/octet-stream' },
            })

            // Try to read with otherProject via service
            const logs = await flowRunLogsService(app!.log).getLogs({
                logsFileId,
                projectId: otherProject.id,
            })

            expect(logs).toBeNull()
        })

        it('should reject requests with an invalid token', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/flow-runs/logs',
                query: { token: 'invalid-jwt-token' },
            })

            expect(response.statusCode).not.toBe(StatusCodes.OK)
        })
    })

    describe('Retry outside retention window', () => {
        async function setupOutdatedFlowRun() {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const token = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: { id: mockPlatform.id },
            })

            const flow = createMockFlow({ projectId: mockProject.id })
            await db.save('flow', flow)

            const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
            await db.save('flow_version', flowVersion)

            const oneYearAgo = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString()
            const flowRun = createMockFlowRun({
                projectId: mockProject.id,
                flowId: flow.id,
                flowVersionId: flowVersion.id,
                status: FlowRunStatus.FAILED,
                environment: RunEnvironment.PRODUCTION,
                finishTime: oneYearAgo,
            })
            await db.save('flow_run', flowRun)
            await databaseConnection().query(
                'UPDATE flow_run SET created = $1 WHERE id = $2',
                [oneYearAgo, flowRun.id],
            )

            return { token, mockProject, flowRun }
        }

        it('should return 410 GONE when retrying a single run created over a year ago', async () => {
            const { token, mockProject, flowRun } = await setupOutdatedFlowRun()
           // fetch the run from the database
           const run = await db.findOneByOrFail('flow_run', { id: flowRun.id })
           //log the run
           console.log(run)

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/flow-runs/${flowRun.id}/retry`,
                headers: { authorization: `Bearer ${token}` },
                body: {
                    strategy: FlowRetryStrategy.ON_LATEST_VERSION,
                    projectId: mockProject.id,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.GONE)
        })

        it('should return FLOW_RUN_RETRY_OUTSIDE_RETENTION error code in bulk retry response for a run created over a year ago', async () => {
            const { token, mockProject, flowRun } = await setupOutdatedFlowRun()

            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/flow-runs/retry',
                headers: { authorization: `Bearer ${token}` },
                body: {
                    projectId: mockProject.id,
                    flowRunIds: [flowRun.id],
                    strategy: FlowRetryStrategy.ON_LATEST_VERSION,
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json<{ error?: { errorCode: string } }[]>()
            expect(body).toHaveLength(1)
            expect(body[0].error?.errorCode).toBe(ErrorCode.FLOW_RUN_RETRY_OUTSIDE_RETENTION)
        })
    })
})
