import chalk from 'chalk'
import Table from 'cli-table3'
import inquirer from 'inquirer'
import { evalFormat } from '../eval-format'
import { evalStore, FixtureComparison, RunResult } from './store'

async function review({ run }: { run: RunResult }): Promise<ReviewOutcome> {
    printDashboard(run)
    for (;;) {
        const { action } = await inquirer.prompt<{ action: string }>([{
            type: 'list',
            name: 'action',
            message: 'Review — what would you like to do?',
            pageSize: 12,
            choices: [
                { name: 'Browse fixtures (transcripts & per-check diff)', value: 'browse' },
                { name: 'Show dashboard again', value: 'dashboard' },
                new inquirer.Separator(),
                { name: chalk.green('Proceed — accept these changes'), value: 'proceed' },
                { name: chalk.red('Stop — reject these changes'), value: 'stop' },
                new inquirer.Separator(),
                { name: 'Re-run live (refresh results)', value: 'rerun' },
                { name: 'Quit (no decision recorded)', value: 'quit' },
            ],
        }])

        if (action === 'browse') {
            await browse(run)
        }
        else if (action === 'dashboard') {
            printDashboard(run)
        }
        else if (action === 'rerun') {
            return { kind: 'rerun' }
        }
        else if (action === 'quit') {
            return { kind: 'exit', code: 0 }
        }
        else if (action === 'proceed' || action === 'stop') {
            const code = await decide({ run, verdict: action })
            if (code !== null) {
                return { kind: 'exit', code }
            }
        }
    }
}

async function browse(run: RunResult): Promise<void> {
    for (;;) {
        const { id } = await inquirer.prompt<{ id: string }>([{
            type: 'list',
            name: 'id',
            message: 'Pick a fixture to inspect',
            pageSize: 15,
            choices: [
                ...run.comparisons.map((comparison) => ({ name: `${deltaBadge(comparison.delta)}  ${comparison.id}`, value: comparison.id })),
                new inquirer.Separator(),
                { name: 'Back', value: '__back' },
            ],
        }])
        if (id === '__back') {
            return
        }
        const comparison = run.comparisons.find((entry) => entry.id === id)
        if (comparison) {
            printFixtureDetail({ run, comparison })
            await inquirer.prompt([{ type: 'input', name: 'continue', message: chalk.dim('press enter to go back') }])
        }
    }
}

async function decide({ run, verdict }: { run: RunResult, verdict: 'proceed' | 'stop' }): Promise<number | null> {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([{
        type: 'confirm',
        name: 'confirmed',
        message: verdict === 'proceed' ? 'Proceed and record approval of these changes?' : 'Stop and record rejection of these changes?',
        default: verdict === 'proceed',
    }])
    if (!confirmed) {
        return null
    }
    const { note } = await inquirer.prompt<{ note: string }>([{ type: 'input', name: 'note', message: 'Note (optional)' }])

    const improvements = run.comparisons.filter((comparison) => comparison.delta === 'improved').map((comparison) => comparison.id)
    const regressions = run.comparisons.filter((comparison) => comparison.delta === 'regressed').map((comparison) => comparison.id)
    evalStore.appendDecision({
        at: new Date().toISOString(),
        verdict,
        candidateLabel: run.candidateLabel,
        baselinePassed: run.comparisons.filter((comparison) => comparison.baseline.passed).length,
        candidatePassed: run.comparisons.filter((comparison) => comparison.candidate.passed).length,
        total: run.comparisons.length,
        regressions,
        improvements,
        note,
    })
    console.log(chalk.dim(`\n  recorded → ${evalStore.decisionsFile}`))
    return verdict === 'proceed' ? 0 : 1
}

function printDashboard(run: RunResult): void {
    const table = new Table({ head: ['fixture', 'baseline', 'candidate', 'Δ'].map((header) => chalk.bold(header)), style: { head: [], border: [] } })
    for (const comparison of run.comparisons) {
        table.push([comparison.id, verdictCell(comparison.baseline.passed), verdictCell(comparison.candidate.passed), deltaBadge(comparison.delta)])
    }

    const improved = run.comparisons.filter((comparison) => comparison.delta === 'improved').length
    const regressed = run.comparisons.filter((comparison) => comparison.delta === 'regressed').length
    const baselineCalibration = evalFormat.calibration(run.comparisons.map((comparison) => comparison.baseline))
    const candidateCalibration = evalFormat.calibration(run.comparisons.map((comparison) => comparison.candidate))

    console.log('')
    console.log(chalk.bold.cyan('  Activepieces · Chat Prompt Eval — Review'))
    console.log(`  ${chalk.dim('baseline')}  ${run.baselineLabel}`)
    console.log(`  ${chalk.dim('candidate')} ${run.candidateLabel}`)
    console.log(`  ${chalk.dim('model')}     ${run.provider} · ${run.modelId}   ${chalk.dim('ran')} ${run.at}`)
    if (!run.changed) {
        console.log(chalk.yellow('  ⚠ no prompt changes detected — baseline and candidate are identical'))
    }
    console.log(table.toString())
    console.log(`  ${chalk.dim('judge calibration')}  baseline TPR ${baselineCalibration.tpr.toFixed(2)}/TNR ${baselineCalibration.tnr.toFixed(2)}   candidate TPR ${candidateCalibration.tpr.toFixed(2)}/TNR ${candidateCalibration.tnr.toFixed(2)}`)
    console.log(`  ${headline({ improved, regressed })}`)
    console.log('')
}

function printFixtureDetail({ run, comparison }: { run: RunResult, comparison: FixtureComparison }): void {
    const { baseline, candidate } = comparison
    console.log('')
    console.log(`  ${chalk.bold(comparison.id)}  ${deltaBadge(comparison.delta)}`)
    console.log(`  ${chalk.dim(evalFormat.truncate({ text: candidate.description, max: 108 }))}`)

    const table = new Table({ head: ['check', 'baseline', 'candidate'].map((header) => chalk.bold(header)), style: { head: [], border: [] } })
    baseline.assertions.forEach((assertion, index) => {
        table.push([`assert · ${assertion.label}`, flipCell(assertion.pass, candidate.assertions[index]?.pass ?? assertion.pass, true), flipCell(candidate.assertions[index]?.pass ?? assertion.pass, assertion.pass, false)])
    })
    baseline.judge.forEach((verdict, index) => {
        table.push([`judge · ${verdict.dimension}`, flipCell(verdict.pass, candidate.judge[index]?.pass ?? verdict.pass, true), flipCell(candidate.judge[index]?.pass ?? verdict.pass, verdict.pass, false)])
    })
    console.log(table.toString())

    const failedJudge = candidate.judge.filter((verdict) => !verdict.pass)
    if (failedJudge.length > 0) {
        console.log(`  ${chalk.dim('candidate judge notes')}`)
        for (const verdict of failedJudge) {
            console.log(`    ${chalk.red('✗')} ${verdict.dimension}: ${chalk.dim(evalFormat.truncate({ text: verdict.reason, max: 96 }))}`)
        }
    }

    printTranscript('baseline transcript', baseline.transcript)
    if (run.changed) {
        printTranscript('candidate transcript', candidate.transcript)
    }
}

function printTranscript(label: string, transcript: string): void {
    console.log(`  ${chalk.dim(`── ${label} ──`)}`)
    const lines = transcript.split('\n').filter((line) => line.trim().length > 0)
    for (const line of lines) {
        console.log(`    ${chalk.dim('›')} ${evalFormat.truncate({ text: line, max: 104 })}`)
    }
}

function verdictCell(passed: boolean): string {
    return passed ? chalk.green('PASS') : chalk.red('FAIL')
}

function flipCell(pass: boolean, other: boolean, isBaseline: boolean): string {
    const mark = pass ? '✓' : '✗'
    if (pass === other) {
        return pass ? chalk.green(mark) : chalk.red(mark)
    }
    const isRegression = isBaseline ? pass && !other : !pass && other
    return isRegression ? chalk.red.bold(mark) : chalk.green.bold(mark)
}

function deltaBadge(delta: FixtureComparison['delta']): string {
    if (delta === 'improved') {
        return chalk.green('▲ improved')
    }
    if (delta === 'regressed') {
        return chalk.red('▼ regressed')
    }
    return chalk.dim('= same')
}

function headline({ improved, regressed }: { improved: number, regressed: number }): string {
    if (regressed > 0) {
        return chalk.red.bold(`candidate regressed ${regressed} fixture(s)${improved > 0 ? `, improved ${improved}` : ''}`)
    }
    if (improved > 0) {
        return chalk.green.bold(`candidate improved ${improved} fixture(s), no regressions`)
    }
    return chalk.dim('no change between baseline and candidate')
}

export const evalReview = {
    review,
}

export type ReviewOutcome =
    | { kind: 'exit', code: number }
    | { kind: 'rerun' }
