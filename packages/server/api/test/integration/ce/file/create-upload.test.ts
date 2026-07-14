import { apId } from '@activepieces/core-utils'
import { FileCompression, FileType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let engineToken: string
let platformId: string
let projectId: string

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    platformId = mockPlatform.id
    projectId = mockProject.id
    engineToken = await generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        projectId,
        platform: { id: platformId },
    })
})

describe('Create Upload Endpoint', () => {
    describe('POST /v1/files/:fileId/create-upload', () => {
        it('returns mode DB when file storage location is the database', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/create-upload`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { type: FileType.FLOW_STEP_FILE, fileName: 'big.bin', size: 1024 },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()).toEqual({ mode: 'DB' })
        })

        it('rejects requests without an authorization header', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/create-upload`,
                body: { type: FileType.FLOW_STEP_FILE, size: 1024 },
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('rejects requests with a user token instead of an engine token', async () => {
            const userToken = await generateMockToken({
                type: PrincipalType.USER,
                id: apId(),
                projectId,
                platform: { id: platformId },
            })

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/create-upload`,
                headers: { authorization: `Bearer ${userToken}` },
                body: { type: FileType.FLOW_STEP_FILE, size: 1024 },
            })

            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('returns mode DB for FLOW_RUN_LOG when storage is the database', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/create-upload`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { type: FileType.FLOW_RUN_LOG, size: 1024, compression: FileCompression.ZSTD },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()).toEqual({ mode: 'DB' })
        })

        it('rejects file types outside the engine-writable set', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/create-upload`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { type: FileType.SAMPLE_DATA, size: 1024 },
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('rejects requests missing the size', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/create-upload`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { type: FileType.FLOW_STEP_FILE },
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })
})
