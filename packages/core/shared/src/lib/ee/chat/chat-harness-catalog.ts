/**
 * Curated, static description of the chat agent's "harness" — the authored
 * surfaces that shape its behavior — used by the dev-only harness console to
 * make the agent auditable in one place. This is the *intended* contract
 * (one line per tool, the guide load-triggers, the prompt assembly order),
 * deliberately decoupled from the runtime-built tool descriptions so it stays
 * cheap to read and serve. Phase/visibility flags are NOT duplicated here — the
 * console derives them from `chatToolPhases` so there is a single source of
 * truth for which tools are build-only / deep-reasoning / chat-hidden.
 */

type HarnessToolCategory =
    | 'flow'
    | 'discovery'
    | 'execution'
    | 'tables'
    | 'runs'
    | 'web'
    | 'chat_ui'

type HarnessTool = {
    name: string
    category: HarnessToolCategory
    purpose: string
    mutates: boolean
}

const TOOL_CATEGORY_ORDER: { key: HarnessToolCategory, label: string }[] = [
    { key: 'flow', label: 'Flow & Automation' },
    { key: 'discovery', label: 'Discovery & Configuration' },
    { key: 'execution', label: 'Execution & One-Time Tasks' },
    { key: 'tables', label: 'Tables' },
    { key: 'runs', label: 'Runs, History & Connections' },
    { key: 'web', label: 'Web & Content' },
    { key: 'chat_ui', label: 'Chat UI & Internal' },
]

const HARNESS_TOOLS: HarnessTool[] = [
    { name: 'ap_build_flow', category: 'flow', purpose: 'Construct a complete flow in one shot, with validation.', mutates: true },
    { name: 'ap_create_flow', category: 'flow', purpose: 'Create a bare flow skeleton (chat-hidden; prefer ap_build_flow).', mutates: true },
    { name: 'ap_add_step', category: 'flow', purpose: 'Add a step to an existing flow.', mutates: true },
    { name: 'ap_update_step', category: 'flow', purpose: 'Modify a step\'s configuration.', mutates: true },
    { name: 'ap_delete_step', category: 'flow', purpose: 'Remove a step from a flow.', mutates: true },
    { name: 'ap_update_trigger', category: 'flow', purpose: 'Modify the flow\'s trigger.', mutates: true },
    { name: 'ap_add_branch', category: 'flow', purpose: 'Add a router branch.', mutates: true },
    { name: 'ap_update_branch', category: 'flow', purpose: 'Modify a router branch.', mutates: true },
    { name: 'ap_delete_branch', category: 'flow', purpose: 'Remove a router branch.', mutates: true },
    { name: 'ap_test_flow', category: 'flow', purpose: 'Run the whole flow once to validate it.', mutates: false },
    { name: 'ap_test_step', category: 'flow', purpose: 'Run a single step to validate its config.', mutates: false },
    { name: 'ap_validate_flow', category: 'flow', purpose: 'Dry-run structural validation of the flow.', mutates: false },
    { name: 'ap_validate_step_config', category: 'flow', purpose: 'Check a step\'s config without running it.', mutates: false },
    { name: 'ap_lock_and_publish', category: 'flow', purpose: 'Lock the version and publish the flow.', mutates: true },
    { name: 'ap_change_flow_status', category: 'flow', purpose: 'Enable or disable a flow.', mutates: true },
    { name: 'ap_rename_flow', category: 'flow', purpose: 'Rename a flow.', mutates: true },
    { name: 'ap_delete_flow', category: 'flow', purpose: 'Delete a flow.', mutates: true },
    { name: 'ap_duplicate_flow', category: 'flow', purpose: 'Clone a flow under a new name.', mutates: true },
    { name: 'ap_flow_structure', category: 'flow', purpose: 'Read a flow\'s trigger, steps, branches and nesting.', mutates: false },
    { name: 'ap_read_step_code', category: 'flow', purpose: 'Read the source of a CODE step.', mutates: false },
    { name: 'ap_manage_notes', category: 'flow', purpose: 'Add, edit or list notes on a flow.', mutates: true },
    { name: 'ap_list_flows', category: 'flow', purpose: 'List automations (draft/published), filterable by name.', mutates: false },

    { name: 'ap_research_pieces', category: 'discovery', purpose: 'Find apps/pieces by name, category or intent; returns actions, triggers and hints.', mutates: false },
    { name: 'ap_get_piece_props', category: 'discovery', purpose: 'Resolve an action/trigger\'s inputs, required fields and example input.', mutates: false },
    { name: 'ap_resolve_property_options', category: 'discovery', purpose: 'Enumerate a dropdown\'s choices (lists, channels, sheets…).', mutates: false },
    { name: 'ap_resolve_property_chain', category: 'discovery', purpose: 'Resolve multi-level dependent dropdowns in one call.', mutates: false },
    { name: 'ap_discover_action_auth', category: 'discovery', purpose: 'Determine an action\'s auth requirement (none/pick/needs connection).', mutates: false },
    { name: 'ap_list_ai_models', category: 'discovery', purpose: 'List available LLM models.', mutates: false },
    { name: 'ap_explore_data', category: 'discovery', purpose: 'Run a read-only piece action to inspect live data during discovery.', mutates: false },
    { name: 'ap_load_guide', category: 'discovery', purpose: 'Load a topic guide on demand (just-in-time knowledge retrieval).', mutates: false },
    { name: 'ap_setup_guide', category: 'discovery', purpose: 'Load a guide by topic (chat-hidden; prefer ap_load_guide).', mutates: false },
    { name: 'ap_select_project', category: 'discovery', purpose: 'Switch the active working project.', mutates: false },
    { name: 'ap_deselect_project', category: 'discovery', purpose: 'Clear the active working project.', mutates: false },
    { name: 'ap_set_project_context', category: 'discovery', purpose: 'Set the working project (chat-hidden; prefer ap_select_project).', mutates: false },
    { name: 'ap_set_phase', category: 'discovery', purpose: 'Flip between discovery and build phase (unlocks build-only tools).', mutates: false },

    { name: 'ap_execute_action', category: 'execution', purpose: 'Run a single piece action now (supports batched items).', mutates: true },
    { name: 'ap_run_action', category: 'execution', purpose: 'Run an action with inline config (chat-hidden; prefer ap_execute_action).', mutates: true },
    { name: 'ap_retry_run', category: 'execution', purpose: 'Re-run a failed flow run.', mutates: true },
    { name: 'ap_run_code', category: 'execution', purpose: 'Execute JS/TS in the sandbox (npm packages, files in/out).', mutates: false },
    { name: 'ap_send_email', category: 'execution', purpose: 'Send a one-off email without building an automation.', mutates: true },

    { name: 'ap_list_tables', category: 'tables', purpose: 'List tables in the project.', mutates: false },
    { name: 'ap_find_records', category: 'tables', purpose: 'Query table rows (filter, sort, paginate).', mutates: false },
    { name: 'ap_insert_records', category: 'tables', purpose: 'Add rows to a table (bulk).', mutates: true },
    { name: 'ap_update_record', category: 'tables', purpose: 'Modify a table row.', mutates: true },
    { name: 'ap_update_records', category: 'tables', purpose: 'Set the same field value(s) on many rows at once (bulk).', mutates: true },
    { name: 'ap_color_records', category: 'tables', purpose: 'Color rows or cells from a curated palette to encode meaning (status, priority, grouping).', mutates: true },
    { name: 'ap_delete_records', category: 'tables', purpose: 'Delete matching table rows (bulk, reversible).', mutates: true },
    { name: 'ap_restore_records', category: 'tables', purpose: 'Undo a delete — restore previously deleted rows by id.', mutates: true },
    { name: 'ap_clear_table', category: 'tables', purpose: 'Truncate an entire table.', mutates: true },
    { name: 'ap_create_table', category: 'tables', purpose: 'Create a new table.', mutates: true },
    { name: 'ap_manage_fields', category: 'tables', purpose: 'Add, edit or remove table fields.', mutates: true },
    { name: 'ap_delete_table', category: 'tables', purpose: 'Delete a table.', mutates: true },

    { name: 'ap_list_runs', category: 'runs', purpose: 'Query run history (filter, sort, paginate).', mutates: false },
    { name: 'ap_get_run', category: 'runs', purpose: 'Fetch full run detail (inputs, outputs, logs, errors).', mutates: false },
    { name: 'ap_list_connections', category: 'runs', purpose: 'List connected apps with status and associated flows.', mutates: false },
    { name: 'ap_list_across_projects', category: 'runs', purpose: 'List resources spanning all of the user\'s projects.', mutates: false },

    { name: 'ap_web_search', category: 'web', purpose: 'Search the web (native model search or Tavily).', mutates: false },
    { name: 'ap_scrape_url', category: 'web', purpose: 'Extract full markdown from a URL (JS-rendered via Firecrawl).', mutates: false },
    { name: 'ap_fetch_url', category: 'web', purpose: 'Lightweight read of a URL.', mutates: false },
    { name: 'ap_browser_act', category: 'web', purpose: 'Drive a real browser to act on a page (Firecrawl).', mutates: true },
    { name: 'ap_generate_image', category: 'web', purpose: 'Generate an image from text.', mutates: false },

    { name: 'ap_update_thinking_status', category: 'chat_ui', purpose: 'Show the current goal label above the agent\'s work.', mutates: false },
    { name: 'ap_set_build_plan', category: 'chat_ui', purpose: 'Render the build card (tagline, icon, step checklist).', mutates: false },
    { name: 'ap_open_in_stage', category: 'chat_ui', purpose: 'Open a flow/table/run in the side Stage panel.', mutates: false },
    { name: 'ap_show_connection_picker', category: 'chat_ui', purpose: 'Show an inline connection picker / create card.', mutates: false },
    { name: 'ap_show_connection_required', category: 'chat_ui', purpose: 'Prompt the user to reconnect a broken connection.', mutates: false },
    { name: 'ap_show_mcp_reconnect', category: 'chat_ui', purpose: 'Prompt the user to reconnect a broken MCP integration.', mutates: false },
    { name: 'ap_show_project_picker', category: 'chat_ui', purpose: 'Show an inline project picker.', mutates: false },
    { name: 'ap_show_questions', category: 'chat_ui', purpose: 'Show a choice/date/slider question card.', mutates: false },
    { name: 'ap_show_quick_replies', category: 'chat_ui', purpose: 'Offer optional next-step reply chips.', mutates: false },
    { name: 'ap_show_showcase', category: 'chat_ui', purpose: 'Render a designed showcase card (use-case tiles + starters) to introduce itself / explain what is possible.', mutates: false },
]

const HARNESS_GUIDES: { topic: string, title: string, loadTrigger: string }[] = [
    { topic: 'build_flow', title: 'Build a Flow', loadTrigger: 'Building a brand-new recurring automation.' },
    { topic: 'one_time_task', title: 'One-Time Task', loadTrigger: 'Executing an immediate one-off action now.' },
    { topic: 'error_handling', title: 'Error Handling', loadTrigger: 'The automation must react to step failures.' },
    { topic: 'http_fallback', title: 'HTTP Fallback', loadTrigger: 'Reaching a service API directly (no native piece exists).' },
    { topic: 'control_flow', title: 'Control Flow', loadTrigger: 'The automation needs conditions, branching or loops.' },
    { topic: 'state', title: 'State', loadTrigger: 'The automation must remember things across runs.' },
    { topic: 'tables', title: 'Tables', loadTrigger: 'Using Activepieces Tables as the data store.' },
    { topic: 'ai', title: 'AI', loadTrigger: 'The automation uses the native AI step.' },
    { topic: 'about_activepieces', title: 'About Activepieces', loadTrigger: 'The user asks about Activepieces itself.' },
]

const HARNESS_PIPELINE: { stage: string, title: string, description: string, condition: string }[] = [
    { stage: 'system', title: 'System prompt', description: 'Base template with {{PROJECT_LIST}}, {{PROJECT_CONTEXT}} and {{FRONTEND_URL}} interpolated.', condition: 'Always' },
    { stage: 'capabilities', title: 'Capabilities note', description: 'Today\'s date plus which abilities are live: web search/scrape, real browser, image generation, email.', condition: 'Skipped in dry-run (playground) turns' },
    { stage: 'connections', title: 'Connection inventory', description: 'Every connected app in the active project with its status — ground truth so the agent never guesses app names.', condition: 'When a project is selected (best-effort)' },
    { stage: 'mentions', title: 'Mentions context', description: '@-mentioned flows/tables/apps resolved to compact, project-scoped context.', condition: 'When the message has @-mentions' },
    { stage: 'active_context', title: 'Active Stage context', description: 'What is open in the Stage (flow/table/run), cursor focus, an excerpt snapshot, and switch detection vs. the previous turn.', condition: 'When the client sends active context' },
]

function toolsByCategory(): { key: HarnessToolCategory, label: string, tools: HarnessTool[] }[] {
    return TOOL_CATEGORY_ORDER.map(({ key, label }) => ({
        key,
        label,
        tools: HARNESS_TOOLS.filter((tool) => tool.category === key),
    }))
}

export const chatHarnessCatalog = {
    tools: HARNESS_TOOLS,
    toolsByCategory,
    guides: HARNESS_GUIDES,
    pipeline: HARNESS_PIPELINE,
    categories: TOOL_CATEGORY_ORDER,
}

export type { HarnessTool, HarnessToolCategory }
