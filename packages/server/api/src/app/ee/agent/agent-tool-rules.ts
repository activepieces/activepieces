import { AgentAgentTool, AgentTool, AgentToolType } from '@activepieces/core-piece-types'
import { ActivepiecesError, ErrorCode, isNil, ProjectId, unique } from '@activepieces/core-utils'
import { Agent, AgentConfig, AgentVisibility } from '@activepieces/shared'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { AgentEntity } from './agent-entity'
import { agentToolsRollout } from './agent-tools-rollout'

async function validate({ entityManager, projectId, ownerExternalId, tools, previousTools = [] }: ValidateParams): Promise<void> {
    const agentTools = tools.filter(isAgentTool).filter((tool) => !previousTools.some((previous) => isAgentTool(previous) && previous.externalAgentId === tool.externalAgentId))
    if (agentTools.length === 0) {
        return
    }
    if (!agentToolsRollout.isOn()) {
        throw refuse('Calling other agents as tools is not available yet')
    }
    await entityManager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`agent-tools:${projectId}`])
    if (!isNil(ownerExternalId) && agentTools.some((tool) => tool.externalAgentId === ownerExternalId)) {
        throw refuse('An agent cannot use itself as a tool')
    }
    if (!isNil(ownerExternalId) && await isUsedAsAToolByAnotherAgent({ entityManager, projectId, externalId: ownerExternalId })) {
        throw refuse('This agent is already used as a tool by another agent, so it cannot call agents itself')
    }
    const targets = await findTargets({ entityManager, projectId, externalIds: agentTools.map((tool) => tool.externalAgentId) })
    const targetByExternalId = new Map(targets.map((target) => [target.externalId, target]))
    for (const tool of agentTools) {
        const target = targetByExternalId.get(tool.externalAgentId)
        if (isNil(target)) {
            throw refuse(`The agent behind tool "${tool.toolName}" was not found in this project`)
        }
        if (isNil(target.published)) {
            throw refuse(`Publish "${target.displayName}" before another agent can use it as a tool`)
        }
        if (callsOtherAgents(target)) {
            throw refuse(`"${target.displayName}" already calls other agents, and agents can only be nested one level deep`)
        }
    }
}

async function findTargets({ entityManager = repoFactory(AgentEntity)().manager, projectId, externalIds }: { entityManager?: EntityManager, projectId: ProjectId, externalIds: string[] }): Promise<Agent[]> {
    return entityManager.getRepository(AgentEntity).findBy({ projectId, externalId: In(unique(externalIds)), visibility: AgentVisibility.PROJECT })
}

function isCallable(target: Agent): boolean {
    return !isNil(target.published) && !callsOtherAgents(target)
}

function isAgentTool(tool: AgentTool): tool is AgentAgentTool {
    return tool.type === AgentToolType.AGENT
}

function callsOtherAgents(target: Agent): boolean {
    return holdsAgentTools(target.draft) || (!isNil(target.published) && holdsAgentTools(target.published))
}

function holdsAgentTools(config: AgentConfig): boolean {
    return config.tools.some(isAgentTool)
}

async function isUsedAsAToolByAnotherAgent({ entityManager, projectId, externalId }: { entityManager: EntityManager, projectId: ProjectId, externalId: string }): Promise<boolean> {
    const reference = JSON.stringify([{ type: AgentToolType.AGENT, externalAgentId: externalId }])
    return entityManager.getRepository(AgentEntity)
        .createQueryBuilder('agent')
        .where('agent."projectId" = :projectId', { projectId })
        .andWhere('agent."externalId" != :externalId', { externalId })
        .andWhere('(agent."draft"->\'tools\' @> CAST(:reference AS jsonb) OR COALESCE(agent."published"->\'tools\', \'[]\'::jsonb) @> CAST(:reference AS jsonb))', { reference })
        .getExists()
}

function refuse(message: string): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message } })
}

export const agentToolRules = {
    validate,
    findTargets,
    isCallable,
    isAgentTool,
}

type ValidateParams = {
    entityManager: EntityManager
    projectId: ProjectId
    ownerExternalId?: string
    tools: AgentTool[]
    previousTools?: AgentTool[]
}
