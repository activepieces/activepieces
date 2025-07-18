import { ActivepiecesError, Agent, AgentOutputField, AgentOutputType, apId, Cursor, ErrorCode, isNil, PlatformUsageMetric, SeekPage, spreadIfDefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, FindOperator } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { PlatformPlanHelper } from '../ee/platform/platform-plan/platform-plan-helper'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { mcpService } from '../mcp/mcp-service'
import { projectService } from '../project/project-service'
import { AgentEntity } from './agent-entity'

export const agentRepo = repoFactory(AgentEntity)

export const agentsService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<Agent> {
        await PlatformPlanHelper.checkQuotaOrThrow({
            platformId: params.platformId,
            projectId: params.projectId,
            metric: PlatformUsageMetric.AGENTS,
        })
        const mcp = await mcpService(log).create({
            name: params.displayName,
            projectId: params.projectId,
        })
        const agentPayload: Omit<Agent, 'created' | 'updated' | 'taskCompleted'> = {
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
            outputType: AgentOutputType.NO_OUTPUT,
            outputFields: [],
        }
        const agent = await agentRepo().save(agentPayload)
        await mcpService(log).update({
            mcpId: mcp.id,
            agentId: agent.id,
        })
        return agent
    },
    async update(params: UpdateParams): Promise<Agent> {
        const platformId = await projectService.getPlatformId(params.projectId)
        await PlatformPlanHelper.checkResourceLocked({ platformId, resource: PlatformUsageMetric.AGENTS })

        await agentRepo().update({
            id: params.id,
            projectId: params.projectId,
        }, {
            ...spreadIfDefined('displayName', params.displayName),
            ...spreadIfDefined('systemPrompt', params.systemPrompt),
            ...spreadIfDefined('description', params.description),
            ...spreadIfDefined('testPrompt', params.testPrompt),
            ...spreadIfDefined('outputType', params.outputType),
            ...spreadIfDefined('outputFields', params.outputFields),
        })
        return this.getOneOrThrow({ id: params.id, projectId: params.projectId })
    },
    async getOne(params: GetOneParams): Promise<Agent | null> {
        const agent = await agentRepo().findOneBy({ id: params.id })
        if (isNil(agent)) {
            return null
        }
        return agent
    },
    async getOneOrThrow(params: GetOneParams): Promise<Agent> {
        const agent = await this.getOne({ id: params.id, projectId: params.projectId })
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
        const agent = await this.getOneOrThrow({ id: params.id, projectId: params.projectId })
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
    outputType?: string
    outputFields?: AgentOutputField[]
    projectId: string
}

type GetOneParams = {
    id: string
    projectId: string
}

type DeleteParams = {
    id: string
    projectId: string
}
