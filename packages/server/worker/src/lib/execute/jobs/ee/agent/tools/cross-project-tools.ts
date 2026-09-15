import { isObject, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { ActionPreviewEvent, agentToolClassification } from '@activepieces/shared'
import { tool, ToolExecutionOptions, ToolSet } from 'ai'
import { z } from 'zod'
import { executeBatchAction, MAX_BATCH_SIZE, MAX_IDENTICAL_ACTION_FAILURES } from './configured-tools'
import { AgentEventEmitter, cardTitleFields, extractUserFacingError, GateDecision, gateNoResponseMessage, isSuccessResult, stableStringify, TaintState, TOOL_EXECUTION_TIMEOUT_MS, truncateLargeResult, withToolTimeout } from './tool-primitives'

function createProgressGuard() {
    const failureCounts = new Map<string, number>()
    const succeededWrites = new Set<string>()
    const loadedGuides = new Set<string>()

    const actionKey = ({ pieceName, actionName, input }: { pieceName: string, actionName: string, input: unknown }): string =>
        `${pieceName}::${actionName}::${stableStringify(input ?? {})}`

    const failureBreakerText = (actionName: string): string =>
        `✋ This exact ${actionName} call has already failed ${MAX_IDENTICAL_ACTION_FAILURES} times with the same input — it was NOT retried. Stop repeating it. Either change the input based on the error, call ap_get_piece_props to get the correct schema, or tell the user plainly what's blocking. Do not re-send the identical request.`

    const duplicateWriteText = (actionName: string): string =>
        `✋ This exact action already ran successfully earlier in this turn (${actionName}) — it was NOT run again to avoid a duplicate side effect. Treat it as done; only repeat it if the user explicitly asks or the input changes.`

    return {
        checkActionRun: ({ pieceName, actionName, input }: { pieceName: string, actionName: string, input: unknown }): { content: { type: string, text: string }[] } | null => {
            const key = actionKey({ pieceName, actionName, input })
            if (succeededWrites.has(key)) {
                return { content: [{ type: 'text', text: duplicateWriteText(actionName) }] }
            }
            if ((failureCounts.get(key) ?? 0) >= MAX_IDENTICAL_ACTION_FAILURES) {
                return { content: [{ type: 'text', text: failureBreakerText(actionName) }] }
            }
            return null
        },
        recordActionRunResult: ({ pieceName, actionName, input, success }: { pieceName: string, actionName: string, input: unknown, success: boolean }): void => {
            const key = actionKey({ pieceName, actionName, input })
            if (success) {
                failureCounts.delete(key)
                if (agentToolClassification.isWriteActionName(actionName)) {
                    succeededWrites.add(key)
                }
                return
            }
            failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1)
        },
        markGuideLoaded: (topic: string): boolean => {
            if (loadedGuides.has(topic)) return true
            loadedGuides.add(topic)
            return false
        },
    }
}

export function createCrossProjectTools({ executeTool, eventEmitter, waitForApproval, onGateOpened, guides, taintState }: {
    executeTool: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    eventEmitter: AgentEventEmitter
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<GateDecision>
    onGateOpened?: (params: { gateId: string, toolName: string, displayName: string, toolInput: Record<string, unknown> }) => Promise<void>
    guides: Record<string, string>
    taintState: TaintState
}): ToolSet {
    const progressGuard = createProgressGuard()
    const executeWithTimeout = (toolName: string, toolInput: Record<string, unknown>) =>
        withToolTimeout({
            fn: () => executeTool(toolName, toolInput),
            timeoutMs: TOOL_EXECUTION_TIMEOUT_MS,
            toolName,
        })

    return {
        ap_discover_action_auth: tool({
            description: 'Check what authentication a piece needs and find available connections. Call this BEFORE ap_execute_action to determine if auth is needed.',
            inputSchema: z.object({
                ...cardTitleFields,
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
            }),
            execute: async (input) => {
                return executeWithTimeout('ap_discover_action_auth', input)
            },
        }),

        ap_revalidate_connection: tool({
            description: 'Verify a connection actually works right now by running its credentials against the live service — a connection can read as active while its token is dead or revoked. Use it when a piece action fails with an auth/credential error, or before building on a connection you suspect is stale. Pass the connectionExternalId returned by ap_discover_action_auth or ap_show_connection_picker. If it comes back not working, do NOT keep building on it: show the connection picker so the user can reconnect, then retry.',
            inputSchema: z.object({
                connectionExternalId: z.string().describe('The connectionExternalId of the connection to verify'),
            }),
            execute: async (input) => {
                return executeWithTimeout('ap_revalidate_connection', input)
            },
        }),

        ap_execute_action: tool({
            description: 'Execute a piece action once or in batch. Before the FIRST call to an action you have not already inspected this conversation, call ap_get_piece_props to get the exact prop names, required fields, dropdown values, and dynamic sub-field shapes — never guess the input shape (guessing fails validation and wastes turns). Use ap_discover_action_auth first to check if auth is needed. The system manages connections automatically after the user selects one. If a call fails, fix the input from the returned error and retry ONCE; do not re-send a near-identical call repeatedly. For batch execution, provide an items array where each element is a complete input object for one invocation.',
            inputSchema: z.object({
                ...cardTitleFields,
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-gmail"'),
                actionName: z.string().describe('Action to run, e.g. "gmail_search_mail"'),
                input: z.record(z.string(), z.unknown()).optional().describe('Input for the action (single-item mode)'),
                items: z.array(z.record(z.string(), z.unknown())).max(MAX_BATCH_SIZE).optional().describe('Array of input objects for batch execution. Each element is a complete input for one invocation. Max 100 items.'),
                description: z.string().optional().describe('Human-readable label for batch progress card, e.g. "Sending birthday messages"'),
                needsConfirmation: z.boolean().optional().describe('Set to true for write/destructive/external actions that should be confirmed by the user before execution. Always true for: send, post, delete, create, update, forward, reply actions.'),
            }),
            execute: async (toolInput, options) => {
                const isBatch = toolInput.items && toolInput.items.length > 0
                if (!isBatch) {
                    const guardResult = progressGuard.checkActionRun({
                        pieceName: toolInput.pieceName,
                        actionName: toolInput.actionName,
                        input: toolInput.input,
                    })
                    if (guardResult) {
                        return guardResult
                    }
                }
                const needsPreview = agentToolClassification.requiresActionPreview({
                    actionName: toolInput.actionName,
                    input: toolInput.input,
                    needsConfirmation: toolInput.needsConfirmation,
                    tainted: taintState.tainted,
                })

                if (needsPreview) {
                    const previewData: ActionPreviewEvent = {
                        toolCallId: options.toolCallId,
                        pieceName: toolInput.pieceName,
                        actionName: toolInput.actionName,
                        actionDisplayName: toolInput.title ?? toolInput.actionName,
                        input: toolInput.input ?? {},
                        isBatch: !!isBatch,
                        batchCount: isBatch ? toolInput.items!.length : undefined,
                        batchSamples: isBatch ? toolInput.items!.slice(0, 3) : undefined,
                    }
                    eventEmitter.emitActionPreview(previewData)
                    if (onGateOpened) {
                        await tryCatch(() => onGateOpened({
                            gateId: options.toolCallId,
                            toolName: 'ap_execute_action',
                            displayName: toolInput.title ?? toolInput.actionName,
                            toolInput: {
                                pieceName: toolInput.pieceName,
                                actionName: toolInput.actionName,
                                input: toolInput.input ?? {},
                                items: isBatch ? toolInput.items!.slice(0, 3) : undefined,
                                batchCount: isBatch ? toolInput.items!.length : undefined,
                            },
                        }))
                    }
                    const decision = await waitForApproval({ gateId: options.toolCallId })
                    if (decision.outcome !== 'approved') {
                        const text = decision.outcome === 'timeout' ? gateNoResponseMessage('action approval') : 'Action cancelled by user.'
                        return { content: [{ type: 'text', text }] }
                    }
                }

                if (isBatch) {
                    return executeBatchAction({
                        executeWithTimeout,
                        eventEmitter,
                        toolCallId: options.toolCallId,
                        pieceName: toolInput.pieceName,
                        actionName: toolInput.actionName,
                        items: toolInput.items!,
                        description: toolInput.description,
                    })
                }
                const rawResult = await executeWithTimeout('ap_execute_action', toolInput)
                const rawSuccess = isSuccessResult(rawResult)
                progressGuard.recordActionRunResult({
                    pieceName: toolInput.pieceName,
                    actionName: toolInput.actionName,
                    input: toolInput.input,
                    success: rawSuccess,
                })
                const result = truncateLargeResult(rawResult)
                const resultObj = isObject(rawResult) ? rawResult as Record<string, unknown> : {}
                const meta = isObject(resultObj['_meta']) ? resultObj['_meta'] as Record<string, unknown> : undefined
                // A card means something *happened*. Read-only lookups (read-verb actions,
                // safe-method custom_api_call/HTTP GETs) are not outcomes — they fold into the
                // thinking accordion as a step, same as ap_explore_data. Only writes/outcomes
                // get a receipt card. The frontend mirrors this gate (no skeleton either).
                const isReadOnly = agentToolClassification.isReadOnlyActionCall({
                    actionName: toolInput.actionName,
                    input: toolInput.input,
                })
                if (!isReadOnly) {
                    eventEmitter.emitActionReceipt({
                        toolCallId: options.toolCallId,
                        actionDisplayName: toolInput.title ?? toolInput.actionName,
                        pieceName: toolInput.pieceName,
                        connectionLabel: typeof meta?.['connectionLabel'] === 'string' ? meta['connectionLabel'] : undefined,
                        status: rawSuccess ? 'success' : 'failed',
                        output: result,
                        errorMessage: !rawSuccess ? extractUserFacingError({ result: rawResult, meta }) : undefined,
                        timestamp: new Date().toISOString(),
                    })
                }
                return result
            },
        }),

        ap_list_across_projects: tool({
            description: 'List resources across ALL user projects at once. Use instead of switching project context for cross-project queries.',
            inputSchema: z.object({
                ...cardTitleFields,
                resource: z.enum(['flows', 'tables', 'runs', 'connections']).describe('The type of resource to list'),
                status: z.string().optional().describe('Filter by status'),
            }),
            execute: async (input) => {
                return truncateLargeResult(await executeWithTimeout('ap_list_across_projects', input))
            },
        }),

        ap_explore_data: tool({
            description: 'Read-only look at the user\'s real data during discovery — list/get/search/read a sheet\'s rows and columns, channels, records, etc. — to understand what they have and build something that fits. Only runs read actions (never writes). Needs a connection like ap_execute_action; ensure one is selected first AND that you pass auth + any resolved object/list id (via ap_get_piece_props with auth) — an empty read is usually an unset connection or an unresolved id, NOT absence of data, so fix that and retry before concluding there is nothing there. Keep samples small (~20 rows). This is for understanding, NOT for performing the task — use ap_execute_action to actually do things.',
            inputSchema: z.object({
                ...cardTitleFields,
                pieceName: z.string().describe('Piece name, e.g. "@activepieces/piece-google-sheets"'),
                actionName: z.string().describe('A read action, e.g. "get_rows", "list_channels"'),
                input: z.record(z.string(), z.unknown()).optional().describe('Input for the read action (keep limits small)'),
            }),
            execute: async (toolInput) => {
                if (!agentToolClassification.isReadOnlyActionCall({ actionName: toolInput.actionName, input: toolInput.input })) {
                    return agentToolClassification.readOnlyRejection(toolInput.actionName)
                }
                taintState.tainted = true
                const rawResult = await executeWithTimeout('ap_explore_data', toolInput)
                return truncateLargeResult(rawResult)
            },
        }),

        ap_run_code: tool({
            description: 'Write and run JavaScript/TypeScript in a secure sandbox to compute, transform data, parse content, or manipulate files/images when no piece fits or code is simpler. Reach for this when a task is best solved with code (e.g. resize/convert an image, parse a CSV, do a calculation, reformat JSON) and there is no suitable piece action. Your code MUST export a function named `code`: `export const code = async (inputs) => { ... }`. The value you return becomes the result. To use npm packages, pass a `packageJson` string with a `dependencies` map — pure-JS packages only (e.g. "papaparse", "jimp"); native/binary modules like "sharp" or "canvas" will NOT load. To create an image/graphic from scratch, build an SVG string and return it as a `.svg` file (no dependency needed). To read user attachments OR an offloaded large tool result, pass their fileIds in `inputFileIds` — each becomes `inputs.files[i]` as `{ name, mimeType, base64 }`, and any JSON file is ALSO parsed for you as `inputs.data` (the object/array directly — no decoding needed; if you pass several JSON files it is an array in order). This is how you process a big result that came back as a preview + fileId: pass that fileId, read `inputs.data`, pull just the fields you need, and return a compact summary. For an image you generated earlier, pass its URL into `input` and `fetch()` it instead. To return files/images to the user, return an object with a `files` array of `{ name, mimeType, base64 }`; those are shown to the user automatically (do not also paste them into your reply). Prefer dedicated pieces for third-party integrations and authenticated API calls.',
            inputSchema: z.object({
                title: z.string().optional().describe('Short human-friendly label for the tool card, e.g. "Resize image", "Parse CSV", "Compute totals"'),
                recipe: z.array(z.string()).optional().describe('Plain-English lines describing what the code does, written for a non-technical user. 3-6 short lines, no numbering, no code/syntax/variable names — each line is one human step of the logic (what it does and why) at a high altitude, NOT a line-by-line translation. E.g. ["Open up your spreadsheet", "Add together every value in the Amount column", "Round the total to two decimal places", "Hand back the final number"].'),
                code: z.string().describe('TypeScript/JavaScript that exports `const code = async (inputs) => {...}`. Return the result; return a `files` array to hand files back to the user.'),
                packageJson: z.string().optional().describe('Optional package.json string with a `dependencies` map for npm imports, e.g. {"dependencies":{"sharp":"0.33.0"}}'),
                inputFileIds: z.array(z.string()).optional().describe('fileIds of user attachments to load; each is provided to your code as inputs.files[i] = { name, mimeType, base64 }'),
                input: z.record(z.string(), z.unknown()).optional().describe('Optional extra values merged into `inputs`'),
            }),
            execute: async (toolInput, { toolCallId }: ToolExecutionOptions<undefined>) => {
                const rawResult = await executeWithTimeout('ap_run_code', toolInput)
                const resultObj = isObject(rawResult) ? rawResult as Record<string, unknown> : {}
                const producedFiles = Array.isArray(resultObj['producedFiles']) ? resultObj['producedFiles'] : []
                const timestamp = new Date().toISOString()
                for (const file of producedFiles) {
                    if (!isObject(file)) continue
                    eventEmitter.emitFileProduced({
                        toolCallId,
                        fileId: typeof file['fileId'] === 'string' ? file['fileId'] : '',
                        url: typeof file['url'] === 'string' ? file['url'] : '',
                        mediaType: typeof file['mediaType'] === 'string' ? file['mediaType'] : 'application/octet-stream',
                        fileName: typeof file['fileName'] === 'string' ? file['fileName'] : 'file',
                        byteSize: typeof file['byteSize'] === 'number' ? file['byteSize'] : 0,
                        ...spreadIfDefined('title', typeof toolInput.title === 'string' ? toolInput.title : undefined),
                        timestamp,
                    })
                }
                const text = resultObj['text']
                if (typeof text === 'string') {
                    return { text, producedFiles }
                }
                return truncateLargeResult(rawResult)
            },
        }),

        ap_load_guide: tool({
            description: 'Load a detailed playbook into context before that kind of work (silent, internal). Topics: build_flow (constructing/validating/testing an automation), one_time_task (one-shot do-it-now action), error_handling (success/failure branches), http_fallback (calling an API directly when no connection exists), control_flow (routers/conditions & loops — exact operators and gotchas), state (remembering data across runs: Store vs Tables vs Sheets, dedup/idempotency), tables (the built-in Tables database), ai (native AI steps and their output shapes), about_activepieces (what Activepieces is — open source, self-hosting, editions/pricing, security, how integrations work, how you work).',
            inputSchema: z.object({
                topic: z.enum(['build_flow', 'one_time_task', 'error_handling', 'http_fallback', 'control_flow', 'state', 'tables', 'ai', 'about_activepieces']).describe('Which guide to load'),
            }),
            execute: async (toolInput) => {
                const guide = guides[toolInput.topic]
                if (!guide) {
                    return `No guide found for "${toolInput.topic}".`
                }
                if (progressGuard.markGuideLoaded(toolInput.topic)) {
                    return `You already loaded the "${toolInput.topic}" guide earlier in this turn — re-read it from the conversation above instead of reloading.`
                }
                return guide
            },
        }),

        ap_remember: tool({
            description: 'Save a durable fact or preference about THIS user so it carries across all future conversations (silent, internal). Call it whenever the user would otherwise have to repeat themselves next time: when they explicitly ask you to remember something ("remember I love cheese") — always honor that — or when they volunteer a durable personal fact, preference, default, or correction ("I love cheese", "I prefer TypeScript", "default notify channel is #ops", "always EU-based candidates", "stop asking me things you can find"). One short standalone statement per call. Duplicates and contradictions are reconciled automatically, so err toward saving when unsure. Do NOT use for one-off task details (those go in the brief).',
            inputSchema: z.object({
                memory: z.string().describe('One concise durable preference/fact about the user'),
            }),
            execute: async (toolInput) => {
                return executeTool('ap_remember', toolInput)
            },
        }),
    }
}

