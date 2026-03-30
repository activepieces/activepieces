import { AP_FUNCTIONS } from './function-registry'

export function evaluateExpression(
    expression: string,
    sampleData: Record<string, unknown>,
): unknown {
    const trimmed = expression.trim()
    if (!trimmed) return ''

    if (isVariableRef(trimmed)) {
        return resolveVariable(trimmed, sampleData)
    }

    const funcCall = parseFunctionCall(trimmed)
    if (funcCall) {
        return invokeFunction(funcCall.name, funcCall.rawArgs, sampleData)
    }

    return stripQuotes(trimmed)
}

function isVariableRef(expr: string): boolean {
    return expr.startsWith('{{') && expr.endsWith('}}')
}

function resolveVariable(
    ref: string,
    sampleData: Record<string, unknown>,
): unknown {
    const path = ref.slice(2, -2).trim()
    const parts = path.split('.')
    let value: unknown = sampleData
    for (const part of parts) {
        if (value == null || typeof value !== 'object') return undefined
        value = (value as Record<string, unknown>)[part]
    }
    return value
}

type ParsedCall = { name: string, rawArgs: string[] }

function parseFunctionCall(expr: string): ParsedCall | null {
    const parenIdx = expr.indexOf('(')
    if (parenIdx === -1) return null
    if (!expr.endsWith(')')) return null

    const name = expr.slice(0, parenIdx).trim()
    if (!name || !/^[a-z_][a-z0-9_]*$/i.test(name)) return null

    const knownFunction = AP_FUNCTIONS.find((f) => f.name === name)
    if (!knownFunction) return null

    const argsStr = expr.slice(parenIdx + 1, -1)
    const rawArgs = splitTopLevelArgs(argsStr)
    return { name, rawArgs }
}

function splitTopLevelArgs(argsStr: string): string[] {
    const args: string[] = []
    let depth = 0
    let inSingleQuote = false
    let inDoubleQuote = false
    let inBraces = 0
    let current = ''

    for (let i = 0; i < argsStr.length; i++) {
        const ch = argsStr[i]

        if (ch === '\'' && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote
            current += ch
            continue
        }
        if (ch === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote
            current += ch
            continue
        }
        if (inSingleQuote || inDoubleQuote) {
            current += ch
            continue
        }
        if (ch === '{' && argsStr[i + 1] === '{') {
            inBraces++
            current += ch
            continue
        }
        if (ch === '}' && argsStr[i + 1] === '}') {
            inBraces--
            current += ch
            continue
        }
        if (inBraces > 0) {
            current += ch
            continue
        }
        if (ch === '(') {
            depth++
            current += ch
            continue
        }
        if (ch === ')') {
            depth--
            current += ch
            continue
        }
        if (ch === ',' && depth === 0) {
            args.push(current.trim())
            current = ''
            continue
        }
        current += ch
    }

    if (current.trim()) args.push(current.trim())
    return args
}

function invokeFunction(
    name: string,
    rawArgs: string[],
    sampleData: Record<string, unknown>,
): unknown {
    const args = rawArgs.map((a) => evaluateExpression(a, sampleData))

    switch (name) {
        case 'combine': {
            const [a, b, sep = ''] = args
            return `${a ?? ''}${sep}${b ?? ''}`
        }
        case 'uppercase':
            return String(args[0] ?? '').toUpperCase()
        case 'lowercase':
            return String(args[0] ?? '').toLowerCase()
        case 'titlecase':
            return String(args[0] ?? '').replace(
                /\w\S*/g,
                (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
            )
        case 'trim':
            return String(args[0] ?? '').trim()
        case 'prefix':
            return `${args[1] ?? ''}${args[0] ?? ''}`
        case 'suffix':
            return `${args[0] ?? ''}${args[1] ?? ''}`
        case 'replace':
            return String(args[0] ?? '').split(String(args[1] ?? '')).join(String(args[2] ?? ''))
        case 'remove':
            return String(args[0] ?? '').split(String(args[1] ?? '')).join('')
        case 'first_n':
            return String(args[0] ?? '').slice(0, Number(args[1]))
        case 'last_n': {
            const s = String(args[0] ?? '')
            const n = Number(args[1])
            return s.slice(Math.max(0, s.length - n))
        }
        case 'truncate': {
            const s = String(args[0] ?? '')
            const n = Number(args[1])
            return s.length > n ? s.slice(0, n) + '...' : s
        }
        case 'split': {
            const parts = String(args[0] ?? '').split(String(args[1] ?? ''))
            return parts[Number(args[2])] ?? ''
        }
        case 'extract_between': {
            const s = String(args[0] ?? '')
            const start = String(args[1] ?? '')
            const end = String(args[2] ?? '')
            const si = s.indexOf(start)
            if (si === -1) return ''
            const ei = s.indexOf(end, si + start.length)
            if (ei === -1) return ''
            return s.slice(si + start.length, ei)
        }
        case 'extract_email': {
            const match = String(args[0] ?? '').match(
                /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
            )
            return match ? match[0] : ''
        }
        case 'extract_url': {
            const match = String(args[0] ?? '').match(/https?:\/\/[^\s]+/)
            return match ? match[0] : ''
        }
        case 'length':
            return String(args[0] ?? '').length
        case 'contains':
            return String(args[0] ?? '').includes(String(args[1] ?? ''))
        case 'starts_with':
            return String(args[0] ?? '').startsWith(String(args[1] ?? ''))
        case 'ends_with':
            return String(args[0] ?? '').endsWith(String(args[1] ?? ''))
        case 'remove_spaces':
            return String(args[0] ?? '').replace(/\s+/g, ' ').trim()
        case 'word_count':
            return String(args[0] ?? '').trim().split(/\s+/).filter(Boolean).length
        case 'add':
            return Number(args[0]) + Number(args[1])
        case 'subtract':
            return Number(args[0]) - Number(args[1])
        case 'multiply':
            return Number(args[0]) * Number(args[1])
        case 'divide': {
            const divisor = Number(args[1])
            if (divisor === 0) return 'Error: division by zero'
            return Number(args[0]) / divisor
        }
        case 'round':
            return Number(Number(args[0]).toFixed(Number(args[1])))
        case 'round_up':
            return Math.ceil(Number(args[0]))
        case 'round_down':
            return Math.floor(Number(args[0]))
        case 'absolute':
            return Math.abs(Number(args[0]))
        case 'percentage':
            return (Number(args[0]) / Number(args[1])) * 100
        case 'format_number': {
            const decimals = Number(args[1])
            return Number(args[0]).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })
        }
        case 'format_currency': {
            const symbol = String(args[1] ?? '$')
            return `${symbol}${Number(args[0]).toFixed(2)}`
        }
        case 'cents_to_dollars':
            return `$${(Number(args[0]) / 100).toFixed(2)}`
        case 'min':
            return Math.min(Number(args[0]), Number(args[1]))
        case 'max':
            return Math.max(Number(args[0]), Number(args[1]))
        case 'to_number':
            return Number(args[0])
        case 'format_date': {
            const d = toDate(args[0])
            if (!d) return ''
            return formatDateWithPattern(d, String(args[1] ?? ''))
        }
        case 'format_date_long': {
            const d = toDate(args[0])
            if (!d) return ''
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        }
        case 'format_time': {
            const d = toDate(args[0])
            if (!d) return ''
            return formatTimeWithPattern(d, String(args[1] ?? ''))
        }
        case 'relative_time': {
            const d = toDate(args[0])
            if (!d) return ''
            return relativeTime(d)
        }
        case 'add_days': {
            const d = toDate(args[0])
            if (!d) return ''
            d.setDate(d.getDate() + Number(args[1]))
            return d.toISOString()
        }
        case 'subtract_days': {
            const d = toDate(args[0])
            if (!d) return ''
            d.setDate(d.getDate() - Number(args[1]))
            return d.toISOString()
        }
        case 'add_hours': {
            const d = toDate(args[0])
            if (!d) return ''
            d.setHours(d.getHours() + Number(args[1]))
            return d.toISOString()
        }
        case 'days_between': {
            const a = toDate(args[0])
            const b = toDate(args[1])
            if (!a || !b) return ''
            return Math.round(Math.abs(b.getTime() - a.getTime()) / 86400000)
        }
        case 'get_day': {
            const d = toDate(args[0])
            return d ? d.getDate() : ''
        }
        case 'get_month': {
            const d = toDate(args[0])
            return d ? d.toLocaleDateString('en-US', { month: 'long' }) : ''
        }
        case 'get_year': {
            const d = toDate(args[0])
            return d ? d.getFullYear() : ''
        }
        case 'get_day_of_week': {
            const d = toDate(args[0])
            return d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : ''
        }
        case 'start_of_month': {
            const d = toDate(args[0])
            if (!d) return ''
            return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
        }
        case 'end_of_month': {
            const d = toDate(args[0])
            if (!d) return ''
            return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString()
        }
        case 'convert_timezone': {
            const d = toDate(args[0])
            if (!d) return ''
            return d.toLocaleString('en-US', { timeZone: String(args[1] ?? 'UTC') })
        }
        case 'now':
            return new Date().toISOString()
        case 'today':
            return new Date().toISOString().slice(0, 10)
        case 'to_date': {
            const d = toDate(args[0])
            return d ? d.toISOString() : ''
        }
        case 'filter_list': {
            const list = toArray(args[0])
            const field = String(args[1])
            const value = args[2]
            return list.filter(
                (item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>)[field] == value,
            )
        }
        case 'sort_list': {
            const list = [...toArray(args[0])]
            const field = String(args[1])
            const order = String(args[2] ?? 'asc')
            return list.sort((a, b) => {
                const av = (a as Record<string, unknown>)[field] as string | number
                const bv = (b as Record<string, unknown>)[field] as string | number
                const cmp = av < bv ? -1 : av > bv ? 1 : 0
                return order === 'desc' ? -cmp : cmp
            })
        }
        case 'pluck': {
            const list = toArray(args[0])
            const field = String(args[1])
            return list.map((item) =>
                typeof item === 'object' && item !== null
                    ? (item as Record<string, unknown>)[field]
                    : undefined,
            )
        }
        case 'join_list':
            return toArray(args[0]).join(String(args[1] ?? ','))
        case 'first_item':
            return toArray(args[0])[0]
        case 'last_item': {
            const list = toArray(args[0])
            return list[list.length - 1]
        }
        case 'item_at':
            return toArray(args[0])[Number(args[1])]
        case 'count':
            return toArray(args[0]).length
        case 'sum': {
            const list = toArray(args[0])
            const field = String(args[1])
            return list.reduce((acc: number, item) => {
                const v = typeof item === 'object' && item !== null
                    ? Number((item as Record<string, unknown>)[field])
                    : 0
                return acc + (isNaN(v) ? 0 : v)
            }, 0)
        }
        case 'average': {
            const list = toArray(args[0])
            if (!list.length) return 0
            const field = String(args[1])
            const total = list.reduce((acc: number, item) => {
                const v = typeof item === 'object' && item !== null
                    ? Number((item as Record<string, unknown>)[field])
                    : 0
                return acc + (isNaN(v) ? 0 : v)
            }, 0)
            return total / list.length
        }
        case 'max_in_list': {
            const list = toArray(args[0])
            const field = String(args[1])
            return Math.max(...list.map((item) =>
                Number(typeof item === 'object' && item !== null ? (item as Record<string, unknown>)[field] : NaN),
            ))
        }
        case 'min_in_list': {
            const list = toArray(args[0])
            const field = String(args[1])
            return Math.min(...list.map((item) =>
                Number(typeof item === 'object' && item !== null ? (item as Record<string, unknown>)[field] : NaN),
            ))
        }
        case 'deduplicate': {
            const list = toArray(args[0])
            const field = String(args[1])
            const seen = new Set<unknown>()
            return list.filter((item) => {
                const key = typeof item === 'object' && item !== null
                    ? (item as Record<string, unknown>)[field]
                    : item
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
        }
        case 'flatten':
            return toArray(args[0]).flat()
        case 'split_text_to_list':
            return String(args[0] ?? '').split(String(args[1] ?? ',')).map((s) => s.trim())
        case 'if':
            return args[0] ? args[1] : args[2]
        case 'if_empty':
            return args[0] === '' || args[0] == null ? args[1] : args[0]
        case 'if_null':
            return args[0] == null ? args[1] : args[0]
        case 'switch': {
            const [val, ...pairs] = args
            for (let i = 0; i + 1 < pairs.length; i += 2) {
                if (pairs[i] == val) return pairs[i + 1]
            }
            return pairs.length % 2 === 1 ? pairs[pairs.length - 1] : ''
        }
        case 'is_empty':
            return args[0] === '' || args[0] == null
        case 'is_not_empty':
            return args[0] !== '' && args[0] != null
        case 'is_equal':
            return args[0] == args[1]
        case 'and':
            return Boolean(args[0]) && Boolean(args[1])
        case 'or':
            return Boolean(args[0]) || Boolean(args[1])
        case 'not':
            return !args[0]
        case 'coalesce':
            return args.find((a) => a !== '' && a != null) ?? ''

        default:
            return `[unknown function: ${name}]`
    }
}

function stripQuotes(s: string): string {
    if (
        (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith('\'') && s.endsWith('\''))
    ) {
        return s.slice(1, -1)
    }
    return s
}

function toDate(value: unknown): Date | null {
    if (!value) return null
    const d = new Date(String(value))
    return isNaN(d.getTime()) ? null : d
}

function toArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value
    if (value == null) return []
    return [value]
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3))
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDateWithPattern(d: Date, pattern: string): string {
    return pattern
        .replace('YYYY', String(d.getFullYear()))
        .replace('YY', String(d.getFullYear()).slice(-2))
        .replace('MMMM', MONTH_NAMES[d.getMonth()])
        .replace('MMM', MONTH_SHORT[d.getMonth()])
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('M', String(d.getMonth() + 1))
        .replace('DD', String(d.getDate()).padStart(2, '0'))
        .replace('D', String(d.getDate()))
        .replace('HH', String(d.getHours()).padStart(2, '0'))
        .replace('mm', String(d.getMinutes()).padStart(2, '0'))
        .replace('ss', String(d.getSeconds()).padStart(2, '0'))
}

function formatTimeWithPattern(d: Date, pattern: string): string {
    const hours12 = d.getHours() % 12 || 12
    const ampm = d.getHours() < 12 ? 'AM' : 'PM'
    return pattern
        .replace('HH', String(d.getHours()).padStart(2, '0'))
        .replace('h', String(hours12))
        .replace('mm', String(d.getMinutes()).padStart(2, '0'))
        .replace('A', ampm)
}

function relativeTime(d: Date): string {
    const diffMs = Date.now() - d.getTime()
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)

    if (Math.abs(diffSec) < 60) return 'just now'
    if (Math.abs(diffMin) < 60) return `${Math.abs(diffMin)} minute${Math.abs(diffMin) > 1 ? 's' : ''} ago`
    if (Math.abs(diffHour) < 24) return `${Math.abs(diffHour)} hour${Math.abs(diffHour) > 1 ? 's' : ''} ago`
    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    return `in ${Math.abs(diffDay)} day${Math.abs(diffDay) > 1 ? 's' : ''}`
}

export { DAY_NAMES, MONTH_NAMES }
