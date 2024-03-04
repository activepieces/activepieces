import {
    ActionType,
    FlowRunStatus,
    ExecutionType,
    FlowStatus,
    FlowVersionState,
    RunEnvironment,
    TriggerType,
    PackageType,
    PieceType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import {
    createMockFlow,
    createMockFlowRun,
    createMockFlowVersion,
    createMockPlatform,
    createMockProject,
    createMockUser,
} from '../../../helpers/mocks'
import { flowWorker } from '../../../../src/app/workers/flow-worker/flow-worker'
import { fileCompressor } from 'server-shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('flow execution', () => {
    it('should execute simple flow with code and data mapper', async () => {
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save([mockUser])

        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection.getRepository('platform').save([mockPlatform])

        const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
        await databaseConnection.getRepository('project').save([mockProject])
        
        const mockFlow = createMockFlow({
            projectId: mockProject.id,
            status: FlowStatus.ENABLED,
        })
        await databaseConnection.getRepository('flow').save([mockFlow])

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            updatedBy: mockUser.id,
            state: FlowVersionState.LOCKED,
            trigger: {
                type: TriggerType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-schedule',
                    pieceVersion: '0.1.0',
                    input: {
                        run_on_weekends: false,
                    },
                    triggerName: 'everyHourTrigger',
                    'pieceType': PieceType.OFFICIAL,
                    'packageType': PackageType.REGISTRY,
                    inputUiInfo: {},
                },
                valid: true,
                name: 'webhook',
                displayName: 'Webhook',
                nextAction: {
                    name: 'echo_step',
                    displayName: 'Echo Step',
                    type: ActionType.CODE,
                    settings: {
                        inputUiInfo: {},
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
                        diplayName: 'Datamapper',
                        type: ActionType.PIECE,
                        settings: {
                            inputUiInfo: {},
                            pieceName: '@activepieces/piece-data-mapper',
                            pieceVersion: '0.3.0',
                            packageType: 'REGISTRY',
                            pieceType: 'OFFICIAL',
                            actionName: 'advanced_mapping',
                            input: {
                                mapping: {
                                    key: '{{ 1 + 2 }}',
                                },
                            },
                        },
                        valid: true,
                    },
                    valid: true,
                },
            },
        })
        await databaseConnection
            .getRepository('flow_version')
            .save([mockFlowVersion])

        const mockFlowRun = createMockFlowRun({
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            flowId: mockFlow.id,
            status: FlowRunStatus.RUNNING,
        })
        await databaseConnection.getRepository('flow_run').save([mockFlowRun])

        await flowWorker.executeFlow({
            flowVersionId: mockFlowVersion.id,
            projectId: mockProject.id,
            environment: RunEnvironment.PRODUCTION,
            runId: mockFlowRun.id,
            payload: {},
            executionType: ExecutionType.BEGIN,
        })

        const flowRun = await databaseConnection
            .getRepository('flow_run')
            .findOneByOrFail({
                id: mockFlowRun.id,
            })
        expect(flowRun.status).toEqual(FlowRunStatus.SUCCEEDED)

        const file = await databaseConnection
            .getRepository('file')
            .findOneByOrFail({
                id: flowRun.logsFileId,
            })
        const decompressedData = await fileCompressor.decompress({
            data: file.data,
            compression: file.compression,
        })
        expect(
            JSON.parse(decompressedData.toString('utf-8')).executionState,
        ).toEqual({
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
