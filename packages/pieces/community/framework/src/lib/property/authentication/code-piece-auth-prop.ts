import { Static, Type } from "@sinclair/typebox";
import { CodeOnlyPropertyType } from "../input/property-type";



export const CodePieceAuthProperty = Type.Object({
  type: Type.Literal(CodeOnlyPropertyType.AUTH),
  pieceName: Type.String(),
  displayName: Type.String(),
})

export type CodePieceAuthProperty = Static<typeof CodePieceAuthProperty>