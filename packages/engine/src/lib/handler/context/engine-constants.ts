import { ExecuteFlowOperation, ExecuteStepOperation, ExecutionType, ProjectId } from '@activepieces/shared'
import { VariableService } from '../../services/variable-service'

export class EngineConstants {
    public static readonly API_URL = 'http://127.0.0.1:3000/'
    public static readonly BASE_CODE_DIRECTORY = process.env.AP_BASE_CODE_DIRECTORY ?? './codes'
    public static readonly INPUT_FILE = './input.json'
    public static readonly OUTPUT_FILE = './output.json'
    public static readonly PIECE_SOURCES = process.env.AP_PIECES_SOURCE ?? 'dev'

    private constructor(
        public readonly flowId: string,
        public readonly flowRunId: string,
        public readonly serverUrl: string,
        public readonly apiUrl: string,
        public readonly executionType: ExecutionType,
        public readonly workerToken: string,
        public readonly projectId: ProjectId,
        public readonly variableService: VariableService,
        public readonly baseCodeDirectory: string,
        public readonly piecesSource: string,
        public readonly testSingleStepMode: boolean,
        public readonly filesServiceType: 'local' | 'db',
        public readonly resumePayload?: unknown,
    ) {}

    public static fromExecuteFlowInput(input: ExecuteFlowOperation): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowRunId,
            input.serverUrl,
            input.serverUrl,
            input.executionType,
            input.workerToken,
            input.projectId,
            new VariableService({
                projectId: input.projectId,
                workerToken: input.workerToken,
            }),
            EngineConstants.BASE_CODE_DIRECTORY,
            EngineConstants.PIECE_SOURCES,
            false,
            'local',
            input.executionType === ExecutionType.RESUME ? input.resumePayload : undefined,
        )
    }

    public static fromExecuteStepInput(input: ExecuteStepOperation): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            'test-run',
            input.serverUrl,
            input.serverUrl,
            ExecutionType.BEGIN,
            input.workerToken,
            input.projectId,
            new VariableService({
                projectId: input.projectId,
                workerToken: input.workerToken,
            }),
            EngineConstants.BASE_CODE_DIRECTORY,
            EngineConstants.PIECE_SOURCES,
            true,
            'db',
        )
    }
}
