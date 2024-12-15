import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { SkipActionRequest } from '.'

export function _skipAction(flowVersion: FlowVersion, request: SkipActionRequest): FlowVersion {
    const requests = Array.isArray(request) ? request : [request]
    return requests.reduce((acc, req)=>{
        return skipSingleAction(acc, req.name, req.skip)
    }, flowVersion)
}

const skipSingleAction = (flowVersion: FlowVersion, name: string, skip: boolean)=>{
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== name) {
            return stepToUpdate
        }

        return {
            ...stepToUpdate,
            skip,
        }
    })
}