import { AgentRunSource } from '@activepieces/core-execution'
import { TASK_COMPLETION_TOOL_NAME } from '@activepieces/core-piece-types'

function surfaceFor({ source }: { source: AgentRunSource }): SkillSurface | null {
    if (source === AgentRunSource.CHAT) {
        return 'CHAT'
    }
    if (source === AgentRunSource.AGENT) {
        return 'AGENT'
    }
    return null
}

function coreToolNames({ surface }: { surface: SkillSurface }): readonly string[] {
    return CORE_TOOL_NAMES[surface]
}

function findSkill({ name }: { name: string }): AgentSkill | undefined {
    return AGENT_SKILLS.find((skill) => skill.name === name)
}

function isMetaTool(toolName: string): boolean {
    return META_TOOL_NAMES.has(toolName)
}

function isRetiredUnderSkills(toolName: string): boolean {
    return RETIRED_UNDER_SKILLS.has(toolName)
}

function effectiveToolCall({ toolName, input }: { toolName: string, input: unknown }): EffectiveToolCall {
    if (toolName !== LAZY_TOOL_NAME || !isRecord(input) || typeof input['tool'] !== 'string') {
        return { toolName, input }
    }
    const innerInput = input['input']
    if (!isRecord(innerInput)) {
        return { toolName: input['tool'], input: innerInput }
    }
    const outerTitles = Object.fromEntries(CARD_TITLE_KEYS.filter((key) => typeof input[key] === 'string' && innerInput[key] === undefined).map((key) => [key, input[key]]))
    return { toolName: input['tool'], input: { ...innerInput, ...outerTitles } }
}

function uncataloguedToolNames({ surface, allToolNames }: { surface: SkillSurface, allToolNames: string[] }): string[] {
    const covered = new Set([...coreToolNames({ surface }), ...AGENT_SKILLS.flatMap((skill) => skill.toolNames)])
    return allToolNames.filter((name) => !covered.has(name) && !isMetaTool(name) && !isRetiredUnderSkills(name))
}

function renderToolCatalog({ tools }: { tools: { name: string, description?: string }[] }): string {
    return [...tools]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((tool) => `- ${tool.name} — ${firstSentence(tool.description ?? '')}`)
        .join('\n')
}

function renderSkillsNote({ surface }: { surface: SkillSurface }): string {
    const lines = [
        `\n\n${SKILLS_NOTE_HEADING}`,
        `Only a few tools are attached to you directly. Every other tool named in these instructions or listed below is real and reachable: run it with \`${LAZY_TOOL_NAME}\` by passing its name as \`tool\` and its arguments as \`input\`, exactly as you would call it directly.`,
        `Never guess a tool's arguments. Load the skill that covers the work with \`${LOAD_SKILL_NAME}\`, which returns the playbook and the input schema of every tool in it, or fetch one tool's schema with \`${GET_TOOL_SCHEMA_NAME}\`. A loaded skill stays in the conversation, so do not load it again.`,
        'If a call is rejected for its input, fix it from the schema in the error and retry once.',
    ]
    return surface === 'CHAT' ? [...lines, '', 'Skills:', renderSkillIndex()].join('\n') : lines.join('\n')
}

function renderSkillIndex(): string {
    return AGENT_SKILLS.map((skill) => `- ${skill.name} — load ${skill.loadWhen}`).join('\n')
}

function firstSentence(text: string): string {
    const trimmed = text.trim()
    const end = trimmed.search(/[.!?](\s|$)/)
    const sentence = end === -1 ? trimmed : trimmed.slice(0, end + 1)
    return sentence.length > MAX_CATALOG_LINE_CHARS ? `${sentence.slice(0, MAX_CATALOG_LINE_CHARS - 1)}…` : sentence
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const MAX_CATALOG_LINE_CHARS = 160
const CARD_TITLE_KEYS = ['title', 'activeTitle', 'doneTitle']
const SKILLS_NOTE_HEADING = '## Skills and tools'

const LAZY_TOOL_NAME = 'ap_lazy_tool'
const LOAD_SKILL_NAME = 'ap_load_skill'
const GET_TOOL_SCHEMA_NAME = 'ap_get_tool_schema'
const META_TOOL_NAMES = new Set<string>([LAZY_TOOL_NAME, LOAD_SKILL_NAME, GET_TOOL_SCHEMA_NAME])
const RETIRED_UNDER_SKILLS = new Set<string>(['ap_set_phase', 'ap_load_guide'])

const MAX_CORE_TOOLS = 16

const CORE_TOOL_NAMES: Record<SkillSurface, readonly string[]> = {
    CHAT: [
        LOAD_SKILL_NAME,
        GET_TOOL_SCHEMA_NAME,
        LAZY_TOOL_NAME,
        'ap_update_thinking_status',
        'ap_show_quick_replies',
        'ap_research_pieces',
        'ap_web_search',
        'ap_remember',
        'ap_list_flows',
        'ap_show_questions',
        'ap_show_connection_picker',
        'ap_show_connection_required',
        'ap_discover_action_auth',
        'ap_get_piece_props',
        'ap_resolve_property_options',
        'ap_resolve_property_chain',
    ],
    AGENT: [
        LOAD_SKILL_NAME,
        GET_TOOL_SCHEMA_NAME,
        LAZY_TOOL_NAME,
        'ap_update_thinking_status',
        'ap_show_quick_replies',
        'ap_show_questions',
        'ap_show_connection_picker',
        TASK_COMPLETION_TOOL_NAME,
    ],
}

const AGENT_SKILLS: readonly AgentSkill[] = [
    {
        name: 'discovery',
        loadWhen: 'at the start of any task beyond a quick answer, before asking the user anything or building',
        guideTopic: 'discovery',
        entersBuildPhase: false,
        toolNames: [],
    },
    {
        name: 'flow_building',
        loadWhen: 'before creating, editing, testing or publishing any flow or automation, including a solution of several flows and tables in one folder',
        guideTopic: 'build_flow',
        entersBuildPhase: true,
        toolNames: [
            'ap_build_flow', 'ap_create_folder', 'ap_add_step', 'ap_update_step', 'ap_delete_step', 'ap_update_trigger',
            'ap_validate_flow', 'ap_validate_step_config', 'ap_test_flow', 'ap_test_step',
            'ap_search_actions', 'ap_search_triggers', 'ap_set_build_plan', 'ap_lock_and_publish',
        ],
    },
    {
        name: 'flow_management',
        loadWhen: 'before inspecting, renaming, duplicating, deleting, pausing or annotating an existing flow',
        entersBuildPhase: false,
        toolNames: [
            'ap_flow_structure', 'ap_read_step_code', 'ap_read_step_settings',
            'ap_rename_flow', 'ap_duplicate_flow', 'ap_delete_flow', 'ap_change_flow_status', 'ap_manage_notes',
        ],
    },
    {
        name: 'one_time_task',
        loadWhen: 'before doing something once, right now, in a connected app (send, read, update) or running code',
        guideTopic: 'one_time_task',
        entersBuildPhase: true,
        toolNames: ['ap_execute_action', 'ap_run_code', 'ap_explore_data'],
    },
    {
        name: 'connections',
        loadWhen: 'when an app account is needed, missing, broken or has to be picked',
        guideTopic: 'connections',
        entersBuildPhase: false,
        toolNames: ['ap_list_connections', 'ap_revalidate_connection', 'ap_show_mcp_reconnect'],
    },
    {
        name: 'tables',
        loadWhen: 'before reading or changing the built-in Tables database',
        guideTopic: 'tables',
        entersBuildPhase: true,
        toolNames: ['ap_list_tables', 'ap_create_table', 'ap_delete_table', 'ap_manage_fields', 'ap_find_records', 'ap_insert_records', 'ap_update_record', 'ap_delete_records'],
    },
    {
        name: 'runs',
        loadWhen: 'when looking into flow runs, failures or retries',
        entersBuildPhase: false,
        toolNames: ['ap_list_runs', 'ap_get_run', 'ap_retry_run'],
    },
    {
        name: 'projects',
        loadWhen: 'when the work belongs to a different project or spans several',
        entersBuildPhase: false,
        toolNames: ['ap_select_project', 'ap_deselect_project', 'ap_show_project_picker', 'ap_list_across_projects'],
    },
    {
        name: 'agents',
        loadWhen: 'before listing, creating or changing a saved agent',
        entersBuildPhase: false,
        toolNames: ['ap_list_agents', 'ap_create_agent', 'ap_update_agent', 'ap_add_agent_tool', 'ap_remove_agent_tool'],
    },
    {
        name: 'web_and_media',
        loadWhen: 'before reading a web page, scraping a site, generating an image or sending an email',
        guideTopic: 'web_research',
        entersBuildPhase: false,
        toolNames: ['ap_fetch_url', 'ap_scrape_url', 'ap_generate_image', 'ap_send_email'],
    },
    {
        name: 'interaction',
        loadWhen: 'before showing a showcase card of ideas or examples',
        entersBuildPhase: false,
        toolNames: ['ap_show_showcase'],
    },
    { name: 'error_handling', loadWhen: 'when a flow needs success/failure branches', guideTopic: 'error_handling', entersBuildPhase: false, toolNames: [] },
    { name: 'control_flow', loadWhen: 'when a flow needs routers, conditions or loops', guideTopic: 'control_flow', entersBuildPhase: false, toolNames: ['ap_add_branch', 'ap_update_branch', 'ap_delete_branch'] },
    { name: 'state', loadWhen: 'when a flow must remember data across runs', guideTopic: 'state', entersBuildPhase: false, toolNames: [] },
    { name: 'http_fallback', loadWhen: 'when calling an API directly because no connection exists', guideTopic: 'http_fallback', entersBuildPhase: false, toolNames: [] },
    { name: 'ai', loadWhen: 'when a flow uses native AI steps or needs to pick an AI model', guideTopic: 'ai', entersBuildPhase: false, toolNames: ['ap_list_ai_models'] },
    { name: 'build_flow_advanced', loadWhen: 'when a flow needs dedup, loops over many items, or formula expressions', guideTopic: 'build_flow_advanced', entersBuildPhase: false, toolNames: [] },
    { name: 'about_activepieces', loadWhen: 'when asked what Activepieces is, how it is hosted or priced', guideTopic: 'about_activepieces', entersBuildPhase: false, toolNames: [] },
]

export const agentToolSkills = {
    surfaceFor,
    coreToolNames,
    findSkill,
    isMetaTool,
    isRetiredUnderSkills,
    effectiveToolCall,
    uncataloguedToolNames,
    renderToolCatalog,
    renderSkillsNote,
}

export { AGENT_SKILLS, CORE_TOOL_NAMES, LAZY_TOOL_NAME, GET_TOOL_SCHEMA_NAME, LOAD_SKILL_NAME, MAX_CORE_TOOLS, SKILLS_NOTE_HEADING }

export type SkillSurface = 'CHAT' | 'AGENT'

export type AgentSkill = {
    name: string
    loadWhen: string
    guideTopic?: string
    entersBuildPhase: boolean
    toolNames: string[]
}

type EffectiveToolCall = {
    toolName: string
    input: unknown
}
