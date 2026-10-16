import { createHash } from 'node:crypto'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

function isOnForConversation({ conversationId }: { conversationId: string }): boolean {
    if (system.get(AppSystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT) {
        return true
    }
    if (system.getEdition() !== ApEdition.CLOUD) {
        return false
    }
    return bucketOf({ conversationId }) < ROLLOUT_PERCENT
}

function bucketOf({ conversationId }: { conversationId: string }): number {
    return createHash('sha256').update(conversationId).digest().readUInt32BE(0) % 100
}

const ROLLOUT_PERCENT = 10

export const taskAgentsRollout = {
    isOnForConversation,
    ROLLOUT_PERCENT,
}
