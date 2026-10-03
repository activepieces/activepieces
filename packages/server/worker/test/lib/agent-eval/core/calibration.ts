import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const CALIBRATION_DIR = path.join(__dirname, '..', 'calibration')

function loadLabelled(): LabelledCalibrationCase[] {
    return loadAll().filter((calibrationCase): calibrationCase is LabelledCalibrationCase => calibrationCase.humanLabel !== null)
}

function loadAll(): CalibrationCase[] {
    if (!existsSync(CALIBRATION_DIR)) {
        return []
    }
    return readdirSync(CALIBRATION_DIR)
        .filter((file) => file.endsWith('.json'))
        .map((file) => JSON.parse(readFileSync(path.join(CALIBRATION_DIR, file), 'utf-8')) as CalibrationCase)
}

function fileFor({ id }: { id: string }): string {
    return path.join(CALIBRATION_DIR, `${id}.json`)
}

export const evalCalibration = {
    loadLabelled,
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
