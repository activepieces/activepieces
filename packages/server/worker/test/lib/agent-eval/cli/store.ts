import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { EvalReportEntry } from '../core/report'
import { repoRoot } from '../core/repo-root'

const STORE_DIR = path.join(repoRoot, '.agent-eval')
const RUN_FILE = path.join(STORE_DIR, 'last-run.json')
const DECISIONS_FILE = path.join(STORE_DIR, 'decisions.json')
const RUN_FORMAT_VERSION = 2

function writeRun(run: Omit<RunResult, 'version'>): RunResult {
    const versioned: RunResult = { ...run, version: RUN_FORMAT_VERSION }
    mkdirSync(STORE_DIR, { recursive: true })
    writeFileSync(RUN_FILE, JSON.stringify(versioned, null, 2))
    return versioned
}

function readRun(): RunResult | null {
    if (!existsSync(RUN_FILE)) {
        return null
    }
    const cached: RunResult = JSON.parse(readFileSync(RUN_FILE, 'utf-8'))
    return cached.version === RUN_FORMAT_VERSION ? cached : null
}

function appendDecision(decision: ReviewDecision): void {
    mkdirSync(STORE_DIR, { recursive: true })
    const existing: ReviewDecision[] = existsSync(DECISIONS_FILE) ? JSON.parse(readFileSync(DECISIONS_FILE, 'utf-8')) : []
    writeFileSync(DECISIONS_FILE, JSON.stringify([...existing, decision], null, 2))
}

export const evalStore = {
    writeRun,
    readRun,
    appendDecision,
    decisionsFile: DECISIONS_FILE,
}

export type FixtureComparison = {
    id: string
    baseline: EvalReportEntry
    candidate: EvalReportEntry
    delta: 'improved' | 'regressed' | 'same'
}

export type RunResult = {
    version: number
    at: string
    provider: string
    baselineModelId: string
    candidateModelId: string
    baselineLabel: string
    candidateLabel: string
    promptChanged: boolean
    comparisons: FixtureComparison[]
}

export type ReviewDecision = {
    at: string
    verdict: 'proceed' | 'stop'
    candidateLabel: string
    baselineModelId: string
    candidateModelId: string
    baselineCostUsd: number | null
    candidateCostUsd: number | null
    baselinePassed: number
    candidatePassed: number
    total: number
    regressions: string[]
    improvements: string[]
    note: string
}
