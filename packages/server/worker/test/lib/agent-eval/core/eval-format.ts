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

function judgeAgreement({ verdicts }: { verdicts: Array<{ humanLabel: 'pass' | 'fail', judgePass: boolean, draft: boolean }> }): JudgeAgreement {
    const humanPass = verdicts.filter((verdict) => verdict.humanLabel === 'pass')
    const humanFail = verdicts.filter((verdict) => verdict.humanLabel === 'fail')
    return {
        n: verdicts.length,
        drafts: verdicts.filter((verdict) => verdict.draft).length,
        tpr: humanPass.length === 0 ? null : humanPass.filter((verdict) => verdict.judgePass).length / humanPass.length,
        tnr: humanFail.length === 0 ? null : humanFail.filter((verdict) => !verdict.judgePass).length / humanFail.length,
    }
}

function truncate({ text, max }: { text: string, max: number }): string {
    const collapsed = text.replace(/\s+/g, ' ').trim()
    return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed
}

export const evalFormat = {
    expectedLabelMatch,
    judgeAgreement,
    truncate,
}

export type JudgeAgreement = {
    n: number
    drafts: number
    tpr: number | null
    tnr: number | null
}
