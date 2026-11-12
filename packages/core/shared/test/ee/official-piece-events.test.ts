import { describe, expect, it } from 'vitest'
import { ApplicationEventName, buildMockEvent, OfficialPieceAddedEvent, OfficialPiecePatchVersionAddedEvent, OfficialPieceMinorOrMajorVersionAddedEvent, summarizeApplicationEvent } from '../../src/index'

describe('official piece mock events', () => {
    it('builds a official_piece.minor_or_major_version.added mock with a minor change and a previous version', () => {
        const event = OfficialPieceMinorOrMajorVersionAddedEvent.parse(buildMockEvent({ event: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED, platformId: 'platform-id' }))
        expect(event.platformId).toBe('platform-id')
        expect(event.data.piece.name).toBe('@activepieces/piece-gmail')
        expect(event.data.piece.changeType).toBe('minor')
        expect(event.data.piece.previousVersion).toBe('0.8.3')
        expect(event.data.piece.version).toBe('0.9.0')
        expect(event.data.piece.maximumSupportedRelease).toBeNull()
        expect(event).not.toHaveProperty('projectId')
        expect(event).not.toHaveProperty('userId')
        expect(event).not.toHaveProperty('ip')
    })

    it('builds a official_piece.added mock with a new change and no previous version', () => {
        const event = OfficialPieceAddedEvent.parse(buildMockEvent({ event: ApplicationEventName.OFFICIAL_PIECE_ADDED, platformId: 'platform-id' }))
        expect(event.data.piece.changeType).toBe('new')
        expect(event.data.piece.previousVersion).toBeNull()
        expect(event).not.toHaveProperty('projectId')
        expect(event).not.toHaveProperty('userId')
        expect(event).not.toHaveProperty('ip')
    })

    it('builds a official_piece.patch_version.added mock with a patch change', () => {
        const event = OfficialPiecePatchVersionAddedEvent.parse(buildMockEvent({ event: ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED, platformId: 'platform-id' }))
        expect(event.data.piece.changeType).toBe('patch')
        expect(event.data.piece.previousVersion).toBe('0.9.0')
        expect(event.data.piece.version).toBe('0.9.1')
    })

    it.each([
        { event: ApplicationEventName.OFFICIAL_PIECE_ADDED, expected: 'Piece Gmail added' },
        { event: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED, expected: 'Piece Gmail updated 0.8.3 → 0.9.0' },
        { event: ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED, expected: 'Piece Gmail updated 0.9.0 → 0.9.1' },
    ])('summarizes $event as "$expected"', ({ event, expected }) => {
        expect(summarizeApplicationEvent(buildMockEvent({ event, platformId: 'platform-id' }))).toBe(expected)
    })
})
