import { describe, expect, it } from 'vitest'
import { chatToolPhases } from '../../src/lib/ee/chat/tool-phases'

const ALL = [
    'ap_research_pieces',
    'ap_get_piece_props',
    'ap_resolve_property_options',
    'ap_list_connections',
    'ap_explore_data',
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

    it('keeps table row data ops out of build-only so they need no set_phase round-trip', () => {
        expect(chatToolPhases.isBuildOnlyTool('ap_insert_records')).toBe(false)
        expect(chatToolPhases.isBuildOnlyTool('ap_update_record')).toBe(false)
        expect(chatToolPhases.isBuildOnlyTool('ap_delete_records')).toBe(false)
        expect(chatToolPhases.isBuildOnlyTool('ap_color_records')).toBe(false)
    })

    it('keeps structural table ops build-only', () => {
        expect(chatToolPhases.isBuildOnlyTool('ap_create_table')).toBe(true)
        expect(chatToolPhases.isBuildOnlyTool('ap_delete_table')).toBe(true)
        expect(chatToolPhases.isBuildOnlyTool('ap_manage_fields')).toBe(true)
    })
})

describe('chatToolPhases.isThinkingTool (thinking latch — narrow)', () => {
    it('flags only genuine new-flow architecture so thinking turns on for construction', () => {
        expect(chatToolPhases.isThinkingTool('ap_build_flow')).toBe(true)
        expect(chatToolPhases.isThinkingTool('ap_set_build_plan')).toBe(true)
        expect(chatToolPhases.isThinkingTool('ap_add_step')).toBe(true)
    })

    it('keeps single-field edits, publish, rename, and test snappy (thinking OFF)', () => {
        expect(chatToolPhases.isThinkingTool('ap_update_step')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_update_trigger')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_lock_and_publish')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_test_flow')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_rename_flow')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_change_flow_status')).toBe(false)
    })

    it('keeps table/data writes and one-time actions fast (thinking OFF)', () => {
        expect(chatToolPhases.isThinkingTool('ap_insert_records')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_update_record')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_color_records')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_execute_action')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_run_code')).toBe(false)
        expect(chatToolPhases.isThinkingTool('ap_set_phase')).toBe(false)
    })
})
