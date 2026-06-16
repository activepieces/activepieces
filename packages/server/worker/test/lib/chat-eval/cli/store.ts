import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { EvalReportEntry } from '../report'
import { repoRoot } from '../repo-root'

const STORE_DIR = path.join(repoRoot, '.chat-eval')
const RUN_FILE = path.join(STORE_DIR, 'last-run.json')
const DECISIONS_FILE = path.join(STORE_DIR, 'decisions.json')

function writeRun(run: RunResult): void {
    mkdirSync(STORE_DIR, { recursive: true })
    writeFileSync(RUN_FILE, JSON.stringify(run, null, 2))
}

function readRun(): RunResult | null {
    if (!existsSync(RUN_FILE)) {
        return null
    }
    return JSON.parse(readFileSync(RUN_FILE, 'utf-8')) as RunResult
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
    at: string
    provider: string
    modelId: string
    baselineLabel: string
    candidateLabel: string
    changed: boolean
    comparisons: FixtureComparison[]
}

export type ReviewDecision = {
    at: string
    verdict: 'proceed' | 'stop'
    candidateLabel: string
    baselinePassed: number
    candidatePassed: number
    total: number
    regressions: string[]
    improvements: string[]
    note: string
}
