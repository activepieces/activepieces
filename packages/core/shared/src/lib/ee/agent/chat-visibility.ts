import { ApEdition } from '../../core/flag/flag'

function resolveChatEnabled({ edition, isEmbedded, planChatEnabled }: ResolveChatEnabledParams): boolean {
    if (isEmbedded) {
        return false
    }
    if (edition === ApEdition.CLOUD) {
        return true
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
}
