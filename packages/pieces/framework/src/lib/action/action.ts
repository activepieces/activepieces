import { z } from 'zod';
import { ActionContext } from '../context';
import { OutputDisplayHints } from '../output-display-hints';
import { ActionBase } from '../piece-metadata';
import { InputPropertyMap } from '../property';
import { ExtractPieceAuthPropertyTypeForMethods, PieceAuthProperty } from '../property/authentication';

export type ActionRunner<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty, ActionProps extends InputPropertyMap = InputPropertyMap> =
  (ctx: ActionContext<PieceAuth, ActionProps>) => Promise<unknown | void>

export const ErrorHandlingOptionsParam = z.object({
  retryOnFailure: z.object({
    defaultValue: z.boolean().optional(),
    hide: z.boolean().optional(),
  }),
  continueOnFailure: z.object({
    defaultValue: z.boolean().optional(),
    hide: z.boolean().optional(),
  }),
})
export type ErrorHandlingOptionsParam = z.infer<typeof ErrorHandlingOptionsParam>

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
  outputDisplayHints?: OutputDisplayHints
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    public readonly outputDisplayHints?: OutputDisplayHints,
  ) { }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Action<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any,
  ActionProps extends InputPropertyMap = any,
> = IAction<PieceAuth, ActionProps>

export const createAction = <
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = PieceAuthProperty,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    params.outputDisplayHints,
  )
}
