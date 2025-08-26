import { AIUsageFeature, createAIModel } from '@activepieces/common-ai'
import { ActivepiecesError, Agent, AgentOutputField, AgentOutputType, apId, Cursor, EnhancedAgentPrompt, ErrorCode, isNil, PlatformUsageMetric, PopulatedAgent, SeekPage, spreadIfDefined } from '@activepieces/shared'
import { openai } from '@ai-sdk/openai'
import { Schema as AiSchema, generateObject } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { Equal, FindOperator, In } from 'typeorm'
import { z } from 'zod'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { repoFactory } from '../core/db/repo-factory'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { PlatformPlanHelper } from '../ee/platform/platform-plan/platform-plan-helper'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { mcpService } from '../mcp/mcp-service'
import { projectService } from '../project/project-service'
import { AgentEntity } from './agent-entity'
import { agentRunsService } from './agent-runs/agent-runs-service'

export const agentRepo = repoFactory(AgentEntity)

export const agentsService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<PopulatedAgent> {
        await PlatformPlanHelper.checkQuotaOrThrow({
            platformId: params.platformId,
            projectId: params.projectId,
            metric: PlatformUsageMetric.AGENTS,
        })
        const mcp = await mcpService(log).create({
            name: params.displayName,
            projectId: params.projectId,
            externalId: params.mcpExternalId,
        })
        const id = apId()
        const { description, displayName, systemPrompt } = params.enhancePrompt ? await this.enhanceAgentPrompt({
            platformId: params.platformId,
            projectId: params.projectId,
            systemPrompt: params.systemPrompt,
            agentId: id,
        }) : { ...params }

        const agentPayload: Omit<Agent, 'created' | 'updated' | 'taskCompleted' | 'runCompleted'> = {
            id,
            displayName,
            description,
            systemPrompt,
            platformId: params.platformId,
            profilePictureUrl: params.profilePictureUrl ?? getAgentProfilePictureUrl(),
            maxSteps: 10,
            projectId: params.projectId,
            externalId: params.externalId ?? apId(),
            mcpId: mcp.id,
            outputType: params.outputType ?? AgentOutputType.NO_OUTPUT,
            outputFields: params.outputFields ?? [],
        }
        const agent = await agentRepo().save(agentPayload)
        await mcpService(log).update({
            mcpId: mcp.id,
            agentId: agent.id,
        })
        return enrichAgent(agent, log)
    },
    async enhanceAgentPrompt(params: EnhaceAgentParams): Promise<EnhancedAgentPrompt> {
        const { systemPrompt, projectId, platformId, agentId } = params
        const baseURL = await domainHelper.getPublicApiUrl({ path: '/v1/ai-providers/proxy/openai', platformId })
        const enhancePromptSchema = z.object({
            systemPrompt: z.string().describe('The enhanced version of the original prompt.'),
            displayName: z.string().describe('A concise and descriptive name for the agent based on the system prompt.'),
            description: z.string().describe('A brief description of what the agent does, derived from the system prompt.'),
        })

        const engineToken = await accessTokenManager.generateEngineToken({
            platformId,
            projectId,
        })
        const { system, prompt } = getEnhancementPrompt(systemPrompt)
        const model = createAIModel({
            providerName: 'openai',
            modelInstance: openai('gpt-4o-mini'),
            engineToken,
            baseURL,
            metadata: {
                feature: AIUsageFeature.AGENTS,
                agentid: agentId,
            },
        })

        const { object } = await generateObject({
            model,
            system,
            prompt,
            mode: 'json',
            schema: enhancePromptSchema as unknown as AiSchema,
        })
        return object as EnhancedAgentPrompt
    },
    async getOneByExternalIdOrThrow(params: GetOneByExternalIdParams): Promise<PopulatedAgent> {
        const agent = await agentRepo().findOneBy({ externalId: params.externalId, projectId: params.projectId })
        if (isNil(agent)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'agent',
                },
            })
        }
        return enrichAgent(agent, log)
    },
    async update(params: UpdateParams): Promise<PopulatedAgent> {
        const platformId = await projectService.getPlatformId(params.projectId)
        await PlatformPlanHelper.checkResourceLocked({ platformId, resource: PlatformUsageMetric.AGENTS })

        await agentRepo().update({
            id: params.id,
            projectId: params.projectId,
        }, {
            ...spreadIfDefined('displayName', params.displayName),
            ...spreadIfDefined('systemPrompt', params.systemPrompt),
            ...spreadIfDefined('description', params.description),
            ...spreadIfDefined('outputType', params.outputType),
            ...spreadIfDefined('outputFields', params.outputFields),
        })
        return this.getOneOrThrow({ id: params.id, projectId: params.projectId })
    },
    async getOne(params: GetOneParams): Promise<PopulatedAgent | null> {
        const agent = await agentRepo().findOneBy({ id: params.id })
        if (isNil(agent)) {
            return null
        }
        return enrichAgent(agent, log)
    },
    async getOneOrThrow(params: GetOneParams): Promise<PopulatedAgent> {
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
    async list(params: ListParams): Promise<SeekPage<PopulatedAgent>> {
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

        if (params.externalIds) {
            queryBuilder.andWhere({
                externalId: In(params.externalIds),
            })
        }
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<PopulatedAgent>(
            await Promise.all(data.map(agent => enrichAgent(agent, log))),
            cursor,
        )
    },
})

async function enrichAgent(agent: Omit<Agent, 'runCompleted'>, log: FastifyBaseLogger): Promise<PopulatedAgent> {
    const mcp = await mcpService(log).getOrThrow({ mcpId: agent.mcpId, projectId: agent.projectId })
    return {
        ...agent,
        runCompleted: await agentRunsService(log).count({ agentId: agent.id, projectId: agent.projectId }),
        mcp,
    }
}

function getAgentProfilePictureUrl(): string {
    return `https://cdn.activepieces.com/quicknew/agents/robots/robot_${Math.floor(Math.random() * 10000)}.png`
}

function getEnhancementPrompt(originalPrompt: string) {
    return {
        system: 'You are an AI assistant tasked with enhancing user prompts and generating names and short descriptions for AI agents. Your response must strictly follow the required JSON schema.',
        prompt: `Enhance the following prompt for an AI agent: "${originalPrompt}".
                Your task:
                1. **Enhanced Prompt**: Rewrite the prompt in a professional and structured manner formated as markdown text. Break it into clear sections like:
                - Goal
                - Instructions
                - Constraints or Style Guidelines (if applicable)

                The enhanced prompt should be as detailed and clear as possible, suitable for direct use in an advanced AI agent.

                2. **Agent Name**: Generate a short, well-formatted name for the agent using title case and spaces (e.g., "Legal Summarizer" or "Resume Optimizer").

                3. **Agent Description**: Write a concise description (maximum 10 words) that clearly communicates the agent’s purpose.`,
    }
}

type GetOneByExternalIdParams = {
    externalId: string
    projectId: string
}

type ListParams = {
    projectId: string
    limit: number
    cursorRequest: Cursor
    externalIds?: string[]
}

type CreateParams = {
    displayName: string
    description: string
    systemPrompt: string
    platformId: string
    projectId: string
    profilePictureUrl?: string
    outputType?: AgentOutputType
    outputFields?: AgentOutputField[]
    externalId?: string
    mcpExternalId?: string
    enhancePrompt?: boolean
}

type UpdateParams = {
    id: string
    projectId: string
    displayName?: string
    systemPrompt?: string
    description?: string
    outputType?: string
    outputFields?: AgentOutputField[]
}

type GetOneParams = {
    id: string
    projectId: string
}

type DeleteParams = {
    id: string
    projectId: string
}

type EnhaceAgentParams = {
    agentId: string
    platformId: string
    projectId: string
    systemPrompt: string
}