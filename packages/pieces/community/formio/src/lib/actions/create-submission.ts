import { createAction } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';
import { createSubmissionOutputSchema } from '../common/output-schemas';

export const createSubmission = createAction({
  auth: formioAuth,
  name: 'create_submission',
  displayName: 'Create Submission',
  description: 'Submit data to a Form.io form',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new submission on a Form.io form, with the field values keyed by the form component keys. Use it to file a record into Form.io from a flow, such as a citizen intake or a case created elsewhere. Requires the form and the submission data; not idempotent, since each call files a separate submission.',
    idempotent: false,
  },
  outputSchema: createSubmissionOutputSchema,
  props: {
    formPath: formioProps.formPath,
    data: formioProps.submissionData,
  },
  async run({ auth, propsValue }) {
    return await formioCommon.createSubmission({
      auth: auth.props,
      formPath: propsValue.formPath,
      data: propsValue.data as Record<string, unknown>,
    });
  },
});
