import { apDayjs } from '@activepieces/server-shared'
import { apId, FileCompression, FileType, ProjectId, TriggerRun, TriggerRunStatus, TriggerStatusReport } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { projectService } from '../../project/project-service'
import { TriggerRunEntity } from './trigger-run.entity'

const triggerRunRepo = repoFactory(TriggerRunEntity)

export const triggerRunService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<TriggerRun> {
        const { projectId, triggerSourceId, status, payload, error, pieceName, pieceVersion, jobId } = params
        const buffer = Buffer.from(JSON.stringify(payload))
        const platformId = await projectService.getPlatformId(projectId)
        const file = await fileService(log).save({
            projectId,
            type: FileType.TRIGGER_PAYLOAD,
            fileName: 'payload',
            compression: FileCompression.NONE,
            data: buffer,
            size: buffer.length,
            metadata: {
                triggerSourceId,
            },
        })
        const triggerRunId = apId()
        const request: Omit<TriggerRun, 'created' | 'updated'> = {
            id: triggerRunId,
            jobId,
            projectId,
            status,
            pieceName,
            pieceVersion,
            triggerSourceId,
            platformId,
            payloadFileId: file.id,
            error,
        }
        await triggerRunRepo().upsert(request, ['jobId'])
        return triggerRunRepo().findOneByOrFail({ jobId })
    },
    async getStatusReport(params: GetStatusReportParams): Promise<TriggerStatusReport> {
        const { platformId } = params
        const fourteenDaysAgo = apDayjs().subtract(14, 'day').startOf('day').toDate()
        const runs: { day: string, pieceName: string, status: TriggerRunStatus, count: number }[] = await triggerRunRepo()
            .createQueryBuilder('trigger_run')
            .select([
                'DATE("trigger_run"."created") as day',
                '"trigger_run"."pieceName" as "pieceName"',
                '"trigger_run"."status" as "status"',
                'COUNT(*) as count',
            ])
            .where('"trigger_run"."platformId" = :platformId', { platformId })
            .andWhere('"trigger_run"."created" >= :fourteenDaysAgo', { fourteenDaysAgo })
            .groupBy('day')
            .addGroupBy('"trigger_run"."pieceName"')
            .addGroupBy('"trigger_run"."status"')
            .getRawMany()

        const pieces: TriggerStatusReport['pieces'] = {}

        for (const run of runs) {
            const formattedDay = apDayjs(run.day).format('YYYY-MM-DD')
            if (!pieces[run.pieceName]) {
                pieces[run.pieceName] = {
                    dailyStats: {},
                    totalRuns: 0,
                }
            }
            if (!pieces[run.pieceName].dailyStats[formattedDay]) {
                pieces[run.pieceName].dailyStats[formattedDay] = { success: 0, failure: 0 }
            }
            if (run.status === TriggerRunStatus.COMPLETED) {
                pieces[run.pieceName].dailyStats[formattedDay].success += Number(run.count)
            }
            else {
                pieces[run.pieceName].dailyStats[formattedDay].failure += Number(run.count)
            }
            pieces[run.pieceName].totalRuns += Number(run.count)
        }

        return { pieces }
    },
})

type GetStatusReportParams = {
    platformId: ProjectId
}

type CreateParams = {
    projectId: ProjectId
    jobId: string
    triggerSourceId: string
    status: TriggerRunStatus
    pieceName: string
    pieceVersion: string
    payload?: unknown
    error?: string
}