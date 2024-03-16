import { StepOutput } from '@activepieces/shared'
import PriorityQueue from 'priority-queue-typescript'
import sizeof from 'object-sizeof'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SIZE_FOR_ALL_ENTRIES = 1024 * 1024
const SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER = sizeof(TRUNCATION_TEXT_PLACEHOLDER)

type Node = {
    size: number,
    index: number,
    parentNodeIndex: number,
    numberOfChildren: number,
    truncate: boolean
}

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const clonedSteps = { ...steps }
        return trimJson(JSON.parse(JSON.stringify(clonedSteps)))
    },
}

function trimJson(json: Record<string, any>) {
    const nodes: Node[] = []
    const leaves = new PriorityQueue<Node>(
        undefined,
        (a: Node, b: Node) => b.size - a.size
    )

    let totalJsonSize = sizeof(json)

    nodes.push({
        size: sizeof(json),
        index: 0,
        parentNodeIndex: -1,
        numberOfChildren: Object.entries(json).length,
        truncate: false
    })

    jsonToNodes(json, nodes, leaves)

    while (!leaves.empty() && jsonExceedMaxSize(totalJsonSize)) {
        const curNode = leaves.poll()
        if (curNode){
            const curNodeIndex = curNode.index
        
            totalJsonSize += SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - curNode.size

            nodes[curNodeIndex].truncate = true

            if (curNode.parentNodeIndex >= 0) {
                nodes[curNode.parentNodeIndex].numberOfChildren--
                if (nodes[curNode.parentNodeIndex].numberOfChildren == 0) {
                    leaves.add(nodes[curNode.parentNodeIndex])
                }
            }
        }
    }

    convertToJson(json, nodes)
    
    return json
}

function jsonToNodes(curNode: Record<string, any>, nodes: Node[], leaves: PriorityQueue<Node>) {
    let curNodeId: number = nodes.length - 1
    if (isObject(curNode)) {
        Object.entries(curNode).forEach(([childKey, childValue]) => {
            nodes[curNodeId].size += SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - sizeof(childValue)

            nodes.push({
                size: sizeof(childValue),
                index: nodes.length,
                parentNodeIndex: curNodeId,
                numberOfChildren: Object.entries(childValue).length,
                truncate: false
            })

            jsonToNodes(childValue, nodes, leaves)
        });
    }
    else {
        leaves.add(nodes[curNodeId])
    }
}

function convertToJson(curNode: Record<string, any>, nodes: Node[], nodeIndex: { value: number } = { value: 0 }) {
    if (isObject(curNode)) {
        Object.entries(curNode).forEach(([childKey, childValue]) => {
            nodeIndex.value++;
            let curNodeIndex = nodeIndex.value

            convertToJson(childValue, nodes, nodeIndex)

            if (nodes[curNodeIndex].truncate) {
                curNode[childKey] = TRUNCATION_TEXT_PLACEHOLDER
            }
        });
    }
}

const isObject = (value: any): value is object => {
    return value !== null && typeof value === 'object';
}

const jsonExceedMaxSize = (jsonSize: number): boolean => {
    return jsonSize > MAX_SIZE_FOR_ALL_ENTRIES
}