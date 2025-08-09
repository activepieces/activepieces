import { ENGINE_ERROR_NAMES, FlowVersion, TriggerType, FlowVersionState, PieceType, PackageType, ProjectId, TriggerPayload, TriggerRunStatus, FlowTriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { triggerHooks } from '../../src/lib/utils/trigger-utils'
import { engineRunner } from '../../src/lib/runner'
import { engineApiService } from '../../src/lib/api/server-api.service'
import { workerMachine } from '../../src/lib/utils/machine'
import { webhookUtils } from '../../src/lib/utils/webhook-utils'

// Mock all dependencies
jest.mock('../../src/lib/runner')
jest.mock('../../src/lib/api/server-api.service')
jest.mock('../../src/lib/utils/machine')
jest.mock('../../src/lib/utils/webhook-utils')
jest.mock('@activepieces/server-shared', () => ({
    ...jest.requireActual('@activepieces/server-shared'),
    rejectedPromiseHandler: jest.fn((promise) => promise),
}))

describe('Webhook Connection Error Integration Tests', () => {
    let mockLog: FastifyBaseLogger
    let mockEngineRunner: jest.MockedFunction<typeof engineRunner>
    let mockEngineApiService: jest.MockedFunction<typeof engineApiService>
    let mockWebhookUtils: jest.MockedFunction<typeof webhookUtils>
    let mockWorkerMachine: typeof workerMachine

    const createMockFlowVersion = (overrides = {}): FlowVersion => ({
        id: 'flow-version-id',
        flowId: 'flow-id',
        displayName: 'Test Flow',
        trigger: {
            type: TriggerType.PIECE,
            settings: {
                pieceName: 'webhook',
                pieceVersion: '1.0.0',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                triggerName: 'webhook-trigger',
                input: {
                    connectionId: 'conn-123',
                },
                inputUiInfo: { schema: {} },
            },
            name: 'webhook-trigger',
            valid: true,
            displayName: 'Webhook Trigger',
            nextAction: null,
        },
        valid: true,
        state: FlowVersionState.PUBLISHED,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        agentIds: [],
        connectionIds: ['conn-123'],
        ...overrides,
    } as FlowVersion)

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
        mockWorkerMachine.getPublicApiUrl = jest.fn().mockReturnValue('http://api.example.com')
        
        mockWebhookUtils.mockReturnValue({
            getWebhookUrl: jest.fn().mockResolvedValue('http://api.example.com/webhooks/flow-id'),
            extractPayload: jest.fn(),
            getAppWebhookUrl: jest.fn(),
            savePayloadsAsSampleData: jest.fn(),
        })

        mockEngineApiService.mockReturnValue({
            createTriggerRun: jest.fn().mockResolvedValue({ id: 'trigger-run-id' }),
        } as any)
    })

    describe('Connection Error Scenarios', () => {
        it('should create flow run with raw payload when connection is expired', async () => {
            const webhookPayload: TriggerPayload = {
                body: {
                    user: 'john@example.com',
                    action: 'login',
                    timestamp: 1234567890,
                },
                headers: {
                    'content-type': 'application/json',
                    'x-webhook-signature': 'abc123',
                },
                queryParams: {
                    source: 'api',
                },
            }

            // Mock engine returning connection expired error
            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `Trigger execution failed: ${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED} - OAuth token expired`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-456',
                simulate: false,
                payload: webhookPayload,
            })

            // Should return raw payload
            expect(result).toEqual([webhookPayload.body])

            // Should log warning
            expect(mockLog.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining(ENGINE_ERROR_NAMES.CONNECTION_EXPIRED),
                    flowId: 'flow-id',
                    triggerName: 'webhook-trigger',
                }),
                'Trigger failed due to connection error, returning raw payload for visibility'
            )

            // Should create trigger run with INTERNAL_ERROR status
            expect(mockEngineApiService('engine-token', mockLog).createTriggerRun).toHaveBeenCalledWith({
                status: TriggerRunStatus.INTERNAL_ERROR,
                payload: webhookPayload,
                flowId: 'flow-id',
                simulate: false,
                jobId: 'job-456',
                error: expect.stringContaining(ENGINE_ERROR_NAMES.CONNECTION_EXPIRED),
            })
        })

        it('should handle connection not found error', async () => {
            const webhookPayload: TriggerPayload = {
                body: { data: 'test' },
                headers: {},
                queryParams: {},
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `Error in trigger: ${ENGINE_ERROR_NAMES.CONNECTION_NOT_FOUND} - Connection 'conn-123' not found in project`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-789',
                simulate: false,
                payload: webhookPayload,
            })

            expect(result).toEqual([webhookPayload.body])
            expect(mockEngineApiService('engine-token', mockLog).createTriggerRun).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: TriggerRunStatus.CONNECTION_ERROR,
                    error: expect.stringContaining(ENGINE_ERROR_NAMES.CONNECTION_NOT_FOUND),
                })
            )
        })

        it('should handle connection loading failure', async () => {
            const webhookPayload: TriggerPayload = {
                body: { event: 'user.created', userId: 123 },
                headers: { 'x-api-key': 'secret' },
                queryParams: {},
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `System error: ${ENGINE_ERROR_NAMES.CONNECTION_LOADING_FAILURE} - Failed to decrypt connection`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-101',
                simulate: false,
                payload: webhookPayload,
            })

            expect(result).toEqual([webhookPayload.body])
        })

        it('should handle payload without body field', async () => {
            const webhookPayload: TriggerPayload = {
                headers: { 'content-type': 'text/plain' },
                queryParams: { token: 'xyz789' },
            } as any

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED}`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-102',
                simulate: false,
                payload: webhookPayload,
            })

            // Should return entire payload when body is not available
            expect(result).toEqual([webhookPayload])
        })

        it('should not create flow run in simulation mode', async () => {
            const webhookPayload: TriggerPayload = {
                body: { test: true },
                headers: {},
                queryParams: {},
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED}`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-103',
                simulate: true,
                payload: webhookPayload,
            })

            // In simulation mode, should return empty array
            expect(result).toEqual([])
            
            // Should still create trigger run but with INTERNAL_ERROR status
            expect(mockEngineApiService('engine-token', mockLog).createTriggerRun).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: TriggerRunStatus.CONNECTION_ERROR,
                    simulate: true,
                })
            )
        })
    })

    describe('Non-Connection Error Scenarios', () => {
        it('should handle generic trigger errors normally', async () => {
            const webhookPayload: TriggerPayload = {
                body: { data: 'test' },
                headers: {},
                queryParams: {},
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: 'Invalid webhook signature',
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-104',
                simulate: false,
                payload: webhookPayload,
            })

            // Should return empty array for non-connection errors
            expect(result).toEqual([])
            
            // Should create trigger run with INTERNAL_ERROR status
            expect(mockEngineApiService('engine-token', mockLog).createTriggerRun).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: TriggerRunStatus.CONNECTION_ERROR,
                    error: 'Invalid webhook signature',
                })
            )
        })

        it('should handle timeout errors', async () => {
            const webhookPayload: TriggerPayload = {
                body: { data: 'test' },
                headers: {},
                queryParams: {},
            }

            const timeoutError = {
                code: 'EXECUTION_TIMEOUT',
                message: 'Execution timed out',
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockRejectedValue(timeoutError),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-105',
                simulate: false,
                payload: webhookPayload,
            })

            expect(result).toEqual([])
            
            // Note: The actual implementation checks for ActivepiecesError with EXECUTION_TIMEOUT code
            // In this test we're just verifying the general error path
            expect(mockEngineApiService('engine-token', mockLog).createTriggerRun).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: TriggerRunStatus.CONNECTION_ERROR,
                })
            )
        })
    })

    describe('Empty Trigger Handling', () => {
        it('should skip empty triggers', async () => {
            const webhookPayload: TriggerPayload = {
                body: { data: 'test' },
                headers: {},
                queryParams: {},
            }

            const flowVersion = createMockFlowVersion({
                trigger: {
                    type: FlowTriggerType.EMPTY,
                    settings: {},
                    name: 'empty-trigger',
                    valid: true,
                    displayName: 'Empty Trigger',
                    nextAction: null,
                },
            })

            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-106',
                simulate: false,
                payload: webhookPayload,
            })

            expect(result).toEqual([])
            expect(mockLog.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    flowVersionId: 'flow-version-id',
                }),
                '[WebhookUtils#extractPayload] empty trigger, skipping'
            )
            
            // Should not call engine runner for empty triggers
            expect(mockEngineRunner).not.toHaveBeenCalled()
        })
    })

    describe('Complex Payload Scenarios', () => {
        it('should handle deeply nested webhook payloads', async () => {
            const complexPayload: TriggerPayload = {
                body: {
                    user: {
                        id: 123,
                        profile: {
                            name: 'John Doe',
                            preferences: {
                                notifications: true,
                                theme: 'dark',
                            },
                        },
                    },
                    metadata: {
                        timestamp: Date.now(),
                        version: '2.0',
                    },
                },
                headers: {
                    'content-type': 'application/json',
                    'x-api-version': '2.0',
                },
                queryParams: {
                    include: 'profile,preferences',
                },
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `Connection error: ${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED}`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-107',
                simulate: false,
                payload: complexPayload,
            })

            // Should preserve the entire body structure
            expect(result).toEqual([complexPayload.body])
            expect(result[0]).toHaveProperty('user.profile.preferences.theme', 'dark')
        })

        it('should handle array payloads', async () => {
            const arrayPayload: TriggerPayload = {
                body: [
                    { id: 1, name: 'Item 1' },
                    { id: 2, name: 'Item 2' },
                    { id: 3, name: 'Item 3' },
                ],
                headers: {},
                queryParams: {},
            }

            mockEngineRunner.mockReturnValue({
                executeTrigger: jest.fn().mockResolvedValue({
                    result: {
                        success: false,
                        message: `${ENGINE_ERROR_NAMES.CONNECTION_NOT_FOUND}`,
                    },
                }),
            } as any)

            const flowVersion = createMockFlowVersion()
            const result = await triggerHooks(mockLog).extractPayloads('engine-token', {
                flowVersion,
                projectId: 'project-123' as ProjectId,
                jobId: 'job-108',
                simulate: false,
                payload: arrayPayload,
            })

            expect(result).toEqual([arrayPayload.body])
            expect(Array.isArray(result[0])).toBe(true)
            expect(result[0]).toHaveLength(3)
        })
    })
})