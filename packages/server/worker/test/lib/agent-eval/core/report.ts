import chalk from 'chalk'
import { evalFormat, JudgeAgreement } from './eval-format'

function render({ entries, judgeAgreement }: { entries: EvalReportEntry[], judgeAgreement: JudgeAgreement | null }): string {
    const first = entries[0]
    const lines = [
        '',
        chalk.bold.cyan('  Activepieces · Chat Prompt Eval'),
        `  ${chalk.dim('model')} ${first ? `${first.provider} · ${first.modelId}` : '—'}`,
        `  ${chalk.dim('judge')} ${first ? first.judgeModelId : '—'} ${chalk.dim(`· ${first ? first.runs : 0} run(s) per fixture, majority wins`)}`,
        '',
    ]

    for (const entry of entries) {
        const status = `${entry.passed ? chalk.green('PASS') : chalk.red('FAIL')} ${entry.passes}/${entry.runs}`
        lines.push(`  ${entry.passed ? chalk.green('●') : chalk.red('●')} ${chalk.bold(entry.id)} ${chalk.dim(`[${entry.kind}]`)} ${status}`)
        for (const check of [...entry.assertions.map((a) => ({ name: a.label, pass: a.pass, reason: a.reason })), ...entry.judge.map((v) => ({ name: v.expectedLabel === 'fail' ? `${v.dimension} (expect FAIL)` : v.dimension, pass: v.pass, reason: v.reason }))]) {
            const detail = check.pass ? '' : chalk.red(`  ${evalFormat.truncate({ text: check.reason, max: 72 })}`)
            lines.push(`      ${check.pass ? chalk.green('✓') : chalk.red('✗')} ${check.name}${detail}`)
        }
    }

    const passed = entries.filter((entry) => entry.passed).length
    const { tpr, tnr } = evalFormat.expectedLabelMatch(entries)
    const verdict = passed === entries.length ? chalk.green.bold('GREEN') : chalk.red.bold('RED')
    lines.push('', `  ${passed}/${entries.length} fixtures passed · expected-label match TPR ${tpr.toFixed(2)}/TNR ${tnr.toFixed(2)} · ${verdict}`)
    lines.push(`  ${chalk.dim('judge vs labels')} ${judgeAgreement ? `${formatRate(judgeAgreement.tpr)} TPR / ${formatRate(judgeAgreement.tnr)} TNR over ${judgeAgreement.n} labelled case(s), ${judgeAgreement.drafts} of them model-written drafts` : 'no labelled cases yet'}`, '')
    return lines.join('\n') + '\n'
}

function formatRate(rate: number | null): string {
    return rate === null ? '—' : rate.toFixed(2)
}

export const agentEvalReport = {
    render,
}

export type EvalReportEntry = {
    id: string
    kind: string
    description: string
    provider: string
    modelId: string
    judgeModelId: string
    runs: number
    passes: number
    passed: boolean
    assertions: AssertionEntry[]
    judge: JudgeVerdictEntry[]
    transcript: string
    runVerdicts: Array<{ passed: boolean, assertions: AssertionEntry[], judge: JudgeVerdictEntry[] }>
}

type AssertionEntry = { label: string, pass: boolean, reason: string }

type JudgeVerdictEntry = { dimension: string, expectedLabel: 'pass' | 'fail', pass: boolean, reason: string }
