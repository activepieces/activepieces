import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const CALIBRATION_DIR = path.join(__dirname, '..', 'calibration')

function loadLabelled(): LabelledCalibrationCase[] {
    return loadAll().filter((calibrationCase): calibrationCase is LabelledCalibrationCase => calibrationCase.humanLabel !== null)
}

function isDraft(calibrationCase: CalibrationCase): boolean {
    return calibrationCase.labelledBy === DRAFT_LABELLER
}

function loadAll(): CalibrationCase[] {
    if (!existsSync(CALIBRATION_DIR)) {
        return []
    }
    return readdirSync(CALIBRATION_DIR)
        .filter((file) => file.endsWith('.json'))
        .map((file) => parseCase({ file, raw: JSON.parse(readFileSync(path.join(CALIBRATION_DIR, file), 'utf-8')) }))
}

function parseCase({ file, raw }: { file: string, raw: unknown }): CalibrationCase {
    if (!isCaseShape(raw)) {
        throw new Error(`calibration/${file}: expected id, fixtureId, dimension, rubric and transcript strings`)
    }
    const label = raw.humanLabel
    if (!isLabel(label)) {
        throw new Error(`calibration/${file}: humanLabel must be "pass", "fail" or null, got ${JSON.stringify(label)}`)
    }
    return { ...raw, humanLabel: label }
}

function isLabel(value: unknown): value is CalibrationCase['humanLabel'] {
    return value === null || value === 'pass' || value === 'fail'
}

function isCaseShape(raw: unknown): raw is Omit<CalibrationCase, 'humanLabel'> & { humanLabel: unknown } {
    if (typeof raw !== 'object' || raw === null) {
        return false
    }
    const record: Record<string, unknown> = { ...raw }
    return ['id', 'fixtureId', 'dimension', 'rubric', 'transcript'].every((key) => typeof record[key] === 'string')
        && 'humanLabel' in record
        && (record['labelledBy'] === undefined || typeof record['labelledBy'] === 'string')
}

function fileFor({ id }: { id: string }): string {
    const file = path.resolve(CALIBRATION_DIR, `${id}.json`)
    if (path.dirname(file) !== path.resolve(CALIBRATION_DIR)) {
        throw new Error(`calibration case id "${id}" would write outside calibration/`)
    }
    return file
}

const DRAFT_LABELLER = 'claude'

export const evalCalibration = {
    loadLabelled,
    isDraft,
    fileFor,
    dir: CALIBRATION_DIR,
}

export type CalibrationCase = {
    id: string
    fixtureId: string
    dimension: string
    rubric: string
    transcript: string
    humanLabel: 'pass' | 'fail' | null
    labelledBy?: string
}

export type LabelledCalibrationCase = CalibrationCase & { humanLabel: 'pass' | 'fail' }
