import { readFileSync } from 'node:fs'
import path from 'node:path'
import { repoRoot } from '../core/repo-root'
import { LiveScorecard, ScenarioScore } from './tagger'

// C3 — close the loop. Read a scorecard the live harness produced and surface the scenarios where the
// agent thrashed (stuck, repeated empty reads, wrong instrument, many hops). Each becomes a candidate
// for a curated note in piece-expertise.ts — so a failure the harness catches once becomes mastery the
// agent keeps. This is the deterministic part; a human (or a follow-up agent) writes the actual note
// from the suggestion, keeping curation high-quality rather than auto-generated guesswork.
function candidatesFrom(scorecard: LiveScorecard): ExpertiseCandidate[] {
    return scorecard.scores
        .filter(isThrash)
        .map((s) => ({
            piece: s.targetPiece ?? '(unknown)',
            scenarioId: s.scenarioId,
            reason: reasonFor(s),
            suggestedNote: suggestNote(s),
            toolSequence: s.toolSequence,
        }))
}

function isThrash(s: ScenarioScore): boolean {
    return s.outcome === 'stuck' || s.breakerHits > 0 || s.rightInstrument === false || (s.hopsBeforeFirstExecute ?? 0) > 8
}

function reasonFor(s: ScenarioScore): string {
    const parts: string[] = []
    if (s.rightInstrument === false) parts.push('used a find-one action for an enumerate intent')
    if (s.breakerHits > 0) parts.push(`hit the repeat-breaker ${s.breakerHits}×`)
    if (s.outcome === 'stuck') parts.push('never reached a runnable call')
    if ((s.hopsBeforeFirstExecute ?? 0) > 8) parts.push(`${s.hopsBeforeFirstExecute} hops to first action`)
    if (s.badArgRejections > 0) parts.push(`${s.badArgRejections} bad-arg rejection(s)`)
    return parts.join('; ') || 'thrash'
}

function suggestNote(s: ScenarioScore): string {
    if (s.rightInstrument === false) {
        return `For ${s.piece ?? 'this piece'}: the enumerate action (list_*/search_*) is the right instrument for "show all" intents; find_* returns a single match.`
    }
    if (s.badArgRejections > 0) {
        return `For ${s.piece ?? 'this piece'}: document the field formats/ids that caused the bad-arg rejections so they're filled right first try.`
    }
    return `For ${s.piece ?? 'this piece'}: capture the discovery/auth quirk that caused the thrash so it resolves in one pass next time.`
}

function loadScorecard(file: string): LiveScorecard {
    const abs = path.isAbsolute(file) ? file : path.join(repoRoot, file)
    return JSON.parse(readFileSync(abs, 'utf8')) as LiveScorecard
}

export const expertiseFromThrash = {
    candidatesFrom,
    loadScorecard,
}

export type ExpertiseCandidate = {
    piece: string
    scenarioId: string
    reason: string
    suggestedNote: string
    toolSequence: string[]
}
