import { FlowAction, FlowActionType, FlowStatus, FlowTrigger, FlowTriggerType, FlowVersionState } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app)
})

describe('GET /v1/platform/pieces-report.csv', () => {
    it('streams a CSV of PIECE actions and triggers on published flows across the platform, excluding drafts and other platforms', async () => {
        const enabledFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED })
        await db.save('flow', enabledFlow)
        const enabledVersion = createMockFlowVersion({
            flowId: enabledFlow.id,
            state: FlowVersionState.LOCKED,
            trigger: pieceTrigger({ name: 'trigger', pieceName: 'gmail', pieceVersion: '0.7.0', triggerName: 'new_email' }),
            displayName: 'Enabled Flow',
        })
        enabledVersion.trigger.nextAction = pieceAction({ name: 'step_1', pieceName: 'slack', pieceVersion: '0.3.4', actionName: 'send_message' })
        await db.save('flow_version', enabledVersion)
        enabledFlow.publishedVersionId = enabledVersion.id
        await db.save('flow', enabledFlow)

        const disabledFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', disabledFlow)
        const disabledVersion = createMockFlowVersion({
            flowId: disabledFlow.id,
            state: FlowVersionState.LOCKED,
            trigger: pieceTrigger({ name: 'trigger', pieceName: 'notion', pieceVersion: '1.2.0', triggerName: 'new_page' }),
            displayName: 'Disabled Flow',
        })
        await db.save('flow_version', disabledVersion)
        disabledFlow.publishedVersionId = disabledVersion.id
        await db.save('flow', disabledFlow)

        const draftOnlyFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', draftOnlyFlow)
        await db.save('flow_version', createMockFlowVersion({
            flowId: draftOnlyFlow.id,
            state: FlowVersionState.DRAFT,
            trigger: pieceTrigger({ name: 'trigger', pieceName: 'openai', pieceVersion: '0.1.0', triggerName: 'ask' }),
            displayName: 'Draft Only',
        }))

        const other = await mockAndSaveBasicSetup()
        const otherFlow = createMockFlow({ projectId: other.mockProject.id, status: FlowStatus.ENABLED })
        await db.save('flow', otherFlow)
        const otherVersion = createMockFlowVersion({
            flowId: otherFlow.id,
            state: FlowVersionState.LOCKED,
            trigger: pieceTrigger({ name: 'trigger', pieceName: 'other-piece', pieceVersion: '9.9.9', triggerName: 'other' }),
            displayName: 'Other Platform Flow',
        })
        await db.save('flow_version', otherVersion)
        otherFlow.publishedVersionId = otherVersion.id
        await db.save('flow', otherFlow)

        const response = await ctx.get('/v1/platform/pieces-report.csv')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.headers['content-type']).toContain('text/csv')
        expect(response.headers['content-disposition']).toContain(`pieces-report-${ctx.platform.id}-`)

        const rows = response.body.trim().split('\n')
        expect(rows[0]).toBe('projectId,projectName,flowId,flowName,flowStatus,flowVersionId,versionCreatedAt,stepName,stepType,pieceName,pieceVersion')

        const body = rows.slice(1).map((line) => line.split(','))
        const cells = body.map((cols) => ({
            flowId: cols[2],
            flowStatus: cols[4],
            stepName: cols[7],
            stepType: cols[8],
            pieceName: cols[9],
            pieceVersion: cols[10],
        }))

        expect(cells).toHaveLength(3)
        expect(cells).toContainEqual({
            flowId: enabledFlow.id,
            flowStatus: FlowStatus.ENABLED,
            stepName: 'trigger',
            stepType: FlowTriggerType.PIECE,
            pieceName: 'gmail',
            pieceVersion: '0.7.0',
        })
        expect(cells).toContainEqual({
            flowId: enabledFlow.id,
            flowStatus: FlowStatus.ENABLED,
            stepName: 'step_1',
            stepType: FlowActionType.PIECE,
            pieceName: 'slack',
            pieceVersion: '0.3.4',
        })
        expect(cells).toContainEqual({
            flowId: disabledFlow.id,
            flowStatus: FlowStatus.DISABLED,
            stepName: 'trigger',
            stepType: FlowTriggerType.PIECE,
            pieceName: 'notion',
            pieceVersion: '1.2.0',
        })
        for (const c of cells) {
            expect(c.pieceName).not.toBe('openai')
            expect(c.pieceName).not.toBe('other-piece')
        }
    })

    it('disarms CSV formula prefixes in flow and project names', async () => {
        const project = await db.findOneByOrFail<{ id: string, displayName: string }>('project', { id: ctx.project.id })
        project.displayName = '=cmd|"/c calc"!A1'
        await db.save('project', project)

        const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.ENABLED })
        await db.save('flow', flow)
        const version = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            trigger: pieceTrigger({ name: 'trigger', pieceName: 'gmail', pieceVersion: '0.7.0', triggerName: 'new_email' }),
            displayName: '@SUM(1+1)',
        })
        await db.save('flow_version', version)
        flow.publishedVersionId = version.id
        await db.save('flow', flow)

        const response = await ctx.get('/v1/platform/pieces-report.csv')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.body).toContain('"\'=cmd|""/c calc""!A1"')
        expect(response.body).toContain('\'@SUM(1+1)')
        expect(response.body).not.toMatch(/(^|,)=cmd/)
        expect(response.body).not.toMatch(/(^|,)@SUM/)
    })

})

type PieceTriggerParams = { name: string, pieceName: string, pieceVersion: string, triggerName: string }
type PieceActionParams = { name: string, pieceName: string, pieceVersion: string, actionName: string }

function pieceTrigger({ name, pieceName, pieceVersion, triggerName }: PieceTriggerParams): FlowTrigger {
    return {
        type: FlowTriggerType.PIECE,
        name,
        displayName: pieceName,
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {
            pieceName,
            pieceVersion,
            triggerName,
            input: {},
            propertySettings: {},
        },
    }
}

function pieceAction({ name, pieceName, pieceVersion, actionName }: PieceActionParams): FlowAction {
    return {
        type: FlowActionType.PIECE,
        name,
        displayName: pieceName,
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {
            pieceName,
            pieceVersion,
            actionName,
            input: {},
            propertySettings: {},
        },
    }
}
