import { FileId } from '../file'
import { FlowRunId } from '../flow-run/flow-run'
import { FlowId } from '../flows/flow'
import { FlowVersionId } from '../flows/flow-version'
import { ProjectId } from '../project'
import { ProjectRole } from '../project-role/project-role'
import { UserId } from '../user'
import { ApId } from './id-generator'
import { Permission } from './security'

export class ActivepiecesError extends Error {
    constructor(public error: ApErrorParams, message?: string) {
        super(error.code + (message ? `: ${message}` : ''))
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
    | FeatureDisabledErrorParams
    | SignUpDisabledParams
    | StepNotFoundErrorParams
    | SystemInvalidErrorParams
    | SystemPropNotDefinedErrorParams
    | TestTriggerFailedErrorParams
    | TriggerDisableErrorParams
    | TriggerEnableErrorParams
    | TriggerFailedErrorParams
    | ValidationErrorParams
    | InvitationOnlySignUpParams
    | UserIsInActiveErrorParams
    | DomainIsNotAllowedErrorParams
    | EmailAuthIsDisabledParams
    | ExistingAlertChannelErrorParams
    | EmailAlreadyHasActivationKey
    | ProviderProxyConfigNotFoundParams
    | AITokenLimitExceededParams
    | SessionExpiredParams
    | InvalidLicenseKeyParams
    | NoChatResponseParams
    | InvalidSmtpCredentialsErrorParams
    | InvalidGitCredentialsParams
export type BaseErrorParams<T, V> = {
    code: T
    params: V
}

export type InvitationOnlySignUpParams = BaseErrorParams<
ErrorCode.INVITATION_ONLY_SIGN_UP,
{
    message?: string
}
>

export type InvalidClaimParams = BaseErrorParams<ErrorCode.INVALID_CLAIM, { redirectUrl: string, tokenUrl: string, clientId: string }>
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

export type AITokenLimitExceededParams = BaseErrorParams<ErrorCode.AI_TOKEN_LIMIT_EXCEEDED, {
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

export type ExecutionTimeoutErrorParams = BaseErrorParams<
ErrorCode.EXECUTION_TIMEOUT,
Record<string, never>
>

export type ValidationErrorParams = BaseErrorParams<
ErrorCode.VALIDATION,
{
    message: string
}
>

export type TriggerEnableErrorParams = BaseErrorParams<
ErrorCode.TRIGGER_ENABLE,
{
    flowVersionId?: FlowVersionId
}
>

export type TriggerDisableErrorParams = BaseErrorParams<
ErrorCode.TRIGGER_DISABLE,
{
    flowVersionId?: FlowVersionId
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
    metric: 'tasks' | 'team-members' | 'ai-tokens'
    quota?: number
}
>

export type ProviderProxyConfigNotFoundParams = BaseErrorParams<
ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
{
    provider: string
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
}
>

export type InvalidSAMLResponseParams = BaseErrorParams<
ErrorCode.INVALID_SAML_RESPONSE,
{
    message: string
}
>

export type ExistingAlertChannelErrorParams = BaseErrorParams<
ErrorCode.EXISTING_ALERT_CHANNEL,
{
    email: string
}
>

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

export enum ErrorCode {
    NO_CHAT_RESPONSE = 'NO_CHAT_RESPONSE',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER = 'PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER',
    CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
    DOMAIN_NOT_ALLOWED = 'DOMAIN_NOT_ALLOWED',
    EMAIL_IS_NOT_VERIFIED = 'EMAIL_IS_NOT_VERIFIED',
    ENGINE_OPERATION_FAILURE = 'ENGINE_OPERATION_FAILURE',
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
    EMAIL_AUTH_DISABLED = 'EMAIL_AUTH_DISABLED',
    EXISTING_USER = 'EXISTING_USER',
    EXISTING_ALERT_CHANNEL = 'EXISTING_ALERT_CHANNEL',
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
    FEATURE_DISABLED = 'FEATURE_DISABLED',
    AI_TOKEN_LIMIT_EXCEEDED = 'AI_TOKEN_LIMIT_EXCEEDED',
    SIGN_UP_DISABLED = 'SIGN_UP_DISABLED',
    STEP_NOT_FOUND = 'STEP_NOT_FOUND',
    SYSTEM_PROP_INVALID = 'SYSTEM_PROP_INVALID',
    SYSTEM_PROP_NOT_DEFINED = 'SYSTEM_PROP_NOT_DEFINED',
    TEST_TRIGGER_FAILED = 'TEST_TRIGGER_FAILED',
    TRIGGER_DISABLE = 'TRIGGER_DISABLE',
    TRIGGER_ENABLE = 'TRIGGER_ENABLE',
    TRIGGER_FAILED = 'TRIGGER_FAILED',
    USER_IS_INACTIVE = 'USER_IS_INACTIVE',
    VALIDATION = 'VALIDATION',
    INVALID_LICENSE_KEY = 'INVALID_LICENSE_KEY',
    EMAIL_ALREADY_HAS_ACTIVATION_KEY = 'EMAIL_ALREADY_HAS_ACTIVATION_KEY',
    INVALID_SMTP_CREDENTIALS = 'INVALID_SMTP_CREDENTIALS',
    INVALID_GIT_CREDENTIALS = 'INVALID_GIT_CREDENTIALS',
}
