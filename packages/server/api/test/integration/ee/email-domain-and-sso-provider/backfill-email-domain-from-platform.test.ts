import { EmailDomain, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { BackfillEmailDomainFromPlatform1883000000000 } from '../../../../src/app/database/migration/postgres/1883000000000-BackfillEmailDomainFromPlatform'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

beforeAll(async () => {
    await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('BackfillEmailDomainFromPlatform migration', () => {
    it('copies each platform domain with its status, TXT value and start date', async () => {
        const verifiedSince = '2026-01-05T10:00:00.000Z'
        const pendingSince = '2026-11-01T10:00:00.000Z'
        const { mockPlatform: verifiedPlatform } = await mockAndSaveBasicSetup({ platform: { ssoDomain: 'Backfill-Verified.example.com', ssoDomainVerification: verification({ domain: 'backfill-verified.example.com', status: SsoDomainVerificationStatus.VERIFIED, createdAt: verifiedSince }) } })
        const { mockPlatform: pendingPlatform } = await mockAndSaveBasicSetup({ platform: { ssoDomain: 'backfill-pending.example.com', ssoDomainVerification: verification({ domain: 'backfill-pending.example.com', status: SsoDomainVerificationStatus.PENDING_VERIFICATION, createdAt: pendingSince }) } })
        const { mockPlatform: platformWithoutDomain } = await mockAndSaveBasicSetup()
        await databaseConnection().getRepository('email_domain').clear()

        await runMigration()

        expect(await findEmailDomains(verifiedPlatform.id)).toEqual([expect.objectContaining({
            domain: 'backfill-verified.example.com',
            verificationStatus: SsoDomainVerificationStatus.VERIFIED,
            verificationRecordValue: 'activepieces-verify=backfill-verified.example.com',
            created: new Date(verifiedSince),
        })])
        expect(await findEmailDomains(pendingPlatform.id)).toEqual([expect.objectContaining({
            domain: 'backfill-pending.example.com',
            verificationStatus: SsoDomainVerificationStatus.PENDING_VERIFICATION,
            created: new Date(pendingSince),
        })])
        expect(await findEmailDomains(platformWithoutDomain.id)).toHaveLength(0)
    })

    it('skips a domain that already has a row', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup({ platform: { ssoDomain: 'backfill-twice.example.com', ssoDomainVerification: verification({ domain: 'backfill-twice.example.com', status: SsoDomainVerificationStatus.VERIFIED, createdAt: new Date().toISOString() }) } })

        await runMigration()

        expect(await findEmailDomains(mockPlatform.id)).toHaveLength(1)
    })
})

async function runMigration(): Promise<void> {
    const queryRunner = databaseConnection().createQueryRunner()
    await queryRunner.connect()
    await new BackfillEmailDomainFromPlatform1883000000000().up(queryRunner)
    await queryRunner.release()
}

async function findEmailDomains(platformId: string): Promise<EmailDomain[]> {
    return databaseConnection().getRepository<EmailDomain>('email_domain').findBy({ platformId })
}

function verification({ domain, status, createdAt }: VerificationParams): SsoDomainVerification {
    return {
        status,
        record: {
            type: SsoDomainVerificationRecordType.TXT,
            name: `_activepieces-verify.${domain}`,
            value: `activepieces-verify=${domain}`,
        },
        createdAt,
    }
}

type VerificationParams = {
    domain: string
    status: SsoDomainVerificationStatus
    createdAt: string
}
