import { CleanupReason, FlowRunStatus, FlowTriggerType, StepOutputStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunCleanupService } from '../../../../../src/app/flows/flow-run/flow-run-cleanup.service'
import { createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'

// Mock dependencies
jest.mock('@activepieces/server-worker', () => ({
    engineRunner: jest.fn(() => ({
        executeCleanup: jest.fn(),
    })),
}))

jest.mock('../../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: jest.fn(() => ({
        getOneOrThrow: jest.fn(),
    })),
}))

jest.mock('../../../../../src/app/authentication/lib/access-token-manager', () => ({
    accessTokenManager: {
        generateEngineToken: jest.fn().mockResolvedValue('mock-engine-token'),
    },
}))

jest.mock('../../../../../src/app/project/project-service', () => ({
    projectService: {
        getPlatformId: jest.fn().mockResolvedValue('mock-platform-id'),
    },
}))

describe('flowRunCleanupService', () => {
    let mockLogger: FastifyBaseLogger
    let mockEngineRunner: any
    let mockFlowVersionService: any

    beforeEach(() => {
        jest.clearAllMocks()

        mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as any

        mockEngineRunner = require('@activepieces/server-worker').engineRunner(mockLogger)
        mockEngineRunner.executeCleanup.mockResolvedValue({
            status: 'OK',
            response: {
                success: true,
            },
        })

        mockFlowVersionService = require('../../../../../src/app/flows/flow-version/flow-version.service').flowVersionService(mockLogger)
    })

    it('should invoke cleanup for paused steps', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.TIMEOUT,
            pauseMetadata: {
                type: 'WEBHOOK',
                requestId: 'test-request-id',
            } as any,
            steps: {
                'webhook_step': {
                    type: 'PIECE',
                    status: StepOutputStatus.PAUSED,
                    input: {
                        timeout: 3600,
                    },
                    output: {},
                },
            } as any,
        })

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlowRun.flowId,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '1.0.0',
                    triggerName: 'catch_webhook',
                },
                valid: true,
                displayName: 'Catch Webhook',
                nextAction: {
                    name: 'webhook_step',
                    displayName: 'Wait for Webhook',
                    type: 'PIECE',
                    settings: {
                        pieceName: '@activepieces/piece-webhook',
                        pieceVersion: '1.0.0',
                        actionName: 'wait_for_webhook',
                        input: {
                            timeout: 3600,
                        },
                        pieceType: 'OFFICIAL',
                        packageType: 'REGISTRY',
                    },
                    valid: true,
                } as any,
            } as any,
        })

        mockFlowVersionService.getOneOrThrow.mockResolvedValue(mockFlowVersion)

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockEngineRunner.executeCleanup).toHaveBeenCalledTimes(1)
        expect(mockEngineRunner.executeCleanup).toHaveBeenCalledWith(
            'mock-engine-token',
            expect.objectContaining({
                projectId: mockFlowRun.projectId,
                piece: expect.objectContaining({
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '1.0.0',
                }),
                actionName: 'wait_for_webhook',
                cleanupReason: CleanupReason.TIMEOUT,
                input: {
                    timeout: 3600,
                },
            })
        )
    })

    it('should skip cleanup when no paused steps exist', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.TIMEOUT,
            pauseMetadata: {
                type: 'WEBHOOK',
                requestId: 'test-request-id',
            } as any,
            steps: {
                'step1': {
                    type: 'CODE',
                    status: StepOutputStatus.SUCCEEDED,
                    input: {},
                    output: {},
                },
            } as any,
        })

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlowRun.flowId,
        })

        mockFlowVersionService.getOneOrThrow.mockResolvedValue(mockFlowVersion)

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockEngineRunner.executeCleanup).not.toHaveBeenCalled()
        expect(mockLogger.debug).toHaveBeenCalledWith(
            { flowRunId: mockFlowRun.id },
            'No paused steps found'
        )
    })

    it('should skip cleanup when pauseMetadata is null/undefined', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.SUCCEEDED,
            pauseMetadata: undefined,
        })

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockFlowVersionService.getOneOrThrow).not.toHaveBeenCalled()
        expect(mockEngineRunner.executeCleanup).not.toHaveBeenCalled()
    })

    it('should map TIMEOUT status to CleanupReason.TIMEOUT', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.TIMEOUT,
            pauseMetadata: {
                type: 'WEBHOOK',
                requestId: 'test-request-id',
            } as any,
            steps: {
                'webhook_step': {
                    type: 'PIECE',
                    status: StepOutputStatus.PAUSED,
                    input: {},
                    output: {},
                },
            } as any,
        })

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlowRun.flowId,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '1.0.0',
                    triggerName: 'catch_webhook',
                },
                valid: true,
                displayName: 'Catch Webhook',
                nextAction: {
                    name: 'webhook_step',
                    displayName: 'Wait for Webhook',
                    type: 'PIECE',
                    settings: {
                        pieceName: '@activepieces/piece-webhook',
                        pieceVersion: '1.0.0',
                        actionName: 'wait_for_webhook',
                        input: {},
                        pieceType: 'OFFICIAL',
                        packageType: 'REGISTRY',
                    },
                    valid: true,
                } as any,
            } as any,
        })

        mockFlowVersionService.getOneOrThrow.mockResolvedValue(mockFlowVersion)

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockEngineRunner.executeCleanup).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                cleanupReason: CleanupReason.TIMEOUT,
            })
        )
    })

    it('should map FAILED status to CleanupReason.FAILURE', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.FAILED,
            pauseMetadata: {
                type: 'WEBHOOK',
                requestId: 'test-request-id',
            } as any,
            steps: {
                'webhook_step': {
                    type: 'PIECE',
                    status: StepOutputStatus.PAUSED,
                    input: {},
                    output: {},
                },
            } as any,
        })

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlowRun.flowId,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '1.0.0',
                    triggerName: 'catch_webhook',
                },
                valid: true,
                displayName: 'Catch Webhook',
                nextAction: {
                    name: 'webhook_step',
                    displayName: 'Wait for Webhook',
                    type: 'PIECE',
                    settings: {
                        pieceName: '@activepieces/piece-webhook',
                        pieceVersion: '1.0.0',
                        actionName: 'wait_for_webhook',
                        input: {},
                        pieceType: 'OFFICIAL',
                        packageType: 'REGISTRY',
                    },
                    valid: true,
                } as any,
            } as any,
        })

        mockFlowVersionService.getOneOrThrow.mockResolvedValue(mockFlowVersion)

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockEngineRunner.executeCleanup).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                cleanupReason: CleanupReason.FAILURE,
            })
        )
    })

    it('should log warning but continue on cleanup failure', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.TIMEOUT,
            pauseMetadata: {
                type: 'WEBHOOK',
                requestId: 'test-request-id',
            } as any,
            steps: {
                'webhook_step': {
                    type: 'PIECE',
                    status: StepOutputStatus.PAUSED,
                    input: {},
                    output: {},
                },
            } as any,
        })

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlowRun.flowId,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '1.0.0',
                    triggerName: 'catch_webhook',
                },
                valid: true,
                displayName: 'Catch Webhook',
                nextAction: {
                    name: 'webhook_step',
                    displayName: 'Wait for Webhook',
                    type: 'PIECE',
                    settings: {
                        pieceName: '@activepieces/piece-webhook',
                        pieceVersion: '1.0.0',
                        actionName: 'wait_for_webhook',
                        input: {},
                        pieceType: 'OFFICIAL',
                        packageType: 'REGISTRY',
                    },
                    valid: true,
                } as any,
            } as any,
        })

        mockFlowVersionService.getOneOrThrow.mockResolvedValue(mockFlowVersion)

        // Mock cleanup failure
        mockEngineRunner.executeCleanup.mockResolvedValue({
            status: 'OK',
            response: {
                success: false,
                message: 'Cleanup failed for some reason',
            },
        })

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({
                flowRunId: mockFlowRun.id,
                stepName: 'webhook_step',
                error: 'Cleanup failed for some reason',
            }),
            '[flowRunCleanupService] Cleanup failed'
        )
    })

    it('should log error but continue when cleanup throws exception', async () => {
        const mockFlowRun = createMockFlowRun({
            status: FlowRunStatus.TIMEOUT,
            pauseMetadata: {
                type: 'WEBHOOK',
                requestId: 'test-request-id',
            } as any,
            steps: {
                'webhook_step': {
                    type: 'PIECE',
                    status: StepOutputStatus.PAUSED,
                    input: {},
                    output: {},
                },
            } as any,
        })

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlowRun.flowId,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '1.0.0',
                    triggerName: 'catch_webhook',
                },
                valid: true,
                displayName: 'Catch Webhook',
                nextAction: {
                    name: 'webhook_step',
                    displayName: 'Wait for Webhook',
                    type: 'PIECE',
                    settings: {
                        pieceName: '@activepieces/piece-webhook',
                        pieceVersion: '1.0.0',
                        actionName: 'wait_for_webhook',
                        input: {},
                        pieceType: 'OFFICIAL',
                        packageType: 'REGISTRY',
                    },
                    valid: true,
                } as any,
            } as any,
        })

        mockFlowVersionService.getOneOrThrow.mockResolvedValue(mockFlowVersion)

        // Mock cleanup throwing an error
        const mockError = new Error('Network error')
        mockEngineRunner.executeCleanup.mockRejectedValue(mockError)

        await flowRunCleanupService(mockLogger).invokeCleanupForPausedSteps(mockFlowRun)

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                flowRunId: mockFlowRun.id,
                stepName: 'webhook_step',
                error: mockError,
            }),
            '[flowRunCleanupService] Error invoking cleanup'
        )
    })
})
