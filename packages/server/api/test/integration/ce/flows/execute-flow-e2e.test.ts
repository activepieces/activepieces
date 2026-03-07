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
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { flowRunService } from '../../../../src/app/flows/flow-run/flow-run-service'
import { setupE2eEnvironment } from '../../../helpers/e2e-setup'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { db } from '../../../helpers/db'
import { worker } from '../../../../../worker/src/lib/worker'

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
})
