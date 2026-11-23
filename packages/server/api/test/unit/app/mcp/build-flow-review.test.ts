import { PropertyType } from '@activepieces/pieces-framework'
import { FlowActionType, FlowTrigger, FlowTriggerType, PropertyExecutionType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getOrThrow, executePropertyResolution } = vi.hoisted(() => ({ getOrThrow: vi.fn(), executePropertyResolution: vi.fn() }))

vi.mock('../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: (): { getOrThrow: typeof getOrThrow } => ({ getOrThrow }),
}))

vi.mock('../../../../src/app/mcp/tools/mcp-utils', () => ({
    mcpUtils: { executePropertyResolution },
}))

import { system } from '../../../../src/app/helper/system/system'
import { buildFlowReview } from '../../../../src/app/mcp/tools/build-flow-review'

const log = system.globalLogger()

const COLUMNS = {
    A: { type: PropertyType.SHORT_TEXT, displayName: 'Email', required: false },
    B: { type: PropertyType.SHORT_TEXT, displayName: 'Name', required: false },
}

function resolve(values: Record<string, unknown>): ReturnType<typeof buildFlowReview.resolveDropdownLabels> {
    return buildFlowReview.resolveDropdownLabels({
        pieceName: '@activepieces/piece-google-sheets',
        pieceVersion: '1.0.0',
        componentName: 'insert_row',
        componentType: 'action',
        stepName: 'step_1',
        input: { values },
        projectId: 'project-1',
        platformId: 'platform-1',
        log,
    })
}

describe('buildFlowReview.resolveDropdownLabels on a dynamic field', () => {
    beforeEach(() => {
        executePropertyResolution.mockClear()
        getOrThrow.mockResolvedValue({ actions: { insert_row: { props: { values: { type: PropertyType.DYNAMIC, displayName: 'Values', required: true } } } }, triggers: {} })
        executePropertyResolution.mockResolvedValue({ status: 'dynamic', props: COLUMNS })
    })

    it('maps keys written as column names to their real keys', async () => {
        const result = await resolve({ email: '{{trigger.email}}', Name: 'Ada' })

        expect(result.input).toEqual({ values: { A: '{{trigger.email}}', B: 'Ada' } })
        expect(result.resolved).toEqual(['step_1.values: key "email" → "A"', 'step_1.values: key "Name" → "B"'])
        expect(result.problems).toEqual([])
        expect(result.propertySettings).toEqual({ values: { type: PropertyExecutionType.MANUAL, schema: COLUMNS } })
        expect(executePropertyResolution).toHaveBeenCalledTimes(1)
    })

    it('keeps real keys and reports a key that matches no field', async () => {
        const result = await resolve({ A: 'x', Phone: '123' })

        expect(result.input).toEqual({ values: { A: 'x', Phone: '123' } })
        expect(result.resolved).toEqual([])
        expect(result.problems).toEqual([{ step: 'step_1', field: 'values', message: 'unknown key "Phone", valid keys: A (Email), B (Name)' }])
    })

    it('leaves the value untouched when the schema cannot be resolved', async () => {
        executePropertyResolution.mockResolvedValue({ status: 'failed', message: 'no auth' })

        const result = await resolve({ Email: 'x' })

        expect(result.input).toEqual({ values: { Email: 'x' } })
        expect(result.problems).toEqual([])
    })
})

describe('buildFlowReview.findProblems', () => {
    beforeEach(() => {
        getOrThrow.mockImplementation(async ({ name }: { name: string }) => {
            if (name === MISSING_PIECE) {
                throw new Error('piece not found')
            }
            return { actions: { send_email: { props: {} } }, triggers: { catch_webhook: { props: {} } } }
        })
    })

    it('reports an invalid piece step whose action is not on the piece', async () => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName: 'does_not_exist', valid: false }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log })

        expect(problems).toEqual([{ step: 'step_1', message: 'invalid configuration: action not found on this piece' }])
    })

    it('reports an invalid piece step with no action selected', async () => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName: undefined, valid: false }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log })

        expect(problems).toEqual([{ step: 'step_1', message: 'invalid configuration: no action selected' }])
    })

    it('reports a plain invalid configuration when the piece metadata cannot be loaded', async () => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName: 'send_email', valid: false, pieceName: MISSING_PIECE }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log })

        expect(problems).toEqual([{ step: 'step_1', message: 'invalid configuration' }])
    })

    it('reports nothing for a valid piece step', async () => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName: 'send_email', valid: true }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log })

        expect(problems).toEqual([])
    })
})

function flowWithAction({ actionName, valid, pieceName = '@activepieces/piece-gmail' }: { actionName: string | undefined, valid: boolean, pieceName?: string }): FlowTrigger {
    return {
        name: 'trigger',
        valid: true,
        displayName: 'Catch Webhook',
        lastUpdatedDate: '2024-01-01T00:00:00Z',
        type: FlowTriggerType.PIECE,
        settings: { pieceName: '@activepieces/piece-webhook', pieceVersion: '~0.1.0', triggerName: 'catch_webhook', input: {}, propertySettings: {} },
        nextAction: {
            name: 'step_1',
            valid,
            displayName: 'Send Email',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowActionType.PIECE,
            settings: { pieceName, pieceVersion: '~0.1.0', actionName, input: {}, propertySettings: {} },
        },
    }
}

const MISSING_PIECE = '@activepieces/piece-missing'
