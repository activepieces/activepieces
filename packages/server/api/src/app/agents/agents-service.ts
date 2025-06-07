import { ActivepiecesError, Agent, apId, Cursor, ErrorCode, isNil, SeekPage, spreadIfDefined, Todo } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, FindOperator } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { AgentEntity } from './agent-entity'
import { agentExecutor } from './agent-executor'
import { Socket } from 'socket.io'
import { mcpService } from '../mcp/mcp-service'

const agentRepo = repoFactory(AgentEntity)

export const agentsService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<Agent> {
        const mcp = await mcpService(log).create({
            name: params.displayName,
            projectId: params.projectId,
        })
        const agentPayload: Omit<Agent, 'created' | 'updated'> = {
            displayName: params.displayName,
            id: apId(),
            description: params.description,
            platformId: params.platformId,
            profilePictureUrl: getAgentProfilePictureUrl(),
            systemPrompt: '',
            testPrompt: '',
            maxSteps: 10,
            projectId: params.projectId,
            mcpId: mcp.id,
        }
        const agent = await agentRepo().save(agentPayload)
        await mcpService(log).update({
            mcpId: mcp.id,
            agentId: agent.id,
        })
        return agent
    },
    async update(params: UpdateParams): Promise<Agent> {
        await agentRepo().update(params.id, {
            ...spreadIfDefined('displayName', params.displayName),
            ...spreadIfDefined('systemPrompt', params.systemPrompt),
            ...spreadIfDefined('description', params.description),
            ...spreadIfDefined('testPrompt', params.testPrompt),
        })
        return agentRepo().findOneByOrFail({ id: params.id })
    },
    async run(params: RunParams): Promise<Todo> {
        const agent = await this.getOneOrThrow({ id: params.id })
        return agentExecutor(log).execute({
            agent,
            userId: params.userId,
            prompt: params.prompt,
            socket: params.socket,
            callbackUrl: params.callbackUrl,
        })
    },
    async getOne(params: GetOneParams): Promise<Agent | null> {
        return agentRepo().findOneBy({ id: params.id })
    },
    async getOneOrThrow(params: GetOneParams): Promise<Agent> {
        const agent = await agentRepo().findOneBy({ id: params.id })
        if (isNil(agent)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'agent',
                },
            })
        }
        return agent
    },
    async delete(params: DeleteParams): Promise<void> {
        const agent = await this.getOneOrThrow({ id: params.id })
        await agentRepo().delete({
            id: agent.id,
        })
    },
    async list(params: ListParams): Promise<SeekPage<Agent>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursorRequest)

        const paginator = buildPaginator({
            entity: AgentEntity,
            query: {
                limit: params.limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const querySelector: Record<string, string | FindOperator<string>> = {
            projectId: Equal(params.projectId),
        }
        const queryBuilder = agentRepo()
            .createQueryBuilder('agent')
            .where(querySelector)
        const { data, cursor } = await paginator.paginate(queryBuilder)

        return paginationHelper.createPage<Agent>(
            data,
            cursor,
        )
    },
})

function getAgentProfilePictureUrl(): string {
    return `https://cdn.activepieces.com/quicknew/agents/robots/robot_${Math.floor(Math.random() * 10000)}.png`
}

type RunParams = {
    id: string
    prompt: string
    userId?: string
    socket: Socket
    callbackUrl?: string
}


type ListParams = {
    projectId: string
    limit: number
    cursorRequest: Cursor
}

type CreateParams = {
    displayName: string
    description: string
    platformId: string
    projectId: string
}

type UpdateParams = {
    id: string
    displayName?: string
    systemPrompt?: string
    description?: string
    testPrompt?: string
}

type GetOneParams = {
    id: string
}

type DeleteParams = {
    id: string
}
