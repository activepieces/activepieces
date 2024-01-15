import { ActionContext } from '../context';
import { ActionBase } from '../piece-metadata';
import { NonAuthPiecePropertyMap, PieceAuthProperty } from '../property/property';

export type ActionRunner<PieceAuth extends PieceAuthProperty, ActionProps extends NonAuthPiecePropertyMap> =
  (ctx: ActionContext<PieceAuth, ActionProps>) => Promise<unknown | void>

type CreateActionParams<PieceAuth extends PieceAuthProperty, ActionProps extends NonAuthPiecePropertyMap> = {
  /**
   * A dummy parameter used to infer {@code PieceAuth} type
   */
  name: string
  auth?: PieceAuth
  displayName: string
  description: string
  props: ActionProps
  run: ActionRunner<PieceAuth, ActionProps>
  test?: ActionRunner<PieceAuth, ActionProps>
  requireAuth?: boolean
  disableOnFailureOptions?: boolean
}

export class IAction<PieceAuth extends PieceAuthProperty, ActionProps extends NonAuthPiecePropertyMap> implements ActionBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: ActionProps,
    public readonly run: ActionRunner<PieceAuth, ActionProps>,
    public readonly test: ActionRunner<PieceAuth, ActionProps>,
    public readonly requireAuth: boolean,
    public readonly disableOnFailureOptions: boolean,
  ) { }
}

export type Action<
  PieceAuth extends PieceAuthProperty = any,
  ActionProps extends NonAuthPiecePropertyMap = any,
> = IAction<PieceAuth, ActionProps>

export const createAction = <
  PieceAuth extends PieceAuthProperty = PieceAuthProperty,
  ActionProps extends NonAuthPiecePropertyMap = any
>(
  params: CreateActionParams<PieceAuth, ActionProps>,
) => {
  return new IAction(
    params.name,
    params.displayName,
    params.description,
    params.props,
    params.run,
    params.test ?? params.run,
    params.requireAuth ?? true,
    params.disableOnFailureOptions ?? false,
  )
}
