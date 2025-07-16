import { ActivepiecesError, AgentRun, AgentTaskStatus, Cursor, ErrorCode, isNil, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, FindOperator } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { AgentRunEntity } from './agent-run.entity'

const agentRunsRepo = repoFactory(AgentRunEntity)

export const agentRunsService = (_log: FastifyBaseLogger) => ({
    async list(params: ListParams): Promise<SeekPage<AgentRun>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursorRequest)

        const paginator = buildPaginator({
            entity: AgentRunEntity,
            query: {
                limit: params.limit,
                order: 'ASC',
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
    async create(params: CreateParams): Promise<AgentRun> {
        return agentRunsRepo().save({
            agentId: params.agentId,
            projectId: params.projectId,
            prompt: params.prompt,
            status: params.status,
            startTime: params.startTime,
        })
    },
    async update(params: UpdateParams): Promise<AgentRun> {
        const agentRunToUpdate = await this.getOneOrThrow({ id: params.id, projectId: params.projectId })
        return agentRunsRepo().save({
            ...agentRunToUpdate,
            ...params.agentRun,
        })
    },
})

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

type CreateParams = {
    agentId: string
    projectId: string
    prompt: string
    status: AgentTaskStatus
    startTime: string
}

type UpdateParams = {
    id: string
    projectId: string
    agentRun: Partial<AgentRun>
}