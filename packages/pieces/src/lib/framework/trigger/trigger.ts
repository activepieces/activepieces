import { TriggerContext, TriggerHookContext } from '../context';
import { PieceProperty, StaticPropsValue } from '../property/property';

export enum TriggerStrategy {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
}

class ITrigger<T extends PieceProperty> {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: T,
    public readonly type: TriggerStrategy,
    public readonly onEnable: (
      ctx: TriggerHookContext<StaticPropsValue<T>>
    ) => Promise<void>,
    public readonly onDisable: (
      ctx: TriggerHookContext<StaticPropsValue<T>>
    ) => Promise<void>,
    public readonly run: (
      ctx: TriggerContext<StaticPropsValue<T>>
    ) => Promise<unknown[]>,
    public readonly sampleData: unknown
  ) {}
}

export type Trigger = ITrigger<any>;

export function createTrigger<T extends PieceProperty>(request: {
  name: string;
  displayName: string;
  description: string;
  props: T;
  type: TriggerStrategy;
  onEnable: (context: TriggerHookContext<StaticPropsValue<T>>) => Promise<void>;
  onDisable: (context: TriggerHookContext<StaticPropsValue<T>>) => Promise<void>;
  run: (context: TriggerContext<StaticPropsValue<T>>) => Promise<unknown[]>;
  sampleData?: unknown;
}): Trigger {
  return new ITrigger<T>(
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
