import type { RunEnvironment } from '@activepieces/core-execution'
import type { FlowId, ProjectId, UserId } from '@activepieces/core-utils'
import type { McpId } from '../../automation/mcp/mcp'

type SignedUp = {
    userId: UserId
    email?: string
    firstName?: string
    lastName?: string
    projectId: ProjectId
}

type SignedIn = {
    userId: UserId
    platformId: string
}

type SignUpSubmitted = {
    method: 'email'
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
    gclid?: string
    fbclid?: string
    ref?: string
    ap_cta?: string
}

type SignUpFailed = {
    errorCode: string
}

type SignInSubmitted = {
    method: 'email'
}

type SignInFailed = {
    errorCode: string
}

type FederatedLoginStarted = {
    provider: 'google' | 'saml'
}

type EmailVerificationCompleted = Record<string, never>

type CaptchaUnavailable = {
    surface: string
}

type EmailCodeRequested = {
    isNewIdentity: boolean
}

type EmailCodeVerified = {
    needsNameStep: boolean
}

type EmailCodeRejected = {
    errorCode: string
}

type EmailCodeResendRequested = Record<string, never>

type FlowCreated = {
    flowId: FlowId
}

type RunCreated = {
    projectId: ProjectId
    flowId: FlowId
    environment: RunEnvironment
    count: number
}

type FlowPublished = {
    flowId: FlowId
}

type FlowImportedUsingFile = {
    location: 'inside dashboard' | 'inside the builder'
    multiple: boolean
}

type PieceSelectorSearch = {
    search: string
    isTrigger: boolean
    selectedActionOrTriggerName: string | null
}

type McpToolCalled = {
    mcpId: McpId
    toolName: string
}

type McpServerConnected = {
    userId: string
    projectId?: string
    platformId?: string
}

type BaseTelemetryEvent<T, P> = {
    name: T
    payload: P
}

export enum TelemetryEventName {
    SIGNED_UP = 'signed.up',
    SIGNED_IN = 'signed.in',
    SIGN_UP_SUBMITTED = 'signup.submitted',
    SIGN_UP_FAILED = 'signup.failed',
    SIGN_IN_SUBMITTED = 'signin.submitted',
    SIGN_IN_FAILED = 'signin.failed',
    FEDERATED_LOGIN_STARTED = 'federated.login.started',
    EMAIL_VERIFICATION_COMPLETED = 'email.verification.completed',
    CAPTCHA_UNAVAILABLE = 'captcha.unavailable',
    EMAIL_CODE_REQUESTED = 'email.code.requested',
    EMAIL_CODE_VERIFIED = 'email.code.verified',
    EMAIL_CODE_REJECTED = 'email.code.rejected',
    EMAIL_CODE_RESEND_REQUESTED = 'email.code.resend.requested',
    CREATED_FLOW = 'flow.created',
    FLOW_RUN_CREATED = 'run.created',
    FLOW_PUBLISHED = 'flow.published',
    FLOW_IMPORTED_USING_FILE = 'flow.imported.using.file',
    PIECE_SELECTOR_SEARCH = 'piece.selector.search',
    MCP_TOOL_CALLED = 'mcp.tool.called',
    MCP_SERVER_CONNECTED = 'mcp.server.connected',
}

export type TelemetryEvent =
    | BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<TelemetryEventName.SIGNED_IN, SignedIn>
    | BaseTelemetryEvent<TelemetryEventName.SIGN_UP_SUBMITTED, SignUpSubmitted>
    | BaseTelemetryEvent<TelemetryEventName.SIGN_UP_FAILED, SignUpFailed>
    | BaseTelemetryEvent<TelemetryEventName.SIGN_IN_SUBMITTED, SignInSubmitted>
    | BaseTelemetryEvent<TelemetryEventName.SIGN_IN_FAILED, SignInFailed>
    | BaseTelemetryEvent<TelemetryEventName.FEDERATED_LOGIN_STARTED, FederatedLoginStarted>
    | BaseTelemetryEvent<TelemetryEventName.EMAIL_VERIFICATION_COMPLETED, EmailVerificationCompleted>
    | BaseTelemetryEvent<TelemetryEventName.CAPTCHA_UNAVAILABLE, CaptchaUnavailable>
    | BaseTelemetryEvent<TelemetryEventName.EMAIL_CODE_REQUESTED, EmailCodeRequested>
    | BaseTelemetryEvent<TelemetryEventName.EMAIL_CODE_VERIFIED, EmailCodeVerified>
    | BaseTelemetryEvent<TelemetryEventName.EMAIL_CODE_REJECTED, EmailCodeRejected>
    | BaseTelemetryEvent<TelemetryEventName.EMAIL_CODE_RESEND_REQUESTED, EmailCodeResendRequested>
    | BaseTelemetryEvent<TelemetryEventName.CREATED_FLOW, FlowCreated>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_PUBLISHED, FlowPublished>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_IMPORTED_USING_FILE, FlowImportedUsingFile>
    | BaseTelemetryEvent<TelemetryEventName.PIECE_SELECTOR_SEARCH, PieceSelectorSearch>
    | BaseTelemetryEvent<TelemetryEventName.MCP_TOOL_CALLED, McpToolCalled>
    | BaseTelemetryEvent<TelemetryEventName.MCP_SERVER_CONNECTED, McpServerConnected>
