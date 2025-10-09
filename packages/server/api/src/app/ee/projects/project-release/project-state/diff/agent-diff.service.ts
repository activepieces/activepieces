import { AgentOperation, AgentOperationType, AgentState, isNil, ProjectState } from '@activepieces/shared'

export const agentDiffService = {
    diff({ newState, currentState }: DiffParams): AgentOperation[] {
        const updates = findAgentsToUpdate(currentState, newState)
        const creates = findAgentsToCreate(currentState, newState)
        const deletes = findAgentsToDelete(currentState, newState)
        return [...updates, ...creates, ...deletes]
    },
}

function isAgentChanged(stateOne: AgentState, stateTwo: AgentState): boolean {
    return JSON.stringify(stateOne) !== JSON.stringify(stateTwo) 
}

function findAgentsToUpdate(currentState: ProjectState, newState: ProjectState): AgentOperation[] {
    const agentOperations: AgentOperation[] = []
    currentState.agents?.forEach(agent => {
        const agentState = newState.agents?.find((a) => a.externalId === agent.externalId)
        if (!isNil(agentState) && isAgentChanged(agentState, agent)) {
            agentOperations.push({
                type: AgentOperationType.UPDATE_AGENT,
                agentState: agent,
                newAgentState: agentState,
            })
        }
    })
    return agentOperations
}

function findAgentsToCreate(currentState: ProjectState, newState: ProjectState): AgentOperation[] {
    const agentOperations: AgentOperation[] = []
    newState.agents?.forEach(agent => {
        const isExistingAgent = currentState.agents?.find((a) => a.externalId === agent.externalId)
        if (isNil(isExistingAgent)) {
            agentOperations.push({
                type: AgentOperationType.CREATE_AGENT,
                agentState: agent,
            })
        }
    })
    return agentOperations
}

function findAgentsToDelete(currentState: ProjectState, newState: ProjectState): AgentOperation[] {
    const agentOperations: AgentOperation[] = []
    currentState.agents?.forEach(agent => {
        const isStillPresent = newState.agents?.find((a) => a.externalId === agent.externalId)
        if (isNil(isStillPresent)) {
            agentOperations.push({
                type: AgentOperationType.DELETE_AGENT,
                agentState: agent,
            })
        }
    })
    return agentOperations
}

type DiffParams = {
    currentState: ProjectState
    newState: ProjectState
} 