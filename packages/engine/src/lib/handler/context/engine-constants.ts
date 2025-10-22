import { DEFAULT_MCP_DATA, ExecuteFlowOperation, ExecutePropsOptions, ExecuteToolOperation, ExecuteTriggerOperation, ExecutionType, FlowVersionState, ProgressUpdateType, Project, ProjectId, ResumePayload, RunEnvironment, TriggerHookType } from '@activepieces/shared'
import { createPropsResolver, PropsResolver } from '../../variables/props-resolver'

type RetryConstants = {
    maxAttempts: number
    retryExponential: number
    retryInterval: number
}

type EngineConstantsParams = {
    flowId: string
    flowVersionId: string
    flowVersionState: FlowVersionState
    triggerPieceName: string
    flowRunId: string
    publicApiUrl: string
    internalApiUrl: string
    retryConstants: RetryConstants
    engineToken: string
    projectId: ProjectId
    propsResolver: PropsResolver
    progressUpdateType: ProgressUpdateType
    serverHandlerId: string | null
    httpRequestId: string | null
    resumePayload?: ResumePayload
    runEnvironment?: RunEnvironment
    stepNameToTest?: string
    logsUploadUrl?: string
    logsFileId?: string
}

const DEFAULT_RETRY_CONSTANTS: RetryConstants = {
    maxAttempts: 4,
    retryExponential: 2,
    retryInterval: 2000,
}

const DEFAULT_TRIGGER_EXECUTION = 'execute-trigger'
const DEFAULT_EXECUTE_PROPERTY = 'execute-property'

export class EngineConstants {
    public static readonly BASE_CODE_DIRECTORY = process.env.AP_BASE_CODE_DIRECTORY ?? './codes'
    public static readonly INPUT_FILE = './input.json'
    public static readonly OUTPUT_FILE = './output.json'
    public static readonly PIECE_SOURCES = process.env.AP_PIECES_SOURCE ?? 'FILE'
    public static readonly TEST_MODE = process.env.AP_TEST_MODE === 'true'

    public readonly flowId: string
    public readonly flowVersionId: string
    public readonly flowVersionState: FlowVersionState
    public readonly triggerPieceName: string
    public readonly flowRunId: string
    public readonly publicApiUrl: string
    public readonly internalApiUrl: string
    public readonly retryConstants: RetryConstants
    public readonly engineToken: string
    public readonly projectId: ProjectId
    public readonly propsResolver: PropsResolver
    public readonly progressUpdateType: ProgressUpdateType
    public readonly serverHandlerId: string | null
    public readonly httpRequestId: string | null
    public readonly resumePayload?: ResumePayload
    public readonly runEnvironment?: RunEnvironment
    public readonly stepNameToTest?: string
    public readonly logsUploadUrl?: string
    public readonly logsFileId?: string

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

    public constructor(params: EngineConstantsParams) {
        if (!params.publicApiUrl.endsWith('/api/')) {
            throw new Error('Public URL must end with a slash, got: ' + params.publicApiUrl)
        }
        if (!params.internalApiUrl.endsWith('/')) {
            throw new Error('Internal API URL must end with a slash, got: ' + params.internalApiUrl)
        }

        this.flowId = params.flowId
        this.flowVersionId = params.flowVersionId
        this.flowVersionState = params.flowVersionState
        this.flowRunId = params.flowRunId
        this.publicApiUrl = params.publicApiUrl
        this.internalApiUrl = params.internalApiUrl
        this.retryConstants = params.retryConstants
        this.triggerPieceName = params.triggerPieceName
        this.engineToken = params.engineToken
        this.projectId = params.projectId
        this.propsResolver = params.propsResolver
        this.progressUpdateType = params.progressUpdateType
        this.serverHandlerId = params.serverHandlerId
        this.httpRequestId = params.httpRequestId
        this.resumePayload = params.resumePayload
        this.runEnvironment = params.runEnvironment
        this.stepNameToTest = params.stepNameToTest
        this.logsUploadUrl = params.logsUploadUrl
        this.logsFileId = params.logsFileId
    }

    public static fromExecuteFlowInput(input: ExecuteFlowOperation): EngineConstants {
        return new EngineConstants({
            flowId: input.flowVersion.flowId,
            flowVersionId: input.flowVersion.id,
            flowVersionState: input.flowVersion.state,
            triggerPieceName: input.flowVersion.trigger.settings.pieceName,
            flowRunId: input.flowRunId,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: input.internalApiUrl,
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            propsResolver: createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: input.internalApiUrl,
            }),
            progressUpdateType: input.progressUpdateType,
            serverHandlerId: input.serverHandlerId ?? null,
            httpRequestId: input.httpRequestId ?? null,
            resumePayload: input.executionType === ExecutionType.RESUME ? input.resumePayload : undefined,
            runEnvironment: input.runEnvironment,
            stepNameToTest: input.stepNameToTest ?? undefined,
            logsUploadUrl: input.logsUploadUrl,
            logsFileId: input.logsFileId,
        })
    }

    public static fromExecuteActionInput(input: ExecuteToolOperation): EngineConstants {
        return new EngineConstants({
            flowId: DEFAULT_MCP_DATA.flowId,
            flowVersionId: DEFAULT_MCP_DATA.flowVersionId,
            flowVersionState: DEFAULT_MCP_DATA.flowVersionState,
            triggerPieceName: DEFAULT_MCP_DATA.triggerPieceName,
            flowRunId: DEFAULT_MCP_DATA.flowRunId,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            propsResolver: createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            progressUpdateType: ProgressUpdateType.NONE,
            serverHandlerId: null,
            httpRequestId: null,
            resumePayload: undefined,
            runEnvironment: undefined,
            stepNameToTest: undefined,
        })
    }

    public static fromExecutePropertyInput(input: ExecutePropsOptions): EngineConstants {
        return new EngineConstants({
            flowId: input.flowVersion?.flowId ?? DEFAULT_MCP_DATA.flowId,
            flowVersionId: input.flowVersion?.id ?? DEFAULT_MCP_DATA.flowVersionId,
            flowVersionState: input.flowVersion?.state ?? DEFAULT_MCP_DATA.flowVersionState,
            triggerPieceName: input.flowVersion?.trigger?.settings.pieceName ?? DEFAULT_MCP_DATA.triggerPieceName,
            flowRunId: DEFAULT_EXECUTE_PROPERTY,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            propsResolver: createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            progressUpdateType: ProgressUpdateType.NONE,
            serverHandlerId: null,
            httpRequestId: null,
            resumePayload: undefined,
            runEnvironment: undefined,
            stepNameToTest: undefined,
        })
    }

    public static fromExecuteTriggerInput(input: ExecuteTriggerOperation<TriggerHookType>): EngineConstants {
        return new EngineConstants({
            flowId: input.flowVersion.flowId,
            flowVersionId: input.flowVersion.id,
            flowVersionState: input.flowVersion.state,
            triggerPieceName: input.flowVersion.trigger.settings.pieceName,
            flowRunId: DEFAULT_TRIGGER_EXECUTION,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            propsResolver: createPropsResolver({
                projectId: input.projectId,
                engineToken: input.engineToken,
                apiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            }),
            progressUpdateType: ProgressUpdateType.NONE,
            serverHandlerId: null,
            httpRequestId: null,
            resumePayload: undefined,
            runEnvironment: undefined,
            stepNameToTest: undefined,
        })
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