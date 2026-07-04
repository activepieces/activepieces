import vm from 'node:vm'
import { ApLogger } from '@activepieces/server-utils'
import { apId, chatCodeModeUtils, isNil, isObject, tryCatch, tryCatchSync } from '@activepieces/shared'
import { tool, ToolExecutionOptions, ToolSet } from 'ai'
import { z } from 'zod'

// "Code Mode" — model-agnostic programmatic tool-calling. The model writes a small async JS
// module that orchestrates the OTHER chat tools (calls them, loops, aggregates) and returns only
// a compact final value. Bridged tool calls and their (often large) results stay HERE in the
// worker, out of the model's context — only the module's `return` value goes back. This is a
// plain tool any model can call (no Anthropic-specific code-execution API).
//
// PRODUCTION NOTE (demo vs. hardening): the runner below is an in-worker `node:vm` context. `vm`
// is NOT a security boundary — a determined script can escape it (e.g. via constructor walks).
// The context disables runtime string code-generation (`codeGeneration: { strings: false }`),
// which closes the trivial `Function('...')` constructor-walk path, but subtler escapes remain. For production the SAME `BridgedTools` interface
// should be implemented over an IPC/RPC channel to #13909's isolated engine sandbox: the code runs
// in the sandbox, and `tools.x(args)` round-trips back to the worker where `allTools` lives. The
// bridge is deliberately a narrow async interface (one method: callTool) so that swap is feasible
// without touching the model-facing contract or the namespace generation.

// Hard ceiling on one Code Mode run. Kept well below the old 10-minute value so a hung bridged call
// (e.g. a raw custom_api_call HTTP that never responds — which can otherwise burn the 300s per-call
// timeout twice for ~600s) fails the run in a couple of minutes instead. Still ample for the demo
// tasks (~25-95s) and for a gated tool awaiting user approval inside code, the usual reason a run
// legitimately runs long. The real cure for the hang is steering the model to named piece actions
// over raw HTTP (see the tool description); this just bounds the worst case.
const CODE_MODE_TIMEOUT_MS = 3 * 60 * 1_000
const SYNC_COMPILE_TIMEOUT_MS = 5_000
const MAX_RETURN_BYTES = 64 * 1024
const MAX_CONSOLE_LINES = 200
const MAX_CONSOLE_LINE_CHARS = 2_000
const MAX_BRIDGED_CALLS = 1_000
// Bridged calls hand the FULL raw result to the in-VM code (offload/truncation is skipped so the
// code can process everything), so a pathological read — a huge sheet/table/API dump, or a loop
// pulling many large pages — could pile the raw payloads into the worker heap and OOM it before the
// 64 KB return clamp ever runs. Bound both a single result and the run's cumulative raw bytes; on
// breach, throw a helpful error INTO the code so the model retries with a page size/filter instead
// of crashing the worker. Generous vs. real reads (a few MB), tight vs. the crash case.
const MAX_BRIDGED_RESULT_BYTES = 25 * 1024 * 1024
const MAX_BRIDGED_TOTAL_BYTES = 60 * 1024 * 1024

// ap_run_tools must never call itself (infinite recursion) and the silent UI-control tools add no
// value from inside code — keep the callable surface to the real work tools. The interactive
// display/gate tools (ap_show_*) are excluded too: they open a UI card and block on the user's
// answer, which can't arrive mid-VM — calling one from inside code would just stall the run until
// the grace window parks the whole turn. The model must show those cards OUTSIDE Code Mode.
const NON_CALLABLE_TOOL_NAMES = new Set<string>([
    'ap_run_tools',
    'ap_update_thinking_status',
    'ap_set_phase',
    'ap_set_build_plan',
    'ap_show_connection_picker',
    'ap_show_connection_required',
    'ap_show_project_picker',
    'ap_show_questions',
    'ap_show_quick_replies',
    'ap_show_mcp_reconnect',
])

type ToolExecute = (args: unknown, options: ToolExecutionOptions) => unknown

type ToolLike = {
    description?: string
    inputSchema?: unknown
    execute?: ToolExecute
}

// The narrow async contract the in-code `tools.x()` proxy speaks to. Swapping the in-worker
// implementation for an IPC/RPC client to the engine sandbox means re-implementing only this.
type BridgedTools = {
    callTool: (jsName: string, args: unknown) => Promise<unknown>
    jsNames: string[]
}

type CodeModeRunResult = {
    ok: boolean
    returnValue?: unknown
    error?: string
    consoleLines: string[]
    bridgedCallCount: number
    serverSideBytes: number
    returnedBytes: number
    resultShapes: { tool: string, shape: string }[]
}

// A large result was processed (a real read happened) above this, vs. a genuinely small/empty one.
// Used to tell a degenerate (empty/zero) return apart from a real "no data" answer.
const LARGE_RESULT_BYTES = 8 * 1_024
const MAX_SHAPE_CHARS = 400

function toJsName(toolName: string): string {
    const cleaned = toolName.replace(/[^a-zA-Z0-9_$]/g, '_')
    return /^[a-zA-Z_$]/.test(cleaned) ? cleaned : `_${cleaned}`
}

function normalizeModuleCode(code: string): string {
    return code
        .replace(/(^|[;{}\n\r])([ \t]*)export[ \t]+default[ \t]+/g, '$1$2module.exports.default = ')
        .replace(/(^|[;{}\n\r])([ \t]*)export[ \t]+(async[ \t]+function|function|const|let|var|class)\b/g, '$1$2$3')
}

function isToolLike(value: unknown): value is ToolLike {
    return isObject(value) && typeof (value as { execute?: unknown }).execute === 'function'
}

function byteLengthOf(value: unknown): number {
    const { data: serialized } = tryCatchSync(() => typeof value === 'string' ? value : JSON.stringify(value))
    return isNil(serialized) ? 0 : Buffer.byteLength(serialized, 'utf8')
}

// A compact STRUCTURE-ONLY summary of a value — keys, types, and array lengths, never the values
// themselves — so the model can see where a bridged result actually keeps its data (e.g. that a list
// lives at `results.messages`, not at the top level) WITHOUT the data entering its context. This is
// the cure for the silent-empty bug: a model that guesses `Array.isArray(data.results)` and gets an
// empty result has no error to learn from; the echoed shape shows it the real path. Depth/width-bounded.
function shapeDigest(value: unknown, depth = 2): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (Array.isArray(value)) {
        if (value.length === 0) return 'array[0]'
        return `array[${value.length}] of ${depth > 0 ? shapeDigest(value[0], depth - 1) : '…'}`
    }
    if (typeof value !== 'object') return typeof value
    const keys = Object.keys(value as Record<string, unknown>)
    if (keys.length === 0) return '{}'
    if (depth <= 0) return `{ ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? ', …' : ''} }`
    const obj = value as Record<string, unknown>
    const parts = keys.slice(0, 12).map((key) => `${key}: ${shapeDigest(obj[key], depth - 1)}`)
    return `{ ${parts.join(', ')}${keys.length > 12 ? ', …' : ''} }`
}

// "The code ran but extracted nothing" — the signature of a wrong field access on a result that DID
// contain data. An object/array counts as degenerate only when EVERY leaf is empty/zero, so a real
// partial answer (one non-empty field) is not flagged. Only consulted when a large result was
// processed, so a genuine "no data" read (small bytes) is never mistaken for a bug.
function isDegenerate(value: unknown): boolean {
    if (isNil(value)) return true
    if (typeof value === 'number') return value === 0
    if (typeof value === 'string') return value.trim().length === 0
    if (typeof value === 'boolean') return false
    if (Array.isArray(value)) return value.length === 0 || value.every(isDegenerate)
    if (isObject(value)) {
        const values = Object.values(value)
        return values.length === 0 || values.every(isDegenerate)
    }
    return false
}

// Turn a tool's raw return into clean, directly-usable data for the in-code `tools.x()` caller, so
// the model's scripts don't have to reach into the MCP content-wrapper and JSON.parse a
// status-prefixed string (see the comment at the call site). Priority:
//   1. structuredContent (an object) → return it as-is;
//   2. content[0].text → strip a leading status/emoji line, then JSON.parse the rest if it parses
//      (else return the stripped text);
//   3. anything else → return the raw result untouched.
function unwrapToolResult(result: unknown): unknown {
    if (!isObject(result)) return result
    const structured = (result as { structuredContent?: unknown }).structuredContent
    if (isObject(structured)) return structured
    const text = readFirstContentText(result)
    if (isNil(text)) return result
    const stripped = stripStatusPrefix(text)
    const { data: parsed, error } = tryCatchSync(() => JSON.parse(stripped) as unknown)
    return isNil(error) ? parsed : stripped
}

function readFirstContentText(result: unknown): string | null {
    if (!isObject(result)) return null
    const content = (result as { content?: unknown }).content
    if (!Array.isArray(content) || content.length === 0) return null
    const first = content[0]
    const text = isObject(first) ? (first as { text?: unknown }).text : undefined
    return typeof text === 'string' ? text : null
}

// Drop a leading status line so the JSON payload underneath can be parsed. Handles the two shapes
// the result builders emit: a first line beginning with a status emoji (✅/❌/⚠️), and a leading
// "✅ … :" status-prefix on the same line as the data. No-prefix text is returned unchanged.
function stripStatusPrefix(text: string): string {
    const trimmed = text.replace(/^﻿/, '').trimStart()
    const newlineIndex = trimmed.indexOf('\n')
    if (newlineIndex !== -1) {
        const firstLine = trimmed.slice(0, newlineIndex)
        if (/^[✅❌⚠️]/u.test(firstLine)) {
            return trimmed.slice(newlineIndex + 1).trimStart()
        }
    }
    const inlinePrefix = trimmed.match(/^[✅❌⚠️][^\n:]*:\s*/u)
    if (inlinePrefix) {
        return trimmed.slice(inlinePrefix[0].length)
    }
    return trimmed
}

// Documented return shapes for the tools the model orchestrates most in Code Mode, keyed by REAL
// tool name. Kept verbatim from the tools' `structuredContent` builders (the value the bridge hands
// back after unwrapToolResult). Without these the model guesses field names (`result.actions`) and
// the first run throws `Cannot read properties of undefined` before self-correcting. Only the heavy/
// common tools need a hint; the generic defensive note in the tool description covers the rest.
const RETURN_SHAPE_HINTS: Record<string, string> = {
    // bulkLookup (pieceNames) — the dominant path. searchQuery mode returns the same wrapper but
    // pieces carry actions/triggers ONLY when includeActions/includeTriggers is set. actions/triggers
    // are arrays of OBJECTS (use `.name`), never plain strings.
    ap_research_pieces: '{ pieces: [{ name, displayName, description, actions: [{ name, displayName, description, requiresAuth, cardinality, aiDescription? }], triggers: [ …same shape ], recommendedActions?: [{ name, … }] }], missing: string[], count }',
    ap_get_piece_props: '{ piece, name, displayName, description, requiresAuth, cardinality, aiMetadata?, outputSchema?, outputFields?: string[], props: [{ name, type, required, displayName, options?, note? }], requiredInputs: { provideNow: string[], needsResolution: string[] }, exampleInput }',
    // The action\'s OWN output payload (piece-specific — e.g. an array of messages, or { id }), NOT a
    // wrapper. Shape varies per piece/action, so inspect it (Object.keys) rather than assume. On
    // failure / non-2xx / empty you may instead get a short status string.
    ap_execute_action: 'the action\'s own output payload — shape depends on the piece/action (inspect with Object.keys); a status string on failure',
}

// Compact, model-facing signature for one tool: name(arg1, arg2?) — first line of its description,
// then (for the heavy/common tools) the RETURN shape so the model writes correct field access
// first-try instead of guessing (e.g. `result.actions` when the field is `result.pieces`). The
// shapes below are the ACTUAL value the in-code `tools.x()` call receives — i.e. AFTER the bridge's
// unwrapToolResult: for tools that emit `structuredContent` that object is returned verbatim, so the
// shapes are taken from the real `structuredContent` builders, not the prose `content[0].text`.
// Best-effort schema introspection: zod `.shape` first, then a JSON-schema `properties` fallback,
// then a bare `(input)` so an exotic schema still lists the tool rather than dropping it.
function describeToolSignature({ realName, jsName, tool: toolDef }: { realName: string, jsName: string, tool: ToolLike }): string {
    const argList = extractArgList(toolDef.inputSchema)
    const summary = firstLine(toolDef.description)
    const signature = `tools.${jsName}({ ${argList} })`
    const returns = RETURN_SHAPE_HINTS[realName]
    const head = summary.length > 0 ? `${signature} — ${summary}` : signature
    return returns ? `${head}\n    ↳ returns ${returns}` : head
}

function firstLine(text?: string): string {
    if (isNil(text)) return ''
    const line = text.split('\n')[0]?.trim() ?? ''
    return line.length > 160 ? `${line.slice(0, 160)}…` : line
}

function extractArgList(schema: unknown): string {
    const zodShape = readZodShape(schema)
    if (zodShape) {
        const keys = Object.entries(zodShape).map(([key, value]) => isOptionalZod(value) ? `${key}?` : key)
        return keys.length > 0 ? keys.join(', ') : '…'
    }
    const jsonProps = readJsonSchemaProps(schema)
    if (jsonProps) {
        const { properties, required } = jsonProps
        const keys = Object.keys(properties).map((key) => required.has(key) ? key : `${key}?`)
        return keys.length > 0 ? keys.join(', ') : '…'
    }
    return 'input'
}

function readZodShape(schema: unknown): Record<string, unknown> | null {
    if (!isObject(schema)) return null
    const shape = (schema as { shape?: unknown }).shape
    return isObject(shape) ? shape as Record<string, unknown> : null
}

function isOptionalZod(value: unknown): boolean {
    if (!isObject(value)) return false
    const def = (value as { _def?: { typeName?: unknown, type?: unknown } })._def
    const typeName = def?.typeName
    const type = def?.type
    return typeName === 'ZodOptional' || typeName === 'ZodDefault' || type === 'optional' || type === 'default'
}

function readJsonSchemaProps(schema: unknown): { properties: Record<string, unknown>, required: Set<string> } | null {
    const { data: json } = tryCatchSync(() => {
        if (isObject(schema) && isObject((schema as { properties?: unknown }).properties)) {
            return schema as { properties: Record<string, unknown>, required?: unknown }
        }
        // zod schemas convert cleanly; this is the JSON-schema fallback path.
        return z.toJSONSchema(schema as z.ZodType) as unknown as { properties?: Record<string, unknown>, required?: unknown }
    })
    if (!isObject(json) || !isObject(json.properties)) return null
    const required = new Set(Array.isArray(json.required) ? json.required.filter((r): r is string => typeof r === 'string') : [])
    return { properties: json.properties as Record<string, unknown>, required }
}

function buildBridge({ tools, log }: { tools: ToolSet, log: ApLogger }): {
    bridge: BridgedTools
    getStats: () => { bridgedCallCount: number, serverSideBytes: number, resultShapes: { tool: string, shape: string }[] }
} {
    // jsName → real tool execute. The same in-process tool implementation the model would call
    // directly, so conversation context (the conversationId threaded to the API) and approval GATES
    // are inherited automatically (the real execute() blocks on waitForApproval for gated tools like
    // ap_send_email). Connection auth is resolved server-side per conversation+piece: the action
    // tools (ap_execute_action / ap_explore_data) reuse the conversation's sticky connection and, if
    // none was picked yet, auto-bind the project's single ACTIVE connection — so a Code Mode call to
    // a connection-gated piece gets real data without the model first showing an interactive picker
    // (which it can't, mid-code). See runChatAdhocAction in chat-tools.ts.
    const byJsName = new Map<string, { realName: string, execute: ToolExecute }>()
    for (const [realName, value] of Object.entries(tools)) {
        if (NON_CALLABLE_TOOL_NAMES.has(realName)) continue
        if (!isToolLike(value) || isNil(value.execute)) continue
        byJsName.set(toJsName(realName), { realName, execute: value.execute })
    }

    let bridgedCallCount = 0
    let serverSideBytes = 0
    // realName → compact structure of the value the code received. One entry per distinct tool
    // (a looped call keeps the same shape), echoed back to the model so it reads correct field names.
    const resultShapes = new Map<string, string>()

    const callTool = async (jsName: string, args: unknown): Promise<unknown> => {
        const entry = byJsName.get(jsName)
        if (isNil(entry)) {
            throw new Error(`Unknown tool: tools.${jsName} is not available. See the list in the tool description.`)
        }
        if (bridgedCallCount >= MAX_BRIDGED_CALLS) {
            throw new Error(`Code Mode exceeded ${MAX_BRIDGED_CALLS} bridged tool calls in one run.`)
        }
        bridgedCallCount++
        // Each bridged call gets its own toolCallId so per-call approval gates (keyed on
        // toolCallId) work independently. messages is empty: the bridged call is not itself a
        // model turn. execute() is the real implementation, so its result — however large —
        // stays here in the runner and never enters the model context.
        const options: ToolExecutionOptions = { toolCallId: apId(), messages: [] }
        // Mark the args so every offload/truncate layer (the worker tool wrappers, the MCP
        // wrapper, and the API's runChatAdhocAction across the RPC) returns the FULL, un-offloaded,
        // un-truncated result. Those protections exist to keep the MODEL's context lean; the in-VM
        // code needs the complete data (it processes it here and returns only a small value). The
        // flag rides on the top-level args object — the piece's own input is nested under `input`,
        // so it never reaches the executed action. Without this, a big read (e.g. a multi-MB Gmail
        // list) would be offloaded to a FILE before the code ever saw it, collapsing Code Mode's
        // entire advantage back into fetch→file→ap_run_code.
        const rawArgs = chatCodeModeUtils.markRawArgs(isNil(args) ? {} : args)
        const result = await Promise.resolve(entry.execute(rawArgs, options))
        const resultBytes = byteLengthOf(result)
        // Guard the worker heap against a runaway raw payload (see MAX_BRIDGED_* above). Throwing
        // here surfaces as a catchable error inside the code, so the model can retry the read with a
        // smaller page size or a filter instead of the whole chat worker OOM-ing.
        if (resultBytes > MAX_BRIDGED_RESULT_BYTES) {
            throw new Error(`tools.${jsName} returned ${Math.round(resultBytes / (1024 * 1024))} MB, over the ${Math.round(MAX_BRIDGED_RESULT_BYTES / (1024 * 1024))} MB per-call limit. Re-run with a smaller page size / limit or a tighter filter.`)
        }
        serverSideBytes += resultBytes
        if (serverSideBytes > MAX_BRIDGED_TOTAL_BYTES) {
            throw new Error(`Code Mode processed over ${Math.round(MAX_BRIDGED_TOTAL_BYTES / (1024 * 1024))} MB of tool results in one run. Narrow the reads (smaller pages, filters) or return a summary sooner.`)
        }
        log.debug({ tool: { name: entry.realName }, resultBytes: byteLengthOf(result) }, '[chat][code-mode] bridged tool call')
        // Hand the CODE clean, directly-usable data — not the raw MCP content-wrapper. The model's
        // Code Mode scripts naturally do `JSON.parse(result.content[0].text)`, but `content[0].text`
        // is prefixed with a status line (e.g. "✅ Research …\n{json}"), so that parse throws and
        // burns a self-correcting retry. Unwrap to the most useful value here so the script gets a
        // parsed object straight away. (The unwrapped value is still server-side — only the script's
        // final `return` reaches the model.)
        const unwrapped = unwrapToolResult(result)
        // Record the STRUCTURE (keys/types, no values) of what the code received, so the model can be
        // shown the real field paths in the response — the fix for blind-guess loops over unknown
        // per-piece shapes. Skip trivial scalars (a bare status string carries no shape worth echoing).
        if (isObject(unwrapped) || Array.isArray(unwrapped)) {
            const digest = shapeDigest(unwrapped)
            resultShapes.set(entry.realName, digest.length > MAX_SHAPE_CHARS ? `${digest.slice(0, MAX_SHAPE_CHARS)}…` : digest)
        }
        return unwrapped
    }

    return {
        bridge: { callTool, jsNames: [...byJsName.keys()] },
        getStats: () => ({ bridgedCallCount, serverSideBytes, resultShapes: [...resultShapes].map(([tool, shape]) => ({ tool, shape })) }),
    }
}

async function runCodeWithBridge({ code, data, bridge, log }: {
    code: string
    data: Record<string, unknown>
    bridge: BridgedTools
    log: ApLogger
}): Promise<{ ok: boolean, returnValue?: unknown, error?: string, consoleLines: string[] }> {
    const consoleLines: string[] = []
    const capture = (...parts: unknown[]): void => {
        if (consoleLines.length >= MAX_CONSOLE_LINES) return
        const line = parts.map((p) => typeof p === 'string' ? p : (byteLengthOf(p) > 0 ? JSON.stringify(p) : String(p))).join(' ')
        consoleLines.push(line.length > MAX_CONSOLE_LINE_CHARS ? `${line.slice(0, MAX_CONSOLE_LINE_CHARS)}…` : line)
    }

    // tools.<name>(args) → bridge. Proxy so any name the model references resolves (and a wrong
    // one throws a helpful error) without us pre-binding every method.
    const toolsProxy = new Proxy({}, {
        get: (_target, prop: string | symbol): ((args: unknown) => Promise<unknown>) | undefined => {
            if (typeof prop !== 'string') return undefined
            return (args: unknown): Promise<unknown> => bridge.callTool(prop, args)
        },
    })

    const sandboxConsole = { log: capture, info: capture, warn: capture, error: capture, debug: capture }
    // Allowlist of safe globals only. No require/process/fs/net/setTimeout/fetch — fetch is
    // explicitly disabled (pieces/HTTP go through bridged tools, which carry SSRF protection and
    // gates). node:vm is not a hard boundary (see file header), so this is best-effort hygiene.
    const sandbox: Record<string, unknown> = {
        tools: toolsProxy,
        data,
        inputs: data,
        console: sandboxConsole,
        JSON,
        Math,
        Object,
        Array,
        Number,
        String,
        Boolean,
        Map,
        Set,
        Promise,
        RegExp,
        Error,
        // A clock without Date's mutable global surface: just "now" as an ISO string + epoch ms.
        now: () => new Date().toISOString(),
        nowMs: () => Date.now(),
        fetch: () => {
            throw new Error('fetch is disabled in Code Mode. Use a bridged tool (e.g. tools.ap_execute_action or tools.ap_fetch_url) instead.') 
        },
    }

    // Disallow runtime string-eval inside the context (`eval`, `Function('...')`) — it closes the
    // classic constructor-walk escape (`({}).constructor.constructor('return process.env')()`).
    // The module itself is unaffected: it's compiled host-side via `new vm.Script` below. vm is
    // still not a hard boundary (see file header); #13909's engine sandbox remains the real fix.
    const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } })
    // The model writes ESM (`export const run = …`), but vm.Script runs a classic script and can't
    // parse `export`. Strip the export keyword at statement boundaries (turning `export default X`
    // into a module.exports.default assignment) so the same code runs unchanged. A demo-grade
    // transform; the production engine-sandbox path would run it as a real module instead.
    const normalizedCode = normalizeModuleCode(code)
    // Wrap the user module: support `export const run = async (tools, data) => …`, a bare
    // `return`, or a trailing expression. The wrapper resolves the entry and returns its value.
    const wrapped = `(async () => {
        const module = { exports: {} };
        const exports = module.exports;
        ${normalizedCode}
        const entry = (typeof run === 'function' && run)
            || module.exports.run
            || module.exports.default
            || module.exports.code;
        if (typeof entry === 'function') {
            return await entry(tools, data);
        }
        return module.exports;
    })()`

    const { data: script, error: compileError } = tryCatchSync(() => new vm.Script(wrapped, { filename: 'code-mode.js' }))
    if (compileError || isNil(script)) {
        return { ok: false, error: `Code did not compile: ${compileError instanceof Error ? compileError.message : String(compileError)}`, consoleLines }
    }

    // The sync timeout only bounds synchronous compile/first-tick (vm.Script.runInContext can't
    // interrupt awaited async work). The real ceiling is the Promise.race below, set generously so
    // a gated tool blocking on user approval inside the code is NOT pre-killed.
    const { data: returnValue, error: execError } = await tryCatch(async () => {
        const promise = script.runInContext(context, { timeout: SYNC_COMPILE_TIMEOUT_MS }) as Promise<unknown>
        return Promise.race([
            promise,
            new Promise<never>((_resolve, reject) => {
                const timer = setTimeout(() => reject(new Error(`Code Mode timed out after ${CODE_MODE_TIMEOUT_MS / 1_000}s.`)), CODE_MODE_TIMEOUT_MS)
                if (typeof timer.unref === 'function') timer.unref()
            }),
        ])
    })

    if (execError) {
        log.warn({ error: execError }, '[chat][code-mode] code execution failed')
        return { ok: false, error: execError instanceof Error ? execError.message : String(execError), consoleLines }
    }
    return { ok: true, returnValue, consoleLines }
}

async function runCodeMode({ code, tools, data, log }: {
    code: string
    tools: ToolSet
    data: Record<string, unknown>
    log: ApLogger
}): Promise<CodeModeRunResult> {
    const { bridge, getStats } = buildBridge({ tools, log })
    const { ok, returnValue, error, consoleLines } = await runCodeWithBridge({ code, data, bridge, log })
    const { bridgedCallCount, serverSideBytes, resultShapes } = getStats()
    const returnedBytes = ok ? byteLengthOf(returnValue) : 0

    // Round-trip + context-savings instrumentation for the demo: how many tool calls happened
    // inside the code (zero model round-trips), how many bytes of tool output stayed server-side,
    // and how few bytes actually went back to the model.
    log.info({
        ok,
        bridgedCallCount,
        serverSideBytes,
        returnedBytes,
        savedBytes: Math.max(0, serverSideBytes - returnedBytes),
    }, '[chat][code-mode] ap_run_tools finished')

    return { ok, returnValue, error, consoleLines, bridgedCallCount, serverSideBytes, returnedBytes, resultShapes }
}

function buildToolNamespaceListing(tools: ToolSet): string {
    const lines: string[] = []
    for (const [realName, value] of Object.entries(tools)) {
        if (NON_CALLABLE_TOOL_NAMES.has(realName)) continue
        if (!isToolLike(value)) continue
        lines.push(describeToolSignature({ realName, jsName: toJsName(realName), tool: value }))
    }
    return lines.join('\n')
}

function clampReturnValue(value: unknown): { value: unknown, truncated: boolean } {
    const bytes = byteLengthOf(value)
    if (bytes <= MAX_RETURN_BYTES) {
        return { value, truncated: false }
    }
    const asString = typeof value === 'string' ? value : (tryCatchSync(() => JSON.stringify(value)).data ?? String(value))
    return {
        value: `${asString.slice(0, MAX_RETURN_BYTES)}…[truncated — the code's return value was ${Math.round(bytes / 1024)}KB. Return a smaller summary from the code instead of the raw data.]`,
        truncated: true,
    }
}

function formatReturnValue({ result }: { result: CodeModeRunResult }): { valueStr: string, truncated: boolean } {
    const { value, truncated } = clampReturnValue(result.returnValue)
    const valueStr = result.returnValue === undefined
        ? '(the code returned nothing)'
        : typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    return { valueStr, truncated }
}

// The real structure of each tool result the code received — keys/types only, never the data. The
// model writes its field access BLIND (the result never enters its context), so echoing the shape
// back is what lets it correct a wrong path (e.g. discover the list is at `results.messages`) without
// guessing. Costs a few hundred bytes; the multi-MB data stays server-side.
function buildShapesNote(result: CodeModeRunResult): string {
    if (result.resultShapes.length === 0) return ''
    const lines = result.resultShapes.map(({ tool, shape }) => `  • ${tool} → ${shape}`)
    return `\n\nResult shapes (structure only — the data stayed server-side; read your field names from here):\n${lines.join('\n')}`
}

function buildCodeModeResultText({ result }: { result: CodeModeRunResult }): string {
    const consoleNote = result.consoleLines.length > 0
        ? `\n\nConsole output:\n${result.consoleLines.join('\n')}`
        : ''
    const shapesNote = buildShapesNote(result)
    if (!result.ok) {
        return `❌ Code Mode failed: ${result.error ?? 'unknown error'}${shapesNote}${consoleNote}`
    }
    const { valueStr, truncated } = formatReturnValue({ result })
    const stats = `(${result.bridgedCallCount} tool call(s) ran inside the code; ${Math.round(result.serverSideBytes / 1024)}KB of tool output stayed server-side, ${Math.round((truncated ? MAX_RETURN_BYTES : result.returnedBytes) / 1024)}KB returned.)`
    // A non-empty read that yields an empty/zero return is almost always a wrong field access, not a
    // real "no data" answer. Say so plainly and point at the shapes, so the model fixes the path and
    // re-runs IN Code Mode instead of abandoning it for a direct call (which then offloads to a file).
    const misread = result.serverSideBytes > LARGE_RESULT_BYTES && isDegenerate(result.returnValue)
    const misreadWarning = misread
        ? `\n\n⚠️ The code processed ${Math.round(result.serverSideBytes / 1024)}KB of tool data but returned an empty/zero result — this almost always means a field access missed the data (the list is often under a nested key like \`results.messages\`, not the top level). Fix the field path using the result shapes below and re-run in Code Mode; do NOT refetch or fall back to a one-by-one call.`
        : ''
    return `✅ Code Mode ran. ${stats}${misreadWarning}\n\n${valueStr}${shapesNote}${consoleNote}`
}

// The structured twin of the model-facing text. The chat UI renders a dedicated "Code Mode" card
// from these fields instead of re-parsing the prose string, so the savings line, the code, and the
// result each read from a typed field. `modelText` carries the EXACT string the model receives
// (via toModelOutput), so the return-to-model contract is unchanged and stays model-agnostic — any
// model still just sees the text. `resultText` is the formatted return value alone (no stats/status
// preamble) for the card's result block.
function buildCodeModeStructuredContent({ code, reason, result }: {
    code: string
    reason: string | undefined
    result: CodeModeRunResult
}): CodeModeStructuredContent {
    const { valueStr, truncated } = formatReturnValue({ result })
    return {
        kind: 'code-mode',
        ok: result.ok,
        code,
        reason,
        bridgedCallCount: result.bridgedCallCount,
        serverSideBytes: result.serverSideBytes,
        returnedBytes: truncated ? MAX_RETURN_BYTES : result.returnedBytes,
        savedBytes: Math.max(0, result.serverSideBytes - (truncated ? MAX_RETURN_BYTES : result.returnedBytes)),
        resultText: result.ok ? valueStr : undefined,
        error: result.ok ? undefined : (result.error ?? 'unknown error'),
        consoleLines: result.consoleLines,
        truncated,
        modelText: buildCodeModeResultText({ result }),
    }
}

function readModelText(output: unknown): string | undefined {
    if (!isObject(output)) return undefined
    const structured = (output as { structuredContent?: unknown }).structuredContent
    if (isObject(structured) && typeof (structured as { modelText?: unknown }).modelText === 'string') {
        return (structured as { modelText: string }).modelText
    }
    return readFirstContentText(output) ?? undefined
}

// allTools is the SAME assembled worker tool map the model calls directly; the bridge looks up and
// awaits each tool's real execute() in it, so gates/connections/context are inherited. Pass the
// fully-built map (including everything except ap_run_tools, which it excludes itself).
function createCodeModeTools({ getTools, log }: {
    getTools: () => ToolSet
    log: ApLogger
}): ToolSet {
    const namespace = buildToolNamespaceListing(getTools())
    return {
        ap_run_tools: tool({
            description: [
                'Code Mode — write a small async JavaScript module that ORCHESTRATES your other tools (calls them, loops over results, aggregates) and runs server-side. PREFER this over calling tools one-by-one whenever you need to: call several tools in sequence or in a loop, fan a tool across many items, or chain a large read into a transform. It saves round-trips (the loop runs server-side, not turn-by-turn) AND context (large tool results stay server-side — only your final `return` value comes back, capped at 64KB).',
                '',
                'Shape: export an async `run`: `export const run = async (tools, data) => { /* ... */ return result }`. Call any tool as `await tools.<name>({ ...args })` — args are the SAME inputs that tool takes normally. Each call RETURNS THE ALREADY-PARSED RESULT DIRECTLY — the tool\'s plain return value (an object, or for non-JSON tools a string), NOT an MCP envelope. Do NOT reach for `.content[0].text`, `.structuredContent`, or `JSON.parse` the result; the bridge already unwrapped and parsed it. Each bridged call inherits connections, conversation context, and approval gates (a gated tool like ap_send_email will still pop its confirmation card and block until the user approves). `data`/`inputs` holds any offloaded results passed in. Return a COMPACT summary, not raw data. `fetch`, `require`, `process`, and file/network access are disabled — reach external systems only through bridged tools.',
                '',
                'CONNECTIONS: a connection-gated tool (Gmail, Slack, HubSpot, Linear, Airtable, …) called from inside Code Mode automatically uses the user\'s connected account — you do NOT need to pass `auth` or call a connection picker first; the user\'s active connection for that piece is bound for you, and a real result comes back on the first call. The one exception: if the user has MORE than one active account for that piece, the call returns an error naming them and asking you to call ap_show_connection_picker (outside Code Mode) so the user chooses — do that, then re-run the code. An empty result from a connection-gated read is real "no data", not a missing connection. NEVER call ap_list_connections, and never look up / construct / pass a connection object yourself inside the code — there is no `connections` array to filter, and doing `.find()` on a connections result throws `connections.find is not a function` and wastes turns; just call the action directly and the binding is automatic. And fetch each source ONCE: store a read\'s result in a const and reuse it for the rest of the run — never re-issue the same read (e.g. the Gmail search) in a later block.',
                '',
                'RESULT SHAPES: for the listed tools, the exact return shape is shown after `↳ returns` below — read your field names from there, do NOT guess (a wrong field like `result.actions` throws `Cannot read properties of undefined` and fails the run). The shape is the parsed return value itself, so access fields straight off it (e.g. `const { pieces } = await tools.ap_research_pieces({...})`). For any tool WITHOUT a documented shape, or any per-piece `ap_execute_action` output, treat the shape as unknown — but do NOT just guard-and-swallow it into an empty result (an over-defensive `Array.isArray(x) ? x : []` that silently yields `[]` is the #1 cause of a wrong answer with no error to learn from).',
                '',
                'UNKNOWN SHAPES — list data is usually NESTED, and you get the real shape back: a read like a Gmail/Slack/HubSpot search rarely puts its items at the top level — they sit under a nested key (e.g. `{ found, results: { messages: [...] } }`, so the array is `results.messages`, NOT `results`). After EVERY ap_run_tools run, the response includes a compact "Result shapes" section showing the exact structure (keys + types, no data) of each tool result your code received. So: write your best first attempt, and if the returned summary is empty/zero even though a read clearly returned data, your field PATH is wrong — read the echoed shapes, correct the path, and re-run IN Code Mode. Never respond to an empty result by refetching, falling back to one-by-one calls, or giving up on Code Mode.',
                '',
                'DISCOVER INSIDE THE CODE — one run, not many: do NOT spend separate ap_run_tools turns on "find the action", "get the props", "now execute". A run() can call MANY tools, so chain discovery and work in the SAME block. If unsure of a piece\'s exact actionName or its input keys, call `ap_research_pieces` / `ap_get_piece_props` at the top of the same run(), read the real names off the result, then call `ap_execute_action` and aggregate — all before you return. Guessing a name like `search_email` when it is `gmail_search_mail` wastes a whole turn; discovering it in-code costs zero extra round-trips.',
                '',
                'PICK THE RIGHT ACTION — find/search, not get-by-id, never raw HTTP: to LOOK UP a record by email / name / title (e.g. "is this sender a HubSpot contact?"), use the piece\'s find or search action (e.g. `find-contact`, `search_*`) — NOT an ID-based `get-*` action, which needs an internal record id you do not have and will reject your email. And do NOT fall back to `custom_api_call` or any raw HTTP when a named piece action exists: named actions are structured, authenticated, and time-bounded, whereas a raw `custom_api_call` can HANG with no response and stall the entire run. If your first action guess is rejected, `ap_research_pieces` the piece (its actions carry `aiDescription` + `cardinality` telling you which one searches vs fetches-by-id) and pick the search/find action — never escalate to raw HTTP. Example:',
                'export const run = async (tools) => {',
                '  const { pieces } = await tools.ap_research_pieces({ pieceNames: ["gmail"] })',
                '  const actionName = (pieces[0].actions ?? []).find(a => /search|list/i.test(a.name))?.name',
                '  const res = await tools.ap_execute_action({ pieceName: "gmail", actionName, input: { max_results: 100 } })',
                '  const messages = res?.results?.messages ?? res?.messages ?? (Array.isArray(res) ? res : [])',
                '  const bySender = {}; for (const m of messages) { const s = m.from?.value?.[0]?.address ?? "unknown"; bySender[s] = (bySender[s] ?? 0) + 1 }',
                '  return Object.entries(bySender).sort((a,b) => b[1]-a[1]).slice(0,5).map(([sender,count]) => ({ sender, count }))',
                '}',
                '',
                'Example — count actions for several pieces in ONE call, reading fields off the documented shape (note: pieces[].actions are OBJECTS, so use `.length` and `a.name`, not string assumptions):',
                'export const run = async (tools) => {',
                '  const { pieces } = await tools.ap_research_pieces({ pieceNames: ["gmail", "slack", "linear"] })',
                '  return pieces.map(p => ({ piece: p.name, actionCount: p.actions?.length ?? 0, sample: (p.actions ?? []).slice(0, 3).map(a => a.name) }))',
                '}',
                '',
                'Callable tools (call as tools.<name>({ ... }); `↳ returns` shows the shape your code receives):',
                namespace,
            ].join('\n'),
            inputSchema: z.object({
                code: z.string().describe('An async JS module that exports `run`: `export const run = async (tools, data) => { ... return result }`. Use `await tools.<name>({...})` to call your other tools; return a compact summary.'),
                reason: z.string().optional().describe('One short line on what this orchestration does, for the activity log.'),
            }),
            execute: async (input) => {
                const code = typeof input.code === 'string' ? input.code : ''
                const reason = typeof input.reason === 'string' && input.reason.length > 0 ? input.reason : undefined
                if (code.trim().length === 0) {
                    const text = '❌ `code` is required and must be a non-empty string.'
                    return {
                        content: [{ type: 'text', text }],
                        structuredContent: { kind: 'code-mode', ok: false, code: '', reason, bridgedCallCount: 0, serverSideBytes: 0, returnedBytes: 0, savedBytes: 0, error: text, consoleLines: [], truncated: false, modelText: text },
                    }
                }
                // Resolve the tool map at call time so the bridge sees the fully-assembled set.
                const result = await runCodeMode({ code, tools: getTools(), data: {}, log })
                const structuredContent = buildCodeModeStructuredContent({ code, reason, result })
                // content[].text is the model-agnostic textual result (also used as the toModelOutput
                // fallback); structuredContent is the typed twin the chat UI renders the Code Mode card
                // from. The model still receives only the text — see toModelOutput below.
                return {
                    content: [{ type: 'text', text: structuredContent.modelText }],
                    structuredContent,
                }
            },
            // Keep the model-facing result the plain text string (not the JSON-serialized object that
            // would otherwise be sent), so attaching structuredContent for the UI doesn't leak the
            // code/console/stats into the model's context or change behavior across models.
            toModelOutput: ({ output }) => ({ type: 'text', value: readModelText(output) ?? '' }),
        }),
    }
}

export const chatCodeMode = {
    createCodeModeTools,
    buildToolNamespaceListing,
    runCodeMode,
}

// Structured twin of ap_run_tools' textual result, surfaced as the tool result's `structuredContent`
// so the chat UI's Code Mode card reads typed fields instead of re-parsing the prose. `modelText` is
// the exact string the model receives (via toModelOutput); the rest drives the card.
export type CodeModeStructuredContent = {
    kind: 'code-mode'
    ok: boolean
    code: string
    reason?: string
    bridgedCallCount: number
    serverSideBytes: number
    returnedBytes: number
    savedBytes: number
    resultText?: string
    error?: string
    consoleLines: string[]
    truncated: boolean
    modelText: string
}
