import { RunEnvironment } from "../flow-run/flow-run";
import { FlowId } from "../flows/flow"
import { ProjectId } from "../project/project"
import { UserId } from "../user/user"


interface FlowCreated {
    flowId: FlowId
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

interface FlowImported {
    id: string;
    name: string,
    location: string
}

export enum TelemetryEventName {
    SIGNED_UP = "signed.up",
    FLOW_CREATED = "flow.created",
    DEMO_IMPORTED = "demo.imported",
    FLOW_IMPORTED = "flow.imported",
    FLOW_RUN_CREATED = "run.created",
    FLOW_PUBLISHED = "flow.published",
}


interface BaseTelemetryEvent<T, P> {
    name: T,
    payload: P
}

export type TelemetryEvent = BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_PUBLISHED, FlowPublished>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_IMPORTED, FlowImported>
    | BaseTelemetryEvent<TelemetryEventName.DEMO_IMPORTED, Record<string, never>>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_CREATED, FlowCreated>;
