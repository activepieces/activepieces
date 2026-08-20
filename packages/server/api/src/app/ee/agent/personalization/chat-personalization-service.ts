import { AIProviderName, apId, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
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
    SavePersonalizationPrefillRequest,
    SavePersonalizationResultRequest,
    SendPersonalizationProgressRequest,
    WebsocketClientEvent,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { z } from 'zod'
import { aiProviderService } from '../../../ai/ai-provider-service'
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

const RESEARCH_STALENESS_TIMEOUT_MS = 2 * 60 * 1_000
const RESEARCH_RUNS_PER_PLATFORM_PER_DAY = 5
const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60
const PREFILL_TTL_SECONDS = 7 * 24 * 60 * 60

const EMPTY_CONFIG: Omit<PersonalizationConfigResponse, 'claimed'> = {
    provider: null,
    auth: null,
    providerConfig: {},
    modelId: null,
    fastModelId: null,
    user: null,
    platformName: null,
    website: null,
    companyText: null,
    role: null,
    companyProfile: null,
    webSearch: null,
}

export const chatPersonalizationService = (log: FastifyBaseLogger) => ({

    async upsert({ platformId, userId, website, role: roleInput, personalize }: UpsertParams): Promise<ChatPersonalizationView> {
        const companyRow = await findRow({ platformId, userId: null })
        const trimmedInput = isNil(website) ? null : website.trim()
        const hasCompanyInput = !isNil(trimmedInput) && trimmedInput.length > 0
        const normalizedWebsite = hasCompanyInput ? normalizeWebsite({ input: trimmedInput }) : null
        const freeTextCompany = hasCompanyInput && isNil(normalizedWebsite) ? trimmedInput.slice(0, 255) : null
        const role = isNil(roleInput) ? null : normalizeRoleTitle({ input: roleInput })

        if (personalize && !hasCompanyInput && companyRow?.status === ChatPersonalizationStatus.READY) {
            return this.upsertUserScope({ platformId, userId, companyRow })
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
        const effectiveRole = role ?? companyRow?.role ?? null

        if (!personalize || (isNil(domain) && isNil(companyText))) {
            const cleared = {
                domain: null,
                companyText: null,
                role: null,
                status: ChatPersonalizationStatus.SKIPPED,
                profile: null,
                useCases: null,
            }
            await Promise.all([
                writeCompanyRow({ platformId, existing: companyRow, patch: cleared }),
                personalizationRepo().update({ platformId, userId }, cleared),
            ])
            return this.getEffectiveView({ platformId, userId })
        }

        const inputsChanged = (companyRow?.domain ?? null) !== domain
            || (companyRow?.companyText ?? null) !== companyText
            || (companyRow?.role ?? null) !== effectiveRole

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
            return this.getEffectiveView({ platformId, userId })
        }

        if (!isNil(companyRow)) {
            const fresh = Date.now() - new Date(companyRow.updated).getTime() < RESEARCH_STALENESS_TIMEOUT_MS
            const inFlight = [ChatPersonalizationStatus.PENDING, ChatPersonalizationStatus.RESEARCHING].includes(companyRow.status)
            if (inFlight && fresh) {
                return this.getEffectiveView({ platformId, userId })
            }
            if (companyRow.status === ChatPersonalizationStatus.READY && !inputsChanged) {
                return this.getEffectiveView({ platformId, userId })
            }
        }

        const allowed = await guardsAllowResearch({ platformId, log })
        if (!allowed) {
            await writeCompanyRow({
                platformId,
                existing: companyRow,
                patch: { domain, companyText, role: effectiveRole, status: ChatPersonalizationStatus.SKIPPED },
            })
            return this.getEffectiveView({ platformId, userId })
        }

        await writeCompanyRow({
            platformId,
            existing: companyRow,
            patch: {
                domain,
                companyText,
                role: effectiveRole,
                status: ChatPersonalizationStatus.PENDING,
                ...(inputsChanged ? { profile: null, useCases: null } : {}),
            },
        })

        if (inputsChanged) {
            await tryCatch(() => personalizationRepo().delete({ platformId, userId }))
        }

        await enqueueResearchJob({
            platformId,
            userId,
            scope: ChatPersonalizationScope.COMPANY,
            website: domain,
            companyText,
            role: effectiveRole,
            log,
        })
        log.info({ platform: { id: platformId }, user: { id: userId }, domain, companyText, role: effectiveRole }, '[chatPersonalization] Company research enqueued')
        return this.getEffectiveView({ platformId, userId })
    },

    async upsertUserScope({ platformId, userId, companyRow }: { platformId: string, userId: string, companyRow: ChatPersonalization }): Promise<ChatPersonalizationView> {
        const userRow = await findRow({ platformId, userId })
        if (!isNil(userRow)) {
            const fresh = Date.now() - new Date(userRow.updated).getTime() < RESEARCH_STALENESS_TIMEOUT_MS
            const terminal = [ChatPersonalizationStatus.READY, ChatPersonalizationStatus.SKIPPED].includes(userRow.status)
            if (terminal || fresh) {
                return this.getEffectiveView({ platformId, userId })
            }
            await personalizationRepo().update({ platformId, userId }, { status: ChatPersonalizationStatus.PENDING })
        }
        else {
            const { error } = await tryCatch(() => personalizationRepo().insert({
                id: apId(),
                platformId,
                userId,
                domain: companyRow.domain,
                companyText: companyRow.companyText,
                status: ChatPersonalizationStatus.PENDING,
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
            role: null,
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
        if (userRow?.status === ChatPersonalizationStatus.READY) {
            return toView({ row: userRow, scope: ChatPersonalizationScope.USER, inputsRow: companyRow ?? userRow, prefill: null })
        }
        if (!isNil(companyRow)) {
            return toView({ row: companyRow, scope: ChatPersonalizationScope.COMPANY, inputsRow: companyRow, prefill: null })
        }
        if (!isNil(userRow)) {
            return toView({ row: userRow, scope: ChatPersonalizationScope.USER, inputsRow: userRow, prefill: null })
        }
        await startPrefillLookup({ platformId, userId, log })
        return {
            status: ChatPersonalizationStatus.UNSET,
            scope: ChatPersonalizationScope.COMPANY,
            useCases: [],
            profile: null,
            companyInput: null,
            roleInput: null,
            prefill: await readPrefill({ platformId, userId, log }),
        }
    },

    async getConfigForWorker(input: GetPersonalizationConfigRequest): Promise<PersonalizationConfigResponse> {
        const { platformId, userId, scope } = input
        const claimed = await claimForResearch({ platformId, userId, scope })
        if (!claimed) {
            log.info({ platform: { id: platformId }, user: { id: userId }, scope }, '[chatPersonalization] Claim lost, duplicate research job exits')
            return { ...EMPTY_CONFIG, claimed: false }
        }
        const [provider, user, platform, companyRow, enabledTools] = await Promise.all([
            agentHelpers.resolveChatProvider({ platformId, log }),
            userService(log).getMetaInformation({ id: userId }),
            platformService(log).getOneOrThrow(platformId),
            findRow({ platformId, userId: null }),
            tryCatch(() => aiToolConfigService(log).getEnabledTools({ platformId })),
        ])
        const providerName = provider.provider as AIProviderName
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
            role: companyRow?.role ?? null,
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
        const { platformId, userId, scope } = input
        const validated = validateResult({ input, log })
        const criteria = scope === ChatPersonalizationScope.USER
            ? { platformId, userId }
            : { platformId, userId: IsNull() }
        await personalizationRepo().update(criteria, {
            status: validated.status,
            profile: validated.profile === null ? null : sanitizeObjectForPostgresql(validated.profile),
            useCases: validated.useCases === null ? null : sanitizeObjectForPostgresql(validated.useCases),
        })

        if (scope === ChatPersonalizationScope.COMPANY && validated.status === ChatPersonalizationStatus.READY) {
            await tryCatch(() => upsertFoundingUserRow({ platformId, userId, validated }))
        }

        const view = await this.getEffectiveView({ platformId, userId })
        emitProgress({
            userId,
            event: {
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
        const { platformId, userId, scope, phase, message } = input
        const criteria = scope === ChatPersonalizationScope.USER
            ? { platformId, userId, status: ChatPersonalizationStatus.RESEARCHING }
            : { platformId, userId: IsNull(), status: ChatPersonalizationStatus.RESEARCHING }
        await personalizationRepo().update(criteria, { status: ChatPersonalizationStatus.RESEARCHING })
        emitProgress({ userId, event: { scope: toScopeEnum(scope), phase, message, done: false } })
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
                scope: ChatPersonalizationScope.COMPANY,
                phase: 'prefill',
                message: 'Looking you up',
                done: false,
                prefill,
            },
        })
        log.info({ platform: { id: platformId }, user: { id: userId }, hasRole: !isNil(role), confidence }, '[chatPersonalization] Prefill cached')
    },

    async getIdentityEnrichment({ platformId, userId }: { platformId: string, userId: string }): Promise<PersonalizationProfile | null> {
        const view = await this.getEffectiveView({ platformId, userId })
        if (view.status !== ChatPersonalizationStatus.READY || isNil(view.profile)) {
            return null
        }
        return view.profile
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

async function upsertFoundingUserRow({ platformId, userId, validated }: {
    platformId: string
    userId: string
    validated: ValidatedResult
}): Promise<void> {
    const existing = await findRow({ platformId, userId })
    const patch = {
        status: ChatPersonalizationStatus.READY,
        profile: validated.profile === null ? null : sanitizeObjectForPostgresql(validated.profile),
        useCases: validated.useCases === null ? null : sanitizeObjectForPostgresql(validated.useCases),
    }
    if (isNil(existing)) {
        await personalizationRepo().insert({ id: apId(), platformId, userId, domain: null, companyText: null, role: null, ...patch })
        return
    }
    await personalizationRepo().update({ id: existing.id }, patch)
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
    const inFlight = [ChatPersonalizationStatus.PENDING, ChatPersonalizationStatus.RESEARCHING].includes(row.status)
    const stale = Date.now() - new Date(row.updated).getTime() > RESEARCH_STALENESS_TIMEOUT_MS
    if (!inFlight || !stale) {
        return row
    }
    log.warn({ platform: { id: platformId }, user: { id: userId }, scope, stuckStatus: row.status }, '[chatPersonalization] Recovering stale in-flight research row')
    const { error } = await tryCatch(async () => {
        const allowed = await guardsAllowResearch({ platformId, log })
        if (!allowed) {
            await personalizationRepo().update({ id: row.id }, { status: ChatPersonalizationStatus.FAILED })
            return
        }
        await personalizationRepo().update({ id: row.id }, { status: ChatPersonalizationStatus.PENDING })
        await enqueueResearchJob({
            platformId,
            userId,
            scope,
            website: scope === ChatPersonalizationScope.COMPANY ? row.domain ?? null : null,
            companyText: scope === ChatPersonalizationScope.COMPANY ? row.companyText ?? null : null,
            role: row.role ?? null,
            log,
        })
    })
    if (error) {
        log.warn({ error, platform: { id: platformId } }, '[chatPersonalization] Stale-row recovery failed')
        return row
    }
    return findRow({ platformId, userId: scope === ChatPersonalizationScope.COMPANY ? null : userId })
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
    patch: Partial<Pick<ChatPersonalization, 'domain' | 'companyText' | 'role' | 'status' | 'profile' | 'useCases'>>
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
            profile: patch.profile ?? null,
            useCases: patch.useCases ?? null,
        }))
        if (isNil(error)) {
            return
        }
    }
    await personalizationRepo().update({ platformId, userId: IsNull() }, patch)
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

async function claimForResearch({ platformId, userId, scope }: { platformId: string, userId: string, scope: PersonalizationScope }): Promise<boolean> {
    const criteria = scope === ChatPersonalizationScope.USER
        ? { platformId, userId, status: ChatPersonalizationStatus.PENDING }
        : { platformId, userId: IsNull(), status: ChatPersonalizationStatus.PENDING }
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
    const chatProvider = await tryCatch(() => aiProviderService(log).getChatProvider({ platformId }))
    if (chatProvider.error || isNil(chatProvider.data)) {
        log.warn({ platform: { id: platformId } }, '[chatPersonalization] No chat AI provider, skipping research')
        return false
    }
    const credits = await tryCatch(() => assertCreditsAndAppSumoNotExceeded({ platformId, log }))
    if (credits.error) {
        log.warn({ platform: { id: platformId } }, '[chatPersonalization] Credits exhausted, skipping research')
        return false
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

async function enqueueResearchJob({ platformId, userId, scope, website, companyText, role, prefillOnly, log }: {
    platformId: string
    userId: string
    scope: PersonalizationScope
    website: string | null
    companyText: string | null
    role: string | null
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

function toView({ row, scope, inputsRow, prefill }: {
    row: ChatPersonalization
    scope: ChatPersonalizationScope
    inputsRow: ChatPersonalization
    prefill: PersonalizationPrefill | null
}): ChatPersonalizationView {
    return {
        status: row.status,
        scope,
        useCases: row.useCases ?? [],
        profile: row.profile ?? null,
        companyInput: inputsRow.companyText ?? inputsRow.domain ?? null,
        roleInput: inputsRow.role ?? null,
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
