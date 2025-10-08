import { Static, Type } from "@sinclair/typebox";


export const InvokeMcpByFlowAndStepServerParams = Type.Object({
    flowId: Type.String(),
    stepName: Type.String(),
})
export type InvokeMcpByFlowAndStepServerParams = Static<typeof InvokeMcpByFlowAndStepServerParams>