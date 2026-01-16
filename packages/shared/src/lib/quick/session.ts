import { Static, Type } from "@sinclair/typebox"
import { BaseModelSchema } from "../common"
import { ApId } from "../common/id-generator"
import { ConversationMessage, PlanConversationMessage } from "."

export const QuickSession = Type.Object({
    ...BaseModelSchema,
    userId: ApId,
    plan: PlanConversationMessage,
    conversation: ConversationMessage,
})
export type QuickSession = Static<typeof QuickSession>