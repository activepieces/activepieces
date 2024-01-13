import { AppConnectionValue, ExecutionType, FlowRunId, PauseMetadata, ProjectId, StopResponse, TriggerPayload } from "@activepieces/shared";
import { TriggerStrategy } from "./trigger/trigger";
import { NonAuthPiecePropertyMap, PieceAuthProperty, PiecePropValueSchema, PiecePropertyMap, StaticPropsValue } from "./property";

type BaseContext<PieceAuth extends PieceAuthProperty, Props extends PiecePropertyMap> = {
    auth: PiecePropValueSchema<PieceAuth>,
    propsValue: StaticPropsValue<Props>
    store: Store
    project: {
        id: ProjectId,
        externalId: () => Promise<string | undefined>
    }
}

type AppWebhookTriggerHookContext<PieceAuth extends PieceAuthProperty, TriggerProps extends PiecePropertyMap> =
    BaseContext<PieceAuth, TriggerProps> & {
        webhookUrl: string
        payload: TriggerPayload
        app: {
            createListeners({ events, identifierValue }: { events: string[], identifierValue: string }): void
        }
    }

type PollingTriggerHookContext<PieceAuth extends PieceAuthProperty, TriggerProps extends PiecePropertyMap> =
    BaseContext<PieceAuth, TriggerProps> & {
        setSchedule(schedule: {
            cronExpression: string,
            timezone?: string
        }): void
    }

type WebhookTriggerHookContext<PieceAuth extends PieceAuthProperty, TriggerProps extends PiecePropertyMap> =
    BaseContext<PieceAuth, TriggerProps> & {
        webhookUrl: string
        payload: TriggerPayload
    }

export type TriggerHookContext<
    PieceAuth extends PieceAuthProperty,
    TriggerProps extends PiecePropertyMap,
    S extends TriggerStrategy,
> = S extends TriggerStrategy.APP_WEBHOOK
    ? AppWebhookTriggerHookContext<PieceAuth, TriggerProps>
    : S extends TriggerStrategy.POLLING
    ? PollingTriggerHookContext<PieceAuth, TriggerProps>
    : S extends TriggerStrategy.WEBHOOK
    ? WebhookTriggerHookContext<PieceAuth, TriggerProps>
    : never

export type TestOrRunHookContext<
    PieceAuth extends PieceAuthProperty,
    TriggerProps extends PiecePropertyMap,
    S extends TriggerStrategy,
> = TriggerHookContext<PieceAuth, TriggerProps, S> & {
    files: FilesService
}

export type StopHookParams = {
    response: StopResponse
}

export type StopHook = (params: StopHookParams) => void

type PauseMetadataWithoutResumeStepMetadata<T extends PauseMetadata> = T extends PauseMetadata ? Omit<T, 'resumeStepMetadata'> : never

export type PauseHookPauseMetadata = PauseMetadataWithoutResumeStepMetadata<PauseMetadata>

export type PauseHookParams = {
    pauseMetadata: PauseHookPauseMetadata
}

export type PauseHook = (params: PauseHookParams) => void

export type PropertyContext = {
	server: ServerContext
}

export type ServerContext = {
    apiUrl: string,
    publicUrl: string,
    token: string
}
export type BaseActionContext<
    ET extends ExecutionType,
    PieceAuth extends PieceAuthProperty,
    ActionProps extends NonAuthPiecePropertyMap,
> = BaseContext<PieceAuth, ActionProps> & {
    executionType: ET,
    connections: ConnectionsManager,
    tags: TagsManager,
    server: ServerContext,
    files: FilesService
    serverUrl: string,
    run: {
        id: FlowRunId,
        stop: StopHook,
        pause: PauseHook,
    }
}

type BeginExecutionActionContext<
    PieceAuth extends PieceAuthProperty = PieceAuthProperty,
    ActionProps extends NonAuthPiecePropertyMap = NonAuthPiecePropertyMap,
> = BaseActionContext<ExecutionType.BEGIN, PieceAuth, ActionProps>

type ResumeExecutionActionContext<
    PieceAuth extends PieceAuthProperty = PieceAuthProperty,
    ActionProps extends NonAuthPiecePropertyMap = NonAuthPiecePropertyMap,
> = BaseActionContext<ExecutionType.RESUME, PieceAuth, ActionProps> & {
    resumePayload: unknown
}

export type ActionContext<
    PieceAuth extends PieceAuthProperty = PieceAuthProperty,
    ActionProps extends NonAuthPiecePropertyMap = NonAuthPiecePropertyMap,
> = BeginExecutionActionContext<PieceAuth, ActionProps> | ResumeExecutionActionContext<PieceAuth, ActionProps>

export interface FilesService {
    write({ fileName, data }: { fileName: string, data: Buffer }): Promise<string>;
}

export interface ConnectionsManager {
    get(key: string): Promise<AppConnectionValue | Record<string, unknown> | string | null>;
}

export interface TagsManager {
    add(params: { name: string }): Promise<void>;
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
