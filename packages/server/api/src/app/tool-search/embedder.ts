import { createOpenAI } from '@ai-sdk/openai'
import { embedMany } from 'ai'

/**
 * The embedder seam — everything above the embedding call is identical across deployments;
 * the model is injected. Phase 1 ships only the OpenAI path; the in-process self-host model
 * (v3-minilm) is a later additive implementation behind this same interface (ENGINE_IMPLEMENTATION §3).
 */
export type ToolSearchEmbedder = {
    /** model id + dimension; goes into model_version + the embedding_input_hash. */
    modelVersion: string
    /** must match the index column dimension. */
    dimensions: number
    /** model-specific no-match gate (recalibrate on swap). */
    tau: number
    /** returns L2-normalized vectors, one per input text. */
    embed(texts: string[]): Promise<number[][]>
}

export const OPENAI_3_SMALL_MODEL_VERSION = 'openai:text-embedding-3-small:1024'
export const OPENAI_3_SMALL_DIMENSIONS = 1024
/** Calibrated for 3-small/1024 on heldout-v1 (DECISION_REPORT §5); recalibrate per shipped model. */
export const OPENAI_3_SMALL_TAU = 0.53

const OPENAI_3_SMALL_MODEL_ID = 'text-embedding-3-small'

/**
 * Scale a vector to unit length so cosine `<=>` and the τ gate match the offline calibration.
 * A zero vector is returned unchanged (zeros) rather than producing NaN.
 */
export function l2normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((acc, x) => acc + x * x, 0))
    if (magnitude === 0) {
        return vector.map(() => 0)
    }
    return vector.map((x) => x / magnitude)
}

/**
 * Search-LOCAL OpenAI embedder at 1024-d. Deliberately does NOT touch AP's shared
 * `createEmbeddingModel` (hardcoded 768-d, ai-sdk.ts:222) — it constructs its own provider
 * and passes `dimensions: 1024` so the KB/agent path is unaffected (ENGINE_IMPLEMENTATION §3).
 */
export function createOpenAiEmbedder(apiKey: string): ToolSearchEmbedder {
    const model = createOpenAI({ apiKey }).embeddingModel(OPENAI_3_SMALL_MODEL_ID)
    return {
        modelVersion: OPENAI_3_SMALL_MODEL_VERSION,
        dimensions: OPENAI_3_SMALL_DIMENSIONS,
        tau: OPENAI_3_SMALL_TAU,
        async embed(texts: string[]): Promise<number[][]> {
            const { embeddings } = await embedMany({
                model,
                values: texts,
                providerOptions: { openai: { dimensions: OPENAI_3_SMALL_DIMENSIONS } },
            })
            return embeddings.map(l2normalize)
        },
    }
}

/**
 * Pure selection seam: given the resolved api key (null/empty = nothing configured),
 * return the embedder or `null`. A `null` return is the signal to degrade to the keyword
 * floor (ENGINE_IMPLEMENTATION §8). The DB-coupled key lookup lives in the resolve wrapper.
 */
export function selectEmbedder(apiKey: string | null | undefined): ToolSearchEmbedder | null {
    if (!apiKey) {
        return null
    }
    return createOpenAiEmbedder(apiKey)
}
