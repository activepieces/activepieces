import { Platform, PlatformAnalyticsReport } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../database/database-common'

type PlatformAnalyticsReportEntity = PlatformAnalyticsReport & {
    platform: Platform
}
export const PlatformAnalyticsReportEntity = new EntitySchema<PlatformAnalyticsReportEntity>({
    name: 'platform_analytics_report',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
        },
        outdated: {
            type: Boolean,
            nullable: false,
        },
        cachedAt: {
            type: Date,
            nullable: false,
        },
        runs: {
            type: 'jsonb',
            nullable: false,
        },
        flows: {
            type: 'jsonb',
            nullable: false,
        },
        users: {
            type: 'jsonb',
            nullable: false,
        },
    },    
    relations: {
        platform: {
            target: 'platform',
            type: 'many-to-one',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_platform_analytics_report_platform_id',
            },
        },
    },
})
