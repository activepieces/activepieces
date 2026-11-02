import { describe, expect, it } from 'vitest'
import { toolResultView } from '../src/tool-result-view'

const records = Array.from({ length: 50 }, (_, index) => ({ id: `r${index}`, name: `Lead ${index}`, properties: { email: `lead${index}@acme.co`, notes: 'x'.repeat(500) } }))
const mcpEnvelope = (text: string) => ({ content: [{ type: 'text', text }], structuredContent: { big: 'y'.repeat(100_000) } })

describe('toolResultView', () => {
    it('measures only the text the model sees, not structuredContent', () => {
        expect(toolResultView.modelVisibleBytes(mcpEnvelope('hello'))).toBe(5)
    })

    it('reads a page of items at a JSON path with picked fields', () => {
        const text = toolResultView.read({ stored: mcpEnvelope(JSON.stringify({ records })), fileId: 'f1', path: 'records', fields: ['id', 'properties.email'], offset: 10, limit: 2 })

        expect(text).toContain('Items 11–12 of 50 at "records"')
        expect(text).toContain('{"id":"r10","properties.email":"lead10@acme.co"}')
        expect(text).not.toContain('notes')
        expect(text).toContain('"offset":12')
    })

    it('finds items by search and reads into nested arrays', () => {
        expect(toolResultView.read({ stored: { records }, fileId: 'f1', path: 'records', search: 'lead42@', fields: ['id'] })).toContain('"r42"')
        expect(toolResultView.read({ stored: { records }, fileId: 'f1', path: 'records[3].properties.email' })).toContain('lead3@acme.co')
    })

    it('names the top-level keys when the path is wrong', () => {
        expect(toolResultView.read({ stored: { records }, fileId: 'f1', path: 'rows' })).toContain('Top-level keys: records')
    })

    it('pages and searches a long text result by lines', () => {
        const text = Array.from({ length: 1000 }, (_, index) => `line ${index}`).join('\n')

        expect(toolResultView.read({ stored: mcpEnvelope(text), fileId: 'f1', offset: 500, limit: 3 })).toContain('Lines 501–503 of 1000:\nline 500\nline 501\nline 502')
        expect(toolResultView.read({ stored: mcpEnvelope(text), fileId: 'f1', search: 'line 777' })).toContain('778: line 777')
    })

    it('previews a text result inside the budget and says where to continue', () => {
        const text = Array.from({ length: 5000 }, (_, index) => `row ${index} ${'z'.repeat(40)}`).join('\n')
        const preview = toolResultView.textPreview({ text, fileId: 'f9', byteSize: 250_000, label: 'ap_get_piece_props' })

        expect(Buffer.byteLength(preview, 'utf8')).toBeLessThan(20 * 1024)
        expect(preview).toMatch(/ap_read_result\(\{"fileId":"f9","offset":\d+/)
    })

    it('falls back to the shape when one item is too big to show whole', () => {
        const text = toolResultView.read({ stored: { records: [{ id: 'r1', notes: 'x'.repeat(60_000) }] }, fileId: 'f1', path: 'records' })

        expect(text).toContain('(shortened;')
        expect(text).toContain('…[truncated')
    })

    it('shows fewer items when a page is too big, and continues from the last item shown', () => {
        const text = toolResultView.read({ stored: { records }, fileId: 'f1', path: 'records', limit: 200 })

        expect(text).not.toContain('(shortened;')
        const shown = Number(/Items 1–(\d+) of 50/.exec(text)?.[1])
        expect(shown).toBeLessThan(50)
        expect(text).toContain(`"offset":${shown}`)
    })

    it('keeps search and fields in the next-page call', () => {
        const text = toolResultView.read({ stored: { records }, fileId: 'f1', path: 'records', search: 'lead', fields: ['id'], limit: 2 })

        expect(text).toContain('"fields":["id"],"search":"lead","offset":2,"limit":2')
    })

    it('pages through a long text line and a long string value instead of clipping them', () => {
        const long = 'a'.repeat(5000) + 'TAIL'
        expect(toolResultView.read({ stored: mcpEnvelope(long), fileId: 'f1', search: 'TAIL' })).toContain('TAIL')
        const body = 'b'.repeat(30_000) + 'END'
        const first = toolResultView.read({ stored: { email: { body } }, fileId: 'f1', path: 'email.body' })
        expect(first).toContain('Lines 1–')
        expect(first).toContain('"path":"email.body"')
        expect(toolResultView.read({ stored: { email: { body } }, fileId: 'f1', path: 'email.body', offset: 15 })).toContain('END')
    })

    it('keeps the text after an embedded JSON block readable', () => {
        const text = `✅ Schemas\n${JSON.stringify({ a: 1 })}\n---\nsecond schema here`
        expect(toolResultView.read({ stored: mcpEnvelope(text), fileId: 'f1', search: 'second schema' })).toContain('second schema here')
    })

    it('reads a string value with the requested line limit', () => {
        const body = Array.from({ length: 50 }, (_, index) => `line ${index}`).join('\n')

        expect(toolResultView.read({ stored: { body }, fileId: 'f1', path: 'body', limit: 1 })).toContain('Lines 1–1 of 50')
    })

    it('stays inside the read budget for a very wide object', () => {
        const wide = Object.fromEntries(Array.from({ length: 5000 }, (_, index) => [`key_${index}`, 'v'.repeat(50)]))
        expect(Buffer.byteLength(toolResultView.read({ stored: wide, fileId: 'f1' }), 'utf8')).toBeLessThan(26 * 1024)
    })

    it('reads a text result by path through its structuredContent', () => {
        const pieces = Array.from({ length: 7 }, (_, index) => ({ name: `piece-${index}`, actions: Array.from({ length: 60 }, (__, action) => ({ name: `a${action}` })) }))
        const stored = { content: [{ type: 'text', text: `✅ Researched 7 piece(s)\n${JSON.stringify(pieces)}\n📤 Output fields: id` }], structuredContent: { pieces } }

        expect(toolResultView.read({ stored, fileId: 'f2', path: 'pieces[2].actions', fields: ['name'], limit: 3 })).toContain('Items 1–3 of 60 at "pieces[2].actions":\n[{"name":"a0"},{"name":"a1"},{"name":"a2"}]')
        expect(toolResultView.read({ stored, fileId: 'f2', search: 'Output fields' })).toContain('📤 Output fields: id')
    })

})
