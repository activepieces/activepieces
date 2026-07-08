import { describe, expect, it } from 'vitest'
import {
    OPENAI_3_SMALL_DIMENSIONS,
    OPENAI_3_SMALL_MODEL_VERSION,
    OPENAI_3_SMALL_TAU,
    l2normalize,
    selectEmbedder,
} from '../../../../src/app/tool-search/embedder'

const norm = (v: number[]): number => Math.sqrt(v.reduce((acc, x) => acc + x * x, 0))

describe('l2normalize', () => {
    it('scales a vector to unit length', () => {
        expect(norm(l2normalize([3, 4]))).toBeCloseTo(1, 10)
    })

    it('preserves direction (output is proportional to input)', () => {
        const out = l2normalize([3, 4])
        expect(out[0] / out[1]).toBeCloseTo(3 / 4, 10)
    })

    it('returns a unit vector for higher dimensions', () => {
        expect(norm(l2normalize([1, 1, 1, 1]))).toBeCloseTo(1, 10)
    })

    it('returns zeros for a zero vector instead of NaN (no divide-by-zero)', () => {
        expect(l2normalize([0, 0, 0])).toEqual([0, 0, 0])
    })
})

describe('selectEmbedder', () => {
    it('returns null when no api key is configured', () => {
        expect(selectEmbedder(null)).toBeNull()
        expect(selectEmbedder(undefined)).toBeNull()
        expect(selectEmbedder('')).toBeNull()
    })

    it('returns the OpenAI 3-small embedder when a key is present', () => {
        const embedder = selectEmbedder('sk-test-key')
        expect(embedder).not.toBeNull()
        expect(embedder?.modelVersion).toBe(OPENAI_3_SMALL_MODEL_VERSION)
        expect(embedder?.dimensions).toBe(OPENAI_3_SMALL_DIMENSIONS)
        expect(embedder?.tau).toBe(OPENAI_3_SMALL_TAU)
        expect(typeof embedder?.embed).toBe('function')
    })

    it('pins the model version to model id + dimension (drives hash invalidation on swap)', () => {
        expect(OPENAI_3_SMALL_MODEL_VERSION).toBe('openai:text-embedding-3-small:1024')
        expect(OPENAI_3_SMALL_DIMENSIONS).toBe(1024)
    })
})
