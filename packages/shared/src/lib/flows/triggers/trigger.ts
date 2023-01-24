import { Action } from '../actions/action';
import { Type } from '@sinclair/typebox';
import { Format } from '@sinclair/typebox/format';
import { isValidCron } from 'cron-validator';

export enum TriggerType {
  SCHEDULE = 'SCHEDULE',
  EMPTY = 'EMPTY',
  WEBHOOK = 'WEBHOOK',
  PIECE = 'PIECE_TRIGGER',
}

interface BaseTrigger<T extends TriggerType, V> {
  type: T;
  settings: V;
  displayName: string;
  name: string;
  valid: boolean;
  nextAction: Action | undefined;
}

export interface EmptyTrigger extends BaseTrigger<TriggerType.EMPTY, {}> {}

export interface WebhookTrigger extends BaseTrigger<TriggerType.WEBHOOK, {}> {}

export const WebhookTriggerSchema = Type.Object({
  name: Type.String({}),
  displayName: Type.String({}),
  type: Type.Literal(TriggerType.WEBHOOK),
  settings: Type.Object({}),
});

export type ScheduleTriggerSettings = {
  cronExpression: string;
};

export interface ScheduleTrigger
  extends BaseTrigger<TriggerType.SCHEDULE, ScheduleTriggerSettings> {}

Format.Set('cronexpression', (value) => isValidCron(value, {seconds: true}));

export const ScheduleTriggerSchema = Type.Object({
  name: Type.String({}),
  displayName: Type.String({}),
  type: Type.Literal(TriggerType.SCHEDULE),
  settings: Type.Object({
    cronExpression: Type.String({
      format: 'cronexpression',
    }),
  }),
});

export type PieceTriggerSettings = {
  pieceName: string;
  triggerName: string;
  input: Record<string, unknown>;
};

export interface PieceTrigger
  extends BaseTrigger<TriggerType.PIECE, PieceTriggerSettings> {}

export const PieceTriggerSchema = Type.Object({
  name: Type.String({}),
  displayName: Type.String({}),
  type: Type.Literal(TriggerType.PIECE),
  settings: Type.Object({
    pieceName: Type.String({}),
    triggerName: Type.String({}),
    input: Type.Object({}),
  }),
});

export type Trigger =
  | WebhookTrigger
  | ScheduleTrigger
  | PieceTrigger
  | EmptyTrigger;
export const TriggerSchema = Type.Union([
  WebhookTriggerSchema,
  ScheduleTriggerSchema,
  PieceTriggerSchema,
]);
