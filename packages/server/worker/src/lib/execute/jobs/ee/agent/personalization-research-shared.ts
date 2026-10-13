import { CHAT_SUGGESTION_CARD_IMAGE_IDS } from '@activepieces/shared'
import { z } from 'zod'

export const MIN_USE_CASES = 12

export const MAX_USE_CASES = 20

export const TITLE_HARD_MAX_CHARS = 60

export const MAX_DISPLAY_NAME_CHARS = 50

export const PROFILE_SCHEMA = z.object({
    companyName: z.string(),
    displayName: z.string(),
    website: z.string(),
    description: z.string(),
    industry: z.string(),
    userRole: z.string().nullable(),
    roleConfidence: z.enum(['low', 'medium', 'high']).nullable(),
})

export const CARDS_SCHEMA = z.object({
    useCases: z.array(z.object({
        id: z.string(),
        title: z.string(),
        prompt: z.string(),
        imageId: z.enum(CHAT_SUGGESTION_CARD_IMAGE_IDS),
        app: z.string().nullable(),
        kind: z.enum(['mission', 'routine']),
    })),
})

export type PersonalizationUseCaseResult = {
    id: string
    title: string
    prompt: string
    imageId: typeof CHAT_SUGGESTION_CARD_IMAGE_IDS[number]
    app?: string
    kind?: 'mission' | 'routine'
}
