import { FlowActionType, FlowOperationType, FlowTriggerType } from '@activepieces/shared'
import type { FlowOperationRequest, FlowVersion, UpdateActionRequest } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => {
    const piece = {
        auth: undefined,
        actions: {
            create_record: { name: 'create_record', props: {}, requireAuth: false },
            create_record_ai: { name: 'create_record_ai', props: {}, requireAuth: false, audience: 'ai' },
        },
    }
    return {
        pieceMetadataService: vi.fn(() => ({
            get: vi.fn().mockResolvedValue(piece),
            getOrThrow: vi.fn().mockResolvedValue(piece),
        })),
    }
})

import { flowVersionValidationUtil } from '../../../../../src/app/flows/flow-version/flow-version-validator-util'
import { createMockFlowVersion } from '../../../../helpers/mocks'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

describe('flowVersionValidationUtil.prepareRequest', () => {
    it('rejects adding an AI-only action as a flow step', async () => {
        await expect(prepare({ request: addPieceStep({ actionName: 'create_record_ai' }) })).rejects.toThrow(/only for chat/)
    })

    it('rejects switching an existing step to an AI-only action', async () => {
        const flowVersion = flowWithStep({ actionName: 'create_record' })
        await expect(prepare({ request: updatePieceStep({ actionName: 'create_record_ai' }), flowVersion })).rejects.toThrow(/only for chat/)
    })

    it('keeps an existing AI-only step saveable but invalid', async () => {
        const flowVersion = flowWithStep({ actionName: 'create_record_ai' })
        const prepared = await prepare({ request: updatePieceStep({ actionName: 'create_record_ai' }), flowVersion })
        expect(prepared).toMatchObject({ type: FlowOperationType.UPDATE_ACTION, request: { valid: false } })
    })

    it('marks an imported chat-only step invalid even when the import says valid', async () => {
        const { trigger } = flowWithStep({ actionName: 'create_record_ai' })
        const prepared = await prepare({ request: { type: FlowOperationType.IMPORT_FLOW, request: { displayName: 'Imported', trigger, schemaVersion: null, notes: null } } })
        expect(prepared).toMatchObject({ type: FlowOperationType.IMPORT_FLOW, request: { trigger: { nextAction: { valid: false } } } })
    })

    it('keeps an imported normal step valid', async () => {
        const { trigger } = flowWithStep({ actionName: 'create_record' })
        const prepared = await prepare({ request: { type: FlowOperationType.IMPORT_FLOW, request: { displayName: 'Imported', trigger, schemaVersion: null, notes: null } } })
        expect(prepared).toMatchObject({ type: FlowOperationType.IMPORT_FLOW, request: { trigger: { nextAction: { valid: true } } } })
    })

    it('accepts a normal action', async () => {
        const prepared = await prepare({ request: addPieceStep({ actionName: 'create_record' }) })
        expect(prepared.type).toBe(FlowOperationType.ADD_ACTION)
    })
})

function prepare({ request, flowVersion }: { request: FlowOperationRequest, flowVersion?: FlowVersion }): Promise<FlowOperationRequest> {
    return flowVersionValidationUtil(log).prepareRequest({ platformId: 'platform-1', userId: 'user-1', request, flowVersion })
}

function flowWithStep({ actionName }: { actionName: string }): FlowVersion {
    return createMockFlowVersion({
        trigger: {
            type: FlowTriggerType.EMPTY,
            name: 'trigger',
            settings: {},
            valid: false,
            displayName: 'Select Trigger',
            nextAction: { ...pieceStep({ actionName }), valid: true },
        },
    })
}

function addPieceStep({ actionName }: { actionName: string }): FlowOperationRequest {
    return { type: FlowOperationType.ADD_ACTION, request: { parentStep: 'trigger', action: pieceStep({ actionName }) } }
}

function updatePieceStep({ actionName }: { actionName: string }): FlowOperationRequest {
    return { type: FlowOperationType.UPDATE_ACTION, request: pieceStep({ actionName }) }
}

function pieceStep({ actionName }: { actionName: string }): UpdateActionRequest {
    return {
        name: 'step_1',
        type: FlowActionType.PIECE,
        displayName: 'Create Record',
        valid: false,
        settings: {
            pieceName: '@activepieces/piece-airtable',
            pieceVersion: '0.9.2',
            actionName,
            input: {},
            propertySettings: {},
        },
    }
}
