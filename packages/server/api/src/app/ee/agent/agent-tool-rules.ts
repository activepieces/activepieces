import { AgentAgentTool, AgentTool, AgentToolType } from '@activepieces/core-piece-types'
import { ActivepiecesError, ErrorCode, isNil, ProjectId, unique } from '@activepieces/core-utils'
import { AgentConfig } from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { AgentEntity } from './agent-entity'
import { agentToolsRollout } from './agent-tools-rollout'

const agentRepo = repoFactory(AgentEntity)

async function validate({ projectId, ownerExternalId, tools }: ValidateParams): Promise<void> {
    const agentTools = tools.filter(isAgentTool)
    if (agentTools.length === 0) {
        return
    }
    if (!agentToolsRollout.isOn()) {
        throw refuse('Calling other agents as tools is not available yet')
    }
    if (!isNil(ownerExternalId) && agentTools.some((tool) => tool.externalAgentId === ownerExternalId)) {
        throw refuse('An agent cannot use itself as a tool')
    }
    if (!isNil(ownerExternalId) && await isUsedAsAToolByAnotherAgent({ projectId, externalId: ownerExternalId })) {
        throw refuse('This agent is already used as a tool by another agent, so it cannot call agents itself')
    }
    const externalIds = unique(agentTools.map((tool) => tool.externalAgentId))
    const targets = await agentRepo().findBy({ projectId, externalId: In(externalIds) })
    const targetByExternalId = new Map(targets.map((target) => [target.externalId, target]))
    for (const tool of agentTools) {
        const target = targetByExternalId.get(tool.externalAgentId)
        if (isNil(target)) {
            throw refuse(`The agent behind tool "${tool.toolName}" was not found in this project`)
        }
        if (isNil(target.published)) {
            throw refuse(`Publish "${target.displayName}" before another agent can use it as a tool`)
        }
        if (holdsAgentTools(target.draft) || holdsAgentTools(target.published)) {
            throw refuse(`"${target.displayName}" already calls other agents, and agents can only be nested one level deep`)
        }
    }
}

function isAgentTool(tool: AgentTool): tool is AgentAgentTool {
    return tool.type === AgentToolType.AGENT
}

function holdsAgentTools(config: AgentConfig): boolean {
    return config.tools.some(isAgentTool)
}

async function isUsedAsAToolByAnotherAgent({ projectId, externalId }: { projectId: ProjectId, externalId: string }): Promise<boolean> {
    const reference = JSON.stringify([{ type: AgentToolType.AGENT, externalAgentId: externalId }])
    return agentRepo()
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
    isAgentTool,
}

type ValidateParams = {
    projectId: ProjectId
    ownerExternalId?: string
    tools: AgentTool[]
}
