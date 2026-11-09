import { describe, expect, it } from 'vitest'
import { ApplicationEventName, buildMockEvent, PieceCreatedEvent, PieceVersionCreatedEvent, summarizeApplicationEvent } from '../../src/index'

describe('piece catalog mock events', () => {
    it('builds a piece.version.created mock with a minor change and a previous version', () => {
        const event = PieceVersionCreatedEvent.parse(buildMockEvent({ event: ApplicationEventName.PIECE_VERSION_CREATED, platformId: 'platform-id' }))
        expect(event.platformId).toBe('platform-id')
        expect(event.data.piece.name).toBe('@activepieces/piece-gmail')
        expect(event.data.piece.changeType).toBe('minor')
        expect(event.data.piece.previousVersion).toBe('0.8.3')
        expect(event.data.piece.version).toBe('0.9.0')
        expect(event).not.toHaveProperty('projectId')
        expect(event).not.toHaveProperty('userId')
        expect(event).not.toHaveProperty('ip')
    })

    it('builds a piece.created mock with a new change and no previous version', () => {
        const event = PieceCreatedEvent.parse(buildMockEvent({ event: ApplicationEventName.PIECE_CREATED, platformId: 'platform-id' }))
        expect(event.data.piece.changeType).toBe('new')
        expect(event.data.piece.previousVersion).toBeNull()
        expect(event).not.toHaveProperty('projectId')
        expect(event).not.toHaveProperty('userId')
        expect(event).not.toHaveProperty('ip')
    })

    it.each([
        { event: ApplicationEventName.PIECE_CREATED, expected: 'Piece Gmail added' },
        { event: ApplicationEventName.PIECE_VERSION_CREATED, expected: 'Piece Gmail updated 0.8.3 → 0.9.0' },
    ])('summarizes $event as "$expected"', ({ event, expected }) => {
        expect(summarizeApplicationEvent(buildMockEvent({ event, platformId: 'platform-id' }))).toBe(expected)
    })
})
