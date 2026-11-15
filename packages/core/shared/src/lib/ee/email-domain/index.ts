import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { SsoDomainVerificationStatus } from '../../management/platform/sso-domain-verification'

export const EmailDomain = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    domain: z.string(),
    verificationStatus: z.enum([
        SsoDomainVerificationStatus.PENDING_VERIFICATION,
        SsoDomainVerificationStatus.VERIFIED,
    ]),
    verificationRecordValue: z.string(),
})

export type EmailDomain = z.infer<typeof EmailDomain>

export const EmailDomainWithUsage = EmailDomain.extend({
    verificationRecordName: z.string(),
    peopleCount: z.number(),
})

export type EmailDomainWithUsage = z.infer<typeof EmailDomainWithUsage>

export const AddEmailDomainRequest = z.object({
    domain: z.string().max(253),
})

export type AddEmailDomainRequest = z.infer<typeof AddEmailDomainRequest>
