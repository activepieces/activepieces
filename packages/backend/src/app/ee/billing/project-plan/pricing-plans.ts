import { Static, Type } from '@sinclair/typebox'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'

export const FlowPlanLimits = Type.Object({
    nickname: Type.String(),
    tasks: Type.Number(),
    connections: Type.Number(),
    minimumPollingInterval: Type.Number(),
    teamMembers: Type.Number(),
})

export type FlowPlanLimits = Static<typeof FlowPlanLimits>

//TODO: if we remove bots from billing this should be without .FLOWS
export const defaultPlanInformation: FlowPlanLimits = JSON.parse(
    system.get(SystemProp.BILLING_SETTINGS) ?? '{}',
).FLOWS

