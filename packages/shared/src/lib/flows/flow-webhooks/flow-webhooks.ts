import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../../common";

export const FlowWebhook = Type.Object({
  ...BaseModelSchema,
  projectId: Type.String(),
  targetFlowId: Type.String(),
  id: Type.String(),
})

export type FlowWebhook = Static<typeof FlowWebhook>
