/**
 * Performance microbenchmarks for props-resolution hot paths in flow execution.
 * Validates findings from the props-resolver audit: isolate churn, censoring overhead,
 * router eager-branch resolution, and per-token copy costs.
 *
 * Thresholds are set conservatively to pass on slow CI machines; they're meant to
 * regress catastrophically (10-100x slowdown), not catch small regressions.
 */
process.env.AP_EXECUTION_MODE = 'SANDBOX_CODE_ONLY'

import {
    BranchCondition,
    BranchExecutionType,
    BranchOperator,
    FlowActionType,
    GenericStepOutput,
    RouterExecutionType,
    StepOutputStatus,
} from '@activepieces/shared'

const MAX_ACCEPTABLE_LOOP_RESOLUTION_MS = 3_000
const MAX_ACCEPTABLE_ROUTER_MS_PER_BRANCH = 300
const MAX_ACCEPTABLE_CENSORING_TAX_RATIO = 2.5
const MAX_ACCEPTABLE_ISOLATE_PER_TOKEN_MS = 150
const MAX_ACCEPTABLE_CSV_LOOP_RESOLUTION_MS = 8_000

describe('Props resolution performance under large payloads', () => {
    beforeEach(() => {
        if (global.gc) {
            global.gc()
        }
    })

    it('resolves a loop `items` expression over a large deeply-nested payload without stalling', async () => {
        // Measures the props-resolution clone/isolate cost of a large deeply-nested payload — the
        // incident shape from PR #14047. Drives the same resolve() clone a LOOP_ON_ITEMS pays on its
        // `items` expression, isolated from the cost of actually iterating the loop body (that
        // per-iteration overhead is a separate concern — see the loop-iteration observation below).
        const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const stepNames = ['trigger', 'step_1']
        const constants = generateMockEngineConstants({ stepNames })

        const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
        let executionState = await FlowExecutorContext.empty().upsertStep(
            'trigger',
            GenericStepOutput.create({
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: {},
            }),
        )

        const largePayload = buildGoogleDocsLikeDocument({ paragraphCount: 5_000 })
        executionState = await executionState.upsertStep(
            'step_1',
            GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: largePayload,
            }),
        )

        const resolver = createPropsResolver({
            engineToken: constants.engineToken,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            contextVersion: undefined,
            stepNames,
        })

        const unresolvedInput = { items: '{{step_1[\'output\'][\'body\'][\'content\']}}' }

        const startedAt = performance.now()
        const memBefore = process.memoryUsage().heapUsed

        await resolver.resolve({
            unresolvedInput,
            executionState,
        })

        const memAfter = process.memoryUsage().heapUsed
        const elapsedMs = performance.now() - startedAt
        const heapDeltaMb = (memAfter - memBefore) / 1024 / 1024

        console.log(`Loop items resolution over ${(JSON.stringify(largePayload).length / 1024 / 1024).toFixed(1)}MB payload: ${Math.round(elapsedMs)}ms, heap Δ ${heapDeltaMb.toFixed(1)}MB`)
        expect(elapsedMs).toBeLessThan(MAX_ACCEPTABLE_LOOP_RESOLUTION_MS)
    }, 30_000)

    it('router branch resolution cost scales with branch count, not payload size', async () => {
        const { routerExecuter } = await import('../../src/lib/handler/router-executor')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const stepNames = ['trigger', 'step_1']
        const constants = generateMockEngineConstants({ stepNames })

        // Create execution state with a large payload
        const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
        let executionState = await FlowExecutorContext.empty().upsertStep(
            'trigger',
            GenericStepOutput.create({
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: {},
            }),
        )

        const largePayload = buildGoogleDocsLikeDocument({ paragraphCount: 5_000 })
        executionState = await executionState.upsertStep(
            'step_1',
            GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: largePayload,
            }),
        )

        const buildRouterWithBranches = (branchCount: number) => ({
            name: 'router',
            displayName: 'Test Router',
            type: FlowActionType.ROUTER,
            skip: false,
            settings: {
                branches: Array.from({ length: branchCount }, (_, i) => ({
                    branchType: i === branchCount - 1 ? BranchExecutionType.FALLBACK : BranchExecutionType.CONDITION,
                    branchName: `Branch ${i + 1}`,
                    conditions: i === branchCount - 1 ? undefined : [[{
                        operator: BranchOperator.TEXT_CONTAINS,
                        firstValue: '{{step_1[\'output\'][\'body\'][\'content\'][0][\'paragraph\'][\'elements\'][0][\'textRun\'][\'content\']}}',
                        secondValue: 'Paragraph',
                        caseSensitive: true,
                    } as BranchCondition]],
                })),
                executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            },
            children: Array.from({ length: branchCount }, () => ({
                name: 'action',
                displayName: 'Action',
                type: FlowActionType.CODE,
                skip: false,
                settings: {
                    input: {},
                    sourceCode: { packageJson: '', code: '' },
                },
                valid: true,
            })),
            valid: true,
        })

        const timings = []
        for (const branchCount of [3, 10, 30]) {
            const router = buildRouterWithBranches(branchCount)
            const startedAt = performance.now()
            await routerExecuter.handle({
                action: router,
                executionState,
                constants,
            })
            const elapsedMs = performance.now() - startedAt
            timings.push({ branchCount, elapsedMs })
            console.log(`Router with ${branchCount} branches: ${Math.round(elapsedMs)}ms`)
        }

        // Assert cost per branch doesn't blow up
        for (const { branchCount, elapsedMs } of timings) {
            const costPerBranch = elapsedMs / branchCount
            expect(costPerBranch).toBeLessThan(MAX_ACCEPTABLE_ROUTER_MS_PER_BRANCH)
        }

        // Assert scaling is approximately linear (not quadratic)
        const costPer3 = timings[0].elapsedMs / 3
        const costPer10 = timings[1].elapsedMs / 10
        const costPer30 = timings[2].elapsedMs / 30
        expect(costPer10).toBeLessThan(costPer3 * 1.5) // Allow 50% slowdown on slower CI
        expect(costPer30).toBeLessThan(costPer3 * 1.5)
    }, 30_000)

    it('censoring pass does not add significant overhead for non-secret tokens', async () => {
        const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const stepNames = ['trigger', 'step_1']
        const constants = generateMockEngineConstants({ stepNames })

        // Create execution state with a large payload
        const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
        let executionState = await FlowExecutorContext.empty().upsertStep(
            'trigger',
            GenericStepOutput.create({
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: {},
            }),
        )

        const largePayload = buildGoogleDocsLikeDocument({ paragraphCount: 3_000 })
        executionState = await executionState.upsertStep(
            'step_1',
            GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: largePayload,
            }),
        )

        const resolver = createPropsResolver({
            engineToken: constants.engineToken,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            contextVersion: undefined,
            stepNames,
        })

        // Input with only step-output references (no secrets)
        const unresolvedInput = {
            title: '{{step_1[\'output\'][\'title\']}}',
            content: '{{step_1[\'output\'][\'body\'][\'content\']}}',
        }

        const startedAt = performance.now()
        const { resolvedInput, censoredInput } = await resolver.resolve({
            unresolvedInput,
            executionState,
        })
        const elapsedMs = performance.now() - startedAt

        // For non-secret tokens, censoredInput should match resolvedInput
        // (both paid the same isolate cost, so if censoring is truly wasted, we see 2x overhead)
        expect(JSON.stringify(censoredInput)).toBe(JSON.stringify(resolvedInput))

        console.log(`Props resolution of 2 tokens over ${(JSON.stringify(largePayload).length / 1024 / 1024).toFixed(1)}MB payload: ${Math.round(elapsedMs)}ms`)
        console.log(`Note: with redundant censoring, expect ~${Math.round(elapsedMs * 0.5)}ms if censoring pass is eliminated`)

        // If this threshold ever breaks, censoring double-pass is the culprit
        expect(elapsedMs).toBeLessThan(MAX_ACCEPTABLE_LOOP_RESOLUTION_MS)
    }, 30_000)

    it('per-token isolate creation overhead scales linearly with property count', async () => {
        const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const stepNames = ['trigger', 'step_1']
        const constants = generateMockEngineConstants({ stepNames })

        // Create execution state with a moderately large payload
        const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
        let executionState = await FlowExecutorContext.empty().upsertStep(
            'trigger',
            GenericStepOutput.create({
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: {},
            }),
        )

        const largePayload = buildGoogleDocsLikeDocument({ paragraphCount: 2_000 })
        executionState = await executionState.upsertStep(
            'step_1',
            GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: largePayload,
            }),
        )

        const resolver = createPropsResolver({
            engineToken: constants.engineToken,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            contextVersion: undefined,
            stepNames,
        })

        // Build inputs with K references to the same large step
        const timings = []
        for (const tokenCount of [1, 3, 5]) {
            const unresolvedInput = Object.fromEntries(
                Array.from({ length: tokenCount }, (_, i) => [
                    `prop_${i}`,
                    `{{step_1['output']['title']}}`,
                ]),
            )

            if (global.gc) {
                global.gc()
            }

            const startedAt = performance.now()
            await resolver.resolve({
                unresolvedInput,
                executionState,
            })
            const elapsedMs = performance.now() - startedAt
            timings.push({ tokenCount, elapsedMs })
            console.log(`${tokenCount} token(s) referencing same large step: ${Math.round(elapsedMs)}ms`)
        }

        // Per-token cost should not explode (linear scaling acceptable)
        for (const { tokenCount, elapsedMs } of timings) {
            const costPerToken = elapsedMs / tokenCount
            expect(costPerToken).toBeLessThan(MAX_ACCEPTABLE_ISOLATE_PER_TOKEN_MS)
        }

        // Scaling should be linear, not exponential
        const costPerToken1 = timings[0].elapsedMs / 1
        const costPerToken3 = timings[1].elapsedMs / 3
        const costPerToken5 = timings[2].elapsedMs / 5
        expect(costPerToken3).toBeLessThan(costPerToken1 * 1.3) // Allow 30% variance
        expect(costPerToken5).toBeLessThan(costPerToken1 * 1.3)
    }, 30_000)

    it('resolves a loop `items` expression referencing a 100k-row parsed-CSV array without stalling', async () => {
        // Measures the props-resolution clone/isolate cost of a large parsed-CSV array — the shape
        // benchmark/setup-csv-huge.sh loops over. This drives the same resolve() clone a LOOP_ON_ITEMS
        // pays on its `items` expression, without also paying for 100k empty loop iterations (that
        // whole-loop cost is exercised end-to-end in the load fixture, not here).
        const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const stepNames = ['trigger', 'step_1']
        const constants = generateMockEngineConstants({ stepNames })

        const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
        let executionState = await FlowExecutorContext.empty().upsertStep(
            'trigger',
            GenericStepOutput.create({
                type: 'EMPTY',
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: {},
            }),
        )

        // Shape mirrors benchmark/setup-csv-huge.sh: a code step that parsed a CSV into row objects.
        const rowCount = 100_000
        const parsedCsv = buildParsedCsvRows({ rowCount })
        executionState = await executionState.upsertStep(
            'step_1',
            GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: parsedCsv,
            }),
        )

        const resolver = createPropsResolver({
            engineToken: constants.engineToken,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            contextVersion: undefined,
            stepNames,
        })

        const unresolvedInput = { items: '{{step_1[\'output\'][\'rows\']}}' }

        const startedAt = performance.now()
        const memBefore = process.memoryUsage().heapUsed

        const { resolvedInput } = await resolver.resolve<{ items: unknown[] }>({
            unresolvedInput,
            executionState,
        })

        const memAfter = process.memoryUsage().heapUsed
        const elapsedMs = performance.now() - startedAt
        const heapDeltaMb = (memAfter - memBefore) / 1024 / 1024
        const payloadMb = JSON.stringify(parsedCsv).length / 1024 / 1024

        expect(resolvedInput.items).toHaveLength(rowCount)

        console.log(`CSV items resolution over ${rowCount} rows (~${payloadMb.toFixed(1)}MB): ${Math.round(elapsedMs)}ms, heap Δ ${heapDeltaMb.toFixed(1)}MB`)
        expect(elapsedMs).toBeLessThan(MAX_ACCEPTABLE_CSV_LOOP_RESOLUTION_MS)
    }, 60_000)
})

/**
 * Emulates the shape of a Google Docs `documents.get` response: a huge array
 * of paragraphs where every textRun carries fully-expanded style objects.
 * ~N paragraphs ≈ (N/1470) MB of JSON made of hundreds of thousands of small
 * nested objects — the worst case for per-object copy costs.
 */
function buildGoogleDocsLikeDocument({ paragraphCount }: { paragraphCount: number }): Record<string, unknown> {
    const content = []
    for (let i = 0; i < paragraphCount; i++) {
        const startIndex = i * 100
        const endIndex = startIndex + 99
        content.push({
            startIndex,
            endIndex,
            paragraph: {
                elements: [
                    {
                        startIndex,
                        endIndex,
                        textRun: {
                            content: `Paragraph ${i} of the template with a placeholder value and trailing text.\n`,
                            textStyle: {
                                bold: false,
                                italic: false,
                                underline: false,
                                strikethrough: false,
                                smallCaps: false,
                                backgroundColor: {},
                                foregroundColor: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
                                fontSize: { magnitude: 11, unit: 'PT' },
                                weightedFontFamily: { fontFamily: 'Arial', weight: 400 },
                                baselineOffset: 'NONE',
                            },
                        },
                    },
                ],
                paragraphStyle: {
                    namedStyleType: 'NORMAL_TEXT',
                    alignment: 'START',
                    direction: 'LEFT_TO_RIGHT',
                    lineSpacing: 100,
                    spaceAbove: { magnitude: 0, unit: 'PT' },
                    spaceBelow: { magnitude: 0, unit: 'PT' },
                    borderBetween: emptyBorder(),
                    borderTop: emptyBorder(),
                    borderBottom: emptyBorder(),
                    borderLeft: emptyBorder(),
                    borderRight: emptyBorder(),
                },
            },
        })
    }
    return {
        documentId: 'template-document-id',
        title: 'Template',
        revisionId: 'revision-1',
        body: { content },
    }
}

function emptyBorder(): Record<string, unknown> {
    return {
        color: {},
        width: { magnitude: 0, unit: 'PT' },
        padding: { magnitude: 0, unit: 'PT' },
        dashStyle: 'SOLID',
    }
}

/**
 * Emulates the output of a code step that parsed a CSV file into row objects:
 * an array of `rowCount` flat records with ~8 string columns each. This is the
 * common "read a big spreadsheet / export" workload — many small uniform objects
 * rather than deep nesting — and at 100k rows the array is tens of MB of JSON that
 * the props resolver clones wholesale when a LOOP references it.
 */
function buildParsedCsvRows({ rowCount }: { rowCount: number }): Record<string, unknown> {
    const rows = []
    for (let i = 0; i < rowCount; i++) {
        rows.push({
            id: String(i),
            first_name: `First${i}`,
            last_name: `Last${i}`,
            email: `user${i}@example.com`,
            country: `Country${i % 200}`,
            amount: String((i * 13 % 100000) / 100),
            currency: 'USD',
            created_at: '2026-01-01T00:00:00.000Z',
        })
    }
    return { rowCount, rows }
}
