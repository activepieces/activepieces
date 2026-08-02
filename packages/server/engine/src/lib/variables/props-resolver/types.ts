import { ContextVersion } from '@activepieces/pieces-framework'
import { ScriptSession } from '../../core/code/code-sandbox-common'
import { StepView } from '../../handler/context/flow-execution-context'

export type GetStepView = (stepName: string) => Promise<StepView | undefined>

export type SharedScriptSession = {
    get(): Promise<ScriptSession>
    dispose(): Promise<void>
}

export type ResolveSingleTokenParams = {
    variableName: string
    getStepView: GetStepView
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    contextVersion: ContextVersion | undefined
    scriptSession: SharedScriptSession
}
