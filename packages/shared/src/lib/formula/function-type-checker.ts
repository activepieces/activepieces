import { AP_FUNCTIONS } from './function-registry'
import type { ApFunctionArgType } from './function-registry'

type DocNode = {
    type?: string
    attrs?: Record<string, unknown>
    content?: DocNode[]
    text?: string
}

export function typeCheckTiptapDoc(doc: DocNode): Map<string, string> {
    const errors = new Map<string, string>()
    const flat = flattenParagraphNodes(doc)

    // Collect IDs of functions that have a matching closing node.
    // Unclosed functions are already highlighted by applyUnclosedErrors in the
    // editor — skip them here to avoid confusing "missing value" messages while
    // the user is still typing.
    const closedIds = new Set<string>()
    for (const node of flat) {
        if (node.type === 'function_end') {
            const openId = node.attrs?.['openId'] as string | undefined
            if (openId) closedIds.add(openId)
        }
    }

    for (const node of flat) {
        if (node.type !== 'function_start') continue

        const id = node.attrs?.['id'] as string | undefined
        const fnName = node.attrs?.['functionName'] as string | undefined
        if (!id || !fnName) continue
        if (!closedIds.has(id)) continue

        const fn = AP_FUNCTIONS.find((f) => f.name === fnName)
        if (!fn) continue

        const between = getNodesBetween(flat, id)
        const argCount = countArgs(between)

        if (fn.maxArgs !== -1 && argCount > fn.maxArgs) {
            errors.set(
                id,
                `${fnName}() accepts at most ${fn.maxArgs} value${fn.maxArgs === 1 ? '' : 's'}, but got ${argCount}`,
            )
            continue
        }

        if (argCount < fn.minArgs) {
            errors.set(
                id,
                `${fnName}() needs at least ${fn.minArgs} value${fn.minArgs === 1 ? '' : 's'}, but got ${argCount}`,
            )
            continue
        }

        const argSlots = splitIntoArgs(between)
        for (let i = 0; i < argSlots.length; i++) {
            const expectedSpec = fn.argTypes[Math.min(i, fn.argTypes.length - 1)]
            if (!expectedSpec) continue
            // Union types (array) mean multiple types are valid — skip strict type check
            if (Array.isArray(expectedSpec)) continue
            // Can't infer list type from plain text (user likely passes a variable) — skip
            if (expectedSpec === 'list') continue

            const actualType = inferArgType(argSlots[i])
            if (!actualType) continue

            if (actualType !== expectedSpec) {
                errors.set(
                    id,
                    `Value ${i + 1} of ${fnName}() should be a ${expectedSpec}, but got a ${actualType}`,
                )
                break
            }
        }
    }

    return errors
}

function flattenParagraphNodes(doc: DocNode): DocNode[] {
    const result: DocNode[] = []
    for (const para of doc.content ?? []) {
        for (const node of para.content ?? []) {
            result.push(node)
        }
    }
    return result
}

function getNodesBetween(flat: DocNode[], startId: string): DocNode[] {
    const startIdx = flat.findIndex(
        (n) => n.type === 'function_start' && n.attrs?.['id'] === startId,
    )
    if (startIdx === -1) return []

    const result: DocNode[] = []
    let depth = 0

    for (let i = startIdx + 1; i < flat.length; i++) {
        const node = flat[i]
        if (node.type === 'function_start') {
            depth++
            result.push(node)
        }
        else if (node.type === 'function_end') {
            if (depth === 0) break
            depth--
            result.push(node)
        }
        else {
            result.push(node)
        }
    }

    return result
}

function countArgs(nodes: DocNode[]): number {
    let depth = 0
    let separators = 0
    let hasContent = false

    for (const node of nodes) {
        if (node.type === 'function_start') {
            depth++
            hasContent = true
        }
        else if (node.type === 'function_end') {
            depth--
        }
        else if (node.type === 'function_sep' && depth === 0) {
            separators++
        }
        else if (node.type === 'mention') {
            hasContent = true
        }
        else if (node.type === 'text' && depth === 0) {
            const text = node.text ?? ''
            const stripped = text.trim()
            if (stripped) hasContent = true
        }
    }

    if (!hasContent && separators === 0) return 0
    return separators + 1
}

function splitIntoArgs(nodes: DocNode[]): DocNode[][] {
    const args: DocNode[][] = [[]]
    let depth = 0

    for (const node of nodes) {
        if (node.type === 'function_start') {
            depth++
            args[args.length - 1].push(node)
        }
        else if (node.type === 'function_end') {
            depth--
            args[args.length - 1].push(node)
        }
        else if (node.type === 'function_sep' && depth === 0) {
            args.push([])
        }
        else {
            args[args.length - 1].push(node)
        }
    }

    return args
}

function inferArgType(argNodes: DocNode[]): ApFunctionArgType | null {
    let depth = 0
    let topLevelFnName: string | null = null
    let topLevelCount = 0
    let hasFunctionOrMention = false

    for (const node of argNodes) {
        if (node.type === 'function_start') {
            if (depth === 0) {
                topLevelFnName = node.attrs?.['functionName'] as string
                topLevelCount++
            }
            depth++
            hasFunctionOrMention = true
        }
        else if (node.type === 'function_end') {
            depth--
        }
        else if (node.type === 'mention') {
            hasFunctionOrMention = true
        }
    }

    if (topLevelCount === 1 && topLevelFnName) {
        const fn = AP_FUNCTIONS.find((f) => f.name === topLevelFnName)
        const rt = fn?.returnType
        if (!rt || Array.isArray(rt)) return null
        return rt
    }

    if (!hasFunctionOrMention) {
        // Strip zero-width spaces — the editor inserts them as cursor anchors
        // between function brackets, but `String.trim()` does not remove them
        // (ZWS isn't ECMA whitespace), so a literal `3` in an arg slot reads
        // as `​3` here and gets misclassified as a string.
        const text = argNodes
            .filter((n) => n.type === 'text')
            .map((n) => n.text ?? '')
            .join('')
            .replaceAll('​', '')
            .trim()

        if (!text) return null
        if (text === 'true' || text === 'false') return 'boolean'
        if (!Number.isNaN(Number(text))) return 'number'
        return 'string'
    }

    return null
}

