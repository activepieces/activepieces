import { PieceSetConfig } from '@activepieces/shared'
import { pieceSetConfig } from '../../../../../src/app/ee/pieces/piece-set/piece-set-config'

const base: PieceSetConfig = {
    pieces: { mode: 'include_all', exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
}

describe('pieceSetConfig.applyUpdate', () => {
    it('replaces the pieces selection wholesale when provided', () => {
        const result = pieceSetConfig.applyUpdate({
            current: base,
            request: { pieces: { mode: 'exclude_all', exceptions: ['slack'] } },
        })
        expect(result.pieces).toEqual({ mode: 'exclude_all', exceptions: ['slack'] })
    })

    it('leaves the pieces selection untouched when not provided', () => {
        const current = { ...base, pieces: { mode: 'exclude_all' as const, exceptions: ['slack'] } }
        const result = pieceSetConfig.applyUpdate({ current, request: { actions: {} } })
        expect(result.pieces).toEqual(current.pieces)
    })

    it('sets a selected allow-list and dedupes', () => {
        const result = pieceSetConfig.applyUpdate({
            current: base,
            request: { actions: { slack: { mode: 'selected', selected: ['a', 'a', 'b'] } } },
        })
        expect(result.selectedActions).toEqual({ slack: ['a', 'b'] })
    })

    it('keeps an empty selected array (hide-all) rather than deleting the key', () => {
        const result = pieceSetConfig.applyUpdate({
            current: base,
            request: { actions: { slack: { mode: 'selected', selected: [] } } },
        })
        expect(result.selectedActions).toEqual({ slack: [] })
    })

    it('mode "all" deletes the piece key (reset to all)', () => {
        const current = { ...base, selectedActions: { slack: ['a'], gmail: ['b'] } }
        const result = pieceSetConfig.applyUpdate({
            current,
            request: { actions: { slack: { mode: 'all' } } },
        })
        expect(result.selectedActions).toEqual({ gmail: ['b'] })
    })

    it('merges per-piece: only referenced keys change', () => {
        const current = { ...base, selectedActions: { slack: ['a'], gmail: ['b'] } }
        const result = pieceSetConfig.applyUpdate({
            current,
            request: { actions: { slack: { mode: 'selected', selected: ['c'] } } },
        })
        expect(result.selectedActions).toEqual({ slack: ['c'], gmail: ['b'] })
    })

    it('handles triggers the same way as actions', () => {
        const result = pieceSetConfig.applyUpdate({
            current: base,
            request: { triggers: { slack: { mode: 'selected', selected: ['new_message'] } } },
        })
        expect(result.selectedTriggers).toEqual({ slack: ['new_message'] })
    })
})

describe('pieceSetConfig.emptyConfig', () => {
    it('is fully permissive (include_all, no component selections)', () => {
        expect(pieceSetConfig.emptyConfig()).toEqual({
            pieces: { mode: 'include_all', exceptions: [] },
            selectedActions: {},
            selectedTriggers: {},
        })
    })
})
