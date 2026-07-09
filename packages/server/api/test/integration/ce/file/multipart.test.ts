import { apId } from '@activepieces/core-utils'
import { FileType, PrincipalType } from '@activepieces/shared'
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

async function putStepFile({ token, fileId }: { token: string, fileId: string }): Promise<void> {
    const response = await app!.inject({
        method: 'PUT',
        url: `/api/v1/files/${fileId}`,
        query: { token },
        headers: {
            'content-type': 'application/octet-stream',
            'x-ap-file-type': FileType.FLOW_STEP_FILE,
        },
        payload: Buffer.from('step file data'),
    })
    expect(response.statusCode).toBe(StatusCodes.OK)
}

describe('Multipart Uploads Endpoints', () => {
    describe('POST /v1/files/:fileId/multipart-uploads', () => {
        it('returns mode DB when file storage location is the database', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/multipart-uploads`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { type: FileType.FLOW_STEP_FILE, fileName: 'big.bin' },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()).toEqual({ mode: 'DB' })
        })

        it('rejects requests without an authorization header', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/multipart-uploads`,
                body: { type: FileType.FLOW_STEP_FILE },
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
                url: `/api/v1/files/${apId()}/multipart-uploads`,
                headers: { authorization: `Bearer ${userToken}` },
                body: { type: FileType.FLOW_STEP_FILE },
            })

            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('rejects non-streamable file types', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/multipart-uploads`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { type: FileType.FLOW_RUN_LOG },
            })

            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })

    describe('POST /v1/files/:fileId/multipart-uploads/part-url', () => {
        it('returns 404 for a file that does not exist', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/multipart-uploads/part-url`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { uploadId: 'upload-1', partNumber: 1 },
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('returns 404 for a file owned by another project', async () => {
            const fileId = apId()
            await putStepFile({ token: engineToken, fileId })

            const { mockPlatform: otherPlatform, mockProject: otherProject } = await mockAndSaveBasicSetup()
            const foreignEngineToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                projectId: otherProject.id,
                platform: { id: otherPlatform.id },
            })

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${fileId}/multipart-uploads/part-url`,
                headers: { authorization: `Bearer ${foreignEngineToken}` },
                body: { uploadId: 'upload-1', partNumber: 1 },
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('returns 409 for a file stored in the database', async () => {
            const fileId = apId()
            await putStepFile({ token: engineToken, fileId })

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${fileId}/multipart-uploads/part-url`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { uploadId: 'upload-1', partNumber: 1 },
            })

            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })
    })

    describe('POST /v1/files/:fileId/multipart-uploads/complete', () => {
        it('returns 404 for a file that does not exist', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/multipart-uploads/complete`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { uploadId: 'upload-1', parts: [{ partNumber: 1, etag: 'etag-1' }] },
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('POST /v1/files/:fileId/multipart-uploads/abort', () => {
        it('is a no-op returning 204 for a file that does not exist', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/files/${apId()}/multipart-uploads/abort`,
                headers: { authorization: `Bearer ${engineToken}` },
                body: { uploadId: 'upload-1' },
            })

            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })
})
