import type { FlowRunId } from '../../automation/flow-run/flow-run'
import type { FlowId } from '../../automation/flows/flow'
import type { FlowVersionId } from '../../automation/flows/flow-version'
import type { PlatformUsageMetric } from '../../management/platform'
import type { ProjectId } from '../../management/project'
import type { ProjectRole } from '../../management/project-role/project-role'
import type { UserId } from '../user'
import type { ApId } from './id-generator'
import type { Permission } from './security'

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
    | EmailIsNotVerifiedErrorParams
    | EngineOperationFailureParams
    | EntityNotFoundErrorParams
    | ExistingUserErrorParams
    | FlowOperationErrorParams
    | FlowOperationInProgressErrorParams
    | FlowRunRetryOutsideRetentionErrorParams
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
    | QuotaExceededParams
    | FeatureDisabledErrorParams
    | SignUpDisabledParams
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
    | AIProviderModelNotSupportedParams
    | AIProviderNotSupportedParams
    | AIRequestNotSupportedParams
    | AICreditLimitExceededParams
    | SessionExpiredParams
    | InvalidLicenseKeyParams
    | NoChatResponseParams
    | InvalidSmtpCredentialsErrorParams
    | InvalidGitCredentialsParams
    | InvalidReleaseTypeParams
    | ProjectExternalIdAlreadyExistsParams
    | SandboxMemoryIssueParams
    | SandboxExecutionTimeoutParams
    | SandboxInternalErrorParams
    | InvalidCustomDomainErrorParams
    | McpPieceRequiresConnectionParams
    | McpPieceConnectionMismatchParams
    | ErrorUpdatingSubscriptionParams
    | TriggerExecutionFailedParams
    | SubflowFailedParams
    | MachineNotAvailableParams
    | MachineNotConnectedParams
    | DoesNotMeetBusinessRequirementsParams
    | PieceSyncNotSupportedErrorParams
    | SandboxLogSizeExceededParams
    | SecretManagerConnectionFailedParams
    | SecretManagerGetSecretFailedParams
    | SecretManagerKeyNotSecretParams
    | InvalidAIProviderCredentialsParams
    | FlowMigrationFailedParams
    | ResumeLogsFileMissingParams
    | ExecutionStateMissingParams
    | GenericErrorParams

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

export type SandboxMemoryIssueParams = BaseErrorParams<ErrorCode.SANDBOX_MEMORY_ISSUE, {
    standardOutput: string
    standardError: string
}>

export type SandboxExecutionTimeoutParams = BaseErrorParams<ErrorCode.SANDBOX_EXECUTION_TIMEOUT, {
    standardOutput: string
    standardError: string
}>

export type SandboxInternalErrorParams = BaseErrorParams<ErrorCode.SANDBOX_INTERNAL_ERROR, {
    standardOutput: string
    standardError: string
    reason: string
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

export type FlowRunRetryOutsideRetentionErrorParams = BaseErrorParams<
ErrorCode.FLOW_RUN_RETRY_OUTSIDE_RETENTION,
{
    flowRunId: FlowRunId
    failedJobRetentionDays: number
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

export type TriggerFailedErrorParams = BaseErrorParams<
ErrorCode.TRIGGER_FAILED,
{
    pieceName: string
    pieceVersion: string
    triggerName: string
    error: string | undefined
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

export type FlowOperationInProgressErrorParams = BaseErrorParams<
ErrorCode.FLOW_OPERATION_IN_PROGRESS, {
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
    extra?: Record<string, unknown>
}
>

export type InvalidCustomDomainErrorParams = BaseErrorParams<
ErrorCode.INVALID_CUSTOM_DOMAIN,
{
    message: string
}
>

export type PieceSyncNotSupportedErrorParams = BaseErrorParams<ErrorCode.PIECE_SYNC_NOT_SUPPORTED, {
    release: string
    message: string
}>

export type ValidationErrorParams = BaseErrorParams<
ErrorCode.VALIDATION,
{
    message: string
}
>

export type TriggerUpdateStatusErrorParams = BaseErrorParams<
ErrorCode.TRIGGER_UPDATE_STATUS,
{
    flowId?: FlowId
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

export type ErrorUpdatingSubscriptionParams = BaseErrorParams<
ErrorCode.ERROR_UPDATING_SUBSCRIPTION,
{
    message: string
}>

export type AIProviderModelNotSupportedParams = BaseErrorParams<ErrorCode.AI_MODEL_NOT_SUPPORTED, {
    provider: string
    model: string
}>

export type AIProviderNotSupportedParams = BaseErrorParams<ErrorCode.AI_PROVIDER_NOT_SUPPORTED, {
    provider: string
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
export type DoesNotMeetBusinessRequirementsParams = BaseErrorParams<ErrorCode.DOES_NOT_MEET_BUSINESS_REQUIREMENTS, {
    message: string
}>

export type SandboxLogSizeExceededParams = BaseErrorParams<ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED, {
    standardOutput: string
    standardError: string
}>

export type SecretManagerConnectionFailedParams = BaseErrorParams<ErrorCode.SECRET_MANAGER_CONNECTION_FAILED, {
    message: string
    provider: string
}>

export type SecretManagerGetSecretFailedParams = BaseErrorParams<ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED, {
    message: string
    provider: string
    request: Record<string, unknown>
}>

export type SecretManagerKeyNotSecretParams = BaseErrorParams<ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET, {
    message: string
}>

export type InvalidAIProviderCredentialsParams = BaseErrorParams<ErrorCode.INVALID_AI_PROVIDER_CREDENTIALS, {
    provider: string
    message: string
    httpErrorResponse: string
}>

export type FlowMigrationFailedParams = BaseErrorParams<ErrorCode.FLOW_MIGRATION_FAILED, {
    flowVersionId: string
    message: string
}>

export type ResumeLogsFileMissingParams = BaseErrorParams<ErrorCode.RESUME_LOGS_FILE_MISSING, {
    runId: string
}>

export type ExecutionStateMissingParams = BaseErrorParams<ErrorCode.EXECUTION_STATE_MISSING, {
    logsFileId: string
}>

export type GenericErrorParams = BaseErrorParams<ErrorCode.GENERIC_ERROR, {
    message: string
}>

export enum ErrorCode {
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    MACHINE_NOT_CONNECTED = 'MACHINE_NOT_CONNECTED',
    MACHINE_NOT_AVAILABLE = 'MACHINE_NOT_AVAILABLE',
    INVALID_CUSTOM_DOMAIN = 'INVALID_CUSTOM_DOMAIN',
    NO_CHAT_RESPONSE = 'NO_CHAT_RESPONSE',
    ERROR_UPDATING_SUBSCRIPTION = 'ERROR_UPDATING_SUBSCRIPTION',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    AI_MODEL_NOT_SUPPORTED = 'AI_MODEL_NOT_SUPPORTED',
    AI_PROVIDER_NOT_SUPPORTED = 'AI_PROVIDER_NOT_SUPPORTED',
    AI_REQUEST_NOT_SUPPORTED = 'AI_REQUEST_NOT_SUPPORTED',
    DOMAIN_NOT_ALLOWED = 'DOMAIN_NOT_ALLOWED',
    EMAIL_IS_NOT_VERIFIED = 'EMAIL_IS_NOT_VERIFIED',
    ENGINE_OPERATION_FAILURE = 'ENGINE_OPERATION_FAILURE',
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    SANDBOX_EXECUTION_TIMEOUT = 'SANDBOX_EXECUTION_TIMEOUT',
    SANDBOX_MEMORY_ISSUE = 'SANDBOX_MEMORY_ISSUE',
    SANDBOX_INTERNAL_ERROR = 'SANDBOX_INTERNAL_ERROR',
    TRIGGER_EXECUTION_FAILED = 'TRIGGER_EXECUTION_FAILED',
    EMAIL_AUTH_DISABLED = 'EMAIL_AUTH_DISABLED',
    EXISTING_USER = 'EXISTING_USER',
    EXISTING_ALERT_CHANNEL = 'EXISTING_ALERT_CHANNEL',
    PROJECT_EXTERNAL_ID_ALREADY_EXISTS = 'PROJECT_EXTERNAL_ID_ALREADY_EXISTS',
    FLOW_OPERATION_INVALID = 'FLOW_OPERATION_INVALID',
    FLOW_OPERATION_IN_PROGRESS = 'FLOW_OPERATION_IN_PROGRESS',
    FLOW_RUN_RETRY_OUTSIDE_RETENTION = 'FLOW_RUN_RETRY_OUTSIDE_RETENTION',
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
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    FEATURE_DISABLED = 'FEATURE_DISABLED',
    AI_CREDIT_LIMIT_EXCEEDED = 'AI_CREDIT_LIMIT_EXCEEDED',
    SIGN_UP_DISABLED = 'SIGN_UP_DISABLED',
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
    MCP_PIECE_REQUIRES_CONNECTION = 'MCP_PIECE_REQUIRES_CONNECTION',
    MCP_PIECE_CONNECTION_MISMATCH = 'MCP_PIECE_CONNECTION_MISMATCH',
    SUBFLOW_FAILED = 'SUBFLOW_FAILED',
    DOES_NOT_MEET_BUSINESS_REQUIREMENTS = 'DOES_NOT_MEET_BUSINESS_REQUIREMENTS',
    PIECE_SYNC_NOT_SUPPORTED = 'PIECE_SYNC_NOT_SUPPORTED',
    SANDBOX_LOG_SIZE_EXCEEDED = 'SANDBOX_LOG_SIZE_EXCEEDED',
    SECRET_MANAGER_CONNECTION_FAILED = 'SECRET_MANAGER_CONNECTION_FAILED',
    SECRET_MANAGER_GET_SECRET_FAILED = 'SECRET_MANAGER_GET_SECRET_FAILED',
    SECRET_MANAGER_KEY_NOT_SECRET = 'SECRET_MANAGER_KEY_NOT_SECRET',
    INVALID_AI_PROVIDER_CREDENTIALS = 'INVALID_AI_PROVIDER_CREDENTIALS',
    FLOW_MIGRATION_FAILED = 'FLOW_MIGRATION_FAILED',
    RESUME_LOGS_FILE_MISSING = 'RESUME_LOGS_FILE_MISSING',
    EXECUTION_STATE_MISSING = 'EXECUTION_STATE_MISSING',
    GENERIC_ERROR = 'GENERIC_ERROR',
}

