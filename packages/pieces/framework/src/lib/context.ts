import { AppConnectionValue, ExecutionType, PauseMetadata, ScheduleOptions, StopResponse, TriggerPayload } from "@activepieces/shared";
import { TriggerStrategy } from "./trigger/trigger";

export type TriggerHookContext<T, S extends TriggerStrategy> =
    S extends TriggerStrategy.APP_WEBHOOK ? {
        webhookUrl: string,
        app: {
            createListeners({ events, identifierValue }: { events: string[], identifierValue: string }): Promise<void>
        },
        propsValue: T,
        store: Store
    } : S extends TriggerStrategy.POLLING ? {
        propsValue: T,
        setSchedule(schedule: ScheduleOptions): void,
        store: Store
    } : {
        webhookUrl: string,
        propsValue: T,
        store: Store
    };


export interface TriggerContext<T> {
    payload: TriggerPayload;
    propsValue: T,
    store: Store,
}

export type StopHookParams = {
    response: StopResponse
}

export type StopHook = (params: StopHookParams) => void

export type PauseHookPauseMetadata = Omit<PauseMetadata, 'resumeStepMetadata'>

export type PauseHookParams = {
    pauseMetadata: PauseHookPauseMetadata
}

export type PauseHook = (params: PauseHookParams) => void

export interface ActionContext<T> {
    executionType: ExecutionType,
    propsValue: T,
    store: Store,
    connections: ConnectionsManager,
    run: {
        stop: StopHook,
        pause: PauseHook,
    }
}

export interface ConnectionsManager {
    get(key: string): Promise<AppConnectionValue | Record<string, unknown> | string | null>;
}

export interface Store {
    put<T>(key: string, value: T, scope?: StoreScope): Promise<T>;
    get<T>(key: string, scope?: StoreScope): Promise<T | null>;
    delete(key: string, scope?: StoreScope): Promise<void>;
}

export enum StoreScope {
    // Collection were deprecated in favor of project
    PROJECT = "COLLECTION",
    FLOW = "FLOW"
}
