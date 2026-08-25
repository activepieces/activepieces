import { LiveScorecard, ScenarioScore } from './tagger'

// Render the scorecard as a scannable markdown report: headline metrics, a per-shape
// breakdown (which input kinds the harness handles vs. fumbles), and a per-scenario table.
function toMarkdown({ scorecard, label, mode, modelId }: { scorecard: LiveScorecard, label: string, mode: string, modelId: string }): string {
    const discovery = mode === 'discovery'
    const succeededLabel = discovery ? 'reached a runnable call' : 'succeeded (goal met)'
    const gaveUpLabel = discovery ? 'stuck in discovery (never reached a call)' : 'gave up (expected exec, none succeeded)'
    const lines: string[] = []
    lines.push(`# Chat harness — failure-mode scorecard (${label})`)
    lines.push('')
    lines.push(`Model: \`${modelId}\` · mode: \`${mode}\` · scenarios: ${scorecard.scenarioCount}`)
    if (discovery) {
        lines.push('')
        lines.push('> Discovery-only run: `ap_execute_action` was neutralized (no side effects). "reached a runnable call" = the agent navigated discovery to a well-formed execute; external-API success is not measured here.')
    }
    lines.push('')
    lines.push('## Headline')
    lines.push('')
    lines.push('| metric | value |')
    lines.push('| --- | --- |')
    lines.push(`| reached/executed a call | ${scorecard.executedCount}/${scorecard.scenarioCount} |`)
    lines.push(`| ${succeededLabel} | ${scorecard.succeededCount}/${scorecard.scenarioCount} |`)
    lines.push(`| blocked on a missing connection (not a failure) | ${scorecard.blockedOnConnectionCount} |`)
    lines.push(`| ${gaveUpLabel} | ${scorecard.gaveUpCount} |`)
    lines.push(`| avg tool calls / scenario | ${scorecard.avgToolCalls} |`)
    lines.push(`| avg discovery calls / scenario | ${scorecard.avgDiscoveryCalls} |`)
    lines.push(`| avg hops before first execute | ${fmt(scorecard.avgHopsBeforeExecute)} |`)
    lines.push(`| bad-arg rejections (total) | ${scorecard.totalBadArgRejections} |`)
    lines.push(`| auth/connection blocked (total) | ${scorecard.totalAuthBlocked} |`)
    lines.push(`| other tool errors (total) | ${scorecard.totalOtherErrors} |`)
    lines.push(`| breaker hits (✋, total) | ${scorecard.totalBreakerHits} |`)
    lines.push(`| schema re-fetches "forgot" (total) | ${scorecard.totalSchemaRefetches} |`)
    lines.push(`| wrong instrument (find vs list) | ${scorecard.wrongInstrumentCount}/${scorecard.rightInstrumentGraded} graded |`)
    lines.push(`| native task handled (HTTP/code) | ${scorecard.nativeHandledCount}/${scorecard.nativeGraded} graded |`)
    lines.push('')
    lines.push('## By input shape')
    lines.push('')
    lines.push('| shape | n | succeeded | avg hops | bad-args | breaker | re-fetch |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- |')
    for (const [shape, group] of groupByShape(scorecard.scores)) {
        const execHops = group.filter((s) => s.hopsBeforeFirstExecute !== null)
        const avgHops = execHops.length > 0 ? round(execHops.reduce((a, s) => a + (s.hopsBeforeFirstExecute ?? 0), 0) / execHops.length) : null
        lines.push(`| ${shape} | ${group.length} | ${group.filter((s) => s.executeSucceeded).length} | ${fmt(avgHops)} | ${sum(group, (s) => s.badArgRejections)} | ${sum(group, (s) => s.breakerHits)} | ${sum(group, (s) => s.schemaRefetches)} |`)
    }
    lines.push('')
    lines.push('## Per scenario')
    lines.push('')
    lines.push('| scenario | shape | calls | hops | ok | bad-arg | auth | ✋ | re-fetch | tool sequence |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const s of scorecard.scores) {
        lines.push(`| ${s.scenarioId} | ${s.shape} | ${s.totalToolCalls} | ${fmt(s.hopsBeforeFirstExecute)} | ${outcomeGlyph(s.outcome)} | ${s.badArgRejections} | ${s.authBlocked} | ${s.breakerHits} | ${s.schemaRefetches} | ${truncate(s.toolSequence.join(' → '), 90)} |`)
    }
    lines.push('')
    return lines.join('\n')
}

function outcomeGlyph(outcome: string): string {
    if (outcome === 'did-work') return '✅'
    if (outcome === 'blocked-connection') return '🔌'
    return '🚫'
}

function groupByShape(scores: ScenarioScore[]): Array<[string, ScenarioScore[]]> {
    const map = new Map<string, ScenarioScore[]>()
    for (const score of scores) {
        const group = map.get(score.shape) ?? []
        group.push(score)
        map.set(score.shape, group)
    }
    return [...map.entries()]
}

function sum(scores: ScenarioScore[], pick: (s: ScenarioScore) => number): number {
    return scores.reduce((acc, s) => acc + pick(s), 0)
}

function round(value: number): number {
    return Math.round(value * 100) / 100
}

function fmt(value: number | null): string {
    return value === null ? 'n/a' : String(value)
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max)}…` : text
}

export const liveReport = {
    toMarkdown,
}
