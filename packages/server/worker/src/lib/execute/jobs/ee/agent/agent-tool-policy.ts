import { AgentRunSource } from '@activepieces/shared'
import { ToolSet } from 'ai'

const UNATTENDED_WEB_TOOLS = ['ap_fetch_url', 'ap_web_search', 'ap_scrape_url']
const AGENT_CONNECTION_TOOLS = ['ap_discover_action_auth', 'ap_revalidate_connection']

function pick({ tools, names }: { tools: ToolSet, names: string[] }): ToolSet {
    return Object.fromEntries(Object.entries(tools).filter(([name]) => names.includes(name)))
}

// Which groups a run may reach, decided in one place because it has been the source of every
// permission bug in this feature. Listed, never subtracted: a group missing from a branch is
// unreachable, so a new group added elsewhere cannot leak into a surface that should not have it.
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
            ...groups.mcp,
        }
    }
    const configured = {
        ...groups.configuredPiece,
        ...groups.configuredFlow,
        ...groups.knowledgeBase,
    }
    // An agent conversation is attended, so it keeps the tools that need a reader: the display
    // prompts, the full web set and a real approval gate. Connection discovery comes with it
    // because the connection card is empty without it. It never gets the flow-building set,
    // project switching, phases, build plans or arbitrary action execution, which belong to the
    // platform assistant rather than to an agent someone configured.
    if (source === AgentRunSource.AGENT) {
        return {
            ...configured,
            ...pick({ tools: groups.crossProject, names: AGENT_CONNECTION_TOOLS }),
            ...groups.display,
            ...groups.web,
            ...groups.thinking,
            ...groups.completion,
        }
    }
    // A flow step has nobody to answer a prompt, and an agent that asks an empty room reads the
    // silence as a refusal and stops.
    return {
        ...configured,
        ...pick({ tools: groups.web, names: UNATTENDED_WEB_TOOLS }),
        ...groups.completion,
    }
}

export const agentToolPolicy = { selectToolsForSource }
export { UNATTENDED_WEB_TOOLS, AGENT_CONNECTION_TOOLS }

export type AgentToolGroups = {
    local: ToolSet
    display: ToolSet
    crossProject: ToolSet
    web: ToolSet
    thinking: ToolSet
    phase: ToolSet
    buildPlan: ToolSet
    email: ToolSet
    mcp: ToolSet
    configuredPiece: ToolSet
    configuredFlow: ToolSet
    knowledgeBase: ToolSet
    completion: ToolSet
}
