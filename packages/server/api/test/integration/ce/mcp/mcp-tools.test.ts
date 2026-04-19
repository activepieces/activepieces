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
import { apBuildFlowTool } from '../../../../src/app/mcp/tools/ap-build-flow'
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
import { apGetPiecePropsTool } from '../../../../src/app/mcp/tools/ap-get-piece-props'
import { apValidateStepConfigTool } from '../../../../src/app/mcp/tools/ap-validate-step-config'
import { apValidateFlowTool } from '../../../../src/app/mcp/tools/ap-validate-flow'
import { apUpdateTriggerTool } from '../../../../src/app/mcp/tools/ap-update-trigger'
import { apDuplicateFlowTool } from '../../../../src/app/mcp/tools/ap-duplicate-flow'
import { apUpdateBranchTool } from '../../../../src/app/mcp/tools/ap-update-branch'
import { mcpUtils } from '../../../../src/app/mcp/tools/mcp-utils'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log

    // Save a shared piece needed by PIECE-step tests. No platformId = OFFICIAL (visible to all platforms).
    // In test environment the piece cache is bypassed, so DB records are read directly.
    const gmailPiece = createMockPieceMetadata({
        name: '@activepieces/piece-test-email',
        displayName: 'Test Email',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            send_email: {
                name: 'send_email',
                displayName: 'Send Email',
                description: 'Send an email',
                requireAuth: true,
                props: {
                    to: { type: 'SHORT_TEXT', displayName: 'To', required: true },
                    subject: { type: 'SHORT_TEXT', displayName: 'Subject', required: true },
                    folder: { type: 'DROPDOWN', displayName: 'Folder', required: false, refreshers: ['auth'] },
                },
            },
        },
        triggers: {
            new_email: {
                name: 'new_email',
                displayName: 'New Email',
                description: 'Triggers on new email',
                requireAuth: false,
                props: {},
            },
            new_attachment: {
                name: 'new_attachment',
                displayName: 'New Attachment',
                description: 'Triggers on new attachment',
                requireAuth: false,
                props: {},
            },
        },
    })
    await db.save('piece_metadata', gmailPiece)

    const arrayPiece = createMockPieceMetadata({
        name: '@activepieces/piece-test-array',
        displayName: 'Test Array',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            action_with_array: {
                name: 'action_with_array',
                displayName: 'Action With Array',
                description: 'Action with array property',
                requireAuth: false,
                props: {
                    items: {
                        type: 'ARRAY',
                        displayName: 'Items',
                        required: true,
                        properties: {
                            name: { type: 'SHORT_TEXT', displayName: 'Name', required: true },
                            value: { type: 'NUMBER', displayName: 'Value', required: false },
                        },
                    },
                },
            },
        },
        triggers: {},
    })
    await db.save('piece_metadata', arrayPiece)

    const dynamicPiece = createMockPieceMetadata({
        name: '@activepieces/piece-test-dynamic',
        displayName: 'Test Dynamic',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            test_action: {
                name: 'test_action',
                displayName: 'Test Action',
                description: 'Action with dynamic props',
                requireAuth: false,
                props: {
                    mode: { type: 'STATIC_DROPDOWN', displayName: 'Mode', required: true, options: { options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] } },
                    dynamicField: { type: 'DYNAMIC', displayName: 'Dynamic Field', required: false, refreshers: ['mode'] },
                },
            },
        },
        triggers: {},
    })
    await db.save('piece_metadata', dynamicPiece)
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

        const result = await apListPiecesTool(mcp, mockLog).execute({ searchQuery: 'test-email' })

        expect(text(result)).toContain('✅')
        expect(text(result).toLowerCase()).toContain('test-email')
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
            pieceName: '@activepieces/piece-test-email',
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
            pieceName: '@activepieces/piece-test-email',
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

    it('11. ap_get_piece_props — returns field schemas for a piece action', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'send_email',
            type: 'action',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('send_email')
        expect(text(result)).toContain('to')
        expect(text(result)).toContain('subject')
    })

    it('12. ap_get_piece_props — returns error for non-existent piece', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-nonexistent',
            actionOrTriggerName: 'fake_action',
            type: 'action',
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('not found')
    })

    it('13. ap_validate_step_config — CODE with valid source returns valid', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'CODE',
            sourceCode: 'export const code = async () => { return true; };',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Valid CODE')
    })

    it('14. ap_validate_step_config — CODE with empty source returns invalid', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'CODE',
        })

        expect(text(result)).toContain('⚠️')
        expect(text(result)).toContain('Invalid CODE')
    })

    it('15. ap_validate_step_config — LOOP with items returns valid', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'LOOP_ON_ITEMS',
            loopItems: '{{step_1.output}}',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Valid LOOP')
    })

    it('16. ap_validate_step_config — LOOP without items returns invalid', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'LOOP_ON_ITEMS',
        })

        expect(text(result)).toContain('⚠️')
        expect(text(result)).toContain('Invalid LOOP')
    })

    it('17. ap_validate_step_config — PIECE_ACTION missing pieceName returns error', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'PIECE_ACTION',
            actionName: 'send_email',
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('pieceName')
    })

    it('18. ap_validate_flow — new flow with empty trigger has issues', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Validate Flow Test')

        const result = await apValidateFlowTool(mcp, mockLog).execute({ flowId })

        expect(text(result)).toContain('⚠️')
        expect(text(result)).toContain('not configured')
    })

    it('19. ap_validate_flow — flow with configured trigger and valid CODE step is ready', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Valid Flow Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'My Code',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async () => { return { ok: true }; };',
            input: {},
        })

        const result = await apValidateFlowTool(mcp, mockLog).execute({ flowId })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('ready to publish')
        expect(text(result)).not.toContain('⚠️')
        expect(text(result)).not.toContain('issue')
    })

    it('20. ap_validate_flow — flow with invalid step lists it', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Invalid Step Flow')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.PIECE,
            displayName: 'Unconfigured Piece',
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
        })

        const result = await apValidateFlowTool(mcp, mockLog).execute({ flowId })

        expect(text(result)).toContain('⚠️')
        expect(text(result)).toContain('Step Validity')
        expect(text(result)).toContain('Unconfigured Piece')
        expect(text(result)).toContain('invalid')
        expect(text(result)).toContain('1 invalid')
    })

    it('21. ap_validate_flow — detects empty router branches', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Router Validate Flow')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        const result = await apValidateFlowTool(mcp, mockLog).execute({ flowId })

        expect(text(result)).toContain('⚠️')
        expect(text(result)).toContain('Empty Branches')
        expect(text(result)).toContain('My Router')
        expect(text(result)).toContain('empty branch')
    })

    it('22. ap_get_piece_props — without auth returns note for dropdown fields', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'send_email',
            type: 'action',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('folder')
        expect(text(result)).toContain('DROPDOWN')
        expect(text(result)).toContain('Dynamic dropdown')
    })

    it('23. ap_get_piece_props — schema includes all fields regardless of auth', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'send_email',
            type: 'action',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('folder')
        expect(text(result)).toContain('DROPDOWN')
        expect(text(result)).toContain('to')
        expect(text(result)).toContain('subject')
    })

    it('24. ap_get_piece_props — with auth on piece with no dropdowns returns clean schema', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'new_email',
            type: 'trigger',
            auth: 'fake-connection-id',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).not.toContain('DROPDOWN')
        expect(text(result)).not.toContain('Dynamic dropdown')
    })

    it('25. ap_get_piece_props — with auth and invalid piece returns error before resolution', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-nonexistent',
            actionOrTriggerName: 'fake_action',
            type: 'action',
            auth: 'some-connection',
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('not found')
    })

    it('26. ap_get_piece_props — with auth and invalid action returns error with available list', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'nonexistent_action',
            type: 'action',
            auth: 'some-connection',
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('not found')
        expect(text(result)).toContain('send_email')
    })

    it('27. ap_get_piece_props — static fields always present regardless of auth parameter', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'send_email',
            type: 'action',
        })

        expect(text(result)).toContain('to')
        expect(text(result)).toContain('subject')
        expect(text(result)).toContain('folder')
    })

    // ── Fix 1: Step output reference format ───────────────────────────

    it('28. ap_flow_structure — reference hint uses {{stepName.field}} without .output.', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Reference Format Test')

        const result = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(result)

        expect(output).toContain('{{stepName.field}}')
        expect(output).not.toContain('{{stepName.output.field}}')
        expect(output).not.toContain('{{trigger.output.')
    })

    it('29. ap_update_step — input description uses {{stepName.field}} not {{stepName.output.field}}', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const tool = apUpdateStepTool(mcp, mockLog)
        const inputDesc = tool.inputSchema.input.description ?? ''

        expect(inputDesc).toContain('{{stepName.field}}')
        expect(inputDesc).not.toContain('{{stepName.output.field}}')
    })

    it('30. ap_update_trigger — input description uses {{stepName.field}} not {{stepName.output.field}}', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const tool = apUpdateTriggerTool(mcp, mockLog)
        const inputDesc = tool.inputSchema.input.description ?? ''

        expect(inputDesc).toContain('{{stepName.field}}')
        expect(inputDesc).not.toContain('{{stepName.output.field}}')
    })

    it('31a. step with {{stepName.field}} references is accepted as valid', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Reference Behavior Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Use Trigger Data',
        })

        const result = await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async (inputs) => { return { email: inputs.email }; };',
            input: { email: '{{trigger.body.email}}' },
        })

        expect(text(result)).toContain('✅')

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validation)).toContain('✅')
        expect(text(validation)).toContain('ready to publish')
    })

    // ── Fix 2: Sample data preservation on trigger updates ────────────

    it('31. ap_update_trigger — partial update preserves existing input when same trigger', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Trigger Merge Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        const validAfterSet = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validAfterSet)).toContain('✅')

        const renameResult = await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
            displayName: 'Renamed Trigger',
        })

        expect(text(renameResult)).toContain('✅')

        const validAfterRename = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validAfterRename)).toContain('✅')
    })

    it('32. ap_update_trigger — switching to different triggerName discards old input', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Trigger Switch Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
            input: { customField: 'should-be-discarded' },
        })

        const switchResult = await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_attachment',
        })
        expect(text(switchResult)).toContain('✅')

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('new_attachment')
        expect(text(structure)).not.toContain('new_email')
    })

    it('33. ap_update_trigger — additive input merge: new fields added without overwriting existing', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Additive Merge Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        const addFieldResult = await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
            input: { extraField: 'value' },
        })
        expect(text(addFieldResult)).toContain('✅')

        const stillValid = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(stillValid)).toContain('✅')
    })

    // ── Fix 3: Dynamic property resolution ────────────────────────────

    it('34. ap_get_piece_props — DYNAMIC properties show note when refreshers not provided', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-dynamic',
            actionOrTriggerName: 'test_action',
            type: 'action',
        })

        const output = text(result)
        expect(output).toContain('✅')
        expect(output).toContain('DYNAMIC')
        expect(output).toContain('ap_get_piece_props')
        expect(output).not.toContain('dynamicFields')
    })

    it('35. ap_get_piece_props — input parameter is accepted without error', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-dynamic',
            actionOrTriggerName: 'test_action',
            type: 'action',
            input: { unrelated_key: 'value' },
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('test_action')
    })

    it('36. ap_delete_step — description warns about sample data loss', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const tool = apDeleteStepTool(mcp, mockLog)

        expect(tool.description).toContain('sample data')
        expect(tool.description).toContain('ap_update_step')
    })

    // ── Real-world agent scenarios (from MCP comparison report) ───────

    it('37. Scenario 2 — Webhook → Code step: full 2-step flow built and validated', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Webhook to Code')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Process Message',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async (inputs) => { return { processed: true, from: inputs.sender }; };',
            input: { sender: '{{trigger.from}}' },
        })

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validation)).toContain('✅')
        expect(text(validation)).toContain('ready to publish')
    })

    it('38. Scenario 3 — Loop iteration: trigger → code → loop → code inside loop', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Loop Flow')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Build List',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async () => { return { items: [1, 2, 3] }; };',
            input: {},
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.LOOP_ON_ITEMS,
            displayName: 'Loop Items',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_2',
            loopItems: '{{step_1.items}}',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_2',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
            stepType: FlowActionType.CODE,
            displayName: 'Process Item',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_3',
            sourceCode: 'export const code = async (inputs) => { return { doubled: inputs.val * 2 }; };',
            input: { val: '{{step_2.item}}' },
        })

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validation)).toContain('✅')
        expect(text(validation)).toContain('ready to publish')
    })

    it('39. Scenario 5 — Loop + Router: multi-branch flow with cross-references', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Loop Router Flow')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.LOOP_ON_ITEMS,
            displayName: 'Loop',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            loopItems: '{{trigger.items}}',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
            stepType: FlowActionType.ROUTER,
            displayName: 'Priority Router',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_2',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
            branchIndex: 0,
            stepType: FlowActionType.CODE,
            displayName: 'High Priority',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_3',
            sourceCode: 'export const code = async (inputs) => { return { priority: "high", item: inputs.item }; };',
            input: { item: '{{step_1.item}}' },
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_2',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
            branchIndex: 1,
            stepType: FlowActionType.CODE,
            displayName: 'Low Priority',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_4',
            sourceCode: 'export const code = async (inputs) => { return { priority: "low", item: inputs.item }; };',
            input: { item: '{{step_1.item}}' },
        })

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(structure)
        expect(output).toContain('Loop')
        expect(output).toContain('Priority Router')
        expect(output).toContain('High Priority')
        expect(output).toContain('Low Priority')
        expect(output).toContain('inside_loop')
        expect(output).toContain('branch 0')
        expect(output).toContain('branch 1')

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validation)).toContain('✅')
        expect(text(validation)).toContain('ready to publish')
    })

    it('40. Scenario 6 — Full lifecycle: create → configure → validate → structure check', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Lifecycle Test')

        const emptyValidation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(emptyValidation)).toContain('⚠️')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Transform',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async () => { return { result: 42 * 2 }; };',
            input: {},
        })

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validation)).toContain('✅')
        expect(text(validation)).toContain('ready to publish')
        expect(text(validation)).toContain('2 valid')

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('configured')
        expect(text(structure)).not.toContain('invalid')
        expect(text(structure)).not.toContain('unconfigured')
    })

    it('41. ap_get_piece_props — schema introspection returns field keys, types, and required status', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-email',
            actionOrTriggerName: 'send_email',
            type: 'action',
        })

        const output = text(result)
        expect(output).toContain('"name": "to"')
        expect(output).toContain('"required": true')
        expect(output).toContain('"type": "SHORT_TEXT"')
        expect(output).toContain('"name": "subject"')
        expect(output).toContain('"name": "folder"')
        expect(output).toContain('"type": "DROPDOWN"')
        expect(output).toContain('"required": false')
    })

    it('42. ap_validate_step_config — PIECE action with missing required fields returns specific field names', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'PIECE_ACTION',
            pieceName: '@activepieces/piece-test-email',
            actionName: 'send_email',
            input: {},
        })

        const output = text(result)
        expect(output).toContain('to')
        expect(output).toContain('subject')
    })

    it('43. ap_list_flows — returns success response', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apListFlowsTool(mcp, mockLog).execute({})
        expect(text(result)).toContain('✅')
    })

    it('44. Trigger update repeatedly without losing config — simulates agent retry loop', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Retry Loop Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        for (let i = 0; i < 5; i++) {
            await apUpdateTriggerTool(mcp, mockLog).execute({
                flowId,
                pieceName: '@activepieces/piece-test-email',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
                displayName: `Attempt ${i + 1}`,
            })
        }

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId })
        expect(text(validation)).toContain('✅')

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('Attempt 5')
        expect(text(structure)).toContain('configured')
    })

    // ── ap_build_flow — batch flow creation ──────────────────────────

    it('45. ap_build_flow — creates trigger + CODE step, all valid', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apBuildFlowTool(mcp, mockLog).execute({
            flowName: 'Build Test 1',
            trigger: {
                pieceName: '@activepieces/piece-test-email',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
            },
            steps: [
                {
                    type: FlowActionType.CODE,
                    displayName: 'Process',
                    sourceCode: 'export const code = async () => { return { ok: true }; };',
                    input: {},
                },
            ],
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('2 steps')
        expect(text(result)).toContain('all valid')
    })

    it('46. ap_build_flow — creates trigger + multiple steps in correct order', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apBuildFlowTool(mcp, mockLog).execute({
            flowName: 'Build Test 2',
            trigger: {
                pieceName: '@activepieces/piece-test-email',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
            },
            steps: [
                {
                    type: FlowActionType.CODE,
                    displayName: 'Step A',
                    sourceCode: 'export const code = async () => { return { a: 1 }; };',
                    input: {},
                },
                {
                    type: FlowActionType.CODE,
                    displayName: 'Step B',
                    sourceCode: 'export const code = async () => { return { b: 2 }; };',
                    input: {},
                },
                {
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    loopItems: '{{step_1.items}}',
                },
            ],
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('4 steps')

        const flowId = text(result).match(/\(id: (\S+?)\)/)?.[1]
        expect(flowId).toBeDefined()

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId: flowId! })
        const output = text(structure)
        expect(output).toContain('Step A')
        expect(output).toContain('Step B')
        expect(output).toContain('Loop')
        expect(output).toContain('step_1')
        expect(output).toContain('step_2')
        expect(output).toContain('step_3')
    })

    it('47. ap_build_flow — partial success: invalid steps reported', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apBuildFlowTool(mcp, mockLog).execute({
            flowName: 'Build Test Partial',
            trigger: {
                pieceName: '@activepieces/piece-test-email',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
            },
            steps: [
                {
                    type: FlowActionType.CODE,
                    displayName: 'Valid Code',
                    sourceCode: 'export const code = async () => { return {}; };',
                    input: {},
                },
                {
                    type: FlowActionType.PIECE,
                    displayName: 'Invalid Piece',
                    pieceName: '@activepieces/piece-test-email',
                    pieceVersion: '~0.1.0',
                },
            ],
        })

        expect(text(result)).toContain('⚠️')
        expect(text(result)).toContain('step_2')
        expect(text(result)).toContain('invalid')
    })

    it('48. ap_build_flow — empty steps array creates trigger-only flow', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apBuildFlowTool(mcp, mockLog).execute({
            flowName: 'Build Test Empty',
            trigger: {
                pieceName: '@activepieces/piece-test-email',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
            },
            steps: [],
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('1 step')
    })

    it('49. ap_build_flow — flow can be validated and published after creation', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apBuildFlowTool(mcp, mockLog).execute({
            flowName: 'Build Test Lifecycle',
            trigger: {
                pieceName: '@activepieces/piece-test-email',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
            },
            steps: [
                {
                    type: FlowActionType.CODE,
                    displayName: 'Compute',
                    sourceCode: 'export const code = async () => { return { x: 42 }; };',
                    input: {},
                },
            ],
        })

        expect(text(result)).toContain('✅')
        const flowId = text(result).match(/\(id: (\S+?)\)/)?.[1]
        expect(flowId).toBeDefined()

        const validation = await apValidateFlowTool(mcp, mockLog).execute({ flowId: flowId! })
        expect(text(validation)).toContain('✅')
        expect(text(validation)).toContain('ready to publish')
    })

    // ── ap_flow_structure — step input visibility ────────────────────

    it('50. ap_flow_structure — shows CODE step sourceCode and input in output', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Structure Input Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'My Code',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async (inputs) => { return { msg: inputs.name }; };',
            input: { name: '{{trigger.from}}' },
        })

        const result = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(result)

        expect(output).toContain('sourceCode:')
        expect(output).toContain('inputs.name')
        expect(output).toContain('input:')
        expect(output).toContain('{{trigger.from}}')
    })

    it('51. ap_flow_structure — shows LOOP step loopItems expression', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Loop Items Visibility Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.LOOP_ON_ITEMS,
            displayName: 'My Loop',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            loopItems: '{{trigger.items}}',
        })

        const result = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(result)

        expect(output).toContain('loopItems: {{trigger.items}}')
    })

    it('52. ap_flow_structure — shows router branch conditions', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Router Condition Visibility Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        await apAddBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchName: 'VIP',
            conditions: [[{
                firstValue: '{{trigger.type}}',
                operator: 'TEXT_EXACTLY_MATCHES',
                secondValue: 'vip',
            }]],
        })

        const result = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(result)

        expect(output).toContain('VIP')
        expect(output).toContain('conditions:')
        expect(output).toContain('{{trigger.type}}')
        expect(output).toContain('TEXT_EXACTLY_MATCHES')
        expect(output).toContain('vip')
    })

    // ── ap_duplicate_flow ────────────────────────────────────────────

    it('53. ap_duplicate_flow — duplicates a flow with all steps preserved', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Original Flow')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Transform',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async () => { return { x: 42 }; };',
            input: {},
        })

        const dupResult = await apDuplicateFlowTool(mcp, mockLog).execute({ flowId })
        const dupOutput = text(dupResult)

        expect(dupOutput).toContain('✅')
        expect(dupOutput).toContain('Copy of Original Flow')

        const copyFlowId = dupOutput.match(/Copy: ".*?" \(id: (\S+?)\)/)?.[1]
        expect(copyFlowId).toBeDefined()

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId: copyFlowId! })
        const structOutput = text(structure)
        expect(structOutput).toContain('Copy of Original Flow')
        expect(structOutput).toContain('step_1')
        expect(structOutput).toContain('Transform')
        expect(structOutput).toContain('configured')
    })

    it('54. ap_duplicate_flow — uses custom name when provided', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Source Flow')

        const dupResult = await apDuplicateFlowTool(mcp, mockLog).execute({
            flowId,
            name: 'My Custom Copy',
        })

        expect(text(dupResult)).toContain('✅')
        expect(text(dupResult)).toContain('My Custom Copy')
    })

    it('55. ap_duplicate_flow — returns error for non-existent flow', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apDuplicateFlowTool(mcp, mockLog).execute({ flowId: 'nonexistent123' })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('not found')
    })

    it('56. ap_duplicate_flow — original flow is not modified', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Immutable Original')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        const structBefore = text(await apFlowStructureTool(mcp, mockLog).execute({ flowId }))

        await apDuplicateFlowTool(mcp, mockLog).execute({ flowId })

        const structAfter = text(await apFlowStructureTool(mcp, mockLog).execute({ flowId }))

        expect(structAfter).toContain('Immutable Original')
        expect(structBefore).toEqual(structAfter)
    })

    it('57. ap_duplicate_flow — preserves router with branches and steps inside', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Router Dup Source')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
            branchIndex: 0,
            stepType: FlowActionType.CODE,
            displayName: 'Branch Code',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_2',
            sourceCode: 'export const code = async () => { return { branch: true }; };',
            input: {},
        })

        const dupResult = await apDuplicateFlowTool(mcp, mockLog).execute({ flowId })
        const copyFlowId = text(dupResult).match(/Copy: ".*?" \(id: (\S+?)\)/)?.[1]
        expect(copyFlowId).toBeDefined()

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId: copyFlowId! })
        const output = text(structure)
        expect(output).toContain('My Router')
        expect(output).toContain('ROUTER')
        expect(output).toContain('Branch Code')
        expect(output).toContain('branch 0')
    })

    // ── ap_update_branch ─────────────────────────────────────────────

    it('58. ap_update_branch — sets conditions on a branch', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Update Branch Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
            branchName: 'VIP Branch',
            conditions: [[{
                firstValue: '{{trigger.type}}',
                operator: 'TEXT_EXACTLY_MATCHES',
                secondValue: 'vip',
            }]],
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('VIP Branch')
        expect(text(result)).toContain('1 OR group')

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(structure)
        expect(output).toContain('VIP Branch')
        expect(output).toContain('{{trigger.type}}')
        expect(output).toContain('TEXT_EXACTLY_MATCHES')
    })

    it('59. ap_update_branch — renames a branch without changing conditions', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Rename Branch Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
            branchName: 'Renamed Branch',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Renamed Branch')

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        expect(text(structure)).toContain('Renamed Branch')
    })

    it('60. ap_update_branch — rejects setting conditions on fallback branch', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Fallback Guard Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        // Branch 1 is the fallback (Otherwise)
        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 1,
            conditions: [[{ firstValue: 'test', operator: 'EXISTS' }]],
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('fallback')
    })

    it('61. ap_update_branch — allows renaming the fallback branch', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Fallback Rename Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 1,
            branchName: 'Default Case',
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('Default Case')
    })

    it('62. ap_update_branch — rejects non-router step', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Non-Router Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'My Code',
        })

        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
            branchName: 'Test',
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('not a ROUTER')
    })

    it('63. ap_update_branch — rejects out-of-range branch index', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'OOB Index Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 99,
            branchName: 'Test',
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('out of range')
    })

    it('64. ap_update_branch — rejects empty update (no name or conditions)', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Empty Update Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
        })

        expect(text(result)).toContain('❌')
        expect(text(result)).toContain('Nothing to update')
    })

    it('65. ap_update_branch — preserves steps inside the branch after condition update', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Preserve Steps Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'My Router',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
            branchIndex: 0,
            stepType: FlowActionType.CODE,
            displayName: 'Inner Code',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_2',
            sourceCode: 'export const code = async () => { return { inside: true }; };',
            input: {},
        })

        // Update the branch conditions — step_2 should survive
        await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
            branchName: 'Updated Branch',
            conditions: [[{
                firstValue: '{{trigger.status}}',
                operator: 'TEXT_EXACTLY_MATCHES',
                secondValue: 'active',
            }]],
        })

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(structure)

        expect(output).toContain('Updated Branch')
        expect(output).toContain('Inner Code')
        expect(output).toContain('step_2')
        expect(output).toContain('branch 0')
        expect(output).toContain('{{trigger.status}}')
    })

    it('66. ap_update_branch — handles complex multi-group conditions', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Complex Conditions Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.ROUTER,
            displayName: 'Complex Router',
        })

        // Set conditions with 2 OR groups, first group has 2 AND conditions
        const result = await apUpdateBranchTool(mcp, mockLog).execute({
            flowId,
            routerStepName: 'step_1',
            branchIndex: 0,
            conditions: [
                [
                    { firstValue: '{{trigger.status}}', operator: 'TEXT_EXACTLY_MATCHES', secondValue: 'active' },
                    { firstValue: '{{trigger.role}}', operator: 'TEXT_CONTAINS', secondValue: 'admin' },
                ],
                [
                    { firstValue: '{{trigger.override}}', operator: 'EXISTS' },
                ],
            ],
        })

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain('2 OR group')

        const structure = await apFlowStructureTool(mcp, mockLog).execute({ flowId })
        const output = text(structure)
        expect(output).toContain('TEXT_EXACTLY_MATCHES')
        expect(output).toContain('TEXT_CONTAINS')
        expect(output).toContain('AND')
        expect(output).toContain('OR')
        expect(output).toContain('EXISTS')
    })

    // ── ARRAY item schema exposure ───────────────────────────────────

    it('67. ap_get_piece_props — ARRAY property includes item sub-schemas', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apGetPiecePropsTool(mcp, mockLog).execute({
            pieceName: '@activepieces/piece-test-array',
            actionOrTriggerName: 'action_with_array',
            type: 'action',
        })

        const output = text(result)
        expect(output).toContain('✅')
        expect(output).toContain('ARRAY')
        expect(output).toContain('"items"')
        expect(output).toContain('"name": "name"')
        expect(output).toContain('"name": "value"')
        expect(output).toContain('SHORT_TEXT')
        expect(output).toContain('NUMBER')
    })

    // ── ap_list_flows with filters ───────────────────────────────────

    it('68. ap_list_flows — respects limit parameter', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Flow 1' })
        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Flow 2' })
        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Flow 3' })

        const result = await apListFlowsTool(mcp, mockLog).execute({ limit: 2 })
        const output = text(result)

        expect(output).toContain('✅')
        expect(output).toContain('2 flow(s)')
    })

    it('69. ap_list_flows — filters by name', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Alpha Flow' })
        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Beta Flow' })
        await apCreateFlowTool(mcp, mockLog).execute({ flowName: 'Alpha Two' })

        const result = await apListFlowsTool(mcp, mockLog).execute({ name: 'Alpha' })
        const output = text(result)

        expect(output).toContain('filtered')
        expect(output).toContain('Alpha')
        expect(output).not.toContain('Beta Flow')
    })

    // ── ROUTER validation UX ─────────────────────────────────────────

    it('70. ap_validate_step_config — ROUTER with empty settings gives helpful example', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'ROUTER',
        })

        const output = text(result)
        expect(output).toContain('⚠️')
        expect(output).toContain('executionType')
        expect(output).toContain('EXECUTE_FIRST_MATCH')
        expect(output).toContain('CONDITION')
        expect(output).toContain('FALLBACK')
    })

    it('71. ap_validate_step_config — ROUTER with valid settings passes', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apValidateStepConfigTool(mcp, mockLog).execute({
            stepType: 'ROUTER',
            settings: {
                branches: [
                    { branchName: 'B1', branchType: 'CONDITION', conditions: [[{ firstValue: '{{trigger.x}}', operator: 'EXISTS' }]] },
                    { branchName: 'Otherwise', branchType: 'FALLBACK' },
                ],
                executionType: 'EXECUTE_FIRST_MATCH',
            },
        })

        expect(text(result)).toContain('✅')
    })

    // ── Published flow warning ────────────────────────────────────────

    it('72. ap_add_step — warns when flow is published', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const flowId = await createFlowAndGetId(mcp, 'Published Flow Test')

        await apUpdateTriggerTool(mcp, mockLog).execute({
            flowId,
            pieceName: '@activepieces/piece-test-email',
            pieceVersion: '~0.1.0',
            triggerName: 'new_email',
        })

        await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'trigger',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Pre-publish Code',
        })

        await apUpdateStepTool(mcp, mockLog).execute({
            flowId,
            stepName: 'step_1',
            sourceCode: 'export const code = async () => { return { ok: true }; };',
            input: {},
        })

        await apLockAndPublishTool(mcp, mockLog).execute({ flowId })

        const result = await apAddStepTool(mcp, mockLog).execute({
            flowId,
            parentStepName: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            stepType: FlowActionType.CODE,
            displayName: 'Post-publish Code',
        })

        expect(text(result)).toContain('published')
        expect(text(result)).toContain('draft')
        expect(text(result)).toContain('ap_lock_and_publish')
    })

    // ── Error sanitization ───────────────────────────────────────────

    it('73. mcpToolError — sanitizes internal paths from error messages', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        // Simulate what mcpUtils.mcpToolError does with internal paths
        const fakeError = new Error('Cannot find module at /root/codes/abc123/step_1/index.js and /root/common/node_modules/.bun/@activepieces+piece-slack@0.16.2/lib.js')
        const result = mcpUtils.mcpToolError('Test', fakeError)
        const output = text(result)

        expect(output).not.toContain('/root/codes/')
        expect(output).not.toContain('/root/common/')
        expect(output).not.toContain('.bun/')
        expect(output).toContain('<sandbox>')
        expect(output).toContain('<internal>')
    })
})
