import { ActivepiecesError, apId, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import {
    ApEdition,
    ChatPersonalization,
    ChatPersonalizationScope,
    ChatPersonalizationStatus,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PersonalizationPrefill,
    PersonalizationProfile,
    PersonalizationScope,
    PersonalizationUseCase,
    SavePersonalizationResultRequest,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { z } from 'zod'
import { aiProviderService, ProviderScope } from '../../../ai/ai-provider-service'
import { redisConnections } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { assertCreditsAndAppSumoNotExceeded } from '../../../platform/billing-provider'
import { jobQueue, JobType } from '../../../workers/job-queue/job-queue'
import { agentHelpers } from '../agent-helpers'
import { findRow, IN_FLIGHT_STATUSES, personalizationRepo, ValidatedResult } from './personalization-rows'

export const PERSONALIZATION_PROVIDER_SCOPE: ProviderScope = { type: 'platform' }

export const RESEARCH_STALENESS_TIMEOUT_MS = 2 * 60 * 1_000


const RESEARCH_RUNS_PER_PLATFORM_PER_DAY = 5

const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60

export const PREFILL_TTL_SECONDS = 7 * 24 * 60 * 60


export function apolloApiKey(): string | null {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return null
    }
    const key = system.get(AppSystemProp.APOLLO_API_KEY)
    return isNil(key) || key.length === 0 ? null : key
}


export async function recoverIfStale({ row, platformId, userId, scope, log }: {
    row: ChatPersonalization | null
    platformId: string
    userId: string
    scope: ChatPersonalizationScope
    log: FastifyBaseLogger
}): Promise<ChatPersonalization | null> {
    if (isNil(row)) {
        return row
    }
    const inFlight = IN_FLIGHT_STATUSES.includes(row.status)
    const stale = Date.now() - new Date(row.updated).getTime() > RESEARCH_STALENESS_TIMEOUT_MS
    if (!inFlight || !stale) {
        return row
    }
    log.warn({ platform: { id: platformId }, user: { id: userId }, scope, stuckStatus: row.status }, '[chatPersonalization] Recovering stale in-flight research row')
    const researchToken = apId()
    const { error } = await tryCatch(async () => {
        const claimed = await takeOverStaleRow({ observed: row, researchToken })
        if (isNil(claimed)) {
            log.info({ platform: { id: platformId }, user: { id: userId }, scope }, '[chatPersonalization] Recovery abandoned, the row moved on while it was being read')
            return
        }
        const allowed = await guardsAllowResearch({ platformId, log })
        if (!allowed) {
            await personalizationRepo().update({ id: claimed.id, researchToken }, { status: ChatPersonalizationStatus.FAILED })
            return
        }
        await enqueueResearchJob({
            platformId,
            userId,
            scope,
            website: scope === ChatPersonalizationScope.COMPANY ? claimed.domain ?? null : null,
            companyText: scope === ChatPersonalizationScope.COMPANY ? claimed.companyText ?? null : null,
            role: claimed.role ?? null,
            researchToken,
            log,
        })
    })
    if (error) {
        log.warn({ error, platform: { id: platformId } }, '[chatPersonalization] Stale-row recovery failed')
        return row
    }
    return findRow({ platformId, userId: scope === ChatPersonalizationScope.COMPANY ? null : userId })
}


async function takeOverStaleRow({ observed, researchToken }: {
    observed: ChatPersonalization
    researchToken: string
}): Promise<ChatPersonalization | null> {
    const swapped = await personalizationRepo()
        .createQueryBuilder()
        .update()
        .set({ status: ChatPersonalizationStatus.PENDING, researchToken })
        .where('"id" = :id', { id: observed.id })
        .andWhere('"status" IN (:...inFlight)', { inFlight: IN_FLIGHT_STATUSES })
        .andWhere('"updated" < now() - (:staleMs || \' milliseconds\')::interval', { staleMs: RESEARCH_STALENESS_TIMEOUT_MS })
        .returning('*')
        .execute()
    return swapped.raw?.[0] ?? null
}


export async function startPrefillLookup({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const { error } = await tryCatch(async () => {
        if (isNil(apolloApiKey())) {
            return
        }
        const redis = await redisConnections.useExisting()
        const claimed = await redis.set(prefillLookupKey({ platformId, userId }), '1', 'EX', PREFILL_TTL_SECONDS, 'NX')
        if (claimed !== 'OK') {
            return
        }
        await enqueueResearchJob({
            platformId,
            userId,
            scope: ChatPersonalizationScope.COMPANY,
            website: null,
            companyText: null,
            role: null,
            researchToken: null,
            prefillOnly: true,
            log,
        })
        log.info({ platform: { id: platformId }, user: { id: userId } }, '[chatPersonalization] Prefill lookup enqueued')
    })
    if (error) {
        log.warn({ platform: { id: platformId }, user: { id: userId }, error }, '[chatPersonalization] Prefill lookup failed')
    }
}


export async function readPrefill({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<PersonalizationPrefill | null> {
    const { data, error } = await tryCatch(async () => {
        const redis = await redisConnections.useExisting()
        const raw = await redis.get(prefillKey({ platformId, userId }))
        if (isNil(raw)) {
            return null
        }
        const parsed = PersonalizationPrefill.safeParse(JSON.parse(raw))
        return parsed.success ? parsed.data : null
    })
    if (error) {
        log.warn({ platform: { id: platformId }, user: { id: userId }, error }, '[chatPersonalization] Prefill read failed')
        return null
    }
    return data
}


export async function claimForResearch({ platformId, userId, scope, researchToken }: { platformId: string, userId: string, scope: PersonalizationScope, researchToken: string | null }): Promise<boolean> {
    const scoped = scope === ChatPersonalizationScope.USER
        ? { platformId, userId }
        : { platformId, userId: IsNull() }
    const criteria = {
        ...scoped,
        status: ChatPersonalizationStatus.PENDING,
        ...(isNil(researchToken) ? {} : { researchToken }),
    }
    const updated = await personalizationRepo()
        .createQueryBuilder()
        .update()
        .set({ status: ChatPersonalizationStatus.RESEARCHING })
        .where(criteria)
        .returning('id')
        .execute()
    return (updated.raw?.length ?? 0) > 0
}


export async function guardsAllowResearch({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<boolean> {
    const chatProvider = await tryCatch(() => aiProviderService(log).getChatProvider({ platformId, scope: PERSONALIZATION_PROVIDER_SCOPE }))
    if (chatProvider.error) {
        log.warn({ platform: { id: platformId }, error: chatProvider.error }, '[chatPersonalization] Chat AI provider failed to load, skipping research')
        return false
    }
    if (isNil(chatProvider.data)) {
        log.warn({ platform: { id: platformId } }, '[chatPersonalization] No chat AI provider configured, skipping research')
        return false
    }
    const credits = await tryCatch(() => assertCreditsAndAppSumoNotExceeded({ platformId, log }))
    if (credits.error) {
        const exhausted = credits.error instanceof ActivepiecesError && credits.error.error.code === ErrorCode.QUOTA_EXCEEDED
        if (!exhausted) {
            log.warn({ platform: { id: platformId }, error: credits.error }, '[chatPersonalization] Credits check failed, allowing research')
        }
        else {
            log.warn({ platform: { id: platformId } }, '[chatPersonalization] Credits exhausted, skipping research')
            return false
        }
    }
    const { allowed, count } = await agentHelpers.incrementAndCheckLimit({
        key: `chat-personalization-runs:${platformId}`,
        limit: RESEARCH_RUNS_PER_PLATFORM_PER_DAY,
        ttlSeconds: RATE_LIMIT_TTL_SECONDS,
    })
    if (!allowed) {
        log.warn({ platform: { id: platformId }, runCount: count }, '[chatPersonalization] Daily research cap reached, skipping')
        return false
    }
    return true
}


export async function enqueueResearchJob({ platformId, userId, scope, website, companyText, role, researchToken, prefillOnly, log }: {
    platformId: string
    userId: string
    scope: PersonalizationScope
    website: string | null
    companyText: string | null
    role: string | null
    researchToken: string | null
    prefillOnly?: boolean
    log: FastifyBaseLogger
}): Promise<void> {
    await jobQueue(log).add({
        id: apId(),
        type: JobType.ONE_TIME,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            jobType: WorkerJobType.EXECUTE_PERSONALIZATION_RESEARCH,
            platformId,
            projectId: null,
            userId,
            scope,
            website,
            companyText,
            role,
            researchToken,
            prefillOnly: prefillOnly ?? false,
        },
    })
}


export function prefillKey({ platformId, userId }: { platformId: string, userId: string }): string {
    return `chat-personalization-prefill:${platformId}:${userId}`
}


function prefillLookupKey({ platformId, userId }: { platformId: string, userId: string }): string {
    return `chat-personalization-prefill-lookup:${platformId}:${userId}`
}


export function validateResult({ input, log }: { input: SavePersonalizationResultRequest, log: FastifyBaseLogger }): ValidatedResult {
    if (input.status !== 'READY') {
        return { status: ChatPersonalizationStatus.FAILED, profile: null, useCases: null }
    }
    const profile = PersonalizationProfile.safeParse(input.profile)
    const useCases = z.array(PersonalizationUseCase).min(1).safeParse(input.useCases)
    if (!profile.success || !useCases.success) {
        log.warn({
            platform: { id: input.platformId },
            profileValid: profile.success,
            useCasesValid: useCases.success,
        }, '[chatPersonalization] Research result failed validation, downgrading to FAILED')
        return { status: ChatPersonalizationStatus.FAILED, profile: null, useCases: null }
    }
    return { status: ChatPersonalizationStatus.READY, profile: profile.data, useCases: useCases.data }
}

