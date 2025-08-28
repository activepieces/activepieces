import { fileCompressor } from '@activepieces/server-shared'
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
    PropertyExecutionType,
    RunEnvironment,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { flowJobExecutor, flowWorker } from 'server-worker'
import { accessTokenManager } from '../../../../../src/app/authentication/lib/access-token-manager'
import { initializeDatabase } from '../../../../../src/app/database'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { setupServer } from '../../../../../src/app/server'
import {
    createMockFlow,
    createMockFlowRun,
    createMockFlowVersion,
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    await app.listen({
        host: '0.0.0.0',
        port: 3000,
    })
    mockLog = app.log
})

afterAll(async () => {
    if (app) {
        await app.close()
    }
    await databaseConnection().destroy()
})

describe('flow execution', () => {
    it('should execute simple flow with code and data mapper', async () => {
        const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup({
            plan: {
                tasksLimit: 1000,
            },
        })

        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await databaseConnection().getRepository('flow').save([mockFlow])

        const mockPieceMetadata1 = createMockPieceMetadata({
            name: '@activepieces/piece-schedule',
            version: '0.1.5',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
        })
        const mockPieceMetadata2 = createMockPieceMetadata({
            name: '@activepieces/piece-data-mapper',
            version: '0.3.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
        })
        await databaseConnection()
            .getRepository('piece_metadata')
            .save([mockPieceMetadata1, mockPieceMetadata2])

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            updatedBy: mockOwner.id,
            state: FlowVersionState.LOCKED,
            trigger: {
                type: FlowTriggerType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-schedule',
                    pieceVersion: '0.1.5',
                    input: {
                        run_on_weekends: false,
                    },
                    triggerName: 'every_hour',
                    propertySettings: {
                        'run_on_weekends': {
                            type: PropertyExecutionType.MANUAL,
                        },
                    },
                },
                valid: true,
                name: 'webhook',
                displayName: 'Webhook',
                nextAction: {
                    name: 'echo_step',
                    displayName: 'Echo Step',
                    type: FlowActionType.CODE,
                    settings: {
                        input: {
                            key: '{{ 1 + 2 }}',
                        },
                        sourceCode: {
                            packageJson: '{}',
                            code: `
                            export const code = async (inputs) => {
                                return inputs;
                              };
                            `,
                        },
                    },
                    nextAction: {
                        name: 'datamapper',
                        displayName: 'Datamapper',
                        type: FlowActionType.PIECE,
                        settings: {
                            pieceName: '@activepieces/piece-data-mapper',
                            pieceVersion: '0.3.0',
                            actionName: 'advanced_mapping',
                            input: {
                                mapping: {
                                    key: '{{ 1 + 2 }}',
                                },
                            },
                            propertySettings: {
                                'mapping': {
                                    type: PropertyExecutionType.MANUAL,
                                },
                            },
                        },
                        valid: true,
                    },
                    valid: true,
                },
            },
        })
        await databaseConnection()
            .getRepository('flow_version')
            .save([mockFlowVersion])

        const mockFlowRun = createMockFlowRun({
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            flowId: mockFlow.id,
            status: FlowRunStatus.RUNNING,
        })
        await databaseConnection().getRepository('flow_run').save([mockFlowRun])

        const engineToken = await accessTokenManager.generateEngineToken({
            platformId: mockPlatform.id,
            projectId: mockProject.id,
        })
        await flowWorker(mockLog).init({
            workerToken: await accessTokenManager.generateWorkerToken(),
        })

        await flowJobExecutor(mockLog).executeFlow({
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            environment: RunEnvironment.PRODUCTION,
            runId: mockFlowRun.id,
            payload: {},
            synchronousHandlerId: null,
            progressUpdateType: ProgressUpdateType.NONE,
            executionType: ExecutionType.BEGIN,
        }, 1, engineToken)

        const flowRun = await databaseConnection()
            .getRepository('flow_run')
            .findOneByOrFail({
                id: mockFlowRun.id,
            })
      
        expect(flowRun.status).toEqual(FlowRunStatus.SUCCEEDED)

        const file = await databaseConnection()
            .getRepository('file')
            .findOneByOrFail({
                id: flowRun.logsFileId,
            })

        const decompressedData = await fileCompressor.decompress({
            data: file.data,
            compression: file.compression,
        })
        const executionState = JSON.parse(decompressedData.toString('utf-8')).executionState
        expect(executionState).toEqual({
            steps: {
                webhook: {
                    type: 'PIECE_TRIGGER',
                    status: 'SUCCEEDED',
                    input: {},
                    output: {},
                },
                echo_step: {
                    type: 'CODE',
                    status: 'SUCCEEDED',
                    input: {
                        key: 3,
                    },
                    output: {
                        key: 3,
                    },
                    duration: expect.any(Number),
                },
                datamapper: {
                    type: 'PIECE',
                    status: 'SUCCEEDED',
                    input: {
                        mapping: {
                            key: 3,
                        },
                    },
                    output: {
                        key: 3,
                    },
                    duration: expect.any(Number),
                },
            },
        })
    }, 60000)
})
