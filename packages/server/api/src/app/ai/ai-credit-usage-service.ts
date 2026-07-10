import { apId } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AI_CREDITS_PER_DOLLAR, ProjectAiCreditUsage } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { AiCreditUsageEntity, AiCreditUsageSchema } from './ai-credit-usage-entity'

const aiCreditUsageRepo = repoFactory<AiCreditUsageSchema>(AiCreditUsageEntity)

export const aiCreditUsageService = {
    async record({ platformId, projectId, provider, model, cost }: RecordParams): Promise<void> {
        const credits = cost * AI_CREDITS_PER_DOLLAR
        if (credits <= 0) {
            return
        }
        const day = apDayjs().utc().format('YYYY-MM-DD')
        const bucket = { platformId, projectId, provider, model, day }
        await aiCreditUsageRepo()
            .createQueryBuilder()
            .insert()
            .values({ id: apId(), ...bucket, credits: 0 })
            .orIgnore()
            .execute()
        await aiCreditUsageRepo().increment(bucket, 'credits', credits)
    },

    async list({ platformId }: ListParams): Promise<ProjectAiCreditUsage[]> {
        const monthStart = apDayjs().utc().startOf('month').format('YYYY-MM-DD')
        const rows = await aiCreditUsageRepo()
            .createQueryBuilder('usage')
            .withDeleted()
            .innerJoin('usage.project', 'project')
            .select('usage."projectId"', 'projectId')
            .addSelect('project."displayName"', 'projectName')
            .addSelect('SUM(usage.credits)', 'credits')
            .addSelect('SUM(CASE WHEN usage.day >= :monthStart THEN usage.credits ELSE 0 END)', 'creditsThisMonth')
            .where('usage."platformId" = :platformId', { platformId })
            .setParameter('monthStart', monthStart)
            .groupBy('usage."projectId"')
            .addGroupBy('project."displayName"')
            .orderBy('credits', 'DESC')
            .getRawMany<RawUsageRow>()
        return rows.map((row) => ({
            projectId: row.projectId,
            projectName: row.projectName,
            credits: Number(row.credits),
            creditsThisMonth: Number(row.creditsThisMonth),
        }))
    },
}

type RecordParams = {
    platformId: string
    projectId: string
    provider: string
    model: string
    cost: number
}

type ListParams = {
    platformId: string
}

type RawUsageRow = {
    projectId: string
    projectName: string
    credits: string | number
    creditsThisMonth: string | number
}
