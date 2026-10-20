import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

export const failFlow = createAction({
  audience: 'both',
  name: 'failFlow',
  classification: 'READ',
  displayName: 'Fail Flow',
  description: 'Fails this step with your error message.',
  aiMetadata: { description: 'Aborts the current flow run by throwing the supplied message as an error, so the run is recorded as failed and no later steps execute. Use it to hard-fail on an unrecoverable condition; prefer Stop Flow when the early exit is a normal outcome that should still count as a success. Requires an error message, and the run continues past this step if continue-on-failure is enabled on it; idempotent, since it drives the run to the same failed end state and creates nothing.', idempotent: true },
  props: {
    info: Property.MarkDown({
      value: 'The run fails here and later steps do not run. If Add Error Handler is on, only this step fails. The Failure branch runs and the flow continues.',
      variant: MarkdownVariant.INFO,
    }),
    message: Property.LongText({
      displayName: 'Error Message',
      description: "Shown as the step's error. Can include data from earlier steps.",
      placeholder: 'e.g. Order total is missing',
      required: true,
    }),
  },
  async run(context) {
    throw new Error(context.propsValue.message);
  },
});
