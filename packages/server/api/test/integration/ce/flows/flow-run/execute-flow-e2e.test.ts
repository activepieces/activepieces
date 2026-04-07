/**
 * E2E integration test for full flow execution.
 *
 * Tests the round-trip:
 *   flowRunService.start() → BullMQ queue → worker poll → sandbox engine execution → flow run result
 *
 * Flow structure:
 *   Webhook Trigger → Data Mapper (piece action) → Code Action
 *
 * Prerequisites:
 *   - Engine must be built (cache/v7/common/main.js)
 *   - bun must be available for piece installation
 *   - Redis (in-memory via AP_REDIS_TYPE=MEMORY) is started automatically
 */
import {
    ExecutionType,
    FlowActionType,
    FlowRunStatus,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    ProgressUpdateType,
    RunEnvironment,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { flowRunService } from '../../../../../src/app/flows/flow-run/flow-run-service'
import { setupE2eEnvironment } from '../../../../helpers/e2e-setup'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../../helpers/mocks'
import { db } from '../../../../helpers/db'
import { worker } from '../../../../../../worker/src/lib/worker'

let app: FastifyInstance

beforeAll(async () => {
    const ctx = await setupE2eEnvironment()
    app = ctx.app
    await worker.start({
        apiUrl: ctx.apiUrl,
        socketUrl: { url: ctx.apiUrl, path: '/api/socket.io' },
        workerToken: ctx.workerToken,
    })
    await new Promise((resolve) => setTimeout(resolve, 5000))
}, 30_000)

afterAll(async () => {
    worker.stop()
    await app.close()
}, 15_000)

async function setupSubflowFixtures() {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

    const webhookPiece = createMockPieceMetadata({
        name: '@activepieces/piece-webhook',
        version: '0.1.29',
        platformId: undefined,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    })
    const subflowsPiece = createMockPieceMetadata({
        name: '@activepieces/piece-subflows',
        version: '0.4.11',
        platformId: undefined,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    })
    await databaseConnection().getRepository('piece_metadata').save([webhookPiece, subflowsPiece])

    // Child Flow: callableFlow trigger → code action → returnResponse action
    const childReturnResponseAction = {
        type: FlowActionType.PIECE as const,
        name: 'step_2',
        displayName: 'Return Response',
        valid: true,
        settings: {
            pieceName: '@activepieces/piece-subflows',
            pieceVersion: '0.4.11',
            actionName: 'returnResponse',
            input: {
                mode: 'simple',
                response: {
                    response: {
                        greeting: '{{step_1.greeting}}',
                        processed: '{{step_1.processed}}',
                    },
                },
            },
            propertySettings: {},
            errorHandlingOptions: {},
        },
    }

    const childCodeAction = {
        type: FlowActionType.CODE as const,
        name: 'step_1',
        displayName: 'Transform Data',
        valid: true,
        settings: {
            sourceCode: {
                code: `export const code = async (inputs) => {
                    return {
                        greeting: 'Hello ' + inputs.name,
                        processed: true,
                    };
                }`,
                packageJson: '{}',
            },
            input: {
                name: '{{trigger.data.name}}',
            },
            errorHandlingOptions: {},
        },
        nextAction: childReturnResponseAction,
    }

    const childFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.ENABLED,
    })

    const childFlowVersion = createMockFlowVersion({
        flowId: childFlow.id,
        state: FlowVersionState.LOCKED,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'Callable Flow',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-subflows',
                pieceVersion: '0.4.11',
                triggerName: 'callableFlow',
                input: {
                    mode: 'simple',
                    exampleData: {
                        sampleData: {
                            name: '',
                            greeting: '',
                        },
                    },
                },
                propertySettings: {},
            },
            nextAction: childCodeAction,
        },
    })

    await db.save('flow', childFlow)
    await db.save('flow_version', childFlowVersion)
    await db.update('flow', childFlow.id, { publishedVersionId: childFlowVersion.id })

    // Parent Flow: webhook trigger → callFlow action
    const parentCallFlowAction = {
        type: FlowActionType.PIECE as const,
        name: 'step_1',
        displayName: 'Call Flow',
        valid: true,
        settings: {
            pieceName: '@activepieces/piece-subflows',
            pieceVersion: '0.4.11',
            actionName: 'callFlow',
            input: {
                flow: {
                    externalId: childFlow.externalId,
                    exampleData: {
                        sampleData: {
                            name: '',
                            greeting: '',
                        },
                    },
                },
                mode: 'simple',
                flowProps: {
                    payload: {
                        name: '{{trigger.body.name}}',
                    },
                },
                waitForResponse: true,
            },
            propertySettings: {},
            errorHandlingOptions: {},
        },
    }

    const parentFlow = createMockFlow({
        projectId: mockProject.id,
    })
    await db.save('flow', parentFlow)

    const parentFlowVersion = createMockFlowVersion({
        flowId: parentFlow.id,
        state: FlowVersionState.DRAFT,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'Catch Webhook',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '0.1.29',
                triggerName: 'catch_webhook',
                input: { authType: 'none' },
                propertySettings: {},
            },
            nextAction: parentCallFlowAction,
        },
    })
    await db.save('flow_version', parentFlowVersion)

    return { parentFlow, parentFlowVersion, mockPlatform, mockProject }
}

async function setupSubflowWithWebhookResponseFixtures() {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

    const webhookPiece = createMockPieceMetadata({
        name: '@activepieces/piece-webhook',
        version: '0.1.29',
        platformId: undefined,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    })
    const subflowsPiece = createMockPieceMetadata({
        name: '@activepieces/piece-subflows',
        version: '0.4.11',
        platformId: undefined,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    })
    await databaseConnection().getRepository('piece_metadata').save([webhookPiece, subflowsPiece])

    // Child flow: callableFlow trigger → returnResponse (echoes back message)
    const childReturnResponseAction = {
        type: FlowActionType.PIECE as const,
        name: 'step_1',
        displayName: 'Return Response',
        valid: true,
        settings: {
            pieceName: '@activepieces/piece-subflows',
            pieceVersion: '0.4.11',
            actionName: 'returnResponse',
            input: {
                mode: 'simple',
                response: {
                    response: {
                        echo: '{{trigger.data.message}}',
                    },
                },
            },
            propertySettings: {},
            errorHandlingOptions: {},
        },
    }

    const childFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.ENABLED,
    })

    const childFlowVersion = createMockFlowVersion({
        flowId: childFlow.id,
        state: FlowVersionState.LOCKED,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'Callable Flow',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-subflows',
                pieceVersion: '0.4.11',
                triggerName: 'callableFlow',
                input: {
                    mode: 'simple',
                    exampleData: {
                        sampleData: {
                            message: '',
                        },
                    },
                },
                propertySettings: {},
            },
            nextAction: childReturnResponseAction,
        },
    })

    await db.save('flow', childFlow)
    await db.save('flow_version', childFlowVersion)
    await db.update('flow', childFlow.id, { publishedVersionId: childFlowVersion.id })

    // Parent flow: catch_webhook → callFlow (waitForResponse) → return_response (webhook).
    // Flow must be ENABLED + LOCKED so the /sync webhook route accepts and executes it.
    const parentReturnResponseAction = {
        type: FlowActionType.PIECE as const,
        name: 'step_2',
        displayName: 'Return Response',
        valid: true,
        settings: {
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '0.1.29',
            actionName: 'return_response',
            input: {
                responseType: 'json',
                respond: 'stop',
                fields: {
                    status: 200,
                    headers: {},
                    body: { echo: '{{step_1.data.echo}}' },
                },
            },
            propertySettings: {},
            errorHandlingOptions: {},
        },
    }

    const parentCallFlowAction = {
        type: FlowActionType.PIECE as const,
        name: 'step_1',
        displayName: 'Call Flow',
        valid: true,
        settings: {
            pieceName: '@activepieces/piece-subflows',
            pieceVersion: '0.4.11',
            actionName: 'callFlow',
            input: {
                flow: {
                    externalId: childFlow.externalId,
                    exampleData: {
                        sampleData: {
                            message: '',
                        },
                    },
                },
                mode: 'simple',
                flowProps: {
                    payload: {
                        message: '{{trigger.body.message}}',
                    },
                },
                waitForResponse: true,
            },
            propertySettings: {},
            errorHandlingOptions: {},
        },
        nextAction: parentReturnResponseAction,
    }

    const parentFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.ENABLED,
    })
    await db.save('flow', parentFlow)

    const parentFlowVersion = createMockFlowVersion({
        flowId: parentFlow.id,
        state: FlowVersionState.LOCKED,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'Catch Webhook',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '0.1.29',
                triggerName: 'catch_webhook',
                input: { authType: 'none' },
                propertySettings: {},
            },
            nextAction: parentCallFlowAction,
        },
    })
    await db.save('flow_version', parentFlowVersion)
    await db.update('flow', parentFlow.id, { publishedVersionId: parentFlowVersion.id })

    return { parentFlow, parentFlowVersion, mockPlatform, mockProject }
}

async function pollFlowRunToCompletion(flowRunId: string, projectId: string) {
    const maxWaitMs = 120_000
    const pollIntervalMs = 500
    const start = Date.now()
    let result = await flowRunService(app.log).getOnePopulatedOrThrow({
        id: flowRunId,
        projectId,
    })

    while (
        (result.status === FlowRunStatus.QUEUED ||
            result.status === FlowRunStatus.RUNNING ||
            result.status === FlowRunStatus.PAUSED) &&
        Date.now() - start < maxWaitMs
    ) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
        result = await flowRunService(app.log).getOnePopulatedOrThrow({
            id: flowRunId,
            projectId,
        })
    }

    return result
}

describe('Execute Flow E2E', () => {
    it('executes a webhook → data mapper → code flow end-to-end', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        // Save piece metadata records
        const webhookPiece = createMockPieceMetadata({
            name: '@activepieces/piece-webhook',
            version: '0.1.29',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        const dataMapperPiece = createMockPieceMetadata({
            name: '@activepieces/piece-data-mapper',
            version: '0.3.15',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().getRepository('piece_metadata').save([webhookPiece, dataMapperPiece])

        // Build the flow: trigger → data mapper → code
        const codeAction = {
            type: FlowActionType.CODE as const,
            name: 'step_2',
            displayName: 'Transform',
            valid: true,
            settings: {
                sourceCode: {
                    code: `export const code = async (inputs) => {
                        return {
                            greeting: 'Hello ' + inputs.data.fullName,
                            contact: inputs.data.emailAddress,
                            processed: true,
                        };
                    }`,
                    packageJson: '{}',
                },
                input: {
                    data: '{{step_1}}',
                },
                errorHandlingOptions: {},
            },
        }

        const dataMapperAction = {
            type: FlowActionType.PIECE as const,
            name: 'step_1',
            displayName: 'Map Data',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-data-mapper',
                pieceVersion: '~0.3.15',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        fullName: '{{trigger.body.name}}',
                        emailAddress: '{{trigger.body.email}}',
                    },
                },
                propertySettings: {},
                errorHandlingOptions: {},
            },
            nextAction: codeAction,
        }

        const mockFlow = createMockFlow({
            projectId: mockProject.id,
        })
        await db.save('flow', mockFlow)

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            state: FlowVersionState.DRAFT,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                displayName: 'Catch Webhook',
                valid: true,
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.1.29',
                    triggerName: 'catch_webhook',
                    input: { authType: 'none' },
                    propertySettings: {},
                },
                nextAction: dataMapperAction,
            },
        })
        await db.save('flow_version', mockFlowVersion)

        // Start the flow run directly (skip trigger execution)
        const flowRun = await flowRunService(app.log).start({
            flowId: mockFlow.id,
            payload: { body: { name: 'John Doe', email: 'john@example.com' } },
            platformId: mockPlatform.id,
            executionType: ExecutionType.BEGIN,
            environment: RunEnvironment.TESTING,
            progressUpdateType: ProgressUpdateType.NONE,
            executeTrigger: false,
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            synchronousHandlerId: undefined,
            httpRequestId: undefined,
            failParentOnFailure: undefined,
        })

        // Poll until flow run completes
        const maxWaitMs = 120_000
        const pollIntervalMs = 500
        const start = Date.now()
        let result = await flowRunService(app.log).getOnePopulatedOrThrow({
            id: flowRun.id,
            projectId: mockProject.id,
        })

        while (
            (result.status === FlowRunStatus.QUEUED || result.status === FlowRunStatus.RUNNING) &&
            Date.now() - start < maxWaitMs
        ) {
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
            result = await flowRunService(app.log).getOnePopulatedOrThrow({
                id: flowRun.id,
                projectId: mockProject.id,
            })
        }

        // Assertions
        expect(result.status).toBe(FlowRunStatus.SUCCEEDED)
        expect(result.steps.step_1.output).toEqual(
            expect.objectContaining({
                fullName: 'John Doe',
                emailAddress: 'john@example.com',
            }),
        )
        expect(result.steps.step_2.output).toEqual(
            expect.objectContaining({
                greeting: 'Hello John Doe',
                contact: 'john@example.com',
                processed: true,
            }),
        )
    }, 120_000)

    it('handles concurrent flow run executions without jobs getting stuck', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const webhookPiece = createMockPieceMetadata({
            name: '@activepieces/piece-webhook',
            version: '0.1.29',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().getRepository('piece_metadata').save([webhookPiece])

        const codeAction = {
            type: FlowActionType.CODE as const,
            name: 'step_1',
            displayName: 'Process',
            valid: true,
            settings: {
                sourceCode: {
                    code: `export const code = async (inputs) => {
                        return { processed: true };
                    }`,
                    packageJson: '{}',
                },
                input: {},
                errorHandlingOptions: {},
            },
        }

        const mockFlow = createMockFlow({
            projectId: mockProject.id,
        })
        await db.save('flow', mockFlow)

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            state: FlowVersionState.DRAFT,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                displayName: 'Catch Webhook',
                valid: true,
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.1.29',
                    triggerName: 'catch_webhook',
                    input: { authType: 'none' },
                    propertySettings: {},
                },
                nextAction: codeAction,
            },
        })
        await db.save('flow_version', mockFlowVersion)

        const concurrentCount = 5

        const flowRuns = await Promise.all(
            Array.from({ length: concurrentCount }, (_, i) =>
                flowRunService(app.log).start({
                    flowId: mockFlow.id,
                    payload: { body: { index: i } },
                    platformId: mockPlatform.id,
                    executionType: ExecutionType.BEGIN,
                    environment: RunEnvironment.TESTING,
                    progressUpdateType: ProgressUpdateType.NONE,
                    executeTrigger: false,
                    flowVersionId: mockFlowVersion.id,
                    projectId: mockProject.id,
                    synchronousHandlerId: undefined,
                    httpRequestId: undefined,
                    failParentOnFailure: undefined,
                }),
            ),
        )

        expect(flowRuns).toHaveLength(concurrentCount)

        const maxWaitMs = 25_000
        const pollIntervalMs = 500
        const start = Date.now()

        const results = new Map<string, FlowRunStatus>()
        for (const run of flowRuns) {
            results.set(run.id, run.status)
        }

        while (Date.now() - start < maxWaitMs) {
            const pending = [...results.entries()].filter(
                ([, status]) => status === FlowRunStatus.QUEUED || status === FlowRunStatus.RUNNING,
            )
            if (pending.length === 0) break

            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))

            for (const [id] of pending) {
                const updated = await flowRunService(app.log).getOnePopulatedOrThrow({
                    id,
                    projectId: mockProject.id,
                })
                results.set(id, updated.status)
            }
        }

        const statuses = [...results.values()]
        const succeeded = statuses.filter((s) => s === FlowRunStatus.SUCCEEDED).length
        const stuck = statuses.filter(
            (s) => s === FlowRunStatus.QUEUED || s === FlowRunStatus.RUNNING,
        ).length

        expect(stuck).toBe(0)
        expect(succeeded).toBe(concurrentCount)
    }, 30_000)

    it('executes parent → child subflow with wait-for-response', async () => {
        const { parentFlow, parentFlowVersion, mockPlatform, mockProject } = await setupSubflowFixtures()

        const flowRun = await flowRunService(app.log).start({
            flowId: parentFlow.id,
            payload: { body: { name: 'Alice' } },
            platformId: mockPlatform.id,
            executionType: ExecutionType.BEGIN,
            environment: RunEnvironment.TESTING,
            progressUpdateType: ProgressUpdateType.NONE,
            executeTrigger: false,
            flowVersionId: parentFlowVersion.id,
            projectId: mockProject.id,
            synchronousHandlerId: undefined,
            httpRequestId: undefined,
            failParentOnFailure: undefined,
        })

        const result = await pollFlowRunToCompletion(flowRun.id, mockProject.id)

        expect(result.status).toBe(FlowRunStatus.SUCCEEDED)
        expect(result.steps.step_1.output).toEqual(
            expect.objectContaining({
                status: 'success',
                data: {
                    greeting: 'Hello Alice',
                    processed: true,
                },
            }),
        )
    }, 180_000)

    it('executes a webhook → delay_for → code flow without infinite loop', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const webhookPiece = createMockPieceMetadata({
            name: '@activepieces/piece-webhook',
            version: '0.1.29',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        const delayPiece = createMockPieceMetadata({
            name: '@activepieces/piece-delay',
            version: '0.3.26',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().getRepository('piece_metadata').save([webhookPiece, delayPiece])

        const codeAction = {
            type: FlowActionType.CODE as const,
            name: 'step_2',
            displayName: 'After Delay',
            valid: true,
            settings: {
                sourceCode: {
                    code: `export const code = async (inputs) => {
                        return { resumed: true, timestamp: Date.now() };
                    }`,
                    packageJson: '{}',
                },
                input: {},
                errorHandlingOptions: {},
            },
        }

        const delayAction = {
            type: FlowActionType.PIECE as const,
            name: 'step_1',
            displayName: 'Delay For',
            valid: true,
            settings: {
                pieceName: '@activepieces/piece-delay',
                pieceVersion: '~0.3.26',
                actionName: 'delayFor',
                input: {
                    unit: 'seconds',
                    delayFor: 11,
                },
                propertySettings: {},
                errorHandlingOptions: {},
            },
            nextAction: codeAction,
        }

        const mockFlow = createMockFlow({
            projectId: mockProject.id,
        })
        await db.save('flow', mockFlow)

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            state: FlowVersionState.DRAFT,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                displayName: 'Catch Webhook',
                valid: true,
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.1.29',
                    triggerName: 'catch_webhook',
                    input: { authType: 'none' },
                    propertySettings: {},
                },
                nextAction: delayAction,
            },
        })
        await db.save('flow_version', mockFlowVersion)

        const flowRun = await flowRunService(app.log).start({
            flowId: mockFlow.id,
            payload: { body: { test: true } },
            platformId: mockPlatform.id,
            executionType: ExecutionType.BEGIN,
            environment: RunEnvironment.TESTING,
            progressUpdateType: ProgressUpdateType.NONE,
            executeTrigger: false,
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            synchronousHandlerId: undefined,
            httpRequestId: undefined,
            failParentOnFailure: undefined,
        })

        const result = await pollFlowRunToCompletion(flowRun.id, mockProject.id)

        expect(result.status).toBe(FlowRunStatus.SUCCEEDED)
        expect(result.steps.step_2.output).toEqual(
            expect.objectContaining({ resumed: true }),
        )
    }, 60_000)

    it('executes parent → child subflow with wait-for-response in test step mode', async () => {
        const { parentFlow, parentFlowVersion, mockPlatform, mockProject } = await setupSubflowFixtures()

        const flowRun = await flowRunService(app.log).start({
            flowId: parentFlow.id,
            payload: { body: { name: 'Alice' } },
            platformId: mockPlatform.id,
            executionType: ExecutionType.BEGIN,
            environment: RunEnvironment.TESTING,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            executeTrigger: false,
            flowVersionId: parentFlowVersion.id,
            projectId: mockProject.id,
            synchronousHandlerId: undefined,
            httpRequestId: undefined,
            failParentOnFailure: undefined,
            stepNameToTest: 'step_1',
        })

        const result = await pollFlowRunToCompletion(flowRun.id, mockProject.id)

        expect(result.status).toBe(FlowRunStatus.SUCCEEDED)
        expect(result.steps.step_1.output).toEqual(
            expect.objectContaining({
                status: 'success',
                data: {
                    greeting: 'Hello Alice',
                    processed: true,
                },
            }),
        )
    }, 180_000)

    it('executes webhook → call subflow (wait-for-response) → return webhook response', async () => {
        const { parentFlow } = await setupSubflowWithWebhookResponseFixtures()

        // Hit the real /sync route so synchronousHandlerId + httpRequestId are wired up,
        // enabling the webhook Return Response step to send back the HTTP response.
        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${parentFlow.id}/sync`,
            payload: { message: 'hello world' },
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual(expect.objectContaining({ echo: 'hello world' }))
    }, 180_000)
})
