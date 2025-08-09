import { ENGINE_ERROR_NAMES, TriggerHookType, FlowVersion, TriggerType, ActivepiecesError, ErrorCode, FlowVersionState, PieceType, PackageType, TriggerPayload, ProjectId, FlowTriggerType, TriggerRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { triggerHooks } from './trigger-utils'
import { engineRunner } from '../runner'
import { engineApiService } from '../api/server-api.service'
import { workerMachine } from './machine'
import { webhookUtils } from './webhook-utils'

// Mock dependencies
jest.mock('../runner')
jest.mock('../api/server-api.service')
jest.mock('./machine')
jest.mock('./webhook-utils')

describe('triggerHooks', () => {
    let mockLog: FastifyBaseLogger
    let mockEngineRunner: jest.MockedFunction<typeof engineRunner>
    let mockEngineApiService: jest.MockedFunction<typeof engineApiService>
    let mockWebhookUtils: jest.MockedFunction<typeof webhookUtils>
    let mockWorkerMachine: typeof workerMachine

    const mockFlowVersion: FlowVersion = {
        id: 'flow-version-id',
        flowId: 'flow-id',
        displayName: 'Test Flow',
        trigger: {
            type: TriggerType.PIECE,
            settings: {
                pieceName: 'test-piece',
                pieceVersion: '1.0.0',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                triggerName: 'test-trigger',
                input: {},
                inputUiInfo: { schema: {} },
            },
            name: 'test-trigger',
            valid: true,
            displayName: 'Test Trigger',
            nextAction: null,
        },
        valid: true,
        state: FlowVersionState.DRAFT,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        agentIds: [],
        connectionIds: [],
    } as FlowVersion

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup mock logger
        mockLog = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn(),
            child: jest.fn(() => mockLog),
        } as unknown as FastifyBaseLogger

        // Setup mock functions
        mockEngineRunner = engineRunner as jest.MockedFunction<typeof engineRunner>
        mockEngineApiService = engineApiService as jest.MockedFunction<typeof engineApiService>
        mockWebhookUtils = webhookUtils as jest.MockedFunction<typeof webhookUtils>
        mockWorkerMachine = workerMachine

        // Default mock implementations
        mockWorkerMachine.getPublicApiUrl = jest.fn().mockReturnValue('http://localhost:3000')
        
        mockWebhookUtils.mockReturnValue({
            getWebhookUrl: jest.fn().mockResolvedValue('http://localhost:3000/webhooks/test'),
            extractPayload: jest.fn(),
            getAppWebhookUrl: jest.fn(),
            savePayloadsAsSampleData: jest.fn(),
        })

        mockEngineApiService.mockReturnValue({
            createTriggerRun: jest.fn().mockResolvedValue(undefined),
        } as any)
    })

    describe('extractPayloads', () => {
        describe('successful payload extraction', () => {
            it('should return extracted payloads when trigger execution succeeds', async () => {
                const mockPayloads = [{ data: 'test1' }, { data: 'test2' }]
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: true,
                            output: mockPayloads,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual(mockPayloads)
                expect(mockEngineApiService('test-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                    status: TriggerRunStatus.COMPLETED,
                    payload: expect.any(Object),
                    flowId: 'flow-id',
                    simulate: false,
                    jobId: 'job-id',
                    error: undefined,
                })
            })

            it('should handle simulation mode correctly', async () => {
                const mockPayloads = [{ data: 'test' }]
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: true,
                            output: mockPayloads,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: true,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual(mockPayloads)
                expect(mockEngineRunner(mockLog).executeTrigger).toHaveBeenCalledWith(
                    'test-token',
                    expect.objectContaining({
                        test: true,
                    })
                )
            })
        })

        describe('connection error handling', () => {
            it('should return raw payload when CONNECTION_EXPIRED error occurs', async () => {
                const webhookPayload: TriggerPayload = { body: { webhook: 'data' }, headers: {}, queryParams: {} }
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            message: `Error: ${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED} - connection expired`,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: webhookPayload,
                })

                expect(result).toEqual([webhookPayload.body])
                expect(mockLog.warn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.stringContaining(ENGINE_ERROR_NAMES.CONNECTION_EXPIRED),
                        flowId: 'flow-id',
                    }),
                    'Trigger failed due to connection error, returning raw payload for visibility'
                )
                expect(mockEngineApiService('test-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                    status: TriggerRunStatus.CONNECTION_ERROR,
                    payload: webhookPayload,
                    flowId: 'flow-id',
                    simulate: false,
                    jobId: 'job-id',
                    error: expect.stringContaining(ENGINE_ERROR_NAMES.CONNECTION_EXPIRED),
                })
            })

            it('should return raw payload when CONNECTION_NOT_FOUND error occurs', async () => {
                const webhookPayload: TriggerPayload = { body: { webhook: 'data' }, headers: {}, queryParams: {} }
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            message: `${ENGINE_ERROR_NAMES.CONNECTION_NOT_FOUND}: connection not found`,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: webhookPayload,
                })

                expect(result).toEqual([webhookPayload.body])
            })

            it('should return raw payload when CONNECTION_LOADING_FAILURE error occurs', async () => {
                const webhookPayload: TriggerPayload = { body: { webhook: 'data' }, headers: {}, queryParams: {} }
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            message: `Failed: ${ENGINE_ERROR_NAMES.CONNECTION_LOADING_FAILURE}`,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: webhookPayload,
                })

                expect(result).toEqual([webhookPayload.body])
            })

            it('should return full payload when body is not available', async () => {
                const webhookPayload: TriggerPayload = { headers: {}, queryParams: {}, body: undefined } as any
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            message: `${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED}`,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: webhookPayload,
                })

                expect(result).toEqual([webhookPayload])
            })

            it('should not return raw payload in simulate mode even with connection error', async () => {
                const webhookPayload: TriggerPayload = { body: { test: 'data' }, headers: {}, queryParams: {} }
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            message: `${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED}`,
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: true,
                    payload: webhookPayload,
                })

                // In simulate mode, connection errors should return empty array
                expect(result).toEqual([])
                expect(mockEngineApiService('test-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                    status: TriggerRunStatus.INTERNAL_ERROR,
                    payload: webhookPayload,
                    flowId: 'flow-id',
                    simulate: true,
                    jobId: 'job-id',
                    error: expect.stringContaining(ENGINE_ERROR_NAMES.CONNECTION_EXPIRED),
                })
            })
        })

        describe('non-connection error handling', () => {
            it('should return empty array for non-connection errors', async () => {
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            message: 'Some other error occurred',
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual([])
                expect(mockEngineApiService('test-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                    status: TriggerRunStatus.INTERNAL_ERROR,
                    payload: expect.any(Object),
                    flowId: 'flow-id',
                    simulate: false,
                    jobId: 'job-id',
                    error: 'Some other error occurred',
                })
            })
        })

        describe('timeout error handling', () => {
            it('should handle timeout errors gracefully', async () => {
                const timeoutError = new ActivepiecesError({
                    code: ErrorCode.EXECUTION_TIMEOUT,
                    params: {},
                })

                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockRejectedValue(timeoutError),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual([])
                expect(mockEngineApiService('test-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                    status: TriggerRunStatus.TIMED_OUT,
                    payload: expect.any(Object),
                    flowId: 'flow-id',
                    simulate: false,
                    jobId: 'job-id',
                    error: expect.anything(),
                })
            })

            it('should handle other exceptions', async () => {
                const otherError = new Error('Some other error')

                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockRejectedValue(otherError),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual([])
                expect(mockEngineApiService('test-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                    status: TriggerRunStatus.INTERNAL_ERROR,
                    payload: expect.any(Object),
                    flowId: 'flow-id',
                    simulate: false,
                    jobId: 'job-id',
                    error: expect.anything(),
                })
            })
        })

        describe('edge cases', () => {
            it('should handle empty trigger type', async () => {
                const emptyTriggerFlowVersion = {
                    ...mockFlowVersion,
                    trigger: {
                        ...mockFlowVersion.trigger,
                        type: FlowTriggerType.EMPTY,
                    },
                } as FlowVersion

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: emptyTriggerFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual([])
                expect(mockLog.warn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        flowVersionId: 'flow-version-id',
                    }),
                    '[WebhookUtils#extractPayload] empty trigger, skipping'
                )
            })

            it('should handle nil result gracefully', async () => {
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: null,
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                expect(result).toEqual([])
            })

            it('should handle undefined result message for connection errors', async () => {
                const webhookPayload: TriggerPayload = { body: { webhook: 'data' }, headers: {}, queryParams: {} }
                
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: false,
                            // message is undefined
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: webhookPayload,
                })

                // Should return empty array when message is undefined (no connection error detected)
                expect(result).toEqual([])
            })

            it('should handle non-array output', async () => {
                mockEngineRunner.mockReturnValue({
                    executeTrigger: jest.fn().mockResolvedValue({
                        result: {
                            success: true,
                            output: 'not-an-array',
                        },
                    }),
                } as any)

                const result = await triggerHooks(mockLog).extractPayloads('test-token', {
                    flowVersion: mockFlowVersion,
                    projectId: 'project-id' as ProjectId,
                    jobId: 'job-id',
                    simulate: false,
                    payload: { body: { test: 'data' }, headers: {}, queryParams: {} } as TriggerPayload,
                })

                // Should return empty array when output is not an array
                expect(result).toEqual([])
            })
        })
    })
})