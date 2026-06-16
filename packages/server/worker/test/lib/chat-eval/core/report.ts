import chalk from 'chalk'
import { evalFormat } from './eval-format'

function render({ entries }: { entries: EvalReportEntry[] }): string {
    const first = entries[0]
    const lines = [
        '',
        chalk.bold.cyan('  Activepieces · Chat Prompt Eval'),
        `  ${chalk.dim('model')} ${first ? `${first.provider} · ${first.modelId}` : '—'}`,
        '',
    ]

    for (const entry of entries) {
        const status = entry.passed ? chalk.green('PASS') : chalk.red('FAIL')
        lines.push(`  ${entry.passed ? chalk.green('●') : chalk.red('●')} ${chalk.bold(entry.id)} ${chalk.dim(`[${entry.kind}]`)} ${status}`)
        for (const check of [...entry.assertions.map((a) => ({ name: a.label, pass: a.pass, reason: a.reason })), ...entry.judge.map((v) => ({ name: v.dimension, pass: v.pass, reason: v.reason }))]) {
            const detail = check.pass ? '' : chalk.red(`  ${evalFormat.truncate({ text: check.reason, max: 72 })}`)
            lines.push(`      ${check.pass ? chalk.green('✓') : chalk.red('✗')} ${check.name}${detail}`)
        }
    }

    const passed = entries.filter((entry) => entry.passed).length
    const { tpr, tnr } = evalFormat.calibration(entries)
    const verdict = passed === entries.length ? chalk.green.bold('GREEN') : chalk.red.bold('RED')
    lines.push('', `  ${passed}/${entries.length} fixtures passed · calibration TPR ${tpr.toFixed(2)}/TNR ${tnr.toFixed(2)} · ${verdict}`, '')
    return lines.join('\n') + '\n'
}

export const chatEvalReport = {
    render,
}

export type EvalReportEntry = {
    id: string
    kind: string
    description: string
    provider: string
    modelId: string
    passed: boolean
    assertions: Array<{ label: string, pass: boolean, reason: string }>
    judge: Array<{ dimension: string, expectedLabel: 'pass' | 'fail', pass: boolean, reason: string }>
    transcript: string
}
