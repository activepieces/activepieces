import type { EvalReportEntry } from './report'

function calibration(entries: EvalReportEntry[]): { tpr: number, tnr: number } {
    const verdicts = entries.flatMap((entry) => entry.judge)
    const positives = verdicts.filter((verdict) => verdict.expectedLabel === 'pass')
    const negatives = verdicts.filter((verdict) => verdict.expectedLabel === 'fail')
    return {
        tpr: positives.length === 0 ? 1 : positives.filter((verdict) => verdict.pass).length / positives.length,
        tnr: negatives.length === 0 ? 1 : negatives.filter((verdict) => !verdict.pass).length / negatives.length,
    }
}

function truncate({ text, max }: { text: string, max: number }): string {
    const collapsed = text.replace(/\s+/g, ' ').trim()
    return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed
}

export const evalFormat = {
    calibration,
    truncate,
}
