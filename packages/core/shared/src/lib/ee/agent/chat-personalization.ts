import { BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

export enum ChatPersonalizationStatus {
    UNSET = 'UNSET',
    PENDING = 'PENDING',
    RESEARCHING = 'RESEARCHING',
    READY = 'READY',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
    DISMISSED_LEGACY = 'DISMISSED_LEGACY',
}

export enum ChatPersonalizationScope {
    COMPANY = 'company',
    USER = 'user',
}

const CHAT_PERSONALIZATION_STATUSES = [
    ChatPersonalizationStatus.UNSET,
    ChatPersonalizationStatus.PENDING,
    ChatPersonalizationStatus.RESEARCHING,
    ChatPersonalizationStatus.READY,
    ChatPersonalizationStatus.FAILED,
    ChatPersonalizationStatus.SKIPPED,
    ChatPersonalizationStatus.DISMISSED_LEGACY,
] as const

const TERMINAL_UNASKED_STATUSES: ReadonlySet<ChatPersonalizationStatus> = new Set([
    ChatPersonalizationStatus.SKIPPED,
    ChatPersonalizationStatus.DISMISSED_LEGACY,
])

const PERSONAL_PLATFORM_NAME_SUFFIX = /['’]s Platform$/
const FALLBACK_PLATFORM_NAME = 'My Platform'

function shouldAskOnboarding({ status }: { status: ChatPersonalizationStatus }): boolean {
    return status === ChatPersonalizationStatus.UNSET
}

function hasAnsweredOnboarding({ status }: { status: ChatPersonalizationStatus }): boolean {
    return !TERMINAL_UNASKED_STATUSES.has(status) && status !== ChatPersonalizationStatus.UNSET
}

function isPersonalDefaultPlatformName(name: string): boolean {
    const trimmed = name.trim()
    return trimmed === FALLBACK_PLATFORM_NAME || PERSONAL_PLATFORM_NAME_SUFFIX.test(trimmed)
}

function companyFromPlatformName(name: string | null | undefined): string | null {
    if (name === null || name === undefined) {
        return null
    }
    const trimmed = name.trim()
    if (trimmed.length === 0 || isPersonalDefaultPlatformName(trimmed)) {
        return null
    }
    return trimmed
}

export const CHAT_SUGGESTION_CARD_IMAGE_IDS = [
    'answer-customers',
    'chase-late-payers',
    'chase-leads',
    'clone-me',
    'close-deals',
    'do-my-hiring',
    'do-research',
    'fill-pipeline',
    'get-invoices-paid',
    'grow-following',
    'make-slides',
    'onboard-signups',
    'plan-week',
    'prep-meetings',
    'run-my-day',
    'run-socials',
    'squash-bugs',
    'take-from-rivals',
    'tame-inbox',
    'win-back-customers',
    'write-emails',
    'write-posts',
    'write-reports',
] as const

export const PersonalizationUseCase = z.object({
    id: z.string(),
    title: z.string(),
    prompt: z.string(),
    imageId: z.enum(CHAT_SUGGESTION_CARD_IMAGE_IDS),
    app: z.string().optional(),
    kind: z.enum(['mission', 'routine']).optional(),
})
export type PersonalizationUseCase = z.infer<typeof PersonalizationUseCase>

export const PersonalizationProfile = z.object({
    companyName: z.string(),
    displayName: z.string(),
    website: z.string(),
    description: z.string(),
    industry: z.string(),
    userRole: z.string().optional(),
    roleConfidence: z.enum(['low', 'medium', 'high']).optional(),
})
export type PersonalizationProfile = z.infer<typeof PersonalizationProfile>

export const PersonalizationPrefill = z.object({
    role: Nullable(z.string()),
    confidence: Nullable(z.enum(['low', 'medium', 'high'])),
})
export type PersonalizationPrefill = z.infer<typeof PersonalizationPrefill>

export const ChatPersonalization = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    userId: Nullable(z.string()),
    domain: Nullable(z.string()),
    companyText: Nullable(z.string()),
    role: Nullable(z.string()),
    status: z.enum(CHAT_PERSONALIZATION_STATUSES),
    researchToken: Nullable(z.string()),
    profile: Nullable(PersonalizationProfile),
    useCases: Nullable(z.array(PersonalizationUseCase)),
})
export type ChatPersonalization = z.infer<typeof ChatPersonalization>

export const UpsertChatPersonalizationRequest = z.object({
    website: z.string().trim().max(255).optional(),
    role: z.string().trim().max(120).optional(),
    personalize: z.boolean(),
})
export type UpsertChatPersonalizationRequest = z.infer<typeof UpsertChatPersonalizationRequest>

export const ChatPersonalizationView = z.object({
    status: z.enum(CHAT_PERSONALIZATION_STATUSES),
    personalStatus: z.enum(CHAT_PERSONALIZATION_STATUSES),
    scope: z.enum([ChatPersonalizationScope.COMPANY, ChatPersonalizationScope.USER]),
    useCases: z.array(PersonalizationUseCase),
    profile: Nullable(PersonalizationProfile),
    companyInput: Nullable(z.string()),
    roleInput: Nullable(z.string()),
    prefill: Nullable(PersonalizationPrefill),
})
export type ChatPersonalizationView = z.infer<typeof ChatPersonalizationView>

export const ChatPersonalizationProgressEvent = z.object({
    platformId: z.string(),
    scope: z.enum([ChatPersonalizationScope.COMPANY, ChatPersonalizationScope.USER]),
    phase: z.string(),
    message: z.string(),
    done: z.boolean(),
    result: ChatPersonalizationView.optional(),
    prefill: PersonalizationPrefill.optional(),
})
export type ChatPersonalizationProgressEvent = z.infer<typeof ChatPersonalizationProgressEvent>

export const chatPersonalizationUtils = {
    shouldAskOnboarding,
    hasAnsweredOnboarding,
    isPersonalDefaultPlatformName,
    companyFromPlatformName,
}

export type ChatSuggestionCardImageId = typeof CHAT_SUGGESTION_CARD_IMAGE_IDS[number]
