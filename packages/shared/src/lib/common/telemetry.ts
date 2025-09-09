import { RunEnvironment } from '../flow-run/flow-run'
import { FlowId } from '../flows/flow'
import { McpId } from '../mcp/mcp'
import { ProjectId } from '../project/project'
import { UserId } from '../user/user'

type FlowCreated = {
    flowId: FlowId
}

type RunCreated = {
    projectId: ProjectId
    flowId: FlowId
    environment: RunEnvironment
    count: number
}



type SignedUp = {
    userId: UserId
    email: string
    firstName: string
    lastName: string
    projectId: ProjectId
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
    SIGNED_UP = 'signed.up',
    QUOTA_ALERT = 'quota.alert',
    KEY_ACTIVATED = 'key.activated',
    FLOW_ISSUE_CLICKED = 'flow.issue.clicked',
    FLOW_ISSUE_RESOLVED = 'flow.issue.resolved',
    CREATED_FLOW = 'flow.created',
    FLOW_RUN_CREATED = 'run.created',
    PIECES_SEARCH = 'pieces.search',
    MCP_TOOL_CALLED = 'mcp.tool.called',
    CLICKED_TUTORIAL = 'clicked.tutorial',
}

type BaseTelemetryEvent<T, P> = {
    name: T
    payload: P
}

export type TelemetryEvent =
  | BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
  | BaseTelemetryEvent<TelemetryEventName.KEY_ACTIVATED, KeyActivated>
  | BaseTelemetryEvent<
  TelemetryEventName.FLOW_ISSUE_RESOLVED,
  FlowIssueResolved
  >
  | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
  | BaseTelemetryEvent<TelemetryEventName.CREATED_FLOW, FlowCreated>
  | BaseTelemetryEvent<TelemetryEventName.MCP_TOOL_CALLED, McpToolCalled>
  | BaseTelemetryEvent<TelemetryEventName.CLICKED_TUTORIAL, ClickedTutorialTelemetryParams>