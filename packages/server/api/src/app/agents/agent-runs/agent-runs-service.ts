import { ActivepiecesError, AgentRun, Cursor, ErrorCode, isNil, SeekPage } from '@activepieces/shared'
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