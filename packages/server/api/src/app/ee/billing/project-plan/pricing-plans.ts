import { Static, Type } from '@sinclair/typebox'
import { SystemProp, system } from 'server-shared'

export const FlowPlanLimits = Type.Object({
    nickname: Type.String(),
    tasks: Type.Number(),
    connections: Type.Number(),
    minimumPollingInterval: Type.Number(),
    teamMembers: Type.Number(),
})

export type FlowPlanLimits = Static<typeof FlowPlanLimits>

export const defaultPlanInformation: FlowPlanLimits = JSON.parse(
    system.get(SystemProp.BILLING_SETTINGS) ?? '{}',
)
