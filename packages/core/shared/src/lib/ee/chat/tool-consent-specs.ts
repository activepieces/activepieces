import { isNil, isObject } from '@activepieces/core-utils'
import { actionEffect, ActionEffectKind } from './action-effect'

const MCP_CONNECTOR_TOOL_PREFIX = 'mcp__'
const MCP_CONNECTOR_TOOL_PATTERN = /^mcp__.+?__(.+)$/
const MCP_CONNECTOR_FLOOR_KIND: ActionEffectKind = 'external_write'

const CHAT_TOOL_CONSENT_SPECS: Record<string, ChatToolConsentSpec> = {
    ap_test_flow: { mode: 'flow_effects' },
    ap_test_step: { mode: 'flow_effects' },
    ap_retry_run: { mode: 'flow_effects' },
    ap_lock_and_publish: { mode: 'flow_effects' },
    ap_change_flow_status: { mode: 'flow_effects', onlyWhen: { argKey: 'status', equals: 'ENABLED' } },

    ap_run_code: { mode: 'code' },

    ap_delete_flow: { mode: 'static', kind: 'internal_destructive' },
    ap_delete_table: { mode: 'static', kind: 'internal_destructive' },
    ap_delete_records: { mode: 'static', kind: 'internal_destructive' },
    ap_manage_fields: { mode: 'static', kind: 'internal_destructive', onlyWhen: { argKey: 'operation', equals: 'DELETE' } },

    ap_execute_action: { mode: 'self_gated' },
    ap_explore_data: { mode: 'self_gated' },
    ap_send_email: { mode: 'self_gated' },
    ap_show_questions: { mode: 'self_gated' },
    ap_show_quick_replies: { mode: 'self_gated' },
    ap_show_connection_picker: { mode: 'self_gated' },
    ap_show_connection_required: { mode: 'self_gated' },
    ap_show_project_picker: { mode: 'self_gated' },
    ap_show_mcp_reconnect: { mode: 'self_gated' },

    ap_build_flow: { mode: 'silent' },
    ap_create_flow: { mode: 'silent' },
    ap_add_step: { mode: 'silent' },
    ap_update_step: { mode: 'silent' },
    ap_delete_step: { mode: 'silent' },
    ap_update_trigger: { mode: 'silent' },
    ap_add_branch: { mode: 'silent' },
    ap_update_branch: { mode: 'silent' },
    ap_delete_branch: { mode: 'silent' },
    ap_rename_flow: { mode: 'silent' },
    ap_duplicate_flow: { mode: 'silent' },
    ap_manage_notes: { mode: 'silent' },
    ap_validate_flow: { mode: 'silent' },
    ap_validate_step_config: { mode: 'silent' },
    ap_create_table: { mode: 'silent' },
    ap_insert_records: { mode: 'silent' },
    ap_update_record: { mode: 'silent' },
    ap_find_records: { mode: 'silent' },
    ap_flow_structure: { mode: 'silent' },
    ap_read_step_code: { mode: 'silent' },
    ap_read_step_settings: { mode: 'silent' },
    ap_research_pieces: { mode: 'silent' },
    ap_search_actions: { mode: 'silent' },
    ap_search_triggers: { mode: 'silent' },
    ap_resolve_property_options: { mode: 'silent' },
    ap_resolve_property_chain: { mode: 'silent' },
    ap_discover_action_auth: { mode: 'silent' },
    ap_get_piece_props: { mode: 'silent' },
    ap_get_run: { mode: 'silent' },
    ap_list_flows: { mode: 'silent' },
    ap_list_runs: { mode: 'silent' },
    ap_list_tables: { mode: 'silent' },
    ap_list_connections: { mode: 'silent' },
    ap_list_ai_models: { mode: 'silent' },
    ap_list_across_projects: { mode: 'silent' },
    ap_web_search: { mode: 'silent' },
    ap_fetch_url: { mode: 'silent' },
    ap_scrape_url: { mode: 'silent' },
    ap_generate_image: { mode: 'silent' },
    ap_revalidate_connection: { mode: 'silent' },
    ap_load_guide: { mode: 'silent' },
    ap_remember: { mode: 'silent' },
    ap_select_project: { mode: 'silent' },
    ap_deselect_project: { mode: 'silent' },
    ap_set_project_context: { mode: 'silent' },
    ap_setup_guide: { mode: 'silent' },
    ap_update_thinking_status: { mode: 'silent' },
    ap_set_build_plan: { mode: 'silent' },
    ap_set_phase: { mode: 'silent' },
}

function consentSpecOf(toolName: string): ChatToolConsentSpec {
    const spec = CHAT_TOOL_CONSENT_SPECS[toolName]
    if (!isNil(spec)) {
        return spec
    }
    if (toolName.startsWith(MCP_CONNECTOR_TOOL_PREFIX)) {
        return { mode: 'static', kind: mcpConnectorEffectKind(toolName) }
    }
    return { mode: 'static', kind: 'unknown' }
}

function mcpConnectorEffectKind(toolName: string): ActionEffectKind {
    const actionName = MCP_CONNECTOR_TOOL_PATTERN.exec(toolName)?.[1]
    if (isNil(actionName)) {
        return 'unknown'
    }
    return actionEffect.stricter({
        a: MCP_CONNECTOR_FLOOR_KIND,
        b: actionEffect.guess({ actionName }),
    })
}

function specApplies({ spec, args }: { spec: ChatToolConsentSpec, args: unknown }): boolean {
    if (spec.mode === 'silent' || spec.mode === 'self_gated') {
        return false
    }
    if (isNil(spec.onlyWhen)) {
        return true
    }
    return isObject(args) && args[spec.onlyWhen.argKey] === spec.onlyWhen.equals
}

function isMcpConnectorTool(toolName: string): boolean {
    return toolName.startsWith(MCP_CONNECTOR_TOOL_PREFIX)
}

export const chatToolConsentSpecs = {
    specOf: consentSpecOf,
    applies: specApplies,
    isMcpConnectorTool,
    KNOWN_TOOL_NAMES: Object.keys(CHAT_TOOL_CONSENT_SPECS),
}

type ConsentCondition = { argKey: string, equals: string }

export type ChatToolConsentSpec =
    | { mode: 'silent', onlyWhen?: never }
    | { mode: 'self_gated', onlyWhen?: never }
    | { mode: 'flow_effects', onlyWhen?: ConsentCondition }
    | { mode: 'code', onlyWhen?: ConsentCondition }
    | { mode: 'static', kind: ActionEffectKind, onlyWhen?: ConsentCondition }
