import { Action, ActionType, BranchAction, BranchCondition, CodeAction, ExecutionType, LoopOnItemsAction } from '@activepieces/shared'
import path from 'path'
import { cwd } from 'process'

export const EXECUTE_CONSTANTS = {
    flowId: 'flowId',
    flowRunId: 'flowRunId',
    serverUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000',
    projectId: 'projectId',
    workerToken: 'workerToken',
    baseCodeDirectory: path.resolve(cwd(), 'packages', 'engine', 'test', 'resources', 'codes'),
    executionType: ExecutionType.BEGIN,
}

export function buildSimpleLoopAction({
    name,
    loopItems,
    firstLoopAction,
}: {
    name: string
    loopItems: string
    firstLoopAction?: Action
}): LoopOnItemsAction {
    return {
        name,
        displayName: 'Loop',
        type: ActionType.LOOP_ON_ITEMS,
        settings: {
            items: loopItems,
        },
        firstLoopAction,
        valid: true,
    }
}



export function buildActionWithOneCondition(condition: BranchCondition): BranchAction {
    return {
        name: 'branch',
        displayName: 'Your Branch Name',
        type: ActionType.BRANCH,
        settings: {
            inputUiInfo: {},
            conditions: [
                [condition],
            ],
        },
        valid: true,
    }
}


export function buildCodeAction({ name, input, nextAction }: { name: 'echo_step' | 'runtime' | 'echo_step_1', input: Record<string, unknown>, nextAction?: Action }): CodeAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: ActionType.CODE,
        settings: {
            input,
            sourceCode: {
                packageJson: '',
                code: '',
            },
        },
        nextAction,
        valid: true,
    }
}
