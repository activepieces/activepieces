import chalk from 'chalk'
import { Command } from 'commander'
import { chatEvalRunner } from '../runner'
import { evalReview } from './review'
import { evalRun } from './run'
import { evalStore, RunResult } from './store'

async function runFresh({ candidatePath }: { candidatePath?: string }): Promise<RunResult> {
    if (!chatEvalRunner.hasProviderKey()) {
        console.error(chalk.red('  No OpenRouter key found. Set AP_OPENROUTER_PROVISION_KEY or OPENROUTER_API_KEY.'))
        console.error(chalk.dim('  (npm run chat-evals loads these from .env.dev automatically.)'))
        process.exit(2)
    }
    console.log(chalk.dim('  running live evals (baseline vs candidate)…'))
    return evalRun.run({ candidatePath, onProgress: (message) => console.log(chalk.dim(`    ${message}`)) })
}

async function reviewLoop({ run, candidatePath }: { run: RunResult, candidatePath?: string }): Promise<never> {
    let current = run
    for (;;) {
        const outcome = await evalReview.review({ run: current })
        if (outcome.kind === 'rerun') {
            current = await runFresh({ candidatePath })
            continue
        }
        process.exit(outcome.code)
    }
}

const program = new Command()
program
    .name('chat-eval')
    .description('Interactive chat-prompt eval — baseline vs candidate, review, and decide')
    .option('--fresh', 'evaluate live instead of reusing the cached run')
    .option('--candidate <path>', 'A/B an explicit candidate system-prompt file (default: working tree vs HEAD)')
    .action(async (options: { fresh?: boolean, candidate?: string }) => {
        const cached = options.fresh ? null : evalStore.readRun()
        if (cached) {
            console.log(chalk.dim(`  reviewing cached run from ${cached.at} — pass --fresh to re-run live`))
        }
        const run = cached ?? await runFresh({ candidatePath: options.candidate })
        await reviewLoop({ run, candidatePath: options.candidate })
    })

program.parseAsync(process.argv).catch((error) => {
    console.error(chalk.red(`  chat-eval failed: ${error instanceof Error ? error.message : String(error)}`))
    process.exit(2)
})
