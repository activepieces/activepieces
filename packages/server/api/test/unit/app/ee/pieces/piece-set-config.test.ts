import { PieceSelectionMode, PieceSetConfig, RequiredActionsMode, requiredActionsUtil } from '@activepieces/shared'
import { pieceSetConfig } from '../../../../../src/app/ee/pieces/piece-set/piece-set-config'

const base: PieceSetConfig = {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
}

describe('pieceSetConfig.applyUpdate', () => {
    it('replaces the pieces selection wholesale when provided', () => {
        const result = pieceSetConfig.applyUpdate({
            current: base,
            request: { pieces: { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] } },
        })
        expect(result.pieces).toEqual({ mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] })
    })

    it('leaves the pieces selection untouched when not provided', () => {
        const current = { ...base, pieces: { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] } }
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
            pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
            selectedActions: {},
            selectedTriggers: {},
            requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
        })
    })
})

describe('pieceSetConfig.applyUpdate requiredActions', () => {
    it('replaces the list of a piece in the request, dedupes it, and keeps other pieces', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { gmail: ['send'] } } }
        const result = pieceSetConfig.applyUpdate({
            current,
            request: { requiredActions: { actions: { slack: ['post', 'post'] } } },
        })
        expect(result.requiredActions.actions).toEqual({ gmail: ['send'], slack: ['post'] })
    })

    it('removes the piece key when its list is empty', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post'] } } }
        const result = pieceSetConfig.applyUpdate({ current, request: { requiredActions: { actions: { slack: [] } } } })
        expect(result.requiredActions.actions).toEqual({})
    })

    it('changes the mode only when the request has one', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post'] } } }
        expect(pieceSetConfig.applyUpdate({ current, request: { requiredActions: { mode: RequiredActionsMode.ALL } } }).requiredActions)
            .toEqual({ mode: RequiredActionsMode.ALL, actions: { slack: ['post'] } })
        expect(pieceSetConfig.applyUpdate({ current, request: { requiredActions: {} } }).requiredActions.mode).toBe(RequiredActionsMode.ANY)
    })

    it('removes required actions that the same update hides', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post', 'read'] } } }
        const result = pieceSetConfig.applyUpdate({
            current,
            request: { actions: { slack: { mode: 'selected', selected: ['read'] } } },
        })
        expect(result.requiredActions.actions).toEqual({ slack: ['read'] })
    })

    it('removes required actions of a piece that becomes hidden', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post'] } } }
        const result = pieceSetConfig.applyUpdate({
            current,
            request: { pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: ['slack'] } },
        })
        expect(result.requiredActions.actions).toEqual({})
    })
})

describe('requiredActionsUtil.findHiddenRequiredActions', () => {
    it('returns only the actions the config hides', () => {
        const config = { ...base, selectedActions: { slack: ['read'] } }
        expect(requiredActionsUtil.findHiddenRequiredActions({ config, requiredActions: { slack: ['post', 'read'], gmail: ['send'] } }))
            .toEqual({ slack: ['post'] })
    })
})
