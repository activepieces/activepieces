import { Static, Type } from "@sinclair/typebox";

export const CreateFlowRequest = Type.Object({
    displayName: Type.String({})
});

export type CreateFlowRequest = Static<typeof CreateFlowRequest>;


export const GuessFlowRequest = Type.Object({
    prompt: Type.String({}),
    displayName: Type.String({})
});

export type GuessFlowRequest = Static<typeof GuessFlowRequest>;
