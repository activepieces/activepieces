import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'

export enum TriggerTestStrategy {
    SIMULATION = 'SIMULATION',
    TEST_FUNCTION = 'TEST_FUNCTION',
}

export const TestTriggerRequestBody = Type.Object({
    projectId: ApId,
    flowId: ApId,
    flowVersionId: ApId,
    testStrategy: Type.Enum(TriggerTestStrategy),
})

export type TestTriggerRequestBody = Static<typeof TestTriggerRequestBody>


export const CancelTestTriggerRequestBody = Type.Object({
    projectId: ApId,
    flowId: ApId,
})

export type CancelTestTriggerRequestBody = Static<typeof CancelTestTriggerRequestBody>