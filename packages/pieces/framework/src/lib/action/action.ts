import { z } from 'zod';
import { ActionContext } from '../context';
import { ActionBase, Audience, AiMetadata } from '../piece-metadata';
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
  /**
   * Optional alternate description shown to LLMs (chat / MCP).
   * Use this for tool-selection guidance, anti-patterns, disambiguation,
   * and parameter pitfalls that would be noise in the human UI description.
   * Falls back to {@code description} when omitted.
   */
  llmDescription?: string
  props: ActionProps
  run: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>
  test?: ActionRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, ActionProps>
  requireAuth?: boolean
  errorHandlingOptions?: ErrorHandlingOptionsParam
  /**
   * Visibility/routing for this action.
   *
   * - `'human'` — flow-builder only; hidden from the agent surface (MCP / SDK).
   * - `'ai'`    — agent surface only; hidden from the canvas dropdown.
   * - `'both'`  — visible everywhere. Treated as the implicit default when omitted.
   *
   * Top-level, not LLM-targeted.
   */
  audience?: Audience
  /**
   * Metadata that tells an AI agent how and when to use this action. All
   * sub-fields optional:
   * - `description` — agent-targeted prose: when to call, constraints, example inputs.
   * - `outputSchema` — a JSON Schema object for the result shape, serialized
   *   verbatim to the MCP `outputSchema` slot. For dynamic outputs (spreadsheet
   *   cells, raw HTTP responses, SQL rows) use a loose schema
   *   (`{ type: 'array', items: {} }`, `additionalProperties: true`) and lean on
   *   `description` + an `examples` entry to convey what varies and a concrete sample.
   * - `idempotent` — whether re-running with identical inputs is side-effect-safe;
   *   maps to the MCP `idempotentHint` annotation and guides agent retry behaviour.
   */
  aiMetadata?: AiMetadata
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
    public readonly llmDescription?: string,
    public readonly audience?: Audience,
    public readonly aiMetadata?: AiMetadata,
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
    params.llmDescription,
    params.audience,
    params.aiMetadata,
  )
}
