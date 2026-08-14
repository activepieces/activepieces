import { createAction, Property } from '@activepieces/pieces-framework';

export const failFlow = createAction({
  audience: 'both',
  name: 'failFlow',
  displayName: 'Fail Flow',
  description: 'Fails the flow execution with a custom message.',
  aiMetadata: { description: 'Aborts the current flow run by throwing the supplied message as an error, so the run is recorded as failed and no later steps execute. Use it to hard-fail on an unrecoverable condition; prefer Stop Flow when the early exit is a normal outcome that should still count as a success. Requires an error message, and the run continues past this step if continue-on-failure is enabled on it; idempotent, since it drives the run to the same failed end state and creates nothing.', idempotent: true },
  props: {
    message: Property.LongText({
      displayName: 'Error Message',
      description: 'The error message to show when the flow fails.',
      required: true,
    }),
  },
  async run(context) {
    throw new Error(context.propsValue.message);
  },
});
