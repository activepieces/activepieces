import { Static, Type } from "@sinclair/typebox";
import { FlowVersion } from "../flow-version";

export const FlowTemplate = Type.Object({
    name: Type.String(),
    description: Type.String(),
    tags: Type.Array(Type.String()),
    pieces: Type.Array(Type.String()),
    template: Type.Unknown(),
})

export type FlowTemplate = Static<typeof FlowTemplate> & {template: FlowVersion}
