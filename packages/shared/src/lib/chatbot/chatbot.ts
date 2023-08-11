import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";

export const Chatbot = Type.Object({
    ...BaseModelSchema,
    displayName: Type.String(),
    projectId: Type.String(),
    
    settings: Type.Record(Type.String(), Type.Unknown()),
})

export type Chatbot = Static<typeof Chatbot>;

export const CreateOrUpdateChatbotRequest = Type.Object({
    displayName: Type.String(),
    settings: Type.Record(Type.String(), Type.Unknown()),
})

export type CreateOrUpdateChatbotRequest = Static<typeof CreateOrUpdateChatbotRequest>;
