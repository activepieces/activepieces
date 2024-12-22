import { Static, Type } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'

export const StateFile = Type.Object({
    flow: PopulatedFlow,
})
export type StateFile = Static<typeof StateFile>