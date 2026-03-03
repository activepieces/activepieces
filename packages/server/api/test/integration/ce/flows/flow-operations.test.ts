import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    FlowActionType,
    FlowOperationType,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    PopulatedFlow,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockFolder,
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { describeWithAuth } from '../../../helpers/describe-with-auth'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flow Operations API', () => {
    describeWithAuth('GET /v1/flows/:id', () => app!, (setup) => {
        it('should get a flow by id', async () => {
            const ctx = await setup()

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.get(`/v1/flows/${mockFlow.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(mockFlow.id)
            expect(body.projectId).toBe(ctx.project.id)
            expect(body.version).toBeDefined()
            expect(body.version.id).toBe(mockFlowVersion.id)
        })

        it('should return 404 for non-existent flow', async () => {
            const ctx = await setup()

            const response = await ctx.get('/v1/flows/nonExistentId12345678')

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('GET /v1/flows/:id (Cross-project)', () => {
        it('should deny access for flow in another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx1.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx2.get(`/v1/flows/${mockFlow.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describeWithAuth('GET /v1/flows/count', () => app!, (setup) => {
        it('should count flows in project', async () => {
            const ctx = await setup()

            const mockFlow1 = createMockFlow({ projectId: ctx.project.id })
            const mockFlow2 = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', [mockFlow1, mockFlow2])

            const mockFlowVersion1 = createMockFlowVersion({ flowId: mockFlow1.id })
            const mockFlowVersion2 = createMockFlowVersion({ flowId: mockFlow2.id })
            await db.save('flow_version', [mockFlowVersion1, mockFlowVersion2])

            const response = await ctx.get('/v1/flows/count', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toBe(2)
        })
    })

    describeWithAuth('DELETE /v1/flows/:id', () => app!, (setup) => {
        it('should delete a flow', async () => {
            const ctx = await setup()

            const mockFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.delete(`/v1/flows/${mockFlow.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)

            // Verify the flow no longer appears in list
            const listResponse = await ctx.get('/v1/flows', { projectId: ctx.project.id })
            const flows = listResponse?.json().data ?? []
            const flowIds = flows.map((f: Record<string, string>) => f.id)
            expect(flowIds).not.toContain(mockFlow.id)
        })

        it('should return 404 when deleting non-existent flow', async () => {
            const ctx = await setup()

            const response = await ctx.delete('/v1/flows/nonExistentId12345678')

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('DELETE /v1/flows/:id (Cross-project)', () => {
        it('should deny deleting flow from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx1.project.id, status: FlowStatus.DISABLED })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx2.delete(`/v1/flows/${mockFlow.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describeWithAuth('POST /v1/flows/:id CHANGE_NAME', () => app!, (setup) => {
        it('should rename a flow', async () => {
            const ctx = await setup()

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'Original Name',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
            const flow: PopulatedFlow = createResponse?.json()

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_NAME,
                request: { displayName: 'New Name' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.displayName).toBe('New Name')
        })
    })

    describe('POST /v1/flows/:id CHANGE_FOLDER', () => {
        it('should move flow to folder', async () => {
            const ctx = await createTestContext(app!)

            const mockFolder = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', mockFolder)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })

            const flow: PopulatedFlow = createResponse?.json()

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_FOLDER,
                request: { folderId: mockFolder.id },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.folderId).toBe(mockFolder.id)
        })

        it('should move flow to null (unfolder)', async () => {
            const ctx = await createTestContext(app!)

            const mockFolder = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', mockFolder)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
                folderId: mockFolder.id,
            }, { query: { projectId: ctx.project.id } })

            const flow: PopulatedFlow = createResponse?.json()

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.CHANGE_FOLDER,
                request: { folderId: null },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.folderId).toBeNull()
        })
    })

    describe('POST /v1/flows/:id UPDATE_TRIGGER', () => {
        it('should update trigger to piece trigger', async () => {
            const ctx = await createTestContext(app!)

            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/piece-schedule',
                version: '0.2.0',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })

            const flow: PopulatedFlow = createResponse?.json()

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: {
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-schedule',
                        pieceVersion: '0.2.0',
                        input: {},
                        triggerName: 'every_hour',
                        propertySettings: {},
                    },
                    valid: false,
                    name: 'trigger',
                    displayName: 'Schedule',
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.trigger.type).toBe(FlowTriggerType.PIECE)
            expect(body.version.trigger.settings.pieceName).toBe('@activepieces/piece-schedule')
        })
    })

    describeWithAuth('POST /v1/flows/:id ADD_ACTION', () => app!, (setup) => {
        it('should add code action after trigger', async () => {
            const ctx = await setup()

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })

            const flow: PopulatedFlow = createResponse?.json()

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'trigger',
                    action: {
                        type: FlowActionType.CODE,
                        displayName: 'Code Step',
                        name: 'step_1',
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'export const code = async () => { return true; }',
                                packageJson: '{}',
                            },
                        },
                        valid: true,
                        skip: false,
                    },
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.trigger.nextAction).toBeDefined()
            expect(body.version.trigger.nextAction.type).toBe(FlowActionType.CODE)
            expect(body.version.trigger.nextAction.displayName).toBe('Code Step')
        })
    })

    describe('POST /v1/flows/:id UPDATE_ACTION', () => {
        it('should update action settings', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = createResponse?.json()

            await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'trigger',
                    action: {
                        type: FlowActionType.CODE,
                        displayName: 'Code Step',
                        name: 'step_1',
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'export const code = async () => { return true; }',
                                packageJson: '{}',
                            },
                        },
                        valid: true,
                        skip: false,
                    },
                },
            })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.UPDATE_ACTION,
                request: {
                    type: FlowActionType.CODE,
                    displayName: 'Updated Code Step',
                    name: 'step_1',
                    settings: {
                        input: { key: 'value' },
                        sourceCode: {
                            code: 'export const code = async () => { return false; }',
                            packageJson: '{}',
                        },
                    },
                    valid: true,
                    skip: false,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.trigger.nextAction.displayName).toBe('Updated Code Step')
        })
    })

    describe('POST /v1/flows/:id DELETE_ACTION', () => {
        it('should delete action by name', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = createResponse?.json()

            await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'trigger',
                    action: {
                        type: FlowActionType.CODE,
                        displayName: 'Code Step',
                        name: 'step_1',
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'export const code = async () => { return true; }',
                                packageJson: '{}',
                            },
                        },
                        valid: true,
                        skip: false,
                    },
                },
            })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.DELETE_ACTION,
                request: { names: ['step_1'] },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.trigger.nextAction).toBeUndefined()
        })
    })

    describe('POST /v1/flows/:id DUPLICATE_ACTION', () => {
        it('should duplicate an action', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = createResponse?.json()

            await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'trigger',
                    action: {
                        type: FlowActionType.CODE,
                        displayName: 'Code Step',
                        name: 'step_1',
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'export const code = async () => { return true; }',
                                packageJson: '{}',
                            },
                        },
                        valid: true,
                        skip: false,
                    },
                },
            })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.DUPLICATE_ACTION,
                request: { stepName: 'step_1' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.trigger.nextAction).toBeDefined()
            expect(body.version.trigger.nextAction.nextAction).toBeDefined()
        })
    })

    describe('POST /v1/flows/:id MOVE_ACTION', () => {
        it('should move action to different position', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = createResponse?.json()

            await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'trigger',
                    action: {
                        type: FlowActionType.CODE,
                        displayName: 'Step 1',
                        name: 'step_1',
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'export const code = async () => { return 1; }',
                                packageJson: '{}',
                            },
                        },
                        valid: true,
                        skip: false,
                    },
                },
            })

            await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'step_1',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    action: {
                        type: FlowActionType.CODE,
                        displayName: 'Step 2',
                        name: 'step_2',
                        settings: {
                            input: {},
                            sourceCode: {
                                code: 'export const code = async () => { return 2; }',
                                packageJson: '{}',
                            },
                        },
                        valid: true,
                        skip: false,
                    },
                },
            })

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.MOVE_ACTION,
                request: {
                    name: 'step_2',
                    newParentStep: 'trigger',
                    stepLocationRelativeToNewParent: StepLocationRelativeToParent.AFTER,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.trigger.nextAction.displayName).toBe('Step 2')
        })
    })

    describe('POST /v1/flows/:id IMPORT_FLOW', () => {
        it('should import flow definition', async () => {
            const ctx = await createTestContext(app!)

            const createResponse = await ctx.post('/v1/flows', {
                displayName: 'test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = createResponse?.json()

            const response = await ctx.post(`/v1/flows/${flow.id}`, {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                    displayName: 'Imported Flow',
                    trigger: {
                        type: FlowTriggerType.EMPTY,
                        name: 'trigger',
                        settings: {},
                        valid: false,
                        displayName: 'Select Trigger',
                    },
                    schemaVersion: null,
                    notes: null,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.version.displayName).toBe('Imported Flow')
            expect(body.version.state).toBe(FlowVersionState.DRAFT)
        })
    })

    describe('GET /v1/flows/:flowId/versions', () => {
        it('should list flow versions', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.DRAFT,
            })
            await db.save('flow_version', mockFlowVersion)

            const response = await ctx.get(`/v1/flows/${mockFlow.id}/versions`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(mockFlowVersion.id)
        })
    })
})
