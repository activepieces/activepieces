/**
 * Reproduces a production incident: a single EXECUTE_PROPERTY request stalls
 * for minutes (then hits the sandbox timeout → SIGKILL → retry storm) under
 * SANDBOX_CODE_ONLY when the flow contains a step with a huge, deeply-nested
 * sample output (e.g. a full Google Docs `documents.get` response, ~17 MB)
 * that is referenced by a loop step — even though the property being resolved
 * never references that step.
 *
 * Mechanism: testExecutionContext.stateFromFlowVersion() eagerly resolves
 * EVERY loop step's settings through the props resolver. Each `{{...}}` token
 * pushes the whole referenced state through JSON.stringify + JSON.parse +
 * ivm.ExternalCopy into a fresh 128 MB isolate, twice (resolved + censored
 * pass) — regardless of what the EXECUTE_PROPERTY input actually references.
 *
 * AP_EXECUTION_MODE must be set before the engine's code-sandbox module is
 * evaluated (it captures the env var at import time), hence the dynamic
 * imports below.
 */
process.env.AP_EXECUTION_MODE = 'SANDBOX_CODE_ONLY'

import {
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'

const HUGE_STEP_NAME = 'step_1'
const PARAGRAPH_COUNT = 25_000
const MAX_ACCEPTABLE_DURATION_MS = 5_000

describe('executeProps with huge sample data on an unreferenced step', () => {
    it('resolves a property that does not reference the huge step without stalling', async () => {
        const { testExecutionContext } = await import('../../src/lib/handler/context/test-execution-context')
        const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const flowVersion = buildFlowVersion()
        const hugeDocument = buildGoogleDocsLikeDocument({ paragraphCount: PARAGRAPH_COUNT })
        const sampleData = {
            trigger: { body: { filter: 'active' } },
            [HUGE_STEP_NAME]: hugeDocument,
        }
        console.log(`sample data size: ${(JSON.stringify(hugeDocument).length / 1024 / 1024).toFixed(1)} MB`)

        const stepNames = ['trigger', HUGE_STEP_NAME, 'step_2', 'step_3', 'step_4']
        const constants = generateMockEngineConstants({ stepNames })

        // A dropdown input on an unrelated step: no reference to step_1
        const unresolvedInput = {
            authType: 'basic',
            filter: '{{trigger[\'body\'][\'filter\']}}',
        }

        const startedAt = performance.now()

        // Mirrors pieceHelper.executeProps: build the test state, then resolve
        // the queried property's input against it.
        const executionState = await testExecutionContext.stateFromFlowVersion({
            apiUrl: constants.internalApiUrl,
            flowVersion,
            projectId: constants.projectId,
            engineToken: constants.engineToken,
            sampleData,
            engineConstants: constants,
            unresolvedInput,
        })

        const { resolvedInput } = await createPropsResolver({
            apiUrl: constants.internalApiUrl,
            projectId: constants.projectId,
            engineToken: constants.engineToken,
            contextVersion: undefined,
            stepNames,
        }).resolve<{ authType: string, filter: string }>({
            unresolvedInput,
            executionState,
        })

        const elapsedMs = performance.now() - startedAt
        console.log(`EXECUTE_PROPERTY resolution took ${Math.round(elapsedMs)} ms`)

        expect(resolvedInput).toEqual({ authType: 'basic', filter: 'active' })
        expect(elapsedMs).toBeLessThan(MAX_ACCEPTABLE_DURATION_MS)
    }, 300_000)

    it('still resolves loop items when the property input references the loop', async () => {
        const { testExecutionContext } = await import('../../src/lib/handler/context/test-execution-context')
        const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
        const { generateMockEngineConstants } = await import('../handler/test-helper')

        const flowVersion = buildFlowVersion()
        const smallDocument = buildGoogleDocsLikeDocument({ paragraphCount: 3 })
        const sampleData = {
            trigger: { body: { filter: 'active' } },
            [HUGE_STEP_NAME]: smallDocument,
        }

        const stepNames = ['trigger', HUGE_STEP_NAME, 'step_2', 'step_3', 'step_4']
        const constants = generateMockEngineConstants({ stepNames })

        // References the loop's item: the loop must resolve even though the
        // huge step is only referenced transitively through the loop settings.
        const unresolvedInput = {
            paragraphStart: '{{step_2[\'item\'][\'startIndex\']}}',
        }

        const executionState = await testExecutionContext.stateFromFlowVersion({
            apiUrl: constants.internalApiUrl,
            flowVersion,
            projectId: constants.projectId,
            engineToken: constants.engineToken,
            sampleData,
            engineConstants: constants,
            unresolvedInput,
        })

        const { resolvedInput } = await createPropsResolver({
            apiUrl: constants.internalApiUrl,
            projectId: constants.projectId,
            engineToken: constants.engineToken,
            contextVersion: undefined,
            stepNames,
        }).resolve<{ paragraphStart: number }>({
            unresolvedInput,
            executionState,
        })

        expect(resolvedInput).toEqual({ paragraphStart: 0 })
    }, 60_000)
})

function buildFlowVersion(): FlowVersion {
    return {
        id: 'flowVersionId',
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-01T00:00:00.000Z',
        flowId: 'flowId',
        displayName: 'POST - Call back',
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        connectionIds: [],
        backupFiles: null,
        notes: [],
        state: FlowVersionState.DRAFT,
        trigger: {
            name: 'trigger',
            displayName: 'Catch Webhook',
            type: FlowTriggerType.EMPTY,
            settings: {},
            valid: true,
            nextAction: {
                name: HUGE_STEP_NAME,
                displayName: 'Read Document',
                type: FlowActionType.CODE,
                skip: false,
                valid: true,
                settings: {
                    input: {},
                    sourceCode: { code: '', packageJson: '' },
                },
                nextAction: {
                    name: 'step_2',
                    displayName: 'Loop on Paragraphs',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    skip: false,
                    valid: true,
                    settings: {
                        items: `{{${HUGE_STEP_NAME}['body']['content']}}`,
                    },
                    nextAction: {
                        name: 'step_3',
                        displayName: 'Second Loop on Paragraphs',
                        type: FlowActionType.LOOP_ON_ITEMS,
                        skip: false,
                        valid: true,
                        settings: {
                            items: `{{${HUGE_STEP_NAME}['body']['content']}}`,
                        },
                    },
                },
            },
        },
    }
}

/**
 * Emulates the shape of a Google Docs `documents.get` response: a huge array
 * of paragraphs where every textRun carries fully-expanded style objects.
 * ~25k paragraphs ≈ 17 MB of JSON made of hundreds of thousands of small
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
