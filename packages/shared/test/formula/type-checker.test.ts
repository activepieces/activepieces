import { describe, expect, it } from 'vitest'
import { typeCheckTiptapDoc } from '../../src/lib/formula/function-type-checker'

type Node = {
    type?: string
    attrs?: Record<string, unknown>
    content?: Node[]
    text?: string
}

function doc(...paragraphContent: Node[][]): Node {
    return {
        type: 'doc',
        content: paragraphContent.map((nodes) => ({ type: 'paragraph', content: nodes })),
    }
}

function fnStart(functionName: string, id: string): Node {
    return { type: 'function_start', attrs: { id, functionName } }
}

function fnEnd(openId: string): Node {
    return { type: 'function_end', attrs: { openId } }
}

function fnSep(openId: string): Node {
    return { type: 'function_sep', attrs: { openId } }
}

function mention(serverValue: string): Node {
    return {
        type: 'mention',
        attrs: { label: JSON.stringify({ serverValue, displayText: serverValue }) },
    }
}

function text(value: string): Node {
    return { type: 'text', text: value }
}

// ---------------------------------------------------------------------------
// Arg count checks
// ---------------------------------------------------------------------------

describe('arg count validation', () => {
    it('no error when arg count is correct — trim(mention)', () => {
        const d = doc([fnStart('trim', 'f1'), mention('{{x}}'), fnEnd('f1')])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })

    it('error when too few args — combine requires 2', () => {
        const d = doc([fnStart('combine', 'f1'), mention('{{x}}'), fnEnd('f1')])
        const errors = typeCheckTiptapDoc(d)
        expect(errors.get('f1')).toMatch(/at least/)
    })

    it('error when too many args — trim takes 1', () => {
        const d = doc([
            fnStart('trim', 'f1'),
            mention('{{x}}'),
            fnSep('f1'),
            text('extra'),
            fnEnd('f1'),
        ])
        const errors = typeCheckTiptapDoc(d)
        expect(errors.get('f1')).toMatch(/at most/)
    })

    it('no error for variadic function — coalesce with many args', () => {
        const d = doc([
            fnStart('coalesce', 'f1'),
            text('a'),
            fnSep('f1'),
            text('b'),
            fnSep('f1'),
            text('c'),
            fnEnd('f1'),
        ])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })

    it('no error for 0-arg function — now()', () => {
        const d = doc([fnStart('now', 'f1'), fnEnd('f1')])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })

    it('error when arg given to 0-arg function', () => {
        const d = doc([fnStart('now', 'f1'), text('oops'), fnEnd('f1')])
        const errors = typeCheckTiptapDoc(d)
        expect(errors.get('f1')).toMatch(/at most/)
    })
})

// ---------------------------------------------------------------------------
// Nested functions — only the outer function is checked at depth 0
// ---------------------------------------------------------------------------

describe('nested functions', () => {
    it('no error for trim(uppercase(mention))', () => {
        const d = doc([
            fnStart('trim', 'outer'),
            fnStart('uppercase', 'inner'),
            mention('{{x}}'),
            fnEnd('inner'),
            fnEnd('outer'),
        ])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })

    it('inner error is independent of outer', () => {
        const d = doc([
            fnStart('trim', 'outer'),
            fnStart('trim', 'inner'),
            mention('{{x}}'),
            fnSep('inner'),
            text('extra'),
            fnEnd('inner'),
            fnEnd('outer'),
        ])
        const errors = typeCheckTiptapDoc(d)
        expect(errors.get('inner')).toMatch(/at most/)
        expect(errors.has('outer')).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// Empty function body
// ---------------------------------------------------------------------------

describe('empty body', () => {
    it('no error for trim with empty body (0 args, min is 1) → flagged', () => {
        const d = doc([fnStart('trim', 'f1'), fnEnd('f1')])
        const errors = typeCheckTiptapDoc(d)
        expect(errors.get('f1')).toMatch(/at least/)
    })

    it('no error for now() with empty body (0 args, min is 0)', () => {
        const d = doc([fnStart('now', 'f1'), fnEnd('f1')])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })
})

// ---------------------------------------------------------------------------
// Multiple functions in one doc
// ---------------------------------------------------------------------------

describe('multiple independent functions', () => {
    it('reports errors only for the offending function', () => {
        const d = doc([
            fnStart('trim', 'ok'),
            mention('{{x}}'),
            fnEnd('ok'),
            fnStart('trim', 'bad'),
            mention('{{x}}'),
            fnSep('bad'),
            text('extra'),
            fnEnd('bad'),
        ])
        const errors = typeCheckTiptapDoc(d)
        expect(errors.has('ok')).toBe(false)
        expect(errors.get('bad')).toMatch(/at most/)
    })
})

// ---------------------------------------------------------------------------
// Zero-width space handling — the editor wraps user text with ZWS cursor
// anchors which String.trim() does not strip.
// ---------------------------------------------------------------------------

describe('zero-width space stripping', () => {
    const ZWS = '​'

    it('numeric arg surrounded by ZWS still classifies as number — last_n("hello"; 3)', () => {
        const d = doc([
            fnStart('last_n', 'f1'),
            text(`${ZWS}"hello"${ZWS}`),
            fnSep('f1'),
            text(`${ZWS}3${ZWS}`),
            fnEnd('f1'),
        ])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })

    it('boolean arg surrounded by ZWS still classifies as boolean', () => {
        const d = doc([
            fnStart('if', 'f1'),
            text(`${ZWS}true${ZWS}`),
            fnSep('f1'),
            text(`${ZWS}"a"${ZWS}`),
            fnSep('f1'),
            text(`${ZWS}"b"${ZWS}`),
            fnEnd('f1'),
        ])
        expect(typeCheckTiptapDoc(d).size).toBe(0)
    })
})
