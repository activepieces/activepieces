import { Static, Type } from "@sinclair/typebox";
import { McpTool } from "../../mcp";


export const InvokeMcpByFlowServerParams = Type.Object({
    flowId: Type.String(),
})
export type InvokeMcpByFlowServerParams = Static<typeof InvokeMcpByFlowServerParams>

export const InvokeMcpByFlowServerBody = Type.Object({
    tools: Type.Array(McpTool),
})
export type InvokeMcpByFlowServerBody = Static<typeof InvokeMcpByFlowServerBody>