import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";
import { ApId } from "../common/id-generator";
import { AppConnectionWithoutSensitiveData } from "../app-connection/app-connection";

export const MCP = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    token: ApId
})

export type MCP = Static<typeof MCP> 

export type MCPSchema = MCP & {
    connections: AppConnectionWithoutSensitiveData[]
}
