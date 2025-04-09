import { SkipActionRequest } from '.'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'

export function _skipAction(flowVersion: FlowVersion, request: SkipActionRequest): FlowVersion {
  return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
    if (!request.names.includes(stepToUpdate.name)) {
      return stepToUpdate
    }
    return {
      ...stepToUpdate,
      skip: request.skip,
    }
  })
}
