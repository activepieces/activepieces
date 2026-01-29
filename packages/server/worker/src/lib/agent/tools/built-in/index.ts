import { AgentTool, AgentToolType, AgentOutputField } from '@activepieces/shared'
import { ToolSet } from 'ai'
import { createFlowMakerTools } from './flow-maker'
import { createUpdateTaskStatusTool } from './update-task-status'

type CreateBuiltInToolsParams = {
    engineToken: string
    projectId: string
    platformId: string
    state: Record<string, unknown>
    structuredOutputSchema?: AgentOutputField[]
    tools: AgentTool[]
}

export function createBuiltInTools({ engineToken, projectId, platformId, state, tools, structuredOutputSchema }: CreateBuiltInToolsParams): ToolSet {
    const hasFlowMakerAccess = tools.some(tool => tool.type === AgentToolType.FLOW_MAKER)
    
    const builtInTools: ToolSet = {
        ...createUpdateTaskStatusTool({ structuredOutputSchema }),
    }

    if (hasFlowMakerAccess) {
        const flowMakerTools = createFlowMakerTools({ engineToken, projectId, platformId, state })
        Object.assign(builtInTools, flowMakerTools)
    }

    return builtInTools
}
