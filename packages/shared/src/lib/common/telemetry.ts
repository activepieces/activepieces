import { UserIdentityProvider } from '../authentication/user-identity'
import { FlowRunId, RunEnvironment } from '../flow-run/flow-run'
import { FlowId } from '../flows/flow'
import { McpId } from '../mcp/mcp'
import { PlatformId, PlatformPlanLimits } from '../platform'
import { ProjectId } from '../project/project'
import { UserId } from '../user/user'

type FlowCreated = {
    flowId: FlowId
}

type RunCreated = {
    projectId: ProjectId
    flowId: FlowId
    environment: RunEnvironment
    platformId: PlatformId,
    count: number
}

type FlowPublished = {
    flowId: FlowId
    projectId: ProjectId
    userId: UserId
    platformId: PlatformId
}



type SignedUp = {
    userId: UserId
    email: string
    firstName: string
    lastName: string
    projectId: ProjectId
    platformId: PlatformId
    provider: UserIdentityProvider
}

export type ClickedTutorialTelemetryParams = {
    tab: 'flows'
    | 'mcpServers'
    | 'tables'
    | 'agents'
    | 'todos'
    | 'gettingStarted'
    location: 'tutorials-sidebar-item' | 'table-title' | 'small-button-inside-sidebar-item'
}




type FlowIssueResolved = {
    flowId: string
}



type KeyActivated = {
    date: string
    key: string
}




type McpToolCalled = {
    mcpId: McpId
    toolName: string
}

export enum TelemetryEventName {
    USER_SIGNED_UP = 'user_signed_up',
    KEY_ACTIVATED = 'key_activated',
    FLOW_ISSUE_RESOLVED = 'flow_issue_resolved',
    FLOW_CREATED = 'flow_created',
    FLOW_RUN_CREATED = 'flow_run_created',
    MCP_TOOL_CALLED = 'mcp_tool_called',
    TUTORIAL_CLICKED = 'tutorial_clicked',
    FLOW_PUBLISHED = 'flow_published',
    USER_UPDATED_PLAN = 'user_updated_plan',
    USER_DELTED_SUBSCRIPTION = 'user_delted_subscription',
    USER_UPGRADE_TO_PAID_PLAN = 'user_upgrade_to_paid_plan',
}


type PlanEvent = {
    plan: string
    cycle: string
    stripeSubscriptionId: string | undefined
    limits: Partial<PlatformPlanLimits>
}
type UpdatedPlanEvent = PlanEvent & {
    isUpgradeFromLastPlan: boolean
}

type BaseTelemetryEvent<T, P> = {
    name: T
    payload: P
}

export type TelemetryEvent =
  | BaseTelemetryEvent<TelemetryEventName.USER_SIGNED_UP, SignedUp>
  | BaseTelemetryEvent<TelemetryEventName.KEY_ACTIVATED, KeyActivated>
  | BaseTelemetryEvent<
  TelemetryEventName.FLOW_ISSUE_RESOLVED,
  FlowIssueResolved
  >
  | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
  | BaseTelemetryEvent<TelemetryEventName.FLOW_PUBLISHED, FlowPublished>
  | BaseTelemetryEvent<TelemetryEventName.FLOW_CREATED, FlowCreated>
  | BaseTelemetryEvent<TelemetryEventName.MCP_TOOL_CALLED, McpToolCalled>
  | BaseTelemetryEvent<TelemetryEventName.TUTORIAL_CLICKED, ClickedTutorialTelemetryParams>
  | BaseTelemetryEvent<TelemetryEventName.USER_UPDATED_PLAN, UpdatedPlanEvent>
  | BaseTelemetryEvent<TelemetryEventName.USER_DELTED_SUBSCRIPTION, PlanEvent>
  | BaseTelemetryEvent<TelemetryEventName.USER_UPGRADE_TO_PAID_PLAN, PlanEvent>