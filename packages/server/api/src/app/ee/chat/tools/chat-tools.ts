import { FlowRunStatus, FlowStatus, isNil, parseToJsonIfPossible, Project, RunEnvironment } from '@activepieces/shared'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { LanguageModel, tool, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../../flows/flow/flow.service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { formatFlowLine } from '../../../mcp/tools/ap-list-flows'
import { executeAdhocAction, formatRunSummary } from '../../../mcp/tools/flow-run-utils'
import { mcpUtils } from '../../../mcp/tools/mcp-utils'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { tableService } from '../../../tables/table/table.service'
import { builderAgent } from '../agents/builder-agent'
import { researcherAgent } from '../agents/researcher-agent'
import { chatPrompt } from '../prompt/chat-prompt'

const RESOURCE_TYPES = ['flows', 'tables', 'runs', 'connections'] as const
const CROSS_PROJECT_CONNECTION_LIMIT = 100
const CROSS_PROJECT_FLOW_LIMIT = 200
const FLOW_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(FlowStatus))
const FLOW_RUN_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(FlowRunStatus))

function toFlowStatus(value?: string): FlowStatus | undefined {
    return value && FLOW_STATUS_VALUES.has(value) ? value as FlowStatus : undefined
}

function toFlowRunStatus(value?: string): FlowRunStatus | undefined {
    return value && FLOW_RUN_STATUS_VALUES.has(value) ? value as FlowRunStatus : undefined
}

function createChatTools({ onSessionTitle, onSetProjectContext, projects, platformId, log }: CreateChatToolsParams) {
    const availableProjectIds = projects.map((p) => p.id)

    return {
        ap_set_session_title: tool({
            description: 'Set the conversation title. Call this after your first response to name the conversation based on the topic discussed.',
            inputSchema: z.object({
                title: z.string().min(1).max(100).describe('A short title (3-6 words) summarizing the conversation topic'),
            }),
            execute: async (input) => {
                onSessionTitle(input.title)
                return { success: true }
            },
        }),
        ap_select_project: tool({
            description: 'Set or clear the active project context. With a projectId, scopes the conversation to that project and gives access to its tools (create flows, list connections, manage tables, etc.). With null, clears the selection. The user can also select a project from the dropdown in the chat UI.',
            inputSchema: z.object({
                projectId: z.string().nullable().describe('The project ID to work in, or null to clear the current selection.'),
                reason: z.string().optional().describe('Brief explanation of what you plan to do in this project.'),
            }),
            execute: async (input) => {
                if (input.projectId === null) {
                    await onSetProjectContext(null)
                    return { success: true, message: 'Project context cleared.' }
                }
                if (!availableProjectIds.includes(input.projectId)) {
                    return { success: false, error: `Project ${input.projectId} is not accessible. Available projects: ${availableProjectIds.join(', ')}` }
                }
                await onSetProjectContext(input.projectId)
                const reason = input.reason ? ` Proceed with: ${input.reason}` : ''
                return { success: true, message: `Now working in project ${input.projectId}.${reason}` }
            },
        }),
        ap_run_one_time_action: tool({
            description: 'Execute a single piece action once for one-time tasks like "check my inbox" or "send a Slack message". If the piece needs auth and no connectionExternalId is provided, this tool automatically finds all matching connections across projects and returns a connection-picker block for the user to choose — paste it in your reply EXACTLY as returned. After the user picks (they send "Use <name>"), call this tool again with the connectionExternalId and projectId.',
            inputSchema: z.object({
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail". Use ap_list_pieces to discover.'),
                actionName: z.string().describe('Action to run, e.g. "gmail_search_mail". Use ap_get_piece_props for the input shape.'),
                input: z.record(z.string(), z.unknown()).optional().describe('Fully-resolved input for the action. Keys must match the piece action props. Pass raw values — do NOT wrap in {{...}}.'),
                connectionExternalId: z.string().optional().describe('externalId of the connection to use. Omit on first call — the tool will return a picker. Provide after the user selects.'),
                projectId: z.string().optional().describe('Project ID where the connection lives. Provide together with connectionExternalId after the user selects.'),
            }),
            execute: async (input) => {
                if (!input.connectionExternalId || !input.projectId) {
                    return findConnectionsForPiece({ pieceName: input.pieceName, projects, platformId, log })
                }
                if (!availableProjectIds.includes(input.projectId)) {
                    return { content: [{ type: 'text', text: `❌ Project ${input.projectId} is not accessible.` }] }
                }
                let parsedInput = input.input
                if (typeof parsedInput === 'string') {
                    const parsed = parseToJsonIfPossible(parsedInput)
                    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                        parsedInput = parsed as Record<string, unknown>
                    }
                }
                return executeAdhocAction({
                    projectId: input.projectId,
                    pieceName: input.pieceName,
                    actionName: input.actionName,
                    input: parsedInput,
                    connectionExternalId: input.connectionExternalId,
                    log,
                })
            },
        }),
        ap_list_across_projects: tool({
            description: 'List resources across ALL user projects at once. Use this instead of switching project context when the user asks about resources across projects (e.g. "list all my flows", "show runs across projects"). For single-project queries, use the project-scoped tools instead.',
            inputSchema: z.object({
                resource: z.enum(RESOURCE_TYPES).describe('The type of resource to list: flows, tables, runs, or connections.'),
                status: z.string().optional().describe('Filter by status. For flows: ENABLED or DISABLED. For runs: FAILED, SUCCEEDED, etc.'),
            }),
            execute: async (input) => {
                if (input.resource === 'flows') {
                    return listFlowsAcrossProjects({ projects, status: input.status, log })
                }
                if (input.resource === 'connections') {
                    return listConnectionsAcrossProjects({ projects, platformId, log })
                }

                const results = await Promise.all(
                    projects.map(async (project) => {
                        const lines = input.resource === 'tables'
                            ? await listResourceForProject({ resource: 'tables', projectId: project.id, status: input.status, log })
                            : await listResourceForProject({ resource: 'runs', projectId: project.id, status: input.status, log })
                        return { project, lines }
                    }),
                )

                const sections = results.map(({ project, lines }) => {
                    const label = chatPrompt.projectDisplayName(project)
                    return lines.length > 0
                        ? `**${label}** (${project.id}):\n${lines.join('\n')}`
                        : `**${label}** (${project.id}): No ${input.resource} found.`
                })

                return { content: [{ type: 'text', text: sections.join('\n\n') }] }
            },
        }),
    }
}

function pieceShortName(fullName: string): string {
    return fullName.replace('@activepieces/piece-', '')
}

function pieceDisplayLabel(shortName: string): string {
    return shortName.charAt(0).toUpperCase() + shortName.slice(1)
}

function buildConnectionPickerBlock({ shortName, displayName, connections }: {
    shortName: string
    displayName: string
    connections: Array<{ displayName: string, project: string, externalId: string, projectId: string, status: string }>
}): string {
    const connLines = connections.map((c) =>
        `- label: ${c.displayName}\n  project: ${c.project}\n  externalId: ${c.externalId}\n  projectId: ${c.projectId}\n  status: ${c.status}`,
    ).join('\n')
    return `\`\`\`connection-picker\npiece: ${shortName}\ndisplayName: ${displayName}\nconnections:\n${connLines}\n\`\`\``
}

async function findConnectionsForPiece({ pieceName, projects, platformId, log }: {
    pieceName: string
    projects: Project[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ content: { type: string, text: string }[] }> {
    const normalizedPiece = mcpUtils.normalizePieceName(pieceName) ?? pieceName

    const projectId = projects[0]?.id
    if (projectId) {
        const project = projects[0]
        const piece = await pieceMetadataService(log).get({
            name: normalizedPiece,
            projectId,
            platformId: project.platformId,
        })
        if (piece && isNil(piece.auth)) {
            return {
                content: [{
                    type: 'text',
                    text: `${pieceDisplayLabel(pieceShortName(normalizedPiece))} does not require a connection. No authentication is needed — you can use it directly.`,
                }],
            }
        }
    }

    const allConnections = await Promise.all(
        projects.map(async (project) => {
            const result = await appConnectionService(log).list({
                projectId: project.id,
                platformId,
                pieceName: normalizedPiece,
                cursorRequest: null,
                displayName: undefined,
                status: undefined,
                limit: CROSS_PROJECT_CONNECTION_LIMIT,
                scope: undefined,
                externalIds: undefined,
            })
            return result.data.map((c) => ({
                displayName: c.displayName,
                externalId: c.externalId,
                project: chatPrompt.projectDisplayName(project),
                projectId: project.id,
                status: c.status,
            }))
        }),
    )

    const flat = allConnections.flat()
    const shortName = pieceShortName(normalizedPiece)
    const displayName = pieceDisplayLabel(shortName)

    if (flat.length === 0) {
        return {
            content: [{
                type: 'text',
                text: `No ${displayName} connections found. Show this block to let the user connect:\n\n\`\`\`connection-required\npiece: ${shortName}\ndisplayName: ${displayName}\n\`\`\``,
            }],
        }
    }

    const pickerBlock = buildConnectionPickerBlock({ shortName, displayName, connections: flat })
    return {
        content: [{
            type: 'text',
            text: `Found ${flat.length} ${displayName} connection(s). Show this picker to the user — paste it EXACTLY as-is in your reply:\n\n${pickerBlock}`,
        }],
    }
}

async function listFlowsAcrossProjects({ projects, status, log }: {
    projects: Project[]
    status?: string
    log: FastifyBaseLogger
}): Promise<{ content: { type: string, text: string }[] }> {
    const validStatus = toFlowStatus(status)
    const statusFilter = validStatus ? [validStatus] : undefined
    const result = await flowService(log).list({
        projectIds: projects.map((p) => p.id),
        cursorRequest: null,
        limit: CROSS_PROJECT_FLOW_LIMIT,
        status: statusFilter,
    })

    const grouped = new Map<string, string[]>()
    for (const flow of result.data) {
        const lines = grouped.get(flow.projectId) ?? []
        lines.push(formatFlowLine(flow))
        grouped.set(flow.projectId, lines)
    }

    const sections = projects.map((project) => {
        const label = chatPrompt.projectDisplayName(project)
        const lines = grouped.get(project.id)
        return lines
            ? `**${label}** (${project.id}):\n${lines.join('\n')}`
            : `**${label}** (${project.id}): No flows found.`
    })

    return { content: [{ type: 'text', text: sections.join('\n\n') }] }
}

async function listConnectionsAcrossProjects({ projects, platformId, log }: {
    projects: Project[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ content: { type: string, text: string }[] }> {
    const allConnections = await Promise.all(
        projects.map(async (project) => {
            const result = await appConnectionService(log).list({
                projectId: project.id,
                platformId,
                pieceName: undefined,
                cursorRequest: null,
                displayName: undefined,
                status: undefined,
                limit: CROSS_PROJECT_CONNECTION_LIMIT,
                scope: undefined,
                externalIds: undefined,
            })
            return result.data.map((c) => ({
                displayName: c.displayName,
                pieceName: c.pieceName,
                externalId: c.externalId,
                status: c.status,
                project: chatPrompt.projectDisplayName(project),
                projectId: project.id,
            }))
        }),
    )

    const flat = allConnections.flat()
    if (flat.length === 0) {
        return { content: [{ type: 'text', text: 'No connections found across any project.' }] }
    }

    const byPiece = new Map<string, typeof flat>()
    for (const conn of flat) {
        const list = byPiece.get(conn.pieceName) ?? []
        list.push(conn)
        byPiece.set(conn.pieceName, list)
    }

    const pickerBlocks: string[] = []
    for (const [pieceName, conns] of byPiece) {
        const shortName = pieceShortName(pieceName)
        const displayName = pieceDisplayLabel(shortName)
        pickerBlocks.push(buildConnectionPickerBlock({ shortName, displayName, connections: conns }))
    }

    return { content: [{ type: 'text', text: `Found ${flat.length} connection(s) across ${projects.length} project(s). Paste the appropriate block below EXACTLY as-is:\n\n${pickerBlocks.join('\n\n')}` }] }
}

async function listResourceForProject({ resource, projectId, status, log }: {
    resource: 'tables' | 'runs'
    projectId: string
    status?: string
    log: FastifyBaseLogger
}): Promise<string[]> {
    switch (resource) {
        case 'tables': {
            const result = await tableService.list({
                projectId,
                cursor: undefined,
                limit: 50,
                name: undefined,
                externalIds: undefined,
                folderId: undefined,
                includeRowCount: true,
            })
            return result.data.map((t) => `- ${t.name} (${t.id}) — ${t.rowCount ?? 0} records`)
        }
        case 'runs': {
            const validStatus = toFlowRunStatus(status)
            const result = await flowRunService(log).list({
                projectId,
                flowId: undefined,
                status: validStatus ? [validStatus] : undefined,
                environment: RunEnvironment.PRODUCTION,
                cursor: null,
                limit: 10,
            })
            return result.data.map((run) => formatRunSummary(run))
        }
    }
}

const MAX_REFINEMENT_ITERATIONS = 2
const MIN_STEPS_FOR_EVALUATION = 3

function createBuilderTool({ model, allTools, rawMcpTools, providerOptions, writer, log }: CreateBuilderToolParams) {
    const buildTools = builderAgent.filterBuildTools({ allTools, rawMcpTools })

    return {
        ap_build_automation: tool({
            description: 'Delegate automation building to the builder agent. Use after the user approves an automation-proposal and connections are resolved. Provide the full build specification with flow name, project ID, and all steps with their piece names, action/trigger names, connection external IDs, and any configuration the user provided.',
            inputSchema: z.object({
                flowName: z.string().describe('Name for the new flow'),
                projectId: z.string().describe('Project ID to build in'),
                steps: z.array(z.object({
                    type: z.enum(['trigger', 'action']).describe('Whether this is the trigger or an action step'),
                    pieceName: z.string().describe('Full piece name, e.g. "@activepieces/piece-gmail"'),
                    actionName: z.string().optional().describe('Action name for action steps'),
                    triggerName: z.string().optional().describe('Trigger name for trigger steps'),
                    connectionExternalId: z.string().optional().describe('Connection externalId for auth'),
                    config: z.record(z.string(), z.unknown()).optional().describe('Pre-filled configuration values from user input'),
                })).min(1).describe('Steps in order: trigger first, then actions'),
            }),
            execute: async (input) => {
                log.info({ flowName: input.flowName, stepCount: input.steps.length }, 'Builder agent starting')
                const buildResult = await builderAgent.executeBuild({
                    model,
                    buildTools,
                    providerOptions,
                    spec: input,
                    writer,
                    log,
                })
                log.info({ flowId: buildResult.flowId, success: buildResult.success, stepsUsed: buildResult.stepsUsed }, 'Builder agent finished')

                if (!buildResult.success || !buildResult.flowId || input.steps.length < MIN_STEPS_FOR_EVALUATION) {
                    return {
                        success: buildResult.success,
                        flowId: buildResult.flowId,
                        summary: buildResult.summary,
                        stepsUsed: buildResult.stepsUsed,
                        evaluation: null,
                    }
                }

                let evaluation = await builderAgent.evaluateBuild({
                    model,
                    spec: input,
                    builderSteps: buildResult.builderSteps,
                    log,
                })

                for (let i = 0; i < MAX_REFINEMENT_ITERATIONS; i++) {
                    if (!evaluation || evaluation.overallVerdict !== 'fixable') break

                    const fixableIssues = evaluation.misconfiguredSteps.filter((s) => s.fixable)
                    if (fixableIssues.length === 0) break

                    log.info({ iteration: i + 1, issueCount: fixableIssues.length }, 'Builder fix iteration starting')
                    const fixResult = await builderAgent.executeFix({
                        model,
                        buildTools,
                        providerOptions,
                        flowId: buildResult.flowId,
                        issues: fixableIssues,
                        log,
                    })
                    log.info({ iteration: i + 1, stepsUsed: fixResult.stepsUsed }, 'Builder fix iteration finished')

                    evaluation = await builderAgent.evaluateBuild({
                        model,
                        spec: input,
                        builderSteps: buildResult.builderSteps,
                        log,
                    })
                }

                return {
                    success: buildResult.success,
                    flowId: buildResult.flowId,
                    summary: buildResult.summary,
                    stepsUsed: buildResult.stepsUsed,
                    evaluation,
                }
            },
        }),
    }
}

function createResearcherTool({ model, allTools, providerOptions, log }: CreateSubagentToolParams) {
    const researchTools = researcherAgent.filterResearchTools({ allTools })

    return {
        ap_research: tool({
            description: 'Delegate complex investigation to the research agent. Use for deep piece discovery ("What CRM integrations exist?"), flow debugging ("Why is my flow failing?"), or multi-flow analysis ("Which flows use Slack?"). Do NOT use for simple lookups that need just 1-2 tool calls.',
            inputSchema: z.object({
                task: z.string().describe('What to investigate, e.g. "find all integrations for CRM" or "debug why flow X is failing"'),
                context: z.string().optional().describe('Additional context from the conversation to help the researcher'),
            }),
            execute: async (input) => {
                const fullTask = input.context
                    ? `${input.task}\n\nContext: ${input.context}`
                    : input.task

                log.info({ task: input.task }, 'Researcher agent starting')
                const result = await researcherAgent.executeResearch({
                    model,
                    researchTools,
                    providerOptions,
                    task: fullTask,
                    log,
                })
                log.info({ stepsUsed: result.stepsUsed }, 'Researcher agent finished')
                return result
            },
        }),
    }
}

type CreateChatToolsParams = {
    onSessionTitle: (title: string) => void
    onSetProjectContext: (projectId: string | null) => Promise<void>
    projects: Project[]
    platformId: string
    log: FastifyBaseLogger
}

type CreateBuilderToolParams = {
    model: LanguageModel
    allTools: ToolSet
    rawMcpTools: Record<string, unknown>
    providerOptions: SharedV3ProviderOptions
    writer: { write(part: Record<string, unknown>): void }
    log: FastifyBaseLogger
}

type CreateSubagentToolParams = {
    model: LanguageModel
    allTools: ToolSet
    providerOptions: SharedV3ProviderOptions
    log: FastifyBaseLogger
}

export { createChatTools, createBuilderTool, createResearcherTool }
