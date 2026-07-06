import { describe, expect, it } from 'vitest'
import {
    buildRetrievalDoc,
    computeEmbeddingInputHash,
    extractRetrievalDocDescription,
    RetrievalDocInput,
} from '../../../../src/app/tool-search/retrieval-doc'

const fullInput = (): RetrievalDocInput => ({
    pieceDisplayName: 'Slack',
    objectDisplayName: 'Send Channel Message',
    objectKind: 'action',
    description: 'Send a message to a Slack channel',
    aiDescription: 'Use this to post a message into a Slack channel as the bot.',
})

describe('buildRetrievalDoc', () => {
    it('builds the documented doc shape: "<piece> · <object>" / description / [kind]', () => {
        const doc = buildRetrievalDoc(fullInput())
        expect(doc).toBe(
            'Slack · Send Channel Message\n' +
            'Use this to post a message into a Slack channel as the bot.\n' +
            '[kind: action]',
        )
    })

    it('prefers aiDescription over the plain description', () => {
        const doc = buildRetrievalDoc(fullInput())
        expect(doc).toContain('Use this to post a message into a Slack channel as the bot.')
        expect(doc).not.toContain('Send a message to a Slack channel')
    })

    it('falls back to the plain description when aiDescription is absent', () => {
        const doc = buildRetrievalDoc({ ...fullInput(), aiDescription: undefined })
        expect(doc).toContain('Send a message to a Slack channel')
    })

    it('omits the description line entirely when no description is available', () => {
        const doc = buildRetrievalDoc({
            pieceDisplayName: 'Slack',
            objectDisplayName: 'Send Channel Message',
            objectKind: 'action',
        })
        expect(doc).toBe('Slack · Send Channel Message\n[kind: action]')
    })

    it('tags triggers as [kind: trigger]', () => {
        const doc = buildRetrievalDoc({ ...fullInput(), objectKind: 'trigger' })
        expect(doc.endsWith('[kind: trigger]')).toBe(true)
    })

    it('is deterministic for identical input (the index↔query symmetry guard)', () => {
        const a = buildRetrievalDoc(fullInput())
        const b = buildRetrievalDoc(fullInput())
        expect(a).toBe(b)
    })

    it('trims surrounding whitespace from the chosen description', () => {
        const doc = buildRetrievalDoc({ ...fullInput(), aiDescription: '  spaced out  ' })
        expect(doc).toContain('\nspaced out\n')
    })
})

describe('extractRetrievalDocDescription', () => {
    it('recovers the description that was embedded into the doc', () => {
        const doc = buildRetrievalDoc(fullInput())
        expect(extractRetrievalDocDescription(doc)).toBe(
            'Use this to post a message into a Slack channel as the bot.',
        )
    })

    it('returns undefined when the doc has no description line', () => {
        const doc = buildRetrievalDoc({
            pieceDisplayName: 'Slack',
            objectDisplayName: 'Send Channel Message',
            objectKind: 'action',
        })
        expect(extractRetrievalDocDescription(doc)).toBeUndefined()
    })

    it('round-trips a multi-line description (header + kind line stripped only)', () => {
        const doc = buildRetrievalDoc({
            pieceDisplayName: 'Slack',
            objectDisplayName: 'Send Channel Message',
            objectKind: 'action',
            description: 'line one\nline two',
        })
        expect(extractRetrievalDocDescription(doc)).toBe('line one\nline two')
    })
})

describe('computeEmbeddingInputHash', () => {
    const MODEL = 'openai:text-embedding-3-small:1024'

    it('is stable for the same (doc, modelVersion)', () => {
        const doc = buildRetrievalDoc(fullInput())
        expect(computeEmbeddingInputHash(doc, MODEL)).toBe(computeEmbeddingInputHash(doc, MODEL))
    })

    it('changes when the doc text changes (forces a re-embed)', () => {
        const a = computeEmbeddingInputHash('doc one', MODEL)
        const b = computeEmbeddingInputHash('doc two', MODEL)
        expect(a).not.toBe(b)
    })

    it('changes when the model version changes (model/dim swap invalidates the cache)', () => {
        const doc = buildRetrievalDoc(fullInput())
        const a = computeEmbeddingInputHash(doc, 'openai:text-embedding-3-small:1024')
        const b = computeEmbeddingInputHash(doc, 'openai:text-embedding-3-small:768')
        expect(a).not.toBe(b)
    })

    it('returns a hex sha256 digest (64 hex chars)', () => {
        const hash = computeEmbeddingInputHash('anything', MODEL)
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
})
