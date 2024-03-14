import { ActionType, StepOutput, TriggerType, applyFunctionToValues } from '@activepieces/shared'
import sizeof from 'object-sizeof'
import { isMemoryFilePath } from '../services/files.service'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY = 1024 * 1024

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const clonedSteps = { ...steps }
        for (const stepName in steps) {
            const stepOutput = steps[stepName]
            clonedSteps[stepName] = await trimStepOutput(stepOutput, 'trim')
        }
        // The above code could trim data in different steps, but their total size could still be too large.
        return emptyStepsUntilSizeLimit(clonedSteps)
    },
}

async function trimStepOutput(stepOutput: StepOutput, mode: 'trim' | 'empty'): Promise<StepOutput> {
    const modified: StepOutput = JSON.parse(JSON.stringify(stepOutput))
    modified.input = await trimOrEmpty(mode, modified.input)
    switch (modified.type) {
        case ActionType.CODE:
        case ActionType.PIECE:
        case ActionType.BRANCH:
        case TriggerType.EMPTY:
        case TriggerType.PIECE:
        case ActionType.CODE:
        case ActionType.PIECE:
            modified.output = await trimOrEmpty(mode, modified.output)
            break
        case ActionType.LOOP_ON_ITEMS: {
            const loopItem = modified.output
            if (loopItem) {
                loopItem.iterations = await Promise.all(loopItem.iterations.map((iteration) => loggingUtils.trimExecution(iteration)))
                loopItem.iterations = await trimIterations(loopItem.iterations, mode)
                loopItem.item = await applyFunctionToValues(loopItem.item, trim)
            }
            break
        }
    }
    modified.errorMessage = await trimOrEmpty(mode, modified.errorMessage)
    return modified
}

async function trimOrEmpty(mode: 'trim' | 'empty', output: unknown): Promise<unknown> {
    switch (mode) {
        case 'trim':
            return applyFunctionToValues(output, trim)
        case 'empty':
            return TRUNCATION_TEXT_PLACEHOLDER
    }
}

async function trimIterations(iterations: Record<string, StepOutput>[], mode: 'trim' | 'empty'): Promise<Record<string, StepOutput>[]> {
    const newIterations = []
    for (const iteration of iterations) {
        let trimmedIteration: Record<string, StepOutput> = {}
        switch (mode) {
            case 'empty':
                for (const key in iteration) {
                    trimmedIteration[key] = await trimStepOutput(iteration[key], mode)
                }
                break
            case 'trim':
                trimmedIteration = await loggingUtils.trimExecution(iteration)
                break
        }
        newIterations.push(trimmedIteration)
    }
    return newIterations
}


async function emptyStepsUntilSizeLimit(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
    const clonedSteps = { ...steps }
    const entries = Object.entries(steps).sort(bySizeDesc)
    let i = 0
    while (i < entries.length && sizeof(clonedSteps) > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY) {
        const [stepName, stepOutput] = entries[i]
        clonedSteps[stepName] = await trimStepOutput(stepOutput, 'empty')
        i += 1
    }
    return clonedSteps
}

const trim = async (obj: unknown): Promise<unknown> => {
    if (isMemoryFilePath(obj)) {
        return TRUNCATION_TEXT_PLACEHOLDER
    }

    if (objectExceedMaxSize(obj) && isObject(obj)) {
        const objectEntries = Object.entries(obj).sort(bySizeDesc)
        let i = 0

        while (i < objectEntries.length && objectEntriesExceedMaxSize(objectEntries)) {
            const key = objectEntries[i][0]
            obj[key] = TRUNCATION_TEXT_PLACEHOLDER
            i += 1
        }
    }

    if (!objectExceedMaxSize(obj)) {
        return obj
    }

    return TRUNCATION_TEXT_PLACEHOLDER
}

const objectEntriesExceedMaxSize = (objectEntries: [string, unknown][]): boolean => {
    const obj = Object.fromEntries(objectEntries)
    return objectExceedMaxSize(obj)
}

const objectExceedMaxSize = (obj: unknown): boolean => {
    return sizeof(obj) > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY
}

const isObject = (obj: unknown): obj is Record<string, unknown> => {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

const bySizeDesc = (a: [string, unknown], b: [string, unknown]): number => {
    return sizeof(b[1]) - sizeof(a[1])
}

function trimJson(json: any){
    type Node = {
        size: number,
        index: number,
        parentNodeId: number,
        numberOfChildren: number,
        truncate: boolean
    }
    
    const nodes: Node[] = []
    const leaves: Node[] = []
    const MAX_SIZE = 200
    const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
    let totalJsonSize = JSON.stringify(json).length
    
    function jsonToNodes(curNode: unknown, curNodeId: number) {
        if(curNode !== null && typeof curNode == "object" ) {
            Object.entries(curNode).forEach(([childKey, childValue]) => {
                nodes.push({
                    size: JSON.stringify(childValue).length,
                    index: nodes.length,
                    parentNodeId: curNodeId,
                    numberOfChildren: Object.entries(childValue).length,
                    truncate: false
                })
                jsonToNodes(childValue, nodes.length - 1)
            });
        }
        else {
            leaves.push(nodes[nodes.length - 1])
        }
    }
    
    nodes.push({
        size: JSON.stringify(json).length,
        index: 0,
        parentNodeId : -1,
        numberOfChildren: Object.entries(json).length,
        truncate: false 
    })
    
    jsonToNodes(json, 0)
    
    leaves.sort((a, b) => a.size - b.size)
    
    while(leaves.length > 0 && totalJsonSize > MAX_SIZE){
        const curNode = leaves.pop()
        if(!curNode)continue;
        const idx = curNode.index
        
        totalJsonSize += -curNode.size + TRUNCATION_TEXT_PLACEHOLDER.length
        
        nodes[idx].truncate = true
        
        if(curNode.parentNodeId >= 0){
            nodes[curNode.parentNodeId].numberOfChildren--
            if(nodes[curNode.parentNodeId].numberOfChildren == 0){
                leaves.push(nodes[curNode.parentNodeId])
            }
        }
        
        leaves.sort((a, b) => a.size - b.size)
    }
    
    let cnt = 0
    
    function convertToJson (curNode: any) {
        if(curNode !== null && typeof curNode == "object" ) {
            Object.entries(curNode).forEach(([childKey, childValue]) => {
                cnt++;
                let curCnt = cnt
                convertToJson(childValue)
                if(nodes[curCnt].truncate){
                    curNode[childKey] = TRUNCATION_TEXT_PLACEHOLDER
                }
            });
        }
    }
}