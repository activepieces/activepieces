import { CollectionId } from "../collections/collection"
import { RunEnvironment } from "../flow-run/flow-run";
import { FlowId } from "../flows/flow"
import { ProjectId } from "../project/project"
import { UserId } from "../user/user"

interface CollectionCreated {
    collectionId: CollectionId,
    projectId: ProjectId
}

interface CollectionEnabled {
    collectionId: CollectionId;
    projectId: ProjectId;
}

interface FlowCreated {
    collectionId: CollectionId;
    flowId: FlowId
}

interface RunCreated {
    projectId: ProjectId;
    flowId: FlowId
    collectionId: CollectionId;
    environment: RunEnvironment;
}

interface SignedUp {
    userId: UserId;
    email: string;
    firstName: string;
    lastName: string;
    projectId: ProjectId;
}

export enum TelemetryEventName {
    COLLECTION_ENABLED = "collection.enabled",
    SIGNED_UP = "signed.up",
    FLOW_CREATED = "flow.created",
    COLLECTION_CREATED = "collection.created",
    FLOW_RUN_CREATED = "run.created"
}


interface BaseTelemetryEvent<T, P> {
    name: T,
    payload: P
}

export type TelemetryEvent = BaseTelemetryEvent<TelemetryEventName.COLLECTION_CREATED, CollectionCreated>
    | BaseTelemetryEvent<TelemetryEventName.COLLECTION_ENABLED, CollectionEnabled>
    | BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_RUN_CREATED, RunCreated>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_CREATED, FlowCreated>;
