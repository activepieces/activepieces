import { CollectionId } from "../collections/collection"
import { FlowId } from "../flows/flow"
import { ProjectId } from "../project/project"
import { UserId } from "../user/user"


interface FlowTested {
    projectId: ProjectId;
    collectionId: CollectionId,
    flowId: FlowId
}

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
    FLOW_TESTED = "flow.tested",
    FLOW_CREATED = "flow.created",
    START_BUILDING = "start.building",
    COLLECTION_CREATED = "collection.created"
}


interface BaseTelemetryEvent<T, P> {
    name: T,
    payload: P
}

export type TelemetryEvent = BaseTelemetryEvent<TelemetryEventName.FLOW_TESTED, FlowTested>
    | BaseTelemetryEvent<TelemetryEventName.COLLECTION_CREATED, CollectionCreated>
    | BaseTelemetryEvent<TelemetryEventName.START_BUILDING, Record<string, never>>
    | BaseTelemetryEvent<TelemetryEventName.COLLECTION_ENABLED, CollectionEnabled>
    | BaseTelemetryEvent<TelemetryEventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<TelemetryEventName.FLOW_CREATED, FlowCreated>;
