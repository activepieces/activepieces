import { describe, expect, it } from 'vitest'
import { chatBilling } from '../../src/lib/ee/agent/chat-billing'
import { AGENT_SKILLS, agentToolSkills, CORE_TOOL_NAMES, LAZY_TOOL_NAME, MAX_CORE_TOOLS } from '../../src/lib/ee/agent/tool-skills'

describe('agentToolSkills', () => {
    it('keeps every surface at or under the core tool cap', () => {
        for (const names of Object.values(CORE_TOOL_NAMES)) {
            expect(names.length).toBeLessThanOrEqual(MAX_CORE_TOOLS)
        }
    })

    it('puts each tool in at most one skill and never in a core list', () => {
        const skillTools = AGENT_SKILLS.flatMap((skill) => skill.toolNames)
        expect(new Set(skillTools).size).toBe(skillTools.length)
        const core = new Set(Object.values(CORE_TOOL_NAMES).flat())
        const chatCore = new Set(CORE_TOOL_NAMES.CHAT)
        expect(skillTools.filter((name) => chatCore.has(name))).toEqual([])
        expect(core.has(LAZY_TOOL_NAME)).toBe(true)
    })

    it('unwraps an execute call to the inner tool and passes other calls through', () => {
        expect(agentToolSkills.effectiveToolCall({ toolName: LAZY_TOOL_NAME, input: { tool: 'ap_add_step', input: { a: 1 } } }))
            .toEqual({ toolName: 'ap_add_step', input: { a: 1 } })
        expect(agentToolSkills.effectiveToolCall({ toolName: 'ap_web_search', input: { query: 'x' } }))
            .toEqual({ toolName: 'ap_web_search', input: { query: 'x' } })
        expect(agentToolSkills.effectiveToolCall({ toolName: LAZY_TOOL_NAME, input: { input: {} } }).toolName).toBe(LAZY_TOOL_NAME)
    })

    it('carries pill labels from the outer call into the inner input without overriding inner ones', () => {
        const effective = agentToolSkills.effectiveToolCall({
            toolName: LAZY_TOOL_NAME,
            input: { tool: 'ap_add_step', activeTitle: 'Adding your Slack step', doneTitle: 'Added your Slack step', title: 'outer', input: { stepName: 's1', title: 'inner' } },
        })
        expect(effective.input).toEqual({ stepName: 's1', title: 'inner', activeTitle: 'Adding your Slack step', doneTitle: 'Added your Slack step' })
    })

    it('keeps branch, management and AI-model tools out of the core build skill', () => {
        const flowBuilding = AGENT_SKILLS.find((skill) => skill.name === 'flow_building')?.toolNames ?? []
        for (const tool of ['ap_add_branch', 'ap_rename_flow', 'ap_flow_structure', 'ap_list_ai_models']) {
            expect(flowBuilding).not.toContain(tool)
            expect(AGENT_SKILLS.filter((skill) => skill.toolNames.includes(tool))).toHaveLength(1)
        }
    })

    it('sends the tools the model tends to guess directly, so the provider checks their arguments', () => {
        for (const tool of ['ap_show_connection_picker', 'ap_show_connection_required', 'ap_discover_action_auth', 'ap_show_questions', 'ap_get_piece_props', 'ap_resolve_property_options', 'ap_resolve_property_chain']) {
            expect(CORE_TOOL_NAMES.CHAT).toContain(tool)
        }
        expect(CORE_TOOL_NAMES.AGENT).toContain('ap_show_connection_picker')
    })

    it('keeps paid tools out of every core list', () => {
        expect(Object.values(CORE_TOOL_NAMES).flat().filter((name) => chatBilling.isPaidTool(name))).toEqual([])
    })

    it('always sends the thinking-status tool directly', () => {
        expect(CORE_TOOL_NAMES.CHAT).toContain('ap_update_thinking_status')
        expect(CORE_TOOL_NAMES.AGENT).toContain('ap_update_thinking_status')
    })

    it('lists deferred tools that no skill covers so the model can still find them', () => {
        const names = agentToolSkills.uncataloguedToolNames({ surface: 'CHAT', allToolNames: ['ap_research_pieces', 'ap_add_step', 'mcp__gmail__send', 'ap_set_phase'] })
        expect(names).toEqual(['mcp__gmail__send'])
    })

    it('renders a sorted one-line catalog', () => {
        const catalog = agentToolSkills.renderToolCatalog({ tools: [{ name: 'b_tool', description: 'Does b. More text.' }, { name: 'a_tool' }] })
        expect(catalog).toBe('- a_tool — \n- b_tool — Does b.')
    })
})
