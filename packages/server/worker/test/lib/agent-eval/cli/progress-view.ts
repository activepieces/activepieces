import { clearScreenDown, cursorTo, moveCursor } from 'node:readline'
import { stripVTControlCharacters } from 'node:util'
import chalk from 'chalk'
import { evalFormat } from '../core/eval-format'
import { RunningFixture, RunProgress } from './run'
import { PartialEntry } from './store'

function create(): ProgressView {
    const out = process.stdout
    const live = out.isTTY
    let latest: RunProgress | null = null
    let drawnLines = 0
    let frame = 0

    const erase = (): void => {
        if (drawnLines > 0) {
            moveCursor(out, 0, -drawnLines)
            cursorTo(out, 0)
            clearScreenDown(out)
        }
        drawnLines = 0
    }
    const redraw = (): void => {
        if (latest === null) {
            return
        }
        erase()
        const lines = blockLines({ progress: latest, frame }).map((line) => fitToWidth({ line, columns: out.columns }))
        out.write(`${lines.join('\n')}\n`)
        drawnLines = lines.length
    }
    const timer = live ? setInterval(() => {
        frame += 1
        redraw()
    }, SPINNER_INTERVAL_MS) : null
    timer?.unref()

    return {
        update: (progress) => {
            if (progress.finished !== undefined) {
                erase()
                console.log(finishedLine({ finished: progress.finished, done: progress.done, total: progress.total }))
            }
            latest = progress
            if (live) {
                redraw()
            }
        },
        stop: () => {
            if (timer !== null) {
                clearInterval(timer)
            }
            if (live && latest !== null) {
                erase()
                console.log(overallLine(latest))
            }
        },
    }
}

function blockLines({ progress, frame }: { progress: RunProgress, frame: number }): string[] {
    const spinner = SPINNER_FRAMES[frame % SPINNER_FRAMES.length]
    return [
        ...progress.running.map((fixture) => runningLine({ fixture, spinner })),
        overallLine(progress),
    ]
}

function runningLine({ fixture, spinner }: { fixture: RunningFixture, spinner: string }): string {
    const seconds = Math.round((Date.now() - fixture.startedAt) / 1000)
    return `  ${chalk.cyan(spinner)} ${fixture.id.padEnd(FIXTURE_ID_WIDTH)} ${chalk.dim(`${evalFormat.shortModelName(fixture.modelId)} · ${fixture.stage} · ${seconds}s`)}`
}

function overallLine({ done, total, resumed, spentUsd, maxCostUsd }: RunProgress): string {
    const filled = total === 0 ? PROGRESS_BAR_WIDTH : Math.round((done / total) * PROGRESS_BAR_WIDTH)
    const bar = chalk.cyan('█'.repeat(filled)) + chalk.dim('░'.repeat(PROGRESS_BAR_WIDTH - filled))
    const spend = maxCostUsd === undefined ? `$${spentUsd.toFixed(2)}` : `$${spentUsd.toFixed(2)} / $${maxCostUsd.toFixed(2)}`
    const resumedNote = resumed > 0 ? chalk.dim(` (${resumed} resumed)`) : ''
    return `  ${bar} ${done}/${total}${resumedNote} · ${spend}`
}

function finishedLine({ finished: { comparison, spentUsd }, done, total }: { finished: PartialEntry, done: number, total: number }): string {
    const mark = comparison.candidate.passed ? chalk.green('✓') : chalk.red('✗')
    const cost = evalFormat.formatUsd(spentUsd)
    const failures = evalFormat.failureSummary([comparison.candidate])
    const why = failures === 'none' ? '' : chalk.yellow(` · ${failures}`)
    return `  ${mark} ${comparison.id.padEnd(FIXTURE_ID_WIDTH)} ${evalFormat.deltaBadge({ delta: comparison.delta, width: 11 })} ${chalk.dim(`${cost} · ${done}/${total}`)}${why}`
}

function fitToWidth({ line, columns }: { line: string, columns: number | undefined }): string {
    const visible = stripVTControlCharacters(line)
    if (columns === undefined || visible.length < columns) {
        return line
    }
    return `${visible.slice(0, columns - 2)}…`
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const SPINNER_INTERVAL_MS = 100
const PROGRESS_BAR_WIDTH = 24
const FIXTURE_ID_WIDTH = 44

export const evalProgressView = {
    create,
}

type ProgressView = {
    update: (progress: RunProgress) => void
    stop: () => void
}
