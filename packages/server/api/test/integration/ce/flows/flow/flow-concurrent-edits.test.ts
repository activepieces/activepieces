import { FlowActionType, FlowOperationType, flowStructureUtil, PopulatedFlow, UpdateActionRequest } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { flowService } from '../../../../../src/app/flows/flow/flow.service'
import { createTestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function codeStep({ name, displayName }: { name: string, displayName: string }): UpdateActionRequest {
    return {
        type: FlowActionType.CODE,
        displayName,
        name,
        settings: { input: {}, sourceCode: { code: 'export const code = async () => true', packageJson: '{}' } },
        valid: true,
        skip: false,
    }
}

describe('concurrent draft edits', () => {
    it('keeps every edit when several steps are updated at the same time', async () => {
        const ctx = await createTestContext(app)
        const flow: PopulatedFlow = (await ctx.post('/v1/flows', { displayName: 'concurrent', projectId: ctx.project.id }, { query: { projectId: ctx.project.id } })).json()
        const stepNames = ['step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6']
        for (const [index, name] of stepNames.entries()) {
            const parentStep = index === 0 ? 'trigger' : stepNames[index - 1]
            await ctx.post(`/v1/flows/${flow.id}`, { type: FlowOperationType.ADD_ACTION, request: { parentStep, action: codeStep({ name, displayName: name }) } })
        }

        await Promise.all(stepNames.map((name) =>
            flowService(app.log).update({
                id: flow.id,
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                userId: ctx.user.id,
                operation: { type: FlowOperationType.UPDATE_ACTION, request: codeStep({ name, displayName: `${name} renamed` }) },
            }),
        ))

        const saved: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`)).json()
        const savedNames = stepNames.map((name) => flowStructureUtil.getStep(name, saved.version.trigger)?.displayName)
        expect(savedNames).toEqual(stepNames.map((name) => `${name} renamed`))
    })
})
