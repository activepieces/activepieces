import { ActivepiecesAiBilling, ActivepiecesAiBillingScope, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { EngineResponseStatus, ExecutePersonalizationResearchJobData, WorkerJobType } from '@activepieces/shared'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../../types'
import { runPrefillLookup } from './personalization-enrichment'
import { curateCards, fallbackResearch, generateCards, generateProfile } from './personalization-generate'
import { PersonalizationUseCaseResult } from './personalization-research-shared'
import { aOrAn, isMinorSpellingFix, retargetProfileForUser } from './personalization-shaping'
import { buildHomepageDigest, readHomepage, SearchQuery, tavilyResearch } from './personalization-sources'

export const executePersonalizationResearchJob: JobHandler<ExecutePersonalizationResearchJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_PERSONALIZATION_RESEARCH,
    async execute(ctx: JobContext, data: ExecutePersonalizationResearchJobData): Promise<FireAndForgetJobResult> {
        const { platformId, userId, scope, researchToken } = data
        const log = ctx.log.child({ platform: { id: platformId }, user: { id: userId }, scope })

        if (data.prefillOnly === true) {
            const { error: prefillError } = await tryCatch(() => runPrefillLookup({ data, apiClient: ctx.apiClient, log }))
            if (prefillError) {
                log.warn({ error: prefillError }, '[executePersonalizationResearch] Prefill lookup failed')
            }
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const { data: result, error } = await tryCatch(async () => {
            const config = await ctx.apiClient.getPersonalizationConfig({ platformId, userId, scope, researchToken })
            if (!config.claimed) {
                return null
            }
            const progress = async ({ phase, message }: { phase: string, message: string }) => {
                await tryCatch(() => ctx.apiClient.sendPersonalizationProgress({ platformId, userId, scope, researchToken, phase, message }))
            }
            return runResearch({ data, config, progress, log })
        })

        if (error) {
            log.error({ error }, '[executePersonalizationResearch] Research failed')
            await tryCatch(() => ctx.apiClient.savePersonalizationResult({
                platformId, userId, scope, researchToken,
                status: 'FAILED',
                profile: null,
                useCases: null,
            }))
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        if (isNil(result)) {
            log.info('[executePersonalizationResearch] No result (claim lost or research degraded), exiting')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        await ctx.apiClient.savePersonalizationResult({
            platformId, userId, scope, researchToken,
            status: 'READY',
            profile: result.profile,
            useCases: result.useCases,
        })
        log.info({ useCaseCount: result.useCases.length }, '[executePersonalizationResearch] Research saved')
        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

type ProgressFn = (input: { phase: string, message: string }) => Promise<void>

type ResearchOutput = {
    profile: Record<string, unknown>
    useCases: PersonalizationUseCaseResult[]
}

type PersonalizationConfig = Extract<Awaited<ReturnType<JobContext['apiClient']['getPersonalizationConfig']>>, { claimed: true }>

async function runResearch({ data, config, progress, log }: {
    data: ExecutePersonalizationResearchJobData
    config: PersonalizationConfig
    progress: ProgressFn
    log: JobContext['log']
}): Promise<ResearchOutput | null> {
    const provider = config.provider as AIProviderName
    const billing: ActivepiecesAiBilling = isNil(data.projectId)
        ? { scope: ActivepiecesAiBillingScope.PLATFORM, platformId: data.platformId }
        : { scope: ActivepiecesAiBillingScope.PROJECT, platformId: data.platformId, projectId: data.projectId }
    const fastModel = agentAiUtils.createChatModel({
        provider, auth: config.auth, config: config.providerConfig, modelId: config.fastModelId,
        billing,
    })

    if (data.scope === 'user') {
        if (isNil(config.companyProfile)) {
            throw new Error('User-scope research requires a company profile')
        }
        await progress({ phase: 'crafting', message: 'Crafting your use cases…' })
        const digest = `Company profile (already researched and verified):\n${JSON.stringify(config.companyProfile)}`
        const pool = await generateCards({ model: fastModel, digest, role: config.role, user: config.user, log })
        if (isNil(pool)) {
            throw new Error('Card generation produced no valid cards')
        }
        const useCases = await curateCards({ model: fastModel, cards: pool, role: config.role, profile: config.companyProfile, user: config.user, log })
        return {
            profile: retargetProfileForUser({ companyProfile: config.companyProfile }),
            useCases,
        }
    }

    const domain = data.website ?? config.website
    const companyText = data.companyText ?? config.companyText
    const companyRef = domain ?? companyText
    if (isNil(companyRef)) {
        throw new Error('Company-scope research requires a domain or company descriptor')
    }
    const companyLabel = domain ? domain.split('.')[0] : companyRef
    const companyPhrase = domain ? `${companyLabel} ${domain}` : companyRef

    await progress({ phase: 'reading', message: domain ? `Reading ${domain}…` : `Researching ${companyRef}…` })

    const role = data.role ?? config.role ?? null
    const searchQueries: SearchQuery[] = role
        ? [
            { focus: 'company', query: `${companyPhrase} business model products pricing` },
            { focus: 'company', query: `${companyLabel} competitors alternatives` },
            { focus: 'company', query: `${companyLabel} news` },
            { focus: 'role', query: `${role} at ${companyLabel} responsibilities tools metrics` },
            { focus: 'role', query: `${role} responsibilities at a company like ${companyPhrase}` },
            { focus: 'role', query: `what software and tools does ${aOrAn(role)} ${role} use every day` },
        ]
        : [
            { focus: 'company', query: `${companyPhrase} business model products pricing` },
            { focus: 'company', query: `${companyLabel} competitors alternatives` },
            { focus: 'company', query: `${companyLabel} news` },
            { focus: 'company', query: `${companyLabel} team structure how they work` },
            { focus: 'company', query: `${companyPhrase} industry operations best practices` },
        ]
    const [homepage, searchBlocks] = await Promise.all([
        isNil(domain) ? Promise.resolve(null) : readHomepage({ domain, log }),
        isNil(config.webSearch)
            ? Promise.resolve(null)
            : tavilyResearch({ apiKey: config.webSearch.apiKey, queries: searchQueries, log }),
    ])

    const groundwork = [
        homepage && domain ? buildHomepageDigest({ domain, homepage }) : null,
    ].filter((part): part is string => part !== null).join('\n\n')
    const gathered = searchBlocks ?? []
    const digest = gathered.length > 0
        ? `${groundwork}\n\n${gathered.map((block) => block.block).join('\n\n')}`
        : await fallbackResearch({ provider, auth: config.auth, providerConfig: config.providerConfig, fastModelId: config.fastModelId, billing, companyRef, role, groundwork, log })

    await progress({ phase: 'understanding', message: `Studying how ${homepage?.siteName ?? companyLabel} runs behind the scenes…` })
    const profilePromise = generateProfile({ model: fastModel, domain, companyText, digest, role, user: config.user, log })
    const cardsPromise = generateCards({ model: fastModel, digest, role, user: config.user, log })
    const profile = await profilePromise
    if (isNil(profile)) {
        throw new Error('Profile generation failed')
    }
    if (role) {
        const modelRole = typeof profile['userRole'] === 'string' ? profile['userRole'].trim() : null
        profile['userRole'] = modelRole && isMinorSpellingFix({ typed: role, suggested: modelRole }) ? modelRole : role
        profile['roleConfidence'] = 'high'
    }
    await progress({ phase: 'crafting', message: role ? `Crafting wins ${aOrAn(role)} ${role} would brag about…` : 'Borrowing best practices from your industry…' })
    const pool = await cardsPromise
    if (isNil(pool)) {
        throw new Error('Card generation produced no valid cards')
    }
    const useCases = await curateCards({ model: fastModel, cards: pool, role, profile, user: config.user, log })
    return { profile, useCases }
}
