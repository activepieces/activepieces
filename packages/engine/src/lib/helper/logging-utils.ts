import { StepOutput } from '@activepieces/shared'
import sizeof from 'object-sizeof'

const TRUNCATION_TEXT_PLACEHOLDER = '(truncated)'
const MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY = 1024 * 1024

export const loggingUtils = {
    async trimExecution(steps: Record<string, StepOutput>): Promise<Record<string, StepOutput>> {
        const clonedSteps = { ...steps }
        const jsonSteps = trimJson(JSON.parse(JSON.stringify(clonedSteps)))
        const recordSteps: Record<string, StepOutput> = jsonSteps
        return recordSteps
    },
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
    let totalJsonSize = sizeof(json)
    
    function jsonToNodes(curNode: unknown, curNodeId: number) {
        if(curNode !== null && typeof curNode == "object" ) {
            Object.entries(curNode).forEach(([childKey, childValue]) => {
                nodes.push({
                    size: sizeof(childValue),
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
        size: sizeof(json),
        index: 0,
        parentNodeId : -1,
        numberOfChildren: Object.entries(json).length,
        truncate: false 
    })
    
    jsonToNodes(json, 0)
    
    leaves.sort((a, b) => a.size - b.size)
    
    while(leaves.length > 0 && totalJsonSize > MAX_SINGLE_SIZE_FOR_SINGLE_ENTRY){
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

    convertToJson(json)
    return json
}