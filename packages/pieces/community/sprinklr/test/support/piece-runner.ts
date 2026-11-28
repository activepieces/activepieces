import {
  ActionContext,
  createMockActionContext,
  createMockPollingTriggerContext,
  InputPropertyMap,
  Store,
  TriggerHookContext,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { SprinklrAuthValue } from '../../src/lib/common/client';
import { newCase } from '../../src/lib/triggers/new-case';
import { updatedCase } from '../../src/lib/triggers/updated-case';

export const pieceRunner = { runAction, pollingTrigger, pollingContext };

export const shape = { record, list, isRecord };

function runAction({ action, auth, propsValue }: { action: RunnableAction; auth: SprinklrAuthValue; propsValue: Record<string, unknown> }): Promise<unknown> {
  return action.run({ ...createMockActionContext<InputPropertyMap>({ propsValue }), auth });
}

function pollingTrigger(trigger: SprinklrTrigger): RunnablePollingTrigger {
  if (trigger.type !== TriggerStrategy.POLLING) {
    throw new Error(`${trigger.name} is not a polling trigger`);
  }
  return trigger;
}

function pollingContext({ auth, store, propsValue, isRepublish }: { auth: SprinklrAuthValue; store: Store; propsValue: Record<string, unknown>; isRepublish?: boolean }): PollingContext {
  return { ...createMockPollingTriggerContext<InputPropertyMap>({ propsValue }), auth, store, isRepublish };
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Expected an object, got ${JSON.stringify(value)}`);
  }
  return value;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected an array, got ${JSON.stringify(value)}`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type RunnableAction = {
  run(context: LooseActionContext): Promise<unknown>;
};

type LooseActionContext = Omit<ActionContext<undefined, InputPropertyMap>, 'auth'> & { auth: unknown };

export type PollingContext = Omit<TriggerHookContext<undefined, InputPropertyMap, TriggerStrategy.POLLING>, 'auth'> & { auth: unknown };

export type RunnablePollingTrigger = {
  onEnable(context: PollingContext): Promise<void>;
  run(context: PollingContext): Promise<unknown[]>;
  test(context: PollingContext): Promise<unknown[]>;
};

type SprinklrTrigger = typeof newCase | typeof updatedCase;
