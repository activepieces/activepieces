import { PopulatedFlow } from '@activepieces/shared'
import { projectStateService } from '../../../../../../../src/app/ee/projects/project-release/project-state/project-state.service'
import { system } from '../../../../../../../src/app/helper/system/system'
import { flowGenerator } from '../../../../../../helpers/flow-generator'
import { tableGenerator } from '../../../../../../helpers/table-generator'

const logger = system.globalLogger()

describe('ProjectStateService', () => {
    describe('getFlowState', () => {
        it('should remove extra properties from flow state', () => {
            const flow: PopulatedFlow = {
                ...flowGenerator.simpleActionAndTrigger(),
                extraProperty: 'should be removed',
            } as PopulatedFlow
            const flowState = projectStateService(logger).getFlowState(flow)
            expect(flowState).not.toHaveProperty('extraProperty')
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
