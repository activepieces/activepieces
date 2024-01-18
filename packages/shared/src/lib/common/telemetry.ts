import { RunEnvironment } from '../flow-run/flow-run'
import { FlowId } from '../flows/flow'
import { ProjectId } from '../project/project'
import { UserId } from '../user/user'

type FlowCreated = {
    flowId: FlowId
}
type PiecesSearch = {
    target: 'steps' | 'triggers'
    search: string
}

type TemplateSearch = {
    search: string
    tags: string[]
    pieces: string[]

}

type RunCreated = {
    projectId: ProjectId
    flowId: FlowId
    environment: RunEnvironment
}

type FlowPublished = {
    flowId: FlowId
}

type SignedUp = {
    userId: UserId
    email: string
    firstName: string
    lastName: string
    projectId: ProjectId
}

type QuotaAlert = {
    percentageUsed: number
}
type FlowImported = {
    id: string
    name: string
    location: string
    tab?: string
}

type UpgradeClicked = {
    limitType?: 'team' | 'connections'
    limit: number
}

type UpgradePopup = {
    limitType?: 'team' | 'connections'
    limit: number
    
}

type ReferralLinkCopied = {
    userId: UserId
}

type Referral = {
    referredUserId: UserId
}

type FlowShared = {
    flowId: FlowId
    projectId: ProjectId
}

type OpenedFromDasahboard = {
    location: 'sidenav' | 'tasks-progress'
}
type CopilotGeneratedCode = {
    code: string
    prompt: string
}
export enum TelemetryEventName {
    SIGNED_UP = 'signed.up',
    QUOTA_ALERT = 'quota.alert',
    UPGRADE_CLICKED = 'upgrade.clicked',
    OPENED_PRICING_FROM_DASHBOARD = 'pricing.viewed',
    UPGRADE_POPUP = 'upgrade.popup',
    FLOW_CREATED = 'flow.created',
    DEMO_IMPORTED = 'demo.imported',
    FLOW_RUN_CREATED = 'run.created',
    FLOW_PUBLISHED = 'flow.published',
    FLOW_IMPORTED = 'flow.imported',
    PIECES_SEARCH = 'pieces.search',
    REFERRAL = 'referral',
    REFERRAL_LINK_COPIED = 'referral.link.copied',
    FLOW_SHARED = 'flow.shared',
    TEMPLATE_SEARCH = 'template.search',
    COPILOT_GENERATED_CODE = 'copilot.code.generated',
}

type BaseTelemetryEvent<T, P> = {
    name: T
    payload: P
}

export type TelemetryEvent =
    | BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<TelemetryEventName.REFERRAL, Referral>
    | BaseTelemetryEvent<TelemetryEventName.UPGRADE_CLICKED, UpgradeClicked>
    | BaseTelemetryEvent<TelemetryEventName.UPGRADE_POPUP, UpgradePopup>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_PUBLISHED, FlowPublished>
    | BaseTelemetryEvent<TelemetryEventName.QUOTA_ALERT, QuotaAlert>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_CREATED, FlowCreated>
    | BaseTelemetryEvent<TelemetryEventName.TEMPLATE_SEARCH, TemplateSearch>
    | BaseTelemetryEvent<TelemetryEventName.PIECES_SEARCH, PiecesSearch>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_IMPORTED, FlowImported>
    | BaseTelemetryEvent<TelemetryEventName.REFERRAL_LINK_COPIED, ReferralLinkCopied>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_SHARED, FlowShared>
    | BaseTelemetryEvent<TelemetryEventName.DEMO_IMPORTED, Record<string, never>>
    | BaseTelemetryEvent<TelemetryEventName.OPENED_PRICING_FROM_DASHBOARD, OpenedFromDasahboard>
    | BaseTelemetryEvent<TelemetryEventName.COPILOT_GENERATED_CODE, CopilotGeneratedCode>
