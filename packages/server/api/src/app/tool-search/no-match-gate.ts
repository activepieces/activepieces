/**
 * The τ no-match gate — honest abstention, the edge Composio lacks (DECISION_REPORT §5).
 *
 * Pure decision over an already-ranked candidate list: the gate is calibrated on the TOP-1 cosine
 * (bounded and query-comparable for the semantic path), NOT applied per-result. If the single best
 * candidate clears τ the query is answerable and the full ranked top-k is returned; otherwise the
 * engine returns an empty list rather than confident junk. τ is a per-model constant carried on the
 * embedder seam (recalibrate on model swap).
 *
 * `!(top.cosine >= tau)` rather than `top.cosine < tau` so a degenerate/zero query vector (cosine
 * `NaN`) abstains — the safe direction — instead of leaking unranked rows.
 */
export function applyNoMatchGate<T extends { cosine: number }>(results: T[], tau: number): T[] {
    const top = results[0]
    if (top === undefined || !(top.cosine >= tau)) {
        return []
    }
    return results
}
