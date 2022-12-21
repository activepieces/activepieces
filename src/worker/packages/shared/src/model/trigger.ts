import {Step} from "./step";

export interface Trigger<T extends TriggerType, V> extends Step<T, V> {
}

export interface CollectionEnabledTrigger extends Trigger<TriggerType.COLLECTION_ENABLED, {}> {
}

export interface CollectionDisabledTrigger extends Trigger<TriggerType.COLLECTION_DISABLED, {}> {
}

export interface WebhookTrigger extends Trigger<TriggerType.WEBHOOK, {}> {
}

export type ScheduleTriggerSettings = {
  cronExpression: string;
}

export interface ScheduleTrigger extends Trigger<TriggerType.SCHEDULE, ScheduleTriggerSettings> {
}

export type ComponentTriggerSettings = {
  componentName: string;
  triggerName: string;
  input: Record<string, unknown>;
};

export interface ComponentTrigger extends Trigger<TriggerType.COMPONENT, ComponentTriggerSettings> {
}

export enum TriggerType {
  SCHEDULE = 'SCHEDULE',
  EMPTY = 'EMPTY',
  WEBHOOK = 'WEBHOOK',
  COLLECTION_ENABLED = 'COLLECTION_ENABLED',
  COLLECTION_DISABLED = 'COLLECTION_DISABLED',
  COMPONENT = 'COMPONENT_TRIGGER',
}
