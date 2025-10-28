import { Platform, PlatformAnalyticsReport } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'

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
        totalFlows: {
            type: Number,
        },
        activeFlows: {
            type: Number,
        },
        totalUsers: {
            type: Number,
        },
        activeUsers: {
            type: Number,
        },
        totalProjects: {
            type: Number,
        },
        activeProjects: {
            type: Number,
        },
        uniquePiecesUsed: {
            type: Number,
        },
        activeFlowsWithAI: {
            type: Number,
        },
        topPieces: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        tasksUsage: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        topProjects: {
            type: JSONB_COLUMN_TYPE,
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
