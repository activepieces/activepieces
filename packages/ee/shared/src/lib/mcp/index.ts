import { Static, Type } from "@sinclair/typebox";
import { ApId, BaseModelSchema } from "@activepieces/shared";

export enum MCPStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const MCP = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    connectionsIds: Type.Array(ApId),
    status: Type.Enum(MCPStatus)
})

export type MCP = Static<typeof MCP> 
