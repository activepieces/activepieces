import { StepOutput, isNil, isObject } from '@activepieces/shared'
import PriorityQueue from 'priority-queue-typescript'
import sizeof from 'object-sizeof'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SIZE_FOR_ALL_ENTRIES = 1024 * 1024
const SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER = sizeof(TRUNCATION_TEXT_PLACEHOLDER)

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const totalJsonSize = sizeof(steps)
        if (!jsonExceedMaxSize(totalJsonSize)) {
            return steps
        }
        return removeLeavesInTopologicalOrder(JSON.parse(JSON.stringify(steps)))
    },
}

function removeLeavesInTopologicalOrder(json: Record<string, unknown>): Record<string, StepOutput> {
    const nodes: Node[] = traverseJsonAndConvertToNodes(json)
    const leaves = new PriorityQueue<Node>(
        undefined,
        (a: Node, b: Node) => b.size - a.size,
    )
    nodes.filter((node) => node.numberOfChildren === 0).forEach((node) => leaves.add(node))
    let totalJsonSize = sizeof(json)

    while (!leaves.empty() && jsonExceedMaxSize(totalJsonSize)) {
        const curNode = leaves.poll()
        if (curNode) {
            totalJsonSize += SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - curNode.size
            nodes[curNode.dfsOrder.index].truncate = true
            const parentIndex = curNode.dfsOrder.parentIndex
            if (!isNil(parentIndex)) {
                nodes[parentIndex].numberOfChildren--
                if (nodes[parentIndex].numberOfChildren == 0) {
                    leaves.add(nodes[parentIndex])
                }
            }
        }
    }
    return truncateTrimmedNodes(json, nodes) as Record<string, StepOutput>
}

function truncateTrimmedNodes(curNode: unknown, nodes: Node[], currentDfsOrder: { index: number } = { index: -1 }) {
    currentDfsOrder.index++
    const truncated = nodes[currentDfsOrder.index].truncate
    let newValue
    if (isObject(curNode)) {
        newValue = {}
        Object.keys(curNode).forEach((key) => {
            curNode[key] = truncateTrimmedNodes(curNode[key], nodes, currentDfsOrder)
        })
        newValue = curNode
    }
    else if (Array.isArray(curNode)) {
        newValue = []
        curNode.forEach((value, _index) => {
            newValue.push(truncateTrimmedNodes(value, nodes, currentDfsOrder))
        })
    }
    else {
        newValue = curNode
    }
    if (truncated) {
        return TRUNCATION_TEXT_PLACEHOLDER
    }
    return newValue
}

function traverseJsonAndConvertToNodes(curNode: unknown, parentIndex: number | null = null, currentDfsOrder: { index: number } = { index: -1 }) {
    currentDfsOrder.index++
    const children = findChildren(curNode)
    const nodes = [{
        size: sizeof(curNode),
        dfsOrder: {
            index: currentDfsOrder.index,
            parentIndex,
        },
        numberOfChildren: children.length,
        truncate: false,
    }]
    const newParentIndex = currentDfsOrder.index
    children.forEach((childValue) => {
        nodes[0].size += SIZE_OF_TRUNCATION_TEXT_PLACEHOLDER - sizeof(childValue)
        nodes.push(...traverseJsonAndConvertToNodes(childValue, newParentIndex, currentDfsOrder))
    })
    return nodes
}

function findChildren(curNode: unknown): unknown[] {
    if (isObject(curNode)) {
        return Object.values(curNode)
    }
    if (Array.isArray(curNode)) {
        return curNode
    }
    return []
}

const jsonExceedMaxSize = (jsonSize: number): boolean => {
    return jsonSize > MAX_SIZE_FOR_ALL_ENTRIES
}

type Node = {
    size: number
    dfsOrder: {
        index: number
        parentIndex: number | null
    }
    numberOfChildren: number
    truncate: boolean
}