import { Static, Type } from "@sinclair/typebox";

export const CodePieceAuthProperty = Type.Object({
  type: Type.Literal('AUTH'),
  pieceName: Type.String(),
})

export type CodePieceAuthProperty = Static<typeof CodePieceAuthProperty>