import { AppConnectionValue, ExecutionType, PauseMetadata, ScheduleOptions, StopResponse, TriggerPayload } from "@activepieces/shared";
import { TriggerStrategy } from "./trigger/trigger";
import { PieceAuthProperty, PiecePropValueSchema, PiecePropertyMap, StaticPropsValue } from "./property";

type BaseTriggerHookContext<AuthProp extends PieceAuthProperty, Props extends PiecePropertyMap> = {
    get auth(): PiecePropValueSchema<AuthProp>,
    propsValue: StaticPropsValue<Props>
    store: Store
}

type AppWebhookTriggerHookContext<AuthProp extends PieceAuthProperty, Props extends PiecePropertyMap> =
    BaseTriggerHookContext<AuthProp, Props> & {
        webhookUrl: string
        payload: TriggerPayload
        app: {
            createListeners({ events, identifierValue }: { events: string[], identifierValue: string }): Promise<void>
        }
    }

type PollingTriggerHookContext<AuthProp extends PieceAuthProperty, Props extends PiecePropertyMap> =
    BaseTriggerHookContext<AuthProp, Props> & {
        setSchedule(schedule: ScheduleOptions): void
    }

type WebhookTriggerHookContext<AuthProp extends PieceAuthProperty, Props extends PiecePropertyMap> =
    BaseTriggerHookContext<AuthProp, Props> & {
        webhookUrl: string
        payload: TriggerPayload
    }

export type TriggerHookContext<
    S extends TriggerStrategy,
    AuthProp extends PieceAuthProperty,
    Props extends PiecePropertyMap,
> = S extends TriggerStrategy.APP_WEBHOOK
    ? AppWebhookTriggerHookContext<AuthProp, Props>
    : S extends TriggerStrategy.POLLING
        ? PollingTriggerHookContext<AuthProp, Props>
        : S extends TriggerStrategy.WEBHOOK
            ? WebhookTriggerHookContext<AuthProp, Props>
            : never

export type StopHookParams = {
    response: StopResponse
}

export type StopHook = (params: StopHookParams) => void

export type PauseHookPauseMetadata = Omit<PauseMetadata, 'resumeStepMetadata'>

export type PauseHookParams = {
    pauseMetadata: PauseHookPauseMetadata
}

export type PauseHook = (params: PauseHookParams) => void

export type ActionContext<
    AuthProp extends PieceAuthProperty = PieceAuthProperty,
    Props extends PiecePropertyMap = PiecePropertyMap,
> = {
    executionType: ExecutionType,
    get auth(): PiecePropValueSchema<AuthProp>,
    propsValue: StaticPropsValue<Props>,
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
