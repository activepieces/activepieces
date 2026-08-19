import { AgentRunSource } from '@activepieces/shared'
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
    mcp: toolSet('ap_create_flow', 'ap_test_flow'),
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
        expect(names).toContain('ap_generate_image')
        expect(names).toContain('ap_update_thinking_status')
    })

    it('never offers to change a connection or project its owner pinned', () => {
        const names = namesFor(AgentRunSource.AGENT)

        expect(names).not.toContain('ap_show_connection_picker')
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
