import { isComponentVisible, isPieceVisible, PieceSelectionMode } from '../../src/lib/ee/piece-set'

describe('piece set visibility resolvers', () => {
    describe('isPieceVisible', () => {
        it('include_all: everything visible except listed', () => {
            const pieces = { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: ['gmail'] }
            expect(isPieceVisible({ pieces, name: 'slack' })).toBe(true)
            expect(isPieceVisible({ pieces, name: 'gmail' })).toBe(false)
        })

        it('exclude_all: only listed visible (future hidden)', () => {
            const pieces = { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: ['slack'] }
            expect(isPieceVisible({ pieces, name: 'slack' })).toBe(true)
            expect(isPieceVisible({ pieces, name: 'gmail' })).toBe(false)
        })

        it('exclude_all with empty exceptions hides everything', () => {
            const pieces = { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: [] }
            expect(isPieceVisible({ pieces, name: 'slack' })).toBe(false)
        })
    })

    describe('isComponentVisible', () => {
        it('absent selection (undefined) means all visible, including new', () => {
            expect(isComponentVisible({ selected: undefined, name: 'anything' })).toBe(true)
        })

        it('present selection is an allow-list', () => {
            expect(isComponentVisible({ selected: ['send_message'], name: 'send_message' })).toBe(true)
            expect(isComponentVisible({ selected: ['send_message'], name: 'new_action' })).toBe(false)
        })

        it('empty selection hides everything for that piece', () => {
            expect(isComponentVisible({ selected: [], name: 'send_message' })).toBe(false)
        })
    })
})
