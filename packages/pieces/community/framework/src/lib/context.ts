import {
  AppConnectionValue,
  ExecutionType,
  FlowRunId,
  PopulatedFlow,
  ProjectId,
  RespondResponse,
  ResumePayload,
  SeekPage,
  TriggerPayload,
} from '@activepieces/shared';
import { TriggerStrategy } from './trigger/trigger';
import {
  InputPropertyMap,
  PiecePropValueSchema,
  StaticPropsValue,
} from './property';
import { PieceAuthProperty } from './property/authentication';
import { DelayPauseMetadata, PauseMetadata, WebhookPauseMetadata } from '@activepieces/shared';

type BaseContext<
  PieceAuth extends PieceAuthProperty,
  Props extends InputPropertyMap
> = {
  flows: FlowsContext;
  auth: PiecePropValueSchema<PieceAuth>;
  propsValue: StaticPropsValue<Props>;
  store: Store;
  project: {
    id: ProjectId;
    externalId: () => Promise<string | undefined>;
  };
  connections: ConnectionsManager;
};

type AppWebhookTriggerHookContext<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap
> = BaseContext<PieceAuth, TriggerProps> & {
  webhookUrl: string;
  payload: TriggerPayload;
  app: {
    createListeners({
      events,
      identifierValue,
    }: {
      events: string[];
      identifierValue: string;
    }): void;
  };
};

type PollingTriggerHookContext<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap
> = BaseContext<PieceAuth, TriggerProps> & {
  setSchedule(schedule: { cronExpression: string; timezone?: string }): void;
};

type WebhookTriggerHookContext<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap
> = BaseContext<PieceAuth, TriggerProps> & {
  webhookUrl: string;
  payload: TriggerPayload;
};
export type TriggerHookContext<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap,
  S extends TriggerStrategy
> = S extends TriggerStrategy.APP_WEBHOOK
  ? AppWebhookTriggerHookContext<PieceAuth, TriggerProps>
  : S extends TriggerStrategy.POLLING
  ? PollingTriggerHookContext<PieceAuth, TriggerProps>
  : S extends TriggerStrategy.WEBHOOK
  ? WebhookTriggerHookContext<PieceAuth, TriggerProps> & {
      server: ServerContext;
    }
  : never;

export type TestOrRunHookContext<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap,
  S extends TriggerStrategy
> = TriggerHookContext<PieceAuth, TriggerProps, S> & {
  files: FilesService;
};

export type StopHookParams = {
  response: RespondResponse;
};

export type RespondHookParams = {
  response: RespondResponse;
};

export type StopHook = (params?: StopHookParams) => void;

export type RespondHook = (params?: RespondHookParams) => void;

export type PauseHookParams = {
  pauseMetadata: PauseMetadata;
};

export type PauseHook = (params: {
  pauseMetadata: DelayPauseMetadata | Omit<WebhookPauseMetadata, 'requestId'>
}) => void;

export type FlowsContext = {
  list(): Promise<SeekPage<PopulatedFlow>>
  current: {
    id: string;
    version: {
      id: string;
    };
  };
}



export type PropertyContext = {
  server: ServerContext;
  project: {
    id: ProjectId;
    externalId: () => Promise<string | undefined>;
  };
  searchValue?: string;
  flows: FlowsContext;
};

export type ServerContext = {
  apiUrl: string;
  publicUrl: string;
  token: string;
};

export type RunContext = {
  id: FlowRunId;
  stop: StopHook;
  pause: PauseHook;
  respond: RespondHook;
}

export type OnStartContext<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap
> = Omit<BaseContext<PieceAuth, TriggerProps>, 'flows'> & {
   run: Pick<RunContext, 'id'>;
   payload: unknown;
}

export type BaseActionContext<
  ET extends ExecutionType,
  PieceAuth extends PieceAuthProperty,
  ActionProps extends InputPropertyMap
> = BaseContext<PieceAuth, ActionProps> & {
  executionType: ET;
  tags: TagsManager;
  server: ServerContext;
  files: FilesService;
  serverUrl: string;
  run: RunContext;
  generateResumeUrl: (params: {
    queryParams: Record<string, string>,
    sync?: boolean
  }) => string;
};

type BeginExecutionActionContext<
  PieceAuth extends PieceAuthProperty = PieceAuthProperty,
  ActionProps extends InputPropertyMap = InputPropertyMap
> = BaseActionContext<ExecutionType.BEGIN, PieceAuth, ActionProps>;

type ResumeExecutionActionContext<
  PieceAuth extends PieceAuthProperty = PieceAuthProperty,
  ActionProps extends InputPropertyMap = InputPropertyMap
> = BaseActionContext<ExecutionType.RESUME, PieceAuth, ActionProps> & {
  resumePayload: ResumePayload;
};

export type ActionContext<
  PieceAuth extends PieceAuthProperty = PieceAuthProperty,
  ActionProps extends InputPropertyMap = InputPropertyMap
> =
  | BeginExecutionActionContext<PieceAuth, ActionProps>
  | ResumeExecutionActionContext<PieceAuth, ActionProps>;

export interface FilesService {
  write({
    fileName,
    data,
  }: {
    fileName: string;
    data: Buffer;
  }): Promise<string>;
}

export interface ConnectionsManager {
  get(
    key: string
  ): Promise<AppConnectionValue | Record<string, unknown> | string | null>;
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
  PROJECT = 'COLLECTION',
  FLOW = 'FLOW',
}