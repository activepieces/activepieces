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

function truncate({ text, max }: { text: string, max: number }): string {
    const collapsed = text.replace(/\s+/g, ' ').trim()
    return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed
}

export const evalFormat = {
    expectedLabelMatch,
    judgeAgreement,
    truncate,
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
