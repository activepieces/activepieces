import { createHash } from 'node:crypto'

/**
 * The minimal, model-agnostic shape the retrieval document is built from.
 * The reindex layer maps a piece_metadata action/trigger entry onto this; keeping
 * the builder pure (no entity coupling) is what makes the index↔query text symmetry
 * test possible and cheap.
 */
export type RetrievalDocInput = {
    pieceDisplayName: string
    objectDisplayName: string
    objectKind: 'action' | 'trigger'
    /** The raw piece description (fallback). */
    description?: string
    /** Curated aiMetadata.description — preferred when present. */
    aiDescription?: string
}

/**
 * Build the query-shaped document that gets embedded. Format (ENGINE_IMPLEMENTATION §4.2):
 *
 *   <piece displayName> · <object displayName>
 *   <aiMetadata.description ?? description>      (line omitted when neither is set)
 *   [kind: action|trigger]
 *
 * MUST be deterministic and used as the single source of truth for the embedded text,
 * both at reindex time and anywhere else text is (re)built — this is the StackOne
 * train/eval-text-mismatch guard.
 */
export function buildRetrievalDoc(input: RetrievalDocInput): string {
    const description = (input.aiDescription ?? input.description)?.trim()
    const lines = [
        `${input.pieceDisplayName} · ${input.objectDisplayName}`,
        ...(description ? [description] : []),
        `[kind: ${input.objectKind}]`,
    ]
    return lines.join('\n')
}

/**
 * Recover the description that {@link buildRetrievalDoc} embedded, by stripping the always-present
 * first line (`<piece> · <object>`) and last line (`[kind: ...]`). Lets the query envelope return a
 * `oneLineDescription` straight from the stored `retrieval_doc` — no separate description column,
 * and the doc format stays owned by this one module. Returns undefined when no description was set.
 */
export function extractRetrievalDocDescription(retrievalDoc: string): string | undefined {
    const lines = retrievalDoc.split('\n')
    const description = lines.slice(1, -1).join('\n')
    return description.length > 0 ? description : undefined
}

/**
 * Content hash that gates re-embedding. `modelVersion` (model id + dimension) is folded
 * in so a model/dim swap invalidates every row's hash automatically (ENGINE_IMPLEMENTATION §4.3).
 */
export function computeEmbeddingInputHash(retrievalDoc: string, modelVersion: string): string {
    return createHash('sha256').update(`${retrievalDoc}|${modelVersion}`).digest('hex')
}
