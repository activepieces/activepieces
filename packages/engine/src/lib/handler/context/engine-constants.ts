import { ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteToolOperation, ExecuteTriggerOperation, ExecutionType, FlowVersionState, ProgressUpdateType, Project, ProjectId, ResumePayload, RunEnvironment, TriggerHookType } from '@activepieces/shared'
import { createPropsResolver, PropsResolver } from '../../variables/props-resolver'

type RetryConstants = {
    maxAttempts: number
    retryExponential: number
    retryInterval: number
}

const DEFAULT_RETRY_CONSTANTS: RetryConstants = {
    maxAttempts: 4,
    retryExponential: 2,
    retryInterval: 2000,
}

export class EngineConstants {
    public static readonly BASE_CODE_DIRECTORY = process.env.AP_BASE_CODE_DIRECTORY ?? './codes'
    public static readonly INPUT_FILE = './input.json'
    public static readonly OUTPUT_FILE = './output.json'
    public static readonly PIECE_SOURCES = process.env.AP_PIECES_SOURCE ?? 'FILE'
    public static readonly TEST_MODE = process.env.AP_TEST_MODE === 'true'


    private project: Project | null = null

    public get isRunningApTests(): boolean {
        return EngineConstants.TEST_MODE
    }

    public get baseCodeDirectory(): string {
        return EngineConstants.BASE_CODE_DIRECTORY
    }

    public get piecesSource(): string {
        return EngineConstants.PIECE_SOURCES
    }

    public constructor(
        public readonly flowId: string,
        public readonly flowVersionId: string,
        public readonly flowVersionState: FlowVersionState,
        public readonly flowRunId: string,
        public readonly publicApiUrl: string,
        public readonly internalApiUrl: string,
        public readonly retryConstants: RetryConstants,
        public readonly engineToken: string,
        public readonly projectId: ProjectId,
        public readonly propsResolver: PropsResolver,
        public readonly testSingleStepMode: boolean,
        public readonly progressUpdateType: ProgressUpdateType,
        public readonly serverHandlerId: string | null,
        public readonly httpRequestId: string | null,
        public readonly resumePayload?: ResumePayload,
        public readonly runEnvironment?: RunEnvironment,
    ) {
        if (!publicApiUrl.endsWith('/api/')) {
            throw new Error('Public URL must end with a slash, got: ' + publicApiUrl)
        }
        if (!internalApiUrl.endsWith('/')) {
            throw new Error('Internal API URL must end with a slash, got: ' + internalApiUrl)
        }
    }

    public static fromExecuteFlowInput(input: ExecuteFlowOperation): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            input.flowRunId,
            input.publicApiUrl,
            input.internalApiUrl,
            DEFAULT_RETRY_CONSTANTS,
            input.engineToken,
            input.projectId,
            createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: input.internalApiUrl,
            }),
            false,
            input.progressUpdateType,
            input.serverHandlerId ?? null,
            input.httpRequestId ?? null,
            input.executionType === ExecutionType.RESUME ? input.resumePayload : undefined,
            input.runEnvironment,
        )
    }

    public static fromExecuteActionInput(input: ExecuteToolOperation): EngineConstants {
        return new EngineConstants(
            'mcp-flow-id',
            'mcp-flow-version-id',
            FlowVersionState.LOCKED,
            'mcp-flow-run-id',
            input.publicApiUrl,
            addTrailingSlashIfMissing(input.internalApiUrl),
            DEFAULT_RETRY_CONSTANTS,
            input.engineToken,
            input.projectId,
            createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            true,
            ProgressUpdateType.NONE,
            null,
            null,
        )
    }
    public static fromExecuteStepInput(input: ExecuteStepOperation): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            'test-run',
            input.publicApiUrl,
            addTrailingSlashIfMissing(input.internalApiUrl),
            DEFAULT_RETRY_CONSTANTS,
            input.engineToken,
            input.projectId,
            createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            true,
            ProgressUpdateType.NONE,
            null,
            null,
            undefined,
            input.runEnvironment,
        )
    }

    public static fromExecutePropertyInput(input: ExecutePropsOptions): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            'execute-property',
            input.publicApiUrl,
            addTrailingSlashIfMissing(input.internalApiUrl),
            DEFAULT_RETRY_CONSTANTS,
            input.engineToken,
            input.projectId,
            createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            true,
            ProgressUpdateType.NONE,
            null,
            null,
        )
    }

    public static fromExecuteTriggerInput(input: ExecuteTriggerOperation<TriggerHookType>): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            'execute-trigger',
            input.publicApiUrl,
            addTrailingSlashIfMissing(input.internalApiUrl),
            DEFAULT_RETRY_CONSTANTS,
            input.engineToken,
            input.projectId,
            createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            true,
            ProgressUpdateType.NONE,
            null,
            null,
        )
    }

    private async getProject(): Promise<Project> {
        if (this.project) {
            return this.project
        }

        const getWorkerProjectEndpoint = `${this.internalApiUrl}v1/worker/project`

        const response = await fetch(getWorkerProjectEndpoint, {
            headers: {
                Authorization: `Bearer ${this.engineToken}`,
            },
        })

        this.project = await response.json() as Project
        return this.project
    }

    public externalProjectId = async (): Promise<string | undefined> => {
        const project = await this.getProject()
        return project.externalId
    }
}


const addTrailingSlashIfMissing = (url: string): string => {
    return url.endsWith('/') ? url : url + '/'
}