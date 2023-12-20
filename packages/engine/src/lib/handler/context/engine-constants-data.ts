
import { ExecutionType, ProjectId } from '@activepieces/shared'
import { VariableService } from '../../services/variable-service'

export type EngineConstantData = {
    flowRunId: string
    serverUrl: string
    apiUrl: string
    executionType: ExecutionType
    workerToken: string
    projectId: ProjectId
    flowId: string
    variableService: VariableService
    resumePayload?: unknown
    baseCodeDirectory: string
    piecesSource: string
    testSingleStepMode: boolean
}
