import { TypeCompiler } from '@sinclair/typebox/compiler'
import { isNil } from '../../../core/common'
import { FlowVersion } from '../flow-version'
import { FlowGraphNode, FlowNodeType } from '../graph/flow-graph'
import { FlowTrigger } from '../triggers/trigger'
import { UpdateTriggerRequest } from './index'

const triggerSchemaValidation = TypeCompiler.Compile(FlowTrigger)

export const triggerOperations = {
    update(flowVersion: FlowVersion, request: UpdateTriggerRequest): FlowVersion {
        const triggerData = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            kind: request.kind,
            settings: request.settings,
        }
        const valid = (isNil(request.valid) ? true : request.valid) && triggerSchemaValidation.Check(triggerData)
        const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
        const triggerNodeIndex = clonedVersion.graph.nodes.findIndex(
            (n) => n.type === FlowNodeType.TRIGGER,
        )
        const updatedNode: FlowGraphNode = {
            id: request.name,
            type: FlowNodeType.TRIGGER,
            data: {
                ...triggerData,
                valid,
            },
        }
        if (triggerNodeIndex >= 0) {
            clonedVersion.graph.nodes[triggerNodeIndex] = updatedNode
        }
        else {
            clonedVersion.graph.nodes.push(updatedNode)
        }
        return clonedVersion
    },
}
