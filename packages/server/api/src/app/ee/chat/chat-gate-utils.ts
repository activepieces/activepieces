import { isNil } from '@activepieces/core-utils'
import { PersistedChatMessage, PersistedChatPartType, PersistedChatRole, PersistedToolCallPart, PersistedToolCallStatus } from '@activepieces/shared'

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

// The LIVE open gate for crash recovery (Fix R3b): a PENDING card that belongs to the LATEST
// assistant message. A fossil card the user abandoned by sending a new message is now SUPERSEDED
// (Fix R3a) and, even absent that, sits on an earlier assistant message — so scanning ALL history
// would let it hijack every future crash into a park (silent lost turns). Anchoring to the trailing
// assistant message means only a gate from the run that actually crashed parks the turn; anything
// older lets crash-resume proceed.
function findLiveGatePart({ uiMessages }: { uiMessages: PersistedChatMessage[] }): PersistedToolCallPart | null {
    const lastMessage = uiMessages[uiMessages.length - 1]
    if (isNil(lastMessage) || lastMessage.role !== PersistedChatRole.ASSISTANT) {
        return null
    }
    for (const part of lastMessage.parts) {
        if (part.type === PersistedChatPartType.TOOL_CALL && part.status === PersistedToolCallStatus.PENDING) {
            return part
        }
    }
    return null
}

export const chatGateUtils = {
    findPendingGatePart,
    findLiveGatePart,
}
