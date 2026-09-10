import { spreadIfDefined } from '@activepieces/core-utils'
import { AgentOutputField, AgentOutputFieldType, AgentPhase, apId, BuildPlanEvent, TASK_COMPLETION_TOOL_NAME } from '@activepieces/shared'
import { tool, ToolSet } from 'ai'
import { z } from 'zod'
import { AgentEventEmitter, QUESTION_ICON_NAMES, TaintState } from './tool-primitives'

export function createLocalTools({ onSetProjectContext, projects }: {
    onSetProjectContext: (projectId: string | null) => Promise<{ success: boolean, error?: string }>
    projects: Array<{ id: string, displayName: string, type: string }>
}): ToolSet {
    const availableProjectIds = new Set(projects.map((p) => p.id))

    return {
        ap_select_project: tool({
            description: 'Select a project to work in. All subsequent tool calls will operate on this project.',
            inputSchema: z.object({
                projectId: z.string().describe('The project ID to switch to'),
            }),
            execute: async (input) => {
                if (!availableProjectIds.has(input.projectId)) {
                    return { success: false, error: `Project ${input.projectId} is not accessible.` }
                }
                const project = projects.find((p) => p.id === input.projectId)
                const outcome = await onSetProjectContext(input.projectId)
                if (!outcome.success) {
                    return { success: false, error: outcome.error }
                }
                return { success: true, message: `Now working in project ${project?.displayName ?? input.projectId}.` }
            },
        }),

        ap_deselect_project: tool({
            description: 'Clear project context. Useful when working across multiple projects.',
            inputSchema: z.object({}),
            execute: async () => {
                const outcome = await onSetProjectContext(null)
                if (!outcome.success) {
                    return { success: false, error: outcome.error }
                }
                return { success: true, message: 'Project context cleared.' }
            },
        }),
    }
}

export function createAgentSurfaceTools({ executeTool, taintState }: {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    taintState: TaintState
}): ToolSet {
    const runUnlessTainted = async (toolName: string, toolInput: Record<string, unknown>): Promise<unknown> => {
        if (taintState.tainted) {
            return { error: 'This turn has read content from outside Activepieces, so it cannot change a saved agent. Tell the user to make the change in the agent\'s Configure panel.' }
        }
        return executeTool(toolName, toolInput)
    }
    return {
        ap_list_agents: tool({
            description: 'List the saved agents in the active project, with whether each one is published. Call it before offering to create an agent, so you build on what exists instead of adding a near-duplicate, and when the user asks what agents they have.',
            inputSchema: z.object({}),
            execute: async (toolInput) => {
                return executeTool('ap_list_agents', toolInput)
            },
        }),

        ap_add_agent_tool: tool({
            description: 'Give a saved agent piece actions it can call, so it can do the work rather than only reason about it. Look them up first (ap_research_pieces for the piece and action names, ap_list_connections for the connection). Pass every action for one piece in a single call — one call per piece, never several at once for the same agent.',
            inputSchema: z.object({
                agentId: z.string().optional().describe('The id returned by ap_list_agents, ap_create_agent or ap_update_agent. Leave it out when you are changing the agent this conversation belongs to'),
                pieceName: z.string().describe('Full piece name, e.g. "@activepieces/piece-gmail"'),
                actionNames: z.array(z.string()).describe('Action names within that piece, e.g. ["gmail_search_mail"]'),
                connectionExternalId: z.string().optional().describe('externalId from ap_list_connections, for a piece that needs an account'),
                publish: z.boolean().optional().describe('Make the agent live with these tools in the same step'),
            }),
            execute: async (toolInput) => {
                return runUnlessTainted('ap_add_agent_tool', toolInput)
            },
        }),

        ap_remove_agent_tool: tool({
            description: 'Take piece actions away from a saved agent, when the user no longer wants it doing that or a tool was added by mistake. Pass every action to remove in one call. If two of the agent\'s pieces share an action name, pass pieceName to say which one.',
            inputSchema: z.object({
                agentId: z.string().optional().describe('The id returned by ap_list_agents. Leave it out when you are changing the agent this conversation belongs to'),
                actionNames: z.array(z.string()).describe('Action names to remove, e.g. ["gmail_search_mail"]'),
                pieceName: z.string().optional().describe('Full piece name, only needed when the same action name is on two of the agent\'s pieces'),
                publish: z.boolean().optional().describe('Make the agent live without these tools in the same step'),
            }),
            execute: async (toolInput) => {
                return runUnlessTainted('ap_remove_agent_tool', toolInput)
            },
        }),

        ap_update_agent: tool({
            description: 'Change a saved agent\'s name, description or instructions, and publish it. Send the full new instructions, not a diff — they replace what is there. Pass publish: true whenever the user wants the result live, including when they only ask you to publish and change nothing else.',
            inputSchema: z.object({
                agentId: z.string().optional().describe('The id returned by ap_list_agents or ap_create_agent. Leave it out when you are changing the agent this conversation belongs to'),
                displayName: z.string().optional(),
                description: z.string().optional(),
                instructions: z.string().optional().describe('The agent\'s full new standing brief, in second person'),
                publish: z.boolean().optional().describe('Make the change live for flows and chats in the same step'),
            }),
            execute: async (toolInput) => {
                return runUnlessTainted('ap_update_agent', toolInput)
            },
        }),

        ap_create_agent: tool({
            description: 'Create a saved agent in the active project from a name and instructions. Write the instructions as the agent\'s own standing brief, in second person, covering what it does and what it must not do.',
            inputSchema: z.object({
                displayName: z.string().describe('Short name the user will recognise, e.g. "Inbox triage"'),
                instructions: z.string().describe('The agent\'s standing brief, in second person'),
                description: z.string().optional().describe('One line on what it is for'),
            }),
            execute: async (toolInput) => {
                return executeTool('ap_create_agent', toolInput)
            },
        }),
    }
}

export function createThinkingTools(): ToolSet {
    return {
        ap_update_thinking_status: tool({
            description: 'Update the current thinking status displayed to the user. Call this before each tool call to explain what you are about to do in a short human-readable label.',
            inputSchema: z.object({
                status: z.string().describe('Short human-readable label for the current step, e.g. "Searching for Gmail flows", "Creating flow trigger"'),
            }),
            execute: async () => {
                return { success: true }
            },
        }),
    }
}

export function createBuildPlanTools({ eventEmitter, getProjectId }: {
    eventEmitter: AgentEventEmitter
    getProjectId: () => string | null
}): ToolSet {
    const buildId = apId()
    return {
        ap_set_build_plan: tool({
            description: 'Publish and maintain the live build plan shown to the user as a single contained, celebratory build card (silent, internal — no thinking status).\n\nUSE THIS ONLY when building a brand-new, multi-step recurring automation (a flow with a trigger + steps the user will keep) — i.e. you are actively going through the build_flow guide. That is the ONLY valid trigger.\n\nDo NOT call it for anything else: a one-time "do it now" task (the one_time_task path — running/sending/cleaning/scoring now), a single quick action or lookup, answering or explaining something, exploring/reading data, or a small tweak / rename / status change / single-step edit to an existing automation. If you are not actively running build_flow to construct a new automation, do NOT call this tool — there should be no card.\n\nWhen it applies: call it ONCE the moment you commit to the build, BEFORE constructing anything, with phase "detecting", a bold celebratory tagline, and the full list of steps you intend to build (all status "pending"). Then call it again to patch the plan as you work: set a step to "in_progress" before you build it and "done" after it validates. Set flowId as soon as ap_create_flow or ap_build_flow returns it. Use phase "building" while constructing, "testing" while running test cases, and finally "done" with the flowId once the automation is built and verified — this reveals the Open / Test / Run actions. Reuse the same step ids and the same tagline across calls so the card updates in place instead of resetting.',
            inputSchema: z.object({
                phase: z.enum(['detecting', 'building', 'testing', 'done', 'failed']).describe('"detecting" = just decided to build (celebrate); "building" = constructing steps; "testing" = running test cases; "done" = built & verified; "failed" = gave up'),
                flowName: z.string().describe('Human-readable automation name shown on the card'),
                tagline: z.string().describe('A big, bold, fun marketing-style headline about the specific manual work this automation kills — casual and celebratory, max ~7 words, no period. Make it about THIS user\'s task, not generic. E.g. "Say goodbye to copy-pasting leads", "No more chasing invoices by hand", "Never sort support emails again". Reuse the same tagline across updates.'),
                iconName: z.string().describe(`The single icon that best represents this automation's business case, shown as a playful doodle on the card. Pick the closest match to the task — e.g. mail/email triage, dollar-sign or credit-card for invoices/payments, users for CRM/leads, calendar or calendar-clock for scheduling, bot for AI work, bar-chart or pie-chart for reporting, truck or package for logistics/orders, message-square for chat/Slack, file-text for documents, bell for alerts. Reuse the same iconName across updates. Allowed names: ${QUESTION_ICON_NAMES}`),
                flowId: z.string().optional().describe('The flow id; set it as soon as ap_create_flow / ap_build_flow returns it. Required when phase is "done" so the Open / Test / Run actions work.'),
                steps: z.array(z.object({
                    id: z.string().describe('Stable id you reuse across updates, e.g. "trigger", "classify", "route"'),
                    label: z.string().describe('Short human label, e.g. "Gmail trigger", "Classify with AI"'),
                    status: z.enum(['pending', 'in_progress', 'done', 'failed']),
                })).min(1),
            }),
            execute: async (input) => {
                const event: BuildPlanEvent = {
                    buildId,
                    phase: input.phase,
                    flowName: input.flowName,
                    tagline: input.tagline,
                    iconName: input.iconName,
                    steps: input.steps,
                    updatedAt: new Date().toISOString(),
                    ...spreadIfDefined('flowId', input.flowId),
                    ...spreadIfDefined('projectId', getProjectId() ?? undefined),
                }
                eventEmitter.emitBuildPlan(event)
                return { ok: true, buildId }
            },
        }),
    }
}

export function createPhaseTools({ onPhaseChange }: {
    onPhaseChange: (phase: AgentPhase) => void
}): ToolSet {
    let lastPhase: AgentPhase | null = null
    return {
        ap_set_phase: tool({
            description: 'Switch your working phase (silent, internal — no thinking status). Start in "discovery" (understanding the goal, reading data). Call this with "build" the moment you begin constructing, editing, testing, or running an automation — e.g. right after you load the build_flow or one_time_task guide. This unlocks the build/execution tools.',
            inputSchema: z.object({
                phase: z.enum(['discovery', 'build']).describe('"discovery" while scoping/reading; "build" once you start building or executing'),
            }),
            execute: async (input) => {
                if (lastPhase === input.phase) {
                    return { phase: input.phase, note: 'Already in this phase — no change.' }
                }
                lastPhase = input.phase
                onPhaseChange(input.phase)
                return { phase: input.phase }
            },
        }),
    }
}

export function createStructuredOutputTool({ fields, capture }: {
    fields: AgentOutputField[]
    capture: (output: Record<string, unknown>) => void
}): ToolSet {
    return {
        [TASK_COMPLETION_TOOL_NAME]: tool({
            description: 'Call this as your final action, once the task is done or you cannot continue, to report the result in the shape the flow expects. Nothing you write outside this tool reaches the rest of the flow.',
            inputSchema: z.object({ output: z.object(Object.fromEntries(fields.map((field) => [field.displayName, schemaForOutputField(field)]))) }),
            execute: async ({ output }) => {
                capture(output)
                return { content: [{ type: 'text', text: 'Result recorded.' }] }
            },
        }),
    }
}

function schemaForOutputField(field: AgentOutputField): z.ZodType {
    switch (field.type) {
        case AgentOutputFieldType.NUMBER:
            return z.number().describe(field.description ?? field.displayName)
        case AgentOutputFieldType.BOOLEAN:
            return z.boolean().describe(field.description ?? field.displayName)
        default:
            return z.string().describe(field.description ?? field.displayName)
    }
}

