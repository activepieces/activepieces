import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { chunk, tryCatch } from '@activepieces/core-utils'
import { ToolSet } from 'ai'
import { evalAgentTurn } from './agent-turn'
import { CheckResult, evalChecks } from './checks'
import { evalCase, EvalCase } from './eval-case'
import { posthogDataset } from './posthog-dataset'
import { evalToolSet } from './tool-set'

async function main(): Promise<void> {
    if (existsSync(ENV_FILE)) {
        process.loadEnvFile(ENV_FILE)
    }
    const { values } = parseArgs({
        options: {
            case: { type: 'string', multiple: true },
            model: { type: 'string', default: DEFAULT_MODEL },
            dataset: { type: 'string', default: DEFAULT_DATASET },
        },
    })
    const onlyCases = new Set((values.case ?? []).map(Number))
    const items = await posthogDataset.loadItems({ datasetName: values.dataset })
    const cases = items
        .map((item) => evalCase.fromDatasetItem(item))
        .filter((candidate) => onlyCases.size === 0 || onlyCases.has(candidate.caseNumber))
        .sort((a, b) => a.caseNumber - b.caseNumber)
    console.log(`${cases.length} case(s) from "${values.dataset}" · model ${values.model} · judge ${evalChecks.judgeModelId()} · nothing is uploaded`)

    const auth = await evalAgentTurn.resolveAuth()
    const mcp = await evalToolSet.connectMcp({ conversationId: EVAL_CONVERSATION_ID })
    const results = await runInBatches({ cases, run: (candidate) => evaluate({ candidate, mcpToolSet: mcp.toolSet, modelId: values.model, auth }) })
        .finally(async () => {
            await mcp.close().catch(() => undefined)
            await evalAgentTurn.cleanupAuth()
        })

    const passed = results.filter((result) => result.passed).length
    console.log(`\n${passed === results.length ? '✓' : '✗'} ${passed}/${results.length} cases passed`)
    process.exit(passed === results.length ? 0 : 1)
}

async function runInBatches({ cases, run }: { cases: EvalCase[], run: (candidate: EvalCase) => Promise<CaseResult> }): Promise<CaseResult[]> {
    const results: CaseResult[] = []
    for (const batch of chunk(cases, CONCURRENCY)) {
        const done = await Promise.all(batch.map(run))
        done.forEach(print)
        results.push(...done)
    }
    return results
}

async function evaluate({ candidate, mcpToolSet, modelId, auth }: { candidate: EvalCase, mcpToolSet: ToolSet, modelId: string, auth: Record<string, unknown> }): Promise<CaseResult> {
    const { data, error } = await tryCatch(async () => {
        const outcome = await evalAgentTurn.run({ evalCase: candidate, mcpToolSet, modelId, auth })
        const checks = await evalChecks.grade({ evalCase: candidate, outcome, auth })
        return { checks, divergences: outcome.divergences.map((divergence) => divergence.reason) }
    })
    if (error) {
        return { candidate, passed: false, checks: [{ name: 'run completed', pass: false, reason: error.message }], divergences: [] }
    }
    return { candidate, passed: data.checks.every((check) => check.pass), ...data }
}

function print(result: CaseResult): void {
    console.log(`\n${result.passed ? '✓' : '✗'} case ${result.candidate.caseNumber} [${result.candidate.problemType}]`)
    result.checks.forEach((check) => {
        console.log(`    ${check.pass ? 'pass' : 'FAIL'}  ${check.name}`)
        if (!check.pass) {
            console.log(`          ${check.reason}`)
        }
    })
    result.divergences.forEach((reason) => console.log(`    replay stopped: ${reason}`))
}

const ENV_FILE = '.env.dev'
const DEFAULT_MODEL = 'z-ai/glm-5.3'
const DEFAULT_DATASET = 'chat-regressions'
const EVAL_CONVERSATION_ID = 'eval-conversation'
const CONCURRENCY = 4

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
})

type CaseResult = {
    candidate: EvalCase
    passed: boolean
    checks: CheckResult[]
    divergences: string[]
}
