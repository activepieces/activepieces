import { Static, Type } from "@sinclair/typebox"
import { BaseModelSchema } from "../common"
import { ApId } from "../common/id-generator"
import { ConversationMessage, PlanConversationMessage } from "."

export const ChatSession = Type.Object({
    ...BaseModelSchema,
    userId: ApId,
    plan: PlanConversationMessage,
    conversation: Type.Array(ConversationMessage),
})
export type ChatSession = Static<typeof ChatSession>