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
        expect(text).toContain('offset: 12')
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
        expect(preview).toMatch(/ap_read_result\(\{ fileId: 'f9', offset: \d+ \}\)/)
    })

    it('falls back to the shape when a value is too big to show whole', () => {
        const text = toolResultView.read({ stored: { records }, fileId: 'f1', path: 'records', limit: 200 })

        expect(text).toContain('too large to show whole')
        expect(text).toContain('…+')
    })

    it('reads JSON embedded after a text header, and previews it shrunk with the trailing notes kept', () => {
        const pieces = Array.from({ length: 7 }, (_, index) => ({ name: `piece-${index}`, actions: Array.from({ length: 60 }, (__, action) => ({ name: `a${action}`, aiDescription: 'd'.repeat(400) })) }))
        const text = `✅ Researched 7 piece(s)\n\n${JSON.stringify(pieces)}\n📤 Output fields: id, email`
        const preview = toolResultView.textPreview({ text, fileId: 'f2', byteSize: 200_000, label: 'ap_research_pieces' })

        expect(Buffer.byteLength(preview, 'utf8')).toBeLessThanOrEqual(16 * 1024 + 2048)
        expect(preview).toContain('piece-6')
        expect(preview).toContain('📤 Output fields: id, email')
        expect(toolResultView.read({ stored: { content: [{ type: 'text', text }] }, fileId: 'f2', path: '[2].actions', fields: ['name'], limit: 3 })).toContain('Items 1–3 of 60 at "[2].actions":\n[{"name":"a0"},{"name":"a1"},{"name":"a2"}]')
    })
})
