import { groupBy } from '@activepieces/core-utils'
import chalk from 'chalk'
import { FAILURE_TYPES } from './llm-judge'
import type { EvalReportEntry } from './report'

function expectedLabelMatch(entries: EvalReportEntry[]): { tpr: number, tnr: number } {
    const verdicts = entries.flatMap((entry) => entry.judge)
    const positives = verdicts.filter((verdict) => verdict.expectedLabel === 'pass')
    const negatives = verdicts.filter((verdict) => verdict.expectedLabel === 'fail')
    return {
        tpr: positives.length === 0 ? 1 : positives.filter((verdict) => verdict.pass).length / positives.length,
        tnr: negatives.length === 0 ? 1 : negatives.filter((verdict) => !verdict.pass).length / negatives.length,
    }
}

function judgeAgreement({ verdicts }: { verdicts: LabelVerdict[] }): JudgeAgreement {
    const drafts = verdicts.filter((verdict) => verdict.draft)
    return {
        ...rates(verdicts.filter((verdict) => !verdict.draft)),
        draft: drafts.length === 0 ? null : rates(drafts),
    }
}

function rates(verdicts: LabelVerdict[]): AgreementRates {
    const labelledPass = verdicts.filter((verdict) => verdict.humanLabel === 'pass')
    const labelledFail = verdicts.filter((verdict) => verdict.humanLabel === 'fail')
    return {
        n: verdicts.length,
        tpr: labelledPass.length === 0 ? null : labelledPass.filter((verdict) => verdict.judgePass).length / labelledPass.length,
        tnr: labelledFail.length === 0 ? null : labelledFail.filter((verdict) => !verdict.judgePass).length / labelledFail.length,
    }
}

function shortModelName(modelId: string): string {
    return modelId.split('/').pop() || modelId
}

function failureSummary(entries: EvalReportEntry[]): string {
    const failures = entries.flatMap((entry) => entry.judge.flatMap((verdict) => verdict.failure === undefined ? [] : [verdict.failure]))
    const parts = Object.values(groupBy(failures, (failure) => failure))
        .sort((a, b) => b.length - a.length)
        .map((group) => `${FAILURE_TYPES[group[0]].label} ${group.length}`)
    return parts.length === 0 ? 'none' : parts.join(', ')
}

function deltaBadge({ delta, width = 0 }: { delta: FixtureDelta, width?: number }): string {
    if (delta === 'improved') {
        return chalk.green('▲ improved'.padEnd(width))
    }
    if (delta === 'regressed') {
        return chalk.red('▼ regressed'.padEnd(width))
    }
    return chalk.dim('= same'.padEnd(width))
}

function truncate({ text, max }: { text: string, max: number }): string {
    const collapsed = text.replace(/\s+/g, ' ').trim()
    return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed
}

function sumCost({ costs }: { costs: Array<number | null> }): number | null {
    if (costs.some((cost) => cost === null)) {
        return null
    }
    return costs.reduce<number>((total, cost) => total + (cost ?? 0), 0)
}

function formatUsd(cost: number | null): string {
    if (cost === null) {
        return '—'
    }
    return `$${cost < 1 ? cost.toFixed(4) : cost.toFixed(2)}`
}

function costDelta({ baseline, candidate }: { baseline: number | null, candidate: number | null }): string | null {
    if (baseline === null || candidate === null || baseline === 0) {
        return null
    }
    const percent = Math.round(((candidate - baseline) / baseline) * 100)
    return `${percent > 0 ? '+' : percent < 0 ? '−' : '±'}${Math.abs(percent)}%`
}

export const evalFormat = {
    failureSummary,
    deltaBadge,
    shortModelName,
    expectedLabelMatch,
    judgeAgreement,
    truncate,
    sumCost,
    formatUsd,
    costDelta,
}

export type AgreementRates = {
    n: number
    tpr: number | null
    tnr: number | null
}

export type JudgeAgreement = AgreementRates & {
    draft: AgreementRates | null
}

type LabelVerdict = {
    humanLabel: 'pass' | 'fail'
    judgePass: boolean
    draft: boolean
}

export type FixtureDelta = 'improved' | 'regressed' | 'same'
