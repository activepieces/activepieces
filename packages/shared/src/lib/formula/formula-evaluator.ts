import { parser } from './function-implementations'
import { AP_FUNCTIONS } from './function-registry'

const FORMULA_PREFIX = 'ap-formula-v1::{'
const FORMULA_SUFFIX = '}'

function wrap(expression: string): string {
    return `${FORMULA_PREFIX}${expression}${FORMULA_SUFFIX}`
}

function containsWrapper(input: string): boolean {
    return input.includes(FORMULA_PREFIX)
}

function unwrap(template: string): string {
    let result = ''
    let pos = 0
    while (pos < template.length) {
        const start = template.indexOf(FORMULA_PREFIX, pos)
        if (start === -1) {
            result += template.slice(pos)
            break
        }
        result += template.slice(pos, start)
        const exprStart = start + FORMULA_PREFIX.length
        const closeBrace = findMatchingBrace(template, exprStart - 1)
        if (closeBrace === -1) {
            result += template.slice(start)
            break
        }
        result += template.slice(exprStart, closeBrace)
        pos = closeBrace + 1
    }
    return result
}

function evaluate({ expression, sampleData }: EvaluateExpressionParams): EvaluateExpressionResult {
    const trimmed = expression.trim()
    if (!trimmed) return { result: '', error: null }

    const segments = tokenizeFormulaTemplate(trimmed)
    if (segments.length === 0) return { result: '', error: null }

    if (segments.length === 1 && segments[0].type === 'formula') {
        return evaluateSingleFormula({ expression: segments[0].value, sampleData })
    }

    const parts: string[] = []
    for (const seg of segments) {
        if (seg.type === 'text') {
            parts.push(resolveTextVars(seg.value, sampleData))
            continue
        }
        const { result, error } = evaluateSingleFormula({ expression: seg.value, sampleData })
        if (error) return { result: null, error }
        parts.push(result != null ? (typeof result === 'object' ? JSON.stringify(result) : String(result)) : '')
    }
    return { result: parts.join(''), error: null }
}

function tokenizeFormulaTemplate(template: string): Segment[] {
    const segments: Segment[] = []
    let pos = 0
    while (pos < template.length) {
        const start = template.indexOf(FORMULA_PREFIX, pos)
        if (start === -1) {
            const tail = template.slice(pos)
            if (tail) segments.push({ type: 'text', value: tail })
            break
        }
        if (start > pos) {
            segments.push({ type: 'text', value: template.slice(pos, start) })
        }
        const exprStart = start + FORMULA_PREFIX.length
        const wrapperOpenBrace = exprStart - 1
        const wrapperCloseBrace = findMatchingBrace(template, wrapperOpenBrace)
        if (wrapperCloseBrace === -1) {
            // Unclosed wrapper — emit the rest as text rather than guessing where it ends.
            segments.push({ type: 'text', value: template.slice(start) })
            break
        }
        segments.push({ type: 'formula', value: template.slice(exprStart, wrapperCloseBrace) })
        pos = wrapperCloseBrace + 1
    }
    return segments.filter((s) => s.value !== '')
}

function evaluateSingleFormula({ expression, sampleData }: EvaluateExpressionParams): EvaluateExpressionResult {
    const trimmed = expression.trim()
    if (!trimmed) return { result: '', error: null }
    const emptyArgError = validateFunctionArgs(trimmed)
    if (emptyArgError) return { result: null, error: emptyArgError }

    const { processed, vars } = preprocessExpression({ expression: trimmed, sampleData })
    try {
        // expr-eval's published `Values` type is narrower than what the library
        // accepts at runtime — arrays, null, and mixed-type objects all flow
        // through fine. Ignore the library-type mismatch here rather than
        // forcing a misleading cast like `as Record<string, number>`.
        // @ts-expect-error narrow third-party type; runtime accepts unknown values
        const result = parser.evaluate(processed, vars)
        return { result, error: null }
    }
    catch (e) {
        return { result: null, error: friendlyError(e) }
    }
}

function preprocessExpression({ expression, sampleData }: EvaluateExpressionParams): { processed: string, vars: Record<string, unknown> } {
    const vars: Record<string, unknown> = {}
    let idx = 0
    const withVars = expression.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
        const key = `__ap_v${idx++}__`
        const resolved = resolveVariable(path.trim(), sampleData)
        vars[key] = resolved === undefined ? null : resolved
        return key
    })
    const withJsonVars = replaceInlineJsonArrays(withVars, vars, { value: idx })
    return { processed: normalizeExpression(rewriteLazyIf(wrapStringArgs(withJsonVars))), vars }
}

function rewriteLazyIf(expr: string): string {
    const ifOnly = new Set(['if'])
    let result = ''
    let pos = 0
    while (pos < expr.length) {
        const next = findNextFunctionCall(expr, pos, ifOnly)
        if (next === null) {
            result += expr.slice(pos)
            break
        }
        result += expr.slice(pos, next.start)
        const closePos = findMatchingParen(expr, next.openParen)
        if (closePos === -1) {
            result += expr.slice(next.start)
            break
        }
        const argsContent = expr.slice(next.openParen + 1, closePos)
        const args = splitArgsBySemicolon(argsContent).map((a) => rewriteLazyIf(a))
        if (args.length === 3) {
            result += `((${args[0]}) ? (${args[1]}) : (${args[2]}))`
        }
        else {
            result += 'if(' + args.join(';') + ')'
        }
        pos = closePos + 1
    }
    return result
}

function replaceInlineJsonArrays(
    expr: string,
    vars: Record<string, unknown>,
    idxRef: { value: number },
): string {
    let result = ''
    let i = 0
    let inString: '"' | '\'' | null = null

    while (i < expr.length) {
        const ch = expr[i]

        if (inString) {
            if (ch === inString && expr[i - 1] !== '\\') inString = null
            result += ch
            i++
            continue
        }

        if (ch === '"' || ch === '\'') {
            inString = ch
            result += ch
            i++
            continue
        }

        if (ch === '[') {
            let j = i + 1
            while (j < expr.length && (expr[j] === ' ' || expr[j] === '\t')) j++
            if (j < expr.length && expr[j] === '{') {
                const end = findMatchingSquareBracket(expr, i)
                if (end !== -1) {
                    const jsonStr = expr.slice(i, end + 1)
                    try {
                        const parsed = JSON.parse(jsonStr) as unknown
                        if (Array.isArray(parsed)) {
                            const key = `__ap_v${idxRef.value++}__`
                            vars[key] = parsed
                            result += key
                            i = end + 1
                            continue
                        }
                    }
                    catch {
                        // not valid JSON — fall through and include as-is
                    }
                }
            }
        }

        result += ch
        i++
    }

    return result
}

function wrapStringArgs(expr: string): string {
    const fnNames = new Set(AP_FUNCTIONS.map((f) => f.name))
    let result = ''
    let pos = 0

    while (pos < expr.length) {
        const next = findNextFunctionCall(expr, pos, fnNames)

        if (next === null) {
            result += expr.slice(pos)
            break
        }

        result += expr.slice(pos, next.start)

        const fnName = expr.slice(next.start, next.openParen).trim()
        const fn = AP_FUNCTIONS.find((f) => f.name === fnName)
        const closePos = findMatchingParen(expr, next.openParen)

        if (closePos === -1) {
            result += expr.slice(next.start)
            break
        }

        const argsContent = expr.slice(next.openParen + 1, closePos)
        const argParts = splitArgsBySemicolon(argsContent)

        const processedArgs = argParts.map((arg, i) => {
            const inner = wrapStringArgs(arg)
            if (!fn) return inner
            const expectedSpec = fn.argTypes[Math.min(i, fn.argTypes.length - 1)]
            const shouldQuote = expectedSpec === 'string' ||
                (Array.isArray(expectedSpec) && (expectedSpec as string[]).includes('string'))
            return shouldQuote ? quoteIfBare(inner) : inner
        })

        result += fnName + '(' + processedArgs.join(';') + ')'
        pos = closePos + 1
    }

    return result
}

function quoteIfBare(arg: string): string {
    const trimmed = arg.trim()
    if (!trimmed) return arg
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('\'') && trimmed.endsWith('\''))) return arg
    if (trimmed.startsWith('__ap_')) return arg
    const fnCallMatch = trimmed.match(/^([a-z_][a-z0-9_]*)\s*\(/i)
    if (fnCallMatch && AP_FUNCTIONS.some((f) => f.name === fnCallMatch[1])) return arg
    return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

function normalizeExpression(expr: string): string {
    let result = ''
    let inString: '"' | '\'' | null = null
    let i = 0

    while (i < expr.length) {
        const ch = expr[i]

        if (inString) {
            if (ch === inString && (i === 0 || expr[i - 1] !== '\\')) inString = null
            result += ch
            i++
            continue
        }

        if (ch === '"' || ch === '\'') {
            inString = ch
            result += ch
            i++
            continue
        }

        if (ch === ';') {
            result += ','
            i++
            continue
        }

        // Rewrite reserved keyword function calls to aliased names.
        // Only rewrite when the keyword is not preceded by a word character
        // (avoids matching e.g. "understand(" or "anderson(").
        const prevIsWord = i > 0 && /[a-zA-Z0-9_]/.test(expr[i - 1])
        if (!prevIsWord) {
            const rest = expr.slice(i)
            if (rest.startsWith('and('))   {
                result += 'ap_and(';   i += 4; continue
            }
            if (rest.startsWith('or('))    {
                result += 'ap_or(';    i += 3; continue
            }
            if (rest.startsWith('not('))   {
                result += 'ap_not(';   i += 4; continue
            }
            if (rest.startsWith('round(')) {
                result += 'ap_round('; i += 6; continue
            }
        }

        result += ch
        i++
    }

    return result
}

function validateFunctionArgs(expr: string): string | null {
    const fnNames = new Set(AP_FUNCTIONS.map((f) => f.name))
    let pos = 0
    while (pos < expr.length) {
        const next = findNextFunctionCall(expr, pos, fnNames)
        if (!next) break
        const closePos = findMatchingParen(expr, next.openParen)
        // Advance inside the paren so nested calls are also validated
        pos = next.openParen + 1
        if (closePos === -1) continue

        const fnName = expr.slice(next.start, next.openParen).trim()
        const argsContent = expr.slice(next.openParen + 1, closePos)
        const argParts = splitArgsBySemicolon(argsContent)

        // Only flag empties when separators are present — zero-arg calls are fine
        if (argParts.length > 1) {
            for (let i = 0; i < argParts.length; i++) {
                if (!argParts[i].trim()) {
                    return `${fnName}() is missing value ${i + 1} — fill in all values`
                }
            }
        }
    }
    return null
}

function friendlyError(e: unknown): string {
    const msg = String((e as Error).message ?? e)
    if (/division by zero/i.test(msg)) {
        return 'Cannot divide by zero'
    }
    if (/parse error|Expected EOF|unexpected token|value expected|unexpected \)/i.test(msg)) {
        return 'Invalid formula — check for empty values or mismatched parentheses'
    }
    if (/is not defined/i.test(msg)) {
        const m = msg.match(/(\w+) is not defined/)
        return m
            ? `"${m[1]}" is not a known function or variable — check for typos`
            : 'Unknown function or variable — check for typos'
    }
    if (/wrong number of arguments/i.test(msg)) {
        return 'Wrong number of values — check the function reference for the expected inputs'
    }
    if (/not a function/i.test(msg)) {
        return 'That value is not callable as a function'
    }
    return 'Could not evaluate this formula — check all values are filled in correctly'
}

function resolveTextVars(text: string, sampleData: Record<string, unknown>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
        const resolved = resolveVariable(path.trim(), sampleData)
        return resolved != null ? String(resolved) : ''
    })
}

function resolveVariable(path: string, sampleData: Record<string, unknown>): unknown {
    const parts = path.split('.')
    let value: unknown = sampleData
    for (const part of parts) {
        if (value == null || typeof value !== 'object') return undefined
        value = (value as Record<string, unknown>)[part]
    }
    return value
}

function splitArgsBySemicolon(content: string): string[] {
    const args: string[] = []
    let current = ''
    let depth = 0
    let inString: '"' | '\'' | null = null

    for (let i = 0; i < content.length; i++) {
        const ch = content[i]
        if (inString) {
            if (ch === inString && content[i - 1] !== '\\') inString = null
            current += ch
        }
        else if (ch === '"' || ch === '\'') {
            inString = ch; current += ch
        }
        else if (ch === '(') {
            depth++; current += ch
        }
        else if (ch === ')') {
            depth--; current += ch
        }
        else if (ch === ';' && depth === 0) {
            args.push(current); current = ''
        }
        else {
            current += ch
        }
    }
    args.push(current)
    return args
}

function findNextFunctionCall(
    text: string,
    fromPos: number,
    fnNames: Set<string>,
): { start: number, openParen: number } | null {
    for (let i = fromPos; i < text.length; i++) {
        if (!/[a-z_]/i.test(text[i])) continue
        const wordMatch = text.slice(i).match(/^([a-z_][a-z0-9_]*)\s*\(/i)
        if (wordMatch && fnNames.has(wordMatch[1])) {
            const openParen = i + wordMatch[0].length - 1
            return { start: i, openParen }
        }
    }
    return null
}

function findMatchingParen(text: string, openPos: number): number {
    let depth = 0
    let inString: '"' | '\'' | null = null
    for (let i = openPos; i < text.length; i++) {
        const ch = text[i]
        if (inString) {
            if (ch === inString && (i === 0 || text[i - 1] !== '\\')) inString = null
        }
        else if (ch === '"' || ch === '\'') {
            inString = ch
        }
        else if (ch === '(') {
            depth++
        }
        else if (ch === ')') {
            depth--
            if (depth === 0) return i
        }
    }
    return -1
}

function findMatchingSquareBracket(text: string, openPos: number): number {
    let depth = 0
    let inStr: '"' | '\'' | null = null
    for (let i = openPos; i < text.length; i++) {
        const ch = text[i]
        if (inStr) {
            if (ch === inStr && (i === 0 || text[i - 1] !== '\\')) inStr = null
        }
        else if (ch === '"' || ch === '\'') {
            inStr = ch
        }
        else if (ch === '[') {
            depth++
        }
        else if (ch === ']') {
            depth--
            if (depth === 0) return i
        }
    }
    return -1
}

function findMatchingBrace(text: string, openPos: number): number {
    let depth = 0
    let inString: '"' | '\'' | null = null
    for (let i = openPos; i < text.length; i++) {
        const ch = text[i]
        if (inString) {
            if (ch === inString && (i === 0 || text[i - 1] !== '\\')) inString = null
        }
        else if (ch === '"' || ch === '\'') {
            inString = ch
        }
        else if (ch === '{') {
            depth++
        }
        else if (ch === '}') {
            depth--
            if (depth === 0) return i
        }
    }
    return -1
}

export const formulaEvaluator = {
    evaluate,
    wrap,
    unwrap,
    containsWrapper,
    PREFIX: FORMULA_PREFIX,
    SUFFIX: FORMULA_SUFFIX,
}

export type EvaluateExpressionParams = {
    expression: string
    sampleData: Record<string, unknown>
}

export type EvaluateExpressionResult = {
    result: unknown
    error: string | null
}

type Segment = { type: 'text' | 'formula', value: string }
