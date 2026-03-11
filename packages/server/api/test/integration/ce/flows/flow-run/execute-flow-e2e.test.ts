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
        socketUrl: { url: ctx.apiUrl, path: '/socket.io/' },
        workerToken: ctx.workerToken,
    })
    await new Promise((resolve) => setTimeout(resolve, 5000))
}, 30_000)

afterAll(async () => {
    worker.stop()
    await app.close()
}, 15_000)

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
        const maxWaitMs = 60_000
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
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        // Register piece metadata
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

        // Build Child Flow: callableFlow trigger → code action → returnResponse action
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

        // Build Parent Flow: webhook trigger → callFlow action
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

        // Start the parent flow
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

        // Poll until parent flow run completes (120s — subflow involves two flow runs + pause/resume)
        const maxWaitMs = 120_000
        const pollIntervalMs = 500
        const start = Date.now()
        let result = await flowRunService(app.log).getOnePopulatedOrThrow({
            id: flowRun.id,
            projectId: mockProject.id,
        })

        while (
            (result.status === FlowRunStatus.QUEUED ||
                result.status === FlowRunStatus.RUNNING ||
                result.status === FlowRunStatus.PAUSED) &&
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
                status: 'success',
                data: {
                    greeting: 'Hello Alice',
                    processed: true,
                },
            }),
        )
    }, 180_000)
})
