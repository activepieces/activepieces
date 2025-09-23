import { ActivepiecesError, AgentRun, AgentTaskStatus, apId, Cursor, ErrorCode, isNil, SeekPage, spreadIfDefined, UpdateAgentRunRequestBody, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, FindOperator } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectService } from '../../project/project-service'
import { jobQueue } from '../../workers/queue/job-queue'
import { JobType } from '../../workers/queue/queue-manager'
import { AgentRunEntity } from './agent-run.entity'

const agentRunsRepo = repoFactory(AgentRunEntity)

export const agentRunsService = (log: FastifyBaseLogger) => ({
    async list(params: ListParams): Promise<SeekPage<AgentRun>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursorRequest)

        const paginator = buildPaginator({
            entity: AgentRunEntity,
            query: {
                limit: params.limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const querySelector: Record<string, string | FindOperator<string>> = {
            projectId: Equal(params.projectId),
            agentId: Equal(params.agentId),
        }
        const queryBuilder = agentRunsRepo()
            .createQueryBuilder('agent_run')
            .where(querySelector)
        const { data, cursor } = await paginator.paginate(queryBuilder)

        return paginationHelper.createPage<AgentRun>(
            data,
            cursor,
        )
    },
    async count(params: CountParams): Promise<number> {
        return agentRunsRepo().count({
            where: {
                agentId: params.agentId,
            },
        })
    },
    async getOne(params: GetOneParams): Promise<AgentRun | null> {
        const agentRun = await agentRunsRepo().findOneBy({ id: params.id, projectId: params.projectId })
        if (isNil(agentRun)) {
            return null
        }
        return agentRun
    },
    async getOneOrThrow(params: GetOneParams): Promise<AgentRun> {
        const agentRun = await this.getOne({ id: params.id, projectId: params.projectId })
        if (isNil(agentRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'agent run',
                },
            })
        }
        return agentRun
    },
    async run(params: RunParams): Promise<AgentRun> {

        const agentRun = await agentRunsRepo().save({
            id: apId(),
            agentId: params.agentId,
            projectId: params.projectId,
            prompt: params.prompt,
            steps: [],
            status: AgentTaskStatus.IN_PROGRESS,
        })

        const platformId = await projectService.getPlatformId(params.projectId)
        await jobQueue(log).add({
            id: agentRun.id,
            type: JobType.ONE_TIME,
            data: {
                ...params,
                jobType: WorkerJobType.EXECUTE_AGENT,
                agentId: params.agentId,
                platformId,
                agentRunId: agentRun.id,
            },
        })

        return agentRun
    },
    async update(params: UpdateParams): Promise<AgentRun> {
        await this.getOneOrThrow({ id: params.id, projectId: params.projectId })
        await agentRunsRepo().update({
            id: params.id,
        }, {
            ...spreadIfDefined('status', params.agentRun.status),
            ...spreadIfDefined('steps', params.agentRun.steps),
            ...spreadIfDefined('message', params.agentRun.message),
            ...spreadIfDefined('output', params.agentRun.output),
            ...spreadIfDefined('startTime', params.agentRun.startTime),
            ...spreadIfDefined('finishTime', params.agentRun.finishTime),
        })

        return this.getOneOrThrow({ id: params.id, projectId: params.projectId })
    },
})

type CountParams = {
    agentId: string
    projectId: string
}

type ListParams = {
    projectId: string
    limit: number
    cursorRequest: Cursor
    agentId: string
}

type GetOneParams = {
    id: string
    projectId: string
}

type RunParams = {
    agentId: string
    projectId: string
    prompt: string
}

type UpdateParams = {
    id: string
    projectId: string
    agentRun: UpdateAgentRunRequestBody
}