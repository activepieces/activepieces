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
