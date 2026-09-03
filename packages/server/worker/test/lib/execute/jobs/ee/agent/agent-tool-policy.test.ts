import { AgentRunSource, mcpToolNameUtils } from '@activepieces/shared'
import { Tool, ToolSet } from 'ai'
import { describe, expect, it } from 'vitest'
import { agentToolPolicy, AgentToolGroups } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-tool-policy'

function toolSet(...names: string[]): ToolSet {
    return Object.fromEntries(names.map((name) => [name, {} as Tool]))
}

const GROUPS: AgentToolGroups = {
    local: toolSet('ap_select_project', 'ap_deselect_project'),
    display: toolSet('ap_show_connection_picker', 'ap_show_connection_required', 'ap_show_mcp_reconnect', 'ap_show_project_picker', 'ap_show_questions', 'ap_show_quick_replies'),
    crossProject: toolSet('ap_discover_action_auth', 'ap_revalidate_connection', 'ap_execute_action'),
    web: toolSet('ap_fetch_url', 'ap_web_search', 'ap_scrape_url', 'ap_generate_image'),
    thinking: toolSet('ap_update_thinking_status'),
    phase: toolSet('ap_set_phase'),
    buildPlan: toolSet('ap_set_build_plan'),
    email: toolSet('ap_send_email'),
    agentSurface: toolSet('ap_list_agents', 'ap_create_agent', 'ap_update_agent', 'ap_add_agent_tool', 'ap_remove_agent_tool'),
    mcp: toolSet('ap_create_flow', 'ap_test_flow', 'ap_research_pieces', 'ap_list_connections'),
    configuredPiece: toolSet('gmail_find_email'),
    configuredFlow: toolSet('run_my_flow'),
    knowledgeBase: toolSet('search_handbook'),
    completion: toolSet('ap_return_output'),
}

function namesFor(source: AgentRunSource): string[] {
    return Object.keys(agentToolPolicy.selectToolsForSource({ source, groups: GROUPS })).sort()
}

describe('what a chat run may reach', () => {
    it('reaches the platform assistant surface', () => {
        const names = namesFor(AgentRunSource.CHAT)

        expect(names).toContain('ap_create_flow')
        expect(names).toContain('ap_set_build_plan')
        expect(names).toContain('ap_select_project')
        expect(names).toContain('ap_execute_action')
        expect(names).toContain('ap_send_email')
        expect(names).toContain('ap_create_agent')
    })
})

describe('what may reach the tools that build saved agents', () => {
    const AGENT_SURFACE_TOOLS = ['ap_list_agents', 'ap_create_agent', 'ap_update_agent', 'ap_add_agent_tool', 'ap_remove_agent_tool']

    it('a chat run and the builder, and no surface with nobody reading', () => {
        for (const toolName of AGENT_SURFACE_TOOLS) {
            expect(namesFor(AgentRunSource.CHAT), toolName).toContain(toolName)
            expect(namesFor(AgentRunSource.AGENT_BUILDER), toolName).toContain(toolName)
            expect(namesFor(AgentRunSource.AGENT), toolName).not.toContain(toolName)
            expect(namesFor(AgentRunSource.FLOW_STEP), toolName).not.toContain(toolName)
        }
    })
})

describe('what the agent builder may reach', () => {
    it('reaches enough to find a piece and a connection for it', () => {
        const names = namesFor(AgentRunSource.AGENT_BUILDER)

        expect(names).toContain('ap_research_pieces')
        expect(names).toContain('ap_list_connections')
        expect(names).toContain('ap_show_connection_picker')
        expect(names).toContain('ap_show_questions')
        expect(names).toContain('ap_update_thinking_status')
    })

    it('never reaches the flow-building surface it sits beside, nor the web', () => {
        const names = namesFor(AgentRunSource.AGENT_BUILDER)

        expect(names).not.toContain('ap_web_search')
        expect(names).not.toContain('ap_fetch_url')
        expect(names).not.toContain('ap_create_flow')
        expect(names).not.toContain('ap_test_flow')
        expect(names).not.toContain('ap_set_build_plan')
        expect(names).not.toContain('ap_set_phase')
        expect(names).not.toContain('ap_select_project')
        expect(names).not.toContain('ap_deselect_project')
        expect(names).not.toContain('ap_execute_action')
        expect(names).not.toContain('ap_send_email')
    })

    it('runs no tool the agent itself was configured with, since it is building that agent rather than being it', () => {
        const names = namesFor(AgentRunSource.AGENT_BUILDER)

        expect(names).not.toContain('gmail_find_email')
        expect(names).not.toContain('run_my_flow')
        expect(names).not.toContain('search_handbook')
        expect(names).not.toContain('ap_return_output')
    })
})

describe('what an agent conversation may reach', () => {
    it('reaches the tools someone configured for it', () => {
        const names = namesFor(AgentRunSource.AGENT)

        expect(names).toContain('gmail_find_email')
        expect(names).toContain('run_my_flow')
        expect(names).toContain('search_handbook')
        expect(names).toContain('ap_return_output')
    })

    it('reaches the prompts and the web set, because someone is reading', () => {
        const names = namesFor(AgentRunSource.AGENT)

        expect(names).toContain('ap_show_questions')
        expect(names).toContain('ap_show_quick_replies')
        expect(names).toContain('ap_show_connection_picker')
        expect(names).toContain('ap_generate_image')
        expect(names).toContain('ap_update_thinking_status')
    })

    it('never reaches the surfaces that switch project or hunt for other credentials', () => {
        const names = namesFor(AgentRunSource.AGENT)

        expect(names).not.toContain('ap_show_connection_required')
        expect(names).not.toContain('ap_show_mcp_reconnect')
        expect(names).not.toContain('ap_show_project_picker')
        expect(names).not.toContain('ap_discover_action_auth')
        expect(names).not.toContain('ap_revalidate_connection')
    })

    it('never reaches the platform assistant surface', () => {
        const names = namesFor(AgentRunSource.AGENT)

        expect(names).not.toContain('ap_execute_action')
        expect(names).not.toContain('ap_create_flow')
        expect(names).not.toContain('ap_test_flow')
        expect(names).not.toContain('ap_set_build_plan')
        expect(names).not.toContain('ap_set_phase')
        expect(names).not.toContain('ap_select_project')
        expect(names).not.toContain('ap_deselect_project')
        expect(names).not.toContain('ap_send_email')
    })
})

describe('what an unattended flow step may reach', () => {
    it('reaches its configured tools and the web reads that need no reader', () => {
        const names = namesFor(AgentRunSource.FLOW_STEP)

        expect(names).toContain('gmail_find_email')
        expect(names).toContain('ap_fetch_url')
        expect(names).toContain('ap_web_search')
        expect(names).toContain('ap_scrape_url')
        expect(names).toContain('ap_return_output')
    })

    it('never reaches anything that waits on a person', () => {
        const names = namesFor(AgentRunSource.FLOW_STEP)

        expect(names).not.toContain('ap_show_connection_picker')
        expect(names).not.toContain('ap_show_questions')
        expect(names).not.toContain('ap_generate_image')
        expect(names).not.toContain('ap_send_email')
        expect(names).not.toContain('ap_execute_action')
        expect(names).not.toContain('ap_create_flow')
    })
})

describe('the shape of the policy itself', () => {
    it('gives a new group to chat only, so an added group cannot leak', () => {
        const withNewGroup: AgentToolGroups = {
            ...GROUPS,
            buildPlan: toolSet('ap_set_build_plan', 'ap_brand_new_capability'),
        }

        expect(
            Object.keys(agentToolPolicy.selectToolsForSource({ source: AgentRunSource.AGENT, groups: withNewGroup })),
        ).not.toContain('ap_brand_new_capability')
        expect(
            Object.keys(agentToolPolicy.selectToolsForSource({ source: AgentRunSource.FLOW_STEP, groups: withNewGroup })),
        ).not.toContain('ap_brand_new_capability')
    })

    it('returns nothing at all when every group is empty', () => {
        const empty = Object.fromEntries(
            Object.keys(GROUPS).map((group) => [group, {}]),
        ) as AgentToolGroups

        for (const source of [AgentRunSource.CHAT, AgentRunSource.AGENT, AgentRunSource.FLOW_STEP]) {
            expect(agentToolPolicy.selectToolsForSource({ source, groups: empty })).toEqual({})
        }
    })
})

describe('withValidNames', () => {
    const names = (tools: { toolName: string }[], reserved?: string[]): string[] =>
        agentToolPolicy.withValidNames({ tools, ...(reserved === undefined ? {} : { reserved }) }).map((tool) => tool.toolName)

    it('rewrites a name the providers would reject and keeps the rest of the tool', () => {
        const [rewritten] = agentToolPolicy.withValidNames({ tools: [{ toolName: 'Company Docs', sourceId: 'kb-1' }] })

        expect(rewritten.toolName).toMatch(PROVIDER_PATTERN)
        expect(rewritten.sourceId).toBe('kb-1')
    })

    it('leaves an already generated name alone, because createToolName is not idempotent', () => {
        const generated = mcpToolNameUtils.createToolName('Company Docs')

        expect(names([{ toolName: generated }])).toEqual([generated])
    })

    it('rewrites a dotted name, which only Anthropic accepts', () => {
        expect(names([{ toolName: 'handbook.pdf' }])).not.toEqual(['handbook.pdf'])
    })

    it('keeps two tools that would otherwise collapse onto one toolset key', () => {
        const collided = names([{ toolName: 'Company Docs' }, { toolName: 'Company docs' }])

        expect(new Set(collided).size).toBe(2)
        for (const name of collided) {
            expect(name).toMatch(PROVIDER_PATTERN)
        }
    })

    it('keeps tools whose names share no characters a provider accepts', () => {
        const collided = names([{ toolName: '\u6587\u6863' }, { toolName: '\u691c\u7d22' }, { toolName: '!!!' }])

        expect(new Set(collided).size).toBe(3)
    })

    it('does not hand a collision the name of a tool that already claimed it', () => {
        const collided = names([{ toolName: 'x_2' }, { toolName: 'x' }, { toolName: 'x' }])

        expect(new Set(collided).size).toBe(3)
    })

    it('does not reuse a name another tool group already claimed', () => {
        expect(names([{ toolName: 'company_docs' }], ['company_docs'])).not.toEqual(['company_docs'])
    })

    it('never lets a configured tool hold a built-in name, which the policy spreads last', () => {
        for (const builtIn of ['ap_fetch_url', 'ap_show_questions', 'updateTaskStatus']) {
            const [name] = names([{ toolName: builtIn }])

            expect(name).not.toBe(builtIn)
            expect(name.startsWith('ap_')).toBe(false)
            expect(name).toMatch(PROVIDER_PATTERN)
        }
    })

    it('trims a name past the 64 character limit', () => {
        const [name] = names([{ toolName: 'a'.repeat(200) }])

        expect(name.length).toBeLessThanOrEqual(64)
    })
})

const PROVIDER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/
