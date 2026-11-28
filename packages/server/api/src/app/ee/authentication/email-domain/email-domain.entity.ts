import { EmailDomain, Platform, SsoDomainVerificationStatus } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export type EmailDomainSchema = EmailDomain & {
    platform: Platform
}

export const EmailDomainEntity = new EntitySchema<EmailDomainSchema>({
    name: 'email_domain',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        domain: {
            type: String,
            nullable: false,
        },
        verificationStatus: {
            type: String,
            nullable: false,
        },
        verificationRecordValue: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_email_domain_platform_id_domain',
            columns: ['platformId', 'domain'],
            unique: true,
        },
        {
            name: 'idx_email_domain_verified_domain',
            columns: ['domain'],
            unique: true,
            where: `"verificationStatus" = '${SsoDomainVerificationStatus.VERIFIED}'`,
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_email_domain_platform_id',
            },
        },
    },
})
