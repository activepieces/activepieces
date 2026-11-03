import { isNil, omit } from '@activepieces/core-utils'
import { AgentEventEmitter, stableStringify } from './tools/tool-primitives'

function create({ eventEmitter }: { eventEmitter: AgentEventEmitter }): DeclinedActions {
    const declined = new Set<string>()
    const actionByGate = new Map<string, string>()
    const isDeclined = (gateId: string): boolean => {
        const action = actionByGate.get(gateId)
        return !isNil(action) && declined.has(action)
    }
    return {
        eventEmitter: {
            ...eventEmitter,
            emitActionPreview: (data) => {
                actionByGate.set(data.toolCallId, `${data.pieceName}:${data.actionName}:${stableStringify(omit(data.input, CARD_LABEL_KEYS))}`)
                if (!isDeclined(data.toolCallId)) {
                    eventEmitter.emitActionPreview(data)
                }
            },
        },
        isDeclined,
        recordDecision: ({ gateId, approved }) => {
            const action = actionByGate.get(gateId)
            if (!approved && !isNil(action)) {
                declined.add(action)
            }
        },
    }
}

export const declinedActions = {
    create,
}

type DeclinedActions = {
    eventEmitter: AgentEventEmitter
    isDeclined: (gateId: string) => boolean
    recordDecision: (input: { gateId: string, approved: boolean }) => void
}

const CARD_LABEL_KEYS = ['title', 'activeTitle', 'doneTitle']
