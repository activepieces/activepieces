import { PieceSelectionMode, PieceSetConfig, RequiredActionsMode } from '../../src/lib/ee/piece-set'
import { pieceSetConfigUtil } from '../../src/lib/ee/piece-set/piece-set-config-util'
import { requiredActionsUtil } from '../../src/lib/ee/piece-set/required-actions-util'

const base: PieceSetConfig = {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
}

describe('pieceSetConfigUtil.applyUpdate', () => {
    it('replaces the pieces selection wholesale when provided', () => {
        const result = pieceSetConfigUtil.applyUpdate({
            current: base,
            request: { pieces: { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] } },
        })
        expect(result.pieces).toEqual({ mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] })
    })

    it('leaves the pieces selection untouched when not provided', () => {
        const current = { ...base, pieces: { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] } }
        const result = pieceSetConfigUtil.applyUpdate({ current, request: { actions: {} } })
        expect(result.pieces).toEqual(current.pieces)
    })

    it('sets a selected allow-list and dedupes', () => {
        const result = pieceSetConfigUtil.applyUpdate({
            current: base,
            request: { actions: { slack: { mode: 'selected', selected: ['a', 'a', 'b'] } } },
        })
        expect(result.selectedActions).toEqual({ slack: ['a', 'b'] })
    })

    it('keeps an empty selected array (hide-all) rather than deleting the key', () => {
        const result = pieceSetConfigUtil.applyUpdate({
            current: base,
            request: { actions: { slack: { mode: 'selected', selected: [] } } },
        })
        expect(result.selectedActions).toEqual({ slack: [] })
    })

    it('mode "all" deletes the piece key (reset to all)', () => {
        const current = { ...base, selectedActions: { slack: ['a'], gmail: ['b'] } }
        const result = pieceSetConfigUtil.applyUpdate({
            current,
            request: { actions: { slack: { mode: 'all' } } },
        })
        expect(result.selectedActions).toEqual({ gmail: ['b'] })
    })

    it('merges per-piece: only referenced keys change', () => {
        const current = { ...base, selectedActions: { slack: ['a'], gmail: ['b'] } }
        const result = pieceSetConfigUtil.applyUpdate({
            current,
            request: { actions: { slack: { mode: 'selected', selected: ['c'] } } },
        })
        expect(result.selectedActions).toEqual({ slack: ['c'], gmail: ['b'] })
    })

    it('handles triggers the same way as actions', () => {
        const result = pieceSetConfigUtil.applyUpdate({
            current: base,
            request: { triggers: { slack: { mode: 'selected', selected: ['new_message'] } } },
        })
        expect(result.selectedTriggers).toEqual({ slack: ['new_message'] })
    })
})

describe('pieceSetConfigUtil.emptyConfig', () => {
    it('is fully permissive (include_all, no component selections)', () => {
        expect(pieceSetConfigUtil.emptyConfig()).toEqual({
            pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
            selectedActions: {},
            selectedTriggers: {},
            requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
        })
    })
})

describe('pieceSetConfigUtil.applyUpdate requiredActions', () => {
    it('replaces the list of a piece in the request, dedupes it, and keeps other pieces', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { gmail: ['send'] } } }
        const result = pieceSetConfigUtil.applyUpdate({
            current,
            request: { requiredActions: { actions: { slack: ['post', 'post'] } } },
        })
        expect(result.requiredActions.actions).toEqual({ gmail: ['send'], slack: ['post'] })
    })

    it('removes the piece key when its list is empty', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post'] } } }
        const result = pieceSetConfigUtil.applyUpdate({ current, request: { requiredActions: { actions: { slack: [] } } } })
        expect(result.requiredActions.actions).toEqual({})
    })

    it('changes the mode only when the request has one', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post'] } } }
        expect(pieceSetConfigUtil.applyUpdate({ current, request: { requiredActions: { mode: RequiredActionsMode.ALL } } }).requiredActions)
            .toEqual({ mode: RequiredActionsMode.ALL, actions: { slack: ['post'] } })
        expect(pieceSetConfigUtil.applyUpdate({ current, request: { requiredActions: {} } }).requiredActions.mode).toBe(RequiredActionsMode.ANY)
    })

    it('removes required actions that the same update hides', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post', 'read'] } } }
        const result = pieceSetConfigUtil.applyUpdate({
            current,
            request: { actions: { slack: { mode: 'selected', selected: ['read'] } } },
        })
        expect(result.requiredActions.actions).toEqual({ slack: ['read'] })
    })

    it('removes required actions of a piece that becomes excluded', () => {
        const current = { ...base, requiredActions: { mode: RequiredActionsMode.ANY, actions: { slack: ['post'] } } }
        const result = pieceSetConfigUtil.applyUpdate({
            current,
            request: { pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: ['slack'] } },
        })
        expect(result.requiredActions.actions).toEqual({})
    })
})

describe('requiredActionsUtil.findExcludedRequiredActions', () => {
    it('returns only the actions the config excludes', () => {
        const config = { ...base, selectedActions: { slack: ['read'] } }
        expect(requiredActionsUtil.findExcludedRequiredActions({ config, requiredActions: { slack: ['post', 'read'], gmail: ['send'] } }))
            .toEqual({ slack: ['post'] })
    })
})
