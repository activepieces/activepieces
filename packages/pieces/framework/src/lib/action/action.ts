import { ActionContext } from '../context';
import { ActionBase } from '../piece-metadata';
import { PiecePropertyMap, StaticPropsValue } from '../property/property';

class IAction<T extends PiecePropertyMap> implements ActionBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: T,
    public readonly run: (
      ctx: ActionContext<StaticPropsValue<T>>
    ) => Promise<unknown | void>,
    public readonly sampleData: unknown = {}
  ) {}
}

export type Action = IAction<any>;

export function createAction<T extends PiecePropertyMap>(request: {
  name: string;
  displayName: string;
  description: string;
  props: T;
  run: (context: ActionContext<StaticPropsValue<T>>) => Promise<unknown | void>;
  sampleData?: unknown;
}): Action {
  return new IAction(
    request.name,
    request.displayName,
    request.description,
    request.props,
    request.run,
    request.sampleData
  );
}
