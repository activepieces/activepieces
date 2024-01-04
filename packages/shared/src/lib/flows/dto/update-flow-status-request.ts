import { Static, Type } from '@sinclair/typebox'
import { FlowStatus } from '../flow'
export const UpdateFlowStatusRequest =  Type.Object({
    status: Type.Enum(FlowStatus),
})
export type UpdateFlowStatusRequest = Static<typeof UpdateFlowStatusRequest>