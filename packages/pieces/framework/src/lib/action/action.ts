import { ActionContext } from '../context';
import { ActionBase } from '../piece-metadata';
import { PieceAuthProperty, PiecePropertyMap, StaticPropsValue } from '../property/property';

type PieceAuthPropValue<T extends PieceAuthProperty> = T extends { required: true } ? T['valueSchema'] : T['valueSchema'] | undefined

class IAction<
  T extends PiecePropertyMap,
  AuthPropValue extends PieceAuthPropValue<PieceAuthProperty> = PieceAuthPropValue<PieceAuthProperty>
> implements ActionBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: T,
    public readonly run: (
      ctx: ActionContext<StaticPropsValue<T>, AuthPropValue>
    ) => Promise<unknown | void>,
    public readonly sampleData: unknown = {}
  ) {}
}

export type Action<T extends PiecePropertyMap = any, A extends PieceAuthPropValue<PieceAuthProperty> = any> = IAction<T, A>

export function createAction<AuthPropValue extends PieceAuthPropValue<PieceAuthProperty>> () {
  return <T extends PiecePropertyMap>(request: {
    name: string;
    displayName: string;
    description: string;
    props: T;
    run: (context: ActionContext<StaticPropsValue<T>, AuthPropValue>) => Promise<unknown | void>;
    sampleData?: unknown;
  }): Action<T, AuthPropValue> => {
    return new IAction(
      request.name,
      request.displayName,
      request.description,
      request.props,
      request.run,
      request.sampleData
    );
  }
}
