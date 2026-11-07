import { RunVerdict, Verdict } from './checks'
import { EvalCase } from './eval-case'

function create({ cases, repeats, verdictOf }: { cases: EvalCase[], repeats: number, verdictOf: (counts: { pass: number, fail: number }) => Verdict }): ProgressTable {
    const marks = new Map(cases.map((candidate) => [candidate.id, Array.from({ length: repeats }, (): Mark => 'waiting')]))
    const startedAt = Date.now()
    let costUsd = 0
    let frame = 0
    let drawnLines = 0
    const draw = (): void => {
        const lines = render({ cases, repeats, marks, verdictOf, costUsd, frame, elapsedMs: Date.now() - startedAt })
        process.stdout.write(`${drawnLines > 0 ? `\x1b[${drawnLines}A` : ''}\x1b[0J${lines.join('\n')}\n`)
        drawnLines = lines.length
    }
    const mark = ({ caseId, trial, value }: { caseId: string, trial: number, value: Mark }): void => {
        const row = marks.get(caseId)
        if (row) {
            row[trial] = value
        }
        draw()
    }
    const timer = setInterval(() => {
        frame++
        draw()
    }, FRAME_MS)
    draw()
    return {
        start: ({ candidate, trial }) => mark({ caseId: candidate.id, trial, value: 'running' }),
        finish: ({ candidate, trial, verdict, runCostUsd }) => {
            costUsd += runCostUsd ?? 0
            mark({ caseId: candidate.id, trial, value: verdict })
        },
        stop: () => {
            clearInterval(timer)
            draw()
        },
    }
}

function render({ cases, repeats, marks, verdictOf, costUsd, frame, elapsedMs }: { cases: EvalCase[], repeats: number, marks: Map<string, Mark[]>, verdictOf: (counts: { pass: number, fail: number }) => Verdict, costUsd: number, frame: number, elapsedMs: number }): string[] {
    const all = [...marks.values()].flat()
    const done = all.filter((value) => value !== 'running' && value !== 'waiting').length
    const header = `${done}/${all.length} runs · $${costUsd.toFixed(2)} · ${formatElapsed(elapsedMs)}`
    const rows = cases.map((candidate) => {
        const row = marks.get(candidate.id) ?? []
        const pass = row.filter((value) => value === 'pass').length
        const fail = row.filter((value) => value === 'fail' || value === 'unknown').length
        const symbols = row.map((value) => symbol({ value, frame })).join(' ')
        return `  ${pad(String(candidate.caseNumber), 4)}  ${pad(candidate.title, TITLE_WIDTH)}  ${symbols}  ${pad(String(pass), 4)}  ${pad(String(fail), 4)}  ${status({ row, pass, fail, verdictOf })}`
    })
    return [
        `  ${header}`,
        '',
        `  ${pad('case', 4)}  ${pad('title', TITLE_WIDTH)}  ${pad('runs', repeats * 2 - 1)}  pass  fail  status`,
        ...rows,
    ]
}

function status({ row, pass, fail, verdictOf }: { row: Mark[], pass: number, fail: number, verdictOf: (counts: { pass: number, fail: number }) => Verdict }): string {
    const remaining = row.length - pass - fail
    const best = verdictOf({ pass: pass + remaining, fail })
    const worst = verdictOf({ pass, fail: fail + remaining })
    if (best === worst) {
        return best === 'pass' ? `${GREEN}✓ pass${RESET}` : `${RED}✗ fail${RESET}`
    }
    return row.includes('running') ? 'running' : `${DIM}waiting${RESET}`
}

function symbol({ value, frame }: { value: Mark, frame: number }): string {
    switch (value) {
        case 'pass': return `${GREEN}✓${RESET}`
        case 'fail': return `${RED}✗${RESET}`
        case 'unknown': return `${YELLOW}?${RESET}`
        case 'running': return SPINNER[frame % SPINNER.length]
        case 'waiting': return `${DIM}·${RESET}`
    }
}

function pad(text: string, width: number): string {
    return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width)
}

function formatElapsed(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    return `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`
}

const FRAME_MS = 100
const TITLE_WIDTH = 34
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

export const progressTable = {
    create,
}

type Mark = RunVerdict | 'running' | 'waiting'

export type ProgressTable = {
    start: (run: { candidate: EvalCase, trial: number }) => void
    finish: (run: { candidate: EvalCase, trial: number, verdict: RunVerdict, runCostUsd: number | null }) => void
    stop: () => void
}
