import { TriggerStrategy } from '@activepieces/pieces-framework';

export function webhookTrigger<T extends { type: TriggerStrategy }>({ trigger }: { trigger: T }): Extract<T, { type: TriggerStrategy.WEBHOOK }> {
	if (!isWebhook(trigger)) throw new Error('expected a webhook trigger');
	return trigger;
}

export function pollingTrigger<T extends { type: TriggerStrategy }>({ trigger }: { trigger: T }): Extract<T, { type: TriggerStrategy.POLLING }> {
	if (!isPolling(trigger)) throw new Error('expected a polling trigger');
	return trigger;
}

function isWebhook<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.WEBHOOK }> {
	return trigger.type === TriggerStrategy.WEBHOOK;
}

function isPolling<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.POLLING }> {
	return trigger.type === TriggerStrategy.POLLING;
}

export function engineContext<T>({ context }: { context: object }): T {
	return Reflect.apply(Object, undefined, [context]);
}

export function records({ value }: { value: unknown }): Record<string, unknown>[] {
	if (!Array.isArray(value) || !value.every(isRecord)) throw new Error('expected an array of objects');
	return value;
}

export function rowEvents({ value }: { value: unknown }): RowEvent[] {
	if (!Array.isArray(value) || !value.every(isRowEvent)) throw new Error('expected an array of row events');
	return value;
}

function isRowEvent(value: unknown): value is RowEvent {
	return isRecord(value) && typeof value['row'] === 'number' && isRecord(value['values']);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export type RowEvent = { row: number; values: Record<string, unknown> };
