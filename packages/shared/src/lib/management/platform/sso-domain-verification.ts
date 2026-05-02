import { z } from 'zod'

export enum SsoDomainVerificationStatus {
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    VERIFIED = 'VERIFIED',
}

export enum SsoDomainVerificationRecordType {
    TXT = 'TXT',
}

export const SsoDomainVerificationRecord = z.object({
    type: z.enum([SsoDomainVerificationRecordType.TXT]),
    name: z.string(),
    value: z.string(),
})

export type SsoDomainVerificationRecord = z.infer<typeof SsoDomainVerificationRecord>

export const SsoDomainVerification = z.object({
    status: z.enum([
        SsoDomainVerificationStatus.PENDING_VERIFICATION,
        SsoDomainVerificationStatus.VERIFIED,
    ]),
    record: SsoDomainVerificationRecord,
})

export type SsoDomainVerification = z.infer<typeof SsoDomainVerification>
