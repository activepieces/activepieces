import { EvalCase } from './eval-case'

async function split({ dataset, projectName, unmetOf }: { dataset: { name: string, cases: EvalCase[] }, projectName: string, unmetOf: (candidate: EvalCase) => Promise<string[]> }): Promise<RunnableDataset> {
    const checked = await Promise.all(dataset.cases.map(async (candidate) => ({ candidate, unmet: await unmetOf(candidate) })))
    return {
        name: dataset.name,
        cases: checked.filter(({ unmet }) => unmet.length === 0).map(({ candidate }) => candidate),
        skipped: checked.filter(({ unmet }) => unmet.length > 0).map(({ candidate, unmet }) => ({ candidate, reason: `${unmet.join('; ')} in project "${projectName}"` })),
    }
}

function withSkipped({ outcome, name, skipped }: { outcome: DatasetOutcome, name: string, skipped: SkippedCase[] }): DatasetOutcome {
    if (outcome.status === 'broken' || skipped.length === 0) {
        return outcome
    }
    const reason = `${skipped.length} ${name} case(s) were skipped for a missing connection`
    return { status: 'unchecked', reason: outcome.reason.length === 0 ? reason : `${outcome.reason}; ${reason}` }
}

export const skippedCases = {
    split,
    withSkipped,
}

export type SkippedCase = {
    candidate: EvalCase
    reason: string
}

export type RunnableDataset = {
    name: string
    cases: EvalCase[]
    skipped: SkippedCase[]
}

export type DatasetOutcome = {
    status: 'ok' | 'unchecked' | 'broken'
    reason: string
}
