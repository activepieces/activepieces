import { ContextVersion } from '@activepieces/pieces-framework'
import { DEFAULT_MCP_DATA, EngineGenericError, ExecuteFlowOperation, ExecutePropsOptions, ExecuteToolOperation, ExecuteTriggerOperation, ExecutionType, flowStructureUtil, FlowVersion, PlatformId, ProgressUpdateType, Project, ProjectId, ResumePayload, RunEnvironment, TriggerHookType } from '@activepieces/shared'
import { createPropsResolver, PropsResolver } from '../../variables/props-resolver'

type RetryConstants = {
    maxAttempts: number
    retryExponential: number
    retryInterval: number
}

type EngineConstantsParams = {
    flowVersion?: FlowVersion
    flowId?: string
    flowVersionId?: string
    triggerPieceName?: string
    flowRunId: string
    publicApiUrl: string
    internalApiUrl: string
    retryConstants: RetryConstants
    engineToken: string
    projectId: ProjectId
    progressUpdateType: ProgressUpdateType
    serverHandlerId: string | null
    httpRequestId: string | null
    resumePayload?: ResumePayload
    runEnvironment?: RunEnvironment
    stepNameToTest?: string
    logsUploadUrl?: string
    logsFileId?: string
    timeoutInSeconds: number
    platformId: PlatformId
    stepNames: string[]
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
    public static readonly DEV_PIECES = process.env.AP_DEV_PIECES?.split(',') ?? []
    public static readonly TEST_MODE = process.env.AP_TEST_MODE === 'true'

    public readonly platformId: string
    public readonly timeoutInSeconds: number
    public readonly flowRunId: string
    public readonly publicApiUrl: string
    public readonly internalApiUrl: string
    public readonly retryConstants: RetryConstants
    public readonly engineToken: string
    public readonly projectId: ProjectId
    public readonly progressUpdateType: ProgressUpdateType
    public readonly serverHandlerId: string | null
    public readonly httpRequestId: string | null
    public readonly resumePayload?: ResumePayload
    public readonly runEnvironment?: RunEnvironment
    public readonly stepNameToTest?: string
    public readonly logsUploadUrl?: string
    public readonly logsFileId?: string
    public readonly stepNames: string[] = []
    public readonly flowVersion?: FlowVersion
    private readonly _flowId: string
    private readonly _flowVersionId: string
    private readonly _triggerPieceName: string
    private project: Project | null = null

    public get flowId(): string {
        return this.flowVersion?.flowId ?? this._flowId
    }

    public get flowVersionId(): string {
        return this.flowVersion?.id ?? this._flowVersionId
    }

    public get triggerPieceName(): string {
        return this.flowVersion?.trigger?.settings?.pieceName ?? this._triggerPieceName
    }

    public get isRunningApTests(): boolean {
        return EngineConstants.TEST_MODE
    }

    public get isTestFlow(): boolean {
        return this.progressUpdateType === ProgressUpdateType.TEST_FLOW
    }

    public get baseCodeDirectory(): string {
        return EngineConstants.BASE_CODE_DIRECTORY
    }

    public get devPieces(): string[] {
        return EngineConstants.DEV_PIECES
    }

    public constructor(params: EngineConstantsParams) {
        if (!params.publicApiUrl.endsWith('/api/')) {
            throw new EngineGenericError('PublicUrlNotEndsWithSlashError', `Public URL must end with a slash, got: ${params.publicApiUrl}`)
        }
        if (!params.internalApiUrl.endsWith('/')) {
            throw new EngineGenericError('InternalApiUrlNotEndsWithSlashError', `Internal API URL must end with a slash, got: ${params.internalApiUrl}`)
        }

        this.flowVersion = params.flowVersion
        this._flowId = params.flowId ?? ''
        this._flowVersionId = params.flowVersionId ?? ''
        this._triggerPieceName = params.triggerPieceName ?? ''
        this.flowRunId = params.flowRunId
        this.publicApiUrl = params.publicApiUrl
        this.internalApiUrl = params.internalApiUrl
        this.retryConstants = params.retryConstants
        this.engineToken = params.engineToken
        this.projectId = params.projectId
        this.progressUpdateType = params.progressUpdateType
        this.serverHandlerId = params.serverHandlerId
        this.httpRequestId = params.httpRequestId
        this.resumePayload = params.resumePayload
        this.runEnvironment = params.runEnvironment
        this.stepNameToTest = params.stepNameToTest
        this.logsUploadUrl = params.logsUploadUrl
        this.logsFileId = params.logsFileId
        this.platformId = params.platformId
        this.timeoutInSeconds = params.timeoutInSeconds
        this.stepNames = params.stepNames
    }

    public static fromExecuteFlowInput(input: ExecuteFlowOperation): EngineConstants {
        return new EngineConstants({
            flowVersion: input.flowVersion,
            flowRunId: input.flowRunId,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: input.internalApiUrl,
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            progressUpdateType: input.progressUpdateType,
            serverHandlerId: input.serverHandlerId ?? null,
            httpRequestId: input.httpRequestId ?? null,
            resumePayload: input.executionType === ExecutionType.RESUME ? input.resumePayload : undefined,
            runEnvironment: input.runEnvironment,
            stepNameToTest: input.stepNameToTest ?? undefined,
            logsUploadUrl: input.logsUploadUrl,
            logsFileId: input.logsFileId,
            timeoutInSeconds: input.timeoutInSeconds,
            platformId: input.platformId,
            stepNames: flowStructureUtil.getAllSteps(input.flowVersion).map((step) => step.name),
        })
    }

    public static fromExecuteActionInput(input: ExecuteToolOperation): EngineConstants {
        return new EngineConstants({
            flowId: DEFAULT_MCP_DATA.flowId,
            flowVersionId: DEFAULT_MCP_DATA.flowVersionId,
            triggerPieceName: DEFAULT_MCP_DATA.triggerPieceName,
            flowRunId: DEFAULT_MCP_DATA.flowRunId,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            progressUpdateType: ProgressUpdateType.NONE,
            serverHandlerId: null,
            httpRequestId: null,
            resumePayload: undefined,
            runEnvironment: undefined,
            stepNameToTest: undefined,
            timeoutInSeconds: input.timeoutInSeconds,
            platformId: input.platformId,
            stepNames: [],
        })
    }

    public static fromExecutePropertyInput(input: Omit<ExecutePropsOptions, 'piece'> & { pieceName: string, pieceVersion: string }): EngineConstants {
        return new EngineConstants({
            flowVersion: input.flowVersion,
            flowId: DEFAULT_MCP_DATA.flowId,
            flowVersionId: DEFAULT_MCP_DATA.flowVersionId,
            triggerPieceName: DEFAULT_MCP_DATA.triggerPieceName,
            flowRunId: DEFAULT_EXECUTE_PROPERTY,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            progressUpdateType: ProgressUpdateType.NONE,
            serverHandlerId: null,
            httpRequestId: null,
            resumePayload: undefined,
            runEnvironment: undefined,
            stepNameToTest: undefined,
            timeoutInSeconds: input.timeoutInSeconds,
            platformId: input.platformId,
            stepNames: input.flowVersion ? flowStructureUtil.getAllSteps(input.flowVersion).map((step) => step.name) : [],
        })
    }

    public static fromExecuteTriggerInput(input: ExecuteTriggerOperation<TriggerHookType>): EngineConstants {
        return new EngineConstants({
            flowVersion: input.flowVersion,
            flowRunId: DEFAULT_TRIGGER_EXECUTION,
            publicApiUrl: input.publicApiUrl,
            internalApiUrl: addTrailingSlashIfMissing(input.internalApiUrl),
            retryConstants: DEFAULT_RETRY_CONSTANTS,
            engineToken: input.engineToken,
            projectId: input.projectId,
            progressUpdateType: ProgressUpdateType.NONE,
            serverHandlerId: null,
            httpRequestId: null,
            resumePayload: undefined,
            runEnvironment: undefined,
            stepNameToTest: undefined,
            timeoutInSeconds: input.timeoutInSeconds,
            platformId: input.platformId,
            stepNames: flowStructureUtil.getAllSteps(input.flowVersion).map((step) => step.name),
        })
    }
    public getPropsResolver(contextVersion: ContextVersion | undefined): PropsResolver {
        return createPropsResolver({
            projectId: this.projectId,
            engineToken: this.engineToken,
            apiUrl: this.internalApiUrl,
            contextVersion,
            stepNames: this.stepNames,
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
