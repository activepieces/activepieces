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
    location: 'import flow view' | 'inside the builder' | 'import flow by uri encoded query param'
    tab?: string
}
type FlowImportedUsingFile = {

    location: 'inside dashboard' | 'inside the builder'

}

type FlowIssueClicked = {
    flowId: string
}

type FlowIssueResolved = {
    flowId: string
}

type RequestTrialClicked = {
    feature: string | null
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

type RewardButtonClicked = {
    source: 'note' | 'rewards-button'
}

type RewardInstructionsClicked = {
    type: 'share-template' | 'linkedin' | 'referral' | 'contribute-piece'
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

type FormsViewed = {
    flowId: string
    projectId: string
    formProps: Record<string, unknown>
}

export enum TelemetryEventName {
    SIGNED_UP = 'signed.up',
    QUOTA_ALERT = 'quota.alert',
    REQUEST_TRIAL_CLICKED = 'request.trial.clicked',
    REQUEST_TRIAL_SUBMITTED = 'request.trial.submitted',
    FLOW_ISSUE_CLICKED = 'flow.issue.clicked',
    FLOW_ISSUE_RESOLVED = 'flow.issue.resolved',
    UPGRADE_CLICKED = 'upgrade.clicked',
    OPENED_PRICING_FROM_DASHBOARD = 'pricing.viewed',
    UPGRADE_POPUP = 'upgrade.popup',
    CREATED_FLOW = 'flow.created',
    DEMO_IMPORTED = 'demo.imported',
    FLOW_RUN_CREATED = 'run.created',
    FLOW_PUBLISHED = 'flow.published',
    /**used with templates dialog + import flow component + flows imported by uri query param*/
    FLOW_IMPORTED = 'flow.imported',
    /**used only with import flow dialog*/
    FLOW_IMPORTED_USING_FILE = 'flow.imported.using.file',
    PIECES_SEARCH = 'pieces.search',
    REFERRAL = 'referral',
    REFERRAL_LINK_COPIED = 'referral.link.copied',
    FLOW_SHARED = 'flow.shared',
    TEMPLATE_SEARCH = 'template.search',
    COPILOT_GENERATED_CODE = 'copilot.code.generated',
    FORMS_VIEWED = 'forms.viewed',
    FORMS_SUBMITTED = 'forms.submitted',
    REWARDS_OPENED = 'rewards.opened',
    REWARDS_INSTRUCTION_CLICKED = 'rewards.instructions.clicked',
}

type BaseTelemetryEvent<T, P> = {
    name: T
    payload: P
}

export type TelemetryEvent =
    | BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<TelemetryEventName.REFERRAL, Referral>
    | BaseTelemetryEvent<TelemetryEventName.REQUEST_TRIAL_CLICKED, RequestTrialClicked>
    | BaseTelemetryEvent<TelemetryEventName.REQUEST_TRIAL_SUBMITTED, Record<string, never>>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_ISSUE_CLICKED, FlowIssueClicked>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_ISSUE_RESOLVED, FlowIssueResolved>
    | BaseTelemetryEvent<TelemetryEventName.UPGRADE_CLICKED, UpgradeClicked>
    | BaseTelemetryEvent<TelemetryEventName.UPGRADE_POPUP, UpgradePopup>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_PUBLISHED, FlowPublished>
    | BaseTelemetryEvent<TelemetryEventName.QUOTA_ALERT, QuotaAlert>
    | BaseTelemetryEvent<TelemetryEventName.CREATED_FLOW, FlowCreated>
    | BaseTelemetryEvent<TelemetryEventName.TEMPLATE_SEARCH, TemplateSearch>
    | BaseTelemetryEvent<TelemetryEventName.PIECES_SEARCH, PiecesSearch>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_IMPORTED, FlowImported>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_IMPORTED_USING_FILE, FlowImportedUsingFile>
    | BaseTelemetryEvent<TelemetryEventName.REFERRAL_LINK_COPIED, ReferralLinkCopied>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_SHARED, FlowShared>
    | BaseTelemetryEvent<TelemetryEventName.DEMO_IMPORTED, Record<string, never>>
    | BaseTelemetryEvent<TelemetryEventName.OPENED_PRICING_FROM_DASHBOARD, OpenedFromDasahboard>
    | BaseTelemetryEvent<TelemetryEventName.COPILOT_GENERATED_CODE, CopilotGeneratedCode>
    | BaseTelemetryEvent<TelemetryEventName.FORMS_VIEWED, FormsViewed>
    | BaseTelemetryEvent<TelemetryEventName.FORMS_SUBMITTED, FormsViewed>
    | BaseTelemetryEvent<TelemetryEventName.REWARDS_OPENED, RewardButtonClicked>
    | BaseTelemetryEvent<TelemetryEventName.REWARDS_INSTRUCTION_CLICKED, RewardInstructionsClicked>