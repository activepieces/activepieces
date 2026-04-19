import { z } from 'zod';
import { ActionContext } from '../context';
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

/**
 * Heuristic difficulty hint for an action or trigger, used by agent curation
 * and recommendation layers. Extracted to an enum so new levels can be added
 * in one place rather than updating a literal union at every site.
 *
 * - `EASY`   — single API call, no lookups, simple input.
 * - `MEDIUM` — multiple API calls or lookups, dependent dropdowns, 5+ props.
 * - `HARD`   — multi-step flow with side effects, bulk operations, waitpoints,
 *              or multiple output shapes.
 */
export enum ActionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Metadata an LLM/MCP agent reads to choose this action or trigger and consume
 * its output reliably. Optional today; intended to become the gating field for
 * exposing actions as direct MCP tools (`piece.{name}.{action}`).
 *
 * Kept as a single bundle so the "AI-ready" contract lives in one well-named
 * place, and so future fields (e.g. `recommendedForAgents`, `outputForAgent`)
 * can land here without bloating the top-level action/trigger type.
 */
export const InfoForLLM = z.object({
  /** Imperative-mood description optimised for tool selection by an LLM. */
  description: z.string().optional(),
  /**
   * Free-form description of the output shape.
   * - Static outputs: stringified JSON example, e.g.
   *   `'{ id: string, threadId: string, labelIds: string[] }'`.
   * - Dynamic outputs (HTTP responses, spreadsheet rows, SQL queries):
   *   prose explaining the shape with a representative example, since the
   *   exact keys are not known at design time.
   */
  outputSchema: z.string().optional(),
  /** Agent-side categorisation tags, e.g. `['write', 'messaging']`. */
  tags: z.array(z.string()).optional(),
  /** Heuristic difficulty hint for agent curation and recommendation. */
  difficulty: z.nativeEnum(ActionDifficulty).optional(),
})
export type InfoForLLM = z.infer<typeof InfoForLLM>

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
  infoForLLM?: InfoForLLM
  props: ActionProps
  run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>
  test?: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>
  requireAuth?: boolean
  errorHandlingOptions?: ErrorHandlingOptionsParam
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class IAction<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any, ActionProps extends InputPropertyMap = InputPropertyMap> implements ActionBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly infoForLLM: InfoForLLM | undefined,
    public readonly props: ActionProps,
    public readonly run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>,
    public readonly test: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>,
    public readonly requireAuth: boolean,
    public readonly errorHandlingOptions: ErrorHandlingOptionsParam,
  ) { }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Action<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any,
  ActionProps extends InputPropertyMap = any,
> = IAction<PieceAuth, ActionProps>

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

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
    params.infoForLLM,
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
