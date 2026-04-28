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
    UNAUTHORIZED = 'unauthorized',
    USER_HOURLY_LIMIT_REACHED = 'user_hourly_limit_reached',
    PLATFORM_DAILY_LIMIT_REACHED = 'platform_daily_limit_reached',
    PLATFORM_UNAVAILABLE = 'platform_unavailable',
    SERVICE_PAUSED = 'service_paused',
    COPILOT_UNREACHABLE = 'copilot_unreachable',
    CONTENT_POLICY = 'content_policy',
}

export const PLATFORM_COPILOT_LIMITS = {
    maxMessageChars: 4000,
    maxHistoryContentChars: 8000,
    maxHistoryMessages: 50,
} as const
