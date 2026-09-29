import { FlowOperationStatus, FlowProjectOperationType, FlowVersion, PopulatedFlow } from '@activepieces/shared'
import { projectStateService } from '../../../../../../../src/app/ee/projects/project-release/project-state/project-state.service'
import { system } from '../../../../../../../src/app/helper/system/system'
import { flowGenerator } from '../../../../../../helpers/flow-generator'
import { tableGenerator } from '../../../../../../helpers/table-generator'

vi.mock('../../../../../../../src/app/flows/flow-version/migrations', () => ({
    flowMigrations: {
        apply: async (version: FlowVersion) => version,
    },
}))

const missingAgentError = { flowId: 'flow-1', message: 'Failed to publish flow: this flow runs an agent that is not in this project any more' }

vi.mock('../../../../../../../src/app/ee/projects/project-release/project-state/project-state-helper', () => ({
    projectStateHelper: () => ({
        createFlowInProject: async () => ({ id: 'flow-1' }),
        republishFlow: async () => missingAgentError,
    }),
}))

const logger = system.globalLogger()

describe('ProjectStateService', () => {
    describe('getFlowState', () => {
        it('should remove extra properties from flow state', async () => {
            const flow: PopulatedFlow = {
                ...flowGenerator.simpleActionAndTrigger(),
                extraProperty: 'should be removed',
            } as PopulatedFlow
            const flowState = await projectStateService(logger).getFlowState(flow)
            expect(flowState).not.toHaveProperty('extraProperty')
        })

        it('should default operationStatus to NONE when missing (e.g. flow stored in git before field was added)', async () => {
            const flow = flowGenerator.simpleActionAndTrigger()
            const flowWithoutOperationStatus = { ...flow } as Partial<PopulatedFlow>
            delete flowWithoutOperationStatus.operationStatus
            const flowState = await projectStateService(logger).getFlowState(flowWithoutOperationStatus as PopulatedFlow)
            expect(flowState.operationStatus).toBe(FlowOperationStatus.NONE)
        })
    })

    describe('apply', () => {
        it('returns the publish error of a flow that references an agent missing from the project', async () => {
            const flowState = await projectStateService(logger).getFlowState(flowGenerator.simpleActionAndTrigger())
            const errors = await projectStateService(logger).apply({
                projectId: 'project-1',
                platformId: 'platform-1',
                diffs: {
                    flows: [{ type: FlowProjectOperationType.CREATE_FLOW, flowState }],
                    connections: [],
                    tables: [],
                },
            })
            expect(errors).toEqual([missingAgentError])
        })
    })

    describe('getTableState', () => {
        it('should remove extra properties from table state', () => {
            const table = {
                ...tableGenerator.simpleTable({}),
                extraProperty: 'should be removed',
            }
            const tableState = projectStateService(logger).getTableState(table)
            expect(tableState).not.toHaveProperty('extraProperty')
        })
    })

})
