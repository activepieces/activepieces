import { AgentRunSource } from '@activepieces/shared'
import { ToolSet } from 'ai'

const UNATTENDED_WEB_TOOLS = ['ap_fetch_url', 'ap_web_search', 'ap_scrape_url']

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
            ...groups.mcp,
        }
    }
    const configured = {
        ...groups.configuredPiece,
        ...groups.configuredFlow,
        ...groups.knowledgeBase,
    }
    if (source === AgentRunSource.AGENT) {
        return {
            ...configured,
            ...pick({ tools: groups.display, names: ['ap_show_questions', 'ap_show_quick_replies'] }),
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
    mcp: ToolSet
    configuredPiece: ToolSet
    configuredFlow: ToolSet
    knowledgeBase: ToolSet
    completion: ToolSet
}
