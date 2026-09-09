import { apId, isNil, sanitizeObjectForPostgresql, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import {
    ChatPersonalization,
    ChatPersonalizationScope,
    ChatPersonalizationStatus,
    ChatPersonalizationView,
    GetPersonalizationConfigRequest,
    GetPersonalizationPrefillConfigRequest,
    PersonalizationConfigResponse,
    PersonalizationPrefill,
    PersonalizationPrefillConfigResponse,
    SavePersonalizationPrefillRequest,
    SavePersonalizationResultRequest,
    SendPersonalizationProgressRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { aiToolConfigService } from '../../../ai/ai-tool-config-service'
import { redisConnections } from '../../../database/redis-connections'
import { platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { agentHelpers } from '../agent-helpers'
import { normalizeRoleTitle, normalizeWebsite } from './personalization-normalize'
import { apolloApiKey, claimForResearch, enqueueResearchJob, guardsAllowResearch, PERSONALIZATION_PROVIDER_SCOPE, PREFILL_TTL_SECONDS, prefillKey, readPrefill, recoverIfStale, RESEARCH_STALENESS_TIMEOUT_MS, startPrefillLookup, validateResult } from './personalization-research'
import { callerMayEditCompany, findRow, IN_FLIGHT_STATUSES, personalizationRepo, upsertFoundingUserRow, UpsertParams, writeCompanyRow, writeUserRow } from './personalization-rows'
import { emitProgress, PersonalizationIdentity, toScopeEnum, toView } from './personalization-view'


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
            modelId: agentHelpers.resolveModelIdForProvider({ provider: providerName, selectedModel: null, config: provider.config, modelScope: provider.modelScope, modelIds: provider.modelIds }),
            fastModelId: agentHelpers.resolveFastModelId({ provider: providerName, config: provider.config, modelScope: provider.modelScope, modelIds: provider.modelIds }),
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
