import {Action} from "./action";

export type Trigger = CollectionEnabledTrigger | CollectionDisabledTrigger | WebhookTrigger | ScheduleTrigger | ComponentTrigger;

interface BaseTrigger<T extends TriggerType, V> {
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: Action | undefined;
}

export interface CollectionEnabledTrigger extends BaseTrigger<TriggerType.COLLECTION_ENABLED, {}> {
}

export interface CollectionDisabledTrigger extends BaseTrigger<TriggerType.COLLECTION_DISABLED, {}> {
}

export interface WebhookTrigger extends BaseTrigger<TriggerType.WEBHOOK, {}> {
}

export type ScheduleTriggerSettings = {
  cronExpression: string;
}

export interface ScheduleTrigger extends BaseTrigger<TriggerType.SCHEDULE, ScheduleTriggerSettings> {
}

export type ComponentTriggerSettings = {
  componentName: string;
  triggerName: string;
  input: Record<string, unknown>;
};

export interface ComponentTrigger extends BaseTrigger<TriggerType.COMPONENT, ComponentTriggerSettings> {
}

export enum TriggerType {
  SCHEDULE = 'SCHEDULE',
  EMPTY = 'EMPTY',
  WEBHOOK = 'WEBHOOK',
  COLLECTION_ENABLED = 'COLLECTION_ENABLED',
  COLLECTION_DISABLED = 'COLLECTION_DISABLED',
  COMPONENT = 'COMPONENT_TRIGGER',
}
