import { apId } from '@activepieces/core-utils'
import { Principal, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function engineToken({ projectId, platformId }: { projectId: string, platformId: string }): Promise<string> {
    const principal: Principal = {
        id: apId(),
        type: PrincipalType.ENGINE,
        projectId,
        platform: { id: platformId },
    }
    return generateMockToken(principal)
}

const STEP_OUTPUT_WITH_RESERVED_KEYS = '{"found":{"__proto__":"a","constructor":{"prototype":"b"},"word":"c"}}'

describe('Engine callback JSON bodies', () => {
    it.each([
        ['/api/v1/engine/run-progress', (projectId: string): string => `{"flowRun":{"id":"${apId()}","projectId":"${projectId}"},"step":{"name":"step_5","path":[],"output":${STEP_OUTPUT_WITH_RESERVED_KEYS}}}`],
        ['/api/v1/engine/step-progress', (projectId: string): string => `{"projectId":"${projectId}","runId":"${apId()}","output":${STEP_OUTPUT_WITH_RESERVED_KEYS}}`],
    ])('accepts a step output with __proto__ and constructor.prototype keys on %s', async (url, buildPayload) => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const token = await engineToken({ projectId: mockProject.id, platformId: mockPlatform.id })

        const response = await app!.inject({
            method: 'POST',
            url,
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json',
            },
            payload: buildPayload(mockProject.id),
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('does not pollute Object.prototype when parsing a __proto__ key', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        const token = await engineToken({ projectId: mockProject.id, platformId: mockPlatform.id })

        await app!.inject({
            method: 'POST',
            url: '/api/v1/engine/step-progress',
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json',
            },
            payload: `{"projectId":"${mockProject.id}","runId":"${apId()}","output":{"__proto__":{"polluted":true}}}`,
        })

        expect(Object.prototype).not.toHaveProperty('polluted')
    })
})
