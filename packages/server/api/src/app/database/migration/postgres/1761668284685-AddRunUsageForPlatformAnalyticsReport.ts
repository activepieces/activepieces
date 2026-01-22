import { ApEdition } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import dayjs from 'dayjs'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'
const log = system.globalLogger()

const AnalyticsPieceReportItem = Type.Object({
    name: Type.String(),        
    displayName: Type.String(),
    logoUrl: Type.String(),
    usageCount: Type.Number(),
})
type AnalyticsPieceReportItem = Static<typeof AnalyticsPieceReportItem>

const AnalyticsPieceReport = Type.Array(AnalyticsPieceReportItem)
type AnalyticsPieceReport = Static<typeof AnalyticsPieceReport>

const AnalyticsProjectReportItem = Type.Object({
    id: Type.String(),
    displayName: Type.String(),
    activeFlows: Type.Number(),
    totalFlows: Type.Number(),
})
type AnalyticsProjectReportItem = Static<typeof AnalyticsProjectReportItem>

const AnalyticsProjectReport = Type.Array(AnalyticsProjectReportItem)
type AnalyticsProjectReport = Static<typeof AnalyticsProjectReport>

const AnalyticsRunsUsageItem = Type.Object({
    day: Type.String(),
    totalRuns: Type.Number(),
})
type AnalyticsRunsUsageItem = Static<typeof AnalyticsRunsUsageItem>

const AnalyticsRunsUsage = Type.Array(AnalyticsRunsUsageItem)
type AnalyticsRunsUsage = Static<typeof AnalyticsRunsUsage>


const PlatformAnalyticsReport = Type.Object({
    id: Type.String(),
    created: Type.String(),
    updated: Type.String(),
    totalFlows: Type.Number(),
    activeFlows: Type.Number(),
    totalUsers: Type.Number(),
    activeUsers: Type.Number(),
    totalProjects: Type.Number(),
    activeProjects: Type.Number(),
    uniquePiecesUsed: Type.Number(),
    activeFlowsWithAI: Type.Number(),
    topPieces: AnalyticsPieceReport,
    topProjects: AnalyticsProjectReport,
    runsUsage: AnalyticsRunsUsage,
    platformId: Type.String(),
})
type PlatformAnalyticsReport = Static<typeof PlatformAnalyticsReport>

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
