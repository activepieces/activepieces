import dayjs from 'dayjs'
import relativeTimeDayjs from 'dayjs/plugin/relativeTime'
import timezoneDayjs from 'dayjs/plugin/timezone'
import utcDayjs from 'dayjs/plugin/utc'
import { Parser } from 'expr-eval'

dayjs.extend(relativeTimeDayjs)
dayjs.extend(timezoneDayjs)
dayjs.extend(utcDayjs)

export const parser = new Parser()

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
            // Loose equality is intentional: formula args arrive as strings from text
            // input, while item fields are typed (`{age: 25}`). `===` would silently
            // return zero matches when filtering numeric fields with string args.
            // Same rationale applies to is_equal, switch, if_null below.
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

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
