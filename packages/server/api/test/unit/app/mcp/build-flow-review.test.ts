import { FlowActionType, FlowTrigger, FlowTriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { buildFlowReview } from '../../../../src/app/mcp/tools/build-flow-review'

vi.mock('../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({
        getOrThrow: async ({ name }: { name: string }) => {
            if (name === MISSING_PIECE) {
                throw new Error('piece not found')
            }
            return { actions: { send_email: { props: {} } }, triggers: { catch_webhook: { props: {} } } }
        },
    }),
}))

describe('buildFlowReview.findProblems', () => {
    it.each([
        { title: 'whose action is not on the piece', actionName: 'does_not_exist', message: 'invalid configuration: action not found on this piece' },
        { title: 'with no action selected', actionName: undefined, message: 'invalid configuration: no action selected' },
    ])('reports an invalid piece step $title', async ({ actionName, message }) => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName, valid: false }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log: LOG })

        expect(problems).toEqual([{ step: 'step_1', message }])
    })

    it('reports a plain invalid configuration when the piece metadata cannot be loaded', async () => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName: 'send_email', valid: false, pieceName: MISSING_PIECE }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log: LOG })

        expect(problems).toEqual([{ step: 'step_1', message: 'invalid configuration' }])
    })

    it('reports nothing for a valid piece step', async () => {
        const problems = await buildFlowReview.findProblems({ trigger: flowWithAction({ actionName: 'send_email', valid: true }), invalidReasons: new Map(), labelProblems: [], platformId: 'platform', log: LOG })

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

const LOG: FastifyBaseLogger = {
    level: 'silent',
    silent: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    trace: () => undefined,
    fatal: () => undefined,
    child: () => LOG,
}

const MISSING_PIECE = '@activepieces/piece-missing'
