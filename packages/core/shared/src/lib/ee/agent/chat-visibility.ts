import { ApEdition } from '../../core/flag/flag'

function resolveChatEnabled({ edition, isEmbedded, planChatEnabled }: ResolveChatEnabledParams): boolean {
    const chatUnavailable = isEmbedded || edition === ApEdition.COMMUNITY
    return !chatUnavailable && planChatEnabled
}

export const chatVisibility = {
    resolveChatEnabled,
}

export type ResolveChatEnabledParams = {
    edition: ApEdition
    isEmbedded: boolean
    planChatEnabled: boolean
}
