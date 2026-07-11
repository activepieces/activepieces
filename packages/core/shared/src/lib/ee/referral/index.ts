import { BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

export enum ReferralPhraseStatus {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED',
}

export enum ReferralRedemptionStatus {
    RELEASED = 'RELEASED',
    REJECTED = 'REJECTED',
    CAPPED = 'CAPPED',
}

export enum ReferralSceneAction {
    ENTER = 'enter',
    APPROACH = 'approach',
    INTO = 'into',
    ONTO = 'onto',
    GIVE = 'give',
    ORBIT = 'orbit',
    CIRCLE = 'circle',
    CHASE = 'chase',
    UNDER = 'under',
    OVER = 'over',
    RISE = 'rise',
    FALL = 'fall',
    BECOME = 'become',
    PEEK = 'peek',
    GAZE = 'gaze',
    REACT = 'react',
    TREMBLE = 'tremble',
    NUDGE = 'nudge',
    POP_OUT = 'popOut',
    SPIN = 'spin',
    CELEBRATE = 'celebrate',
    TOGETHER = 'together',
}

export const ReferralSceneBeat = z.object({
    a: z.number().int().min(0),
    do: z.enum([
        ReferralSceneAction.ENTER,
        ReferralSceneAction.APPROACH,
        ReferralSceneAction.INTO,
        ReferralSceneAction.ONTO,
        ReferralSceneAction.GIVE,
        ReferralSceneAction.ORBIT,
        ReferralSceneAction.CIRCLE,
        ReferralSceneAction.CHASE,
        ReferralSceneAction.UNDER,
        ReferralSceneAction.OVER,
        ReferralSceneAction.RISE,
        ReferralSceneAction.FALL,
        ReferralSceneAction.BECOME,
        ReferralSceneAction.PEEK,
        ReferralSceneAction.GAZE,
        ReferralSceneAction.REACT,
        ReferralSceneAction.TREMBLE,
        ReferralSceneAction.NUDGE,
        ReferralSceneAction.POP_OUT,
        ReferralSceneAction.SPIN,
        ReferralSceneAction.CELEBRATE,
        ReferralSceneAction.TOGETHER,
    ]),
    t: z.number().int().min(0).optional(),
})
export type ReferralSceneBeat = z.infer<typeof ReferralSceneBeat>

export const ReferralPhrase = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    userId: z.string(),
    displayPhrase: z.string(),
    normalizedPhrase: z.string(),
    phraseHash: z.string(),
    status: z.enum([ReferralPhraseStatus.ACTIVE, ReferralPhraseStatus.DISABLED]),
    celebrationEmojis: Nullable(z.array(z.string())),
    celebrationScene: Nullable(z.array(ReferralSceneBeat)),
    // The cinematic hero show: a generated illustration depicting the phrase's literal absurd scene.
    // We store the file id (not a URL) and mint a fresh signed read URL at redemption so it never
    // expires; celebrationScenePrompt is the literal description the model authored, kept for regen.
    celebrationImageFileId: Nullable(z.string()),
    celebrationScenePrompt: Nullable(z.string()),
})
export type ReferralPhrase = z.infer<typeof ReferralPhrase>

export const ReferralRedemption = z.object({
    ...BaseModelSchema,
    referralPhraseId: z.string(),
    inviterPlatformId: z.string(),
    redeemerPlatformId: z.string(),
    redeemerUserId: z.string(),
    status: z.enum([
        ReferralRedemptionStatus.RELEASED,
        ReferralRedemptionStatus.REJECTED,
        ReferralRedemptionStatus.CAPPED,
    ]),
    inviterGrantUsd: z.number().int(),
    redeemerGrantUsd: z.number().int(),
})
export type ReferralRedemption = z.infer<typeof ReferralRedemption>

export const ReferralStatus = z.object({
    displayPhrase: Nullable(z.string()),
    referralCount: z.number().int(),
    earnedUsd: z.number().int(),
    remainingUsd: z.number().int(),
    capUsd: z.number().int(),
})
export type ReferralStatus = z.infer<typeof ReferralStatus>

export const REFERRAL_GRANT_USD = 10
export const REFERRAL_CAP_USD = 250
export const REFERRAL_MAX_ACCOUNT_AGE_DAYS = 14
