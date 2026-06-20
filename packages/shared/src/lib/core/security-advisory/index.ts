import { z } from 'zod'
import { Nullable } from '../common/base-model'

export const SecurityAdvisorySeverity = z.enum(['low', 'medium', 'high', 'critical'])
export type SecurityAdvisorySeverity = z.infer<typeof SecurityAdvisorySeverity>

export const SecurityAdvisorySource = z.enum(['github', 'activepieces'])
export type SecurityAdvisorySource = z.infer<typeof SecurityAdvisorySource>

export const SecurityAdvisory = z.object({
    id: z.string(),
    source: SecurityAdvisorySource,
    ghsaId: Nullable(z.string()),
    cveId: Nullable(z.string()),
    summary: z.string(),
    description: z.string(),
    severity: SecurityAdvisorySeverity,
    cvssScore: Nullable(z.number()),
    vulnerableVersionRange: z.string(),
    patchedVersion: Nullable(z.string()),
    publishedAt: z.string(),
    updatedAt: z.string(),
    htmlUrl: z.url().refine(
        (val) => /^https?:\/\//i.test(val),
        'htmlUrl must use http or https',
    ),
})
export type SecurityAdvisory = z.infer<typeof SecurityAdvisory>

export const GetSecurityAdvisoriesResponse = z.object({
    currentVersion: z.string(),
    fetchedAt: z.string(),
    advisories: z.array(SecurityAdvisory),
    partial: z.boolean(),
})
export type GetSecurityAdvisoriesResponse = z.infer<typeof GetSecurityAdvisoriesResponse>
