import { ActivepiecesError, apId, ErrorCode, isNil, sanitizeObjectForPostgresql, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import {
    ApEdition,
    ChatPersonalization,
    ChatPersonalizationProgressEvent,
    ChatPersonalizationScope,
    ChatPersonalizationStatus,
    ChatPersonalizationView,
    GetPersonalizationConfigRequest,
    GetPersonalizationPrefillConfigRequest,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PersonalizationConfigResponse,
    PersonalizationPrefill,
    PersonalizationPrefillConfigResponse,
    PersonalizationProfile,
    PersonalizationScope,
    PersonalizationUseCase,
    PlatformRole,
    SavePersonalizationPrefillRequest,
    SavePersonalizationResultRequest,
    SendPersonalizationProgressRequest,
    WebsocketClientEvent,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { z } from 'zod'
import { aiProviderService, ProviderScope } from '../../../ai/ai-provider-service'
import { aiToolConfigService } from '../../../ai/ai-tool-config-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { websocketService } from '../../../core/websockets.service'
import { redisConnections } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { assertCreditsAndAppSumoNotExceeded } from '../../../platform/billing-provider'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { jobQueue, JobType } from '../../../workers/job-queue/job-queue'
import { agentHelpers } from '../agent-helpers'
import { ChatPersonalizationEntity } from './chat-personalization-entity'

const personalizationRepo = repoFactory(ChatPersonalizationEntity)

const PERSONALIZATION_PROVIDER_SCOPE: ProviderScope = { type: 'platform' }
const RESEARCH_STALENESS_TIMEOUT_MS = 2 * 60 * 1_000
const IN_FLIGHT_STATUSES = [ChatPersonalizationStatus.PENDING, ChatPersonalizationStatus.RESEARCHING]
const RESEARCH_RUNS_PER_PLATFORM_PER_DAY = 5
const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60
const PREFILL_TTL_SECONDS = 7 * 24 * 60 * 60

export const chatPersonalizationService = (log: FastifyBaseLogger) => ({

    async upsert({ platformId, userId, website, role: roleInput, personalize }: UpsertParams): Promise<ChatPersonalizationView> {
        const companyRow = await findRow({ platformId, userId: null })
        const trimmedInput = isNil(website) ? null : website.trim()
        const submittedCompany = !isNil(trimmedInput) && trimmedInput.length > 0
        const companyIsSet = !isNil(companyRow) && (!isNil(companyRow.domain) || !isNil(companyRow.companyText))
        const hasCompanyInput = submittedCompany
            && (!companyIsSet || await callerMayEditCompany({ platformId, userId, log }))
        const normalizedWebsite = hasCompanyInput ? normalizeWebsite({ input: trimmedInput }) : null
        const freeTextCompany = hasCompanyInput && isNil(normalizedWebsite) ? trimmedInput.slice(0, 255) : null
        const role = isNil(roleInput) ? null : normalizeRoleTitle({ input: roleInput })

        if (personalize && !hasCompanyInput && !isNil(companyRow)
            && (!isNil(companyRow.domain) || !isNil(companyRow.companyText))) {
            return this.upsertUserScope({ platformId, userId, companyRow, role })
        }

        let domain: string | null
        let companyText: string | null
        if (!isNil(normalizedWebsite)) {
            domain = normalizedWebsite
            companyText = null
        }
        else if (!isNil(freeTextCompany)) {
            domain = null
            companyText = freeTextCompany
        }
        else {
            domain = companyRow?.domain ?? null
            companyText = companyRow?.companyText ?? null
        }

        if (!personalize || (isNil(domain) && isNil(companyText))) {
            const cleared = {
                domain: null,
                companyText: null,
                role: null,
                status: ChatPersonalizationStatus.SKIPPED,
                profile: null,
                useCases: null,
            }
            await writeUserRow({ platformId, userId, patch: cleared })
            return this.getEffectiveView({ platformId, userId })
        }

        const inputsChanged = (companyRow?.domain ?? null) !== domain
            || (companyRow?.companyText ?? null) !== companyText

        if (
            companyRow?.status === ChatPersonalizationStatus.SKIPPED
            && !inputsChanged
            && (companyRow.useCases?.length ?? 0) > 0
        ) {
            await Promise.all([
                personalizationRepo().update({ id: companyRow.id }, { status: ChatPersonalizationStatus.READY }),
                personalizationRepo().update({ platformId, userId, useCases: Not(IsNull()) }, { status: ChatPersonalizationStatus.READY }),
            ])
            log.info({ platform: { id: platformId }, user: { id: userId } }, '[chatPersonalization] Restored stored personalization')
            return this.upsertUserScope({ platformId, userId, companyRow, role })
        }

        if (!isNil(companyRow) && !inputsChanged) {
            const fresh = Date.now() - new Date(companyRow.updated).getTime() < RESEARCH_STALENESS_TIMEOUT_MS
            const inFlight = IN_FLIGHT_STATUSES.includes(companyRow.status)
            if ((inFlight && fresh) || companyRow.status === ChatPersonalizationStatus.READY) {
                return this.upsertUserScope({ platformId, userId, companyRow, role })
            }
        }

        const allowed = await guardsAllowResearch({ platformId, log })
        if (!allowed) {
            const discardStaleResearch = inputsChanged ? { profile: null, useCases: null } : {}
            await writeCompanyRow({
                platformId,
                existing: companyRow,
                patch: { domain, companyText, status: ChatPersonalizationStatus.SKIPPED, ...discardStaleResearch },
            })
            await writeUserRow({
                platformId,
                userId,
                patch: { domain, companyText, role, status: ChatPersonalizationStatus.SKIPPED, ...discardStaleResearch },
            })
            return this.getEffectiveView({ platformId, userId })
        }

        const researchToken = apId()
        await writeCompanyRow({
            platformId,
            existing: companyRow,
            patch: {
                domain,
                companyText,
                status: ChatPersonalizationStatus.PENDING,
                researchToken,
                ...(inputsChanged ? { profile: null, useCases: null } : {}),
            },
        })

        await writeUserRow({
            platformId,
            userId,
            patch: {
                domain,
                companyText,
                role,
                status: ChatPersonalizationStatus.PENDING,
                researchToken,
                ...(inputsChanged ? { profile: null, useCases: null } : {}),
            },
        })

        await enqueueResearchJob({
            platformId,
            userId,
            scope: ChatPersonalizationScope.COMPANY,
            website: domain,
            companyText,
            role,
            researchToken,
            log,
        })
        log.info({ platform: { id: platformId }, user: { id: userId }, domain, companyText, role }, '[chatPersonalization] Company research enqueued')
        return this.getEffectiveView({ platformId, userId })
    },

    async upsertUserScope({ platformId, userId, companyRow, role }: { platformId: string, userId: string, companyRow: ChatPersonalization, role: string | null }): Promise<ChatPersonalizationView> {
        const researchToken = apId()
        const userRow = await findRow({ platformId, userId })
        if (!isNil(userRow)) {
            const fresh = Date.now() - new Date(userRow.updated).getTime() < RESEARCH_STALENESS_TIMEOUT_MS
            const terminal = [ChatPersonalizationStatus.READY, ChatPersonalizationStatus.SKIPPED].includes(userRow.status)
            const roleChanged = !isNil(role) && role !== userRow.role
            if (terminal || (fresh && !roleChanged)) {
                if (roleChanged) {
                    await personalizationRepo().update({ platformId, userId }, { role })
                }
                return this.getEffectiveView({ platformId, userId })
            }
            await personalizationRepo().update({ platformId, userId }, { status: ChatPersonalizationStatus.PENDING, researchToken, ...spreadIfDefined('role', role) })
        }
        else {
            const { error } = await tryCatch(() => personalizationRepo().insert({
                id: apId(),
                platformId,
                userId,
                domain: companyRow.domain,
                companyText: companyRow.companyText,
                role,
                status: ChatPersonalizationStatus.PENDING,
                researchToken,
                profile: null,
                useCases: null,
            }))
            if (error) {
                return this.getEffectiveView({ platformId, userId })
            }
        }
        const allowed = await guardsAllowResearch({ platformId, log })
        if (!allowed) {
            await personalizationRepo().update({ platformId, userId }, { status: ChatPersonalizationStatus.SKIPPED })
            return this.getEffectiveView({ platformId, userId })
        }
        await enqueueResearchJob({
            platformId,
            userId,
            scope: ChatPersonalizationScope.USER,
            website: null,
            companyText: null,
            role,
            researchToken,
            log,
        })
        log.info({ platform: { id: platformId }, user: { id: userId } }, '[chatPersonalization] User research enqueued')
        return this.getEffectiveView({ platformId, userId })
    },

    async getEffectiveView({ platformId, userId }: { platformId: string, userId: string }): Promise<ChatPersonalizationView> {
        const [foundUserRow, foundCompanyRow] = await Promise.all([
            findRow({ platformId, userId }),
            findRow({ platformId, userId: null }),
        ])
        const [userRow, companyRow] = await Promise.all([
            recoverIfStale({ row: foundUserRow, platformId, userId, scope: ChatPersonalizationScope.USER, log }),
            recoverIfStale({ row: foundCompanyRow, platformId, userId, scope: ChatPersonalizationScope.COMPANY, log }),
        ])
        const personalStatus = userRow?.status ?? ChatPersonalizationStatus.UNSET
        if (userRow?.status === ChatPersonalizationStatus.READY) {
            return toView({ row: userRow, scope: ChatPersonalizationScope.USER, inputsRow: companyRow ?? userRow, role: userRow.role ?? null, personalStatus, prefill: null })
        }
        if (!isNil(companyRow)) {
            return toView({ row: companyRow, scope: ChatPersonalizationScope.COMPANY, inputsRow: companyRow, role: userRow?.role ?? null, personalStatus, prefill: null })
        }
        if (!isNil(userRow)) {
            return toView({ row: userRow, scope: ChatPersonalizationScope.USER, inputsRow: userRow, role: userRow.role ?? null, personalStatus, prefill: null })
        }
        await startPrefillLookup({ platformId, userId, log })
        return {
            status: ChatPersonalizationStatus.UNSET,
            personalStatus: ChatPersonalizationStatus.UNSET,
            scope: ChatPersonalizationScope.COMPANY,
            useCases: [],
            profile: null,
            companyInput: null,
            roleInput: null,
            prefill: await readPrefill({ platformId, userId, log }),
        }
    },

    async getConfigForWorker(input: GetPersonalizationConfigRequest): Promise<PersonalizationConfigResponse> {
        const { platformId, userId, scope, researchToken } = input
        const claimed = await claimForResearch({ platformId, userId, scope, researchToken })
        if (!claimed) {
            log.info({ platform: { id: platformId }, user: { id: userId }, scope }, '[chatPersonalization] Claim lost, duplicate research job exits')
            return { claimed: false }
        }
        const userRow = await findRow({ platformId, userId })
        const [provider, user, platform, companyRow, enabledTools] = await Promise.all([
            agentHelpers.resolveChatProvider({ platformId, scope: PERSONALIZATION_PROVIDER_SCOPE, log }),
            userService(log).getMetaInformation({ id: userId }),
            platformService(log).getOneOrThrow(platformId),
            findRow({ platformId, userId: null }),
            tryCatch(() => aiToolConfigService(log).getEnabledTools({ platformId })),
        ])
        const providerName = provider.provider
        const webSearch = enabledTools.data?.webSearch ?? null
        return {
            claimed: true,
            provider: provider.provider,
            auth: provider.auth,
            providerConfig: provider.config ?? {},
            modelId: agentHelpers.resolveModelIdForProvider({ provider: providerName, selectedModel: null }),
            fastModelId: agentHelpers.resolveFastModelId({ provider: providerName }),
            user: { firstName: user.firstName, lastName: user.lastName, email: user.email },
            platformName: platform.name,
            website: companyRow?.domain ?? null,
            companyText: companyRow?.companyText ?? null,
            role: userRow?.role ?? null,
            companyProfile: (companyRow?.status === ChatPersonalizationStatus.READY ? companyRow.profile : null) ?? null,
            webSearch,
        }
    },

    async getPrefillConfigForWorker(input: GetPersonalizationPrefillConfigRequest): Promise<PersonalizationPrefillConfigResponse> {
        const { userId } = input
        const user = await userService(log).getMetaInformation({ id: userId })
        return {
            email: user.email,
            apolloApiKey: apolloApiKey(),
        }
    },

    async saveResult(input: SavePersonalizationResultRequest): Promise<void> {
        const { platformId, userId, scope, researchToken } = input
        const validated = validateResult({ input, log })
        const scoped = scope === ChatPersonalizationScope.USER
            ? { platformId, userId }
            : { platformId, userId: IsNull() }
        const criteria = {
            ...scoped,
            ...(isNil(researchToken) ? {} : { researchToken }),
        }
        const written = await personalizationRepo()
            .createQueryBuilder()
            .update()
            .set({
                status: validated.status,
                profile: validated.profile === null ? null : sanitizeObjectForPostgresql(validated.profile),
                useCases: validated.useCases === null ? null : sanitizeObjectForPostgresql(validated.useCases),
            })
            .where(criteria)
            .returning('id')
            .execute()
        if ((written.raw?.length ?? 0) === 0) {
            log.info({ platform: { id: platformId }, user: { id: userId }, scope, researchToken }, '[chatPersonalization] Result discarded, the run that produced it was superseded')
            return
        }

        if (scope === ChatPersonalizationScope.COMPANY && validated.status === ChatPersonalizationStatus.READY) {
            await tryCatch(() => upsertFoundingUserRow({ platformId, userId, researchToken, validated, log }))
        }

        const view = await this.getEffectiveView({ platformId, userId })
        emitProgress({
            userId,
            event: {
                platformId,
                scope: toScopeEnum(scope),
                phase: validated.status === ChatPersonalizationStatus.READY ? 'done' : 'failed',
                message: validated.status === ChatPersonalizationStatus.READY
                    ? 'Your use cases are ready'
                    : 'Could not personalize this time',
                done: true,
                result: view,
            },
        })
        log.info({ platform: { id: platformId }, user: { id: userId }, scope, status: validated.status }, '[chatPersonalization] Research result saved')
    },

    async sendProgress(input: SendPersonalizationProgressRequest): Promise<void> {
        const { platformId, userId, scope, researchToken, phase, message } = input
        const scoped = scope === ChatPersonalizationScope.USER
            ? { platformId, userId }
            : { platformId, userId: IsNull() }
        const beat = await personalizationRepo()
            .createQueryBuilder()
            .update()
            .set({ status: ChatPersonalizationStatus.RESEARCHING })
            .where({
                ...scoped,
                status: ChatPersonalizationStatus.RESEARCHING,
                ...(isNil(researchToken) ? {} : { researchToken }),
            })
            .returning('id')
            .execute()
        if ((beat.raw?.length ?? 0) === 0) {
            return
        }
        emitProgress({ userId, event: { platformId, scope: toScopeEnum(scope), phase, message, done: false } })
    },

    async savePrefill(input: SavePersonalizationPrefillRequest): Promise<void> {
        const { platformId, userId, role, confidence } = input
        const prefill: PersonalizationPrefill = { role, confidence }
        const answered = await findRow({ platformId, userId: null })
        if (!isNil(answered)) {
            log.info({ platform: { id: platformId }, user: { id: userId } }, '[chatPersonalization] Prefill discarded, user already answered')
            return
        }
        const redis = await redisConnections.useExisting()
        await redis.set(prefillKey({ platformId, userId }), JSON.stringify(prefill), 'EX', PREFILL_TTL_SECONDS)
        emitProgress({
            userId,
            event: {
                platformId,
                scope: ChatPersonalizationScope.COMPANY,
                phase: 'prefill',
                message: 'Looking you up',
                done: false,
                prefill,
            },
        })
        log.info({ platform: { id: platformId }, user: { id: userId }, hasRole: !isNil(role), confidence }, '[chatPersonalization] Prefill cached')
    },

    async getIdentityEnrichment({ platformId, userId }: { platformId: string, userId: string }): Promise<PersonalizationIdentity | null> {
        const view = await this.getEffectiveView({ platformId, userId })
        const company = view.status === ChatPersonalizationStatus.READY && !isNil(view.profile)
            ? { name: view.profile.companyName, description: view.profile.description, industry: view.profile.industry }
            : null
        const role = view.roleInput ?? null
        if (isNil(company) && isNil(role)) {
            return null
        }
        return { company, role }
    },

})

function apolloApiKey(): string | null {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return null
    }
    const key = system.get(AppSystemProp.APOLLO_API_KEY)
    return isNil(key) || key.length === 0 ? null : key
}

async function findRow({ platformId, userId }: { platformId: string, userId: string | null }): Promise<ChatPersonalization | null> {
    return personalizationRepo().findOneBy(
        isNil(userId) ? { platformId, userId: IsNull() } : { platformId, userId },
    )
}

async function upsertFoundingUserRow({ platformId, userId, researchToken, validated, log }: {
    platformId: string
    userId: string
    researchToken: string | null
    validated: ValidatedResult
    log: FastifyBaseLogger
}): Promise<void> {
    if (isNil(researchToken)) {
        return
    }
    const profile = validated.profile === null ? null : JSON.stringify(sanitizeObjectForPostgresql(validated.profile))
    const useCases = validated.useCases === null ? null : JSON.stringify(sanitizeObjectForPostgresql(validated.useCases))
    const seeded: { id: string }[] = await personalizationRepo().query(
        `
        INSERT INTO "chat_personalization" ("id", "created", "updated", "platformId", "userId", "domain", "companyText", "role", "status", "researchToken", "profile", "useCases")
        SELECT $1, now(), now(), $2, $3, NULL, NULL, NULL, $4, NULL, $5::jsonb, $6::jsonb
        WHERE EXISTS (
            SELECT 1 FROM "chat_personalization"
            WHERE "platformId" = $2 AND "userId" IS NULL AND "researchToken" = $7
        )
        ON CONFLICT ("platformId", "userId") WHERE "userId" IS NOT NULL
        DO UPDATE SET
            "status" = EXCLUDED."status",
            "profile" = EXCLUDED."profile",
            "useCases" = EXCLUDED."useCases",
            "updated" = now()
        WHERE "chat_personalization"."researchToken" = $7
           OR ("chat_personalization"."status" <> ALL($8::varchar[])
               AND "chat_personalization"."useCases" IS NULL)
        RETURNING "id"
        `,
        [apId(), platformId, userId, ChatPersonalizationStatus.READY, profile, useCases, researchToken, IN_FLIGHT_STATUSES],
    )
    if (seeded.length === 0) {
        log.info({ platform: { id: platformId }, user: { id: userId }, researchToken }, '[chatPersonalization] Founding-user seed skipped, the run was superseded or that row has its own research')
    }
}

async function recoverIfStale({ row, platformId, userId, scope, log }: {
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

function normalizeRoleTitle({ input }: { input: string }): string | null {
    const trimmed = input.trim().replace(/\s+/g, ' ')
    if (trimmed.length === 0) {
        return null
    }
    return trimmed
        .split(' ')
        .map((word, index) => {
            const lower = word.toLowerCase()
            if (ROLE_ACRONYMS.has(lower)) {
                return lower.toUpperCase()
            }
            if (index > 0 && ROLE_CONNECTORS.has(lower)) {
                return lower
            }
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')
}

function normalizeWebsite({ input }: { input: string }): string | null {
    let value = input.trim().toLowerCase()
    if (value.length === 0) {
        return null
    }
    value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^\/\//, '')
    const cutAt = value.search(/[/?#:]/)
    if (cutAt >= 0) {
        value = value.slice(0, cutAt)
    }
    value = value.replace(/\.$/, '')
    const labels = value.split('.')
    if (labels[0] === 'www' || labels[0] === 'mail') {
        labels.shift()
    }
    value = labels.join('.')
    if (!HOSTNAME_PATTERN.test(value)) {
        return null
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(value) || value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local')) {
        return null
    }
    return value
}

async function writeCompanyRow({ platformId, existing, patch }: {
    platformId: string
    existing: ChatPersonalization | null
    patch: Partial<Pick<ChatPersonalization, 'domain' | 'companyText' | 'role' | 'status' | 'researchToken' | 'profile' | 'useCases'>>
}): Promise<void> {
    if (isNil(existing)) {
        const { error } = await tryCatch(() => personalizationRepo().insert({
            id: apId(),
            platformId,
            userId: null,
            domain: patch.domain ?? null,
            companyText: patch.companyText ?? null,
            role: patch.role ?? null,
            status: patch.status ?? ChatPersonalizationStatus.PENDING,
            researchToken: patch.researchToken ?? null,
            profile: patch.profile ?? null,
            useCases: patch.useCases ?? null,
        }))
        if (isNil(error)) {
            return
        }
    }
    await personalizationRepo().update({ platformId, userId: IsNull() }, patch)
}

async function callerMayEditCompany({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<boolean> {
    const user = await tryCatch(() => userService(log).getMetaInformation({ id: userId }))
    if (user.error) {
        log.warn({ platform: { id: platformId }, user: { id: userId }, error: user.error }, '[chatPersonalization] Could not read the platform role, leaving the company as it is')
        return false
    }
    if (user.data.platformRole === PlatformRole.ADMIN) {
        return true
    }
    log.info({ platform: { id: platformId }, user: { id: userId } }, '[chatPersonalization] Company edit ignored, the platform company is admin-owned')
    return false
}

async function writeUserRow({ platformId, userId, patch }: {
    platformId: string
    userId: string
    patch: Partial<Pick<ChatPersonalization, 'domain' | 'companyText' | 'role' | 'status' | 'researchToken' | 'profile' | 'useCases'>>
}): Promise<void> {
    const existing = await findRow({ platformId, userId })
    if (isNil(existing)) {
        const { error } = await tryCatch(() => personalizationRepo().insert({
            id: apId(),
            platformId,
            userId,
            domain: patch.domain ?? null,
            companyText: patch.companyText ?? null,
            role: patch.role ?? null,
            status: patch.status ?? ChatPersonalizationStatus.PENDING,
            researchToken: patch.researchToken ?? null,
            profile: patch.profile ?? null,
            useCases: patch.useCases ?? null,
        }))
        if (isNil(error)) {
            return
        }
    }
    await personalizationRepo().update({ platformId, userId }, patch)
}

async function startPrefillLookup({ platformId, userId, log }: {
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

async function readPrefill({ platformId, userId, log }: {
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

async function claimForResearch({ platformId, userId, scope, researchToken }: { platformId: string, userId: string, scope: PersonalizationScope, researchToken: string | null }): Promise<boolean> {
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

async function guardsAllowResearch({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<boolean> {
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

async function enqueueResearchJob({ platformId, userId, scope, website, companyText, role, researchToken, prefillOnly, log }: {
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

function prefillKey({ platformId, userId }: { platformId: string, userId: string }): string {
    return `chat-personalization-prefill:${platformId}:${userId}`
}

function prefillLookupKey({ platformId, userId }: { platformId: string, userId: string }): string {
    return `chat-personalization-prefill-lookup:${platformId}:${userId}`
}

function validateResult({ input, log }: { input: SavePersonalizationResultRequest, log: FastifyBaseLogger }): ValidatedResult {
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

function toView({ row, scope, inputsRow, role, personalStatus, prefill }: {
    row: ChatPersonalization
    scope: ChatPersonalizationScope
    inputsRow: ChatPersonalization
    role: string | null
    personalStatus: ChatPersonalizationStatus
    prefill: PersonalizationPrefill | null
}): ChatPersonalizationView {
    return {
        status: row.status,
        personalStatus,
        scope,
        useCases: row.useCases ?? [],
        profile: row.profile ?? null,
        companyInput: inputsRow.companyText ?? inputsRow.domain ?? null,
        roleInput: role,
        prefill,
    }
}

function toScopeEnum(scope: PersonalizationScope): ChatPersonalizationScope {
    return scope === 'user' ? ChatPersonalizationScope.USER : ChatPersonalizationScope.COMPANY
}

function emitProgress({ userId, event }: { userId: string, event: ChatPersonalizationProgressEvent }): void {
    websocketService.to(userId).emit(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, event)
}

const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

const ROLE_ACRONYMS: ReadonlySet<string> = new Set(['ceo', 'cto', 'coo', 'cfo', 'cmo', 'cpo', 'cro', 'ciso', 'cio', 'chro', 'vp', 'svp', 'evp', 'hr', 'it', 'qa', 'pr', 'seo', 'sem', 'ux', 'ui', 'ai', 'ml', 'bi', 'l&d', 'r&d', 'gm', 'pm', 'gtm', 'sdr', 'bdr', 'ae', 'sre', 'csm', 'crm', 'saas', 'api'])

const ROLE_CONNECTORS: ReadonlySet<string> = new Set(['of', 'and', 'the', 'for', 'in', 'at', 'to', 'a', 'an', '&'])

type UpsertParams = {
    platformId: string
    userId: string
    website?: string
    role?: string
    personalize: boolean
}

type ValidatedResult = {
    status: ChatPersonalizationStatus
    profile: PersonalizationProfile | null
    useCases: PersonalizationUseCase[] | null
}

export type PersonalizationIdentity = {
    company: PersonalizationIdentityCompany | null
    role: string | null
}

export type PersonalizationIdentityCompany = {
    name: string
    description: string
    industry: string
}
