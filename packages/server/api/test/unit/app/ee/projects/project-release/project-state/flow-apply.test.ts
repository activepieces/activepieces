import { DiffState, FlowProjectOperationType, FlowStatus, FlowSyncError } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { projectStateHelper } from '../../../../../../../src/app/ee/projects/project-release/project-state/project-state-helper'
import { projectStateService } from '../../../../../../../src/app/ee/projects/project-release/project-state/project-state.service'
import { system } from '../../../../../../../src/app/helper/system/system'
import { flowGenerator } from '../../../../../../helpers/flow-generator'

// Mock the project state helper
jest.mock('../../../../../../../src/app/ee/projects/project-release/project-state/project-state-helper')

const mockProjectStateHelper = projectStateHelper as jest.MockedFunction<typeof projectStateHelper>
const logger = system.globalLogger()

describe('ProjectStateService.apply - Flow Operations', () => {
    let mockCreateFlowInProject: jest.Mock
    let mockUpdateFlowInProject: jest.Mock
    let mockDeleteFlowFromProject: jest.Mock
    let mockRepublishFlow: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()

        // Set up mocks for all helper methods
        mockCreateFlowInProject = jest.fn()
        mockUpdateFlowInProject = jest.fn()
        mockDeleteFlowFromProject = jest.fn()
        mockRepublishFlow = jest.fn()

        mockProjectStateHelper.mockReturnValue({
            createFlowInProject: mockCreateFlowInProject,
            updateFlowInProject: mockUpdateFlowInProject,
            deleteFlowFromProject: mockDeleteFlowFromProject,
            republishFlow: mockRepublishFlow,
        })
    })

    describe('CREATE_FLOW operation', () => {
        it('should create a flow and republish it with default enabled status', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState = flowGenerator.simpleActionAndTrigger()
            const createdFlow = { ...flowState, id: nanoid() }

            mockCreateFlowInProject.mockResolvedValue(createdFlow)
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.CREATE_FLOW as const,
                    flowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockCreateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockCreateFlowInProject).toHaveBeenCalledWith(flowState, projectId)

            expect(mockRepublishFlow).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).toHaveBeenCalledWith({
                flow: createdFlow,
                projectId,
                // Note: status should be undefined (default to enabled)
            })
        })

        it('should handle multiple create flow operations', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState1 = flowGenerator.simpleActionAndTrigger()
            const flowState2 = flowGenerator.simpleActionAndTrigger()
            const createdFlow1 = { ...flowState1, id: nanoid() }
            const createdFlow2 = { ...flowState2, id: nanoid() }

            mockCreateFlowInProject
                .mockResolvedValueOnce(createdFlow1)
                .mockResolvedValueOnce(createdFlow2)
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [
                    {
                        type: FlowProjectOperationType.CREATE_FLOW as const,
                        flowState: flowState1,
                    },
                    {
                        type: FlowProjectOperationType.CREATE_FLOW as const,
                        flowState: flowState2,
                    },
                ],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockCreateFlowInProject).toHaveBeenCalledTimes(2)
            expect(mockRepublishFlow).toHaveBeenCalledTimes(2)
            expect(mockCreateFlowInProject).toHaveBeenNthCalledWith(1, flowState1, projectId)
            expect(mockCreateFlowInProject).toHaveBeenNthCalledWith(2, flowState2, projectId)
        })

        it('should propagate errors from createFlowInProject', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState = flowGenerator.simpleActionAndTrigger()
            const expectedError = new Error('Failed to create flow')

            mockCreateFlowInProject.mockRejectedValue(expectedError)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.CREATE_FLOW as const,
                    flowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act & Assert
            await expect(projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })).rejects.toThrow('Failed to create flow')

            expect(mockCreateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).not.toHaveBeenCalled()
        })
    })

    describe('UPDATE_FLOW operation', () => {
        it('should update a flow and republish it with preserved status', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const originalFlowState = flowGenerator.simpleActionAndTrigger()
            originalFlowState.status = FlowStatus.DISABLED
            const newFlowState = { ...originalFlowState }
            newFlowState.version.displayName = 'Updated Flow Name'
            const updatedFlow = { ...newFlowState, id: nanoid() }

            mockUpdateFlowInProject.mockResolvedValue(updatedFlow)
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.UPDATE_FLOW as const,
                    flowState: originalFlowState,
                    newFlowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockUpdateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockUpdateFlowInProject).toHaveBeenCalledWith(originalFlowState, newFlowState, projectId)

            expect(mockRepublishFlow).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).toHaveBeenCalledWith({
                flow: updatedFlow,
                projectId,
                status: FlowStatus.DISABLED, // Should preserve original status
            })
        })

        it('should handle enabled status preservation', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const originalFlowState = flowGenerator.simpleActionAndTrigger()
            originalFlowState.status = FlowStatus.ENABLED
            const newFlowState = { ...originalFlowState }
            const updatedFlow = { ...newFlowState, id: nanoid() }

            mockUpdateFlowInProject.mockResolvedValue(updatedFlow)
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.UPDATE_FLOW as const,
                    flowState: originalFlowState,
                    newFlowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockRepublishFlow).toHaveBeenCalledWith({
                flow: updatedFlow,
                projectId,
                status: FlowStatus.ENABLED,
            })
        })

        it('should handle multiple update operations', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const originalFlow1 = flowGenerator.simpleActionAndTrigger()
            const originalFlow2 = flowGenerator.simpleActionAndTrigger()
            originalFlow1.status = FlowStatus.ENABLED
            originalFlow2.status = FlowStatus.DISABLED

            const newFlow1 = { ...originalFlow1 }
            const newFlow2 = { ...originalFlow2 }
            const updatedFlow1 = { ...newFlow1, id: nanoid() }
            const updatedFlow2 = { ...newFlow2, id: nanoid() }

            mockUpdateFlowInProject
                .mockResolvedValueOnce(updatedFlow1)
                .mockResolvedValueOnce(updatedFlow2)
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [
                    {
                        type: FlowProjectOperationType.UPDATE_FLOW as const,
                        flowState: originalFlow1,
                        newFlowState: newFlow1,
                    },
                    {
                        type: FlowProjectOperationType.UPDATE_FLOW as const,
                        flowState: originalFlow2,
                        newFlowState: newFlow2,
                    },
                ],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockUpdateFlowInProject).toHaveBeenCalledTimes(2)
            expect(mockRepublishFlow).toHaveBeenCalledTimes(2)
            expect(mockRepublishFlow).toHaveBeenNthCalledWith(1, {
                flow: updatedFlow1,
                projectId,
                status: FlowStatus.ENABLED,
            })
            expect(mockRepublishFlow).toHaveBeenNthCalledWith(2, {
                flow: updatedFlow2,
                projectId,
                status: FlowStatus.DISABLED,
            })
        })

        it('should propagate errors from updateFlowInProject', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const originalFlowState = flowGenerator.simpleActionAndTrigger()
            const newFlowState = { ...originalFlowState }
            const expectedError = new Error('Failed to update flow')

            mockUpdateFlowInProject.mockRejectedValue(expectedError)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.UPDATE_FLOW as const,
                    flowState: originalFlowState,
                    newFlowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act & Assert
            await expect(projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })).rejects.toThrow('Failed to update flow')

            expect(mockUpdateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).not.toHaveBeenCalled()
        })
    })

    describe('DELETE_FLOW operation', () => {
        it('should delete a flow', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState = flowGenerator.simpleActionAndTrigger()

            mockDeleteFlowFromProject.mockResolvedValue(undefined)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.DELETE_FLOW as const,
                    flowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockDeleteFlowFromProject).toHaveBeenCalledTimes(1)
            expect(mockDeleteFlowFromProject).toHaveBeenCalledWith(flowState.id, projectId)

            // Delete operations don't trigger republish
            expect(mockRepublishFlow).not.toHaveBeenCalled()
        })

        it('should handle multiple delete operations', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState1 = flowGenerator.simpleActionAndTrigger()
            const flowState2 = flowGenerator.simpleActionAndTrigger()

            mockDeleteFlowFromProject.mockResolvedValue(undefined)

            const diffs = {
                flows: [
                    {
                        type: FlowProjectOperationType.DELETE_FLOW as const,
                        flowState: flowState1,
                    },
                    {
                        type: FlowProjectOperationType.DELETE_FLOW as const,
                        flowState: flowState2,
                    },
                ],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockDeleteFlowFromProject).toHaveBeenCalledTimes(2)
            expect(mockDeleteFlowFromProject).toHaveBeenNthCalledWith(1, flowState1.id, projectId)
            expect(mockDeleteFlowFromProject).toHaveBeenNthCalledWith(2, flowState2.id, projectId)
            expect(mockRepublishFlow).not.toHaveBeenCalled()
        })

        it('should propagate errors from deleteFlowFromProject', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState = flowGenerator.simpleActionAndTrigger()
            const expectedError = new Error('Failed to delete flow')

            mockDeleteFlowFromProject.mockRejectedValue(expectedError)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.DELETE_FLOW as const,
                    flowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act & Assert
            await expect(projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })).rejects.toThrow('Failed to delete flow')

            expect(mockDeleteFlowFromProject).toHaveBeenCalledTimes(1)
        })
    })

    describe('Republish error handling', () => {
        it('should continue processing even if republish returns an error', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState = flowGenerator.simpleActionAndTrigger()
            const createdFlow = { ...flowState, id: nanoid() }
            const syncError: FlowSyncError = {
                flowId: createdFlow.id,
                message: 'Flow is not valid',
            }

            mockCreateFlowInProject.mockResolvedValue(createdFlow)
            mockRepublishFlow.mockResolvedValue(syncError)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.CREATE_FLOW as const,
                    flowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act - Should not throw despite republish error
            await expect(projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })).resolves.not.toThrow()

            // Assert
            expect(mockCreateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).toHaveBeenCalledTimes(1)
        })

        it('should handle republish errors for update operations', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const originalFlowState = flowGenerator.simpleActionAndTrigger()
            const newFlowState = { ...originalFlowState }
            const updatedFlow = { ...newFlowState, id: nanoid() }
            const syncError: FlowSyncError = {
                flowId: updatedFlow.id,
                message: 'Failed to publish flow',
            }

            mockUpdateFlowInProject.mockResolvedValue(updatedFlow)
            mockRepublishFlow.mockResolvedValue(syncError)

            const diffs = {
                flows: [{
                    type: FlowProjectOperationType.UPDATE_FLOW as const,
                    flowState: originalFlowState,
                    newFlowState,
                }],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockUpdateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).toHaveBeenCalledTimes(1)
        })
    })

    describe('Mixed flow operations', () => {
        it('should handle create, update, and delete operations in one apply call', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()

            // Create operation
            const createFlowState = flowGenerator.simpleActionAndTrigger()
            const createdFlow = { ...createFlowState, id: nanoid() }

            // Update operation
            const originalFlowState = flowGenerator.simpleActionAndTrigger()
            originalFlowState.status = FlowStatus.ENABLED
            const newFlowState = { ...originalFlowState }
            newFlowState.version.displayName = 'Updated Flow'
            const updatedFlow = { ...newFlowState, id: nanoid() }

            // Delete operation
            const deleteFlowState = flowGenerator.simpleActionAndTrigger()

            mockCreateFlowInProject.mockResolvedValue(createdFlow)
            mockUpdateFlowInProject.mockResolvedValue(updatedFlow)
            mockDeleteFlowFromProject.mockResolvedValue(undefined)
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [
                    {
                        type: FlowProjectOperationType.CREATE_FLOW as const,
                        flowState: createFlowState,
                    },
                    {
                        type: FlowProjectOperationType.UPDATE_FLOW as const,
                        flowState: originalFlowState,
                        newFlowState,
                    },
                    {
                        type: FlowProjectOperationType.DELETE_FLOW as const,
                        flowState: deleteFlowState,
                    },
                ],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockCreateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockUpdateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockDeleteFlowFromProject).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).toHaveBeenCalledTimes(2) // Only create and update trigger republish

            expect(mockCreateFlowInProject).toHaveBeenCalledWith(createFlowState, projectId)
            expect(mockUpdateFlowInProject).toHaveBeenCalledWith(originalFlowState, newFlowState, projectId)
            expect(mockDeleteFlowFromProject).toHaveBeenCalledWith(deleteFlowState.id, projectId)
        })

        it('should process operations sequentially and handle partial failures', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()

            const createFlowState = flowGenerator.simpleActionAndTrigger()
            const updateFlowState = flowGenerator.simpleActionAndTrigger()
            const newFlowState = { ...updateFlowState }

            const createdFlow = { ...createFlowState, id: nanoid() }

            // First operation succeeds, second fails
            mockCreateFlowInProject.mockResolvedValue(createdFlow)
            mockUpdateFlowInProject.mockRejectedValue(new Error('Update failed'))
            mockRepublishFlow.mockResolvedValue(null)

            const diffs = {
                flows: [
                    {
                        type: FlowProjectOperationType.CREATE_FLOW as const,
                        flowState: createFlowState,
                    },
                    {
                        type: FlowProjectOperationType.UPDATE_FLOW as const,
                        flowState: updateFlowState,
                        newFlowState,
                    },
                ],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act & Assert
            await expect(projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })).rejects.toThrow('Update failed')

            // First operation should have been executed
            expect(mockCreateFlowInProject).toHaveBeenCalledTimes(1)
            expect(mockRepublishFlow).toHaveBeenCalledTimes(1)

            // Second operation should have been attempted
            expect(mockUpdateFlowInProject).toHaveBeenCalledTimes(1)
        })
    })

    describe('Edge cases and validation', () => {
        it('should handle empty flow operations array', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()

            const diffs = {
                flows: [],
                connections: [],
                tables: [],
                agents: [],
            }

            // Act
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockCreateFlowInProject).not.toHaveBeenCalled()
            expect(mockUpdateFlowInProject).not.toHaveBeenCalled()
            expect(mockDeleteFlowFromProject).not.toHaveBeenCalled()
            expect(mockRepublishFlow).not.toHaveBeenCalled()
        })

        it('should handle unknown operation type gracefully', async () => {
            // Arrange
            const projectId = nanoid()
            const platformId = nanoid()
            const flowState = flowGenerator.simpleActionAndTrigger()

            const diffs = {
                flows: [
                    {
                        type: 'UNKNOWN_OPERATION',
                        flowState,
                    },
                ],
                connections: [],
                tables: [],
                agents: [],
            } as unknown as DiffState

            // Act - Should not throw, just skip unknown operations
            await projectStateService(logger).apply({
                projectId,
                diffs,
                platformId,
                log: logger,
            })

            // Assert
            expect(mockCreateFlowInProject).not.toHaveBeenCalled()
            expect(mockUpdateFlowInProject).not.toHaveBeenCalled()
            expect(mockDeleteFlowFromProject).not.toHaveBeenCalled()
            expect(mockRepublishFlow).not.toHaveBeenCalled()
        })
    })
})
