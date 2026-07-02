/**
 * Two-phase tool visibility: in DISCOVERY the agent sees only read/understand
 * tools; the flow-construction/editing/publishing/table-write tools stay hidden
 * until it starts building. Denylist (not allowlist) on purpose — an unclassified
 * new tool degrades to "noisier discovery", never to "a needed tool vanished".
 */

const BUILD_ONLY_TOOL_NAMES = new Set<string>([
    'ap_build_flow',
    'ap_create_flow',
    'ap_add_step',
    'ap_update_step',
    'ap_delete_step',
    'ap_update_trigger',
    'ap_add_branch',
    'ap_update_branch',
    'ap_delete_branch',
    'ap_test_flow',
    'ap_test_step',
    'ap_validate_flow',
    'ap_validate_step_config',
    'ap_execute_action',
    'ap_discover_action_auth',
    'ap_lock_and_publish',
    'ap_change_flow_status',
    'ap_delete_flow',
    'ap_rename_flow',
    'ap_duplicate_flow',
    'ap_manage_notes',
    'ap_retry_run',
    'ap_browser_act',
    'ap_create_table',
    'ap_manage_fields',
    'ap_delete_table',
    'ap_run_action',
])

// Table row data ops (insert/update/delete/color records) are intentionally NOT build-only: they
// are visible in discovery so a direct "add/delete/color rows" request goes straight to the tool —
// no ap_set_phase round-trip first. They're also excluded from THINKING_TOOL_NAMES, so
// thinking stays off. Structural table ops (create/delete table, manage fields) remain
// build-only as they're rarer and more consequential.

/**
 * MODEL is no longer tool-gated: the first loop step runs on the fast model (the snappy opener)
 * and every step after it runs on the user's selected tier model — handled in run-chat-turn.ts,
 * not here. THINKING is the one tool-gated latch left.
 *
 * THINKING (THINKING_TOOL_NAMES): extended thinking is far costlier per step, so it latches on
 * ONLY for genuine new-flow architecture — `ap_build_flow` (bulk new-flow builder),
 * `ap_set_build_plan` (always precedes a brand-new recurring automation per the system prompt, so
 * thinking switches on one step early and the construction keeps its depth), and `ap_add_step`
 * (the one incremental tool that introduces real structure). Single-field edits to an existing
 * flow (`ap_update_step`/`ap_update_trigger`), branch tweaks, publish, rename, test, etc. are
 * EXCLUDED — they run with thinking OFF, which is what keeps small edits snappy.
 */
const THINKING_TOOL_NAMES = new Set<string>([
    'ap_build_flow',
    'ap_set_build_plan',
    'ap_add_step',
])

/**
 * Tools the chat surface never exposes (the chat has a richer or safer
 * equivalent). Filtered out worker-side; the shared MCP registry is untouched
 * so non-chat MCP consumers still see them.
 */
const CHAT_HIDDEN_TOOL_NAMES = new Set<string>([
    'ap_create_flow',
    'ap_run_action',
    'ap_set_project_context',
    'ap_setup_guide',
])

function activeToolsForPhase({ phase, allToolNames }: {
    phase: ChatPhase
    allToolNames: string[]
}): string[] {
    if (phase === 'build') {
        return allToolNames
    }
    return allToolNames.filter((name) => !BUILD_ONLY_TOOL_NAMES.has(name))
}

function isBuildOnlyTool(toolName: string): boolean {
    return BUILD_ONLY_TOOL_NAMES.has(toolName)
}

function isThinkingTool(toolName: string): boolean {
    return THINKING_TOOL_NAMES.has(toolName)
}

function isChatHiddenTool(toolName: string): boolean {
    return CHAT_HIDDEN_TOOL_NAMES.has(toolName)
}

export type ChatPhase = 'discovery' | 'build'

export const chatToolPhases = {
    activeToolsForPhase,
    isBuildOnlyTool,
    isThinkingTool,
    isChatHiddenTool,
}
