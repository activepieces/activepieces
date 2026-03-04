import { Static, Type } from '@sinclair/typebox';
import { ActionContext } from '../context';
import { ActionBase } from '../piece-metadata';
import { InputPropertyMap } from '../property';
import { ExtractPieceAuthPropertyTypeForMethods, PieceAuthProperty } from '../property/authentication';

export type ActionRunner<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty, ActionProps extends InputPropertyMap = InputPropertyMap> =
  (ctx: ActionContext<PieceAuth, ActionProps>) => Promise<unknown | void>

export const ErrorHandlingOptionsParam = Type.Object({
  retryOnFailure: Type.Object({
    defaultValue: Type.Optional(Type.Boolean()),
    hide: Type.Optional(Type.Boolean()),
  }),
  continueOnFailure: Type.Object({
    defaultValue: Type.Optional(Type.Boolean()),
    hide: Type.Optional(Type.Boolean()),
  }),
})
export type ErrorHandlingOptionsParam = Static<typeof ErrorHandlingOptionsParam>

type CreateActionParams<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, ActionProps extends InputPropertyMap> = {
  /**
   * A dummy parameter used to infer {@code PieceAuth} type
   */
  name: string
  /**
   * this parameter is used to infer the type of the piece auth value in run and test methods
   */
  auth?: PieceAuth
  displayName: string
  description: string
  props: ActionProps
  run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>
  test?: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>
  requireAuth?: boolean
  errorHandlingOptions?: ErrorHandlingOptionsParam
}

export class IAction<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any, ActionProps extends InputPropertyMap = InputPropertyMap> implements ActionBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: ActionProps,
    public readonly run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>,
    public readonly test: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>,
    public readonly requireAuth: boolean,
    public readonly errorHandlingOptions: ErrorHandlingOptionsParam,
  ) { }
}

export type Action<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any,
  ActionProps extends InputPropertyMap = any,
> = IAction<PieceAuth, ActionProps>

export const createAction = <
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty,
  ActionProps extends InputPropertyMap = any
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
    params.errorHandlingOptions ?? {
      continueOnFailure: {
        defaultValue: false,
      },
      retryOnFailure: {
        defaultValue: false,
      }
    },
  )
}
