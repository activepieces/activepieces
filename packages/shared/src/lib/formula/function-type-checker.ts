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

    for (const node of flat) {
        if (node.type !== 'function_start') continue

        const id = node.attrs?.['id'] as string | undefined
        const fnName = node.attrs?.['functionName'] as string | undefined
        if (!id || !fnName) continue

        const fn = AP_FUNCTIONS.find((f) => f.name === fnName)
        if (!fn) continue

        const between = getNodesBetween(flat, id)
        const argCount = countArgs(between)

        if (fn.maxArgs !== -1 && argCount > fn.maxArgs) {
            errors.set(
                id,
                `${fnName}() takes at most ${fn.maxArgs} argument${fn.maxArgs === 1 ? '' : 's'} (${argCount} given)`,
            )
            continue
        }

        if (argCount < fn.minArgs) {
            errors.set(
                id,
                `${fnName}() needs at least ${fn.minArgs} argument${fn.minArgs === 1 ? '' : 's'} (${argCount} given)`,
            )
            continue
        }

        const argSlots = splitIntoArgs(between)
        for (let i = 0; i < argSlots.length; i++) {
            const expectedType = fn.argTypes[Math.min(i, fn.argTypes.length - 1)]
            if (!expectedType || expectedType === 'any') continue

            const actualType = inferArgType(argSlots[i])
            if (!actualType || actualType === 'any') continue

            if (actualType !== expectedType) {
                errors.set(
                    id,
                    `${ordinal(i + 1)} argument of ${fnName}() expects ${expectedType}, got ${actualType}`,
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
        else if (node.type === 'mention') {
            hasContent = true
        }
        else if (node.type === 'text' && depth === 0) {
            const text = node.text ?? ''
            const stripped = text.replace(/, /g, '').trim()
            if (stripped) hasContent = true
            const m = text.match(/, /g)
            separators += m ? m.length : 0
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
        else if (node.type === 'text' && depth === 0 && node.text) {
            const parts = node.text.split(', ')
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) args.push([])
                if (parts[i]) args[args.length - 1].push({ type: 'text', text: parts[i] })
            }
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
        return fn?.returnType ?? null
    }

    if (!hasFunctionOrMention) {
        const text = argNodes
            .filter((n) => n.type === 'text')
            .map((n) => n.text ?? '')
            .join('')
            .trim()

        if (!text) return null
        if (text === 'true' || text === 'false') return 'boolean'
        if (text !== '' && !Number.isNaN(Number(text))) return 'number'
        return 'string'
    }

    return null
}

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
