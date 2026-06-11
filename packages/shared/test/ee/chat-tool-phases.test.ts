import { describe, expect, it } from 'vitest'
import { chatToolPhases } from '../../src/lib/ee/chat/tool-phases'

const ALL = [
    'ap_research_pieces',
    'ap_get_piece_props',
    'ap_resolve_property_options',
    'ap_list_connections',
    'ap_explore_data',
    'ap_update_brief',
    'ap_show_questions',
    'ap_build_flow',
    'ap_add_step',
    'ap_test_flow',
    'ap_lock_and_publish',
    'ap_execute_action',
]

describe('chatToolPhases.activeToolsForPhase', () => {
    it('hides build/edit/execute tools during discovery', () => {
        const active = chatToolPhases.activeToolsForPhase({ phase: 'discovery', allToolNames: ALL })
        expect(active).toContain('ap_research_pieces')
        expect(active).toContain('ap_explore_data')
        expect(active).toContain('ap_show_questions')
        expect(active).not.toContain('ap_build_flow')
        expect(active).not.toContain('ap_add_step')
        expect(active).not.toContain('ap_test_flow')
        expect(active).not.toContain('ap_lock_and_publish')
        expect(active).not.toContain('ap_execute_action')
    })

    it('exposes the full toolset during build', () => {
        const active = chatToolPhases.activeToolsForPhase({ phase: 'build', allToolNames: ALL })
        expect(active).toEqual(ALL)
    })

    it('keeps read/discovery tools available in both phases', () => {
        const discovery = chatToolPhases.activeToolsForPhase({ phase: 'discovery', allToolNames: ALL })
        const build = chatToolPhases.activeToolsForPhase({ phase: 'build', allToolNames: ALL })
        for (const tool of ['ap_research_pieces', 'ap_get_piece_props', 'ap_list_connections', 'ap_explore_data']) {
            expect(discovery).toContain(tool)
            expect(build).toContain(tool)
        }
    })

    it('leaves unknown tools visible during discovery (denylist, not allowlist)', () => {
        const active = chatToolPhases.activeToolsForPhase({ phase: 'discovery', allToolNames: ['ap_some_new_tool'] })
        expect(active).toContain('ap_some_new_tool')
    })
})

describe('chatToolPhases hidden/build classification', () => {
    it('flags chat-hidden tools', () => {
        expect(chatToolPhases.isChatHiddenTool('ap_run_action')).toBe(true)
        expect(chatToolPhases.isChatHiddenTool('ap_create_flow')).toBe(true)
        expect(chatToolPhases.isChatHiddenTool('ap_execute_action')).toBe(false)
    })

    it('flags build-only tools', () => {
        expect(chatToolPhases.isBuildOnlyTool('ap_build_flow')).toBe(true)
        expect(chatToolPhases.isBuildOnlyTool('ap_research_pieces')).toBe(false)
    })
})
