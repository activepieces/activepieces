import { CopilotFlowOutline, CopilotTriggerResponse } from "@activepieces/shared"


export const triggerAgent = {
    run: async (prompts: string[], workflow: CopilotFlowOutline): Promise<CopilotTriggerResponse> => {

        return {
            pieceName: 'test',
            pieceVersion: 'test',
            triggerName: 'test',
        }
    }
}