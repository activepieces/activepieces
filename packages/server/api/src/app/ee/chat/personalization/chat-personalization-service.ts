import { AIProviderName, apId, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import {
    ChatPersonalization,
    ChatPersonalizationProgressEvent,
    ChatPersonalizationScope,
    ChatPersonalizationStatus,
    ChatPersonalizationView,
    GetPersonalizationConfigRequest,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    PersonalizationConfigResponse,
    PersonalizationProfile,
    PersonalizationScope,
    PersonalizationUseCase,
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
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { jobQueue, JobType } from '../../../workers/job-queue/job-queue'
import { platformAiCreditsService } from '../../platform/platform-plan/platform-ai-credits.service'
import { chatHelpers } from '../chat-helpers'
import { chatUserIdentity } from '../chat-user-identity'
import { ChatPersonalizationEntity } from './chat-personalization-entity'

const personalizationRepo = repoFactory(ChatPersonalizationEntity)

// An in-flight row whose progress heartbeats stopped this long ago is treated
// as crashed (research jobs run with attempts:1 and target ~20s total) and is
// recovered on read: reset + re-enqueued, bounded by the daily rate cap.
const RESEARCH_STALENESS_TIMEOUT_MS = 2 * 60 * 1_000
const RESEARCH_RUNS_PER_PLATFORM_PER_DAY = 5
const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60

export const chatPersonalizationService = (log: FastifyBaseLogger) => ({

    async upsert({ platformId, userId, website, role: roleInput, personalize }: UpsertParams): Promise<ChatPersonalizationView> {
        const [user, companyRow] = await Promise.all([
            userService(log).getMetaInformation({ id: userId }),
            findRow({ platformId, userId: null }),
        ])
        const normalizedWebsite = isNil(website) ? null : normalizeWebsite({ input: website })
        const role = isNil(roleInput) ? null : normalizeRoleTitle({ input: roleInput })

        // Lazy per-person upgrade (invited teammate or founding user re-opt-in):
        // a personalize-only POST while company research is READY targets the
        // caller's own row instead of the company one.
        if (personalize && isNil(normalizedWebsite) && companyRow?.status === ChatPersonalizationStatus.READY) {
            return this.upsertUserScope({ platformId, userId, companyRow })
        }

        // Stored inputs win over the email hint so a personalize-only POST
        // (restore after reset) targets the same company/role as before.
        const domain = normalizedWebsite ?? companyRow?.domain ?? chatUserIdentity.companyHintFromEmail(user.email)?.domain ?? null
        const effectiveRole = role ?? companyRow?.role ?? null

        if (!personalize || isNil(domain)) {
            // Opting out (Reset) hides the cards but KEEPS the researched data
            // on both rows, so personalizing again is an instant restore.
            await Promise.all([
                writeCompanyRow({ platformId, existing: companyRow, patch: { domain, role: effectiveRole, status: ChatPersonalizationStatus.SKIPPED } }),
                personalizationRepo().update({ platformId, userId }, { status: ChatPersonalizationStatus.SKIPPED }),
            ])
            return this.getEffectiveView({ platformId, userId })
        }

        const inputsChanged = companyRow?.domain !== domain || (companyRow?.role ?? null) !== effectiveRole

        // Restore after reset: same inputs + stored cards → flip back to READY
        // with zero research spend.
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
            await writeCompanyRow({ platformId, existing: companyRow, patch: { domain, role: effectiveRole, status: ChatPersonalizationStatus.SKIPPED } })
            return this.getEffectiveView({ platformId, userId })
        }

        await writeCompanyRow({
            platformId,
            existing: companyRow,
            patch: {
                domain,
                role: effectiveRole,
                status: ChatPersonalizationStatus.PENDING,
                ...(inputsChanged ? { profile: null, useCases: null } : {}),
            },
        })

        // A role/domain edit must retarget the caller's personal row too — the
        // company job's save refreshes it, but a stale READY user row would
        // otherwise keep winning the effective view.
        if (inputsChanged) {
            await tryCatch(() => personalizationRepo().delete({ platformId, userId }))
        }

        const platform = await platformService(log).getOneOrThrow(platformId)
        await enqueueResearchJob({
            platformId,
            userId,
            scope: ChatPersonalizationScope.COMPANY,
            website: domain,
            role: effectiveRole,
            placeholderPlatformName: platform.name,
            log,
        })
        log.info({ platform: { id: platformId }, user: { id: userId }, domain, role: effectiveRole }, '[chatPersonalization] Company research enqueued')
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
                status: ChatPersonalizationStatus.PENDING,
                profile: null,
                useCases: null,
            }))
            if (error) {
                // Partial unique index absorbed a concurrent insert — the other
                // request owns the job.
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
            role: null,
            placeholderPlatformName: null,
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
        // Self-heal on read (same precedent as stale-STREAMING conversation
        // recovery): a crashed worker or a mid-research restart must never
        // leave the UI on "Personalizing…" forever.
        const [userRow, companyRow] = await Promise.all([
            recoverIfStale({ row: foundUserRow, platformId, userId, scope: ChatPersonalizationScope.USER, log }),
            recoverIfStale({ row: foundCompanyRow, platformId, userId, scope: ChatPersonalizationScope.COMPANY, log }),
        ])
        if (userRow?.status === ChatPersonalizationStatus.READY) {
            return toView({ row: userRow, scope: ChatPersonalizationScope.USER })
        }
        if (!isNil(companyRow)) {
            return toView({ row: companyRow, scope: ChatPersonalizationScope.COMPANY })
        }
        if (!isNil(userRow)) {
            return toView({ row: userRow, scope: ChatPersonalizationScope.USER })
        }
        return {
            status: ChatPersonalizationStatus.SKIPPED,
            scope: ChatPersonalizationScope.COMPANY,
            useCases: [],
            profile: null,
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
            chatHelpers.resolveChatProvider({ platformId, log }),
            userService(log).getMetaInformation({ id: userId }),
            platformService(log).getOneOrThrow(platformId),
            findRow({ platformId, userId: null }),
            tryCatch(() => aiToolConfigService(log).getEnabledTools({ platformId })),
        ])
        const providerName = provider.provider as AIProviderName
        const enrichment = enabledTools.data?.enrichment ?? null
        const webSearch = enabledTools.data?.webSearch ?? null
        return {
            claimed: true,
            provider: provider.provider,
            auth: provider.auth,
            providerConfig: provider.config ?? {},
            modelId: chatHelpers.resolveModelIdForProvider({ tier: chatHelpers.resolveTier({ tierId: null }), provider: providerName }),
            fastModelId: chatHelpers.resolveFastModelId({ provider: providerName }),
            user: { firstName: user.firstName, lastName: user.lastName, email: user.email },
            platformName: platform.name,
            website: companyRow?.domain ?? null,
            role: companyRow?.role ?? null,
            companyProfile: (companyRow?.status === ChatPersonalizationStatus.READY ? companyRow.profile : null) ?? null,
            enrichment: enrichment ? { provider: enrichment.provider, apiKey: enrichment.apiKey } : null,
            webSearch: webSearch ? { provider: webSearch.provider, apiKey: webSearch.apiKey } : null,
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

        // The company research already inferred the enqueueing user's role, so
        // their personal row rides along for free — invited teammates get theirs
        // via the lazy user-scope path instead.
        if (scope === ChatPersonalizationScope.COMPANY && validated.status === ChatPersonalizationStatus.READY) {
            await tryCatch(() => upsertFoundingUserRow({ platformId, userId, validated }))
        }

        if (validated.status === ChatPersonalizationStatus.READY) {
            await tryCatch(() => maybeUpgradePlatformName({ input, profile: validated.profile, log }))
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
        // Heartbeat: bumping `updated` keeps the staleness reaper from reclaiming
        // a live research run.
        await personalizationRepo().update(criteria, { status: ChatPersonalizationStatus.RESEARCHING })
        emitProgress({ userId, event: { scope: toScopeEnum(scope), phase, message, done: false } })
    },

    async getIdentityEnrichment({ platformId, userId }: { platformId: string, userId: string }): Promise<PersonalizationProfile | null> {
        const view = await this.getEffectiveView({ platformId, userId })
        if (view.status !== ChatPersonalizationStatus.READY || isNil(view.profile)) {
            return null
        }
        return view.profile
    },

})

async function findRow({ platformId, userId }: { platformId: string, userId: string | null }): Promise<ChatPersonalization | null> {
    return personalizationRepo().findOneBy(
        isNil(userId) ? { platformId, userId: IsNull() } : { platformId, userId },
    )
}

// Recovers a crashed in-flight row: reset to PENDING (bumping `updated`, so
// concurrent reads see it fresh) and re-enqueue the research once. The claim
// CAS dedups any race; the daily cap bounds crash-loops (cap exhausted →
// FAILED, UI falls back to defaults).
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
        const platform = await platformService(log).getOneOrThrow(platformId)
        await enqueueResearchJob({
            platformId,
            userId,
            scope,
            website: scope === ChatPersonalizationScope.COMPANY ? row.domain ?? null : null,
            role: row.role ?? null,
            placeholderPlatformName: scope === ChatPersonalizationScope.COMPANY ? platform.name : null,
            log,
        })
    })
    if (error) {
        log.warn({ error, platform: { id: platformId } }, '[chatPersonalization] Stale-row recovery failed')
        return row
    }
    return findRow({ platformId, userId: scope === ChatPersonalizationScope.COMPANY ? null : userId })
}

// Users type roles casually ("operator", "head of sales", "vp of eng") — the
// role is displayed back on the chip and woven into prompts, so it gets a
// deterministic cleanup: title case with lowercase connectors and known
// acronyms uppercased. Never changes the words, only their dress.
function normalizeRoleTitle({ input }: { input: string }): string | null {
    const trimmed = input.trim().replace(/\s+/g, ' ')
    if (trimmed.length === 0) {
        return null
    }
    const ACRONYMS = new Set(['ceo', 'cto', 'coo', 'cfo', 'cmo', 'cpo', 'cro', 'ciso', 'cio', 'vp', 'svp', 'evp', 'hr', 'it', 'qa', 'pr', 'seo', 'sem', 'ux', 'ui', 'ai', 'ml', 'bi', 'l&d', 'r&d', 'gm', 'pm'])
    const CONNECTORS = new Set(['of', 'and', 'the', 'for', 'in', 'at', 'to', 'a', 'an', '&'])
    return trimmed
        .split(' ')
        .map((word, index) => {
            const lower = word.toLowerCase()
            if (ACRONYMS.has(lower)) {
                return lower.toUpperCase()
            }
            if (index > 0 && CONNECTORS.has(lower)) {
                return lower
            }
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')
}

// Best-effort hostname extraction from whatever the user typed ("https://www.Acme.com/about"
// → "acme.com"). Rejects IPs, localhost, and single-label hosts as a first line of defense;
// the worker's safeHttp agent is the real SSRF gate.
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
    const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/
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
    patch: Partial<Pick<ChatPersonalization, 'domain' | 'role' | 'status' | 'profile' | 'useCases'>>
}): Promise<void> {
    if (isNil(existing)) {
        const { error } = await tryCatch(() => personalizationRepo().insert({
            id: apId(),
            platformId,
            userId: null,
            domain: patch.domain ?? null,
            role: patch.role ?? null,
            status: patch.status ?? ChatPersonalizationStatus.PENDING,
            profile: patch.profile ?? null,
            useCases: patch.useCases ?? null,
        }))
        if (isNil(error)) {
            return
        }
        // Concurrent insert lost against the partial unique index — fall through
        // to the update path.
    }
    await personalizationRepo().update({ platformId, userId: IsNull() }, patch)
}

async function claimForResearch({ platformId, userId, scope }: { platformId: string, userId: string, scope: PersonalizationScope }): Promise<boolean> {
    const criteria = scope === ChatPersonalizationScope.USER
        ? { platformId, userId, status: ChatPersonalizationStatus.PENDING }
        : { platformId, userId: IsNull(), status: ChatPersonalizationStatus.PENDING }
    const result = await personalizationRepo().update(criteria, { status: ChatPersonalizationStatus.RESEARCHING })
    return (result.affected ?? 0) > 0
}

// Research must never start on a platform whose AI credits are exhausted, and a
// platform gets a bounded number of runs per day (domain flip-flopping is the
// only way to re-run, but it is still LLM spend). Both degrade to SKIPPED
// rather than erroring: the POST is fire-and-forget from onboarding.
async function guardsAllowResearch({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<boolean> {
    const chatProvider = await tryCatch(() => aiProviderService(log).getChatProvider({ platformId }))
    if (chatProvider.error || isNil(chatProvider.data)) {
        log.warn({ platform: { id: platformId } }, '[chatPersonalization] No chat AI provider, skipping research')
        return false
    }
    if (chatProvider.data.provider === AIProviderName.ACTIVEPIECES) {
        const usage = await tryCatch(() => platformAiCreditsService(log).getUsage(platformId))
        if (usage.error || usage.data.usageRemaining <= 0) {
            log.warn({ platform: { id: platformId } }, '[chatPersonalization] AI credits exhausted, skipping research')
            return false
        }
    }
    const redis = await redisConnections.useExisting()
    const key = `chat-personalization-runs:${platformId}`
    const count = await redis.incr(key)
    if (count === 1) {
        await redis.expire(key, RATE_LIMIT_TTL_SECONDS)
    }
    if (count > RESEARCH_RUNS_PER_PLATFORM_PER_DAY) {
        log.warn({ platform: { id: platformId }, runCount: count }, '[chatPersonalization] Daily research cap reached, skipping')
        return false
    }
    return true
}

async function enqueueResearchJob({ platformId, userId, scope, website, role, placeholderPlatformName, log }: {
    platformId: string
    userId: string
    scope: PersonalizationScope
    website: string | null
    role: string | null
    placeholderPlatformName: string | null
    log: FastifyBaseLogger
}): Promise<void> {
    await jobQueue(log).add({
        id: apId(),
        type: JobType.ONE_TIME,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            jobType: WorkerJobType.EXECUTE_PERSONALIZATION_RESEARCH,
            platformId,
            userId,
            scope,
            website,
            role,
            placeholderPlatformName,
        },
    })
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

async function upsertFoundingUserRow({ platformId, userId, validated }: {
    platformId: string
    userId: string
    validated: ValidatedResult
}): Promise<void> {
    const existing = await findRow({ platformId, userId })
    const payload = {
        status: ChatPersonalizationStatus.READY,
        profile: validated.profile === null ? null : sanitizeObjectForPostgresql(validated.profile),
        useCases: validated.useCases === null ? null : sanitizeObjectForPostgresql(validated.useCases),
    }
    if (isNil(existing)) {
        const companyRow = await findRow({ platformId, userId: null })
        await personalizationRepo().insert({
            id: apId(),
            platformId,
            userId,
            domain: companyRow?.domain ?? null,
            ...payload,
        })
        return
    }
    await personalizationRepo().update({ platformId, userId }, payload)
}

// Upgrade the auto-derived placeholder ("Acmewidgets") to the researched brand
// name ("Acme Widgets") — but only while the platform still carries the exact
// placeholder, so a user rename always wins. The name is sanitized against the
// platform-name pattern (no '.' or '/') since it originates from researched
// (untrusted) web content.
async function maybeUpgradePlatformName({ input, profile, log }: {
    input: SavePersonalizationResultRequest
    profile: PersonalizationProfile | null
    log: FastifyBaseLogger
}): Promise<void> {
    if (isNil(input.placeholderPlatformName) || isNil(profile)) {
        return
    }
    const displayName = profile.displayName
        .replace(/[\u0000-\u001f.\/]/g, '')
        .trim()
        .slice(0, 50)
    if (displayName.length === 0 || displayName === input.placeholderPlatformName) {
        return
    }
    const platform = await platformService(log).getOneOrThrow(input.platformId)
    if (platform.name !== input.placeholderPlatformName) {
        return
    }
    await platformService(log).update({ id: input.platformId, name: displayName })
    log.info({ platform: { id: input.platformId }, previousName: input.placeholderPlatformName, newName: displayName }, '[chatPersonalization] Platform renamed to researched display name')
}

function toScopeEnum(scope: PersonalizationScope): ChatPersonalizationScope {
    return scope === 'user' ? ChatPersonalizationScope.USER : ChatPersonalizationScope.COMPANY
}

function emitProgress({ userId, event }: { userId: string, event: ChatPersonalizationProgressEvent }): void {
    websocketService.to(userId).emit(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, event)
}

function toView({ row, scope }: { row: ChatPersonalization, scope: ChatPersonalizationScope }): ChatPersonalizationView {
    return {
        status: row.status,
        scope,
        useCases: row.useCases ?? [],
        profile: row.profile ?? null,
    }
}

const EMPTY_CONFIG: Omit<PersonalizationConfigResponse, 'claimed'> = {
    provider: '',
    auth: {},
    providerConfig: {},
    modelId: '',
    fastModelId: '',
    user: { firstName: '', lastName: '', email: '' },
    platformName: '',
    website: null,
    role: null,
    companyProfile: null,
    enrichment: null,
    webSearch: null,
}

type UpsertParams = {
    platformId: string
    userId: string
    website: string | null
    role: string | null
    personalize: boolean
}

type ValidatedResult = {
    status: ChatPersonalizationStatus.READY | ChatPersonalizationStatus.FAILED
    profile: PersonalizationProfile | null
    useCases: PersonalizationUseCase[] | null
}
