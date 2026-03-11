import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { apId, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Step File API', () => {
    describe('POST /v1/step-files', () => {
        it('should upload step file with string contentLength via multipart', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                platform: { id: mockPlatform.id },
                projectId: mockProject.id,
            })

            const fileContent = Buffer.from('test file content')
            const formData = new FormData()
            formData.append('flowId', apId())
            formData.append('stepName', 'step_1')
            formData.append('fileName', 'test.txt')
            formData.append('contentLength', fileContent.length.toString())
            formData.append('file', new Blob([fileContent], { type: 'application/octet-stream' }), 'test.txt')

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/step-files',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: formData,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody?.url).toBeDefined()
        })

        it('should reject upload with non-numeric contentLength', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                id: apId(),
                platform: { id: mockPlatform.id },
                projectId: mockProject.id,
            })

            const formData = new FormData()
            formData.append('flowId', apId())
            formData.append('stepName', 'step_1')
            formData.append('fileName', 'test.txt')
            formData.append('contentLength', 'not-a-number')
            formData.append('file', new Blob([Buffer.from('test')], { type: 'application/octet-stream' }), 'test.txt')

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/step-files',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: formData,
            })

            expect(response?.statusCode).not.toBe(StatusCodes.OK)
        })
    })
})
