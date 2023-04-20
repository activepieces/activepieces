import { TriggerContext, TriggerHookContext } from '../context';
import { TriggerBase } from '../piece-metadata';
import { PiecePropertyMap, StaticPropsValue } from '../property/property';

export enum TriggerStrategy {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
  APP_WEBHOOK = "APP_WEBHOOK"
}

class ITrigger<T extends PiecePropertyMap, S extends TriggerStrategy> implements TriggerBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: T,
    public readonly type: S,
    public readonly onEnable: (
      ctx: TriggerHookContext<StaticPropsValue<T>, S>
    ) => Promise<void>,
    public readonly onDisable: (
      ctx: TriggerHookContext<StaticPropsValue<T>, S>
    ) => Promise<void>,
    public readonly run: (
      ctx: TriggerContext<StaticPropsValue<T>>
    ) => Promise<unknown[]>,
    public readonly test: (
      ctx: TriggerContext<StaticPropsValue<T>>
    ) => Promise<unknown[]>,
    public sampleData: unknown
  ) { }
}

export type Trigger = ITrigger<any, TriggerStrategy>;

export function createTrigger<T extends PiecePropertyMap, S extends TriggerStrategy>(request: {
  name: string;
  displayName: string;
  description: string;
  props: T;
  type: S;
  onEnable: (context: TriggerHookContext<StaticPropsValue<T>, S>) => Promise<void>;
  onDisable: (context: TriggerHookContext<StaticPropsValue<T>, S>) => Promise<void>;
  run: (context: TriggerContext<StaticPropsValue<T>>) => Promise<unknown[]>;
  test?: (context: TriggerContext<StaticPropsValue<T>>) => Promise<unknown[]>;
  sampleData: unknown | ((context: TriggerContext<StaticPropsValue<T>>) => Promise<unknown>);
}): Trigger {
  return new ITrigger<T, S>(
    request.name,
    request.displayName,
    request.description,
    request.props,
    request.type,
    request.onEnable,
    request.onDisable,
    request.run,
    request.test ?? (() => Promise.resolve([request.sampleData])),
    request.sampleData
  );
}
