import { describe, expect, it } from 'bun:test'
import { pieceReleaseCompat } from './piece-release-compat'
import type { PieceMetadata } from '../../../packages/pieces/framework/src'

const pieceWith = ({ minimumSupportedRelease, maximumSupportedRelease, name, version }: {
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
    name?: string
    version?: string
}): PieceMetadata => ({
    name: name ?? 'piece-under-test',
    displayName: name ?? 'piece-under-test',
    logoUrl: '',
    description: '',
    authors: [],
    version: version ?? '0.1.0',
    minimumSupportedRelease,
    maximumSupportedRelease,
    actions: {},
    triggers: {},
    contextInfo: undefined,
})

const unsupportedReasonFor = ({ pieceMetadata, currentRelease }: { pieceMetadata: PieceMetadata, currentRelease: string }): string | null =>
    pieceReleaseCompat.findUnsupportedReason({ pieceMetadata, currentRelease })

describe('findUnsupportedReason', () => {
    it('rejects a piece whose minimum is above the release being published', () => {
        const reason = unsupportedReasonFor({ pieceMetadata: pieceWith({ minimumSupportedRelease: '0.86.4' }), currentRelease: '0.86.3' })
        expect(reason).toBe('minimumSupportedRelease 0.86.4 is above it')
    })

    it('passes a piece whose minimum equals the release being published', () => {
        expect(unsupportedReasonFor({ pieceMetadata: pieceWith({ minimumSupportedRelease: '0.86.4' }), currentRelease: '0.86.4' })).toBeNull()
    })

    it('rejects a piece whose maximum is below the release being published', () => {
        const reason = unsupportedReasonFor({ pieceMetadata: pieceWith({ maximumSupportedRelease: '0.86.2' }), currentRelease: '0.86.3' })
        expect(reason).toBe('maximumSupportedRelease 0.86.2 is below it')
    })

    it('passes a piece whose maximum equals the release being published', () => {
        expect(unsupportedReasonFor({ pieceMetadata: pieceWith({ maximumSupportedRelease: '0.86.3' }), currentRelease: '0.86.3' })).toBeNull()
    })

    it('passes a piece that declares no bounds', () => {
        expect(unsupportedReasonFor({ pieceMetadata: pieceWith({}), currentRelease: '0.86.3' })).toBeNull()
    })

    it('bails out when the release being published is not valid semver', () => {
        expect(unsupportedReasonFor({ pieceMetadata: pieceWith({ minimumSupportedRelease: '0.99.0' }), currentRelease: 'not-semver' })).toBeNull()
    })

    it('ignores an unparseable bound instead of throwing', () => {
        expect(unsupportedReasonFor({ pieceMetadata: pieceWith({ minimumSupportedRelease: 'garbage' }), currentRelease: '0.86.4' })).toBeNull()
    })
})

describe('partitionByServability', () => {
    it('keeps the compatible pieces servable and names only the incompatible ones', () => {
        const piecesMetadata = [
            pieceWith({ name: 'no-bounds' }),
            pieceWith({ name: 'min-equal', minimumSupportedRelease: '0.94.0' }),
            pieceWith({ name: 'min-above', minimumSupportedRelease: '0.95.0', version: '1.2.3' }),
            pieceWith({ name: 'max-below', maximumSupportedRelease: '0.93.9' }),
            pieceWith({ name: 'min-below', minimumSupportedRelease: '0.88.2' }),
        ]

        const { servable, unservable } = pieceReleaseCompat.partitionByServability({ piecesMetadata, currentRelease: '0.94.0' })

        expect(servable.map((piece) => piece.name)).toEqual(['no-bounds', 'min-equal', 'min-below'])
        expect(unservable).toEqual([
            'min-above@1.2.3: minimumSupportedRelease 0.95.0 is above it',
            'max-below@0.1.0: maximumSupportedRelease 0.93.9 is below it',
        ])
    })

    it('returns everything as servable when no piece declares an incompatible bound', () => {
        const piecesMetadata = [pieceWith({ name: 'a' }), pieceWith({ name: 'b', minimumSupportedRelease: '0.88.2' })]

        const { servable, unservable } = pieceReleaseCompat.partitionByServability({ piecesMetadata, currentRelease: '0.94.0' })

        expect(servable).toHaveLength(2)
        expect(unservable).toHaveLength(0)
    })
})
