import { FlowVersion } from "../flow-version"
import { ClearStepTestRunIdRequest } from "."
import { flowStructureUtil } from "../util/flow-structure-util"

export function _clearStepTestRunId(flowVersion: FlowVersion, request: ClearStepTestRunIdRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.name === request.name) {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    sampleData: {
                        ...step.settings.sampleData,
                        testRunId: undefined,
                    },
                },
            }
        }
        return step
    })
}