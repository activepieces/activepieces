import { PropertyType } from '@activepieces/pieces-framework'
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
        getOrThrow.mockResolvedValue({ actions: { insert_row: { props: { values: { type: PropertyType.DYNAMIC, displayName: 'Values', required: true } } } }, triggers: {} })
        executePropertyResolution.mockResolvedValue({ status: 'dynamic', props: COLUMNS })
    })

    it('maps keys written as column names to their real keys', async () => {
        const result = await resolve({ email: '{{trigger.email}}', Name: 'Ada' })

        expect(result.input).toEqual({ values: { A: '{{trigger.email}}', B: 'Ada' } })
        expect(result.resolved).toEqual(['step_1.values: key "email" → "A"', 'step_1.values: key "Name" → "B"'])
        expect(result.problems).toEqual([])
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
