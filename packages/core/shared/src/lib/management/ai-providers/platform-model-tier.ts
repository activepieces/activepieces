import { AIProviderName, ApId, BaseModelSchema, DateOrString, formErrors, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

const LIMITS = {
    maxEntries: 5,
    nameMaxLength: 40,
    descriptionMaxLength: 120,
    emojiMaxLength: 16,
    minThinkingBudget: 1024,
    maxThinkingBudget: 64000,
} as const

function isOffOrEnoughToThink(budget: number): boolean {
    return budget === 0 || budget >= LIMITS.minThinkingBudget
}

function hasNoDuplicateEntries(entries: { configId: string, modelId: string }[]): boolean {
    return new Set(entries.map((entry) => `${entry.configId}:${entry.modelId}`)).size === entries.length
}

const TierName = z.string().trim().min(1, formErrors.required).max(LIMITS.nameMaxLength, formErrors.tierNameTooLong)
const TierEmoji = z.string().min(1, formErrors.required).max(LIMITS.emojiMaxLength, formErrors.invalidEmoji).regex(/^(\p{Extended_Pictographic}|\p{Regional_Indicator})/u, formErrors.invalidEmoji)
const TierDescription = z.string().trim().max(LIMITS.descriptionMaxLength, formErrors.tierDescriptionTooLong)
const TierThinkingBudget = z.number().int(formErrors.wholeNumber).max(LIMITS.maxThinkingBudget, formErrors.tierThinkingBudgetInvalid)
    .refine(isOffOrEnoughToThink, formErrors.tierThinkingBudgetInvalid)

export const PlatformModelTierEntry = z.object({
    configId: ApId,
    modelId: z.string().min(1, formErrors.required).max(256),
})

const TierEntries = z.array(PlatformModelTierEntry)
    .min(1, formErrors.atLeastOne)
    .max(LIMITS.maxEntries, formErrors.tierTooManyModels)
    .refine(hasNoDuplicateEntries, formErrors.tierDuplicateModel)

export const PlatformModelTier = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    name: z.string(),
    emoji: z.string(),
    description: Nullable(z.string()),
    position: z.number().int(),
    entries: z.array(PlatformModelTierEntry),
    isDefault: z.boolean(),
    isFast: z.boolean(),
    thinkingBudget: Nullable(z.number().int()),
    deleted: Nullable(DateOrString),
    replacedBy: Nullable(ApId),
})

export const PlatformModelTierSummary = z.object({
    id: ApId,
    name: z.string(),
    emoji: z.string(),
    description: Nullable(z.string()),
    position: z.number().int(),
    isDefault: z.boolean(),
    isFast: z.boolean(),
    mainModel: Nullable(z.object({
        provider: z.enum(AIProviderName),
        modelId: z.string(),
    })),
    fallbackCount: z.number().int(),
})

export const CreatePlatformModelTierRequest = z.object({
    name: TierName,
    emoji: TierEmoji,
    description: Nullable(TierDescription),
    entries: TierEntries,
    thinkingBudget: Nullable(TierThinkingBudget),
})

export const UpdatePlatformModelTierRequest = z.object({
    name: TierName.optional(),
    emoji: TierEmoji.optional(),
    description: Nullable(TierDescription),
    entries: TierEntries.optional(),
    thinkingBudget: Nullable(TierThinkingBudget),
    isDefault: z.literal(true).optional(),
    isFast: z.literal(true).optional(),
})

export const ReorderPlatformModelTiersRequest = z.object({
    tierIds: z.array(ApId).min(1, formErrors.atLeastOne),
})

export const DeletePlatformModelTierRequest = z.object({
    replacedBy: z.optional(ApId),
})

export type PlatformModelTierEntry = z.infer<typeof PlatformModelTierEntry>
export type PlatformModelTier = z.infer<typeof PlatformModelTier>
export type PlatformModelTierSummary = z.infer<typeof PlatformModelTierSummary>
export type CreatePlatformModelTierRequest = z.infer<typeof CreatePlatformModelTierRequest>
export type UpdatePlatformModelTierRequest = z.infer<typeof UpdatePlatformModelTierRequest>
export type ReorderPlatformModelTiersRequest = z.infer<typeof ReorderPlatformModelTiersRequest>
export type DeletePlatformModelTierRequest = z.infer<typeof DeletePlatformModelTierRequest>
