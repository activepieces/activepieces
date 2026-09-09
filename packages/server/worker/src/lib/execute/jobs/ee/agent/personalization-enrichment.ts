import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { ExecutePersonalizationResearchJobData } from '@activepieces/shared'
import { JobContext } from '../../../types'
import { asRecord } from './personalization-shaping'

export async function runPrefillLookup({ data, apiClient, log }: {
    data: ExecutePersonalizationResearchJobData
    apiClient: JobContext['apiClient']
    log: JobContext['log']
}): Promise<void> {
    const { platformId, userId, website } = data
    const config = await apiClient.getPersonalizationPrefillConfig({ platformId, userId })
    if (isNil(config.apolloApiKey) || isNil(config.email)) {
        return
    }
    const enrichment = await enrichWithApollo({ apiKey: config.apolloApiKey, email: config.email, domain: website, log })
    await emitPrefill({ enrichment, domain: website, apiClient, platformId, userId, log })
}

const ENRICHMENT_TIMEOUT_MS = 8_000

async function emitPrefill({ enrichment, domain, apiClient, platformId, userId, log }: {
    enrichment: ApolloEnrichment | null
    domain: string | null
    apiClient: JobContext['apiClient']
    platformId: string
    userId: string
    log: JobContext['log']
}): Promise<void> {
    if (isNil(enrichment)) {
        return
    }
    const brandLabel = domain?.split('.')[0] ?? ''
    const company = enrichment.companyName
        ?? (brandLabel.length > 0 ? brandLabel.charAt(0).toUpperCase() + brandLabel.slice(1) : null)
    if (isNil(enrichment.title) && isNil(company)) {
        return
    }
    const saved = await tryCatch(() => apiClient.savePersonalizationPrefill({
        platformId,
        userId,
        role: enrichment.title,
        confidence: enrichment.confidence,
    }))
    if (saved.error) {
        log.warn({ platform: { id: platformId }, user: { id: userId }, error: saved.error }, '[executePersonalizationResearch] Prefill save failed')
        return
    }
    log.info({ platform: { id: platformId }, user: { id: userId }, confidence: enrichment.confidence }, '[executePersonalizationResearch] Prefill emitted')
}

async function enrichWithApollo({ apiKey, email, domain, log }: {
    apiKey: string
    email: string
    domain: string | null
    log: JobContext['log']
}): Promise<ApolloEnrichment | null> {
    const client = safeHttp.createAxios({
        timeout: ENRICHMENT_TIMEOUT_MS,
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        },
    })
    const [person, org] = await Promise.all([
        tryCatch(() => client.post<Record<string, unknown>>('https://api.apollo.io/api/v1/people/match', { email, reveal_personal_emails: false })),
        isNil(domain)
            ? Promise.resolve(null)
            : tryCatch(() => client.get<Record<string, unknown>>(`https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`)),
    ])
    const lines: string[] = []
    const personData = asRecord(person.data?.data?.['person'])
    let title: string | null = null
    let departments: string[] | null = null
    let personOrgDomain: string | null = null
    if (personData) {
        title = typeof personData['title'] === 'string' ? personData['title'] : null
        const seniority = typeof personData['seniority'] === 'string' ? personData['seniority'] : null
        const headline = typeof personData['headline'] === 'string' ? personData['headline'] : null
        departments = Array.isArray(personData['departments'])
            ? personData['departments'].filter((entry): entry is string => typeof entry === 'string')
            : null
        const personOrg = personData['organization']
        if (typeof personOrg === 'object' && personOrg !== null && 'primary_domain' in personOrg) {
            const primaryDomain = Reflect.get(personOrg, 'primary_domain')
            personOrgDomain = typeof primaryDomain === 'string' ? primaryDomain.toLowerCase() : null
        }
        if (title || seniority || headline) {
            lines.push(`Person (verified via enrichment): title=${title ?? '?'} seniority=${seniority ?? '?'} headline=${headline ?? '?'}`)
        }
    }
    const orgData = org?.data?.data?.['organization'] as Record<string, unknown> | undefined
    let companyName: string | null = null
    if (orgData) {
        companyName = typeof orgData['name'] === 'string' ? orgData['name'] : null
        const industry = typeof orgData['industry'] === 'string' ? orgData['industry'] : null
        const employees = typeof orgData['estimated_num_employees'] === 'number' ? orgData['estimated_num_employees'] : null
        const description = typeof orgData['short_description'] === 'string' ? orgData['short_description'].slice(0, 400) : null
        const keywords = Array.isArray(orgData['keywords']) ? orgData['keywords'].slice(0, 10).join(', ') : null
        lines.push(`Company (verified via enrichment): name=${companyName ?? '?'} industry=${industry ?? '?'} employees=${employees ?? '?'} keywords=[${keywords ?? ''}]${description ? ` description=${description}` : ''}`)
    }
    if (lines.length === 0) {
        log.info({ domain }, '[executePersonalizationResearch] Apollo enrichment returned nothing usable')
        return null
    }
    log.info({ domain, personEnriched: !isNil(personData), orgEnriched: !isNil(orgData) }, '[executePersonalizationResearch] Apollo enrichment succeeded')
    return {
        digest: ['--- ENRICHMENT DATA (verified B2B database) ---', ...lines, '--- END ENRICHMENT ---'].join('\n'),
        title,
        departments,
        companyName,
        confidence: isNil(title)
            ? null
            : (!isNil(domain) && personOrgDomain === domain ? 'high' : 'medium'),
    }
}

type ApolloEnrichment = {
    digest: string
    title: string | null
    departments: string[] | null
    companyName: string | null
    confidence: 'low' | 'medium' | 'high' | null
}
