import vm from 'node:vm'
import { ApLogger } from '@activepieces/server-utils'
import { apId, isNil, isObject, tryCatch, tryCatchSync } from '@activepieces/shared'
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
// That is acceptable for this trusted-model demo. For production the SAME `BridgedTools` interface
// should be implemented over an IPC/RPC channel to #13909's isolated engine sandbox: the code runs
// in the sandbox, and `tools.x(args)` round-trips back to the worker where `allTools` lives. The
// bridge is deliberately a narrow async interface (one method: callTool) so that swap is feasible
// without touching the model-facing contract or the namespace generation.

const CODE_MODE_TIMEOUT_MS = 10 * 60 * 1_000
const SYNC_COMPILE_TIMEOUT_MS = 5_000
const MAX_RETURN_BYTES = 64 * 1024
const MAX_CONSOLE_LINES = 200
const MAX_CONSOLE_LINE_CHARS = 2_000
const MAX_BRIDGED_CALLS = 1_000

// ap_run_tools must never call itself (infinite recursion) and the silent UI-control tools add no
// value from inside code — keep the callable surface to the real work tools.
const NON_CALLABLE_TOOL_NAMES = new Set<string>([
    'ap_run_tools',
    'ap_update_thinking_status',
    'ap_set_phase',
    'ap_set_build_plan',
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
}

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

// Compact, model-facing signature for one tool: name(arg1, arg2?) — first line of its description.
// Best-effort schema introspection: zod `.shape` first, then a JSON-schema `properties` fallback,
// then a bare `(input)` so an exotic schema still lists the tool rather than dropping it.
function describeToolSignature({ jsName, tool: toolDef }: { jsName: string, tool: ToolLike }): string {
    const argList = extractArgList(toolDef.inputSchema)
    const summary = firstLine(toolDef.description)
    const signature = `tools.${jsName}({ ${argList} })`
    return summary.length > 0 ? `${signature} — ${summary}` : signature
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
    getStats: () => { bridgedCallCount: number, serverSideBytes: number }
} {
    // jsName → real tool execute. The same in-process tool implementation the model would call
    // directly, so connections, conversation context, and approval GATES are inherited
    // automatically (the real execute() blocks on waitForApproval for gated tools like ap_send_email).
    const byJsName = new Map<string, { realName: string, execute: ToolExecute }>()
    for (const [realName, value] of Object.entries(tools)) {
        if (NON_CALLABLE_TOOL_NAMES.has(realName)) continue
        if (!isToolLike(value) || isNil(value.execute)) continue
        byJsName.set(toJsName(realName), { realName, execute: value.execute })
    }

    let bridgedCallCount = 0
    let serverSideBytes = 0

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
        const result = await Promise.resolve(entry.execute(isNil(args) ? {} : args, options))
        serverSideBytes += byteLengthOf(result)
        log.debug({ tool: { name: entry.realName }, resultBytes: byteLengthOf(result) }, '[chat][code-mode] bridged tool call')
        // Hand the CODE clean, directly-usable data — not the raw MCP content-wrapper. The model's
        // Code Mode scripts naturally do `JSON.parse(result.content[0].text)`, but `content[0].text`
        // is prefixed with a status line (e.g. "✅ Research …\n{json}"), so that parse throws and
        // burns a self-correcting retry. Unwrap to the most useful value here so the script gets a
        // parsed object straight away. (The unwrapped value is still server-side — only the script's
        // final `return` reaches the model.)
        return unwrapToolResult(result)
    }

    return {
        bridge: { callTool, jsNames: [...byJsName.keys()] },
        getStats: () => ({ bridgedCallCount, serverSideBytes }),
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

    const context = vm.createContext(sandbox)
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
    const { bridgedCallCount, serverSideBytes } = getStats()
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

    return { ok, returnValue, error, consoleLines, bridgedCallCount, serverSideBytes, returnedBytes }
}

function buildToolNamespaceListing(tools: ToolSet): string {
    const lines: string[] = []
    for (const [realName, value] of Object.entries(tools)) {
        if (NON_CALLABLE_TOOL_NAMES.has(realName)) continue
        if (!isToolLike(value)) continue
        lines.push(describeToolSignature({ jsName: toJsName(realName), tool: value }))
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

function buildCodeModeResultText({ result }: { result: CodeModeRunResult }): string {
    const consoleNote = result.consoleLines.length > 0
        ? `\n\nConsole output:\n${result.consoleLines.join('\n')}`
        : ''
    if (!result.ok) {
        return `❌ Code Mode failed: ${result.error ?? 'unknown error'}${consoleNote}`
    }
    const { value, truncated } = clampReturnValue(result.returnValue)
    const valueStr = result.returnValue === undefined
        ? '(the code returned nothing)'
        : typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    const stats = `(${result.bridgedCallCount} tool call(s) ran inside the code; ${Math.round(result.serverSideBytes / 1024)}KB of tool output stayed server-side, ${Math.round((truncated ? MAX_RETURN_BYTES : result.returnedBytes) / 1024)}KB returned.)`
    return `✅ Code Mode ran. ${stats}\n\n${valueStr}${consoleNote}`
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
                'Shape: export an async `run`: `export const run = async (tools, data) => { /* ... */ return result }`. Call any tool as `await tools.<name>({ ...args })` — args are the SAME inputs that tool takes normally. Each call RETURNS THE PARSED RESULT DIRECTLY — a plain object (or, for non-JSON tools, a string) you can use right away. Do NOT reach for `.content[0].text` or `JSON.parse` the result; the bridge already unwraps and parses it for you. Each bridged call inherits connections, conversation context, and approval gates (a gated tool like ap_send_email will still pop its confirmation card and block until the user approves). `data`/`inputs` holds any offloaded results passed in. Return a COMPACT summary, not raw data. `fetch`, `require`, `process`, and file/network access are disabled — reach external systems only through bridged tools.',
                '',
                'Example — score every open deal and return just the summary, without paging each batch through your context:',
                'export const run = async (tools) => {',
                '  const res = await tools.ap_execute_action({ pieceName: "@activepieces/piece-hubspot", actionName: "list_deals", input: { limit: 100 } })',
                '  const deals = res.results',
                '  const stalled = deals.filter(d => d.daysSinceActivity > 30)',
                '  return { total: deals.length, stalled: stalled.length, topStalled: stalled.slice(0, 5).map(d => d.name) }',
                '}',
                '',
                'Callable tools (call as tools.<name>({ ... })):',
                namespace,
            ].join('\n'),
            inputSchema: z.object({
                code: z.string().describe('An async JS module that exports `run`: `export const run = async (tools, data) => { ... return result }`. Use `await tools.<name>({...})` to call your other tools; return a compact summary.'),
                reason: z.string().optional().describe('One short line on what this orchestration does, for the activity log.'),
            }),
            execute: async (input) => {
                const code = typeof input.code === 'string' ? input.code : ''
                if (code.trim().length === 0) {
                    return { content: [{ type: 'text', text: '❌ `code` is required and must be a non-empty string.' }] }
                }
                // Resolve the tool map at call time so the bridge sees the fully-assembled set.
                const result = await runCodeMode({ code, tools: getTools(), data: {}, log })
                return { content: [{ type: 'text', text: buildCodeModeResultText({ result }) }] }
            },
        }),
    }
}

export const chatCodeMode = {
    createCodeModeTools,
    buildToolNamespaceListing,
    runCodeMode,
}
