import { Static, Type } from "@sinclair/typebox";
import { ApId, AppConnectionWithoutSensitiveData, BaseModelSchema } from "@activepieces/shared";

export const MCP = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    token: ApId
})

export type MCP = Static<typeof MCP> 

export type MCPSchema = MCP & {
    connections: AppConnectionWithoutSensitiveData[]
}
