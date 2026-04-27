import { ApEdition } from '../core/flag/flag'

export type PlatformCopilotChatRequest = {
    message: string
    conversationHistory: { role: 'user' | 'assistant', content: string }[]
}

export type PlatformCopilotRegisterRequest = {
    platformId: string
    edition: ApEdition
    version: string
}

export type PlatformCopilotRegisterResponse = {
    copilotApiKey: string
}

export enum PlatformCopilotErrorCode {
    USER_DAILY_LIMIT_REACHED = 'user_daily_limit_reached',
    PLATFORM_DAILY_LIMIT_REACHED = 'platform_daily_limit_reached',
    PLATFORM_UNAVAILABLE = 'platform_unavailable',
    SERVICE_PAUSED = 'service_paused',
    COPILOT_UNREACHABLE = 'copilot_unreachable',
    CONTENT_POLICY = 'content_policy',
}
