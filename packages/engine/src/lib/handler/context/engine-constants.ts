import { ExecuteFlowOperation, ExecutePropsOptions, ExecuteStepOperation, ExecuteTriggerOperation, ExecutionType, FlowVersionState, ProgressUpdateType, Project, ProjectId, ResumePayload, TriggerHookType } from '@activepieces/shared'
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
        public readonly publicUrl: string,
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
    ) { }

    public static fromExecuteFlowInput(input: ExecuteFlowOperation): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            input.flowRunId,
            input.publicUrl,
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
        )
    }

    public static fromExecuteStepInput(input: ExecuteStepOperation): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            'test-run',
            input.publicUrl,
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

    public static fromExecutePropertyInput(input: ExecutePropsOptions): EngineConstants {
        return new EngineConstants(
            input.flowVersion.flowId,
            input.flowVersion.id,
            input.flowVersion.state,
            'execute-property',
            input.publicUrl,
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
            input.publicUrl,
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