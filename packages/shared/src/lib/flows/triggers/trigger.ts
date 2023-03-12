import { Type, Static } from '@sinclair/typebox';
import { Format } from '@sinclair/typebox/format';
import { isValidCron } from 'cron-validator';
import { SemVerType } from '../../pieces';

export enum TriggerStrategy {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
  APP_WEBHOOK = "APP_WEBHOOK"
}

export enum TriggerType {
  SCHEDULE = 'SCHEDULE',
  EMPTY = 'EMPTY',
  WEBHOOK = 'WEBHOOK',
  PIECE = 'PIECE_TRIGGER',
}

const commonProps = {
  name: Type.String({}),
  valid: Type.Boolean({}),
  displayName: Type.String({}),
  nextAction: Type.Optional(Type.Any())
}

export const EmptyTrigger = Type.Object({
  ...commonProps,
  type: Type.Literal(TriggerType.EMPTY),
  settings: Type.Object({}),
});

export type EmptyTrigger = Static<typeof EmptyTrigger>;


export const WebhookTrigger = Type.Object({
  ...commonProps,
  type: Type.Literal(TriggerType.WEBHOOK),
  settings: Type.Object({}),
});

export type WebhookTrigger = Static<typeof WebhookTrigger>;


// Schedule
Format.Set('cronexpression', (value) => isValidCron(value, { seconds: false }));

export const ScheduleTriggerSettings = Type.Object({
  cronExpression: Type.String({
    format: 'cronexpression',
  })
});

export type ScheduleTriggerSettings = Static<typeof ScheduleTriggerSettings>;

export const ScheduleTrigger = Type.Object({
  ...commonProps,
  type: Type.Literal(TriggerType.SCHEDULE),
  settings: ScheduleTriggerSettings
});

export type ScheduleTrigger = Static<typeof ScheduleTrigger>;

export const PieceTriggerSettings = Type.Object({
  pieceName: Type.String({}),
  pieceVersion: SemVerType,
  triggerName: Type.String({}),
  input: Type.Record(Type.String({}), Type.Any())
});

export type PieceTriggerSettings = Static<typeof PieceTriggerSettings>;

export const PieceTrigger = Type.Object({
  ...commonProps,
  type: Type.Literal(TriggerType.PIECE),
  settings: PieceTriggerSettings
});

export type PieceTrigger = Static<typeof PieceTrigger>;

export const Trigger = Type.Union([
  WebhookTrigger,
  ScheduleTrigger,
  PieceTrigger,
  EmptyTrigger
]);

export type Trigger = Static<typeof Trigger>;
