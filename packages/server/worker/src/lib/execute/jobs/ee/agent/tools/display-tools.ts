import { isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { tool, ToolExecutionOptions, ToolSet } from 'ai'
import { z } from 'zod'
import { GateDecision, gateNoResponseMessage, normalizePieceName, questionTextSchema, questionTitleSchema, richOptionSchema } from './tool-primitives'

export function createDisplayTools({ waitForApproval, displayToolTimeoutMs, onConnectionSelected, onConnectorReconnected, onGateOpened, accountAlreadyChosenFor }: {
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<GateDecision>
    displayToolTimeoutMs: number
    onConnectionSelected?: (params: { pieceName: string, connectionExternalId: string, label: string, projectId: string }) => Promise<void>
    onConnectorReconnected?: (connectorUuid: string) => void
    onGateOpened?: (params: { gateId: string, toolName: string, displayName: string, toolInput: Record<string, unknown> }) => Promise<void>
    accountAlreadyChosenFor?: (pieceName: string) => boolean
}): ToolSet {
    function refuseIfAccountAlreadyChosen(input: Record<string, unknown>): { content: { type: string, text: string }[] } | undefined {
        const piece = typeof input['piece'] === 'string' ? input['piece'] : ''
        if (isNil(accountAlreadyChosenFor) || !accountAlreadyChosenFor(normalizePieceName(piece))) {
            return undefined
        }
        const displayName = typeof input['displayName'] === 'string' ? input['displayName'] : piece
        return { content: [{ type: 'text', text: `This agent already runs on the ${displayName} account its author chose, so there is nothing to connect or reconnect here and this card was not shown. Use the ${displayName} tool. If it fails, say exactly what failed — do not describe it as a connection problem unless the failure says the credentials were rejected.` }] }
    }

    function blockingExecute({ dismissMessage, successKey, toolName, getDisplayName, onApproved, refuseWhen }: {
        dismissMessage: string | ((input: Record<string, unknown>) => string)
        successKey?: string
        toolName: string
        getDisplayName?: (input: Record<string, unknown>) => string
        onApproved?: (params: { input: Record<string, unknown>, payload?: Record<string, unknown> }) => Promise<Record<string, unknown>>
        refuseWhen?: (input: Record<string, unknown>) => { content: { type: string, text: string }[] } | undefined
    }) {
        return async (input: Record<string, unknown>, options: ToolExecutionOptions<undefined>) => {
            const refusal = refuseWhen?.(input)
            if (!isNil(refusal)) {
                return refusal
            }
            if (onGateOpened) {
                const fallbackName = typeof input['displayName'] === 'string' ? input['displayName'] : toolName
                await tryCatch(() => onGateOpened({
                    gateId: options.toolCallId,
                    toolName,
                    displayName: getDisplayName?.(input) ?? fallbackName,
                    toolInput: input,
                }))
            }
            const decision = await waitForApproval({ gateId: options.toolCallId, timeoutMs: displayToolTimeoutMs })
            if (decision.outcome === 'timeout') {
                return { timedOut: true, message: gateNoResponseMessage(getDisplayName?.(input) ?? toolName) }
            }
            if (decision.outcome !== 'approved') {
                return { dismissed: true, message: typeof dismissMessage === 'function' ? dismissMessage(input) : dismissMessage }
            }
            if (onApproved) {
                return onApproved({ input, payload: decision.payload })
            }
            return { [successKey ?? 'approved']: true, ...decision.payload }
        }
    }

    return {
        ap_show_connection_required: tool({
            description: 'Display the connection card for a piece that needs auth. The card lists every account the user has for this piece, pre-selects one, and offers to connect a new account — so this works whether the user has zero, one, or many. After they pick or connect, briefly confirm before proceeding. If they dismiss, respect it — do not proceed without a connection. Prefer ap_show_connection_picker; this is an alias kept for compatibility.',
            inputSchema: z.object({
                piece: z.string().describe('Piece short name (e.g. "gmail", "slack")'),
                displayName: z.string().describe('Human-readable name (e.g. "Gmail", "Slack")'),
                status: z.enum(['missing', 'error']).optional().describe('Set to "error" when an existing connection needs reconnecting'),
            }),
            execute: blockingExecute({
                toolName: 'ap_show_connection_required',
                refuseWhen: refuseIfAccountAlreadyChosen,
                dismissMessage: 'The user chose not to connect this service. Stop and ask: "Would you like me to continue building with a placeholder you can connect later, or would you prefer to stop here?"',
                onApproved: async ({ input, payload = {} }) => {
                    const connectionExternalId = payload['connectionExternalId']
                    const label = payload['label']
                    const projectId = payload['projectId']
                    if (typeof connectionExternalId === 'string' && onConnectionSelected) {
                        await onConnectionSelected({
                            pieceName: normalizePieceName(typeof input['piece'] === 'string' ? input['piece'] : ''),
                            connectionExternalId,
                            label: typeof label === 'string' ? label : connectionExternalId,
                            projectId: typeof projectId === 'string' ? projectId : '',
                        })
                    }
                    return { connected: true, label: typeof label === 'string' ? label : 'Connected' }
                },
            }),
        }),

        ap_show_mcp_reconnect: tool({
            description: 'Display a card prompting the user to reconnect an MCP integration (e.g. Attio) whose authentication has failed or expired. Use ONLY after an mcp__ tool call reported an auth/connection failure. Look up the connector\'s displayName, connectUrl, and logoUrl from list_connectors or search_mcp_registry by matching the connectorUuid. After the user reconnects, briefly confirm and retry the original call once. If the user dismisses, respect it — do not retry; ask whether to continue without it or stop.',
            inputSchema: z.object({
                connectorUuid: z.string().describe('Registry connector id parsed from the failed tool name mcp__<connectorUuid>__action'),
                displayName: z.string().describe('Human-readable connector name, e.g. "Attio"'),
                connectUrl: z.string().describe('Absolute https URL the user opens to (re)authorize this connector, from the registry connector metadata'),
                logoUrl: z.string().optional().describe('Connector logo URL from the registry metadata, if available'),
                reason: z.enum(['expired', 'unauthorized', 'revoked']).optional().describe('Why reconnection is needed'),
            }),
            execute: blockingExecute({
                toolName: 'ap_show_mcp_reconnect',
                getDisplayName: (input) => typeof input['displayName'] === 'string' ? input['displayName'] : 'integration',
                dismissMessage: (input) => `The user chose not to reconnect ${typeof input['displayName'] === 'string' ? input['displayName'] : 'this integration'}. Do not retry the action that failed. Ask whether to continue without it or stop here.`,
                onApproved: async ({ input }) => {
                    const connectorUuid = input['connectorUuid']
                    if (typeof connectorUuid === 'string' && onConnectorReconnected) {
                        onConnectorReconnected(connectorUuid)
                    }
                    return { reconnected: true }
                },
            }),
        }),

        ap_show_connection_picker: tool({
            description: 'The connection card for a piece that needs auth. Use it whenever a piece needs a connection — it lists every account the user has for that piece, pre-selects one, and offers to connect a new account, so the same card covers zero, one, or many existing connections. Just provide the piece name; the system manages connection details. It returns the chosen connection\'s `connectionExternalId` — pass that exact value as `auth` to ap_get_piece_props / ap_resolve_property_options / ap_execute_action (never guess or use the label). After the user picks or connects, briefly confirm the account chosen. If they dismiss without selecting, do not pick a connection on their behalf.',
            inputSchema: z.object({
                piece: z.string().describe('Piece short name'),
                displayName: z.string().describe('Human-readable piece name'),
            }),
            execute: blockingExecute({
                toolName: 'ap_show_connection_picker',
                refuseWhen: refuseIfAccountAlreadyChosen,
                dismissMessage: (input) => `The user chose not to select a ${typeof input['displayName'] === 'string' ? input['displayName'] : 'service'} account. Do not pick one on their behalf. Ask: "Would you like me to continue building with a placeholder you can connect later, or would you prefer to stop here?"`,
                onApproved: async ({ input, payload = {} }) => {
                    const connectionExternalId = payload['connectionExternalId']
                    const label = payload['label']
                    const projectId = payload['projectId']
                    if (typeof connectionExternalId === 'string' && onConnectionSelected) {
                        await onConnectionSelected({
                            pieceName: normalizePieceName(typeof input['piece'] === 'string' ? input['piece'] : ''),
                            connectionExternalId,
                            label: typeof label === 'string' ? label : connectionExternalId,
                            projectId: typeof projectId === 'string' ? projectId : '',
                        })
                    }
                    return {
                        selected: true,
                        label: typeof label === 'string' ? label : 'Connected',
                        ...spreadIfDefined('connectionExternalId', typeof connectionExternalId === 'string' ? connectionExternalId : undefined),
                    }
                },
            }),
        }),

        ap_show_project_picker: tool({
            description: 'Display a card for the user to select a project to work in. After selection, briefly confirm which project the user chose before proceeding.',
            inputSchema: z.object({
                question: z.string().optional().describe('Question to show as the card title, e.g. "Which project should I build this in?"'),
                suggestedProjects: z.array(z.object({
                    name: z.string().describe('Project display name'),
                    id: z.string().describe('Project ID'),
                })).min(1),
            }),
            execute: blockingExecute({ dismissMessage: 'The user chose not to select a project. Ask which project they would like to work in, or if they need help deciding.', successKey: 'selected', toolName: 'ap_show_project_picker' }),
        }),

        ap_show_questions: tool({
            description: 'Display a rich card to settle genuine make-or-break choices you cannot infer from context. Use RARELY (at most a couple of questions) — assume sensible defaults instead of interrogating. This card is the ONLY way to ask the user anything — never ask a question in prose. If a need feels open-ended, reframe it into the closest structured type here (a choice/multi_choice of the realistic options, a date/time, a slider) rather than asking free text. Pick the input "type" that makes answering effortless: choice (one of a few — add an icon per option only for 1-2 word labels), multi_choice (several of a few), date (a calendar day), date_range (a span), time (a clock time, e.g. for schedules), slider (a number in a bounded range like thresholds/counts — set min/max), color (a brand/label color). After the user answers, briefly acknowledge before proceeding.',
            inputSchema: z.object({
                questions: z.array(z.discriminatedUnion('type', [
                    z.object({
                        type: z.literal('choice'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                        options: z.array(richOptionSchema).min(2).describe('The choices to pick from (at least two)'),
                        allowCustom: z.boolean().optional().describe('Allow a free-text "other" answer (default true)'),
                    }),
                    z.object({
                        type: z.literal('multi_choice'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                        options: z.array(richOptionSchema).min(2).describe('The choices the user can pick several of'),
                    }),
                    z.object({
                        type: z.literal('date'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                    }),
                    z.object({
                        type: z.literal('date_range'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                    }),
                    z.object({
                        type: z.literal('time'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                    }),
                    z.object({
                        type: z.literal('slider'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                        min: z.number().describe('Minimum value'),
                        max: z.number().describe('Maximum value'),
                        step: z.number().optional().describe('Step increment (default 1)'),
                        unit: z.string().optional().describe('Short unit suffix shown next to the value, e.g. "%", "min", "items"'),
                        defaultValue: z.number().optional().describe('Initial value (defaults to the midpoint)'),
                    }),
                    z.object({
                        type: z.literal('color'),
                        title: questionTitleSchema,
                        question: questionTextSchema,
                        presets: z.array(z.string()).optional().describe('Optional hex color swatches to suggest, e.g. ["#8142E3", "#22C55E"]'),
                    }),
                ])).min(1),
            }),
            execute: blockingExecute({ dismissMessage: 'The user skipped these questions. Proceed with reasonable defaults where possible, and let the user know what assumptions you made.', successKey: 'answered', toolName: 'ap_show_questions' }),
        }),

        ap_show_showcase: tool({
            description: 'Render a designed "showcase" card to introduce yourself or show what is possible — your way to answer "what can you do?", "what is this?", "who are you?" and similar, or to spotlight what the user can do with their connected apps. Use this card, NOT prose and NOT a bullet list. Make it personal and use-case-led: pull the user\'s role and company from the "Who you\'re talking to" note when it is there. CRITICAL — the tile `title` is BOTH what the user reads AND the exact message sent to chat verbatim when they tap it, so write each title as the plain first-person instruction the user themselves would type, and when it runs on specific app(s), NAME them in it so the sent message keeps its context ("Track my competitors in AI", "Enrich HubSpot leads with Apollo", "Summarize my Gmail every morning") — 3-6 words, no marketing words ("supercharge", "unlock", "seamless", "effortless", "10x", "boost", "streamline"), no agent-voice ("I\'ll…", "Wake up to…"), no Title-Case headlines. The `description` is a short sub-line explaining the value (shown under the title, NEVER sent). 3-4 tiles, not a long list. EVERY tile MUST carry a visual — either an `app` (shows its logo) or an `icon` (a kebab-case Lucide name); `app` wins if both are set, and a tile with NEITHER renders broken, so never omit both. The tiles are themselves the clickable options, so do NOT also call ap_show_quick_replies in the same turn. Never hardcode an integration count — say "hundreds".',
            inputSchema: z.object({
                layout: z.enum(['grid', 'list']).optional().describe('Presentation. Defaults to "list" = full-width rows stacked vertically, one use case per line with larger type (the right choice for onboarding and almost always). "grid" = compact 2-up tiles, only for a dense many-app spotlight. Leave unset for the default list.'),
                headline: z.string().optional().describe('OMIT in the default "list" layout — your one warm chat sentence right above the card is the introduction, and a headline inside the card just repeats it. Only for the compact "grid" layout give a short personal headline.'),
                subhead: z.string().optional().describe('Optional one-line subhead under the headline — grid layout only, omit for list'),
                tiles: z.array(z.object({
                    title: z.string().describe('The EXACT message sent to chat verbatim when this tile is tapped — write it as the plain first-person instruction the user would type, 3-6 words, e.g. "Track my competitors in AI". Not a marketing sentence, not agent-voice. When the use case runs on specific app(s), NAME them in the title so the sent message carries its own context.'),
                    description: z.string().describe('ONE short sub-line explaining the value (shown under the title, NEVER sent to chat) — aim for under 110 characters so it fits on a single line; anything longer gets visually cut off'),
                    app: z.string().optional().describe('An app/integration name to show its real logo, e.g. "gmail", "hubspot", "@activepieces/piece-slack". Use for tiles about one of their connected apps. Omit for a generic capability tile.'),
                    icon: z.string().optional().describe('kebab-case Lucide icon name for a generic capability tile. Prefer modern, evocative glyphs: "radar", "target", "orbit", "telescope", "workflow", "waypoints", "brain-circuit", "gauge", "scan-search", "chart-spline", "wand-sparkles", "compass", "timer", "goal", "notebook-pen", "presentation", "wallet", "rocket", "zap", "sparkles", "bot". Ignored when `app` is set.'),
                })).describe('2-4 use-case tiles, personalised to this user (the UI renders at most 4)'),
            }),
            execute: async () => {
                return { displayed: true }
            },
        }),
        ap_show_quick_replies: tool({
            description: 'Offer 1-3 short, relevant follow-up suggestions above the chat input. Only use when concrete next steps genuinely exist; skip it otherwise.',
            inputSchema: z.object({
                replies: z.array(z.string().max(80)).min(1).max(3).describe('Short suggestion texts. Keep to at most 2 when offerRecurringAutomation is true.'),
                offerRecurringAutomation: z.boolean().optional().describe('Set to true when you have just successfully completed a one-time task that could plausibly run on a schedule. When true, the client pins a "Run this automatically every day" suggestion as the last chip, so phrase your replies around OTHER next steps and do not restate that phrase yourself. Omit or leave false for informational answers, partial or failed tasks, and tasks that are already recurring.'),
            }),
            execute: async () => {
                return { displayed: true }
            },
        }),
    }
}

