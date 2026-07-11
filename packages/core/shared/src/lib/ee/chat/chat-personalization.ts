import { BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

export enum ChatPersonalizationStatus {
    PENDING = 'PENDING',
    RESEARCHING = 'RESEARCHING',
    READY = 'READY',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
}

export enum ChatPersonalizationScope {
    COMPANY = 'company',
    USER = 'user',
}

// Single source of truth for the empty-state card art. MUST match the .webp
// files in packages/web/public/chat-suggestions/cards/ — the frontend derives
// its valid-id set from this const and a web test asserts the assets exist.
export const CHAT_SUGGESTION_CARD_IMAGE_IDS = [
    'answer-customers',
    'chase-late-payers',
    'chase-leads',
    'clone-me',
    'close-deals',
    'do-my-hiring',
    'fill-pipeline',
    'get-invoices-paid',
    'grow-following',
    'onboard-signups',
    'prep-meetings',
    'run-my-day',
    'run-socials',
    'squash-bugs',
    'take-from-rivals',
    'win-back-customers',
    'write-posts',
] as const

export const PersonalizationUseCase = z.object({
    id: z.string(),
    title: z.string(),
    prompt: z.string(),
    imageId: z.enum(CHAT_SUGGESTION_CARD_IMAGE_IDS),
    app: z.string().optional(),
    // 'mission' = bold one-time play, 'routine' = recurring job on autopilot —
    // surfaces as a subtle glyph on the card.
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

export const ChatPersonalization = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    userId: Nullable(z.string()),
    domain: Nullable(z.string()),
    // The role the person typed during onboarding — authoritative over any
    // researched/enriched guess.
    role: Nullable(z.string()),
    status: z.enum([
        ChatPersonalizationStatus.PENDING,
        ChatPersonalizationStatus.RESEARCHING,
        ChatPersonalizationStatus.READY,
        ChatPersonalizationStatus.FAILED,
        ChatPersonalizationStatus.SKIPPED,
    ]),
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
    status: z.enum([
        ChatPersonalizationStatus.PENDING,
        ChatPersonalizationStatus.RESEARCHING,
        ChatPersonalizationStatus.READY,
        ChatPersonalizationStatus.FAILED,
        ChatPersonalizationStatus.SKIPPED,
    ]),
    scope: z.enum([ChatPersonalizationScope.COMPANY, ChatPersonalizationScope.USER]),
    useCases: z.array(PersonalizationUseCase),
    profile: Nullable(PersonalizationProfile),
})
export type ChatPersonalizationView = z.infer<typeof ChatPersonalizationView>

// Payload for WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, emitted to
// the userId room. Defined here (not in automation/websocket) so the websocket
// module stays decoupled from ee/chat.
export const ChatPersonalizationProgressEvent = z.object({
    scope: z.enum([ChatPersonalizationScope.COMPANY, ChatPersonalizationScope.USER]),
    phase: z.string(),
    message: z.string(),
    done: z.boolean(),
    result: ChatPersonalizationView.optional(),
})
export type ChatPersonalizationProgressEvent = z.infer<typeof ChatPersonalizationProgressEvent>

export type ChatSuggestionCardImageId = typeof CHAT_SUGGESTION_CARD_IMAGE_IDS[number]
