import {
    flowOperations,
    FlowOperationType,
} from '../../src'
import { createEmptyFlowVersion } from './test-utils'

describe('Change Name', () => {
    it('should change flow display name', () => {
        const flow = createEmptyFlowVersion()
        expect(flow.displayName).toBe('Test Flow')
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.CHANGE_NAME,
            request: { displayName: 'My New Flow Name' },
        })
        expect(result.displayName).toBe('My New Flow Name')
    })
})
