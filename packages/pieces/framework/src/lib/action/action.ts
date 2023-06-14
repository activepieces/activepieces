import type { Piece } from '../piece';
import { ActionContext } from '../context';
import { ActionBase } from '../piece-metadata';
import { PieceAuthProperty, PiecePropertyMap } from '../property/property';

export type ActionRunner<AuthProp extends PieceAuthProperty, Props extends PiecePropertyMap> =
  (ctx: ActionContext<AuthProp, Props>) => Promise<unknown | void>

export class IAction<
  Props extends PiecePropertyMap,
  AuthProp extends PieceAuthProperty,
> implements ActionBase {

  /**
   * Use {@link Piece#addAction} to create actions
   */
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: Props,
    public readonly run: ActionRunner<AuthProp, Props>,
    public readonly sampleData: unknown = {},
  ) {}
}

export type Action<T extends PiecePropertyMap = any, A extends PieceAuthProperty = any> = IAction<T, A>
