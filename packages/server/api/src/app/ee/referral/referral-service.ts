import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import {
    REFERRAL_CAP_USD,
    REFERRAL_GRANT_USD,
    REFERRAL_MAX_ACCOUNT_AGE_DAYS,
    ReferralPhraseStatus,
    ReferralRedemptionStatus,
    ReferralSceneBeat,
    ReferralStatus,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Not } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { distributedLock } from '../../database/redis-connections'
import { platformRepo } from '../../platform/platform.service'
import { referralUtils } from './referral-flags'
import { referralMatcher } from './referral-matcher'
import { ReferralPhraseEntity } from './referral-phrase.entity'
import { ReferralRedemptionEntity } from './referral-redemption.entity'
import { referralSideEffects } from './referral-side-effects'

const CANDIDATE_CACHE_TTL_MS = 60_000

const referralPhraseRepo = repoFactory(ReferralPhraseEntity)
const referralRedemptionRepo = repoFactory(ReferralRedemptionEntity)

let candidateCache: CandidateCache | null = null
let candidateLoadPromise: Promise<void> | null = null

export const referralService = (log: FastifyBaseLogger) => ({
    async getOrCreatePhrase(params: GetOrCreatePhraseParams): Promise<GetOrCreatePhraseResult> {
        return createOrGetPhrase(params, log)
    },

    async getInviterStatus(params: InviterStatusParams): Promise<ReferralStatus> {
        return getInviterStatus(params)
    },

    async detectAndResolve(params: DetectParams): Promise<RedemptionResult> {
        if (!referralUtils.isReferralEnabled()) {
            return { outcome: 'no_match' }
        }
        await ensureCandidateCache()
        const cache = candidateCache
        if (isNil(cache) || cache.candidates.length === 0) {
            return { outcome: 'no_match' }
        }
        const match = referralMatcher.matchPhrase({
            text: params.text,
            candidates: cache.candidates.map((candidate) => ({ id: candidate.id, normalizedPhrase: candidate.normalizedPhrase })),
        })
        if (isNil(match)) {
            return { outcome: 'no_match' }
        }
        const rich = cache.byId.get(match.candidate.id)
        if (isNil(rich)) {
            return { outcome: 'no_match' }
        }
        return resolveRedemption({
            rich,
            redeemerPlatformId: params.redeemerPlatformId,
            redeemerUserId: params.redeemerUserId,
            log,
        })
    },
})

async function createOrGetPhrase({ platformId, userId, proposedDisplayPhrase, replace, emojis, scene, scenePrompt, projectId }: GetOrCreatePhraseParams, log: FastifyBaseLogger): Promise<GetOrCreatePhraseResult> {
    const existing = await referralPhraseRepo().findOneBy({ userId })
    if (!isNil(existing) && replace !== true) {
        return { status: 'existing', displayPhrase: existing.displayPhrase }
    }
    const celebrationEmojis = sanitizeCelebrationEmojis(emojis)
    const celebrationScene = sanitizeCelebrationScene({ scene, castSize: celebrationEmojis?.length ?? 0 })
    const displayPhrase = proposedDisplayPhrase.trim().replace(/\s+/g, ' ')
    const normalizedPhrase = referralMatcher.normalize(displayPhrase)
    if (!referralMatcher.isPhraseShaped(normalizedPhrase)) {
        return { status: 'invalid' }
    }
    // "Must rhyme" is enforced here, not just in the prompt — a rhyme-less line bounces back to the
    // model with no_rhyme so it is forced to rebuild around a real rhyme before anything persists.
    if (!referralMatcher.hasRhyme(normalizedPhrase)) {
        return { status: 'no_rhyme' }
    }
    // Guarantee a real gap: reject a candidate that sits within the matcher's combined tolerance of
    // any OTHER phrase (exclude the user's own row when reissuing), so no two phrases' acceptance
    // balls ever overlap. The scan spans all users, so the check+write runs under a single global
    // lock — without it two near-duplicate phrases claimed at the same instant both pass the O(N)
    // scan (only the exact normalizedPhrase is unique-constrained) and both persist. Claims are rare,
    // so a global lock is fine; hero-image generation is kept OUTSIDE the lock so a slow (~10s)
    // generation never holds it. Fresh read (not the 60s cache) closes the same-instant window.
    const result = await distributedLock(log).runExclusive({
        key: 'referral_phrase_issue',
        timeoutInSeconds: 15,
        fn: async (): Promise<GetOrCreatePhraseResult> => {
            const activePhrases = await referralPhraseRepo().find({
                select: { normalizedPhrase: true },
                where: { status: ReferralPhraseStatus.ACTIVE, userId: Not(userId) },
            })
            const tooClose = activePhrases.some((row) => !referralMatcher.areSafelyDistinct(normalizedPhrase, row.normalizedPhrase))
            if (tooClose) {
                return { status: 'too_similar' }
            }

            // Reissue: keep the SAME row so redemptions (linked by referralPhraseId) and earnings stay
            // intact — just swap the text. The old text stops matching; only FUTURE allies use the new one.
            if (!isNil(existing)) {
                const { error } = await tryCatch(async () => referralPhraseRepo().update(existing.id, {
                    displayPhrase,
                    normalizedPhrase,
                    phraseHash: referralMatcher.hash(normalizedPhrase),
                    // Always overwritten (even to null): the emoji cast belongs to the phrase text, so a
                    // stale cast must never survive a reissue.
                    celebrationEmojis,
                    celebrationScene,
                }))
                if (!isNil(error)) {
                    return { status: 'collision' }
                }
                candidateCache = null
                // Fire-and-forget: don't block the phrase reveal on ~10s of image generation. The image
                // lands in the background well before any friend redeems; the inviter's own instant preview
                // uses the gradient fallback until then.
                void storeHeroImage({ userId, platformId, projectId, phrase: displayPhrase, scenePrompt, log }).catch(() => { /* best-effort */ })
                return { status: 'replaced', displayPhrase }
            }

            const { error } = await tryCatch(async () => referralPhraseRepo().insert({
                id: apId(),
                platformId,
                userId,
                displayPhrase,
                normalizedPhrase,
                phraseHash: referralMatcher.hash(normalizedPhrase),
                status: ReferralPhraseStatus.ACTIVE,
                celebrationEmojis,
                celebrationScene,
            }))
            if (!isNil(error)) {
                const existingAfter = await referralPhraseRepo().findOneBy({ userId })
                if (!isNil(existingAfter)) {
                    return { status: 'existing', displayPhrase: existingAfter.displayPhrase }
                }
                return { status: 'collision' }
            }
            candidateCache = null
            return { status: 'created', displayPhrase }
        },
    })
    // Outside the lock: a slow hero-image generation must never block other claimants.
    if (result.status === 'created') {
        await storeHeroImage({ userId, platformId, projectId, phrase: displayPhrase, scenePrompt, log })
    }
    return result
}

// Paint + store the phrase's hero scene (best-effort; a failure leaves the phrase working with the
// gradient fallback). Blocks the mint by a few seconds — a deliberate, one-time moment.
async function storeHeroImage({ userId, platformId, projectId, phrase, scenePrompt, log }: {
    userId: string
    platformId: string
    projectId?: string
    phrase: string
    scenePrompt?: string
    log: FastifyBaseLogger
}): Promise<void> {
    const hero = await referralSideEffects(log).generateHeroImage({ platformId, projectId, phrase, scenePrompt })
    if (isNil(hero)) {
        return
    }
    await tryCatch(async () => referralPhraseRepo().update({ userId }, {
        celebrationImageFileId: hero.fileId,
        celebrationScenePrompt: hero.scenePrompt,
    }))
    candidateCache = null
}

async function getInviterStatus({ userId, platformId }: InviterStatusParams): Promise<ReferralStatus> {
    const phrase = await referralPhraseRepo().findOneBy({ userId })
    const earnedUsd = await sumInviterGrants(platformId)
    const referralCount = await referralRedemptionRepo().countBy({ inviterPlatformId: platformId })
    return {
        displayPhrase: phrase?.displayPhrase ?? null,
        referralCount,
        earnedUsd,
        remainingUsd: Math.max(0, REFERRAL_CAP_USD - earnedUsd),
        capUsd: REFERRAL_CAP_USD,
    }
}

async function resolveRedemption({ rich, redeemerPlatformId, redeemerUserId, log }: ResolveParams): Promise<RedemptionResult> {
    if (rich.inviterPlatformId === redeemerPlatformId) {
        return { outcome: 'self_referral', displayPhrase: rich.displayPhrase, celebrationEmojis: rich.celebrationEmojis ?? undefined, celebrationScene: rich.celebrationScene ?? undefined, celebrationImageFileId: rich.celebrationImageFileId ?? undefined }
    }
    const eligible = await isRedeemerEligible(redeemerPlatformId)
    if (!eligible) {
        return { outcome: 'ineligible_account', displayPhrase: rich.displayPhrase }
    }
    const existing = await referralRedemptionRepo().findOneBy({ redeemerPlatformId })
    if (!isNil(existing)) {
        return { outcome: 'already_redeemed', displayPhrase: rich.displayPhrase }
    }

    return distributedLock(log).runExclusive({
        key: `referral_resolve_${rich.inviterPlatformId}`,
        timeoutInSeconds: 60,
        fn: async () => {
            const already = await referralRedemptionRepo().findOneBy({ redeemerPlatformId })
            if (!isNil(already)) {
                return { outcome: 'already_redeemed', displayPhrase: rich.displayPhrase }
            }

            const earnedUsd = await sumInviterGrants(rich.inviterPlatformId)
            const inviterGrantUsd = Math.min(REFERRAL_GRANT_USD, Math.max(0, REFERRAL_CAP_USD - earnedUsd))
            const redeemerGrantUsd = REFERRAL_GRANT_USD
            const status = inviterGrantUsd > 0 ? ReferralRedemptionStatus.RELEASED : ReferralRedemptionStatus.CAPPED

            const { error: insertError } = await tryCatch(async () => referralRedemptionRepo().insert({
                id: apId(),
                referralPhraseId: rich.id,
                inviterPlatformId: rich.inviterPlatformId,
                redeemerPlatformId,
                redeemerUserId,
                status,
                inviterGrantUsd,
                redeemerGrantUsd,
            }))
            if (!isNil(insertError)) {
                return { outcome: 'already_redeemed', displayPhrase: rich.displayPhrase }
            }

            const { error: grantError } = await tryCatch(async () => {
                await referralSideEffects(log).grantAiCredits({ platformId: redeemerPlatformId, amountInUsd: redeemerGrantUsd })
                await referralSideEffects(log).grantAiCredits({ platformId: rich.inviterPlatformId, amountInUsd: inviterGrantUsd })
            })
            if (!isNil(grantError)) {
                await referralRedemptionRepo().delete({ redeemerPlatformId })
                throw grantError
            }

            return {
                outcome: 'released',
                displayPhrase: rich.displayPhrase,
                inviterGrantUsd,
                redeemerGrantUsd,
                capReached: inviterGrantUsd === 0,
                celebrationEmojis: rich.celebrationEmojis ?? undefined,
                celebrationScene: rich.celebrationScene ?? undefined,
                celebrationImageFileId: rich.celebrationImageFileId ?? undefined,
            }
        },
    })
}

async function isRedeemerEligible(platformId: string): Promise<boolean> {
    const platform = await platformRepo().findOneBy({ id: platformId })
    if (isNil(platform)) {
        return false
    }
    return dayjs().diff(dayjs(platform.created), 'day') <= REFERRAL_MAX_ACCOUNT_AGE_DAYS
}

const MAX_CELEBRATION_EMOJIS = 4

function sanitizeCelebrationEmojis(emojis: string[] | undefined): string[] | null {
    if (isNil(emojis)) {
        return null
    }
    const cleaned = emojis
        .filter((emoji): emoji is string => typeof emoji === 'string')
        .map((emoji) => emoji.trim())
        .filter((emoji) => emoji.length > 0 && emoji.length <= 16)
        .slice(0, MAX_CELEBRATION_EMOJIS)
    return cleaned.length > 0 ? cleaned : null
}

const MAX_CELEBRATION_BEATS = 9
const CELEBRATION_ACTIONS = new Set(['enter', 'approach', 'into', 'onto', 'give', 'orbit', 'circle', 'chase', 'under', 'over', 'rise', 'fall', 'become', 'peek', 'gaze', 'react', 'tremble', 'nudge', 'popOut', 'spin', 'celebrate', 'together'])

// The model authors the scene beat-sheet; trust nothing. Keep only beats whose action is in the
// closed vocabulary and whose actor/target indices point at real cast members, cap the length, and
// collapse to null if nothing survives (the frontend then falls back to a structural read).
function sanitizeCelebrationScene({ scene, castSize }: { scene: unknown[] | undefined, castSize: number }): ReferralSceneBeat[] | null {
    if (isNil(scene) || castSize === 0) {
        return null
    }
    const cleaned: ReferralSceneBeat[] = []
    for (const raw of scene) {
        if (typeof raw !== 'object' || isNil(raw)) {
            continue
        }
        const beat = raw as Record<string, unknown>
        const action = beat['do']
        const actor = beat['a']
        const target = beat['t']
        if (typeof action !== 'string' || !CELEBRATION_ACTIONS.has(action)) {
            continue
        }
        if (typeof actor !== 'number' || !Number.isInteger(actor) || actor < 0 || actor >= castSize) {
            continue
        }
        const hasTarget = typeof target === 'number' && Number.isInteger(target) && target >= 0 && target < castSize && target !== actor
        cleaned.push({
            a: actor,
            do: action as ReferralSceneBeat['do'],
            ...(hasTarget ? { t: target } : {}),
        })
        if (cleaned.length >= MAX_CELEBRATION_BEATS) {
            break
        }
    }
    return cleaned.length > 0 ? cleaned : null
}

async function sumInviterGrants(inviterPlatformId: string): Promise<number> {
    const result = await referralRedemptionRepo()
        .createQueryBuilder('redemption')
        .select('COALESCE(SUM(redemption.inviterGrantUsd), 0)', 'total')
        .where('redemption.inviterPlatformId = :inviterPlatformId', { inviterPlatformId })
        .getRawOne<{ total: string }>()
    return Number(result?.total ?? 0)
}

async function ensureCandidateCache(): Promise<void> {
    const isFresh = !isNil(candidateCache) && (Date.now() - candidateCache.loadedAt) < CANDIDATE_CACHE_TTL_MS
    if (isFresh) {
        return
    }
    if (!isNil(candidateLoadPromise)) {
        await candidateLoadPromise
        return
    }
    candidateLoadPromise = loadCandidateCache()
    try {
        await candidateLoadPromise
    }
    finally {
        candidateLoadPromise = null
    }
}

async function loadCandidateCache(): Promise<void> {
    const rows = await referralPhraseRepo().findBy({ status: ReferralPhraseStatus.ACTIVE })
    const candidates: RichCandidate[] = rows.map((row) => ({
        id: row.id,
        normalizedPhrase: row.normalizedPhrase,
        inviterPlatformId: row.platformId,
        inviterUserId: row.userId,
        displayPhrase: row.displayPhrase,
        celebrationEmojis: row.celebrationEmojis ?? null,
        celebrationScene: row.celebrationScene ?? null,
        celebrationImageFileId: row.celebrationImageFileId ?? null,
    }))
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))
    candidateCache = { candidates, byId, loadedAt: Date.now() }
}

type RichCandidate = {
    id: string
    normalizedPhrase: string
    inviterPlatformId: string
    inviterUserId: string
    displayPhrase: string
    celebrationEmojis: string[] | null
    celebrationScene: ReferralSceneBeat[] | null
    celebrationImageFileId: string | null
}

type CandidateCache = {
    candidates: RichCandidate[]
    byId: Map<string, RichCandidate>
    loadedAt: number
}

type GetOrCreatePhraseParams = {
    platformId: string
    userId: string
    proposedDisplayPhrase: string
    replace?: boolean
    emojis?: string[]
    scene?: unknown[]
    scenePrompt?: string
    projectId?: string
}

type GetOrCreatePhraseResult =
    | { status: 'created', displayPhrase: string }
    | { status: 'existing', displayPhrase: string }
    | { status: 'replaced', displayPhrase: string }
    | { status: 'collision' }
    | { status: 'too_similar' }
    | { status: 'invalid' }
    | { status: 'no_rhyme' }

type InviterStatusParams = {
    userId: string
    platformId: string
}

type DetectParams = {
    redeemerPlatformId: string
    redeemerUserId: string
    text: string
}

type ResolveParams = {
    rich: RichCandidate
    redeemerPlatformId: string
    redeemerUserId: string
    log: FastifyBaseLogger
}

export type RedemptionOutcome = 'released' | 'already_redeemed' | 'self_referral' | 'ineligible_account' | 'no_match'

export type RedemptionResult = {
    outcome: RedemptionOutcome
    displayPhrase?: string
    inviterGrantUsd?: number
    redeemerGrantUsd?: number
    capReached?: boolean
    celebrationEmojis?: string[]
    celebrationScene?: ReferralSceneBeat[]
    celebrationImageFileId?: string
}
