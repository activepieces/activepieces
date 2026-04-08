import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import {
    apId,
    FlowActionType,
    McpServer,
    McpServerStatus,
    PackageType,
    PieceType,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { apListFlowsTool } from '../../../../src/app/mcp/tools/ap-list-flows'
import { apCreateFlowTool } from '../../../../src/app/mcp/tools/ap-create-flow'
import { apFlowStructureTool } from '../../../../src/app/mcp/tools/ap-flow-structure'
import { apListPiecesTool } from '../../../../src/app/mcp/tools/ap-list-pieces'
import { apAddStepTool } from '../../../../src/app/mcp/tools/ap-add-step'
import { apUpdateStepTool } from '../../../../src/app/mcp/tools/ap-update-step'
import { apRenameFlowTool } from '../../../../src/app/mcp/tools/ap-rename-flow'
import { apDeleteStepTool } from '../../../../src/app/mcp/tools/ap-delete-step'
import { apLockAndPublishTool } from '../../../../src/app/mcp/tools/ap-lock-and-publish'
import { apAddBranchTool } from '../../../../src/app/mcp/tools/ap-add-branch'
import { apDeleteBranchTool } from '../../../../src/app/mcp/tools/ap-delete-branch'

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

function makeMcp(projectId: string): McpServer {
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId,
        status: McpServerStatus.ENABLED,
        token: apId(),
        enabledTools: null,
    }
}

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map(c => c.text).join('\n')
}

async function createFlowAndGetId(mcp: McpServer, flowName: string): Promise<string> {
    const result = await apCreateFlowTool(mcp, mockLog).execute({ flowName })
    const match = text(result).match(/\(id: (\S+?)\)/)
    if (!match) throw new Error(`Could not extract flowId from: ${text(result)}`)
    return match[1]
}

describe('MCP Tools integration', () => {
    it('1. ap_list_flows — lists flows in the project', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Flow Alpha' })
        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Flow Beta' })

        const result = await apListFlowsTool(mcp, mockLog).execute({})

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Flow Alpha')
        expect(text(result)).toContain('Flow Beta')
    })

    it('2. ap_create_flow — creates a flow and returns its ID', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'My Test Flow' })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('My Test Flow')

        // Verify the flow exists via list
        const listResult = await apListFlowsTool(mcp, mockLog).execute({})
        expect(text(listResult)).toContain('My Test Flow')
    })

    it('3. ap_flow_structure — new flow has empty unconfigured trigger', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const flowId = await createFlowAndGetId(mcp, 'Structure Test Flow')

        const result = await apFlowStructureTool(mcp, mockLog).execute({ flowId })

        expect(text(result)).toContain('[TRIGGER]')
        expect(text(result)).toContain('EMPTY')
        expect(text(result)).toContain('unconfigured')
    })

    it('4. ap_list_pieces — lists pieces matching search query', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        // The gmail piece was saved in beforeAll — just search for it
        const result = await apListPiecesTool(mcp, mockLog).execute({ searchQuery: 'gmail' })

        expect(text(result)).toContain('✅')
        expect(text(result).toLowerCase()).toContain('gmail')
    })

    it('5. ap_add_step — adds a PIECE skeleton step after trigger', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Add Step Flow')

        const result = await apAddStepTool(mcp, mockLog).execute({
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

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('step_1')
        expect(text(structure)).toContain('PIECE')
    })

    it('6. ap_update_step — sets skip flag on a step', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Update Step Flow')

        await apAddStepTool(mcp, mockLog).execute({
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
        const result = await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            displayName: 'Send Welcome Email',
            skip: true,
        })

        expect(text(result)).not.toContain('❌')

        // Flow structure should now show the step as skipped
        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('skipped')
    })

    it('7. ap_rename_flow — renames a flow', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Original Name')

        const result = await apRenameFlowTool(mcp, mockLog).execute({ flowId, displayName: 'Renamed Flow' })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Renamed Flow')

        // Flow structure header should reflect the new name
        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('Renamed Flow')
    })

    it('8. ap_delete_step — removes a step from a flow', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Delete Step Flow')

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'My Code Step',
        })

        const result = await apDeleteStepTool(mcp, mockLog).execute({ flowId, stepName: 'step_1' })

        expect(text(result)).toContain('✅')

        // step_1 should no longer appear in the flow structure
        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).not.toContain('step_1')
    })

    it('9. ap_lock_and_publish — fails gracefully when flow has invalid steps', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Unpublishable Flow')

        // A new flow has only an empty/unconfigured trigger — publishing should fail
        const result = await apLockAndPublishTool(mcp, mockLog).execute({ flowId })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('invalid')
    })

    it('10. ap_add_step + ap_add_branch + ap_delete_branch — router workflow', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Router Flow')

        // Add a ROUTER step (skeleton starts with Branch 1 at [0] and Otherwise fallback at [1])
        const routerResult = await apAddStepTool(mcp, mockLog).execute({
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
        const addBranchResult = await apAddBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchName: 'VIP Customer',
        })
        expect(text(addBranchResult)).toContain('✅')
        expect(text(addBranchResult)).toContain('VIP Customer')

        // Delete Branch 1 at index 0 (a non-fallback branch)
        // Result after delete: VIP Customer[0], Otherwise[1]
        const deleteBranchResult = await apDeleteBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
        })
        expect(text(deleteBranchResult)).toContain('✅')

        // Attempting to delete the fallback branch (the only remaining non-first branch) must fail.
        // With 2 branches remaining, index 1 is the fallback → deletion blocked.
        const errorResult = await apDeleteBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 1,
        })
        expect(text(errorResult)).toContain('❌')
    })
})
