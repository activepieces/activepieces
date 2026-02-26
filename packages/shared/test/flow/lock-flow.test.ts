import {
    flowOperations,
    FlowOperationType,
    FlowVersionState,
} from '../../src'
import { createEmptyFlowVersion } from './test-utils'

describe('Lock Flow', () => {
    it('should lock flow and change state to LOCKED', () => {
        const flow = createEmptyFlowVersion()
        expect(flow.state).toBe(FlowVersionState.DRAFT)
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.LOCK_FLOW,
            request: {},
        })
        expect(result.state).toBe(FlowVersionState.LOCKED)
    })
})
