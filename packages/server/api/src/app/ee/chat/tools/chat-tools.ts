import { apId, ChatStreamWriter, FlowRunStatus, FlowStatus, isNil, parseToJsonIfPossible, Project, RunEnvironment } from '@activepieces/shared'
import { tool } from 'ai'
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
import { chatApprovalGate } from '../chat-approval-gate'
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
            description: 'Execute a single piece action once for one-time tasks like "check my inbox" or "send a Slack message". If the piece needs auth and no connectionExternalId is provided, this tool returns structured connection data. If no connections exist, call ap_show_connection_required. If multiple exist, call ap_show_connection_picker with the returned data. After the user picks, call this tool again with connectionExternalId and projectId.',
            inputSchema: z.object({
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail". Use ap_research_pieces to discover.'),
                actionName: z.string().describe('Action to run, e.g. "gmail_search_mail". Use ap_get_piece_props for the input shape.'),
                input: z.record(z.string(), z.unknown()).optional().describe('Fully-resolved input for the action. Keys must match the piece action props. Pass raw values — do NOT wrap in {{...}}.'),
                connectionExternalId: z.string().optional().describe('externalId of the connection to use. Omit on first call if unknown.'),
                projectId: z.string().optional().describe('Project ID where the connection lives. Provide together with connectionExternalId.'),
            }),
            execute: async (input) => {
                if (!input.connectionExternalId || !input.projectId) {
                    return findConnectionsForPiece({ pieceName: input.pieceName, projects, platformId, log })
                }
                if (!availableProjectIds.includes(input.projectId)) {
                    return { success: false, error: `Project ${input.projectId} is not accessible.` }
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

async function findConnectionsForPiece({ pieceName, projects, platformId, log }: {
    pieceName: string
    projects: Project[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<FindConnectionsResult> {
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
            return { noAuthRequired: true, piece: normalizedPiece }
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
                label: c.displayName,
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
            needsConnection: true,
            piece: shortName,
            displayName,
        }
    }

    return {
        pickConnection: true,
        piece: shortName,
        displayName,
        connections: flat,
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
            return result.data.map((c) => `- ${c.displayName} (${pieceShortName(c.pieceName)}, ${c.status}) — ${chatPrompt.projectDisplayName(project)}`)
        }),
    )

    const flat = allConnections.flat()
    if (flat.length === 0) {
        return { content: [{ type: 'text', text: 'No connections found across any project.' }] }
    }

    return { content: [{ type: 'text', text: `Found ${flat.length} connection(s):\n${flat.join('\n')}` }] }
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

function createPlanApprovalTool({ writer, onPlanApproved }: {
    writer: ChatStreamWriter
    onPlanApproved: () => void
}) {
    return {
        ap_request_plan_approval: tool({
            description: 'Request user approval for a multi-step plan before executing destructive operations. Present the plan in your message first, then call this tool. If approved, all subsequent tool calls in this response execute without individual approval prompts. Use for bulk deletes, multi-step destructive changes, etc. Do NOT use for single operations.',
            inputSchema: z.object({
                planSummary: z.string().describe('A brief 1-3 sentence summary of what you will do'),
                steps: z.array(z.string()).describe('List of concrete actions, e.g. ["Delete flow Test Flow A", "Delete flow Test Flow B"]'),
            }),
            execute: async (input) => {
                const gateId = apId()
                writer.write({
                    type: 'data-plan-approval-request',
                    data: { gateId, planSummary: input.planSummary, steps: input.steps },
                    transient: true,
                })
                const approved = await chatApprovalGate.waitForApproval({ gateId })
                if (approved) {
                    onPlanApproved()
                    return {
                        success: true,
                        message: 'Plan approved by the user. Execute each step in order now.',
                    }
                }
                return { success: false, message: 'Plan rejected by user. Do not proceed.' }
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

type FindConnectionsResult =
    | { noAuthRequired: true, piece: string }
    | { needsConnection: true, piece: string, displayName: string }
    | { pickConnection: true, piece: string, displayName: string, connections: Array<{ label: string, project: string, externalId: string, projectId: string, status: string }> }

export { createChatTools, createPlanApprovalTool }
