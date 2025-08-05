import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'

export enum TriggerTestStrategy {
    SIMULATION = 'SIMULATION',
    TEST_FUNCTION = 'TEST_FUNCTION',
}

export const TestTriggerRequestBody = Type.Object({
    flowId: ApId,
    flowVersionId: ApId,
    testStrategy: Type.Enum(TriggerTestStrategy),
})

export type TestTriggerRequestBody = Static<typeof TestTriggerRequestBody>


export const CancelTestTriggerRequestBody = Type.Object({
    flowId: ApId,
})

export type CancelTestTriggerRequestBody = Static<typeof CancelTestTriggerRequestBody>