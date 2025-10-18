import { CleanupReason, ExecuteCleanupOperation } from '@activepieces/shared'
import { executeCleanup } from '../../src/lib/handler/piece-executor'
import { generateMockEngineConstants } from './test-helper'

describe('flow cleanup', () => {
    const mockCleanupFn = jest.fn()

    beforeEach(() => {
        mockCleanupFn.mockClear()
    })

    it('should execute cleanup hook when action has onCleanup', async () => {
        const operation: ExecuteCleanupOperation = {
            projectId: 'test-project',
            engineToken: 'test-token',
            internalApiUrl: 'http://localhost:3000',
            publicApiUrl: 'http://localhost:4200',
            timeoutInSeconds: 30,
            piece: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '1.0.0',
                pieceType: 'OFFICIAL' as any,
                packageType: 'REGISTRY' as any,
            },
            actionName: 'wait_for_webhook',
            flowVersion: {
                id: 'flow-version-id',
                flowId: 'flow-id',
                displayName: 'Test Flow',
                trigger: {
                    type: 'EMPTY' as any,
                    name: 'trigger',
                    settings: {},
                    valid: false,
                    displayName: 'Select Trigger',
                },
                valid: true,
                state: 'DRAFT' as any,
                updatedBy: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            } as any,
            cleanupReason: CleanupReason.TIMEOUT,
            input: {
                timeout: 3600,
            },
        }

        const constants = generateMockEngineConstants({
            projectId: operation.projectId,
            engineToken: operation.engineToken,
            internalApiUrl: operation.internalApiUrl,
            publicApiUrl: operation.publicApiUrl,
        })

        // Mock the piece loader to return an action with onCleanup
        const mockPieceLoader = require('../../src/lib/helper/piece-loader')
        mockPieceLoader.pieceLoader.getPieceAndActionOrThrow = jest.fn().mockResolvedValue({
            pieceAction: {
                name: 'wait_for_webhook',
                displayName: 'Wait for Webhook',
                requireAuth: false,
                props: {},
                run: jest.fn(),
                onCleanup: mockCleanupFn,
            },
            piece: {
                displayName: 'Webhook',
                auth: undefined,
            },
        })

        await executeCleanup({
            operation,
            constants,
            pieceSource: 'COMMUNITY',
        })

        expect(mockCleanupFn).toHaveBeenCalledTimes(1)
        const cleanupContext = mockCleanupFn.mock.calls[0][0]
        expect(cleanupContext).toHaveProperty('propsValue')
        expect(cleanupContext).toHaveProperty('store')
        expect(cleanupContext).toHaveProperty('server')
        expect(cleanupContext).toHaveProperty('project')
        expect(cleanupContext).toHaveProperty('connections')
        expect(cleanupContext).toHaveProperty('run')
        expect(cleanupContext.run.reason).toBe(CleanupReason.TIMEOUT)
        expect(cleanupContext.project.id).toBe(operation.projectId)
    })

    it('should skip cleanup when action lacks onCleanup hook', async () => {
        const operation: ExecuteCleanupOperation = {
            projectId: 'test-project',
            engineToken: 'test-token',
            internalApiUrl: 'http://localhost:3000',
            publicApiUrl: 'http://localhost:4200',
            timeoutInSeconds: 30,
            piece: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '1.0.0',
                pieceType: 'OFFICIAL' as any,
                packageType: 'REGISTRY' as any,
            },
            actionName: 'return_response',
            flowVersion: {
                id: 'flow-version-id',
                flowId: 'flow-id',
                displayName: 'Test Flow',
                trigger: {
                    type: 'EMPTY' as any,
                    name: 'trigger',
                    settings: {},
                    valid: false,
                    displayName: 'Select Trigger',
                },
                valid: true,
                state: 'DRAFT' as any,
                updatedBy: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            } as any,
            cleanupReason: CleanupReason.FAILURE,
            input: {},
        }

        const constants = generateMockEngineConstants({
            projectId: operation.projectId,
            engineToken: operation.engineToken,
            internalApiUrl: operation.internalApiUrl,
            publicApiUrl: operation.publicApiUrl,
        })

        // Mock the piece loader to return an action WITHOUT onCleanup
        const mockPieceLoader = require('../../src/lib/helper/piece-loader')
        mockPieceLoader.pieceLoader.getPieceAndActionOrThrow = jest.fn().mockResolvedValue({
            pieceAction: {
                name: 'return_response',
                displayName: 'Return Response',
                requireAuth: false,
                props: {},
                run: jest.fn(),
                // No onCleanup hook
            },
            piece: {
                displayName: 'Webhook',
                auth: undefined,
            },
        })

        await executeCleanup({
            operation,
            constants,
            pieceSource: 'COMMUNITY',
        })

        expect(mockCleanupFn).not.toHaveBeenCalled()
    })

    it('should pass correct CleanupContext with CleanupReason.FAILURE', async () => {
        const operation: ExecuteCleanupOperation = {
            projectId: 'test-project',
            engineToken: 'test-token',
            internalApiUrl: 'http://localhost:3000',
            publicApiUrl: 'http://localhost:4200',
            timeoutInSeconds: 30,
            piece: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '1.0.0',
                pieceType: 'OFFICIAL' as any,
                packageType: 'REGISTRY' as any,
            },
            actionName: 'wait_for_webhook',
            flowVersion: {
                id: 'flow-version-id',
                flowId: 'flow-id',
                displayName: 'Test Flow',
                trigger: {
                    type: 'EMPTY' as any,
                    name: 'trigger',
                    settings: {},
                    valid: false,
                    displayName: 'Select Trigger',
                },
                valid: true,
                state: 'DRAFT' as any,
                updatedBy: null,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            } as any,
            cleanupReason: CleanupReason.FAILURE,
            input: {
                timeout: 3600,
            },
        }

        const constants = generateMockEngineConstants({
            projectId: operation.projectId,
            engineToken: operation.engineToken,
            internalApiUrl: operation.internalApiUrl,
            publicApiUrl: operation.publicApiUrl,
        })

        // Mock the piece loader to return an action with onCleanup
        const mockPieceLoader = require('../../src/lib/helper/piece-loader')
        mockPieceLoader.pieceLoader.getPieceAndActionOrThrow = jest.fn().mockResolvedValue({
            pieceAction: {
                name: 'wait_for_webhook',
                displayName: 'Wait for Webhook',
                requireAuth: false,
                props: {},
                run: jest.fn(),
                onCleanup: mockCleanupFn,
            },
            piece: {
                displayName: 'Webhook',
                auth: undefined,
            },
        })

        await executeCleanup({
            operation,
            constants,
            pieceSource: 'COMMUNITY',
        })

        expect(mockCleanupFn).toHaveBeenCalledTimes(1)
        const cleanupContext = mockCleanupFn.mock.calls[0][0]
        expect(cleanupContext.run.reason).toBe(CleanupReason.FAILURE)
    })
})
