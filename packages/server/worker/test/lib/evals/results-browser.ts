import { isNil } from '@activepieces/core-utils'
import { CaseExplanation, caseSummary } from './case-summary'
import { RunVerdict, Verdict } from './checks'
import { EvalCase } from './eval-case'
import { UploadedRun } from './posthog-experiments'

async function open({ datasets }: { datasets: BrowsedDataset[] }): Promise<void> {
    const rows = datasets.flatMap((dataset) => dataset.cases.map((candidate) => ({
        dataset: dataset.name,
        candidate,
        verdict: dataset.verdictOf(candidate),
        explanation: dataset.explanationOf(candidate),
        runs: dataset.runs.filter((run) => run.candidate.id === candidate.id).sort((a, b) => a.trial - b.trial),
    })))
    if (rows.length === 0) {
        return
    }
    let view: View = { screen: 'cases', index: 0 }
    let typed = ''
    const draw = (): void => {
        const lines = render({ view, rows, datasets, typed, width: process.stdout.columns || 100, height: process.stdout.rows || 30 })
        process.stdout.write(`${CLEAR}${lines.join('\n')}`)
    }
    process.stdout.write(`${ALT_SCREEN_ON}${HIDE_CURSOR}`)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    draw()
    await new Promise<void>((resolve) => {
        const onKey = (data: Buffer): void => {
            for (const key of data.toString().match(KEY_PATTERN) ?? []) {
                const next = handleKey({ key, view, rows, typed, height: process.stdout.rows || 30 })
                if (isNil(next)) {
                    process.stdin.off('data', onKey)
                    resolve()
                    return
                }
                view = next.view
                typed = next.typed
            }
            draw()
        }
        process.stdin.on('data', onKey)
        process.stdout.on('resize', draw)
    })
    process.stdout.off('resize', draw)
    process.stdin.setRawMode(false)
    process.stdin.pause()
    process.stdout.write(`${SHOW_CURSOR}${ALT_SCREEN_OFF}`)
}

function handleKey({ key, view, rows, typed, height }: { key: string, view: View, rows: Row[], typed: string, height: number }): { view: View, typed: string } | null {
    if (key === 'q' || key === CTRL_C) {
        return null
    }
    if (/^[0-9]$/.test(key) && view.screen === 'cases') {
        const extended = `${typed}${key}`
        const number = rows.some((row) => String(row.candidate.caseNumber).startsWith(extended)) ? extended : key
        const found = rows.findIndex((row) => String(row.candidate.caseNumber) === number)
        return { view: found === -1 ? view : { screen: 'cases', index: found }, typed: number }
    }
    const back = key === ESC || key === BACKSPACE || key === LEFT
    const page = Math.max(1, height - 6)
    switch (view.screen) {
        case 'cases': {
            if (key === ENTER || key === RIGHT) {
                return { view: { screen: 'runs', caseIndex: view.index, index: 0 }, typed: '' }
            }
            return { view: { ...view, index: move({ key, index: view.index, count: rows.length, page }) }, typed: '' }
        }
        case 'runs': {
            if (back) {
                return { view: { screen: 'cases', index: view.caseIndex }, typed: '' }
            }
            if ((key === ENTER || key === RIGHT) && rows[view.caseIndex].runs.length > 0) {
                return { view: { screen: 'transcript', caseIndex: view.caseIndex, runIndex: view.index, scroll: 0 }, typed: '' }
            }
            return { view: { ...view, index: move({ key, index: view.index, count: rows[view.caseIndex].runs.length, page }) }, typed: '' }
        }
        case 'transcript': {
            if (back) {
                return { view: { screen: 'runs', caseIndex: view.caseIndex, index: view.runIndex }, typed: '' }
            }
            return { view: { ...view, scroll: Math.max(0, view.scroll + scrollBy({ key, page })) }, typed: '' }
        }
    }
}

function move({ key, index, count, page }: { key: string, index: number, count: number, page: number }): number {
    const delta = scrollBy({ key, page })
    return Math.min(Math.max(0, index + delta), Math.max(0, count - 1))
}

function scrollBy({ key, page }: { key: string, page: number }): number {
    switch (key) {
        case UP: case 'k': return -1
        case DOWN: case 'j': return 1
        case PAGE_UP: return -page
        case PAGE_DOWN: case ' ': return page
        default: return 0
    }
}

function render({ view, rows, datasets, typed, width, height }: { view: View, rows: Row[], datasets: BrowsedDataset[], typed: string, width: number, height: number }): string[] {
    switch (view.screen) {
        case 'cases': {
            const totals = datasets.map((dataset) => {
                const verdicts = dataset.cases.map((candidate) => dataset.verdictOf(candidate))
                return `${dataset.name} · ${verdicts.filter((verdict) => verdict === 'pass').length} pass · ${verdicts.filter((verdict) => verdict === 'fail').length} fail`
            }).join('   ')
            const lines = rows.map((row, index) => {
                const passed = row.runs.filter((run) => run.verdict === 'pass').length
                const dataset = datasets.length > 1 ? `${pad(row.dataset, 20)} ` : ''
                const text = fit(`${dataset}${pad(String(row.candidate.caseNumber), 3)} ${VERDICT_TEXT[row.verdict]}  ${passed}/${row.runs.length}  ${row.candidate.title}`, width - 2)
                return selectable({ text, verdict: row.verdict, selected: index === view.index })
            })
            return [
                header({ left: totals, right: `↑↓ move · enter open · type a case number${typed ? ` (${typed})` : ''} · q quit`, width }),
                '',
                ...windowed({ lines, index: view.index, size: height - 3 }),
            ]
        }
        case 'runs': {
            const row = rows[view.caseIndex]
            const passed = row.runs.filter((run) => run.verdict === 'pass').length
            const explanation = row.explanation
            const intro = [
                ...labeled({ label: 'expected', lines: [explanation?.expected ?? row.candidate.checks.join(' ')], width }),
                ...labeled({ label: 'happened', lines: explanation?.happened ?? [], width }),
                ...labeled({ label: 'means', lines: isNil(explanation) ? [] : [explanation.means], width }).map((line) => `${BOLD}${line}${RESET}`),
                '',
                ...wrap({ text: `${DIM}user asked:${RESET} ${oneLine(row.candidate.userMessage)}`, width: width - 2 }).slice(0, USER_PREVIEW_LINES),
                '',
            ].map((line) => `  ${line}`)
            const lines = row.runs.map((run, index) => {
                const detail = run.verdict === 'pass' ? `${run.scores.stepsToDecision} step(s)` : firstFailure(run)
                const text = fit(`run ${run.trial + 1}  ${VERDICT_TEXT[run.verdict]}  ${oneLine(detail)}`, width - 2)
                return selectable({ text, verdict: run.verdict, selected: index === view.index })
            })
            return [
                header({ left: `case ${row.candidate.caseNumber} ${row.candidate.title} · ${VERDICT_TEXT[row.verdict]} · ${row.explanation?.reliability ?? `${passed}/${row.runs.length} runs pass`}`, right: '↑↓ move · enter transcript · esc back · q quit', width }),
                '',
                ...intro,
                ...windowed({ lines, index: view.index, size: height - 3 - intro.length }),
            ]
        }
        case 'transcript': {
            const row = rows[view.caseIndex]
            const run = row.runs[view.runIndex]
            const body = [
                ...caseSummary.failures(run).flatMap((reason) => wrap({ text: `✗ ${reason}`, width })),
                `${run.scores.stepsToDecision} step(s) · ${isNil(run.scores.costUsd) ? 'cost unknown' : `$${run.scores.costUsd.toFixed(4)}`}`,
                '',
                ...run.transcript.split('\n').flatMap((line) => wrap({ text: line, width })),
            ]
            const size = height - 2
            const scroll = Math.min(view.scroll, Math.max(0, body.length - size))
            return [
                header({ left: `case ${row.candidate.caseNumber} · run ${run.trial + 1} · ${VERDICT_TEXT[run.verdict]}`, right: `↑↓ scroll · space page · esc back · q quit · ${Math.min(body.length, scroll + size)}/${body.length}`, width }),
                '',
                ...body.slice(scroll, scroll + size),
            ]
        }
    }
}

function firstFailure(run: UploadedRun): string {
    return caseSummary.failures(run)[0] ?? 'failed'
}

function header({ left, right, width }: { left: string, right: string, width: number }): string {
    const gap = Math.max(2, width - left.length - right.length)
    return `${BOLD}${fit(`${left}${' '.repeat(gap)}${right}`, width)}${RESET}`
}

function labeled({ label, lines, width }: { label: string, lines: string[], width: number }): string[] {
    const indent = ' '.repeat(LABEL_WIDTH + 2)
    return lines.flatMap((line, index) => wrap({ text: line, width: width - LABEL_WIDTH - 4 })
        .map((part, partIndex) => index === 0 && partIndex === 0 ? `${DIM}${label.padEnd(LABEL_WIDTH)}${RESET}  ${part}` : `${indent}${part}`))
}

function windowed({ lines, index, size }: { lines: string[], index: number, size: number }): string[] {
    const visible = Math.max(1, size)
    const start = Math.min(Math.max(0, index - Math.floor(visible / 2)), Math.max(0, lines.length - visible))
    return lines.slice(start, start + visible)
}

function selectable({ text, verdict, selected }: { text: string, verdict: RunVerdict, selected: boolean }): string {
    return selected ? `${INVERSE}› ${text}${RESET}` : `  ${colorVerdict({ text, verdict })}`
}

function colorVerdict({ text, verdict }: { text: string, verdict: RunVerdict }): string {
    const label = VERDICT_TEXT[verdict]
    return text.replace(label, `${VERDICT_COLOR[verdict]}${label}${RESET}`)
}

function wrap({ text, width }: { text: string, width: number }): string[] {
    const size = Math.max(10, width)
    if (text.length <= size) {
        return [text]
    }
    return Array.from({ length: Math.ceil(text.length / size) }, (_, part) => text.slice(part * size, (part + 1) * size))
}

function fit(text: string, width: number): string {
    return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text
}

function pad(text: string, width: number): string {
    return fit(text, width).padEnd(width)
}

function oneLine(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
}

const ESC = '\x1b'
const KEY_PATTERN = /\x1b\[[0-9]+~|\x1b\[[A-D]|[\s\S]/g
const UP = '\x1b[A'
const DOWN = '\x1b[B'
const RIGHT = '\x1b[C'
const LEFT = '\x1b[D'
const PAGE_UP = '\x1b[5~'
const PAGE_DOWN = '\x1b[6~'
const ENTER = '\r'
const BACKSPACE = '\x7f'
const CTRL_C = '\x03'
const CLEAR = '\x1b[H\x1b[2J'
const ALT_SCREEN_ON = '\x1b[?1049h'
const ALT_SCREEN_OFF = '\x1b[?1049l'
const HIDE_CURSOR = '\x1b[?25l'
const SHOW_CURSOR = '\x1b[?25h'
const BOLD = '\x1b[1m'
const INVERSE = '\x1b[7m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'
const LABEL_WIDTH = 8
const USER_PREVIEW_LINES = 2
const VERDICT_TEXT: Record<RunVerdict, string> = { pass: '✓ pass', fail: '✗ fail', unknown: '? unclear' }
const VERDICT_COLOR: Record<RunVerdict, string> = { pass: GREEN, fail: RED, unknown: YELLOW }

export const resultsBrowser = {
    open,
}

type Row = {
    dataset: string
    candidate: EvalCase
    verdict: Verdict
    runs: UploadedRun[]
    explanation: CaseExplanation | undefined
}

type View =
    | { screen: 'cases', index: number }
    | { screen: 'runs', caseIndex: number, index: number }
    | { screen: 'transcript', caseIndex: number, runIndex: number, scroll: number }

export type BrowsedDataset = {
    name: string
    cases: EvalCase[]
    runs: UploadedRun[]
    verdictOf: (candidate: EvalCase) => Verdict
    explanationOf: (candidate: EvalCase) => CaseExplanation | undefined
}
