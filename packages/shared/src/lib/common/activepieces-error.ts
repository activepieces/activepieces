import { FileId } from '../file'
import { FlowRunId } from '../flow-run/flow-run'
import { FlowId } from '../flows/flow'
import { FlowVersionId } from '../flows/flow-version'
import { PlatformUsageMetric } from '../platform'
import { ProjectId } from '../project'
import { ProjectRole } from '../project-role/project-role'
import { UserId } from '../user'
import { ApId } from './id-generator'
import { Permission } from './security'

export class ActivepiecesError extends Error {
    constructor(public error: ApErrorParams, message?: string) {
        super(error.code + (message ? `: ${message}` : ''))
    }

    override toString(): string {
        return JSON.stringify({
            code: this.error.code,
            message: this.message,
            params: this.error.params,
        })
    }
}

export type ApErrorParams =
    | AuthenticationParams
    | AuthorizationErrorParams
    | ConfigNotFoundErrorParams
    | EmailIsNotVerifiedErrorParams
    | EngineOperationFailureParams
    | EntityNotFoundErrorParams
    | ExecutionTimeoutErrorParams
    | ExistingUserErrorParams
    | FileNotFoundErrorParams
    | FlowFormNotFoundError
    | FlowNotFoundErrorParams
    | FlowIsLockedErrorParams
    | FlowOperationErrorParams
    | FlowRunNotFoundErrorParams
    | InvalidApiKeyParams
    | InvalidAppConnectionParams
    | InvalidBearerTokenParams
    | InvalidClaimParams
    | InvalidCloudClaimParams
    | InvalidCredentialsErrorParams
    | InvalidJwtTokenErrorParams
    | InvalidOtpParams
    | InvalidSAMLResponseParams
    | InvitationOnlySignUpParams
    | JobRemovalFailureErrorParams
    | OpenAiFailedErrorParams
    | PauseMetadataMissingErrorParams
    | PermissionDeniedErrorParams
    | PieceNotFoundErrorParams
    | PieceTriggerNotFoundErrorParams
    | QuotaExceededParams
    | ResourceLockedParams
    | FeatureDisabledErrorParams
    | SignUpDisabledParams
    | StepNotFoundErrorParams
    | SystemInvalidErrorParams
    | SystemPropNotDefinedErrorParams
    | TestTriggerFailedErrorParams
    | TriggerUpdateStatusErrorParams
    | TriggerFailedErrorParams
    | ValidationErrorParams
    | InvitationOnlySignUpParams
    | UserIsInActiveErrorParams
    | DomainIsNotAllowedErrorParams
    | EmailAuthIsDisabledParams
    | ExistingAlertChannelErrorParams
    | EmailAlreadyHasActivationKey
    | ProviderProxyConfigNotFoundParams
    | AIProviderModelNotSupportedParams
    | AIRequestNotSupportedParams
    | AICreditLimitExceededParams
    | SessionExpiredParams
    | InvalidLicenseKeyParams
    | NoChatResponseParams
    | InvalidSmtpCredentialsErrorParams
    | InvalidGitCredentialsParams
    | InvalidReleaseTypeParams
    | CopilotFailedErrorParams
    | ProjectExternalIdAlreadyExistsParams
    | MemoryIssueParams
    | InvalidCustomDomainErrorParams
    | McpPieceRequiresConnectionParams
    | McpPieceConnectionMismatchParams
    | ErrorUpdatingSubscriptionParams
    | TriggerExecutionFailedParams
    | SubflowFailedParams
    | MachineNotAvailableParams
    | MachineNotConnectedParams
export type TriggerExecutionFailedParams = BaseErrorParams<ErrorCode.TRIGGER_EXECUTION_FAILED, {
    flowId: FlowId
    message?: string
    pieceName: string
    pieceVersion: string
}>

export type BaseErrorParams<T, V> = {
    code: T
    params: V
}

export type MemoryIssueParams = BaseErrorParams<ErrorCode.MEMORY_ISSUE, {
    message?: string
}>

export type InvitationOnlySignUpParams = BaseErrorParams<
ErrorCode.INVITATION_ONLY_SIGN_UP,
{
    message?: string
}
>

export type InvalidClaimParams = BaseErrorParams<ErrorCode.INVALID_CLAIM, { redirectUrl: string, tokenUrl: string, clientId: string, message: string }>
export type InvalidCloudClaimParams = BaseErrorParams<ErrorCode.INVALID_CLOUD_CLAIM, { pieceName: string }>

export type InvalidBearerTokenParams = BaseErrorParams<ErrorCode.INVALID_BEARER_TOKEN, {
    message?: string
}>

export type SessionExpiredParams = BaseErrorParams<ErrorCode.SESSION_EXPIRED, {
    message?: string
}>

export type NoChatResponseParams = BaseErrorParams<ErrorCode.NO_CHAT_RESPONSE, Record<string, never>>

export type FileNotFoundErrorParams = BaseErrorParams<ErrorCode.FILE_NOT_FOUND, { id: FileId }>

export type EmailAuthIsDisabledParams = BaseErrorParams<ErrorCode.EMAIL_AUTH_DISABLED, Record<string, never>>

export type AuthorizationErrorParams = BaseErrorParams<
ErrorCode.AUTHORIZATION,
Record<string, string> &
{
    message?: string
}
>

export type AICreditLimitExceededParams = BaseErrorParams<ErrorCode.AI_CREDIT_LIMIT_EXCEEDED, {
    usage: number
    limit: number
}> 

export type PermissionDeniedErrorParams = BaseErrorParams<
ErrorCode.PERMISSION_DENIED,
{
    userId: UserId
    projectId: ProjectId
    projectRole: ProjectRole | null
    permission: Permission | undefined
}
>

export type SystemInvalidErrorParams = BaseErrorParams<
ErrorCode.SYSTEM_PROP_INVALID,
{
    prop: string
}
>

export type FlowNotFoundErrorParams = BaseErrorParams<
ErrorCode.FLOW_NOT_FOUND,
{
    id: FlowId
}
>

export type FlowRunNotFoundErrorParams = BaseErrorParams<
ErrorCode.FLOW_RUN_NOT_FOUND,
{
    id: FlowRunId
}
>

export type InvalidCredentialsErrorParams = BaseErrorParams<
ErrorCode.INVALID_CREDENTIALS,
null
>

export type DomainIsNotAllowedErrorParams = BaseErrorParams<
ErrorCode.DOMAIN_NOT_ALLOWED,
{
    domain: string
}
>

export type EmailIsNotVerifiedErrorParams = BaseErrorParams<
ErrorCode.EMAIL_IS_NOT_VERIFIED,
{
    email: string
}
>

export type UserIsInActiveErrorParams = BaseErrorParams<
ErrorCode.USER_IS_INACTIVE,
{
    email: string
}
>

export type ExistingUserErrorParams = BaseErrorParams<
ErrorCode.EXISTING_USER,
{
    email: string
    platformId: string | null
}
>

export type StepNotFoundErrorParams = BaseErrorParams<
ErrorCode.STEP_NOT_FOUND,
{
    pieceName?: string
    pieceVersion?: string
    stepName: string
}
>

export type PieceNotFoundErrorParams = BaseErrorParams<
ErrorCode.PIECE_NOT_FOUND,
{
    pieceName: string
    pieceVersion: string | undefined
    message: string
}
>

export type PieceTriggerNotFoundErrorParams = BaseErrorParams<
ErrorCode.PIECE_TRIGGER_NOT_FOUND,
{
    pieceName: string
    pieceVersion: string
    triggerName: string | undefined
}
>

export type TriggerFailedErrorParams = BaseErrorParams<
ErrorCode.TRIGGER_FAILED,
{
    pieceName: string
    pieceVersion: string
    triggerName: string
    error: string | undefined
}
>


export type ConfigNotFoundErrorParams = BaseErrorParams<
ErrorCode.CONFIG_NOT_FOUND,
{
    pieceName: string
    pieceVersion: string
    stepName: string
    configName: string
}
>

export type JobRemovalFailureErrorParams = BaseErrorParams<
ErrorCode.JOB_REMOVAL_FAILURE,
{
    flowVersionId: ApId
}
>

export type SystemPropNotDefinedErrorParams = BaseErrorParams<
ErrorCode.SYSTEM_PROP_NOT_DEFINED,
{
    prop: string
}
>

export type OpenAiFailedErrorParams = BaseErrorParams<
ErrorCode.OPEN_AI_FAILED,
Record<string, never>
>

export type FlowOperationErrorParams = BaseErrorParams<
ErrorCode.FLOW_OPERATION_INVALID,
{
    message: string
}
>

export type FlowFormNotFoundError = BaseErrorParams<
ErrorCode.FLOW_FORM_NOT_FOUND,
{
    flowId: FlowVersionId
    message: string
}>

export type FlowIsLockedErrorParams = BaseErrorParams<
ErrorCode.FLOW_IN_USE,
{
    flowVersionId: FlowVersionId
    message: string
}>

export type InvalidJwtTokenErrorParams = BaseErrorParams<
ErrorCode.INVALID_OR_EXPIRED_JWT_TOKEN,
{
    token: string
}
>

export type TestTriggerFailedErrorParams = BaseErrorParams<
ErrorCode.TEST_TRIGGER_FAILED,
{
    message: string
}
>

export type EntityNotFoundErrorParams = BaseErrorParams<
ErrorCode.ENTITY_NOT_FOUND,
{
    message?: string
    entityType?: string
    entityId?: string
}
>

export type InvalidCustomDomainErrorParams = BaseErrorParams<
ErrorCode.INVALID_CUSTOM_DOMAIN,
{
    message: string
}
>

export type ExecutionTimeoutErrorParams = BaseErrorParams<
ErrorCode.EXECUTION_TIMEOUT,
{
    standardOutput: string
    standardError: string
}
>

export type ValidationErrorParams = BaseErrorParams<
ErrorCode.VALIDATION,
{
    message: string
}
>

export type TriggerUpdateStatusErrorParams = BaseErrorParams<
ErrorCode.TRIGGER_UPDATE_STATUS,
{
    flowVersionId?: FlowVersionId
    message?: string
    standardOutput?: string
    standardError?: string
}
>

export type PauseMetadataMissingErrorParams = BaseErrorParams<
ErrorCode.PAUSE_METADATA_MISSING,
Record<string, never>
>

export type InvalidApiKeyParams = BaseErrorParams<
ErrorCode.INVALID_API_KEY,
Record<string, never>
>

export type EngineOperationFailureParams = BaseErrorParams<
ErrorCode.ENGINE_OPERATION_FAILURE,
{
    message: string
    context?: unknown
}
>

export type InvalidAppConnectionParams = BaseErrorParams<
ErrorCode.INVALID_APP_CONNECTION,
{
    error: string
}
>

export type QuotaExceededParams = BaseErrorParams<
ErrorCode.QUOTA_EXCEEDED,
{
    metric: PlatformUsageMetric
}
>

export type ResourceLockedParams = BaseErrorParams<
ErrorCode.RESOURCE_LOCKED,
{
    message: string
}>

export type ErrorUpdatingSubscriptionParams = BaseErrorParams<
ErrorCode.ERROR_UPDATING_SUBSCRIPTION,
{
    message: string
}>

export type ProviderProxyConfigNotFoundParams = BaseErrorParams<
ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
{
    provider: string
}>

export type AIProviderModelNotSupportedParams = BaseErrorParams<ErrorCode.AI_MODEL_NOT_SUPPORTED, {
    provider: string
    model: string
}>

export type AIRequestNotSupportedParams = BaseErrorParams<ErrorCode.AI_REQUEST_NOT_SUPPORTED, {
    message: string
}>

export type FeatureDisabledErrorParams = BaseErrorParams<
ErrorCode.FEATURE_DISABLED,
{
    message: string
}>

export type SignUpDisabledParams = BaseErrorParams<
ErrorCode.SIGN_UP_DISABLED,
Record<string, never>
>

export type AuthenticationParams = BaseErrorParams<
ErrorCode.AUTHENTICATION,
{
    message: string
}>

export type InvalidSAMLResponseParams = BaseErrorParams<
ErrorCode.INVALID_SAML_RESPONSE,
{
    message: string
}>

export type ExistingAlertChannelErrorParams = BaseErrorParams<
ErrorCode.EXISTING_ALERT_CHANNEL,
{
    email: string
}>

export type InvalidOtpParams = BaseErrorParams<ErrorCode.INVALID_OTP, Record<string, never>>

export type InvalidLicenseKeyParams = BaseErrorParams<ErrorCode.INVALID_LICENSE_KEY, {
    key: string
}>  

export type EmailAlreadyHasActivationKey = BaseErrorParams<ErrorCode.EMAIL_ALREADY_HAS_ACTIVATION_KEY, {
    email: string
}>

export type InvalidSmtpCredentialsErrorParams = BaseErrorParams<ErrorCode.INVALID_SMTP_CREDENTIALS, {
    message: string
}>  

export type InvalidGitCredentialsParams = BaseErrorParams<ErrorCode.INVALID_GIT_CREDENTIALS, {
    message: string
}>

export type InvalidReleaseTypeParams = BaseErrorParams<ErrorCode.INVALID_RELEASE_TYPE, {
    message: string
}>

export type CopilotFailedErrorParams = BaseErrorParams<ErrorCode.COPILOT_FAILED, {
    message: string
}>

export type ProjectExternalIdAlreadyExistsParams = BaseErrorParams<ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS, {
    externalId: string
}>

export type McpPieceRequiresConnectionParams = BaseErrorParams<ErrorCode.MCP_PIECE_REQUIRES_CONNECTION, {
    pieceName: string
}>

export type McpPieceConnectionMismatchParams = BaseErrorParams<ErrorCode.MCP_PIECE_CONNECTION_MISMATCH, {
    pieceName: string
    connectionPieceName: string
    connectionId: string
}>

export type SubflowFailedParams = BaseErrorParams<ErrorCode.SUBFLOW_FAILED, {
    message: string
}>

export type MachineNotAvailableParams = BaseErrorParams<ErrorCode.MACHINE_NOT_AVAILABLE, {
    resourceType: string
}>

export type MachineNotConnectedParams = BaseErrorParams<ErrorCode.MACHINE_NOT_CONNECTED, {
    message: string
}>

export enum ErrorCode {
    MACHINE_NOT_CONNECTED = 'MACHINE_NOT_CONNECTED',
    MACHINE_NOT_AVAILABLE = 'MACHINE_NOT_AVAILABLE',
    INVALID_CUSTOM_DOMAIN = 'INVALID_CUSTOM_DOMAIN',
    NO_CHAT_RESPONSE = 'NO_CHAT_RESPONSE',
    ERROR_UPDATING_SUBSCRIPTION = 'ERROR_UPDATING_SUBSCRIPTION',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER = 'PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER',
    AI_MODEL_NOT_SUPPORTED = 'AI_MODEL_NOT_SUPPORTED',
    AI_REQUEST_NOT_SUPPORTED = 'AI_REQUEST_NOT_SUPPORTED',
    CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
    DOMAIN_NOT_ALLOWED = 'DOMAIN_NOT_ALLOWED',
    EMAIL_IS_NOT_VERIFIED = 'EMAIL_IS_NOT_VERIFIED',
    ENGINE_OPERATION_FAILURE = 'ENGINE_OPERATION_FAILURE',
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
    MEMORY_ISSUE = 'MEMORY_ISSUE',
    TRIGGER_EXECUTION_FAILED = 'TRIGGER_EXECUTION_FAILED',
    EMAIL_AUTH_DISABLED = 'EMAIL_AUTH_DISABLED',
    EXISTING_USER = 'EXISTING_USER',
    EXISTING_ALERT_CHANNEL = 'EXISTING_ALERT_CHANNEL',
    PROJECT_EXTERNAL_ID_ALREADY_EXISTS = 'PROJECT_EXTERNAL_ID_ALREADY_EXISTS',
    FLOW_FORM_NOT_FOUND = 'FLOW_FORM_NOT_FOUND',
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    FLOW_INSTANCE_NOT_FOUND = 'INSTANCE_NOT_FOUND',
    FLOW_NOT_FOUND = 'FLOW_NOT_FOUND',
    FLOW_OPERATION_INVALID = 'FLOW_OPERATION_INVALID',
    FLOW_IN_USE = 'FLOW_IN_USE',
    FLOW_RUN_NOT_FOUND = 'FLOW_RUN_NOT_FOUND',
    INVALID_API_KEY = 'INVALID_API_KEY',
    INVALID_APP_CONNECTION = 'INVALID_APP_CONNECTION',
    INVALID_BEARER_TOKEN = 'INVALID_BEARER_TOKEN',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    INVALID_CLAIM = 'INVALID_CLAIM',
    INVALID_CLOUD_CLAIM = 'INVALID_CLOUD_CLAIM',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    INVALID_OR_EXPIRED_JWT_TOKEN = 'INVALID_OR_EXPIRED_JWT_TOKEN',
    INVALID_OTP = 'INVALID_OTP',
    INVALID_SAML_RESPONSE = 'INVALID_SAML_RESPONSE',
    INVITATION_ONLY_SIGN_UP = 'INVITATION_ONLY_SIGN_UP',
    JOB_REMOVAL_FAILURE = 'JOB_REMOVAL_FAILURE',
    OPEN_AI_FAILED = 'OPEN_AI_FAILED',
    PAUSE_METADATA_MISSING = 'PAUSE_METADATA_MISSING',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    PIECE_NOT_FOUND = 'PIECE_NOT_FOUND',
    PIECE_TRIGGER_NOT_FOUND = 'PIECE_TRIGGER_NOT_FOUND',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    RESOURCE_LOCKED = 'RESOURCE_LOCKED',
    FEATURE_DISABLED = 'FEATURE_DISABLED',
    AI_CREDIT_LIMIT_EXCEEDED = 'AI_CREDIT_LIMIT_EXCEEDED',
    SIGN_UP_DISABLED = 'SIGN_UP_DISABLED',
    STEP_NOT_FOUND = 'STEP_NOT_FOUND',
    SYSTEM_PROP_INVALID = 'SYSTEM_PROP_INVALID',
    SYSTEM_PROP_NOT_DEFINED = 'SYSTEM_PROP_NOT_DEFINED',
    TEST_TRIGGER_FAILED = 'TEST_TRIGGER_FAILED',
    TRIGGER_UPDATE_STATUS = 'TRIGGER_UPDATE_STATUS',
    TRIGGER_FAILED = 'TRIGGER_FAILED',
    USER_IS_INACTIVE = 'USER_IS_INACTIVE',
    VALIDATION = 'VALIDATION',
    INVALID_LICENSE_KEY = 'INVALID_LICENSE_KEY',
    EMAIL_ALREADY_HAS_ACTIVATION_KEY = 'EMAIL_ALREADY_HAS_ACTIVATION_KEY',
    INVALID_SMTP_CREDENTIALS = 'INVALID_SMTP_CREDENTIALS',
    INVALID_GIT_CREDENTIALS = 'INVALID_GIT_CREDENTIALS',
    INVALID_RELEASE_TYPE = 'INVALID_RELEASE_TYPE',
    COPILOT_FAILED = 'COPILOT_FAILED',
    MCP_PIECE_REQUIRES_CONNECTION = 'MCP_PIECE_REQUIRES_CONNECTION',
    MCP_PIECE_CONNECTION_MISMATCH = 'MCP_PIECE_CONNECTION_MISMATCH',
    SUBFLOW_FAILED = 'SUBFLOW_FAILED',
}
