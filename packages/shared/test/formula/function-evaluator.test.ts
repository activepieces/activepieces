import { describe, expect, it } from 'vitest'
import { formulaEvaluator } from '../../src/lib/formula/formula-evaluator'

const ok = (expr: string, data: Record<string, unknown> = {}) =>
    formulaEvaluator.evaluate({ expression: formulaEvaluator.wrap(expr), sampleData: data })

const okMixed = (template: string, data: Record<string, unknown> = {}) =>
    formulaEvaluator.evaluate({ expression: template, sampleData: data })

const result = (expr: string, data: Record<string, unknown> = {}) =>
    ok(expr, data).result

const error = (expr: string, data: Record<string, unknown> = {}) =>
    ok(expr, data).error

// ---------------------------------------------------------------------------
// Text functions
// ---------------------------------------------------------------------------

describe('combine', () => {
    it('joins two values', () => expect(result('combine("John";"Smith";" ")')).toBe('John Smith'))
    it('joins without separator', () => expect(result('combine("a";"b")')).toBe('ab'))
    it('handles numbers', () => expect(result('combine(1;2)')).toBe('12'))
})

describe('uppercase', () => {
    it('uppercases text', () => expect(result('uppercase("hello")')).toBe('HELLO'))
    it('empty string stays empty', () => expect(result('uppercase("")')).toBe(''))
})

describe('lowercase', () => {
    it('lowercases text', () => expect(result('lowercase("HELLO")')).toBe('hello'))
})

describe('titlecase', () => {
    it('capitalises each word', () => expect(result('titlecase("john smith")')).toBe('John Smith'))
})

describe('trim', () => {
    it('strips surrounding whitespace', () => expect(result('trim(" hello ")')).toBe('hello'))
    it('no-ops on clean string', () => expect(result('trim("hi")')).toBe('hi'))
})

describe('prefix / suffix', () => {
    it('prefix prepends', () => expect(result('prefix("world";"hello ")')).toBe('hello world'))
    it('suffix appends', () => expect(result('suffix("hello";" world")')).toBe('hello world'))
})

describe('replace', () => {
    it('replaces all occurrences', () => expect(result('replace("aabbaa";"a";"x")')).toBe('xxbbxx'))
})

describe('remove', () => {
    it('removes all occurrences', () => expect(result('remove("hello world";"l")')).toBe('heo word'))
})

describe('first_n / last_n', () => {
    it('first_n returns leading chars', () => expect(result('first_n("hello";3)')).toBe('hel'))
    it('last_n returns trailing chars', () => expect(result('last_n("hello";3)')).toBe('llo'))
})

describe('truncate', () => {
    it('truncates long string with ellipsis', () => expect(result('truncate("hello world";5)')).toBe('hello...'))
    it('leaves short string unchanged', () => expect(result('truncate("hi";10)')).toBe('hi'))
})

describe('split', () => {
    it('returns the element at index', () => expect(result('split("a,b,c";",";1)')).toBe('b'))
})

describe('extract_between', () => {
    it('extracts text between two markers', () =>
        expect(result('extract_between("hello [world] end";"[";"]")')).toBe('world'))
    it('returns empty if marker not found', () =>
        expect(result('extract_between("hello";"[";"]")')).toBe(''))
})

describe('extract_email', () => {
    it('extracts email address', () =>
        expect(result('extract_email("contact me at foo@bar.com today")')).toBe('foo@bar.com'))
    it('returns empty if no email', () => expect(result('extract_email("no email here")')).toBe(''))
})

describe('extract_url', () => {
    it('extracts https url', () =>
        expect(result('extract_url("visit https://example.com now")')).toBe('https://example.com'))
})

describe('length', () => {
    it('counts characters', () => expect(result('length("hello")')).toBe(5))
    it('empty string is 0', () => expect(result('length("")')).toBe(0))
})

describe('contains', () => {
    it('true when substring present', () => expect(result('contains("hello world";"world")')).toBe(true))
    it('false when absent', () => expect(result('contains("hello";"xyz")')).toBe(false))
})

describe('starts_with / ends_with', () => {
    it('starts_with matches prefix', () => expect(result('starts_with("hello";"hel")')).toBe(true))
    it('starts_with rejects non-prefix', () => expect(result('starts_with("hello";"world")')).toBe(false))
    it('ends_with matches suffix', () => expect(result('ends_with("hello";"llo")')).toBe(true))
})

describe('remove_spaces', () => {
    it('collapses multiple spaces', () => expect(result('remove_spaces("  a  b  ")')).toBe('a b'))
})

describe('word_count', () => {
    it('counts words', () => expect(result('word_count("hello world foo")')).toBe(3))
    it('empty string is 0', () => expect(result('word_count("")')).toBe(0))
})

// ---------------------------------------------------------------------------
// Number functions
// ---------------------------------------------------------------------------

describe('add / subtract / multiply / divide', () => {
    it('add', () => expect(result('add(3;4)')).toBe(7))
    it('subtract', () => expect(result('subtract(10;3)')).toBe(7))
    it('multiply', () => expect(result('multiply(3;4)')).toBe(12))
    it('divide', () => expect(result('divide(10;2)')).toBe(5))
    it('divide by zero returns error', () => expect(error('divide(1;0)')).toBeTruthy())
})

describe('round / round_up / round_down', () => {
    it('round to 0 decimals', () => expect(result('round(3.6)')).toBe(4))
    it('round to 2 decimals', () => expect(result('round(3.555;2)')).toBe(3.56))
    it('round_up', () => expect(result('round_up(3.1)')).toBe(4))
    it('round_down', () => expect(result('round_down(3.9)')).toBe(3))
})

describe('absolute', () => {
    it('returns positive value', () => expect(result('absolute(-5)')).toBe(5))
    it('positive stays positive', () => expect(result('absolute(5)')).toBe(5))
})

describe('percentage', () => {
    it('calculates percentage', () => expect(result('percentage(25;200)')).toBe(12.5))
    it('errors on zero total instead of returning Infinity', () => {
        expect(result('percentage(5;0)')).toBeNull()
        expect(error('percentage(5;0)')).toMatch(/divide by zero/i)
    })
})

describe('format_number', () => {
    it('formats with thousands separator', () => expect(result('format_number(1000)')).toBe('1,000'))
    it('formats with decimals', () => expect(result('format_number(1234.5;2)')).toBe('1,234.50'))
})

describe('format_currency', () => {
    it('defaults to dollar sign', () => expect(result('format_currency(9.99)')).toBe('$9.99'))
    it('accepts custom symbol', () => expect(result('format_currency(9.99;"€")')).toBe('€9.99'))
})

describe('cents_to_dollars', () => {
    it('converts cents', () => expect(result('cents_to_dollars(1099)')).toBe('$10.99'))
})

describe('min / max', () => {
    it('min returns smaller value', () => expect(result('min(3;7)')).toBe(3))
    it('max returns larger value', () => expect(result('max(3;7)')).toBe(7))
})

describe('to_number', () => {
    it('converts string to number', () => expect(result('to_number("42")')).toBe(42))
    it('passes through number', () => expect(result('to_number(42)')).toBe(42))
})

// ---------------------------------------------------------------------------
// Date functions
// ---------------------------------------------------------------------------

describe('format_date', () => {
    it('formats date with default pattern', () =>
        expect(result('format_date("2024-01-15")')).toBe('2024-01-15'))
    it('formats with custom pattern', () =>
        expect(result('format_date("2024-01-15";"DD/MM/YYYY")')).toBe('15/01/2024'))
    it('returns empty for invalid date', () =>
        expect(result('format_date("not-a-date")')).toBe(''))
})

describe('format_date_long', () => {
    it('returns a non-empty string for valid date', () => {
        const r = result('format_date_long("2024-01-15")')
        expect(typeof r).toBe('string')
        expect((r as string).length).toBeGreaterThan(0)
    })
})

describe('format_time', () => {
    it('formats time', () =>
        expect(result('format_time("2024-01-15T14:30:00")')).toBe('14:30'))
})

describe('add_days / subtract_days', () => {
    it('add_days shifts date by N days', () => {
        const r = result('format_date(add_days("2024-01-01";5))') as string
        expect(r).toBe('2024-01-06')
    })
    it('subtract_days shifts date back by N days', () => {
        const r = result('format_date(subtract_days("2024-01-10";5))') as string
        expect(r).toBe('2024-01-05')
    })
})

describe('add_hours', () => {
    it('adds hours to datetime', () => {
        const r = result('format_date(add_hours("2024-01-01T10:00:00";3);"YYYY-MM-DD HH:mm")') as string
        expect(r).toMatch(/13:00/)
    })
})

describe('days_between', () => {
    it('calculates absolute difference', () =>
        expect(result('days_between("2024-01-01";"2024-01-11")')).toBe(10))
    it('is absolute regardless of order', () =>
        expect(result('days_between("2024-01-11";"2024-01-01")')).toBe(10))
})

describe('get_day / get_month / get_year', () => {
    it('get_day returns day number', () =>
        expect(result('get_day("2024-03-15")')).toBe(15))
    it('get_year returns year', () =>
        expect(result('get_year("2024-03-15")')).toBe(2024))
    it('get_month returns month name', () => {
        const r = result('get_month("2024-03-15")') as string
        expect(r.toLowerCase()).toContain('march')
    })
})

describe('get_day_of_week', () => {
    it('returns weekday name', () => {
        const r = result('get_day_of_week("2024-01-15")') as string
        expect(r.toLowerCase()).toContain('monday')
    })
})

describe('start_of_month / end_of_month', () => {
    it('start_of_month is day 1', () => {
        const r = result('format_date(start_of_month("2024-03-15"))') as string
        expect(r).toBe('2024-03-01')
    })
    it('end_of_month is last day of month', () => {
        const r = result('format_date(end_of_month("2024-02-01"))') as string
        expect(r).toBe('2024-02-29')
    })
})

describe('now / today', () => {
    it('now returns an ISO string', () => {
        const r = result('now()') as string
        expect(() => new Date(r)).not.toThrow()
    })
    it('today returns YYYY-MM-DD', () => {
        const r = result('today()') as string
        expect(r).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})

describe('to_date', () => {
    it('converts string to a parseable date', () => {
        const r = result('format_date(to_date("2024-01-15"))') as string
        expect(r).toBe('2024-01-15')
    })
    it('returns empty for invalid input', () =>
        expect(result('to_date("not-a-date")')).toBe(''))
})

// ---------------------------------------------------------------------------
// List functions
// ---------------------------------------------------------------------------

const LIST_DATA = {
    items: [
        { name: 'Alice', score: 90 },
        { name: 'Bob', score: 70 },
        { name: 'Charlie', score: 80 },
        { name: 'Bob', score: 60 },
    ],
}

describe('filter_list', () => {
    it('filters by field value', () => {
        const r = result('filter_list({{items}};"name";"Bob")', LIST_DATA) as unknown[]
        expect(r).toHaveLength(2)
    })
})

describe('sort_list', () => {
    it('sorts ascending by field', () => {
        const r = result('sort_list({{items}};"score";"asc")', LIST_DATA) as { score: number }[]
        expect(r[0].score).toBe(60)
    })
    it('sorts descending by field', () => {
        const r = result('sort_list({{items}};"score";"desc")', LIST_DATA) as { score: number }[]
        expect(r[0].score).toBe(90)
    })
})

describe('pluck', () => {
    it('extracts field values', () => {
        const r = result('pluck({{items}};"name")', LIST_DATA)
        expect(r).toEqual(['Alice', 'Bob', 'Charlie', 'Bob'])
    })
})

describe('join_list', () => {
    it('joins string array with separator', () =>
        expect(result('join_list({{tags}};",")', { tags: ['a', 'b', 'c'] })).toBe('a,b,c'))
    it('joins with custom separator', () =>
        expect(result('join_list({{tags}};" | ")', { tags: ['x', 'y'] })).toBe('x | y'))
})

describe('first_item / last_item / item_at', () => {
    it('first_item', () => {
        const r = result('first_item({{items}})', LIST_DATA) as { name: string }
        expect(r.name).toBe('Alice')
    })
    it('last_item', () => {
        const r = result('last_item({{items}})', LIST_DATA) as { name: string }
        expect(r.name).toBe('Bob')
    })
    it('item_at returns element at index', () => {
        const r = result('item_at({{items}};1)', LIST_DATA) as { name: string }
        expect(r.name).toBe('Bob')
    })
})

describe('count', () => {
    it('counts items', () => expect(result('count({{items}})', LIST_DATA)).toBe(4))
    it('empty list is 0', () => expect(result('count({{empty}})', { empty: [] })).toBe(0))
})

describe('sum', () => {
    it('sums numeric field', () =>
        expect(result('sum({{items}};"score")', LIST_DATA)).toBe(300))
})

describe('average', () => {
    it('averages numeric field', () =>
        expect(result('average({{items}};"score")', LIST_DATA)).toBe(75))
})

describe('max_in_list / min_in_list', () => {
    it('max_in_list', () =>
        expect(result('max_in_list({{items}};"score")', LIST_DATA)).toBe(90))
    it('min_in_list', () =>
        expect(result('min_in_list({{items}};"score")', LIST_DATA)).toBe(60))
    it('returns null instead of -Infinity when list is empty', () =>
        expect(result('max_in_list({{items}};"score")', { items: [] })).toBeNull())
    it('returns null instead of Infinity when list is empty', () =>
        expect(result('min_in_list({{items}};"score")', { items: [] })).toBeNull())
    it('returns null when no item has the field', () =>
        expect(result('max_in_list({{items}};"missing")', LIST_DATA)).toBeNull())
})

describe('deduplicate', () => {
    it('removes duplicate field values', () => {
        const r = result('deduplicate({{items}};"name")', LIST_DATA) as unknown[]
        expect(r).toHaveLength(3)
    })
})

describe('flatten', () => {
    it('flattens one level', () =>
        expect(result('flatten({{nested}})', { nested: [[1, 2], [3, 4]] })).toEqual([1, 2, 3, 4]))
})

describe('split_text_to_list', () => {
    it('splits by separator', () =>
        expect(result('split_text_to_list("a,b,c";",")')).toEqual(['a', 'b', 'c']))
    it('trims whitespace around items', () =>
        expect(result('split_text_to_list("a , b , c";",")')).toEqual(['a', 'b', 'c']))
})

// ---------------------------------------------------------------------------
// Logic functions
// ---------------------------------------------------------------------------

describe('if', () => {
    it('returns first branch when true', () => expect(result('if(1;"yes";"no")')).toBe('yes'))
    it('returns second branch when false', () => expect(result('if(0;"yes";"no")')).toBe('no'))
    it('is lazy: untaken branch with divide-by-zero does not throw', () => {
        const r = ok('if(is_empty({{x}}); "safe"; divide({{x}}; 0))', { x: '' })
        expect(r.error).toBeNull()
        expect(r.result).toBe('safe')
    })
    it('is lazy: nested untaken branch is not evaluated', () => {
        const r = ok('if(1; "taken"; divide(1; 0))')
        expect(r.error).toBeNull()
        expect(r.result).toBe('taken')
    })
    it('nested if still short-circuits', () => {
        const r = ok('if(1; if(0; "inner-true"; "inner-false"); divide(1; 0))')
        expect(r.error).toBeNull()
        expect(r.result).toBe('inner-false')
    })
})

describe('if_empty', () => {
    it('returns fallback for empty string', () =>
        expect(result('if_empty("";"default")')).toBe('default'))
    it('returns value when not empty', () =>
        expect(result('if_empty("value";"default")')).toBe('value'))
    it('returns fallback for null', () =>
        expect(result('if_empty({{missing}};"default")', {})).toBe('default'))
})

describe('if_null', () => {
    it('returns fallback for null variable', () =>
        expect(result('if_null({{missing}};"default")', {})).toBe('default'))
    it('returns value when present', () =>
        expect(result('if_null("value";"default")')).toBe('value'))
})

describe('switch', () => {
    it('matches correct key', () =>
        expect(result('switch("b";"a";"first";"b";"second")')).toBe('second'))
    it('returns default when no match', () =>
        expect(result('switch("z";"a";"first";"b";"second";"fallback")')).toBe('fallback'))
    it('returns empty when no match and no default', () =>
        expect(result('switch("z";"a";"first")')).toBe(''))
})

describe('is_empty / is_not_empty', () => {
    it('is_empty true for empty string', () => expect(result('is_empty("")')).toBe(true))
    it('is_empty false for non-empty', () => expect(result('is_empty("hi")')).toBe(false))
    it('is_not_empty true for non-empty', () => expect(result('is_not_empty("hi")')).toBe(true))
})

describe('is_equal', () => {
    it('equal values', () => expect(result('is_equal("a";"a")')).toBe(true))
    it('unequal values', () => expect(result('is_equal("a";"b")')).toBe(false))
})

describe('and / or / not', () => {
    it('and both true', () => expect(result('and(1;1)')).toBe(true))
    it('and one false', () => expect(result('and(1;0)')).toBe(false))
    it('or one true', () => expect(result('or(0;1)')).toBe(true))
    it('or both false', () => expect(result('or(0;0)')).toBe(false))
    it('not true → false', () => expect(result('not(1)')).toBe(false))
    it('not false → true', () => expect(result('not(0)')).toBe(true))
})

describe('coalesce', () => {
    it('returns first non-null non-empty', () =>
        expect(result('coalesce({{a}};{{b}};"fallback")', { a: null, b: '' })).toBe('fallback'))
    it('returns first value when defined', () =>
        expect(result('coalesce("first";"second")')).toBe('first'))
})

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

describe('variable resolution', () => {
    it('resolves top-level variable', () =>
        expect(result('uppercase({{name}})', { name: 'alice' })).toBe('ALICE'))

    it('resolves nested path', () =>
        expect(result('trim({{user.name}})', { user: { name: '  bob  ' } })).toBe('bob'))

    it('resolves missing variable as null (no crash)', () =>
        expect(error('trim({{missing}})', {})).toBeNull())

    it('plain variable with no function', () =>
        expect(result('{{name}}', { name: 'alice' })).toBe('alice'))
})

// ---------------------------------------------------------------------------
// Nesting
// ---------------------------------------------------------------------------

describe('nested functions', () => {
    it('trim(uppercase(...))', () =>
        expect(result('trim(uppercase(" hello "))')).toBe('HELLO'))

    it('if with nested combine', () =>
        expect(result('if(1;combine("a";"b");"x")')).toBe('ab'))

    it('deeply nested: trim(prefix(uppercase(...);">> "))', () =>
        expect(result('prefix(uppercase(trim(" hello "));">> ")')).toBe('>> HELLO'))
})

// ---------------------------------------------------------------------------
// Mixed template (function + plain text + variable)
// ---------------------------------------------------------------------------

describe('mixed template', () => {
    it('text before wrapped function', () =>
        expect(
            okMixed(`Hello ${formulaEvaluator.wrap('trim(" world ")')}`).result,
        ).toBe('Hello world'))

    it('wrapped function result embedded in string', () =>
        expect(
            okMixed(
                `Name: ${formulaEvaluator.wrap('uppercase({{name}})')}`,
                { name: 'alice' },
            ).result,
        ).toBe('Name: ALICE'))

    it('plain text without wrapper passes through unchanged', () =>
        expect(okMixed('Please trim(spaces)').result).toBe('Please trim(spaces)'))
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('error handling', () => {
    it('divide by zero returns an error string', () =>
        expect(error('divide(1;0)')).toBeTruthy())

    it('empty expression returns empty string', () =>
        expect(result('')).toBe(''))

    it('unknown identifier inside a wrapper surfaces an error', () =>
        expect(error('unknownfunc("x")')).toBeTruthy())
})

// ---------------------------------------------------------------------------
// Implicit string quoting — no quotes required for string args
// ---------------------------------------------------------------------------

describe('implicit string quoting', () => {
    it('trim without quotes', () =>
        expect(result('trim(  hello world  )')).toBe('hello world'))

    it('uppercase without quotes', () =>
        expect(result('uppercase(hello)')).toBe('HELLO'))

    it('lowercase without quotes', () =>
        expect(result('lowercase(WORLD)')).toBe('world'))

    it('prefix without quotes', () =>
        expect(result('prefix(world;!!)')).toBe('!!world'))

    it('suffix without quotes', () =>
        expect(result('suffix(Hello;!)')).toBe('Hello!'))

    it('combine without quotes on all three args', () =>
        expect(result('combine(foo;bar;-)')).toBe('foo-bar'))

    it('combine with quoted space separator still works', () =>
        expect(result('combine(John;Smith;" ")')).toBe('John Smith'))

    it('combine preserves spaces typed inside an arg', () =>
        expect(result('combine(hello;    world)')).toBe('hello    world'))

    it('replace without quotes on search and replacement', () =>
        expect(result('replace(hello world;world;there)')).toBe('hello there'))

    it('contains without quotes', () =>
        expect(result('contains(hello world;world)')).toBe(true))

    it('starts_with without quotes', () =>
        expect(result('starts_with(hello world;hello)')).toBe(true))

    it('if_empty without quotes on fallback — first arg explicit empty string', () =>
        expect(result('if_empty("";fallback text)')).toBe('fallback text'))

    it('if_null without quotes on fallback — variable that is null', () =>
        expect(result('if_null({{val}};N/A)', { val: null })).toBe('N/A'))

    it('nested call result passed to string arg — no double-quoting', () =>
        expect(result('trim(uppercase(hello))')).toBe('HELLO'))

    it('variable in string arg position — not quoted', () =>
        expect(result('uppercase({{name}})', { name: 'alice' })).toBe('ALICE'))

    it('already-quoted arg not double-quoted', () =>
        expect(result('trim("  spaces  ")')).toBe('spaces'))

    it('number arg in number position not quoted', () =>
        expect(result('add(3;4)')).toBe(7))

    it('multi-word bare string preserved', () =>
        expect(result('contains(the quick brown fox; quick brown)')).toBe(true))
})

describe('formulaEvaluator wrapper detection', () => {
    it('wrapped pure formula is detected', () =>
        expect(formulaEvaluator.containsWrapper(formulaEvaluator.wrap('trim("hi")'))).toBe(true))

    it('mixed content with one wrapped formula is detected', () =>
        expect(formulaEvaluator.containsWrapper(`Dear ${formulaEvaluator.wrap('uppercase({{trigger.name}})')},`)).toBe(true))

    it('natural-language prose with a function-shaped phrase is NOT detected', () =>
        expect(formulaEvaluator.containsWrapper('Please trim(spaces)')).toBe(false))

    it('prose embedding a formula fragment without wrapper is NOT detected', () =>
        expect(formulaEvaluator.containsWrapper('sum(contributions) for Q1')).toBe(false))

    it('plain text without any function name returns false', () =>
        expect(formulaEvaluator.containsWrapper('hello world')).toBe(false))

    it('variable template alone (no wrapper) is NOT detected as formula', () =>
        expect(formulaEvaluator.containsWrapper('Here is {{trigger.min}} without parens')).toBe(false))

    it('wrapped formula nested inside plain text', () => {
        const input = `Score: ${formulaEvaluator.wrap('add({{score}};8)')}`
        expect(formulaEvaluator.containsWrapper(input)).toBe(true)
    })
})
