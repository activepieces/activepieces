import { Platform, PlatformAnalyticsReport } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../database/database-common'

type PlatformAnalyticsReportEntity = PlatformAnalyticsReport & {
    platform: Platform
}
export const PlatformAnalyticsReportEntity = new EntitySchema<PlatformAnalyticsReportEntity>({
    name: 'platform_analytics_report_cache',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
        },
        cachedAt: {
            type: Date,
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
        timeSaved: {
            type: Number,
            nullable: false,
        }
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
