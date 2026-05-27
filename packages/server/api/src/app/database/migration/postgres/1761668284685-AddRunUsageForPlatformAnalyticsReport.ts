import { ApEdition, DateOrString } from '@activepieces/shared'
import dayjs from 'dayjs'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { z } from 'zod'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'
const log = system.globalLogger()

const AnalyticsPieceReportItem = z.object({
    name: z.string(),
    displayName: z.string(),
    logoUrl: z.string(),
    usageCount: z.number(),
})
type AnalyticsPieceReportItem = z.infer<typeof AnalyticsPieceReportItem>

const AnalyticsPieceReport = z.array(AnalyticsPieceReportItem)
type AnalyticsPieceReport = z.infer<typeof AnalyticsPieceReport>

const AnalyticsProjectReportItem = z.object({
    id: z.string(),
    displayName: z.string(),
    activeFlows: z.number(),
    totalFlows: z.number(),
})
type AnalyticsProjectReportItem = z.infer<typeof AnalyticsProjectReportItem>

const AnalyticsProjectReport = z.array(AnalyticsProjectReportItem)
type AnalyticsProjectReport = z.infer<typeof AnalyticsProjectReport>

const AnalyticsRunsUsageItem = z.object({
    day: z.string(),
    totalRuns: z.number(),
})
type AnalyticsRunsUsageItem = z.infer<typeof AnalyticsRunsUsageItem>

const AnalyticsRunsUsage = z.array(AnalyticsRunsUsageItem)
type AnalyticsRunsUsage = z.infer<typeof AnalyticsRunsUsage>


const PlatformAnalyticsReport = z.object({
    id: z.string(),
    created: DateOrString,
    updated: DateOrString,
    totalFlows: z.number(),
    activeFlows: z.number(),
    totalUsers: z.number(),
    activeUsers: z.number(),
    totalProjects: z.number(),
    activeProjects: z.number(),
    uniquePiecesUsed: z.number(),
    activeFlowsWithAI: z.number(),
    topPieces: AnalyticsPieceReport,
    topProjects: AnalyticsProjectReport,
    runsUsage: AnalyticsRunsUsage,
    platformId: z.string(),
})
type PlatformAnalyticsReport = z.infer<typeof PlatformAnalyticsReport>

export enum RunEnvironment {
    PRODUCTION = 'PRODUCTION',
    TESTING = 'TESTING',
}



async function analyzeRuns(queryRunner: QueryRunner, platformId: string): Promise<AnalyticsRunsUsageItem[]> {
    const threeMonthsAgo = dayjs().subtract(3, 'months').toDate()
    
    const runsData = await queryRunner.query(`
        SELECT 
            DATE(flow_run.created) as day,
            COUNT(*)::int as "totalRuns"
        FROM flow_run
        INNER JOIN project ON flow_run."projectId" = project.id
        WHERE project."platformId" = $1
        AND flow_run.created >= $2
        AND flow_run.environment = $3
        GROUP BY DATE(flow_run.created)
        ORDER BY DATE(flow_run.created) ASC
    `, [platformId, threeMonthsAgo, RunEnvironment.PRODUCTION])

    return runsData.map((row: AnalyticsRunsUsageItem) => ({
        day: row.day,
        totalRuns: row.totalRuns,
    }))
}

export class AddRunUsageForPlatformAnalyticsReport1761668284685 implements MigrationInterface {
    name = 'AddRunUsageForPlatformAnalyticsReport1761668284685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        log.info('Starting migration: adding runsUsage column to platform analytics reports.')
        
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ADD "runsUsage" jsonb
        `)

        const allPlatformAnalyticsReports = await queryRunner.query(`
            SELECT * FROM "platform_analytics_report"
        `)

        log.info({ count: allPlatformAnalyticsReports.length }, 'Migrating runs usage data for platform analytics reports.')
        let totalMigrated = 0
        await Promise.all(allPlatformAnalyticsReports.map(async (platformAnalyticsReport: PlatformAnalyticsReport) => {
            const platformId = platformAnalyticsReport.platformId
            const runsUsage = await analyzeRuns(queryRunner, platformId)
            await queryRunner.query(`
                UPDATE "platform_analytics_report"
                SET "runsUsage" = $1
                WHERE "platformId" = $2
            `, [JSON.stringify(runsUsage), platformId])
            totalMigrated++
        }))

        log.info({ totalMigrated }, 'Successfully migrated runs usage data for all reports.')
        
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report"
            ALTER COLUMN "runsUsage" SET NOT NULL
        `)

        log.info('Migration completed: runsUsage column set to NOT NULL.')

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_analytics_report" DROP COLUMN "runsUsage"
        `)
    }

}
