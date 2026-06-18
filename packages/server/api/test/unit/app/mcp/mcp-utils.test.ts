import { PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { mcpUtils } from '../../../../src/app/mcp/tools/mcp-utils'

function shortText(displayName: string) {
    return { type: PropertyType.SHORT_TEXT, displayName, required: false }
}

describe('mcpUtils.diagnosePieceProps — unknown property suggestions', () => {
    it('suggests the containing key when an abbreviation is passed (scope → store_scope)', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope'), key: shortText('Key') },
            input: { scope: 'PROJECT', key: 'k' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.unknownKeys).toContain('scope')
        const text = diagnosis.parts.join('\n')
        expect(text).toContain("did you mean 'store_scope'?")
    })

    it('suggests the closest key for a typo within edit-distance threshold', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope') },
            input: { store_scop: 'PROJECT' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.parts.join('\n')).toContain("did you mean 'store_scope'?")
    })

    it('does not invent a suggestion for an unrelated unknown key', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope') },
            input: { xyz: '1' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.unknownKeys).toContain('xyz')
        expect(diagnosis.parts.join('\n')).not.toContain('did you mean')
    })

    it('reports no unknown keys for a fully valid input', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope'), key: shortText('Key') },
            input: { store_scope: 'PROJECT', key: 'k' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.unknownKeys).toEqual([])
    })
})

describe('mcpUtils.flattenOutputSchemaFields — declared output schema → reference paths', () => {
    it('flattens nested objects, arrays, formats, and dynamic keys', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'id', format: 'number' },
            { key: 'author', children: [{ key: 'name' }, { key: 'email', format: 'email' }] },
            { key: 'messages', listItems: [{ key: 'text' }] },
            { key: 'dyn', dynamicKey: true },
        ])
        expect(paths).toEqual([
            'id (number)',
            'author.name',
            'author.email (email)',
            'messages[].text',
            'dyn (dynamic key)',
        ])
    })

    it('returns an empty list when there are no fields', () => {
        expect(mcpUtils.flattenOutputSchemaFields([])).toEqual([])
    })

    it('flattens arbitrarily deep schemas without dropping fields', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'l1', children: [{ key: 'l2', children: [{ key: 'l3', children: [{ key: 'l4', children: [{ key: 'l5', children: [{ key: 'l6', format: 'number' }] }] }] }] }] },
        ])
        expect(paths).toEqual(['l1.l2.l3.l4.l5.l6 (number)'])
    })
})

describe('mcpUtils.deriveFieldPathsFromSample — trigger sample data → reference paths', () => {
    it('derives typed paths from a nested sample object with arrays', () => {
        const paths = mcpUtils.deriveFieldPathsFromSample({
            action: 'opened',
            issue: { id: 5, title: 'Bug', user: { login: 'octocat' } },
            labels: [{ name: 'bug' }],
        })
        expect(paths).toContain('action (string)')
        expect(paths).toContain('issue.id (number)')
        expect(paths).toContain('issue.title (string)')
        expect(paths).toContain('issue.user.login (string)')
        expect(paths).toContain('labels[].name (string)')
    })

    it('returns an empty list for an empty sample object', () => {
        expect(mcpUtils.deriveFieldPathsFromSample({})).toEqual([])
    })
})
