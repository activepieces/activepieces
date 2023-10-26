import { RunEnvironment } from "../flow-run/flow-run";
import { FlowId } from "../flows/flow"
import { ProjectId } from "../project/project"
import { UserId } from "../user/user"

interface ChatbotCreated {
    chatbotId: string
}

interface FlowCreated {
    flowId: FlowId
}
interface PiecesSearch {
    target: 'steps' | 'triggers',
    search: string
}
interface FlowImported {
   id: string;
   name:string,
   location:string
}
interface TemplateSearch{
    search:string,
    tags:string[],
    pieces:string[]

}

interface RunCreated {
    projectId: ProjectId;
    flowId: FlowId
    environment: RunEnvironment;
}

interface FlowPublished {
    flowId: FlowId;
}

interface SignedUp {
    userId: UserId;
    email: string;
    firstName: string;
    lastName: string;
    projectId: ProjectId;
}

interface QuotaAlert {
    percentageUsed: number;
}
interface FlowImported {
    id: string;
    name: string;
    location: string;
    tab?:string;
}

interface UpgradeClicked {
    limit?: 'team' | 'connections';
}

interface UpgradePopup {
    limit?: 'team' | 'connections';
}

interface ReferralLinkCopied {
    userId: UserId;
}

interface Referral {
    referredUserId: UserId;
}

interface FlowShared {
    flowId: FlowId;
    projectId: ProjectId;
}

export enum TelemetryEventName {
    SIGNED_UP = "signed.up",
    QUOTA_ALERT = "quota.alert",
    UPGRADE_CLICKED = "upgrade.clicked",
    UPGRADE_POPUP = "upgrade.popup",
    CHATBOT_CREATED = "chatbot.created",
    FLOW_CREATED = "flow.created",
    DEMO_IMPORTED = "demo.imported",
    FLOW_RUN_CREATED = "run.created",
    FLOW_PUBLISHED = "flow.published",
    FLOW_IMPORTED= "flow.imported",
    PIECES_SEARCH ="pieces.search",
    REFERRAL = "referral",
    REFERRAL_LINK_COPIED = "referral.link.copied",
    FLOW_SHARED = "flow.shared",
    FEATURED_TAB_VIEWED = "template.featured-tab-viewed",
    TEMPLATE_SEARCH ="template.search",
}
interface TemplateSearch{
    search:string,
    tags:string[],
    pieces:string[]

}

interface FeaturedTabViewed 
{
    buttonPressed:'banner button'|'tab button'
}
interface BaseTelemetryEvent<T, P> {
    name: T,
    payload: P
}

export type TelemetryEvent = BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
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
    | BaseTelemetryEvent<TelemetryEventName.CHATBOT_CREATED, ChatbotCreated>
    | BaseTelemetryEvent<TelemetryEventName.FEATURED_TAB_VIEWED, FeaturedTabViewed>;
