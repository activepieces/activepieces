import {Step} from "./step";

export abstract class Trigger<T extends TriggerType, V> extends Step<T, V> {
}

export class CollectionEnabledTrigger extends Trigger<TriggerType.COLLECTION_ENABLED, {}> {
}

export class CollectionDisabledTrigger extends Trigger<TriggerType.COLLECTION_DISABLED, {}> {
}

export class WebhookTrigger extends Trigger<TriggerType.WEBHOOK, {}> {
}

export type ScheduleTriggerSettings = {
  cronExpression: string;
}

export class ScheduleTrigger extends Trigger<TriggerType.SCHEDULE, ScheduleTriggerSettings> {
}

export type ComponentTriggerSettings = {
  componentName: string;
  triggerName: string;
  input: Record<string, unknown>;
};

export class ComponentTrigger extends Trigger<TriggerType.COMPONENT, ComponentTriggerSettings> {
}

export enum TriggerType {
  SCHEDULE = 'SCHEDULE',
  EMPTY = 'EMPTY',
  WEBHOOK = 'WEBHOOK',
  COLLECTION_ENABLED = 'COLLECTION_ENABLED',
  COLLECTION_DISABLED = 'COLLECTION_DISABLED',
  COMPONENT = 'COMPONENT_TRIGGER',
}
