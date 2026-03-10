import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import {
    FlowActionType,
    PackageType,
    PieceType,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { listFlowsTool, createFlowTool, flowStructureTool, addStepTool, updateStepTool, renameFlowTool, deleteStepTool, lockAndPublishTool, addBranchTool, deleteBranchTool } from '../../../../src/app/mcp/tools/flow-tools'
import { listPiecesTool } from '../../../../src/app/mcp/tools/piece-tools'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log

    // Save a shared piece needed by PIECE-step tests. No platformId = OFFICIAL (visible to all platforms).
    // In test environment the piece cache is bypassed, so DB records are read directly.
    const gmailPiece = createMockPieceMetadata({
        name: '@activepieces/piece-gmail',
        displayName: 'Gmail',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
    })
    await db.save('piece_metadata', gmailPiece)
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map(c => c.text).join('\n')
}

async function createFlowAndGetId(projectId: string, flowName: string): Promise<string> {
    const result = await createFlowTool(mockLog).execute({ projectId, flowName })
    const match = text(result).match(/with id (\S+)/)
    if (!match) throw new Error(`Could not extract flowId from: ${text(result)}`)
    return match[1]
}

describe('MCP Tools integration', () => {
    it('1. ap_list_flows — lists flows in the project', async () => {
        const ctx = await createTestContext(app)

        await createFlowTool(mockLog).execute({ projectId: ctx.project.id, flowName: 'Flow Alpha' })
        await createFlowTool(mockLog).execute({ projectId: ctx.project.id, flowName: 'Flow Beta' })

        const result = await listFlowsTool(mockLog).execute({ projectId: ctx.project.id })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Flow Alpha')
        expect(text(result)).toContain('Flow Beta')
    })

    it('2. ap_create_flow — creates a flow and returns its ID', async () => {
        const ctx = await createTestContext(app)

        const result = await createFlowTool(mockLog).execute({ projectId: ctx.project.id, flowName: 'My Test Flow' })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('My Test Flow')

        // Verify the flow exists via list
        const listResult = await listFlowsTool(mockLog).execute({ projectId: ctx.project.id })
        expect(text(listResult)).toContain('My Test Flow')
    })

    it('3. ap_flow_structure — new flow has empty unconfigured trigger', async () => {
        const ctx = await createTestContext(app)

        const flowId = await createFlowAndGetId(ctx.project.id, 'Structure Test Flow')

        const result = await flowStructureTool(mockLog).execute({ projectId: ctx.project.id, flowId })

        expect(text(result)).toContain('[TRIGGER]')
        expect(text(result)).toContain('EMPTY')
        expect(text(result)).toContain('unconfigured')
    })

    it('4. ap_list_pieces — lists pieces matching search query', async () => {
        const ctx = await createTestContext(app)

        // The gmail piece was saved in beforeAll — just search for it
        const result = await listPiecesTool(mockLog).execute({ projectId: ctx.project.id, searchQuery: 'gmail' })

        expect(text(result)).toContain('✅')
        expect(text(result).toLowerCase()).toContain('gmail')
    })

    it('5. ap_add_step — adds a PIECE skeleton step after trigger', async () => {
        const ctx = await createTestContext(app)
        const flowId = await createFlowAndGetId(ctx.project.id, 'Add Step Flow')

        const result = await addStepTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.PIECE,
            displayName: 'Send Email',
            pieceName: '@activepieces/piece-gmail',
            pieceVersion: '~0.1.0',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('step_1')

        const structure = await flowStructureTool(mockLog).execute({ projectId: ctx.project.id, flowId })
        expect(text(structure)).toContain('step_1')
        expect(text(structure)).toContain('PIECE')
    })

    it('6. ap_update_step — sets skip flag on a step', async () => {
        const ctx = await createTestContext(app)
        const flowId = await createFlowAndGetId(ctx.project.id, 'Update Step Flow')

        await addStepTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.PIECE,
            displayName: 'Send Email',
            pieceName: '@activepieces/piece-gmail',
            pieceVersion: '~0.1.0',
        })

        // Update the step: set skip=true. The step is still invalid (no actionName configured)
        // so the tool returns ⚠️, not ❌ — the update itself succeeded.
        const result = await updateStepTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            stepName: 'step_1',
            displayName: 'Send Welcome Email',
            skip: true,
        })

        expect(text(result)).not.toContain('❌')

        // Flow structure should now show the step as skipped
        const structure = await flowStructureTool(mockLog).execute({ projectId: ctx.project.id, flowId })
        expect(text(structure)).toContain('skipped')
    })

    it('7. ap_rename_flow — renames a flow', async () => {
        const ctx = await createTestContext(app)
        const flowId = await createFlowAndGetId(ctx.project.id, 'Original Name')

        const result = await renameFlowTool(mockLog).execute({ projectId: ctx.project.id, flowId, displayName: 'Renamed Flow' })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Renamed Flow')

        // Flow structure header should reflect the new name
        const structure = await flowStructureTool(mockLog).execute({ projectId: ctx.project.id, flowId })
        expect(text(structure)).toContain('Renamed Flow')
    })

    it('8. ap_delete_step — removes a step from a flow', async () => {
        const ctx = await createTestContext(app)
        const flowId = await createFlowAndGetId(ctx.project.id, 'Delete Step Flow')

        await addStepTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'My Code Step',
        })

        const result = await deleteStepTool(mockLog).execute({ projectId: ctx.project.id, flowId, stepName: 'step_1' })

        expect(text(result)).toContain('✅')

        // step_1 should no longer appear in the flow structure
        const structure = await flowStructureTool(mockLog).execute({ projectId: ctx.project.id, flowId })
        expect(text(structure)).not.toContain('step_1')
    })

    it('9. ap_lock_and_publish — fails gracefully when flow has invalid steps', async () => {
        const ctx = await createTestContext(app)
        const flowId = await createFlowAndGetId(ctx.project.id, 'Unpublishable Flow')

        // A new flow has only an empty/unconfigured trigger — publishing should fail
        const result = await lockAndPublishTool(mockLog).execute({ projectId: ctx.project.id, flowId })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('invalid')
    })

    it('10. ap_add_step + ap_add_branch + ap_delete_branch — router workflow', async () => {
        const ctx = await createTestContext(app)
        const flowId = await createFlowAndGetId(ctx.project.id, 'Router Flow')

        // Add a ROUTER step (skeleton starts with Branch 1 at [0] and Otherwise fallback at [1])
        const routerResult = await addStepTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })
        expect(text(routerResult)).toContain('✅')

        // ap_add_branch inserts before the fallback (last) branch.
        // Router has 2 branches → insert at index max(0, 2-1) = 1
        // Result: Branch 1[0], VIP Customer[1], Otherwise[2]
        const addBranchResult = await addBranchTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            routerStepName: 'step_1',
            branchName: 'VIP Customer',
        })
        expect(text(addBranchResult)).toContain('✅')
        expect(text(addBranchResult)).toContain('VIP Customer')

        // Delete Branch 1 at index 0 (a non-fallback branch)
        // Result after delete: VIP Customer[0], Otherwise[1]
        const deleteBranchResult = await deleteBranchTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
        })
        expect(text(deleteBranchResult)).toContain('✅')

        // Attempting to delete the fallback branch (the only remaining non-first branch) must fail.
        // With 2 branches remaining, index 1 is the fallback → deletion blocked.
        const errorResult = await deleteBranchTool(mockLog).execute({
            projectId: ctx.project.id,
            flowId,
            routerStepName: 'step_1',
            branchIndex: 1,
        })
        expect(text(errorResult)).toContain('❌')
    })
})
