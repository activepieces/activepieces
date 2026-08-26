import { AgentRunSource } from '@activepieces/shared'
import { ToolSet } from 'ai'

const UNATTENDED_WEB_TOOLS = ['ap_fetch_url', 'ap_web_search', 'ap_scrape_url']

// The builder changes one agent and nothing else. It gets the agent tools, enough of the read-only
// MCP surface to find a piece and a connection for it, and the cards it needs to ask the user
// something. Not the flow-building tools, not project switching, not email.
const BUILDER_DISPLAY_TOOLS = ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_connection_picker', 'ap_show_connection_required']
const BUILDER_MCP_TOOLS = ['ap_research_pieces', 'ap_list_connections']

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
            ...pick({ tools: groups.display, names: BUILDER_DISPLAY_TOOLS }),
            ...pick({ tools: groups.mcp, names: BUILDER_MCP_TOOLS }),
            ...groups.web,
            ...groups.thinking,
        }
    }
    if (source === AgentRunSource.AGENT) {
        return {
            ...configured,
            ...pick({ tools: groups.display, names: ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_showcase'] }),
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

export const agentToolPolicy = { selectToolsForSource }
export { BUILDER_DISPLAY_TOOLS, BUILDER_MCP_TOOLS, UNATTENDED_WEB_TOOLS }

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
