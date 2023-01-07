import { CollectionId, FlowId, ProjectId, UserId } from "shared";
import { PostHog } from 'posthog-node'
import { nanoid } from "nanoid";
import { SystemProp } from "./system/system-prop";
import { system } from "./system/system";
import { FlagId, flagService } from "../flags/flag.service";

export interface RunCreated {
    collectionId: CollectionId,
    flowId: FlowId
}

export interface collectionCreated {
    collectionId: CollectionId,
    projectId: ProjectId
}


export interface collectionPublished {
    collectionId: CollectionId
}

export interface flowCreated {
    flowId: FlowId
}

export interface SignedUp {
}

export enum EventName {
    RUN_CREATED = "RUN_CREATED",
    COLLECTION_PUBLISHED = "COLLECTION_PUBLISHED",
    SIGNED_UP = "SIGNED_UP",
    FLOW_CREATED = "FLOW_CREATED",
    COLLECTION_CREATED = "COLLECTION_CREATED"
}


interface BaseTelemetryEvent<T, P> {
    name: T,
    payload: P
}

export type TelemetryEvent = BaseTelemetryEvent<EventName.RUN_CREATED, RunCreated>
    | BaseTelemetryEvent<EventName.COLLECTION_CREATED, collectionCreated>
    | BaseTelemetryEvent<EventName.COLLECTION_PUBLISHED, collectionPublished>
    | BaseTelemetryEvent<EventName.SIGNED_UP, SignedUp>
    | BaseTelemetryEvent<EventName.FLOW_CREATED, flowCreated>;


const telemetryEnabled = system.get(SystemProp.TELEMETRY_ENABLED) ?? true;

const client = new PostHog(
    'phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh'
)

export const telemetry = {
    async track(event: TelemetryEvent): Promise<void> {
        if (!telemetryEnabled) {
            return;
        }
        client.capture({
            distinctId: (await flagService.getOne(FlagId.ANONYMOUSE_SERVER_ID))!.value as string,
            event: event.name,
            properties: {
                ...event.payload
            }
        })

    }
}