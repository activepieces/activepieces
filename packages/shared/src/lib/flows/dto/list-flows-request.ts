import { Static, Type } from "@sinclair/typebox";
import { Cursor } from "../../common/seek-page";

export const ListFlowsRequest = Type.Object({
    folderId: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export enum FlowViewMode {
    NO_ARTIFACTS = "NO_ARTIFACTS",
    WITH_ARTIFACTS= "WITH_ARTIFACTS",
    TEMPLATE = "TEMPLATE"
}

export type ListFlowsRequest = Omit<Static<typeof ListFlowsRequest>, "cursor"> & { cursor: Cursor | undefined };

export const GetFlowRequest = Type.Object({
    versionId: Type.Optional(Type.String({})),
    viewMode: Type.Optional(Type.Union([Type.Literal(FlowViewMode.NO_ARTIFACTS), Type.Literal(FlowViewMode.WITH_ARTIFACTS)]))
})

export type GetFlowRequest = Static<typeof GetFlowRequest>

