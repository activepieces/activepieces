import { apId } from '@activepieces/core-utils'
import { PrincipalType, ProjectAiCreditUsage } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { createServiceContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('AI Credit Usage API (service access)', () => {
    it('allows SERVICE principals to list per-project usage', async () => {
        const ctx = await createTestContext(app!)
        const engineToken = await generateMockToken({
            id: apId(),
            type: PrincipalType.ENGINE,
            platform: { id: ctx.platform.id },
            projectId: ctx.project.id,
        })
        const report = await app!.inject({
            method: 'POST',
            url: '/api/v1/ai-credit-usage',
            headers: {
                authorization: `Bearer ${engineToken}`,
            },
            body: {
                provider: 'activepieces',
                model: 'openai/gpt-5',
                cost: 0.01,
            },
        })
        expect(report.statusCode).toBe(StatusCodes.NO_CONTENT)

        const serviceCtx = await createServiceContext(app!, ctx)
        const response = await serviceCtx.get('/v1/ai-credit-usage')
        expect(response.statusCode).toBe(StatusCodes.OK)
        const body: ProjectAiCreditUsage[] = response.json()
        expect(body).toHaveLength(1)
        expect(body[0].projectId).toBe(ctx.project.id)
        expect(body[0].credits).toBeCloseTo(10)
    })
})
