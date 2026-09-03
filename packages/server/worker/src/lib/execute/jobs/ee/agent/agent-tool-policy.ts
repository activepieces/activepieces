import { AgentRunSource, mcpToolNameUtils, TASK_COMPLETION_TOOL_NAME } from '@activepieces/shared'
import { ToolSet } from 'ai'

const UNATTENDED_WEB_TOOLS = ['ap_fetch_url', 'ap_web_search', 'ap_scrape_url']
const BUILT_IN_TOOL_PREFIX = 'ap_'

function withValidNames<T extends { toolName: string }>({ tools, reserved = [] }: { tools: T[], reserved?: string[] }): T[] {
    const taken = new Set<string>(reserved)
    return tools.map((tool) => {
        const claimable = toClaimableName(tool.toolName)
        let name = claimable
        for (let attempt = 1; taken.has(name); attempt++) {
            name = toClaimableName(`${claimable}_${attempt}`)
        }
        taken.add(name)
        return name === tool.toolName ? tool : { ...tool, toolName: name }
    })
}

function toClaimableName(name: string): string {
    const valid = mcpToolNameUtils.toValidToolName(name)
    return valid.startsWith(BUILT_IN_TOOL_PREFIX) || valid === TASK_COMPLETION_TOOL_NAME
        ? mcpToolNameUtils.createToolName(`tool_${valid}`)
        : valid
}

// Listed, never subtracted: a group missing from a branch is unreachable, so a group added
// elsewhere cannot leak into a surface that should not have it.
function pick({ tools, names }: { tools: ToolSet, names: string[] }): ToolSet {
    return Object.fromEntries(Object.entries(tools).filter(([name]) => names.includes(name)))
}

function selectToolsForSource({ source, groups }: { source: AgentRunSource, groups: AgentToolGroups }): ToolSet {
    if (source === AgentRunSource.CHAT) {
        return {
            ...groups.local,
            ...groups.display,
            ...groups.crossProject,
            ...groups.web,
            ...groups.thinking,
            ...groups.phase,
            ...groups.buildPlan,
            ...groups.email,
            ...groups.agentSurface,
            ...groups.mcp,
        }
    }
    const configured = {
        ...groups.configuredPiece,
        ...groups.configuredFlow,
        ...groups.knowledgeBase,
    }
    if (source === AgentRunSource.AGENT_BUILDER) {
        return {
            ...groups.agentSurface,
            ...pick({ tools: groups.display, names: ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_connection_picker', 'ap_show_connection_required'] }),
            ...pick({ tools: groups.mcp, names: ['ap_research_pieces', 'ap_list_connections'] }),
            ...groups.thinking,
        }
    }
    if (source === AgentRunSource.AGENT) {
        return {
            ...configured,
            ...pick({ tools: groups.display, names: ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_showcase', 'ap_show_connection_picker'] }),
            ...groups.web,
            ...groups.thinking,
            ...groups.completion,
        }
    }
    // Nobody is reading, and an agent that asks an empty room reads the silence as a refusal.
    return {
        ...configured,
        ...pick({ tools: groups.web, names: UNATTENDED_WEB_TOOLS }),
        ...groups.completion,
    }
}

export const agentToolPolicy = { selectToolsForSource, withValidNames }
export { UNATTENDED_WEB_TOOLS }

export type AgentToolGroups = {
    local: ToolSet
    display: ToolSet
    crossProject: ToolSet
    web: ToolSet
    thinking: ToolSet
    phase: ToolSet
    buildPlan: ToolSet
    email: ToolSet
    agentSurface: ToolSet
    mcp: ToolSet
    configuredPiece: ToolSet
    configuredFlow: ToolSet
    knowledgeBase: ToolSet
    completion: ToolSet
}
