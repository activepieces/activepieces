import { Static, Type } from "@sinclair/typebox"
export * from './constants'
export * from './usage'
export * from './plan'

export enum PlanName {
    PRO = 'PRO',
    PLATFORM = 'PLATFORM',
}

export const UpgradeRequest = Type.Union([
    Type.Object({
        plan: Type.Literal(PlanName.PLATFORM),
        priceId: Type.String(),
        extraUsers: Type.Number(),
        extraTasks: Type.Number(),
    }),
    Type.Object({
        plan: Type.Literal(PlanName.PRO),
        priceId: Type.String(),
        extraUsers: Type.Number(),
    }),
])

export type UpgradeRequest = Static<typeof UpgradeRequest>