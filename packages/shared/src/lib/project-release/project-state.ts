import { Static } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'

export const FlowState = PopulatedFlow
export type FlowState = Static<typeof FlowState>
