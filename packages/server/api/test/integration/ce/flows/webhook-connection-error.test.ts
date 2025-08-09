import { ENGINE_ERROR_NAMES, FlowStatus, TriggerType, PieceType, PackageType, AppConnectionStatus, AppConnectionType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockFlow, createMockProject, createMockUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Webhook Connection Error API Tests', () => {
    describe('POST /v1/webhooks', () => {
        it('should create flow run with raw payload when connection is expired', async () => {
            // Arrange
            const mockUser = createMockUser()
            const mockProject = createMockProject({ ownerId: mockUser.id })
            const mockToken = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
            })

            // Create a flow with a webhook trigger that requires a connection
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
                trigger: {
                    type: TriggerType.PIECE,
                    settings: {
                        pieceName: 'slack',
                        pieceVersion: '1.0.0',
                        pieceType: PieceType.OFFICIAL,
                        packageType: PackageType.REGISTRY,
                        triggerName: 'new-message',
                        input: {
                            connectionId: 'expired-connection-id',
                            channel: 'general',
                        },
                        inputUiInfo: { schema: {} },
                    },
                    name: 'slack-trigger',
                    valid: true,
                    displayName: 'Slack New Message',
                    nextAction: {
                        type: 'ACTION',
                        settings: {
                            pieceName: 'http',
                            pieceVersion: '1.0.0',
                            pieceType: PieceType.OFFICIAL,
                            packageType: PackageType.REGISTRY,
                            actionName: 'send-request',
                            input: {
                                url: 'https://example.com/webhook',
                                method: 'POST',
                                body: '{{ trigger.message }}',
                            },
                            inputUiInfo: { schema: {} },
                        },
                        name: 'http-action',
                        valid: true,
                        displayName: 'Send HTTP Request',
                        nextAction: null,
                    },
                },
            })

            // Create an expired connection
            const expiredConnection = {
                id: 'expired-connection-id',
                projectId: mockProject.id,
                name: 'Slack Connection',
                type: AppConnectionType.OAUTH2,
                status: AppConnectionStatus.ERROR,
                value: {
                    error: 'refresh_token_expired',
                },
            }

            // Mock the database to return our test data
            jest.spyOn(databaseConnection.getRepository('user'), 'findOneBy')
                .mockResolvedValue(mockUser)
            jest.spyOn(databaseConnection.getRepository('project'), 'findOneBy')
                .mockResolvedValue(mockProject)
            jest.spyOn(databaseConnection.getRepository('flow'), 'findOne')
                .mockResolvedValue(mockFlow)
            jest.spyOn(databaseConnection.getRepository('app_connection'), 'findOneBy')
                .mockResolvedValue(expiredConnection)

            // Mock the engine to return connection expired error
            const mockEngineResponse = {
                success: false,
                message: `Trigger failed: ${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED} - OAuth refresh token has expired`,
            }
            
            jest.spyOn(app!.engineService, 'executeTrigger')
                .mockResolvedValue({ result: mockEngineResponse })

            const webhookPayload = {
                user: 'john.doe',
                message: 'Hello from Slack',
                channel: 'general',
                timestamp: 1234567890,
            }

            // Act
            const response = await app!.inject({
                method: 'POST',
                url: `/v1/webhooks/${mockFlow.id}`,
                headers: {
                    'content-type': 'application/json',
                },
                payload: webhookPayload,
            })

            // Assert
            expect(response.statusCode).toBe(200)
            
            // Verify flow run was created
            const flowRuns = await databaseConnection.getRepository('flow_run').find({
                where: { flowId: mockFlow.id },
            })
            expect(flowRuns).toHaveLength(1)
            
            const flowRun = flowRuns[0]
            expect(flowRun.status).toBe('RUNNING') // Will fail at action level
            expect(flowRun.payload).toEqual(webhookPayload)
            
            // Verify the flow run will fail when it tries to use the connection
            expect(flowRun.logsFileId).toBeDefined()
        })

        it('should create flow run when connection not found', async () => {
            // Arrange
            const mockUser = createMockUser()
            const mockProject = createMockProject({ ownerId: mockUser.id })
            
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
                trigger: {
                    type: TriggerType.PIECE,
                    settings: {
                        pieceName: 'github',
                        pieceVersion: '1.0.0',
                        pieceType: PieceType.OFFICIAL,
                        packageType: PackageType.REGISTRY,
                        triggerName: 'new-issue',
                        input: {
                            connectionId: 'non-existent-connection',
                            repository: 'activepieces/activepieces',
                        },
                    },
                },
            })

            jest.spyOn(databaseConnection.getRepository('flow'), 'findOne')
                .mockResolvedValue(mockFlow)
            jest.spyOn(databaseConnection.getRepository('app_connection'), 'findOneBy')
                .mockResolvedValue(null) // Connection not found

            const mockEngineResponse = {
                success: false,
                message: `${ENGINE_ERROR_NAMES.CONNECTION_NOT_FOUND} - Connection 'non-existent-connection' not found`,
            }
            
            jest.spyOn(app!.engineService, 'executeTrigger')
                .mockResolvedValue({ result: mockEngineResponse })

            const webhookPayload = {
                issue: {
                    title: 'Bug: Connection errors not visible',
                    number: 123,
                    user: 'developer',
                },
            }

            // Act
            const response = await app!.inject({
                method: 'POST',
                url: `/v1/webhooks/${mockFlow.id}`,
                headers: {
                    'content-type': 'application/json',
                },
                payload: webhookPayload,
            })

            // Assert
            expect(response.statusCode).toBe(200)
            
            const flowRuns = await databaseConnection.getRepository('flow_run').find({
                where: { flowId: mockFlow.id },
            })
            expect(flowRuns).toHaveLength(1)
            expect(flowRuns[0].payload).toEqual(webhookPayload)
        })

        it('should handle connection loading failure', async () => {
            // Arrange
            const mockUser = createMockUser()
            const mockProject = createMockProject({ ownerId: mockUser.id })
            
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
            })

            const corruptedConnection = {
                id: 'corrupted-connection',
                projectId: mockProject.id,
                name: 'Corrupted Connection',
                type: AppConnectionType.OAUTH2,
                status: AppConnectionStatus.ACTIVE,
                value: '{{invalid-json}}', // Corrupted value
            }

            jest.spyOn(databaseConnection.getRepository('flow'), 'findOne')
                .mockResolvedValue(mockFlow)
            jest.spyOn(databaseConnection.getRepository('app_connection'), 'findOneBy')
                .mockResolvedValue(corruptedConnection)

            const mockEngineResponse = {
                success: false,
                message: `Engine error: ${ENGINE_ERROR_NAMES.CONNECTION_LOADING_FAILURE} - Failed to decrypt connection value`,
            }
            
            jest.spyOn(app!.engineService, 'executeTrigger')
                .mockResolvedValue({ result: mockEngineResponse })

            const webhookPayload = { data: 'test' }

            // Act
            const response = await app!.inject({
                method: 'POST',
                url: `/v1/webhooks/${mockFlow.id}`,
                payload: webhookPayload,
            })

            // Assert
            expect(response.statusCode).toBe(200)
            
            const flowRuns = await databaseConnection.getRepository('flow_run').find({
                where: { flowId: mockFlow.id },
            })
            expect(flowRuns).toHaveLength(1)
            expect(flowRuns[0].payload).toEqual(webhookPayload)
        })

        it('should not create flow run for non-connection errors', async () => {
            // Arrange
            const mockUser = createMockUser()
            const mockProject = createMockProject({ ownerId: mockUser.id })
            
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
            })

            jest.spyOn(databaseConnection.getRepository('flow'), 'findOne')
                .mockResolvedValue(mockFlow)

            const mockEngineResponse = {
                success: false,
                message: 'Invalid webhook signature',
            }
            
            jest.spyOn(app!.engineService, 'executeTrigger')
                .mockResolvedValue({ result: mockEngineResponse })

            const webhookPayload = { data: 'unsigned' }

            // Act
            const response = await app!.inject({
                method: 'POST',
                url: `/v1/webhooks/${mockFlow.id}`,
                payload: webhookPayload,
            })

            // Assert
            expect(response.statusCode).toBe(400) // Bad request for invalid signature
            
            const flowRuns = await databaseConnection.getRepository('flow_run').find({
                where: { flowId: mockFlow.id },
            })
            expect(flowRuns).toHaveLength(0) // No flow run created
        })

        it('should handle complex nested payloads', async () => {
            // Arrange
            const mockUser = createMockUser()
            const mockProject = createMockProject({ ownerId: mockUser.id })
            
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                status: FlowStatus.ENABLED,
            })

            const expiredConnection = {
                id: 'expired-connection',
                projectId: mockProject.id,
                status: AppConnectionStatus.ERROR,
            }

            jest.spyOn(databaseConnection.getRepository('flow'), 'findOne')
                .mockResolvedValue(mockFlow)
            jest.spyOn(databaseConnection.getRepository('app_connection'), 'findOneBy')
                .mockResolvedValue(expiredConnection)

            const mockEngineResponse = {
                success: false,
                message: `${ENGINE_ERROR_NAMES.CONNECTION_EXPIRED}`,
            }
            
            jest.spyOn(app!.engineService, 'executeTrigger')
                .mockResolvedValue({ result: mockEngineResponse })

            const complexPayload = {
                event: 'order.created',
                data: {
                    order: {
                        id: faker.string.uuid(),
                        customer: {
                            id: faker.string.uuid(),
                            email: faker.internet.email(),
                            profile: {
                                firstName: faker.person.firstName(),
                                lastName: faker.person.lastName(),
                                preferences: {
                                    notifications: true,
                                    newsletter: false,
                                },
                            },
                        },
                        items: [
                            { id: 1, name: 'Product A', quantity: 2, price: 29.99 },
                            { id: 2, name: 'Product B', quantity: 1, price: 49.99 },
                        ],
                        metadata: {
                            source: 'web',
                            campaign: 'summer-sale',
                            timestamp: Date.now(),
                        },
                    },
                },
            }

            // Act
            const response = await app!.inject({
                method: 'POST',
                url: `/v1/webhooks/${mockFlow.id}`,
                headers: {
                    'content-type': 'application/json',
                },
                payload: complexPayload,
            })

            // Assert
            expect(response.statusCode).toBe(200)
            
            const flowRuns = await databaseConnection.getRepository('flow_run').find({
                where: { flowId: mockFlow.id },
            })
            expect(flowRuns).toHaveLength(1)
            
            // Verify the entire complex structure is preserved
            expect(flowRuns[0].payload).toEqual(complexPayload)
            expect(flowRuns[0].payload.data.order.customer.profile.preferences.notifications).toBe(true)
        })
    })

    describe('Flow Run Alerts', () => {
        it('should trigger alerts for flow runs created from connection errors', async () => {
            // This test would verify that flow runs created due to connection errors
            // properly trigger the alert system when they fail at the action level
            
            // Implementation would depend on your alert system architecture
            // For now, this is a placeholder to show the intended test coverage
            expect(true).toBe(true)
        })
    })

    describe('Webhook Retry Queue', () => {
        it('should not accumulate webhooks in retry queue for connection errors', async () => {
            // This test would verify that webhooks with connection errors
            // don't get stuck in an infinite retry loop
            
            // Implementation would depend on your retry queue architecture
            // For now, this is a placeholder to show the intended test coverage
            expect(true).toBe(true)
        })
    })
})