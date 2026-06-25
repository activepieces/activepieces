import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { tryCatch } from '@activepieces/core-utils'
import chalk from 'chalk'
import { repoRoot } from '../core/repo-root'
import { evalClient, RunMode } from './client'
import { liveReport } from './report'
import { liveScenarios } from './scenarios'
import { liveTagger, ScenarioScore } from './tagger'

const RESULTS_DIR = path.join(__dirname, 'results')
const MODEL_ID = process.env.AP_EVAL_MODEL_ID ?? '(platform default)'

async function main(): Promise<void> {
    const apiKey = process.env.AP_API_KEY
    if (!apiKey) {
        fail('AP_API_KEY is not set. Run via `npm run chat-evals:live` (it sources .env.dev), and ensure the dev backend is running.')
    }

    const args = parseArgs(process.argv.slice(2))
    const scenarios = args.only.length > 0 ? liveScenarios.all().filter((s) => args.only.includes(s.id)) : liveScenarios.all()
    if (scenarios.length === 0) {
        fail(`No scenarios matched --only=${args.only.join(',')}`)
    }

    const client = evalClient.create({ apiKey: apiKey as string })
    const mode: RunMode = args.live ? 'live' : 'discovery'
    console.log(chalk.dim(`  mode: ${mode}${mode === 'discovery' ? ' (no side effects; execute is neutralized)' : ' (REAL execution against connections)'}`))

    console.log(chalk.dim('  resolving sandbox platform…'))
    const { data: platformId, error: platformError } = await tryCatch(() => client.getSandboxPlatformId())
    if (platformError || !platformId) {
        fail(`Could not reach the dev backend at the eval endpoint. Is it running (EE, port 3000)?\n  ${platformError instanceof Error ? platformError.message : String(platformError)}`)
    }

    const scores: ScenarioScore[] = []
    for (const scenario of scenarios) {
        process.stdout.write(chalk.dim(`  ▶ ${scenario.id} … `))
        const { data: outcome, error } = await tryCatch(() => client.runTurn({ platformId: platformId as string, userMessage: scenario.prompt, mode }))
        if (error || !outcome) {
            console.log(chalk.red(`error (${error instanceof Error ? error.message : String(error)})`))
            continue
        }
        const score = liveTagger.tag({ scenario, uiMessages: outcome.uiMessages })
        scores.push(score)
        const reached = mode === 'discovery' ? 'reached call' : 'ok'
        const verdict = score.outcome === 'did-work' ? chalk.green(reached) : (score.outcome === 'blocked-connection' ? chalk.cyan('needs connection') : chalk.red('stuck'))
        console.log(`${verdict} ${chalk.dim(`(${score.totalToolCalls} calls, ${fmtHops(score.hopsBeforeFirstExecute)} hops, ${outcome.status})`)}`)
    }

    const scorecard = liveTagger.aggregate({ scores })
    const label = args.label ?? `${mode} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
    writeResults({ scorecard, label, mode, out: args.out })
    printSummary({ scorecard, mode })
}

function writeResults({ scorecard, label, mode, out }: { scorecard: ReturnType<typeof liveTagger.aggregate>, label: string, mode: RunMode, out?: string }): void {
    mkdirSync(RESULTS_DIR, { recursive: true })
    const base = out ?? path.join(RESULTS_DIR, `baseline-${mode}`)
    const jsonPath = path.isAbsolute(base) ? `${base}.json` : path.join(repoRoot, `${base}.json`)
    const mdPath = jsonPath.replace(/\.json$/, '.md')
    writeFileSync(jsonPath, JSON.stringify({ label, mode, modelId: MODEL_ID, ...scorecard }, null, 2))
    writeFileSync(mdPath, liveReport.toMarkdown({ scorecard, label, mode, modelId: MODEL_ID }))
    console.log(chalk.dim(`\n  scorecard → ${path.relative(repoRoot, jsonPath)} (+ .md)`))
}

function printSummary({ scorecard, mode }: { scorecard: ReturnType<typeof liveTagger.aggregate>, mode: RunMode }): void {
    const reachedLabel = mode === 'discovery' ? 'reached runnable call' : 'succeeded'
    console.log('')
    console.log(chalk.bold('  Summary'))
    console.log(`    ${reachedLabel}: ${scorecard.succeededCount}/${scorecard.scenarioCount}`)
    console.log(`    needs connection: ${scorecard.blockedOnConnectionCount} (not a failure)`)
    console.log(`    stuck/gave up:    ${scorecard.gaveUpCount}`)
    console.log(`    avg tool calls:   ${scorecard.avgToolCalls}`)
    console.log(`    avg hops→execute: ${fmtHops(scorecard.avgHopsBeforeExecute)}`)
    console.log(`    bad-arg / auth:   ${scorecard.totalBadArgRejections} / ${scorecard.totalAuthBlocked}`)
    console.log(`    breaker / forgot: ${scorecard.totalBreakerHits} / ${scorecard.totalSchemaRefetches}`)
    console.log(`    wrong instrument: ${scorecard.wrongInstrumentCount}/${scorecard.rightInstrumentGraded} graded`)
    console.log(`    native handled:   ${scorecard.nativeHandledCount}/${scorecard.nativeGraded} graded`)
}

function parseArgs(argv: string[]): { only: string[], out?: string, label?: string, live: boolean } {
    const only: string[] = []
    let out: string | undefined
    let label: string | undefined
    let live = false
    for (const arg of argv) {
        if (arg.startsWith('--only=')) only.push(...arg.slice('--only='.length).split(','))
        else if (arg.startsWith('--out=')) out = arg.slice('--out='.length)
        else if (arg.startsWith('--label=')) label = arg.slice('--label='.length)
        else if (arg === '--live') live = true
    }
    return { only, out, label, live }
}

function fmtHops(value: number | null): string {
    return value === null ? 'n/a' : String(value)
}

function fail(message: string): never {
    console.error(chalk.red(`  ${message}`))
    process.exit(2)
}

main().catch((error) => {
    console.error(chalk.red(`  chat-evals:live failed: ${error instanceof Error ? error.message : String(error)}`))
    process.exit(2)
})
