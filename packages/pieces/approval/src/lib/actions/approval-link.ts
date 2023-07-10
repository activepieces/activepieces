import { createAction } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";

export const approvalLink = createAction({
  name: 'approval',
  displayName: 'Approval link',
  description: 'Pauses the flow and waits for approval from the user',
  props: {
  },
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      ctx.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK
        }
      });
    }
  },
});
