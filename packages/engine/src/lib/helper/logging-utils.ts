import { StepOutput } from '@activepieces/shared'
import PriorityQueue from 'priority-queue-typescript'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY = 1024 * 1024

type Node = {
    size: number,
    index: number,
    parentNodeId: number,
    numberOfChildren: number,
    truncate: boolean
}

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const clonedSteps = { ...steps }
        const jsonSteps = trimJson(JSON.parse(JSON.stringify(clonedSteps)))
        const recordSteps: Record<string, StepOutput> = jsonSteps
        return recordSteps
    },
}

function trimJson(json: any) {
    const nodes: Node[] = []
    const leaves = new PriorityQueue<Node>(
        undefined,
        (a: Node, b: Node) => b.size - a.size
    )

    let totalJsonSize = JSON.stringify(json).length

    nodes.push({
        size: JSON.stringify(json).length,
        index: 0,
        parentNodeId: -1,
        numberOfChildren: Object.entries(json).length,
        truncate: false
    })

    jsonToNodes(json, 0, nodes, leaves)

    while (leaves.size() > 0 && totalJsonSize > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY) {
        const curNode = leaves.poll()
        if (!curNode) continue;
        const idx = curNode.index
        console.log(curNode.size)
        totalJsonSize += -curNode.size + TRUNCATION_TEXT_PLACEHOLDER.length

        nodes[idx].truncate = true

        if (curNode.parentNodeId >= 0) {
            nodes[curNode.parentNodeId].numberOfChildren--
            if (nodes[curNode.parentNodeId].numberOfChildren == 0) {
                leaves.add(nodes[curNode.parentNodeId])
            }
        }

    }

    convertToJson(json, nodes)
    return json
}

function jsonToNodes(curNode: unknown, curNodeId: number, nodes: Node[], leaves: PriorityQueue<Node>) {
    if (isObject(curNode)) {
        Object.entries(curNode).forEach(([childKey, childValue]) => {
            nodes.push({
                size: JSON.stringify(childValue).length,
                index: nodes.length,
                parentNodeId: curNodeId,
                numberOfChildren: Object.entries(childValue).length,
                truncate: false
            })
            jsonToNodes(childValue, nodes.length - 1, nodes, leaves)
        });
    }
    else {
        leaves.add(nodes[nodes.length - 1])
    }
}

function convertToJson(curNode: any, nodes: Node[], nodeNum: { value: number } = { value: 0 }) {
    if (isObject(curNode)) {
        Object.entries(curNode).forEach(([childKey, childValue]) => {
            nodeNum.value++;
            let curNodeNum = nodeNum.value
            convertToJson(childValue, nodes, nodeNum)
            if (nodes[curNodeNum].truncate) {
                const curNodeObj = curNode as { [key: string]: any };
                curNodeObj[childKey] = TRUNCATION_TEXT_PLACEHOLDER
            }
        });
    }
}

const isObject = (value: any): value is object => {
    return value !== null && typeof value === 'object';
}