import { createAction} from '@activepieces/pieces-framework';

export const stopFlow = createAction({
  audience: 'both',
  name: 'stopFlow',
  displayName: 'Stop Flow',
  description: 'Stops the flow immediately this step is reached.',
  aiMetadata: { description: 'Ends the current flow run at this step and marks it as stopped rather than failed, so no later steps execute. Use it for an early exit when a condition means there is nothing left to do; prefer Fail Flow when the exit should be recorded as an error instead. Takes no inputs and stops the run without a custom webhook response; idempotent, since it drives the run to the same stopped end state and creates nothing.', idempotent: true },
  props: {},
  async run(context) {
    context.run.stop();

    return {
      success: true,
      message: 'Flow stopped successfully.',
    };
  },
});
