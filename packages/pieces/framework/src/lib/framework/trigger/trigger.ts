import { TriggerBase, TriggerStrategy } from '@activepieces/shared';
import { TriggerContext, TriggerHookContext } from '../context';
import { PieceProperty, StaticPropsValue } from '../property/property';

class ITrigger<T extends PieceProperty, S extends TriggerStrategy> implements TriggerBase {
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
    public readonly sampleData: unknown
  ) { }
}

export type Trigger = ITrigger<any, TriggerStrategy>;

export function createTrigger<T extends PieceProperty, S extends TriggerStrategy>(request: {
  name: string;
  displayName: string;
  description: string;
  props: T;
  type: S;
  onEnable: (context: TriggerHookContext<StaticPropsValue<T>, S>) => Promise<void>;
  onDisable: (context: TriggerHookContext<StaticPropsValue<T>, S>) => Promise<void>;
  run: (context: TriggerContext<StaticPropsValue<T>>) => Promise<unknown[]>;
  sampleData?: unknown;
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
    request.sampleData
  );
}
