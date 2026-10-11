import chalk from 'chalk'
import { Command, InvalidArgumentError } from 'commander'
import { agentEvalRunner } from '../core/runner'
import { evalExportCalibration } from './export-calibration'
import { evalReview } from './review'
import { evalRun } from './run'
import { evalStore, RunResult } from './store'

async function runFresh({ candidatePath, baselineModelId, candidateModelId, only, limit }: RunOptions): Promise<RunResult> {
    if (!agentEvalRunner.hasProviderKey()) {
        console.error(chalk.red('  No OpenRouter key found. Set AP_OPENROUTER_PROVISION_KEY or OPENROUTER_API_KEY.'))
        console.error(chalk.dim('  (npm run agent-evals loads these from .env.dev automatically.)'))
        process.exit(2)
    }
    console.log(chalk.dim('  running live evals (baseline vs candidate)…'))
    return evalRun.run({ candidatePath, baselineModelId, candidateModelId, only, limit, onProgress: (message) => console.log(chalk.dim(`    ${message}`)) })
}

async function reviewLoop({ run, options }: { run: RunResult, options: RunOptions }): Promise<never> {
    let current = run
    for (;;) {
        const outcome = await evalReview.review({ run: current })
        if (outcome.kind === 'rerun') {
            current = await runFresh(options)
            continue
        }
        process.exit(outcome.code)
    }
}

function parsePositiveInt(value: string): number {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new InvalidArgumentError('must be a whole number of at least 1')
    }
    return parsed
}

function parseIdList(value: string): string[] {
    const ids = value.split(',').map((id) => id.trim()).filter((id) => id.length > 0)
    if (ids.length === 0) {
        throw new InvalidArgumentError('must include at least one fixture id')
    }
    return ids
}

const program = new Command()
program
    .name('agent-eval')
    .description('Interactive chat-prompt eval — baseline vs candidate, review, and decide')
    .option('--fresh', 'evaluate live instead of reusing the cached run')
    .option('--candidate <path>', 'A/B an explicit candidate system-prompt file (default: working tree vs HEAD)')
    .option('--baseline-model <id>', 'OpenRouter model for the baseline arm (default: the fixture model)')
    .option('--candidate-model <id>', 'OpenRouter model for the candidate arm (default: the fixture model)')
    .option('--limit <n>', 'run only the first n fixtures', parsePositiveInt)
    .option('--only <ids>', 'run only these fixtures (comma-separated ids)', parseIdList)
    .action(async (options: { fresh?: boolean, candidate?: string, baselineModel?: string, candidateModel?: string, limit?: number, only?: string[] }) => {
        const runOptions: RunOptions = { candidatePath: options.candidate, baselineModelId: options.baselineModel, candidateModelId: options.candidateModel, only: options.only, limit: options.limit }
        const wantsLiveRun = [options.baselineModel, options.candidateModel, options.limit, options.only].some((option) => option !== undefined)
        const cached = options.fresh || wantsLiveRun ? null : evalStore.readRun()
        if (cached) {
            console.log(chalk.dim(`  reviewing cached run from ${cached.at} — pass --fresh to re-run live`))
        }
        const run = cached ?? await runFresh(runOptions)
        await reviewLoop({ run, options: runOptions })
    })

program
    .command('export-calibration <resultsJson>')
    .description('Write unlabelled judge-calibration cases from a results JSON (e.g. a run downloaded from the CDN)')
    .action((resultsJson: string) => {
        const { written, skipped } = evalExportCalibration.exportCases({ resultsPath: resultsJson })
        console.log(`  wrote ${written} case(s), skipped ${skipped} already present — set "humanLabel" to "pass" or "fail" in each`)
    })

program.parseAsync(process.argv).catch((error) => {
    console.error(chalk.red(`  agent-eval failed: ${error instanceof Error ? error.message : String(error)}`))
    process.exit(2)
})

type RunOptions = { candidatePath?: string, baselineModelId?: string, candidateModelId?: string, only?: string[], limit?: number }
