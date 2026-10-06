import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { CalibrationCase, evalCalibration } from '../core/calibration'
import { evalFixtures } from '../core/fixtures-loader'
import { EvalReportEntry } from '../core/report'

function exportCases({ resultsPath }: { resultsPath: string }): { written: number, skipped: number } {
    const results: ResultsFile = JSON.parse(readFileSync(resultsPath, 'utf-8'))
    const rubrics = new Map(evalFixtures.load().flatMap((fixture) => fixture.judge.map((dimension) => [`${fixture.id}/${dimension.dimension}`, dimension.rubric] as const)))
    const stamp = results.runAt.slice(0, 19).replace(/:/g, '-')
    if (!RUN_STAMP.test(stamp)) {
        throw new Error(`runAt "${results.runAt}" is not an ISO timestamp`)
    }
    const cases = results.entries.flatMap((entry) => entry.judge.flatMap((verdict): CalibrationCase[] => {
        const rubric = rubrics.get(`${entry.id}/${verdict.dimension}`)
        if (rubric === undefined) {
            return []
        }
        return [{ id: `${entry.id}--${verdict.dimension}--${stamp}`, fixtureId: entry.id, dimension: verdict.dimension, rubric, transcript: entry.transcript, humanLabel: null }]
    }))

    mkdirSync(evalCalibration.dir, { recursive: true })
    const fresh = cases.filter((calibrationCase) => !existsSync(evalCalibration.fileFor({ id: calibrationCase.id })))
    for (const calibrationCase of fresh) {
        writeFileSync(evalCalibration.fileFor({ id: calibrationCase.id }), JSON.stringify(calibrationCase, null, 4) + '\n')
    }
    return { written: fresh.length, skipped: cases.length - fresh.length }
}

const RUN_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/

export const evalExportCalibration = {
    exportCases,
}

type ResultsFile = {
    runAt: string
    entries: EvalReportEntry[]
}
