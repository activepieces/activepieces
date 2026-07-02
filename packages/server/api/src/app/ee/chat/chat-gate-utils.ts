import { PersistedChatMessage, PersistedChatPartType, PersistedToolCallPart, PersistedToolCallStatus } from '@activepieces/shared'

// The persisted PENDING tool-call card in uiMessages is the source of truth for a parked gate's
// existence, kind, and routing. This finds it by gateId (== toolCallId) so park/answer/recovery all
// agree on whether a gate is still open and what tool opened it.
function findPendingGatePart({ uiMessages, gateId }: { uiMessages: PersistedChatMessage[], gateId: string }): PersistedToolCallPart | null {
    for (const message of uiMessages) {
        for (const part of message.parts) {
            if (part.type === PersistedChatPartType.TOOL_CALL && part.toolCallId === gateId && part.status === PersistedToolCallStatus.PENDING) {
                return part
            }
        }
    }
    return null
}

// Returns the first still-PENDING gate card in the conversation (there is at most one open gate per
// conversation at a time), used by crash recovery to decide park-vs-resume without a gateId in hand.
function findAnyPendingGatePart({ uiMessages }: { uiMessages: PersistedChatMessage[] }): PersistedToolCallPart | null {
    for (const message of uiMessages) {
        for (const part of message.parts) {
            if (part.type === PersistedChatPartType.TOOL_CALL && part.status === PersistedToolCallStatus.PENDING) {
                return part
            }
        }
    }
    return null
}

export const chatGateUtils = {
    findPendingGatePart,
    findAnyPendingGatePart,
}
