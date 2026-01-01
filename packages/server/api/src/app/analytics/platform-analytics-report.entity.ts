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
        estimatedTimeSavedPerStep: {
            type: Number,
            nullable: true,
        },
        platformId: {
            type: String,
        },
        outdated: {
            type: Boolean,
        },
        users: {
            type: 'jsonb',
            nullable: false,
        },
        topPieces: {
            type: 'jsonb',
            nullable: false,
        },
        runsUsage: {
            type: 'jsonb',
            nullable: false,
        },
        flowsDetails: {
            type: 'jsonb',
            nullable: false,
        },
    },    
    relations: {
        platform: {
            target: 'platform',
            type: 'one-to-one',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_platform_analytics_report_platform_id',
            },
        },
    },
})
