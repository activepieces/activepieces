import dayjs from 'dayjs'
import relativeTimeDayjs from 'dayjs/plugin/relativeTime'
import timezoneDayjs from 'dayjs/plugin/timezone'
import utcDayjs from 'dayjs/plugin/utc'
import { Parser } from 'expr-eval'

import { AP_FUNCTIONS } from './function-registry'

dayjs.extend(relativeTimeDayjs)
dayjs.extend(timezoneDayjs)
dayjs.extend(utcDayjs)

const parser = new Parser()

parser.functions.combine = (a: unknown, b: unknown, sep: unknown = '') =>
    `${a ?? ''}${String(sep)}${b ?? ''}`
parser.functions.uppercase = (s: unknown) => String(s ?? '').toUpperCase()
parser.functions.lowercase = (s: unknown) => String(s ?? '').toLowerCase()
parser.functions.titlecase = (s: unknown) =>
    String(s ?? '').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
parser.functions.trim = (s: unknown) => String(s ?? '').trim()
parser.functions.prefix = (s: unknown, pfx: unknown) => `${String(pfx ?? '')}${String(s ?? '')}`
parser.functions.suffix = (s: unknown, sfx: unknown) => `${String(s ?? '')}${String(sfx ?? '')}`
parser.functions.replace = (s: unknown, from: unknown, to: unknown) =>
    String(s ?? '').split(String(from ?? '')).join(String(to ?? ''))
parser.functions.remove = (s: unknown, sub: unknown) =>
    String(s ?? '').split(String(sub ?? '')).join('')
parser.functions.first_n = (s: unknown, n: unknown) =>
    String(s ?? '').slice(0, Number(n))
parser.functions.last_n = (s: unknown, n: unknown) => {
    const str = String(s ?? '')
    const num = Number(n)
    return str.slice(Math.max(0, str.length - num))
}
parser.functions.truncate = (s: unknown, n: unknown) => {
    const str = String(s ?? '')
    const num = Number(n)
    return str.length > num ? str.slice(0, num) + '...' : str
}
parser.functions.split = (s: unknown, sep: unknown, idx: unknown) => {
    const parts = String(s ?? '').split(String(sep ?? ''))
    return parts[Number(idx)] ?? ''
}
parser.functions.extract_between = (s: unknown, start: unknown, end: unknown) => {
    const str = String(s ?? '')
    const startStr = String(start ?? '')
    const endStr = String(end ?? '')
    const si = str.indexOf(startStr)
    if (si === -1) return ''
    const ei = str.indexOf(endStr, si + startStr.length)
    if (ei === -1) return ''
    return str.slice(si + startStr.length, ei)
}
parser.functions.extract_email = (s: unknown) => {
    const match = String(s ?? '').match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
    return match ? match[0] : ''
}
parser.functions.extract_url = (s: unknown) => {
    const match = String(s ?? '').match(/https?:\/\/[^\s]+/)
    return match ? match[0] : ''
}
parser.functions.length = (s: unknown) => String(s ?? '').length
parser.functions.contains = (s: unknown, sub: unknown) =>
    String(s ?? '').includes(String(sub ?? ''))
parser.functions.starts_with = (s: unknown, prefix: unknown) =>
    String(s ?? '').startsWith(String(prefix ?? ''))
parser.functions.ends_with = (s: unknown, suffix: unknown) =>
    String(s ?? '').endsWith(String(suffix ?? ''))
parser.functions.remove_spaces = (s: unknown) =>
    String(s ?? '').replace(/\s+/g, ' ').trim()
parser.functions.word_count = (s: unknown) =>
    String(s ?? '').trim().split(/\s+/).filter(Boolean).length

parser.functions.add = (a: unknown, b: unknown) => Number(a) + Number(b)
parser.functions.subtract = (a: unknown, b: unknown) => Number(a) - Number(b)
parser.functions.multiply = (a: unknown, b: unknown) => Number(a) * Number(b)
parser.functions.divide = (a: unknown, b: unknown) => {
    const divisor = Number(b)
    if (divisor === 0) throw new Error('Division by zero')
    return Number(a) / divisor
}
// expr-eval has a built-in 1-arg `round` that shadows our 2-arg version,
// so we alias to ap_round and rewrite in normalizeExpression
parser.functions.ap_round = (n: unknown, decimals: unknown = 0) =>
    Number(Number(n).toFixed(Number(decimals)))
parser.functions.round_up = (n: unknown) => Math.ceil(Number(n))
parser.functions.round_down = (n: unknown) => Math.floor(Number(n))
parser.functions.absolute = (n: unknown) => Math.abs(Number(n))
parser.functions.percentage = (n: unknown, total: unknown) => {
    const divisor = Number(total)
    if (divisor === 0) throw new Error('Division by zero')
    return (Number(n) / divisor) * 100
}
parser.functions.format_number = (n: unknown, decimals: unknown = 0) => {
    const d = Number(decimals)
    return Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    })
}
parser.functions.format_currency = (n: unknown, symbol: unknown = '$') =>
    `${String(symbol)}${Number(n).toFixed(2)}`
parser.functions.cents_to_dollars = (n: unknown) =>
    `$${(Number(n) / 100).toFixed(2)}`
parser.functions.min = (a: unknown, b: unknown) => Math.min(Number(a), Number(b))
parser.functions.max = (a: unknown, b: unknown) => Math.max(Number(a), Number(b))
parser.functions.to_number = (s: unknown) => Number(s)

parser.functions.format_date = (d: unknown, pattern: unknown = 'YYYY-MM-DD') => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.format(String(pattern)) : ''
}
parser.functions.format_date_long = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    if (!parsed.isValid()) return ''
    return parsed.toDate().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
}
parser.functions.format_time = (d: unknown, pattern: unknown = 'HH:mm') => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.format(String(pattern)) : ''
}
parser.functions.relative_time = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.fromNow() : ''
}
parser.functions.add_days = (d: unknown, n: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.add(Number(n), 'day').toISOString() : ''
}
parser.functions.subtract_days = (d: unknown, n: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.subtract(Number(n), 'day').toISOString() : ''
}
parser.functions.add_hours = (d: unknown, n: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.add(Number(n), 'hour').toISOString() : ''
}
parser.functions.days_between = (a: unknown, b: unknown) => {
    const da = dayjs(String(a ?? ''))
    const db = dayjs(String(b ?? ''))
    if (!da.isValid() || !db.isValid()) return ''
    return Math.round(Math.abs(db.diff(da, 'day', true)))
}
parser.functions.get_day = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.date() : ''
}
parser.functions.get_month = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.toDate().toLocaleDateString('en-US', { month: 'long' }) : ''
}
parser.functions.get_year = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.year() : ''
}
parser.functions.get_day_of_week = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.toDate().toLocaleDateString('en-US', { weekday: 'long' }) : ''
}
parser.functions.start_of_month = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.startOf('month').toISOString() : ''
}
parser.functions.end_of_month = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.endOf('month').toISOString() : ''
}
parser.functions.convert_timezone = (d: unknown, tz: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    if (!parsed.isValid()) return ''
    return parsed.tz(String(tz ?? 'UTC')).format()
}
parser.functions.now = () => new Date().toISOString()
parser.functions.today = () => dayjs().format('YYYY-MM-DD')
parser.functions.to_date = (d: unknown) => {
    const parsed = dayjs(String(d ?? ''))
    return parsed.isValid() ? parsed.toISOString() : ''
}

parser.functions.filter_list = (list: unknown, field: unknown, value: unknown) =>
    toArray(list).filter(
        (item) =>
            typeof item === 'object' &&
            item !== null &&
            (item as Record<string, unknown>)[String(field)] == value,
    )
parser.functions.sort_list = (list: unknown, field: unknown, order: unknown = 'asc') => {
    const arr = [...toArray(list)]
    const fieldName = String(field)
    const ord = String(order)
    return arr.sort((a, b) => {
        const av = readField(a, fieldName)
        const bv = readField(b, fieldName)
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return ord === 'desc' ? -cmp : cmp
    })
}
parser.functions.pluck = (list: unknown, field: unknown) =>
    toArray(list).map((item) =>
        typeof item === 'object' && item !== null
            ? (item as Record<string, unknown>)[String(field)]
            : undefined,
    )
parser.functions.join_list = (list: unknown, sep: unknown = ',') =>
    toArray(list).join(String(sep))
parser.functions.first_item = (list: unknown) => toArray(list)[0]
parser.functions.last_item = (list: unknown) => {
    const arr = toArray(list)
    return arr[arr.length - 1]
}
parser.functions.item_at = (list: unknown, idx: unknown) =>
    toArray(list)[Number(idx)]
parser.functions.count = (list: unknown) => toArray(list).length
parser.functions.sum = (list: unknown, field: unknown) => {
    return toArray(list).reduce((acc: number, item) => {
        const v =
            typeof item === 'object' && item !== null
                ? Number((item as Record<string, unknown>)[String(field)])
                : 0
        return acc + (isNaN(v) ? 0 : v)
    }, 0)
}
parser.functions.average = (list: unknown, field: unknown) => {
    const arr = toArray(list)
    if (!arr.length) return 0
    const total = arr.reduce((acc: number, item) => {
        const v =
            typeof item === 'object' && item !== null
                ? Number((item as Record<string, unknown>)[String(field)])
                : 0
        return acc + (isNaN(v) ? 0 : v)
    }, 0)
    return total / arr.length
}
parser.functions.max_in_list = (list: unknown, field: unknown) => {
    const nums = toNumericFieldValues(list, field)
    return nums.length === 0 ? null : Math.max(...nums)
}
parser.functions.min_in_list = (list: unknown, field: unknown) => {
    const nums = toNumericFieldValues(list, field)
    return nums.length === 0 ? null : Math.min(...nums)
}
parser.functions.deduplicate = (list: unknown, field: unknown) => {
    const seen = new Set<unknown>()
    return toArray(list).filter((item) => {
        const key =
            typeof item === 'object' && item !== null
                ? (item as Record<string, unknown>)[String(field)]
                : item
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}
parser.functions.flatten = (list: unknown) => toArray(list).flat()
parser.functions.split_text_to_list = (s: unknown, sep: unknown = ',') =>
    String(s ?? '').split(String(sep)).map((x) => x.trim())

// `if` intentionally NOT registered as a JS function. Eager arg evaluation
// would break short-circuit semantics (e.g. `if(is_empty(x); "safe"; divide(x; 0))`
// would throw when x is empty). `rewriteLazyIf` transforms `if(c; a; b)` into
// expr-eval's lazy ternary `((c) ? (a) : (b))` before evaluation.
parser.functions.if_empty = (val: unknown, fallback: unknown) =>
    val === '' || val == null || val === 'undefined' ? fallback : val
parser.functions.if_null = (val: unknown, fallback: unknown) =>
    val == null || val === 'undefined' ? fallback : val
parser.functions.switch = (...args: unknown[]) => {
    const [val, ...pairs] = args
    for (let i = 0; i + 1 < pairs.length; i += 2) {
        if (pairs[i] == val) return pairs[i + 1]
    }
    return pairs.length % 2 === 1 ? pairs[pairs.length - 1] : ''
}
parser.functions.is_empty = (val: unknown) => val === '' || val == null
parser.functions.is_not_empty = (val: unknown) => val !== '' && val != null
parser.functions.is_equal = (a: unknown, b: unknown) => a == b
// and/or/not are reserved operators in expr-eval — register under prefixed names
// and normalizeExpression() rewrites them in the expression before evaluation
parser.functions.ap_and = (a: unknown, b: unknown) => Boolean(a) && Boolean(b)
parser.functions.ap_or = (a: unknown, b: unknown) => Boolean(a) || Boolean(b)
parser.functions.ap_not = (a: unknown) => !a
parser.functions.coalesce = (...args: unknown[]) =>
    args.find((a) => a !== '' && a != null) ?? ''

export function evaluateExpression({ expression, sampleData }: EvaluateExpressionParams): EvaluateExpressionResult {
    const trimmed = expression.trim()
    if (!trimmed) return { result: '', error: null }

    const segments = tokenizeFormulaTemplate(trimmed)

    if (segments.length === 1 && segments[0].type === 'formula') {
        return evaluateSingleFormula({ expression: segments[0].value, sampleData })
    }

    const parts: string[] = []
    for (const seg of segments) {
        if (seg.type === 'text') {
            parts.push(resolveTextVars(seg.value, sampleData))
        }
        else {
            const { result, error } = evaluateSingleFormula({ expression: seg.value, sampleData })
            if (error) return { result: null, error }
            parts.push(result != null ? (typeof result === 'object' ? JSON.stringify(result) : String(result)) : '')
        }
    }
    return { result: parts.join(''), error: null }
}

/**
 * True when `input` should be routed through {@link evaluateExpression}.
 *
 * Two cases qualify:
 *   1. The entire trimmed input is a single top-level AP function call
 *      (`trim('hi')`, `uppercase({{trigger.name}})`). This is what the slash
 *      picker produces and the common case.
 *   2. The input mixes text with an AP function call AND contains at least
 *      one `{{variable}}` reference (`"Dear uppercase({{name}}),"`). The
 *      `{{...}}` marker is the signal that the user built this via the editor
 *      rather than typing natural prose that happens to include a
 *      function-shaped phrase ("Please trim(spaces)", "sum(contributions) for Q1").
 *
 * Detection is intentionally conservative on the prose side because
 * `quoteIfBare` in `wrapStringArgs` auto-quotes bare identifiers, so a
 * false-positive like `trim(spaces)` would silently succeed and produce
 * `"spaces"` instead of being left untouched.
 */
export function containsApFunctionCall(input: string): boolean {
    if (!AP_FUNCTION_CALL_REGEX.test(input)) return false
    if (isPureApFunctionCall(input)) return true
    return VARIABLE_TEMPLATE_REGEX.test(input)
}

function evaluateSingleFormula({ expression, sampleData }: EvaluateExpressionParams): EvaluateExpressionResult {
    const emptyArgError = validateFunctionArgs(expression)
    if (emptyArgError) return { result: null, error: emptyArgError }

    const { processed, vars } = preprocessExpression({ expression, sampleData })
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

function tokenizeFormulaTemplate(
    template: string,
): Array<{ type: 'text' | 'formula', value: string }> {
    const fnNames = new Set(AP_FUNCTIONS.map((f) => f.name))
    const segments: Array<{ type: 'text' | 'formula', value: string }> = []
    let pos = 0

    while (pos < template.length) {
        const next = findNextFunctionCall(template, pos, fnNames)

        if (next === null) {
            segments.push({ type: 'text', value: template.slice(pos) })
            break
        }

        if (next.start > pos) {
            segments.push({ type: 'text', value: template.slice(pos, next.start) })
        }

        const closePos = findMatchingParen(template, next.openParen)
        if (closePos === -1) {
            segments.push({ type: 'text', value: template.slice(next.start) })
            break
        }

        segments.push({ type: 'formula', value: template.slice(next.start, closePos + 1) })
        pos = closePos + 1
    }

    return segments.filter((s) => s.value !== '')
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

function resolveTextVars(text: string, sampleData: Record<string, unknown>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
        const resolved = resolveVariable(path.trim(), sampleData)
        return resolved != null ? String(resolved) : ''
    })
}

function isPureApFunctionCall(input: string): boolean {
    const trimmed = input.trim()
    if (trimmed.length === 0) return false
    const fnNames = new Set(AP_FUNCTIONS.map((f) => f.name))
    const first = findNextFunctionCall(trimmed, 0, fnNames)
    if (first === null || first.start !== 0) return false
    const closePos = findMatchingParen(trimmed, first.openParen)
    return closePos === trimmed.length - 1
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

function resolveVariable(path: string, sampleData: Record<string, unknown>): unknown {
    const parts = path.split('.')
    let value: unknown = sampleData
    for (const part of parts) {
        if (value == null || typeof value !== 'object') return undefined
        value = (value as Record<string, unknown>)[part]
    }
    return value
}

function toArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value
    if (value == null) return []
    return [value]
}

function readField(item: unknown, field: string): unknown {
    if (item !== null && typeof item === 'object') {
        return (item as Record<string, unknown>)[field]
    }
    return undefined
}

function toNumericFieldValues(list: unknown, field: unknown): number[] {
    const fieldName = String(field)
    const result: number[] = []
    for (const item of toArray(list)) {
        const raw = readField(item, fieldName)
        if (raw == null) continue
        const num = Number(raw)
        if (Number.isFinite(num)) result.push(num)
    }
    return result
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const AP_FUNCTION_CALL_REGEX = new RegExp(
    `(?<!\\.)\\b(${AP_FUNCTIONS.map((fn) => fn.name).join('|')})\\s*\\(`,
)
const VARIABLE_TEMPLATE_REGEX = /\{\{[^}]+\}\}/

export type EvaluateExpressionParams = {
    expression: string
    sampleData: Record<string, unknown>
}

export type EvaluateExpressionResult = {
    result: unknown
    error: string | null
}

export { DAY_NAMES, MONTH_NAMES }
