import { ApEdition } from '../../core/flag/flag'

/**
 * Single source of truth for whether the AI chat is visible to a given user.
 * Used by the backend gate and by the platform endpoint (which feeds the
 * frontend `plan.chatEnabled`). Cloud opens chat to everyone during the capped
 * beta (`cloudRolloutOpen`) and keeps it for anyone who already chatted
 * (`userHasChatted`, grandfathered) once the cap closes.
 */
function resolveChatEnabled({ edition, isEmbedded, planChatEnabled, cloudRolloutOpen, userHasChatted }: ResolveChatEnabledParams): boolean {
    if (isEmbedded) {
        return false
    }
    if (edition === ApEdition.CLOUD) {
        return planChatEnabled || cloudRolloutOpen || userHasChatted
    }
    if (edition === ApEdition.ENTERPRISE) {
        return planChatEnabled
    }
    return false
}

export const chatVisibility = {
    resolveChatEnabled,
}

export type ResolveChatEnabledParams = {
    edition: ApEdition
    isEmbedded: boolean
    planChatEnabled: boolean
    cloudRolloutOpen: boolean
    userHasChatted: boolean
}
