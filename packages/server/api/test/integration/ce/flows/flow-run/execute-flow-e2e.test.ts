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
    await worker.start(ctx.apiUrl, ctx.workerToken)
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

    it('handles 100 concurrent flow run executions without jobs getting stuck', async () => {
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

        const concurrentCount = 100

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

        const maxWaitMs = 30_000
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
})
