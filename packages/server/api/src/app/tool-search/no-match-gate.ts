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
 * `NaN`) — or a missing cosine — abstains, the safe direction, instead of leaking unranked rows. (The
 * cosine is optional only to share the row type with the keyword floor; the gate runs on semantic rows.)
 */
export function applyNoMatchGate<T extends { cosine?: number }>(results: T[], tau: number): T[] {
    const top = results[0]
    if (top === undefined || !(typeof top.cosine === 'number' && top.cosine >= tau)) {
        return []
    }
    return results
}
